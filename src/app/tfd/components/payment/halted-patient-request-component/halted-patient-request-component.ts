import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { finalize } from 'rxjs';
import { MessageService } from '../../../../core/services/message-service';
import { PaymentService } from '../../../services/payment-service';

@Component({
  selector: 'app-halted-patient-request-component',
  standalone: true,
  imports: [
    MatDialogModule, 
    MatButtonModule, 
    MatProgressSpinnerModule
  ],
  templateUrl: './halted-patient-request-component.html',
  styleUrl: './halted-patient-request-component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush // ⚡ Performance máxima com OnPush + Signals
})
export class HaltedPatientRequestComponent {
  // 🔒 Injeções de Dependência modernas via inject()
  protected readonly data = inject(MAT_DIALOG_DATA);
  private readonly paymentService = inject(PaymentService);
  private readonly messageService = inject(MessageService);
  private readonly dialogRef = inject(MatDialogRef<HaltedPatientRequestComponent>);

  // ⚡ Estado de submissão reativo controlado via Signal
  protected readonly isSubmitting = signal<boolean>(false);

  /**
   * Dispara a requisição para alternar o estado de sobrestado (bookmark) do pagamento
   */
  protected onSubmit(): void {
    const requestId = this.data?.patient_request?.id;

    if (!requestId) {
      this.messageService.showMessage('Erro: Identificador da solicitação não encontrado.');
      return;
    }

    this.isSubmitting.set(true);

    this.paymentService.haltedPatientRequest(requestId)
      .pipe(
        // Garante que o loading seja desativado independente de sucesso ou erro na chamada de rede
        finalize(() => this.isSubmitting.set(false))
      )
      .subscribe({
        next: (response: any) => {
          this.messageService.showMessage(response.message || 'Status da solicitação atualizado com sucesso!');
          this.dialogRef.close(true); // Retorna true para que a grid principal saiba que precisa recarregar
        },
        error: (err) => {
          const errorMessage = err?.error?.message || 'Ocorreu um erro operacional ao tentar alterar o status da solicitação.';
          this.messageService.showMessage(errorMessage);
        },
      });
  }
}