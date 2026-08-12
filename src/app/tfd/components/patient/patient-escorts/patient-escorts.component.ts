import { ChangeDetectionStrategy, Component, DestroyRef, OnInit, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { finalize } from 'rxjs';
import { MatButtonModule } from '@angular/material/button';
import { MAT_DIALOG_DATA, MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTableModule } from '@angular/material/table';
import { MatTooltipModule } from '@angular/material/tooltip';
import { NgxMaskPipe } from 'ngx-mask';
import { Overlay } from '@angular/cdk/overlay';

import { PatientEscort } from '../../../models/patient-escort.model';
import { PatientService } from '../../../services/patient.service';
import { PatientEscortDetailComponent } from '../patient-escort-detail/patient-escort-detail.component';
import { PatientEscortCreateComponent } from '../patient-escort-create/patient-escort-create.component';
import { PatientEscortUpdateComponent } from '../patient-escort-update/patient-escort-update.component';
import { PatientEscortDeleteComponent } from '../patient-escort-delete/patient-escort-delete.component';

@Component({
  selector: 'app-patient-escorts',
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
    NgxMaskPipe
  ],
  templateUrl: './patient-escorts.component.html',
  styleUrl: './patient-escorts.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class PatientEscortsComponent implements OnInit {
  // Injeções de dependência
  protected readonly data = inject(MAT_DIALOG_DATA, { optional: true });
  private readonly dialog = inject(MatDialog);
  private readonly overlay = inject(Overlay);
  private readonly patientService = inject(PatientService);
  private readonly destroyRef = inject(DestroyRef);

  // Propriedades expostas para o Template
  protected readonly displayedColumns: string[] = ['name', 'document', 'cns', 'status', 'actions'];
  protected readonly escortsList = signal<PatientEscort[]>([]);
  protected readonly isLoading = signal<boolean>(true);

  ngOnInit(): void {
    this.fetchPatientEscorts(true);
  }

  /**
   * Busca os acompanhantes do paciente de forma reativa e atualiza o signal.
   */
  private fetchPatientEscorts(showLoading: boolean = false): void {
    const patientCareId = this.data?.patientCare?.id;

    if (!patientCareId) {
      this.isLoading.set(false);
      return;
    }

    if (showLoading) {
      this.isLoading.set(true);
    }

    this.patientService.getPatientEscorts(patientCareId)
      .pipe(
        finalize(() => this.isLoading.set(false)),
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe({
        next: (response: PatientEscort[]) => this.escortsList.set(response || []),
        error: () => this.escortsList.set([])
      });
  }

  /**
   * Centraliza a abertura de modais com tratamento automático do afterClosed
   */
  private openDialog(component: any, data: any, width = '800px', height = 'auto', showLoadingOnRefresh = true): void {
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
          this.fetchPatientEscorts(showLoadingOnRefresh);
        }
      });
  }

  // --- MÉTODOS DE AÇÃO DISPARADOS PELO TEMPLATE HTML ---

  protected showPatientEscort(patientEscort: PatientEscort): void {
    this.openDialog(PatientEscortDetailComponent, { patientEscort }, '800px', 'auto', false);
  }

  protected createPatientEscort(): void {
    this.openDialog(PatientEscortCreateComponent, { patientCare: this.data?.patientCare });
  }

  protected updatePatientEscort(patientEscort: PatientEscort): void {
    this.openDialog(PatientEscortUpdateComponent, { patientCare: this.data?.patientCare, patientEscort });
  }

  protected deletePatientEscort(patientEscort: PatientEscort): void {
    this.openDialog(PatientEscortDeleteComponent, { patientEscort }, '400px', 'auto', true);
  }
}