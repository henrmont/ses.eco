import { ChangeDetectionStrategy, Component, inject, ChangeDetectorRef, DestroyRef, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { finalize } from 'rxjs';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';

import { PatientRequestService } from '../../../services/patient-request-service';
import { MessageService } from '../../../../core/services/message-service';

@Component({
  selector: 'app-halted-patient-request-component',
  imports: [
    CommonModule,
    MatDialogModule,
    MatButtonModule,
    MatProgressSpinnerModule
  ],
  templateUrl: './halted-patient-request-component.html',
  styleUrl: './halted-patient-request-component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class HaltedPatientRequestComponent {
  // Injeções de Dependência Dinâmicas
  protected readonly data = inject(MAT_DIALOG_DATA);
  private readonly patientRequestService = inject(PatientRequestService);
  private readonly messageService = inject(MessageService);
  private readonly dialogRef = inject(MatDialogRef<HaltedPatientRequestComponent>);
  private readonly cdr = inject(ChangeDetectorRef);
  private readonly destroyRef = inject(DestroyRef);

  // Estados gerenciados reativamente via Signals
  protected readonly isSubmitting = signal<boolean>(false);

  // --- MÉTODOS DE AÇÃO DO TEMPLATE (PROTECTED) ---

  protected onSubmit(): void {
    const patientRequestId = this.data?.patient_request?.id;
    if (!patientRequestId) {
      this.messageService.showMessage('Identificador da solicitação inválido.');
      return;
    }

    this.isSubmitting.set(true);
    this.cdr.markForCheck(); // ⚡ Força a atualização do DOM para pintar o spinner imediatamente no OnPush

    this.patientRequestService.haltedPatientRequest(patientRequestId)
      .pipe(
        finalize(() => {
          this.isSubmitting.set(false);
          this.cdr.markForCheck(); // ⚡ Garante o desligamento do loading visual na tela
        }),
        takeUntilDestroyed(this.destroyRef) // 🛡️ Proteção reativa contra memory leaks se fecharem o modal rápido
      )
      .subscribe({
        next: (response) => {
          this.messageService.showMessage(response?.message || 'Solicitação paralisada com sucesso!');
          this.dialogRef.close(true);
        },
        error: (err) => {
          const fallbackMessage = 'Erro ao tentar paralisar a solicitação.';
          this.messageService.showMessage(err?.error?.message || fallbackMessage);
        },
      });
  }
}