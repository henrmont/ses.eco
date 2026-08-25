import { 
  ChangeDetectionStrategy, 
  Component, 
  DestroyRef, 
  OnInit, 
  computed, 
  inject, 
  signal, 
  viewChild 
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ActivatedRoute } from '@angular/router';
import { CommonModule } from '@angular/common';
import { finalize } from 'rxjs/operators';

// Angular Material Modules
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

// Core & Shared Models e Serviços
import { LoadingComponent } from '../../../core/components/loading-component/loading-component';
import { PatientRequest } from '../../models/patient-request.model';
import { Permission } from '../../models/permission.model';

// Diálogos de Ação
import { PatientRequestDetailComponent } from '../../components/patient-requests/patient-request-detail/patient-request-detail.component';
import { PatientRequestMoveFromArchiveComponent } from '../../components/patient-request-accountabilities/patient-request-move-from-archive/patient-request-move-from-archive.component';
import { PatientRequestAccountabilityService } from '../../services/patient-request-accountability.service';

const TFD_ACCOUNTABILITIES_CHANNEL = new BroadcastChannel('tfd-accountabilities-channel');

@Component({
  selector: 'app-archive-patient-request-accountabilities-page',
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
  templateUrl: './archive-patient-request-accountabilities-page.html',
  styleUrl: './archive-patient-request-accountabilities-page.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ArchivePatientRequestAccountabilitiesPage implements OnInit {
  // ==========================================
  // Injeções de Dependência
  // ==========================================
  private readonly accountabilityService = inject(PatientRequestAccountabilityService);
  private readonly dialog = inject(MatDialog);
  private readonly overlay = inject(Overlay);
  private readonly route = inject(ActivatedRoute);
  private readonly destroyRef = inject(DestroyRef);

  private loadingDialog!: MatDialogRef<LoadingComponent>;
  private readonly currentUser = this.route.parent?.parent?.snapshot.data['user'];

  // ==========================================
  // Queries do Template (Sort & Paginator)
  // ==========================================
  private readonly archiveSort = viewChild<MatSort>('archiveSort');
  private readonly archivePaginator = viewChild<MatPaginator>('archivePaginator');

  // ==========================================
  // Configuração de Exibição
  // ==========================================
  protected readonly displayedColumns: string[] = ['name', 'cns', 'type', 'responsible', 'actions'];

  // ==========================================
  // Estados Reativos via Signals
  // ==========================================
  private readonly rawArchiveList = signal<PatientRequest[]>([]);

  protected readonly archivedDataSource = computed(() => {
    const dataSource = new MatTableDataSource(this.rawArchiveList());
    const sortRef = this.archiveSort();
    const paginatorRef = this.archivePaginator();

    if (sortRef) dataSource.sort = sortRef;
    if (paginatorRef) dataSource.paginator = paginatorRef;

    return dataSource;
  });

  // ==========================================
  // Ciclo de Vida (Hooks)
  // ==========================================
  ngOnInit(): void {
    this.fetchArchivePatientRequests(true);

    TFD_ACCOUNTABILITIES_CHANNEL.onmessage = (message) => {
      if (message.data === 'update') {
        this.fetchArchivePatientRequests(false);
      }
    };

    this.destroyRef.onDestroy(() => {
      TFD_ACCOUNTABILITIES_CHANNEL.close();
    });
  }

  // ==========================================
  // Métodos de Filtragem e Busca
  // ==========================================
  protected applyFilter(event: Event): void {
    const filterValue = (event.target as HTMLInputElement).value;
    const dataSource = this.archivedDataSource();
    dataSource.filter = filterValue.trim().toLowerCase();
    
    if (dataSource.paginator) {
      dataSource.paginator.firstPage();
    }
  }

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

          const archivedRequests: PatientRequest[] = rawData.map((item: any) => ({
            ...item,
            name: item.report?.patient_care?.patient?.name || 'Não informado',
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

  // ==========================================
  // Helpers de Diálogo e Permissões
  // ==========================================
  private openLoading(): void {
    this.loadingDialog = this.dialog.open(LoadingComponent, {
      height: '200px',
      disableClose: true,
      autoFocus: false,
    });
  }

  protected checkPermissions(permissionName: string): boolean {
    if (!this.currentUser?.roles) return true;

    const hasPermission = this.currentUser.roles.some((role: any) => 
      role.permissions?.some((perm: Permission) => perm.name === permissionName)
    );

    return !hasPermission;
  }

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

  // ==========================================
  // Ações do Template
  // ==========================================
  protected showPatientRequest(patientRequest: PatientRequest): void {
    this.openDialog(PatientRequestDetailComponent, { patient_request: patientRequest }, '1000px', 'auto', false);
  }

  protected movePatientRequestFromArchive(patientRequest: PatientRequest): void {
    this.openDialog(PatientRequestMoveFromArchiveComponent, { patient_request: patientRequest }, '400px');
  }
}