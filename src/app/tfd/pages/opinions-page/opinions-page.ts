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
import { MatSort, MatSortModule } from '@angular/material/sort';
import { MatTableDataSource, MatTableModule } from '@angular/material/table';
import { MatTabsModule } from '@angular/material/tabs';
import { MatTooltipModule } from '@angular/material/tooltip';
import { NgxMaskDirective, NgxMaskPipe } from 'ngx-mask';

// Core & Shared
import { LoadingComponent } from '../../../core/components/loading-component/loading-component';
import { PatientRequest } from '../../models/patient-request';
import { Permission } from '../../models/permission';
import { OpinionService } from '../../services/opinion-service';

// Components (Dialogs)
import { ProcessPatientRequestToSocialComponent } from '../../components/opinion/process-patient-request-to-social-component/process-patient-request-to-social-component';
import { OpinionsComponent } from '../../components/opinion/opinions-component/opinions-component';
import { UndoPatientRequestComponent } from '../../components/opinion/undo-patient-request-component/undo-patient-request-component';
import { UndoMessageComponent } from '../../components/shared/undo-message-component/undo-message-component';
import { PatientRequestAttachmentsComponent } from '../../components/patient-request/patient-request-attachments-component/patient-request-attachments-component';
import { ArchivePatientRequestComponent } from '../../components/opinion/archive-patient-request-component/archive-patient-request-component';
import { HaltedPatientRequestComponent } from '../../components/opinion/halted-patient-request-component/halted-patient-request-component';
import { ShowPatientRequestComponent } from '../../components/patient-request/show-patient-request-component/show-patient-request-component';
import { MovePatientRequestFromOthersComponent } from '../../components/opinion/move-patient-request-from-others-component/move-patient-request-from-others-component';
import { MovePatientRequestFromProcessesComponent } from '../../components/opinion/move-patient-request-from-processes-component/move-patient-request-from-processes-component';
import { HistoryPatientRequestComponent } from '../../components/opinion/history-patient-request-component/history-patient-request-component';
import { ProcessPatientRequestToCostAssistanceAndTravelComponent } from '../../components/opinion/process-patient-request-to-cost-assistance-and-travel-component/process-patient-request-to-cost-assistance-and-travel-component';

const TFD_OPINIONS_CHANNEL = new BroadcastChannel('tfd-opinions-channel');

@Component({
  selector: 'app-opinions-page',
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
    NgxMaskDirective,
    NgxMaskPipe
  ],
  templateUrl: './opinions-page.html',
  styleUrl: './opinions-page.scss',
  changeDetection: ChangeDetectionStrategy.OnPush // ⚡ Performance máxima com OnPush + Signals
})
export class OpinionsPage implements OnInit, OnDestroy {
  // Injeções de dependência funcionais modernas
  private readonly opinionService = inject(OpinionService);
  private readonly dialog = inject(MatDialog);
  private readonly route = inject(ActivatedRoute);
  private readonly destroyRef = inject(DestroyRef);

  // ViewChild para captura do MatSort do template
  protected readonly sort = viewChild.required(MatSort);

  private loadingDialog!: MatDialogRef<LoadingComponent>;
  private readonly currentUser = this.route.parent?.parent?.snapshot.data['user'];

  // Estado que define o tipo do perfil logado ('medical' | 'social')
  protected readonly profileType = signal<'medical' | 'social'>('medical');

  // Definições de Colunas das Tabelas
  protected readonly displayedOwnerColumns: string[] = ['bookmark', 'patient', 'cns', 'type', 'consultation_date', 'status', 'actions'];
  protected readonly displayedProcessColumns: string[] = ['patient', 'cns', 'type', 'consultation_date', 'responsible', 'actions'];
  protected readonly displayedOthersColumns: string[] = ['patient', 'cns', 'type', 'consultation_date', 'responsible', 'actions'];

  // Signals para armazenamento do estado bruto dividido por abas
  private readonly rawOwnerList = signal<PatientRequest[]>([]);
  private readonly rawProcessList = signal<PatientRequest[]>([]);
  private readonly rawOthersList = signal<PatientRequest[]>([]);

  // Computed signals acoplando ordenação automática e reativa em TODAS as abas
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

