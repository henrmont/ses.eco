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
import { PatientCare } from '../../models/patient-care';
import { Permission } from '../../models/permission';
import { PatientService } from '../../services/patient-service';

// Components (Dialogs)
import { ShowPatientComponent } from '../../components/patient/show-patient-component/show-patient-component';
import { ArchivedPatientEscortsComponent } from '../../components/patient/archived-patient-escorts-component/archived-patient-escorts-component';
import { ArchivedPatientReportsComponent } from '../../components/patient/archived-patient-reports-component/archived-patient-reports-component';
import { MovePatientFromArchiveComponent } from '../../components/patient/move-patient-from-archive-component/move-patient-from-archive-component';

const TFD_PATIENTS_CHANNEL = new BroadcastChannel('tfd-patients-channel');

@Component({
  selector: 'app-archive-patients-page',
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
  templateUrl: './archive-patients-page.html',
  styleUrl: './archive-patients-page.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ArchivePatientsPage implements OnInit {
  // Injeções de Dependência Dinâmicas
  private readonly patientService = inject(PatientService);
  private readonly dialog = inject(MatDialog);
  private readonly overlay = inject(Overlay);
  private readonly route = inject(ActivatedRoute);
  private readonly destroyRef = inject(DestroyRef);

  private loadingDialog!: MatDialogRef<LoadingComponent>;
  private readonly currentUser = this.route.parent?.parent?.snapshot.data['user'];

  // Captura reativa do Sort e Paginator do Template HTML
  private readonly archiveSort = viewChild<MatSort>('archiveSort');
  private readonly archivePaginator = viewChild<MatPaginator>('archivePaginator');

  // Definição de Colunas alinhada à aba "others"
  protected readonly displayedColumns: string[] = ['name', 'cns', 'responsible', 'status', 'actions'];

  // Signal interno para armazenamento dos pacientes arquivados
  private readonly rawArchiveList = signal<PatientCare[]>([]);

  // Computed signal reativo unindo dados, ordenação e paginação
  protected readonly archivedDataSource = computed(() => {
    const dataSource = new MatTableDataSource(this.rawArchiveList());
    const sortRef = this.archiveSort();
    const paginatorRef = this.archivePaginator();

    if (sortRef) dataSource.sort = sortRef;
    if (paginatorRef) dataSource.paginator = paginatorRef;

    return dataSource;
  });

  ngOnInit(): void {
    this.fetchArchivePatients(true);

    TFD_PATIENTS_CHANNEL.onmessage = (message) => {
      if (message.data === 'update') {
        this.fetchArchivePatients(false);
      }
    };

    // Fechamento seguro do BroadcastChannel
    this.destroyRef.onDestroy(() => {
      TFD_PATIENTS_CHANNEL.close();
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
   * Busca os pacientes arquivados no serviço.
   */
  private fetchArchivePatients(showLoading = false): void {
    if (showLoading) this.openLoading();

    // Nota: Caso o método no seu serviço tenha outro nome (ex: getArchivedPatients), basta ajustar aqui.
    this.patientService.getArchivePatients()
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

          // Mapeamento idêntico à aba 'others' da referência
          const archivedPatients: PatientCare[] = rawData.map((item: PatientCare) => ({
            ...item,
            name: item.patient?.name,
            cns: item.patient?.cns,
            responsible: item.user?.professional?.name,
          }));

          this.rawArchiveList.set(archivedPatients);
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
    width = '1200px', 
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
          this.handlePatientChange();
        }
      });
  }

  private handlePatientChange(): void {
    this.fetchArchivePatients(false);
    TFD_PATIENTS_CHANNEL.postMessage('update');
  }

  // --- MÉTODOS DE AÇÃO DO TEMPLATE (PROTECTED) ---

  protected showPatient(patientCare: PatientCare): void {
    this.openDialog(ShowPatientComponent, { patient_care: patientCare.patient }, '1200px', '700px', false);
  }

  protected patientEscorts(patientCare: PatientCare): void {
    this.openDialog(ArchivedPatientEscortsComponent, { patient_care: patientCare }, '800px', 'auto', false);
  }

  protected patientReports(patientCare: PatientCare): void {
    this.openDialog(ArchivedPatientReportsComponent, { patient_care: patientCare }, '800px', 'auto', false);
  }

  protected movePatientFromArchive(patientCare: PatientCare): void {
    this.openDialog(MovePatientFromArchiveComponent, { patient_care: patientCare }, '400px');
  }
 
}