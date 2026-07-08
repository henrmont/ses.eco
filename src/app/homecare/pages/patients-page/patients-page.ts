import { ChangeDetectionStrategy, Component, DestroyRef, OnDestroy, OnInit, computed, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ActivatedRoute } from '@angular/router';
import { finalize } from 'rxjs';

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
import { NgxMaskPipe } from 'ngx-mask';

// Core & Shared
import { LoadingComponent } from '../../../core/components/loading-component/loading-component';
import { Patient } from '../../models/patient';
import { PatientCare } from '../../models/patient-care';
import { Permission } from '../../models/permission';
import { PatientService } from '../../services/patient-service';

// Components (Dialogs)

const HOMECARE_PATIENTS_CHANNEL = new BroadcastChannel('homecare-patients-channel');

@Component({
  selector: 'app-patients-page',
  standalone: true,
  imports: [
    MatFormFieldModule, 
    MatInputModule, 
    MatTableModule, 
    MatButtonModule, 
    MatIconModule, 
    MatTooltipModule, 
    MatBadgeModule, 
    MatTabsModule, 
    NgxMaskPipe
  ],
  templateUrl: './patients-page.html',
  styleUrl: './patients-page.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class PatientsPage implements OnInit, OnDestroy {
  // Injeções de dependência modernas via inject()
  private readonly patientService = inject(PatientService);
  private readonly dialog = inject(MatDialog);
  private readonly route = inject(ActivatedRoute);
  private readonly destroyRef = inject(DestroyRef);

  private loadingDialog!: MatDialogRef<LoadingComponent>;
  private readonly currentUser = this.route.parent?.parent?.snapshot.data['user'];

  // Definições de Colunas das Tabelas
  protected readonly displayedOwnerColumns: string[] = ['name', 'cns', 'document', 'valid', 'actions'];
  protected readonly displayedOthersColumns: string[] = ['name', 'cns', 'responsible', 'valid', 'actions'];

  // Signals para armazenamento do estado bruto dos dados
  private readonly initialOwnerList = signal<any[]>([]);
  private readonly initialOthersList = signal<any[]>([]);

  // Computed signals gerando os DataSources dinamicamente a partir dos estados acima
  protected readonly ownerDataSource = computed(() => new MatTableDataSource(this.initialOwnerList()));
  protected readonly othersDataSource = computed(() => new MatTableDataSource(this.initialOthersList()));

  ngOnInit(): void {
    this.getPatients(true);

    HOMECARE_PATIENTS_CHANNEL.onmessage = (message) => {
      if (message.data === 'update') {
        this.getPatients(false);
      }
    };
  }

  ngOnDestroy(): void {
    HOMECARE_PATIENTS_CHANNEL.close();
  }

  // Filtros rápidos das tabelas
  protected applyOwnerFilter(event: Event): void {
    const filterValue = (event.target as HTMLInputElement).value;
    this.ownerDataSource().filter = filterValue.trim().toLowerCase();
  }

  protected applyOthersFilter(event: Event): void {
    const filterValue = (event.target as HTMLInputElement).value;
    this.othersDataSource().filter = filterValue.trim().toLowerCase();
  }

  /**
   * Busca e formatação reativa dos pacientes
   */
  private getPatients(showLoading = false): void {
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
        next: (response) => {
          // Filtra e mapeia os pacientes Titulares (Owner)
          const owners = response
            .filter((item: any) => !item.is_archived && item.owner)
            .map((item: any) => ({
              ...item,
              name: item.patient?.name,
              cns: item.patient?.cns,
              document: item.patient?.document,
              document_type: item.patient?.document_type,
            }));

          // Filtra e mapeia os pacientes Vinculados a Outros Profissionais
          const others = response
            .filter((item: any) => !item.is_archived && !item.owner)
            .map((item: any) => ({
              ...item,
              name: item.patient?.name,
              cns: item.patient?.cns,
              professional: item.user?.professional?.name,
            }));

          this.initialOwnerList.set(owners);
          this.initialOthersList.set(others);
        },
        error: (err) => console.error('Erro ao buscar pacientes:', err)
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
   * Validação de permissões baseada no perfil/roles obtidas no Route Resolver.
   * Retorna 'true' se possuir a permissão.
   */
  protected checkPermissions(permissionName: string): boolean {
    if (!this.currentUser?.roles) return false;
    return this.currentUser.roles.some((role: any) => 
      role.permissions?.some((perm: Permission) => perm.name === permissionName)
    );
  }

  /**
   * Método privado e unificado para abertura e tratamento de Modais
   */
  private openDialog(component: any, data: any, width = '1200px', height = 'auto'): void {
    this.dialog.open(component, {
      width,
      height,
      disableClose: true,
      autoFocus: false,
      data
    }).afterClosed()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(result => {
        if (result) {
          this.handlePatientChange();
        }
      });
  }

  private handlePatientChange(): void {
    this.getPatients(false);
    HOMECARE_PATIENTS_CHANNEL.postMessage('update');
  }

  // Métodos disparados pelas ações do template HTML
  protected showPatient(patientCare: PatientCare): void {
    // this.openDialog(ShowPatientComponent, { patient_care: patientCare.patient }, '1200px', '700px');
  }

  protected updatePatient(patientCare: PatientCare): void {
    // this.openDialog(UpdatePatientComponent, { patient: patientCare.patient }, '1200px', '700px');
  }

  protected patientEscorts(patientCare: PatientCare): void {
    // this.openDialog(PatientEscortsComponent, {
    //   patient_care: patientCare,
    //   permissions: this.currentUser?.roles
    // });
  }

  protected patientReports(patientCare: PatientCare): void {
    // this.openDialog(PatientReportsComponent, { patient_care: patientCare });
  }

  protected archivePatient(patientCare: PatientCare): void {
    // this.openDialog(ArchivePatientComponent, { patient_care: patientCare }, '400px');
  }

  protected movePatientFromOthers(patientCare: PatientCare): void {
    // this.openDialog(MovePatientFromOthersComponent, { patient_care: patientCare }, '400px');
  }

  protected validatePatient(patientCare: PatientCare): void {
    // this.openDialog(ValidatePatientComponent, { patient_care: patientCare }, '400px');
  }
}