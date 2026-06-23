import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';

import { OpinionService } from '../../../services/opinion-service';
import { MessageService } from '../../../../core/services/message-service';

@Component({
  selector: 'app-archive-patient-request-component',
  standalone: true,
  imports: [MatDialogModule, MatButtonModule, MatProgressSpinnerModule],
  templateUrl: './archive-patient-request-component.html',
  styleUrl: './archive-patient-request-component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush // ⚡ Performance máxima com OnPush + Signals
})
export class ArchivePatientRequestComponent {
  // Injeções de Dependência modernas via inject()
  protected readonly data = inject(MAT_DIALOG_DATA);
  private readonly opinionService = inject(OpinionService);
  private readonly messageService = inject(MessageService);
  private readonly dialogRef = inject(MatDialogRef<ArchivePatientRequestComponent>);

  // Estado de submissão reativo
  protected readonly isSubmitting = signal<boolean>(false);

  /**
   * Dispara a requisição para arquivar a solicitação
   */
  protected onSubmit(): void {
    const requestId = this.data?.patient_request?.id;

    if (!requestId) {
      this.messageService.showMessage('Erro: Identificador da solicitação não encontrado.');
      return;
    }

    this.isSubmitting.set(true);

    this.opinionService.archivePatientRequest(requestId).subscribe({
      next: (response: any) => {
        this.messageService.showMessage(response.message || 'Solicitação arquivada com sucesso!');
        this.dialogRef.close(true); // Retorna true para atualizar a grid/listagem pai
      },
      error: (err) => {
        const errorMessage = err?.error?.message || 'Ocorreu um erro ao tentar arquivar a solicitação.';
        this.messageService.showMessage(errorMessage);
        this.isSubmitting.set(false); // Reseta o estado em caso de erro para nova tentativa
      },
    });
  }
}