import { ChangeDetectionStrategy, Component, DestroyRef, OnDestroy, OnInit, computed, inject, signal, viewChild } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ActivatedRoute } from '@angular/router';
import { finalize } from 'rxjs';
import { CommonModule } from '@angular/common';

// Angular Material
import { MatButtonModule } from '@angular/material/button';
import { MatDialog, MatDialogRef } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatTableDataSource, MatTableModule } from '@angular/material/table';
import { MatTabsModule } from '@angular/material/tabs';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatSort, MatSortModule } from '@angular/material/sort';
import { MatPaginator, MatPaginatorModule } from '@angular/material/paginator'; // ➕ Importação do Paginator
import { NgxMaskPipe } from 'ngx-mask';

// Core & Shared
import { LoadingComponent } from '../../../core/components/loading-component/loading-component';
import { PatientRequest } from '../../models/patient-request';
import { Permission } from '../../models/permission';
import { PatientRequestService } from '../../services/patient-request-service';

// Components (Dialogs)
import { DeletePatientRequestComponent } from '../../components/patient-request/delete-patient-request-component/delete-patient-request-component';
import { HaltedPatientRequestComponent } from '../../components/patient-request/halted-patient-request-component/halted-patient-request-component';
import { MovePatientRequestFromOthersComponent } from '../../components/patient-request/move-patient-request-from-others-component/move-patient-request-from-others-component';
import { MovePatientRequestFromProcessesComponent } from '../../components/patient-request/move-patient-request-from-processes-component/move-patient-request-from-processes-component';
import { PatientRequestAttachmentsComponent } from '../../components/patient-request/patient-request-attachments-component/patient-request-attachments-component';
import { ProcessPatientRequestComponent } from '../../components/patient-request/process-patient-request-component/process-patient-request-component';
import { ShowPatientRequestComponent } from '../../components/patient-request/show-patient-request-component/show-patient-request-component';
import { UpdatePatientRequestComponent } from '../../components/patient-request/update-patient-request-component/update-patient-request-component';
import { UndoMessageComponent } from '../../components/shared/undo-message-component/undo-message-component';
import { Overlay } from '@angular/cdk/overlay';

const TFD_PATIENT_REQUESTS_CHANNEL = new BroadcastChannel('tfd-patient-requests-channel');

