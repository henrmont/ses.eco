import { ChangeDetectionStrategy, Component, DestroyRef, OnInit, computed, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { finalize } from 'rxjs';
import { MatButtonModule } from '@angular/material/button';
import { MAT_DIALOG_DATA, MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatTableDataSource, MatTableModule } from '@angular/material/table';
import { MatTooltipModule } from '@angular/material/tooltip';
import { NgxMaskPipe } from 'ngx-mask';
import { Escort } from '../../../models/escort';
import { PatientService } from '../../../services/patient-service';
import { CreatePatientEscortComponent } from '../create-patient-escort-component/create-patient-escort-component';
import { DeletePatientEscortComponent } from '../delete-patient-escort-component/delete-patient-escort-component';
import { ShowPatientEscortComponent } from '../show-patient-escort-component/show-patient-escort-component';
import { UpdatePatientEscortComponent } from '../update-patient-escort-component/update-patient-escort-component';
import { Overlay } from '@angular/cdk/overlay';

@Component({
  selector: 'app-patient-escorts-component',
  standalone: true,
  imports: [
    CommonModule,
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
  // Injeções de dependência estáticas e dinâmicas
  protected readonly data = inject(MAT_DIALOG_DATA);
  private readonly dialog = inject(MatDialog);
  private readonly overlay = inject(Overlay);
  private readonly patientService = inject(PatientService);
  private readonly destroyRef = inject(DestroyRef);

  // Propriedades expostas para o Template
  protected readonly displayedColumns: string[] = ['name', 'document', 'cns', 'status', 'actions'];
  protected readonly escortsList = signal<Escort[]>([]);
  protected readonly dataSource = computed(() => new MatTableDataSource<Escort>(this.escortsList()));
  protected readonly isLoading = signal<boolean>(true);

  ngOnInit(): void {
    this.fetchPatientEscorts(true);
  }

  /**
   * Busca os acompanhantes do paciente de forma reativa e atualiza os signals.
   */
  private fetchPatientEscorts(showLoading: boolean = false): void {
    if (showLoading) {
      this.isLoading.set(true);
    }

    this.patientService.getPatientEscorts(this.data.patient_care.id)
      .pipe(
        finalize(() => {
          this.isLoading.set(false);
        }),
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe({
        next: (response: Escort[]) => {
          this.escortsList.set(response || []);
        },
        error: () => {
          this.escortsList.set([]);
        }
      });
  }

  /**
   * Centraliza a abertura de modais com tratamento automático do afterClosed
   */
  private openDialog(component: any, data: any, width = '800px', height = 'auto', requiresRefresh = true): void {
    this.dialog.open(component, {
      width,
      height,
      disableClose: true,
      autoFocus: false,
      scrollStrategy: this.overlay.scrollStrategies.noop(),
      data
    }).afterClosed()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((result) => {
        if (result) {
          this.fetchPatientEscorts(requiresRefresh || false);
        }
      });
  }

  // --- MÉTODOS DE AÇÃO DISPARADOS PELO TEMPLATE HTML (PROTECTED) ---

  protected showPatientEscort(escort: Escort): void {
    this.openDialog(ShowPatientEscortComponent, { escort });
  }

  protected createPatientEscort(): void {
    this.openDialog(CreatePatientEscortComponent, { patient_care: this.data.patient_care });
  }

  protected updatePatientEscort(escort: Escort): void {
    this.openDialog(UpdatePatientEscortComponent, { patient_care: this.data.patient_care, escort });
  }

  protected deletePatientEscort(escort: Escort): void {
    this.openDialog(DeletePatientEscortComponent, { escort }, '400px', 'auto', false);
  }
}