import { ChangeDetectionStrategy, Component, DestroyRef, OnInit, computed, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { finalize } from 'rxjs';

// Angular Material
import { MatButtonModule } from '@angular/material/button';
import { MAT_DIALOG_DATA, MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatTableDataSource, MatTableModule } from '@angular/material/table';
import { MatTooltipModule } from '@angular/material/tooltip';

// Pipes & Models
import { NgxMaskPipe } from 'ngx-mask';
import { Escort } from '../../../models/escort';
import { PatientService } from '../../../services/patient-service';

// Dialogs Components
import { CreatePatientEscortComponent } from '../create-patient-escort-component/create-patient-escort-component';
import { DeletePatientEscortComponent } from '../delete-patient-escort-component/delete-patient-escort-component';
import { ShowPatientEscortComponent } from '../show-patient-escort-component/show-patient-escort-component';
import { UpdatePatientEscortComponent } from '../update-patient-escort-component/update-patient-escort-component';

interface PermissionItem {
  name: string;
}

interface RolePermission {
  permissions: PermissionItem[];
}

@Component({
  selector: 'app-patient-escorts-component',
  imports: [
    FormsModule,
    ReactiveFormsModule,
    MatDialogModule,
    MatButtonModule,
    MatTableModule,
    MatIconModule,
    MatTooltipModule,
    MatProgressSpinnerModule,
    MatSlideToggleModule,
    NgxMaskPipe
  ],
  templateUrl: './patient-escorts-component.html',
  styleUrl: './patient-escorts-component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class PatientEscortsComponent implements OnInit {
  // Injeções de dependência
  protected readonly data = inject(MAT_DIALOG_DATA);
  private readonly dialog = inject(MatDialog);
  private readonly patientService = inject(PatientService);
  private readonly destroyRef = inject(DestroyRef);

  // Propriedades expostas para o Template
  protected readonly displayedColumns: string[] = ['name', 'document', 'cns', 'status', 'actions'];
  protected readonly escortsList = signal<Escort[]>([]);
  protected readonly dataSource = computed(() => new MatTableDataSource(this.escortsList()));
  protected readonly isLoading = signal<boolean>(true);

  ngOnInit(): void {
    this.fetchPatientEscorts(true);
  }

  /**
   * Busca os acompanhantes do paciente de forma reativa.
   */
  private fetchPatientEscorts(showLoading = false): void {
    if (showLoading) {
      this.isLoading.set(true);
    }

    this.patientService.getPatientEscorts(this.data.patient_care.id)
      .pipe(
        finalize(() => {
          if (showLoading) {
            this.isLoading.set(false);
          }
        }),
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe({
        next: (response) => {
          this.escortsList.set(response);
        }
      });
  }

  /**
   * Centraliza a abertura de modais com tratamento automático do afterClosed
   */
  private openDialog(component: any, data: any, options: { width?: string; height?: string; refreshWithLoading?: boolean } = {}): void {
    this.dialog.open(component, {
      width: options.width || '800px',
      height: options.height || '700px',
      disableClose: true,
      autoFocus: false,
      data
    }).afterClosed()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((result) => {
        if (result) {
          this.fetchPatientEscorts(options.refreshWithLoading || false);
        }
      });
  }

  // Métodos de ação disparados pelo template HTML
  protected showPatientEscort(escort: Escort): void {
    this.openDialog(ShowPatientEscortComponent, 
      { escort }, 
      { height: 'auto' }
    );
  }

  protected createPatientEscort(): void {
    this.openDialog(CreatePatientEscortComponent, 
      { patient_care: this.data.patient_care }, 
      { height: 'auto' }
    );
  }

  protected updatePatientEscort(escort: Escort): void {
    this.openDialog(UpdatePatientEscortComponent, 
      { patient_care: this.data.patient_care, escort },
      { height: 'auto' }
    );
  }

  protected deletePatientEscort(escort: Escort): void {
    this.openDialog(
      DeletePatientEscortComponent, 
      { escort }, 
      { width: '400px', height: 'auto', refreshWithLoading: true }
    );
  }
}