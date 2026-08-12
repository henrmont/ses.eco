import { ChangeDetectionStrategy, Component, DestroyRef, OnInit, computed, inject, signal, viewChild } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ActivatedRoute } from '@angular/router';
import { finalize } from 'rxjs';
import { CommonModule } from '@angular/common';

// Angular Material
import { MatButtonModule } from '@angular/material/button';
import { MatDialog, MatDialogRef, MatDialogModule } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatSort, MatSortModule } from '@angular/material/sort';
import { MatPaginator, MatPaginatorModule } from '@angular/material/paginator';
import { MatTableDataSource, MatTableModule } from '@angular/material/table';
import { MatTabsModule } from '@angular/material/tabs';
import { MatTooltipModule } from '@angular/material/tooltip';
import { Overlay } from '@angular/cdk/overlay';
import { NgxMaskPipe } from 'ngx-mask';

// Core & Shared
import { LoadingComponent } from '../../../core/components/loading-component/loading-component';
import { PatientRequest } from '../../models/patient-request';
import { Permission } from '../../models/permission.model';
import { TravelService } from '../../services/travel-service';

// Modais (Dialogs)
import { ShowPatientRequestComponent } from '../../components/patient-request/show-patient-request-component/show-patient-request-component';
import { UndoMessageComponent } from '../../components/shared/undo-message-component/undo-message-component';
import { HaltedPatientRequestComponent } from '../../components/travel/halted-patient-request-component/halted-patient-request-component';
import { PatientRequestAttachmentsComponent } from '../../components/patient-request/patient-request-attachments-component/patient-request-attachments-component';
import { PatientEscortsComponent } from '../../components/patient/patient-escorts/patient-escorts.component';
import { UndoPatientRequestComponent } from '../../components/travel/undo-patient-request-component/undo-patient-request-component';
import { PatientRequestTravelsComponent } from '../../components/travel/patient-request-travels-component/patient-request-travels-component';
import { ArchivePatientRequestComponent } from '../../components/travel/archive-patient-request-component/archive-patient-request-component';
import { FinishBackPatientRequestComponent } from '../../components/travel/finish-back-patient-request-component/finish-back-patient-request-component';

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
    MatPaginatorModule,
    MatTabsModule,
    MatDialogModule,
    NgxMaskPipe
  ],
  templateUrl: './travels-page.html',
  styleUrl: './travels-page.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class TravelsPage implements OnInit {
  // Injeções de Dependência Dinâmicas
  private readonly travelService = inject(TravelService);
  private readonly dialog = inject(MatDialog);
  private readonly overlay = inject(Overlay);
  private readonly route = inject(ActivatedRoute);
  private readonly destroyRef = inject(DestroyRef);

  private loadingDialog!: MatDialogRef<LoadingComponent>;
  private readonly currentUser = this.route.parent?.parent?.snapshot.data['user'];

  // 1. Capturas reativas do Sort do Template HTML
  private readonly ownerSort = viewChild<MatSort>('ownerSort');
  private readonly othersSort = viewChild<MatSort>('othersSort');

  // 2. Capturas reativas do Paginator do Template HTML
  private readonly ownerPaginator = viewChild<MatPaginator>('ownerPaginator');
  private readonly othersPaginator = viewChild<MatPaginator>('othersPaginator');

  // Definições de Estrutura de Colunas expostas ao Template
  protected readonly displayedOwnerColumns: string[] = ['bookmark', 'patient', 'cns', 'type', 'consultation_date', 'status', 'actions'];
  protected readonly displayedOthersColumns: string[] = ['patient', 'cns', 'type', 'consultation_date', 'responsible', 'actions'];

  // Signals internos para armazenamento do estado bruto
  private readonly rawOwnerList = signal<PatientRequest[]>([]);
  private readonly rawOthersList = signal<PatientRequest[]>([]);

  // Computed signals reativos ligando dados, ordenação e paginação (Padrão de Referência de Sucesso)
  protected readonly ownerDataSource = computed(() => {
    const dataSource = new MatTableDataSource(this.rawOwnerList());
    const sortRef = this.ownerSort();
    const paginatorRef = this.ownerPaginator();

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

    TFD_TRAVELS_CHANNEL.onmessage = (message) => {
      if (message.data === 'update') {
        this.fetchPatientRequests(false);
      }
    };

    // Gerenciamento seguro de destruição de canais usando DestroyRef
    this.destroyRef.onDestroy(() => {
      TFD_TRAVELS_CHANNEL.close();
    });
  }

  // Métodos de Filtragem com reset preventivo de paginação
  protected applyOwnerFilter(event: Event): void {
    const filterValue = (event.target as HTMLInputElement).value;
    const dataSource = this.ownerDataSource();
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
   * Obtém a listagem atualizada de solicitações de viagem e alimenta os signals brutos.
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
        next: (response: any) => {
          const rawList = response ?? [];

          // Nivelamento do modelo para busca e exibição facilitada
          const normalizedRequests = rawList.map((item: any) => ({
            ...item,
            name: item.report?.patient_care?.patient?.name || '',
            cns: item.report?.patient_care?.patient?.cns || '',
            type: item.type,
            consultation_date: item.consultation_date,
            status: item.status
          }));

          // Filtra e mapeia os registros conforme a regra de posse/responsabilidade da viagem
          const owners = normalizedRequests.filter((req: any) => req.travel_professional && !req.is_travel_finished && req.travel);
          const others = normalizedRequests.filter((req: any) => req.travel_professional && !req.is_travel_finished && !req.travel);

          // Atualiza os signals brutos de forma segura
          this.rawOwnerList.set(owners);
          this.rawOthersList.set(others);
        },
        error: () => {
          this.rawOwnerList.set([]);
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
   * Retorna 'true' (desabilita) se o usuário NÃO possuar a permissão informada.
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
   * Centralizador genérico para abertura de modais com recarga automatizada de dados.
   */
  private openDialog(
    component: any,
    data: any,
    width = '400px',
    height = 'auto',
    requiresRefresh = true
  ): void {
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
    TFD_TRAVELS_CHANNEL.postMessage('update');
  }

  // --- MÉTODOS DE AÇÃO DO TEMPLATE (PROTECTED) ---

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

  protected patientRequestTravels(patient_request: PatientRequest): void {
    this.openDialog(PatientRequestTravelsComponent, { patient_request, permissions: this.currentUser?.roles }, '1200px');
  }

  protected showPatientRequest(patient_request: PatientRequest): void {
    this.openDialog(ShowPatientRequestComponent, { patient_request }, '1000px', 'auto', false);
  }

  protected archivePatientRequest(patientRequest: PatientRequest): void {
    this.openDialog(ArchivePatientRequestComponent, { patient_request: patientRequest }, '400px');
  }

  protected finishBackPatientRequest(patientRequest: PatientRequest): void {
    this.openDialog(FinishBackPatientRequestComponent, { patient_request: patientRequest }, '400px');
  }
}