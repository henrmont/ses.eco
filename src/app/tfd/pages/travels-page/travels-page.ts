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
import { TravelService } from '../../services/travel-service';

// Modais (Dialogs)
import { ShowPatientRequestComponent } from '../../components/patient-request/show-patient-request-component/show-patient-request-component';
import { UndoMessageComponent } from '../../components/shared/undo-message-component/undo-message-component';
import { HaltedPatientRequestComponent } from '../../components/travel/halted-patient-request-component/halted-patient-request-component';
import { PatientRequestAttachmentsComponent } from '../../components/patient-request/patient-request-attachments-component/patient-request-attachments-component';
import { PatientEscortsComponent } from '../../components/patient/patient-escorts-component/patient-escorts-component';
import { UndoPatientRequestComponent } from '../../components/travel/undo-patient-request-component/undo-patient-request-component';
import { FinishPatientRequestTravelComponent } from '../../components/travel/finish-patient-request-travel-component/finish-patient-request-travel-component';
import { MovePatientRequestFromFinishedComponent } from '../../components/travel/move-patient-request-from-finished-component/move-patient-request-from-finished-component';
import { PatientRequestTravelsComponent } from '../../components/travel/patient-request-travels-component/patient-request-travels-component';

const TFD_TRAVELS_CHANNEL = new BroadcastChannel('tfd-travels-channel');

@Component({
  selector: 'app-travels-page',
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
  templateUrl: './travels-page.html',
  styleUrl: './travels-page.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class TravelsPage implements OnInit, OnDestroy {
  // 🔒 Injeções de dependência modernas
  private readonly travelService = inject(TravelService);
  private readonly dialog = inject(MatDialog);
  private readonly route = inject(ActivatedRoute);
  private readonly destroyRef = inject(DestroyRef);

  // Captura do MatSort do template via Signal reativo
  protected readonly sort = viewChild.required(MatSort);

  private loadingDialog!: MatDialogRef<LoadingComponent>;
  private readonly currentUser = this.route.parent?.parent?.snapshot.data['user'];

  // Definições de colunas das tabelas
  protected readonly displayedOwnerColumns: string[] = ['bookmark', 'patient', 'cns', 'type', 'consultation_date', 'status', 'actions'];
  protected readonly displayedFinishColumns: string[] = ['patient', 'cns', 'type', 'consultation_date', 'responsible', 'actions'];
  protected readonly displayedOthersColumns: string[] = ['patient', 'cns', 'type', 'consultation_date', 'responsible', 'actions'];

  // Signals para armazenamento do estado bruto dos dados divididos por abas
  private readonly rawOwnerList = signal<PatientRequest[]>([]);
  private readonly rawFinishList = signal<PatientRequest[]>([]);
  private readonly rawOthersList = signal<PatientRequest[]>([]);

  // ⚡ Computed signals injetando dados e acoplando ordenação nativa reativa em TODAS as abas
  protected readonly ownerDataSource = computed(() => {
    const dataSource = new MatTableDataSource(this.rawOwnerList());
    dataSource.sort = this.sort();
    return dataSource;
  });

  protected readonly finishDataSource = computed(() => {
    const dataSource = new MatTableDataSource(this.rawFinishList());
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

    TFD_TRAVELS_CHANNEL.onmessage = (message) => {
      if (message.data === 'update') {
        this.fetchPatientRequests(false);
      }
    };
  }

  ngOnDestroy(): void {
    TFD_TRAVELS_CHANNEL.close();
  }

  // Filtros locais e rápidos de busca nas tabelas acessando os computeds
  protected applyOwnerFilter(event: Event): void {
    const filterValue = (event.target as HTMLInputElement).value;
    this.ownerDataSource().filter = filterValue.trim().toLowerCase();
  }

  protected applyFinishFilter(event: Event): void {
    const filterValue = (event.target as HTMLInputElement).value;
    this.finishDataSource().filter = filterValue.trim().toLowerCase();
  }

  protected applyOthersFilter(event: Event): void {
    const filterValue = (event.target as HTMLInputElement).value;
    this.othersDataSource().filter = filterValue.trim().toLowerCase();
  }

  /**
   * Busca centralizada, mapeamento e separação lógica das requisições de passagens
   */
  private fetchPatientRequests(showLoading = false): void {
    if (showLoading) this.openLoading();

    this.travelService.getPatientRequests()
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

          // Nivelamento idêntico ao modelo de referência para busca e exibição facilitada
          const normalizedRequests = rawList.map((item: any) => ({
            ...item,
            name: item.report?.patient_care?.patient?.name || '',
            cns: item.report?.patient_care?.patient?.cns || '',
            type: item.type,
            consultation_date: item.consultation_date,
            status: item.status
          }));

          // Distribuição das fatias de dados conforme as regras de passagens
          const owners = normalizedRequests.filter((req: any) => req.travel_professional && !req.is_travel_finished && req.travel);
          const others = normalizedRequests.filter((req: any) => req.travel_professional && !req.is_travel_finished && !req.travel);
          const finished = normalizedRequests.filter((req: any) => req.travel_professional && req.is_travel_finished && req.travel);

          this.rawOwnerList.set(owners);
          this.rawOthersList.set(others);
          this.rawFinishList.set(finished);
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
    TFD_TRAVELS_CHANNEL.postMessage('update');
  }

  // --- MÉTODOS DE AÇÃO DO TEMPLATE HTML ---

  protected haltedPatientRequest(patient_request: PatientRequest): void {
    this.openDialog(HaltedPatientRequestComponent, { patient_request }, '400px');
  }

  protected patientRequestAttachments(patient_request: PatientRequest): void {
    this.openDialog(PatientRequestAttachmentsComponent, { patient_request }, '600px', 'auto', false);
  }

  protected patientEscorts(patient_request: PatientRequest): void {
    this.openDialog(PatientEscortsComponent, {
      patient_care: patient_request.report?.patient_care,
      patient_request: patient_request,
      permissions: this.currentUser?.roles
    }, '1200px', 'auto', false);
  }

  protected undoPatientRequest(patient_request: PatientRequest): void {
    this.openDialog(UndoPatientRequestComponent, { patient_request }, '500px');
  }

  protected finishPatientRequestTravel(patient_request: PatientRequest): void {
    this.openDialog(FinishPatientRequestTravelComponent, { patient_request }, '400px');
  }

  protected movePatientRequestFromFinished(patient_request: PatientRequest): void {
    this.openDialog(MovePatientRequestFromFinishedComponent, { patient_request }, '400px');
  }

  protected patientRequestTravels(patient_request: PatientRequest): void {
    this.openDialog(PatientRequestTravelsComponent, { patient_request }, '1000px');
  }

  protected showPatientRequest(patient_request: PatientRequest): void {
    this.openDialog(ShowPatientRequestComponent, { patient_request }, '1000px', 'auto', false);
  }

  protected undoMessage(message: string): void {
    this.openDialog(UndoMessageComponent, { message }, '400px', 'auto', false);
  }
}