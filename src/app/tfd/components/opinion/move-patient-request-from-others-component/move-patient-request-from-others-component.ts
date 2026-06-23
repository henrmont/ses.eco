import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';

import { OpinionService } from '../../../services/opinion-service';
import { MessageService } from '../../../../core/services/message-service';

@Component({
  selector: 'app-move-patient-request-from-others-component',
  standalone: true,
  imports: [MatDialogModule, MatButtonModule, MatProgressSpinnerModule],
  templateUrl: './move-patient-request-from-others-component.html',
  styleUrl: './move-patient-request-from-others-component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush // ⚡ Performance máxima com OnPush + Signals
})
export class MovePatientRequestFromOthersComponent {
  // Injeções de Dependência modernas via inject()
  protected readonly data = inject(MAT_DIALOG_DATA);
  private readonly opinionService = inject(OpinionService);
  private readonly messageService = inject(MessageService);
  private readonly dialogRef = inject(MatDialogRef<MovePatientRequestFromOthersComponent>);

  // Estado de submissão reativo
  protected readonly isSubmitting = signal<boolean>(false);

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

    this.opinionService.movePatientRequestFromOthers(requestType, requestId).subscribe({
      next: (response: any) => {
        this.messageService.showMessage(response.message || 'Solicitação movimentada com sucesso!');
        this.dialogRef.close(true); // Retorna true para sinalizar sucesso à listagem pai
      },
      error: (err) => {
        const errorMessage = err?.error?.message || 'Ocorreu um erro ao tentar movimentar a solicitação.';
        this.messageService.showMessage(errorMessage);
        this.isSubmitting.set(false); // Reseta o estado em caso de erro para permitir nova tentativa
      },
    });
  }
}