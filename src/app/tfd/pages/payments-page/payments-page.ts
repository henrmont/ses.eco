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
import { PaymentService } from '../../services/payment-service';

// Modais (Dialogs) de Ação de Pagamento
import { ShowPatientRequestComponent } from '../../components/patient-request/show-patient-request-component/show-patient-request-component';
import { UndoMessageComponent } from '../../components/shared/undo-message-component/undo-message-component';
import { HaltedPatientRequestComponent } from '../../components/payment/halted-patient-request-component/halted-patient-request-component';
import { UndoPatientRequestComponent } from '../../components/payment/undo-patient-request-component/undo-patient-request-component';
import { ArchivePatientRequestComponent } from '../../components/payment/archive-patient-request-component/archive-patient-request-component';
import { UpdatePaymentComponent } from '../../components/payment/update-payment-component/update-payment-component';
import { PaymentMemoComponent } from '../../components/payment/payment-memo-component/payment-memo-component';

const TFD_PAYMENTS_CHANNEL = new BroadcastChannel('tfd-payments-channel');

@Component({
  selector: 'app-payments-page',
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
  templateUrl: './payments-page.html',
  styleUrl: './payments-page.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class PaymentsPage implements OnInit {
  // Injeções de Dependência
  private readonly paymentService = inject(PaymentService);
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

  // Definições das Estruturas de Colunas (sem aba finalizadas)
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
    this.fetchPayments(true);

    TFD_PAYMENTS_CHANNEL.onmessage = (message) => {
      if (message.data === 'update') {
        this.fetchPayments(false);
      }
    };

    // Fechamento automático e seguro do BroadcastChannel
    this.destroyRef.onDestroy(() => {
      TFD_PAYMENTS_CHANNEL.close();
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
   * Busca centralizada das solicitações de pagamento.
   */
  private fetchPayments(showLoading = false): void {
    if (showLoading) this.openLoading();

    this.paymentService.getPayments()
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
            name: item.patient_request.report?.patient_care?.patient?.name || '',
            cns: item.patient_request.report?.patient_care?.patient?.cns || '',
            type: item.patient_request.type,
            consultation_date: item.patient_request.consultation_date,
            status: item.patient_request.status
          }));

          // Mapeamento e distribuição por pertinência de pagamento
          const owners = normalizedRequests.filter((req: any) => req.payment);
          const others = normalizedRequests.filter((req: any) => !req.payment);

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
    this.fetchPayments(false);
    TFD_PAYMENTS_CHANNEL.postMessage('update');
  }

  // --- MÉTODOS DE AÇÃO DO TEMPLATE (PROTECTED) ---

  /**
   * Realiza o download do PDF compilado (Capa + Anexos unificados) do processo.
   */
  protected downloadMergedPdf(patientRequest: PatientRequest): void {
    this.openLoading();

    this.paymentService.downloadMergedPdf(patientRequest.id)
      .pipe(
        finalize(() => {
          if (this.loadingDialog) {
            this.loadingDialog.close();
          }
        }),
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe({
        next: (blobData: Blob) => {
          // Instancia o Blob com o tipo application/pdf
          const file = new Blob([blobData], { type: 'application/pdf' });
          const fileURL = URL.createObjectURL(file);

          // Cria elemento <a> invisível para acionar a janela de download do navegador
          const anchor = document.createElement('a');
          anchor.href = fileURL;
          anchor.download = `processo_${patientRequest.id}_completo.pdf`;
          anchor.click();

          // Desaloca a URL temporária da memória
          URL.revokeObjectURL(fileURL);
        },
        error: (err) => {
          console.error('Erro ao realizar o download do arquivo mesclado:', err);
        }
      });
  }

  protected showPatientRequest(patient_request: PatientRequest): void {
    this.openDialog(ShowPatientRequestComponent, { patient_request }, '1000px', 'auto', false);
  }

  protected updatePayment(payment: any): void {
    this.openDialog(UpdatePaymentComponent, { payment }, '400px');
  }

  protected paymentMemo(payment: any): void {
    this.openDialog(PaymentMemoComponent, { payment }, '800px', '800px');
  }

  protected undoPatientRequest(patient_request: PatientRequest): void {
    this.openDialog(UndoPatientRequestComponent, { patient_request }, '500px');
  }

  protected archivePatientRequest(patient_request: PatientRequest): void {
    this.openDialog(ArchivePatientRequestComponent, { patient_request }, '400px');
  }

  protected haltedPatientRequest(patient_request: PatientRequest): void {
    this.openDialog(HaltedPatientRequestComponent, { patient_request }, '400px');
  }

  protected undoMessage(message: string): void {
    this.openDialog(UndoMessageComponent, { message }, '400px', 'auto', false);
  }

  protected movePaymentFromOthers(payment: any): void {
    this.openDialog(UpdatePaymentComponent, { payment }, '400px');
  }

}