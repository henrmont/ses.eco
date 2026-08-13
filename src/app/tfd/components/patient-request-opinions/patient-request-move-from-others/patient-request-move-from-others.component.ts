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
  selector: 'app-patient-request-move-from-others',
  standalone: true,
  imports: [
    CommonModule, 
    MatDialogModule, 
    MatButtonModule, 
    MatProgressSpinnerModule
  ],
  templateUrl: './patient-request-move-from-others.component.html',
  styleUrl: './patient-request-move-from-others.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush // ⚡ Performance máxima com OnPush + Signals
})
export class PatientRequestMoveFromOthersComponent {
  // Injeções de Dependência
  protected readonly data = inject(MAT_DIALOG_DATA);
  private readonly opinionService = inject(PatientRequestOpinionService);
  private readonly messageService = inject(MessageService);
  private readonly dialogRef = inject(MatDialogRef<PatientRequestMoveFromOthersComponent>);
  private readonly cdr = inject(ChangeDetectorRef);
  private readonly destroyRef = inject(DestroyRef);

  // Estados gerenciados reativamente via Signals
  protected readonly isSubmitting = signal<boolean>(false);

  // --- MÉTODOS DE AÇÃO DO TEMPLATE (PROTECTED) ---

  /**
   * Dispara a requisição para movimentar a solicitação dentro do contexto de Opinion
   */
  protected onSubmit(): void {
    const requestType = this.data?.type;
    const requestId = this.data?.patient_request?.id;

    if (!requestId) {
      this.messageService.showMessage('Erro: Identificador da solicitação não encontrado.');
      return;
    }

    this.isSubmitting.set(true);
    this.cdr.markForCheck(); // ⚡ Força a atualização do DOM para pintar o spinner imediatamente no OnPush

    this.opinionService.movePatientRequestFromOthers(requestType, requestId)
      .pipe(
        finalize(() => {
          this.isSubmitting.set(false);
          this.cdr.markForCheck(); // ⚡ Garante o desligamento do loading visual na tela
        }),
        takeUntilDestroyed(this.destroyRef) // 🛡️ Proteção contra memory leaks se fecharem o modal rápido
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