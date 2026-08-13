import { ChangeDetectionStrategy, Component, DestroyRef, OnInit, computed, inject, signal, viewChild } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ActivatedRoute } from '@angular/router';
import { finalize } from 'rxjs';
import { CommonModule } from '@angular/common';
import { Overlay } from '@angular/cdk/overlay';

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
import { NgxMaskDirective, NgxMaskPipe } from 'ngx-mask';

// Core & Shared
import { LoadingComponent } from '../../../core/components/loading-component/loading-component';
import { PatientRequest } from '../../models/patient-request.model';
import { Permission } from '../../models/permission.model';
import { OpinionService } from '../../services/opinion-service';

// Components (Dialogs)
import { PatientRequestDetailComponent } from '../../components/patient-request/patient-request-detail/patient-request-detail.component';
import { OpinionsComponent } from '../../components/opinion/opinions-component/opinions-component';
import { MovePatientRequestFromArchiveComponent } from '../../components/opinion/move-patient-request-from-archive-component/move-patient-request-from-archive-component';

const TFD_PATIENT_REQUESTS_CHANNEL = new BroadcastChannel('tfd-patient-requests-channel');

@Component({
  selector: 'app-archive-opinion-patient-requests-page',
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
    NgxMaskDirective,
    NgxMaskPipe
  ],
  templateUrl: './archive-opinion-patient-requests-page.html',
  styleUrl: './archive-opinion-patient-requests-page.scss',
  changeDetection: ChangeDetectionStrategy.OnPush // ⚡ Performance máxima com OnPush + Signals
})
export class ArchiveOpinionPatientRequestsPage implements OnInit {
  // Injeções de Dependência funcionais modernas via inject()
  private readonly opinionService = inject(OpinionService);
  private readonly dialog = inject(MatDialog);
  private readonly overlay = inject(Overlay);
  private readonly route = inject(ActivatedRoute);
  private readonly destroyRef = inject(DestroyRef);

  private loadingDialog!: MatDialogRef<LoadingComponent>;
  private readonly currentUser = this.route.parent?.parent?.snapshot.data['user'];

  // Captura reativa dos objetos de ordenação e paginação no template
  private readonly archiveSort = viewChild<MatSort>('archiveSort');
  private readonly archivePaginator = viewChild<MatPaginator>('archivePaginator');

  // Estado que define o tipo do perfil logado ('medical' | 'social')
  protected readonly profileType = signal<'medical' | 'social'>('medical');

  // Colunas da tabela com responsável divididos em Médico e Social
  protected readonly displayedColumns: string[] = [
    'name', 
    'cns', 
    'type', 
    'medical_responsible', 
    'social_responsible', 
    'actions'
  ];

  // Signal interno para armazenamento dos dados brutos
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

    TFD_PATIENT_REQUESTS_CHANNEL.onmessage = (message) => {
      if (message.data === 'update') {
        this.fetchArchivePatientRequests(false);
      }
    };

    // Fechamento seguro do BroadcastChannel ao destruir o componente
    this.destroyRef.onDestroy(() => {
      TFD_PATIENT_REQUESTS_CHANNEL.close();
    });
  }

  // Filtro de pesquisa com reset de página
  protected applyFilter(event: Event): void {
    const filterValue = (event.target as HTMLInputElement).value;
    const dataSource = this.archivedDataSource();
    dataSource.filter = filterValue.trim().toLowerCase();

    if (dataSource.paginator) {
      dataSource.paginator.firstPage();
    }
  }

  /**
   * Busca centralizada do tipo de perfil e das solicitações de pareceres arquivadas.
   */
  private fetchArchivePatientRequests(showLoading = false): void {
    if (showLoading) this.openLoading();

    this.opinionService.getType()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (profileResponse) => {
          const isMedical = profileResponse === 'Médico';
          this.profileType.set(isMedical ? 'medical' : 'social');

          this.opinionService.getArchivePatientRequests()
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

                // Normaliza os dados dividindo os responsáveis Médico e Social
                const archivedRequests: PatientRequest[] = rawData.map((item: any) => ({
                  ...item,
                  name: item.report?.patient_care?.patient?.name,
                  cns: item.report?.patient_care?.patient?.cns,
                  type: item.type,
                  medical_responsible: item.medical_professional?.name || '-',
                  social_responsible: item.social_professional?.name || '-'
                }));

                this.rawArchiveList.set(archivedRequests);
              },
              error: () => {
                this.rawArchiveList.set([]);
              }
            });
        },
        error: () => {
          if (showLoading && this.loadingDialog) {
            this.loadingDialog.close();
          }
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
   * Avalia as permissões cedidas no Route Resolver.
   */
  protected checkPermissions(permissionName: string): boolean {
    if (!this.currentUser?.roles) return true;

    const hasPermission = this.currentUser.roles.some((role: any) =>
      role.permissions?.some((perm: Permission) => perm.name === permissionName)
    );

    return !hasPermission;
  }

  /**
   * Gerenciador genérico de modais com atualização reativa
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
    TFD_PATIENT_REQUESTS_CHANNEL.postMessage('update');
  }

  // --- MÉTODOS DE AÇÃO DO TEMPLATE (PROTECTED) ---

  protected showPatientRequest(patientRequest: PatientRequest): void {
    this.openDialog(PatientRequestDetailComponent, { patient_request: patientRequest }, '1000px', 'auto', false);
  }

  protected movePatientRequestFromArchive(patientRequest: PatientRequest): void {
    this.openDialog(MovePatientRequestFromArchiveComponent, { patient_request: patientRequest, type: this.profileType() }, '400px');
  }

  protected opinions(patientRequest: PatientRequest): void {
    // this.openDialog(OpinionsComponent, { patient_request: patientRequest, permissions: this.currentUser?.roles }, '800px', 'auto', false);
  }
}