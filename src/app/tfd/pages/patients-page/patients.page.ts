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
import { MatTabsModule } from '@angular/material/tabs';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatSort, MatSortModule } from '@angular/material/sort';
import { MatPaginator, MatPaginatorModule } from '@angular/material/paginator';
import { Overlay } from '@angular/cdk/overlay';
import { NgxMaskPipe } from 'ngx-mask';

// Core & Shared
import { LoadingComponent } from '../../../core/components/loading-component/loading-component';
import { PatientCare } from '../../models/patient-care.model';
import { Permission } from '../../models/permission.model';
import { PatientService } from '../../services/patient.service';

// Components (Dialogs)
import { PatientArchiveComponent } from '../../components/patient/patient-archive/patient-archive.component';
import { PatientMoveFromOthersComponent } from '../../components/patient/patient-move-from-others/patient-move-from-others.component';
import { PatientEscortsComponent } from '../../components/patient/patient-escorts/patient-escorts.component';
import { PatientReportsComponent } from '../../components/patient/patient-reports/patient-reports.component';
import { PatientDetailComponent } from '../../components/patient/patient-detail/patient-detail.component';
import { PatientUpdateComponent } from '../../components/patient/patient-update/patient-update.component';
import { PatientValidateComponent } from '../../components/patient/patient-validate/patient-validate.component';
import { UndoMessageComponent } from '../../components/shared/undo-message-component/undo-message-component';
import { PatientFinishBackComponent } from '../../components/patient/patient-finish-back/patient-finish-back.component';

const TFD_PATIENTS_CHANNEL = new BroadcastChannel('tfd-patients-channel');

@Component({
  selector: 'app-patients-page',
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
    MatTabsModule,
    MatSortModule,
    MatPaginatorModule,
    NgxMaskPipe
  ],
  templateUrl: './patients.page.html',
  styleUrl: './patients.page.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class PatientsPage implements OnInit {
  // Injeções de Dependência Dinâmicas
  private readonly patientService = inject(PatientService);
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
  protected readonly displayedOwnerColumns: string[] = ['name', 'cns', 'document', 'status', 'actions'];
  protected readonly displayedOthersColumns: string[] = ['name', 'cns', 'responsible', 'status', 'actions'];

  // Signals internos para armazenamento do estado bruto
  private readonly rawOwnerList = signal<PatientCare[]>([]);
  private readonly rawOthersList = signal<PatientCare[]>([]);

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
    this.fetchPatients(true);

    TFD_PATIENTS_CHANNEL.onmessage = (message) => {
      if (message.data === 'update') {
        this.fetchPatients(false);
      }
    };

    // Gerenciamento seguro de destruição de canais usando DestroyRef
    this.destroyRef.onDestroy(() => {
      TFD_PATIENTS_CHANNEL.close();
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
   * Obtém a listagem atualizada de pacientes e alimenta os signals brutos.
   */
  private fetchPatients(showLoading = false): void {
    if (showLoading) this.openLoading();

    this.patientService.getPatients()
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

          // Filtra e mapeia os pacientes Titulares
          const owners: PatientCare[] = rawData
            .filter((item: PatientCare) => item.owner)
            .map((item: PatientCare) => ({
              ...item,
              name: item.patient?.name,
              cns: item.patient?.cns,
              document: item.patient?.document,
              document_type: item.patient?.document_type,
            }));

          // Filtra e mapeia os pacientes de outros Profissionais
          const others: PatientCare[] = rawData
            .filter((item: PatientCare) => !item.owner)
            .map((item: PatientCare) => ({
              ...item,
              name: item.patient?.name,
              cns: item.patient?.cns,
              professional: item.user?.professional?.name,
            }));

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
   * Retorna 'true' (desabilita) se o usuário NÃO possuir a permissão informada.
   */
  protected checkPermissions(permissionName: string): boolean {
    if (!this.currentUser?.roles) return true;

    const hasPermission = this.currentUser.roles.some((role: any) => 
      role.permissions?.some((perm: Permission) => perm.name === permissionName)
    );

    return !hasPermission;
  }

  /**
   * Centralizador genérico para abertura de modais com recarga automatizada de dados.
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
    this.fetchPatients(false);
    TFD_PATIENTS_CHANNEL.postMessage('update');
  }

  // --- MÉTODOS DE AÇÃO DO TEMPLATE (PROTECTED) ---
  
  protected showPatient(patientCare: PatientCare): void {
    this.openDialog(PatientDetailComponent, { patient: patientCare.patient }, '1200px', '700px', false);
  }

  protected updatePatient(patientCare: PatientCare): void {
    this.openDialog(PatientUpdateComponent, { patient: patientCare.patient }, '1200px', '700px');
  }

  protected patientEscorts(patientCare: PatientCare): void {
    this.openDialog(PatientEscortsComponent, { patientCare }, '1200px', 'auto', false);
  }

  protected patientReports(patientCare: PatientCare): void {
    this.openDialog(PatientReportsComponent, { patientCare }, '1200px', 'auto', false);
  }

  protected archivePatient(patientCare: PatientCare): void {
    this.openDialog(PatientArchiveComponent, { patientCare }, '400px');
  }

  protected movePatientFromOthers(patientCare: PatientCare): void {
    this.openDialog(PatientMoveFromOthersComponent, { patientCare }, '400px');
  }

  protected validatePatient(patientCare: PatientCare): void {
    this.openDialog(PatientValidateComponent, { patientCare }, '400px');
  }

  protected finishBackPatient(patientCare: PatientCare): void {
    this.openDialog(PatientFinishBackComponent, { patientCare }, '400px');
  }
}