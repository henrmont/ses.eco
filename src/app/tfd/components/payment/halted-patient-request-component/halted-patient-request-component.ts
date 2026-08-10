import { ChangeDetectionStrategy, Component, inject, ChangeDetectorRef, DestroyRef, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { finalize } from 'rxjs';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';

import { MessageService } from '../../../../core/services/message-service';
import { PaymentService } from '../../../services/payment-service';

@Component({
  selector: 'app-halted-patient-request-component',
  standalone: true,
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
  // Injeções de Dependência
  protected readonly data = inject(MAT_DIALOG_DATA);
  private readonly paymentService = inject(PaymentService);
  private readonly messageService = inject(MessageService);
  private readonly dialogRef = inject(MatDialogRef<HaltedPatientRequestComponent>);
  private readonly cdr = inject(ChangeDetectorRef);
  private readonly destroyRef = inject(DestroyRef);

  // Estado de submissão reativo via Signal
  protected readonly isSubmitting = signal<boolean>(false);

  /**
   * Dispara a requisição para paralisar/sobrestar a solicitação de viagem do paciente
   */
  protected onSubmit(): void {
    const requestId = this.data?.patient_request?.id;

    if (!requestId) {
      this.messageService.showMessage('Erro: Identificador da solicitação não encontrado.');
      return;
    }

    this.isSubmitting.set(true);
    this.cdr.markForCheck(); // ⚡ Força a renderização imediata do spinner no OnPush

    this.paymentService.haltedPatientRequest(requestId)
      .pipe(
        finalize(() => {
          this.isSubmitting.set(false);
          this.cdr.markForCheck(); // ⚡ Garante a atualização da UI ao finalizar a requisição
        }),
        takeUntilDestroyed(this.destroyRef) // 🛡️ Evita vazamento de memória se o componente for destruído
      )
      .subscribe({
        next: (response: any) => {
          this.messageService.showMessage(response?.message || 'Status de sobrestamento atualizado!');
          this.dialogRef.close(true); // Retorna sinal positivo para atualizar a tabela principal
        },
        error: (err) => {
          const errorMessage = err?.error?.message || 'Ocorreu um erro operacional ao atualizar o sobrestamento.';
          this.messageService.showMessage(errorMessage);
        },
      });
  }
}