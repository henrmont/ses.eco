import { ChangeDetectionStrategy, Component, DestroyRef, OnDestroy, OnInit, computed, inject, signal, viewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute } from '@angular/router';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { finalize } from 'rxjs';
import { Overlay } from '@angular/cdk/overlay';

// Angular Material
import { MatButtonModule } from '@angular/material/button';
import { MatDialog, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatSort, MatSortModule } from '@angular/material/sort';
import { MatPaginator, MatPaginatorModule } from '@angular/material/paginator';
import { MatTableDataSource, MatTableModule } from '@angular/material/table';
import { MatTabsModule } from '@angular/material/tabs';
import { MatTooltipModule } from '@angular/material/tooltip';
import { NgxMaskPipe } from 'ngx-mask';

// Core, Modelos e Serviços
import { LoadingComponent } from '../../../core/components/loading-component/loading-component';
import { PatientRequest } from '../../models/patient-request';
import { Permission } from '../../models/permission';
import { Role } from '../../models/role';
import { CostAssistanceService } from '../../services/cost-assistance-service';

// Modais (Dialogs)
import { HaltedPatientRequestComponent } from '../../components/cost-assistance/halted-patient-request-component/halted-patient-request-component';
import { ShowPatientRequestComponent } from '../../components/patient-request/show-patient-request-component/show-patient-request-component';
import { PatientRequestAttachmentsComponent } from '../../components/patient-request/patient-request-attachments-component/patient-request-attachments-component';
import { PatientRequestCostAssistancesComponent } from '../../components/cost-assistance/patient-request-cost-assistances-component/patient-request-cost-assistances-component';
import { HistoryPatientRequestComponent } from '../../components/cost-assistance/history-patient-request-component/history-patient-request-component';
import { MovePatientRequestFromProcessesComponent } from '../../components/cost-assistance/move-patient-request-from-processes-component/move-patient-request-from-processes-component';
import { MovePatientRequestFromOthersComponent } from '../../components/cost-assistance/move-patient-request-from-others-component/move-patient-request-from-others-component';
import { UndoPatientRequestComponent } from '../../components/cost-assistance/undo-patient-request-component/undo-patient-request-component';
import { ProcessPatientRequestToPaymentComponent } from '../../components/cost-assistance/process-patient-request-to-payment-component/process-patient-request-to-payment-component';
import { FinishBackPatientRequestComponent } from '../../components/cost-assistance/finish-back-patient-request-component/finish-back-patient-request-component';

const TFD_COST_ASSISTANCES_CHANNEL = new BroadcastChannel('tfd-cost-assistances-channel');

