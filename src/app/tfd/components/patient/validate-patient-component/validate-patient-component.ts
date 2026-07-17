import { ChangeDetectionStrategy, Component, inject, ChangeDetectorRef, DestroyRef, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { finalize } from 'rxjs';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';

import { PatientService } from '../../../services/patient-service';
import { MessageService } from '../../../../core/services/message-service';

@Component({
  selector: 'app-validate-patient-component',
  standalone: true,
  imports: [
    CommonModule,
    MatDialogModule,
    MatButtonModule,
    MatProgressSpinnerModule
  ],
  templateUrl: './validate-patient-component.html',
  styleUrl: './validate-patient-component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ValidatePatientComponent {
  // Injeções de Dependência Dinâmicas
  protected readonly data = inject(MAT_DIALOG_DATA);
  private readonly patientService = inject(PatientService);
  private readonly messageService = inject(MessageService);
  private readonly dialogRef = inject(MatDialogRef<ValidatePatientComponent>);
  private readonly cdr = inject(ChangeDetectorRef);
  private readonly destroyRef = inject(DestroyRef);

  // Estados gerenciados reativamente via Signals
  protected readonly isSubmitting = signal<boolean>(false);

  // --- MÉTODOS DE AÇÃO DO TEMPLATE (PROTECTED) ---

  protected onSubmit(): void {
    const patientCareId = this.data?.patient_care?.id;
    if (!patientCareId) {
      this.messageService.showMessage('Erro: Identificador do atendimento não encontrado.');
      return;
    }

    this.isSubmitting.set(true);
    this.cdr.markForCheck(); // ⚡ Força a atualização do DOM para pintar o spinner imediatamente no OnPush

    const isValid = this.data?.patient_care?.is_valid;
    const acaoSucesso = isValid ? 'invalidado' : 'validado';
    const acaoErro = isValid ? 'invalidar' : 'validar';

    this.patientService.validatePatient(patientCareId)
      .pipe(
        finalize(() => {
          this.isSubmitting.set(false);
          this.cdr.markForCheck(); // ⚡ Garante o desligamento do loading visual na tela
        }),
        takeUntilDestroyed(this.destroyRef) // 🛡️ Proteção reativa contra memory leaks se fecharem o modal rápido
      )
      .subscribe({
        next: (response: any) => {
          this.messageService.showMessage(response?.message || `Atendimento ${acaoSucesso} com sucesso!`);
          this.dialogRef.close(true);
        },
        error: (err) => {
          const errorMessage = err?.error?.message || `Ocorreu um erro ao tentar ${acaoErro} o atendimento.`;
          this.messageService.showMessage(errorMessage);
        }
      });
  }
}