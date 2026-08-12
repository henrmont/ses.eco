import { ChangeDetectionStrategy, Component, DestroyRef, inject, signal } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { finalize } from 'rxjs';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';

import { PatientService } from '../../../services/patient.service';
import { MessageService } from '../../../../core/services/message-service';
import { ApiResponse } from '../../../../core/models/api-response.model';

@Component({
  selector: 'app-patient-archive',
  standalone: true,
  imports: [
    MatDialogModule,
    MatButtonModule,
    MatProgressSpinnerModule
  ],
  templateUrl: './patient-archive.component.html',
  styleUrl: './patient-archive.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class PatientArchiveComponent {
  // Injeções de Dependência
  protected readonly data = inject(MAT_DIALOG_DATA, { optional: true });
  private readonly patientService = inject(PatientService);
  private readonly messageService = inject(MessageService);
  private readonly dialogRef = inject(MatDialogRef<PatientArchiveComponent>);
  private readonly destroyRef = inject(DestroyRef);

  // Estado Reativo via Signal
  protected readonly isSubmitting = signal<boolean>(false);

  protected onSubmit(): void {
    const patientCareId = this.data?.patientCare?.id;
    if (!patientCareId) {
      this.messageService.showMessage('Erro: Identificador do atendimento não encontrado.');
      return;
    }

    this.isSubmitting.set(true);

    this.patientService.archivePatient(patientCareId)
      .pipe(
        finalize(() => this.isSubmitting.set(false)),
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe({
        next: (response: ApiResponse) => {
          this.messageService.showMessage(response?.message || 'Paciente arquivado com sucesso!');
          this.dialogRef.close(true);
        },
        error: (err) => {
          const fallbackMessage = 'Ocorreu um erro ao tentar arquivar o paciente.';
          this.messageService.showMessage(err?.error?.message || fallbackMessage);
        }
      });
  }
}