@Component({
  selector: 'app-patient-requests-page',
  standalone: true,
  imports: [
    CommonModule,
    MatFormFieldModule,
    MatInputModule,
    MatTableModule,
    MatButtonModule,
    MatIconModule,
    MatTooltipModule,
    MatTabsModule,
    MatSortModule,
    MatPaginatorModule, // ➕ Adicionado aos imports
    NgxMaskPipe
  ],
  templateUrl: './patient-requests-page.html',
  styleUrl: './patient-requests-page.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class PatientRequestsPage implements OnInit, OnDestroy {
  // Injeções de Dependência Dinâmicas
  private readonly patientRequestService = inject(PatientRequestService);
  private readonly dialog = inject(MatDialog);
  private readonly overlay = inject(Overlay);
  private readonly route = inject(ActivatedRoute);
  private readonly destroyRef = inject(DestroyRef);

  private loadingDialog!: MatDialogRef<LoadingComponent>;
  private readonly currentUser = this.route.parent?.parent?.snapshot.data['user'];

  // 1. Capturas nomeadas e isoladas de cada matSort no template HTML
  private readonly ownerSort = viewChild<MatSort>('ownerSort');
  private readonly processSort = viewChild<MatSort>('processSort');
  private readonly othersSort = viewChild<MatSort>('othersSort');

  // ➕ 2. Capturas nomeadas e isoladas dos paginadores do template HTML
  private readonly ownerPaginator = viewChild<MatPaginator>('ownerPaginator');
  private readonly processPaginator = viewChild<MatPaginator>('processPaginator');
  private readonly othersPaginator = viewChild<MatPaginator>('othersPaginator');

  // Definições de Estrutura de Colunas expostas ao Template
  protected readonly displayedOwnerColumns: string[] = ['bookmark', 'name', 'cns', 'type', 'consultation_date', 'status', 'actions'];
  protected readonly displayedProcessColumns: string[] = ['name', 'cns', 'type', 'consultation_date', 'responsible', 'actions'];
  protected readonly displayedOthersColumns: string[] = ['name', 'cns', 'type', 'consultation_date', 'responsible', 'actions'];

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
    if (paginatorRef) dataSource.paginator = paginatorRef; // ➕ Acoplamento

    return dataSource;
  });

  protected readonly processDataSource = computed(() => {
    const dataSource = new MatTableDataSource(this.rawProcessList());
    const sortRef = this.processSort();
    const paginatorRef = this.processPaginator();

    if (sortRef) dataSource.sort = sortRef;
    if (paginatorRef) dataSource.paginator = paginatorRef; // ➕ Acoplamento

    return dataSource;
  });

  protected readonly othersDataSource = computed(() => {
    const dataSource = new MatTableDataSource(this.rawOthersList());
    const sortRef = this.othersSort();
    const paginatorRef = this.othersPaginator();

    if (sortRef) dataSource.sort = sortRef;
    if (paginatorRef) dataSource.paginator = paginatorRef; // ➕ Acoplamento

    return dataSource;
  });

  ngOnInit(): void {
    this.getPatientRequests(true);

    TFD_PATIENT_REQUESTS_CHANNEL.onmessage = (message) => {
      if (message.data === 'update') {
        this.getPatientRequests(false);
      }
    };
  }

  ngOnDestroy(): void {
    TFD_PATIENT_REQUESTS_CHANNEL.close();
  }

  // Métodos de Filtragem expostos para as tabelas
  protected applyOwnerFilter(event: Event): void {
    const filterValue = (event.target as HTMLInputElement).value;
    const dataSource = this.ownerDataSource();
    dataSource.filter = filterValue.trim().toLowerCase();
    if (dataSource.paginator) {
      dataSource.paginator.firstPage(); // Reseta para a primeira página após o filtro
    }
  }

  protected applyProcessFilter(event: Event): void {
    const filterValue = (event.target as HTMLInputElement).value;
    const dataSource = this.processDataSource();
    dataSource.filter = filterValue.trim().toLowerCase();
    if (dataSource.paginator) {
      dataSource.paginator.firstPage(); // Reseta para a primeira página após o filtro
    }
  }

  protected applyOthersFilter(event: Event): void {
    const filterValue = (event.target as HTMLInputElement).value;
    const dataSource = this.othersDataSource();
    dataSource.filter = filterValue.trim().toLowerCase();
    if (dataSource.paginator) {
      dataSource.paginator.firstPage(); // Reseta para a primeira página após o filtro
    }
  }

  /**
   * Obtém a listagem atualizada de solicitações e executa a separação reativa
   * entre Titulares (Owners), Em Processamento (Processes) e Outros (Others).
   */
  private getPatientRequests(showLoading = false): void {
    if (showLoading) this.openLoading();

    this.patientRequestService.getPatientRequests()
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

          // Filtra e mapeia as solicitações Titulares (Owner)
          const owners = rawData
            .filter((item: any) => (!item.medical_professional || item.back_to_owner) && item.owner)
            .map((item: any) => ({
              ...item,
              name: item.report?.patient_care?.patient?.name,
              cns: item.report?.patient_care?.patient?.cns,
              type: item.type,
              consultation_date: item.consultation_date,
              status: item.status,
            }));

          // Filtra e mapeia as solicitações vinculadas a Outros Profissionais (Others)
          const others = rawData
            .filter((item: any) => !item.owner)
            .map((item: any) => ({
              ...item,
              name: item.report?.patient_care?.patient?.name,
              cns: item.report?.patient_care?.patient?.cns,
              type: item.type,
              consultation_date: item.consultation_date,
              status: item.status,
            }));

          // Filtra e mapeia as solicitações Em Processamento (Process)
          const processes = rawData
            .filter((item: any) => item.medical_professional && item.owner && !item.back_to_owner)
            .map((item: any) => ({
              ...item,
              name: item.report?.patient_care?.patient?.name,
              cns: item.report?.patient_care?.patient?.cns,
              type: item.type,
              consultation_date: item.consultation_date,
              status: item.status,
            }));

          this.rawOwnerList.set(owners);
          this.rawOthersList.set(others);
          this.rawProcessList.set(processes);
        },
        error: () => {
          this.rawOwnerList.set([]);
          this.rawOthersList.set([]);
          this.rawProcessList.set([]);
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

    const hasPermission = this.currentUser.roles.some((role: any) => 
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
  private openDialog(component: any, data: any, width = '1200px', height = 'auto', requiresRefresh = true): void {
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
    this.getPatientRequests(false);
    TFD_PATIENT_REQUESTS_CHANNEL.postMessage('update');
  }

  // --- MÉTODOS DE AÇÃO DO TEMPLATE (PROTECTED) ---

  protected haltedPatientRequest(patientRequest: PatientRequest): void {
    this.openDialog(HaltedPatientRequestComponent, { patient_request: patientRequest }, '400px');
  }

  protected updatePatientRequest(patientRequest: PatientRequest): void {
    this.openDialog(UpdatePatientRequestComponent, { patient_request: patientRequest }, '800px');
  }

  protected deletePatientRequest(patientRequest: PatientRequest): void {
    this.openDialog(DeletePatientRequestComponent, { patient_request: patientRequest }, '400px');
  }

  protected processPatientRequest(patientRequest: PatientRequest): void {
    this.openDialog(ProcessPatientRequestComponent, { patient_request: patientRequest }, '400px');
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

  protected patientRequestAttachments(patientRequest: PatientRequest): void {
    this.openDialog(PatientRequestAttachmentsComponent, { patient_request: patientRequest }, '600px', 'auto', false);
  }

  protected undoMessage(message: string): void {
    this.openDialog(UndoMessageComponent, { message }, '400px', 'auto', false);
  }
}