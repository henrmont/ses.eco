import { ChangeDetectionStrategy, Component, DestroyRef, OnDestroy, OnInit, computed, inject, signal, viewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute } from '@angular/router';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { finalize } from 'rxjs';

// Angular Material
import { MatButtonModule } from '@angular/material/button';
import { MatDialog, MatDialogRef, MatDialogModule } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatSort, MatSortModule } from '@angular/material/sort';
import { MatTableDataSource, MatTableModule } from '@angular/material/table';
import { MatTabsModule } from '@angular/material/tabs';
import { MatTooltipModule } from '@angular/material/tooltip';
import { NgxMaskPipe } from 'ngx-mask';

// Core, Modelos e Serviços
import { LoadingComponent } from '../../../core/components/loading-component/loading-component';
import { PatientRequest } from '../../models/patient-request';
import { Permission } from '../../models/permission';
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
import { UndoMessageComponent } from '../../components/shared/undo-message-component/undo-message-component';
import { ProcessPatientRequestToPaymentComponent } from '../../components/cost-assistance/process-patient-request-to-payment-component/process-patient-request-to-payment-component';

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
    MatTabsModule,
    MatDialogModule,
    NgxMaskPipe
  ],
  templateUrl: './cost-assistances-page.html',
  styleUrl: './cost-assistances-page.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class CostAssistancesPage implements OnInit, OnDestroy {
  // 🔒 Injeções de dependência modernas via inject()
  private readonly costAssistanceService = inject(CostAssistanceService);
  private readonly dialog = inject(MatDialog);
  private readonly route = inject(ActivatedRoute);
  private readonly destroyRef = inject(DestroyRef);

  // Captura do MatSort do template via Signal reativo
  protected readonly sort = viewChild.required(MatSort);

  private loadingDialog!: MatDialogRef<LoadingComponent>;
  private readonly currentUser = this.route.parent?.parent?.snapshot.data['user'];

  // Definições de colunas das tabelas baseadas nas abas de Ajuda de Custo
  protected readonly displayedOwnerColumns: string[] = ['bookmark', 'patient', 'cns', 'type', 'consultation_date', 'status', 'actions'];
  protected readonly displayedProcessColumns: string[] = ['patient', 'cns', 'type', 'consultation_date', 'responsible', 'actions'];
  protected readonly displayedOthersColumns: string[] = ['patient', 'cns', 'type', 'consultation_date', 'responsible', 'actions'];

  // Signals para armazenamento do estado bruto dos dados
  private readonly rawOwnerList = signal<PatientRequest[]>([]);
  private readonly rawProcessList = signal<PatientRequest[]>([]);
  private readonly rawOthersList = signal<PatientRequest[]>([]);

  // ⚡ Computed signals injetando dados e acoplando ordenação nativa reativa em TODAS as abas
  protected readonly ownerDataSource = computed(() => {
    const dataSource = new MatTableDataSource(this.rawOwnerList());
    dataSource.sort = this.sort();
    return dataSource;
  });

  protected readonly processDataSource = computed(() => {
    const dataSource = new MatTableDataSource(this.rawProcessList());
    dataSource.sort = this.sort();
    return dataSource;
  });

  protected readonly othersDataSource = computed(() => {
    const dataSource = new MatTableDataSource(this.rawOthersList());
    dataSource.sort = this.sort();
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

  // Filtros locais e rápidos de busca nas tabelas acessando os computeds
  protected applyOwnerFilter(event: Event): void {
    const filterValue = (event.target as HTMLInputElement).value;
    this.ownerDataSource().filter = filterValue.trim().toLowerCase();
  }

  protected applyProcessFilter(event: Event): void {
    const filterValue = (event.target as HTMLInputElement).value;
    this.processDataSource().filter = filterValue.trim().toLowerCase();
  }

  protected applyOthersFilter(event: Event): void {
    const filterValue = (event.target as HTMLInputElement).value;
    this.othersDataSource().filter = filterValue.trim().toLowerCase();
  }

  /**
   * Busca centralizada, mapeamento e separação lógica das requisições de ajuda de custo
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
          const rawList = response || [];

          // Nivelamento estrutural igual ao modelo para exibição facilitada
          const normalizedRequests = rawList.map((item: any) => ({
            ...item,
            name: item.report?.patient_care?.patient?.name || '',
            cns: item.report?.patient_care?.patient?.cns || '',
            type: item.type,
            consultation_date: item.consultation_date,
            status: item.status
          }));

          // Distribuição exata seguindo as regras de negócio de ajuda de custo
          const owners = normalizedRequests.filter((req: any) => (!req.payment_professional || req.back_to_cost_assistance) && req.cost_assistance);
          const processes = normalizedRequests.filter((req: any) => req.payment_professional && req.cost_assistance && !req.back_to_cost_assistance);
          const others = normalizedRequests.filter((req: any) => !req.cost_assistance);

          this.rawOwnerList.set(owners);
          this.rawProcessList.set(processes);
          this.rawOthersList.set(others);
        },
        error: () => {}
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
   * Inversão lógica estável: Retorna 'true' caso o usuário NÃO possua a permissão requerida
   */
  protected checkPermissions(permissionName: string): boolean {
    if (!this.currentUser?.roles) return true;

    const hasPermission = this.currentUser.roles.some((role: any) =>
      role.permissions?.some((perm: Permission) => perm.name === permissionName)
    );

    return !hasPermission;
  }

  protected checkStatus(patient_request: PatientRequest): boolean {
    return !!(patient_request.medical_status && patient_request.social_status);
  }

  /**
   * Método privado e único para abertura e monitoramento do retorno de modais interativas
   */
  private openDialog(component: any, data: any, width = '400px', height = 'auto', requiresRefresh = true): void {
    this.dialog.open(component, {
      width,
      height,
      disableClose: true,
      autoFocus: false,
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

  // --- MÉTODOS DE AÇÃO DO TEMPLATE HTML ---

  protected haltedPatientRequest(patient_request: PatientRequest): void {
    this.openDialog(HaltedPatientRequestComponent, { patient_request }, '400px');
  }

  protected patientRequestAttachments(patient_request: PatientRequest): void {
    this.openDialog(PatientRequestAttachmentsComponent, { patient_request }, '600px', 'auto', false);
  }

  protected costAssistances(patient_request: PatientRequest): void {
    this.openDialog(PatientRequestCostAssistancesComponent, {
      patient_request,
      permissions: this.currentUser?.roles
    }, '1200px', 'auto');
  }

  protected history(patient_request: PatientRequest): void {
    this.openDialog(HistoryPatientRequestComponent, { patient_request }, '1000px', 'auto', false);
  }

  protected undoPatientRequest(patient_request: PatientRequest): void {
    this.openDialog(UndoPatientRequestComponent, { patient_request }, '500px');
  }

  protected processPatientRequest(patient_request: PatientRequest): void {
    this.openDialog(ProcessPatientRequestToPaymentComponent, { patient_request }, '500px');
  }

  protected movePatientRequestFromProcesses(patient_request: PatientRequest): void {
    this.openDialog(MovePatientRequestFromProcessesComponent, { patient_request }, '400px');
  }

  protected movePatientRequestFromOthers(patient_request: PatientRequest): void {
    this.openDialog(MovePatientRequestFromOthersComponent, { patient_request }, '400px');
  }

  protected showPatientRequest(patient_request: PatientRequest): void {
    this.openDialog(ShowPatientRequestComponent, { patient_request }, '1000px', 'auto', false);
  }

  protected undoMessage(message: string): void {
    this.openDialog(UndoMessageComponent, { message }, '400px', 'auto', false);
  }
}