    TFD_OPINIONS_CHANNEL.onmessage = (message) => {
      if (message.data === 'update') {
        this.getPatientRequests(false);
      }
    };
  }

  ngOnDestroy(): void {
    TFD_OPINIONS_CHANNEL.close();
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
   * Busca centralizada, mapeamento e separação lógica das requisições com base no perfil
   */
  private getPatientRequests(showLoading = false): void {
    if (showLoading) this.openLoading();

    this.opinionService.getType()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (profileResponse) => {
          const isMedical = profileResponse === 'Médico';
          this.profileType.set(isMedical ? 'medical' : 'social');

          this.opinionService.getPatientRequests()
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
                // Normaliza e nivela as propriedades para as colunas da tabela
                const normalizedRequests = response.map((item: any) => ({
                  ...item,
                  name: item.report?.patient_care?.patient?.name,
                  cns: item.report?.patient_care?.patient?.cns,
                  type: item.type,
                  consultation_date: item.consultation_date,
                  professional: item.social_professional?.name || item.medical_professional?.name
                }));

                // 1. Filtro: Caixa de Entrada (Owner)
                const owners = normalizedRequests.filter((item: any) => 
                  isMedical
                    ? (!item.social_professional || item.back_to_medical) && item.medical
                    : (!item.cost_assistance_professional || item.back_to_social) && item.social && !item.back_to_medical
                );

                // 2. Filtro: Em Processamento (Process)
                const processes = normalizedRequests.filter((item: any) => 
                  isMedical
                    ? (item.social_professional && !item.back_to_medical) && item.medical
                    : (item.cost_assistance_professional && !item.back_to_social) && item.social
                );

                // 3. Filtro: Outros Pareceres (Others)
                const others = normalizedRequests.filter((item: any) => 
                  isMedical
                    ? item.medical_professional && !item.medical
                    : item.social_professional && !item.social
                );

                this.rawOwnerList.set(owners);
                this.rawProcessList.set(processes);
                this.rawOthersList.set(others);
              },
              error: (err) => console.error('Erro ao buscar pareceres:', err)
            });
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
   * Inversão lógica simplificada: Retorna 'true' caso o usuário NÃO possua a permissão
   */
  protected checkPermissions(permissionName: string): boolean {
    if (!this.currentUser?.roles) return true;
    
    const hasPermission = this.currentUser.roles.some((role: any) =>
      role.permissions?.some((perm: Permission) => perm.name === permissionName)
    );
    
    return !hasPermission;
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
    TFD_OPINIONS_CHANNEL.postMessage('update');
  }

  // Métodos de Ação disparados a partir das linhas das tabelas no HTML
  protected showPatientRequest(patientRequest: PatientRequest): void {
    this.openDialog(ShowPatientRequestComponent, { patient_request: patientRequest }, '1000px', 'auto', false);
  }

  protected movePatientRequestFromOthers(patientRequest: PatientRequest): void {
    this.openDialog(MovePatientRequestFromOthersComponent, { patient_request: patientRequest, type: this.profileType() }, '400px');
  }

  protected movePatientRequestFromProcesses(patientRequest: PatientRequest): void {
    this.openDialog(MovePatientRequestFromProcessesComponent, { patient_request: patientRequest, type: this.profileType() }, '400px');
  }

  protected opinions(patientRequest: PatientRequest): void {
    this.openDialog(OpinionsComponent, { patient_request: patientRequest, permissions: this.currentUser?.roles }, '800px', 'auto', false);
  }

  protected history(patientRequest: PatientRequest): void {
    this.openDialog(HistoryPatientRequestComponent, { patient_request: patientRequest, type: this.profileType() }, '800px', 'auto', false);
  }

  protected processPatientRequestToSocial(patientRequest: PatientRequest): void {
    this.openDialog(ProcessPatientRequestToSocialComponent, { patient_request: patientRequest }, '500px');
  }

  protected processPatientRequestToCostAssistanceAndTravel(patientRequest: PatientRequest): void {
    this.openDialog(ProcessPatientRequestToCostAssistanceAndTravelComponent, { patient_request: patientRequest }, '500px');
  }

  protected undoPatientRequest(patientRequest: PatientRequest): void {
    this.openDialog(UndoPatientRequestComponent, { patient_request: patientRequest, type: this.profileType() }, '500px');
  }

  protected haltedPatientRequest(patientRequest: PatientRequest): void {
    this.openDialog(HaltedPatientRequestComponent, { patient_request: patientRequest, type: this.profileType() }, '400px');
  }

  protected archivePatientRequest(patientRequest: PatientRequest): void {
    this.openDialog(ArchivePatientRequestComponent, { patient_request: patientRequest }, '400px');
  }

  protected undoMessage(message: string): void {
    this.openDialog(UndoMessageComponent, { message }, '400px', 'auto', false);
  }

  protected patientRequestAttachments(patientRequest: PatientRequest): void {
    this.openDialog(PatientRequestAttachmentsComponent, { patient_request: patientRequest }, '600px', 'auto', false);
  }
}