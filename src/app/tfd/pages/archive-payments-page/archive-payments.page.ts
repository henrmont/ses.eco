import { ChangeDetectionStrategy, Component, DestroyRef, OnInit, computed, inject, signal, viewChild } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ActivatedRoute } from '@angular/router';
import { finalize } from 'rxjs';
import { CommonModule } from '@angular/common';

// Angular Material
import { MatBadgeModule } from '@angular/material/badge';
import { MatButtonModule } from '@angular/material/button';
import { MatDialog, MatDialogRef, MatDialogModule } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatTableDataSource, MatTableModule } from '@angular/material/table';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatSort, MatSortModule } from '@angular/material/sort';
import { MatPaginator, MatPaginatorModule } from '@angular/material/paginator';
import { Overlay } from '@angular/cdk/overlay';
import { NgxMaskPipe } from 'ngx-mask';

// Core & Shared
import { LoadingComponent } from '../../../core/components/loading-component/loading-component';
import { PatientRequest } from '../../models/patient-request.model';
import { Permission } from '../../models/permission.model';
import { PaymentService } from '../../services/payment.service';

// Components (Dialogs)
import { PatientRequestDetailComponent } from '../../components/patient-request/patient-request-detail/patient-request-detail.component';
import { PaymentMoveFromArchiveComponent } from '../../components/payments/payment-move-from-archive/payment-move-from-archive.component';
import { Payment } from '../../models/payment.model';

const TFD_PAYMENTS_CHANNEL = new BroadcastChannel('tfd-payments-channel');

@Component({
  selector: 'app-archive-payments-page',
  standalone: true,
  imports: [
    CommonModule,
    MatFormFieldModule, 
    MatInputModule, 
    MatTableModule, 
    MatButtonModule, 
    MatIconModule, 
    MatTooltipModule, 
    MatBadgeModule, 
    MatSortModule,
    MatPaginatorModule,
    MatDialogModule,
    NgxMaskPipe
  ],
  templateUrl: './archive-payments.page.html',
  styleUrl: './archive-payments.page.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ArchivePaymentsPage implements OnInit {
  // Injeções de Dependência
  private readonly paymentService = inject(PaymentService);
  private readonly dialog = inject(MatDialog);
  private readonly overlay = inject(Overlay);
  private readonly route = inject(ActivatedRoute);
  private readonly destroyRef = inject(DestroyRef);

  private loadingDialog!: MatDialogRef<LoadingComponent>;
  private readonly currentUser = this.route.parent?.parent?.snapshot.data['user'];

  // Captura reativa de Sort e Paginator do Template HTML
  private readonly archiveSort = viewChild<MatSort>('archiveSort');
  private readonly archivePaginator = viewChild<MatPaginator>('archivePaginator');

  // Definição de Colunas exibidas no grid (incluindo Responsável do Pagamento)
  protected readonly displayedColumns: string[] = ['name', 'cns', 'type', 'responsible', 'actions'];

  // Signal interno para armazenamento das solicitações arquivadas
  private readonly rawArchiveList = signal<Payment[]>([]);

  // Computed signal reativo integrando dados, ordenação e paginação
  protected readonly archivedDataSource = computed(() => {
    const dataSource = new MatTableDataSource(this.rawArchiveList());
    const sortRef = this.archiveSort();
    const paginatorRef = this.archivePaginator();

    if (sortRef) dataSource.sort = sortRef;
    if (paginatorRef) dataSource.paginator = paginatorRef;

    return dataSource;
  });

  ngOnInit(): void {
    this.fetchArchivePayments(true);

    TFD_PAYMENTS_CHANNEL.onmessage = (message) => {
      if (message.data === 'update') {
        this.fetchArchivePayments(false);
      }
    };

    // Fechamento seguro do BroadcastChannel
    this.destroyRef.onDestroy(() => {
      TFD_PAYMENTS_CHANNEL.close();
    });
  }

  // Método de Filtragem com reset de paginação
  protected applyFilter(event: Event): void {
    const filterValue = (event.target as HTMLInputElement).value;
    const dataSource = this.archivedDataSource();
    dataSource.filter = filterValue.trim().toLowerCase();
    
    if (dataSource.paginator) {
      dataSource.paginator.firstPage();
    }
  }

  /**
   * Busca as solicitações de pagamento arquivadas no serviço.
   */
  private fetchArchivePayments(showLoading = false): void {
    if (showLoading) this.openLoading();

    this.paymentService.getArchivePayments()
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
          const rawData = response?.payments ?? [];
          const budgetAllocation = response?.budget_allocation ?? null;

          // Normalização dos dados mapeando o responsável payment_professional
          const archivedRequests: Payment[] = rawData.map((item: any) => ({
            ...item,
            name: item.patient_request?.report?.patient_care?.patient?.name,
            cns: item.patient_request?.report?.patient_care?.patient?.cns,
            type: item.patient_request?.type,
            responsible: item.payment_professional?.name || '-',
            budget_allocation: budgetAllocation
          }));

          this.rawArchiveList.set(archivedRequests);
        },
        error: () => {
          this.rawArchiveList.set([]);
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
   * Validação de permissões pelo Resolver
   */
  protected checkPermissions(permissionName: string): boolean {
    if (!this.currentUser?.roles) return true;

    const hasPermission = this.currentUser.roles.some((role: any) => 
      role.permissions?.some((perm: Permission) => perm.name === permissionName)
    );

    return !hasPermission;
  }

  /**
   * Modais e utilitários de interface
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
    this.fetchArchivePayments(false);
    TFD_PAYMENTS_CHANNEL.postMessage('update');
  }

  // --- MÉTODOS DE AÇÃO DO TEMPLATE (PROTECTED) ---

  protected showPatientRequest(patientRequest: PatientRequest): void {
    this.openDialog(PatientRequestDetailComponent, { patient_request: patientRequest }, '1000px', 'auto', false);
  }

  protected movePaymentFromArchive(payment: Payment): void {
    this.openDialog(PaymentMoveFromArchiveComponent, { payment }, '400px');
  }
}