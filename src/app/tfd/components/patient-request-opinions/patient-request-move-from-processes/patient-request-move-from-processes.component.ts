import { ChangeDetectionStrategy, Component, inject, ChangeDetectorRef, DestroyRef, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { finalize } from 'rxjs/operators';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';

import { PatientRequestOpinionService } from '../../../services/patient-request-opinion.service';
import { MessageService } from '../../../../core/services/message-service';

@Component({
  selector: 'app-patient-request-move-from-processes',
  standalone: true,
  imports: [
    CommonModule, 
    MatDialogModule, 
    MatButtonModule, 
    MatProgressSpinnerModule
  ],
  templateUrl: './patient-request-move-from-processes.component.html',
  styleUrl: './patient-request-move-from-processes.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush // ⚡ Performance máxima com OnPush + Signals
})
export class PatientRequestMoveFromProcessesComponent {
  // Injeções de Dependência
  protected readonly data = inject(MAT_DIALOG_DATA);
  private readonly opinionService = inject(PatientRequestOpinionService);
  private readonly messageService = inject(MessageService);
  private readonly dialogRef = inject(MatDialogRef<PatientRequestMoveFromProcessesComponent>);
  private readonly cdr = inject(ChangeDetectorRef);
  private readonly destroyRef = inject(DestroyRef);

  // Estados gerenciados reativamente via Signals
  protected readonly isSubmitting = signal<boolean>(false);

  // --- MÉTODOS DE AÇÃO DO TEMPLATE (PROTECTED) ---

  /**
   * Dispara a requisição para movimentar a solicitação para a caixa de entrada
   */
  protected onSubmit(): void {
    const requestType = this.data?.type;
    const requestId = this.data?.patient_request?.id;

    if (!requestId) {
      this.messageService.showMessage('Erro: Identificador da solicitação não encontrado.');
      return;
    }

    this.isSubmitting.set(true);
    this.cdr.markForCheck(); // ⚡ Força a atualização do DOM para renderizar o spinner imediatamente

    this.opinionService.movePatientRequestFromProcesses(requestType, requestId)
      .pipe(
        finalize(() => {
          this.isSubmitting.set(false);
          this.cdr.markForCheck(); // ⚡ Garante o desligamento do spinner visual
        }),
        takeUntilDestroyed(this.destroyRef) // 🛡️ Proteção contra memory leaks
      )
      .subscribe({
        next: (response: any) => {
          this.messageService.showMessage(response?.message || 'Solicitação movimentada com sucesso!');
          this.dialogRef.close(true); // Retorna true para sinalizar sucesso à listagem pai
        },
        error: (err) => {
          const fallbackError = 'Ocorreu um erro ao tentar movimentar a solicitação.';
          this.messageService.showMessage(err?.error?.message || fallbackError);
        },
      });
  }
}