@Component({
  selector: 'app-cost-assistances-page',
  standalone: true,
  imports: [
    CommonModule,
    MatFormFieldModule,
    MatInputModule,
    MatTableModule,
    MatButtonModule,
    MatIconModule,
    MatTooltipModule,
    MatSortModule,
    MatPaginatorModule,
    MatTabsModule,
    MatDialogModule,
    NgxMaskPipe
  ],
  templateUrl: './cost-assistances-page.html',
  styleUrl: './cost-assistances-page.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class CostAssistancesPage implements OnInit, OnDestroy {
  // Injeções de Dependência Dinâmicas
  private readonly costAssistanceService = inject(CostAssistanceService);
  private readonly dialog = inject(MatDialog);
  private readonly overlay = inject(Overlay);
  private readonly route = inject(ActivatedRoute);
  private readonly destroyRef = inject(DestroyRef);

  private loadingDialog?: MatDialogRef<LoadingComponent>;
  private readonly currentUser = this.route.parent?.parent?.snapshot.data['user'];

  // Capturas nomeadas e isoladas de cada MatSort no template HTML
  private readonly ownerSort = viewChild<MatSort>('ownerSort');
  private readonly processSort = viewChild<MatSort>('processSort');
  private readonly othersSort = viewChild<MatSort>('othersSort');

  // Capturas nomeadas e isoladas dos paginadores do template HTML
  private readonly ownerPaginator = viewChild<MatPaginator>('ownerPaginator');
  private readonly processPaginator = viewChild<MatPaginator>('processPaginator');
  private readonly othersPaginator = viewChild<MatPaginator>('othersPaginator');

  // Definições de Estrutura de Colunas expostas ao Template
  protected readonly displayedOwnerColumns: string[] = ['bookmark', 'patient', 'cns', 'type', 'consultation_date', 'status', 'actions'];
  protected readonly displayedProcessColumns: string[] = ['patient', 'cns', 'type', 'consultation_date', 'responsible', 'actions'];
  protected readonly displayedOthersColumns: string[] = ['patient', 'cns', 'type', 'consultation_date', 'responsible', 'actions'];

  // Signals internos para gerenciamento do estado bruto
  private readonly rawOwnerList = signal<any[]>([]);
  private readonly rawProcessList = signal<any[]>([]);
  private readonly rawOthersList = signal<any[]>([]);

  // Computed signals criando os DataSources e acoplando o Sort/Paginator de forma reativa
  protected readonly ownerDataSource = computed(() => {
    const dataSource = new MatTableDataSource(this.rawOwnerList());
    const sortRef = this.ownerSort();
    const paginatorRef = this.ownerPaginator();

    if (sortRef) dataSource.sort = sortRef;
    if (paginatorRef) dataSource.paginator = paginatorRef;

    return dataSource;
  });

  protected readonly processDataSource = computed(() => {
    const dataSource = new MatTableDataSource(this.rawProcessList());
    const sortRef = this.processSort();
    const paginatorRef = this.processPaginator();

    if (sortRef) dataSource.sort = sortRef;
    if (paginatorRef) dataSource.paginator = paginatorRef;

    return dataSource;
  });

  protected readonly othersDataSource = computed(() => {
    const dataSource = new MatTableDataSource(this.rawOthersList());
    const sortRef = this.othersSort();
    const paginatorRef = this.othersPaginator();

    if (sortRef) dataSource.sort = sortRef;
    if (paginatorRef) dataSource.paginator = paginatorRef;

    return dataSource;
  });

  ngOnInit(): void {
    this.fetchPatientRequests(true);

    TFD_COST_ASSISTANCES_CHANNEL.onmessage = (message) => {
      if (message.data === 'update') {
        this.fetchPatientRequests(false);
      }
    };
  }

  ngOnDestroy(): void {
    TFD_COST_ASSISTANCES_CHANNEL.close();
  }

  // Métodos de Filtragem expostos para as tabelas
  protected applyOwnerFilter(event: Event): void {
    const filterValue = (event.target as HTMLInputElement).value;
    const dataSource = this.ownerDataSource();
    dataSource.filter = filterValue.trim().toLowerCase();
    if (dataSource.paginator) {
      dataSource.paginator.firstPage();
    }
  }

  protected applyProcessFilter(event: Event): void {
    const filterValue = (event.target as HTMLInputElement).value;
    const dataSource = this.processDataSource();
    dataSource.filter = filterValue.trim().toLowerCase();
    if (dataSource.paginator) {
      dataSource.paginator.firstPage();
    }
  }

  protected applyOthersFilter(event: Event): void {
    const filterValue = (event.target as HTMLInputElement).value;
    const dataSource = this.othersDataSource();
    dataSource.filter = filterValue.trim().toLowerCase();
    if (dataSource.paginator) {
      dataSource.paginator.firstPage();
    }
  }

  /**
   * Obtém a listagem atualizada de solicitações de ajuda de custo e executa a
   * separação reativa entre Titulares, Em Processamento e Outros.
   */
  private fetchPatientRequests(showLoading = false): void {
    if (showLoading) this.openLoading();

    this.costAssistanceService.getPatientRequests()
      .pipe(
        finalize(() => {
          if (showLoading && this.loadingDialog) {
            this.loadingDialog.close();
          }
        }),
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe({
        next: (response) => {
          const rawData = response || [];

          const normalizedRequests = rawData.map((item: any) => ({
            ...item,
            name: item.report?.patient_care?.patient?.name || '',
            cns: item.report?.patient_care?.patient?.cns || '',
            type: item.type,
            consultation_date: item.consultation_date,
            status: item.status
          }));

          const owners = normalizedRequests.filter((req: any) => (!req.payment_professional || req.back_to_cost_assistance) && req.cost_assistance);
          const processes = normalizedRequests.filter((req: any) => req.payment_professional && req.cost_assistance && !req.back_to_cost_assistance);
          const others = normalizedRequests.filter((req: any) => !req.cost_assistance);

          this.rawOwnerList.set(owners);
          this.rawProcessList.set(processes);
          this.rawOthersList.set(others);
        },
        error: () => {
          this.rawOwnerList.set([]);
          this.rawProcessList.set([]);
          this.rawOthersList.set([]);
        }
      });
  }

  private openLoading(): void {
    this.loadingDialog = this.dialog.open(LoadingComponent, {
      height: '200px',
      disableClose: true,
      autoFocus: false,
    });
  }

  /**
   * Avalia as regras de acesso cedidas no Route Resolver.
   * Retorna 'true' (desabilita) se o usuário NÃO possuir a permissão informada.
   */
  protected checkPermissions(permissionName: string): boolean {
    if (!this.currentUser?.roles) return true;

    const hasPermission = this.currentUser.roles.some((role: Role) =>
      role.permissions?.some((perm: Permission) => perm.name === permissionName)
    );

    return !hasPermission;
  }

  protected checkStatus(patientRequest: PatientRequest): boolean {
    return !!(patientRequest.medical_status && patientRequest.social_status);
  }

  /**
   * Centralizador genérico para abertura de modais com recarga automatizada de dados.
   */
  private openDialog(component: any, data: any, width = '400px', height = 'auto', requiresRefresh = true): void {
    this.dialog.open(component, {
      width,
      height,
      disableClose: true,
      autoFocus: false,
      scrollStrategy: this.overlay.scrollStrategies.noop(),
      data
    }).afterClosed()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(result => {
        if (result && requiresRefresh) {
          this.handleRequestsChange();
        }
      });
  }

  private handleRequestsChange(): void {
    this.fetchPatientRequests(false);
    TFD_COST_ASSISTANCES_CHANNEL.postMessage('update');
  }

  // --- MÉTODOS DE AÇÃO DO TEMPLATE (PROTECTED) ---

  protected haltedPatientRequest(patientRequest: PatientRequest): void {
    this.openDialog(HaltedPatientRequestComponent, { patient_request: patientRequest }, '400px');
  }

  protected patientRequestAttachments(patientRequest: PatientRequest): void {
    this.openDialog(PatientRequestAttachmentsComponent, { patient_request: patientRequest }, '600px');
  }

  protected costAssistances(patientRequest: PatientRequest): void {
    this.openDialog(PatientRequestCostAssistancesComponent, {
      patient_request: patientRequest,
      permissions: this.currentUser?.roles
    }, '1200px', 'auto');
  }

  protected history(patientRequest: PatientRequest): void {
    this.openDialog(HistoryPatientRequestComponent, { patient_request: patientRequest }, '1000px', 'auto', false);
  }

  protected undoPatientRequest(patientRequest: PatientRequest): void {
    this.openDialog(UndoPatientRequestComponent, { patient_request: patientRequest }, '500px');
  }

  protected processPatientRequest(patientRequest: PatientRequest): void {
    this.openDialog(ProcessPatientRequestToPaymentComponent, { patient_request: patientRequest }, '800px', '650px');
  }

  protected movePatientRequestFromProcesses(patientRequest: PatientRequest): void {
    this.openDialog(MovePatientRequestFromProcessesComponent, { patient_request: patientRequest }, '400px');
  }

  protected movePatientRequestFromOthers(patientRequest: PatientRequest): void {
    this.openDialog(MovePatientRequestFromOthersComponent, { patient_request: patientRequest }, '400px');
  }

  protected showPatientRequest(patientRequest: PatientRequest): void {
    this.openDialog(ShowPatientRequestComponent, { patient_request: patientRequest }, '1000px', 'auto', false);
  }

  protected finishBackPatientRequest(patientRequest: PatientRequest): void {
    this.openDialog(FinishBackPatientRequestComponent, { patient_request: patientRequest }, '400px');
  }
}