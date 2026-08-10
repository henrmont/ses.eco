import { ChangeDetectionStrategy, Component, DestroyRef, OnInit, computed, inject, signal, viewChild } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ActivatedRoute } from '@angular/router';
import { finalize } from 'rxjs';
import { CommonModule } from '@angular/common';

// Angular Material
import { MatBadgeModule } from '@angular/material/badge';
import { MatButtonModule } from '@angular/material/button';
import { MatDialog, MatDialogRef } from '@angular/material/dialog';
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
import { PatientRequest } from '../../models/patient-request';
import { Permission } from '../../models/permission';
import { AccountabilityService } from '../../services/accountability-service';

// Components (Dialogs)
import { ShowPatientRequestComponent } from '../../components/patient-request/show-patient-request-component/show-patient-request-component';
import { MovePatientRequestFromArchiveComponent } from '../../components/accountability/move-patient-request-from-archive-component/move-patient-request-from-archive-component';

const TFD_ACCOUNTABILITIES_CHANNEL = new BroadcastChannel('tfd-accountabilities-channel');

@Component({
  selector: 'app-archive-accountability-patient-requests-page',
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
    NgxMaskPipe
  ],
  templateUrl: './archive-accountability-patient-requests-page.html',
  styleUrl: './archive-accountability-patient-requests-page.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ArchiveAccountabilityPatientRequestsPage implements OnInit {
  // Injeções de Dependência
  private readonly accountabilityService = inject(AccountabilityService);
  private readonly dialog = inject(MatDialog);
  private readonly overlay = inject(Overlay);
  private readonly route = inject(ActivatedRoute);
  private readonly destroyRef = inject(DestroyRef);

  private loadingDialog!: MatDialogRef<LoadingComponent>;
  private readonly currentUser = this.route.parent?.parent?.snapshot.data['user'];

  // Captura reativa de Sort e Paginator do Template HTML
  private readonly archiveSort = viewChild<MatSort>('archiveSort');
  private readonly archivePaginator = viewChild<MatPaginator>('archivePaginator');

  // Definição de Colunas exibidas no grid (incluindo Responsável)
  protected readonly displayedColumns: string[] = ['name', 'cns', 'type', 'responsible', 'actions'];

  // Signal interno para armazenamento das solicitações arquivadas
  private readonly rawArchiveList = signal<PatientRequest[]>([]);

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
    this.fetchArchivePatientRequests(true);

    TFD_ACCOUNTABILITIES_CHANNEL.onmessage = (message) => {
      if (message.data === 'update') {
        this.fetchArchivePatientRequests(false);
      }
    };

    // Fechamento seguro do BroadcastChannel
    this.destroyRef.onDestroy(() => {
      TFD_ACCOUNTABILITIES_CHANNEL.close();
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
   * Busca as solicitações de prestação de contas arquivadas no serviço.
   */
  private fetchArchivePatientRequests(showLoading = false): void {
    if (showLoading) this.openLoading();

    this.accountabilityService.getArchivePatientRequests()
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
          const rawData = response ?? [];

          // Normalização dos dados mapeando o responsável accountability_professional
          const archivedRequests: PatientRequest[] = rawData.map((item: any) => ({
            ...item,
            name: item.report?.patient_care?.patient?.name,
            cns: item.report?.patient_care?.patient?.cns,
            type: item.type,
            responsible: item.accountability_professional?.name || '-'
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
    this.fetchArchivePatientRequests(false);
    TFD_ACCOUNTABILITIES_CHANNEL.postMessage('update');
  }

  // --- MÉTODOS DE AÇÃO DO TEMPLATE (PROTECTED) ---

  protected showPatientRequest(patientRequest: PatientRequest): void {
    this.openDialog(ShowPatientRequestComponent, { patient_request: patientRequest }, '1000px', 'auto', false);
  }

  protected movePatientRequestFromArchive(patientRequest: PatientRequest): void {
    this.openDialog(MovePatientRequestFromArchiveComponent, { patient_request: patientRequest }, '400px');
  }
}