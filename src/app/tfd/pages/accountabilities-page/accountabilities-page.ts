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
import { Permission } from '../../models/permission';
import { AccountabilityService } from '../../services/accountability-service';

// Modais (Dialogs)
import { ShowPatientRequestComponent } from '../../components/patient-request/show-patient-request-component/show-patient-request-component';
import { UndoMessageComponent } from '../../components/shared/undo-message-component/undo-message-component';
import { PatientRequestAttachmentsComponent } from '../../components/patient-request/patient-request-attachments-component/patient-request-attachments-component';
import { HaltedPatientRequestComponent } from '../../components/accountability/halted-patient-request-component/halted-patient-request-component';
import { PatientRequestAccountabilitiesComponent } from '../../components/accountability/patient-request-accountabilities-component/patient-request-accountabilities-component';
import { ArchivePatientRequestComponent } from '../../components/accountability/archive-patient-request-component/archive-patient-request-component';

const TFD_ACCOUNTABILITIES_CHANNEL = new BroadcastChannel('tfd-accountabilities-channel');

@Component({
  selector: 'app-accountabilities-page',
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
  templateUrl: './accountabilities-page.html',
  styleUrl: './accountabilities-page.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class AccountabilitiesPage implements OnInit {
  // Injeções de Dependência
  private readonly accountabilityService = inject(AccountabilityService);
  private readonly dialog = inject(MatDialog);
  private readonly overlay = inject(Overlay);
  private readonly route = inject(ActivatedRoute);
  private readonly destroyRef = inject(DestroyRef);

  private loadingDialog!: MatDialogRef<LoadingComponent>;
  private readonly currentUser = this.route.parent?.parent?.snapshot.data['user'];

  // Capturas reativas dos controles de Sort do Template
  private readonly ownerSort = viewChild<MatSort>('ownerSort');
  private readonly othersSort = viewChild<MatSort>('othersSort');

  // Capturas reativas dos controles de Paginator do Template
  private readonly ownerPaginator = viewChild<MatPaginator>('ownerPaginator');
  private readonly othersPaginator = viewChild<MatPaginator>('othersPaginator');

  // Definições das Estruturas de Colunas
  protected readonly displayedOwnerColumns: string[] = ['bookmark', 'patient', 'cns', 'type', 'consultation_date', 'status', 'actions'];
  protected readonly displayedOthersColumns: string[] = ['patient', 'cns', 'type', 'consultation_date', 'responsible', 'actions'];

  // Signals internos de estado dos dados brutos
  private readonly rawOwnerList = signal<PatientRequest[]>([]);
  private readonly rawOthersList = signal<PatientRequest[]>([]);

  // Computed signals reativos integrando dados, ordenação e paginação
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

    TFD_ACCOUNTABILITIES_CHANNEL.onmessage = (message) => {
      if (message.data === 'update') {
        this.fetchPatientRequests(false);
      }
    };

    // Fechamento automático e seguro do BroadcastChannel
    this.destroyRef.onDestroy(() => {
      TFD_ACCOUNTABILITIES_CHANNEL.close();
    });
  }

  // Métodos de filtragem com prevenção de estarem em páginas inexistentes
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
   * Busca centralizada das solicitações de prestação de contas.
   */
  private fetchPatientRequests(showLoading = false): void {
    if (showLoading) this.openLoading();

    this.accountabilityService.getPatientRequests()
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

          // Nivelamento do modelo de dados para visualização simplificada na tabela
          const normalizedRequests = rawList.map((item: any) => ({
            ...item,
            name: item.report?.patient_care?.patient?.name || '',
            cns: item.report?.patient_care?.patient?.cns || '',
            type: item.type,
            consultation_date: item.consultation_date,
            status: item.status
          }));

          // Mapeamento e distribuição por pertinência de prestação de contas (excluindo finalizadas)
          const owners = normalizedRequests.filter((req: any) => req.accountability && !req.is_accountability_finished);
          const others = normalizedRequests.filter((req: any) => !req.accountability && !req.is_accountability_finished);

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
   * Avalia as permissões do usuário logado.
   * Retorna 'true' para desabilitar o elemento se a permissão NÃO for encontrada.
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
   * Centralizador para abertura de modais com atualização reativa.
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
    TFD_ACCOUNTABILITIES_CHANNEL.postMessage('update');
  }

  // --- MÉTODOS DE AÇÃO DO TEMPLATE (PROTECTED) ---

  protected showPatientRequest(patient_request: PatientRequest): void {
    this.openDialog(ShowPatientRequestComponent, { patient_request }, '1000px', 'auto', false);
  }

  protected patientRequestAttachments(patient_request: PatientRequest): void {
    this.openDialog(PatientRequestAttachmentsComponent, { patient_request }, '600px', 'auto', false);
  }

  protected accountabilities(patient_request: PatientRequest): void {
    this.openDialog(PatientRequestAccountabilitiesComponent, { patient_request, permissions: this.currentUser?.roles }, '1000px', 'auto');
  }

  protected archivePatientRequest(patient_request: PatientRequest): void {
    this.openDialog(ArchivePatientRequestComponent, { patient_request }, '400px');
  }

  protected haltPatientRequest(patient_request: PatientRequest): void {
    this.openDialog(HaltedPatientRequestComponent, { patient_request }, '400px');
  }

  protected undoMessage(message: string): void {
    this.openDialog(UndoMessageComponent, { message }, '400px', 'auto', false);
  }

  protected movePatientRequestFromOthers(patient_request: PatientRequest): void {
    // Implementação mantida para integrações futuras
  }
}