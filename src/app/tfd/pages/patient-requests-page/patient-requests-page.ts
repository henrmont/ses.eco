import { ChangeDetectionStrategy, Component, DestroyRef, OnDestroy, OnInit, computed, inject, signal, viewChild } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ActivatedRoute } from '@angular/router';
import { finalize } from 'rxjs';
import { CommonModule } from '@angular/common'; // 👈 Adicione este import no topo

// Angular Material
import { MatButtonModule } from '@angular/material/button';
import { MatDialog, MatDialogRef } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatSort, MatSortModule } from '@angular/material/sort';
import { MatTableDataSource, MatTableModule } from '@angular/material/table';
import { MatTabsModule } from '@angular/material/tabs';
import { MatTooltipModule } from '@angular/material/tooltip';
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
    MatSortModule,
    MatTabsModule,
    NgxMaskPipe
  ],
  templateUrl: './patient-requests-page.html',
  styleUrl: './patient-requests-page.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class PatientRequestsPage implements OnInit, OnDestroy {
  // Injeções de dependência modernas
  private readonly patientRequestService = inject(PatientRequestService);
  private readonly dialog = inject(MatDialog);
  private readonly route = inject(ActivatedRoute);
  private readonly destroyRef = inject(DestroyRef);

  // ViewChild para captura do MatSort do template (compartilhado ou gerenciado pelo layout)
  protected readonly sort = viewChild.required(MatSort);

  private loadingDialog!: MatDialogRef<LoadingComponent>;
  private readonly currentUser = this.route.parent?.parent?.snapshot.data['user'];

  // Definições de Colunas das Tabelas
  protected readonly displayedOwnerColumns: string[] = ['bookmark', 'patient', 'cns', 'type', 'consultation_date', 'status', 'actions'];
  protected readonly displayedProcessColumns: string[] = ['patient', 'cns', 'type', 'consultation_date', 'responsible', 'actions'];
  protected readonly displayedOthersColumns: string[] = ['patient', 'cns', 'type', 'consultation_date', 'responsible', 'actions'];

  // Signals para armazenamento do estado bruto dos dados divididos por abas
  private readonly rawOwnerList = signal<PatientRequest[]>([]);
  private readonly rawProcessList = signal<PatientRequest[]>([]);
  private readonly rawOthersList = signal<PatientRequest[]>([]);

  // Computed signals injetando dados e acoplando ordenação nativa reativa em TODAS as abas
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

  // Filtros locais e rápidos de busca nas tabelas
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
   * Busca centralizada, mapeamento e separação lógica das requisições
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
          // Mapeia os dados comuns injetando as propriedades niveladas para exibição simplificada na tabela
          const normalizedRequests = response.map((item: any) => ({
            ...item,
            name: item.report?.patient_care?.patient?.name,
            cns: item.report?.patient_care?.patient?.cns,
            type: item.type,
            consultation_date: item.consultation_date,
            status: item.status,
          }));

          // 1. Filtro: Titular (Owner)
          const owners = normalizedRequests.filter((req: any) => 
            (!req.medical_professional || req.back_to_owner) && req.owner
          );

          // 2. Filtro: Vinculado a outros (Others)
          const others = normalizedRequests.filter((req: any) => !req.owner);

          // 3. Filtro: Em processamento profissional (Process)
          const processes = normalizedRequests.filter((req: any) => 
            req.medical_professional && req.owner && !req.back_to_owner
          );

          this.rawOwnerList.set(owners);
          this.rawOthersList.set(others);
          this.rawProcessList.set(processes);
        },
        error: (err) => console.error('Erro ao buscar solicitações de pacientes:', err)
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
   * Inversão lógica simplificada: Retorna 'true' caso o usuário NÃO possua a permissão
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
   * Método privado e unificado para gerenciamento reativo do ciclo de modais interativas
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
    this.getPatientRequests(false);
    TFD_PATIENT_REQUESTS_CHANNEL.postMessage('update');
  }

  // Métodos de Ação disparados a partir das linhas das tabelas no HTML
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
    this.openDialog(ProcessPatientRequestComponent, { patient_request: patientRequest }, '500px');
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