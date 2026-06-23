import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';

import { OpinionService } from '../../../services/opinion-service';
import { MessageService } from '../../../../core/services/message-service';

@Component({
  selector: 'app-delete-opinion-component',
  standalone: true,
  imports: [
    MatDialogModule, 
    MatButtonModule, 
    MatProgressSpinnerModule
  ],
  templateUrl: './delete-opinion-component.html',
  styleUrl: './delete-opinion-component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush // ⚡ Performance máxima com OnPush + Signals
})
export class DeleteOpinionComponent {
  // Injeções de Dependência modernas via inject()
  protected readonly data = inject(MAT_DIALOG_DATA);
  private readonly opinionService = inject(OpinionService);
  private readonly messageService = inject(MessageService);
  private readonly dialogRef = inject(MatDialogRef<DeleteOpinionComponent>);

  // Estado de submissão reativo controlado por Signals
  protected readonly isSubmitting = signal<boolean>(false);

  /**
   * Dispara a requisição para remover o parecer cadastrado
   */
  protected onSubmit(): void {
    const opinionId = this.data?.opinion?.id;

    // Guarda preventiva para evitar chamadas de API inválidas (Padrão de referência)
    if (!opinionId) {
      this.messageService.showMessage('Erro: Identificador do parecer não encontrado.');
      return;
    }

    this.isSubmitting.set(true);

    this.opinionService.deleteOpinion(opinionId).subscribe({
      next: (response: any) => {
        this.messageService.showMessage(response.message || 'Parecer removido com sucesso!');
        this.dialogRef.close(true); // Retorna true para sinalizar que a listagem pai precisa recarregar
      },
      error: (err) => {
        const errorMessage = err?.error?.message || 'Ocorreu um erro ao tentar remover o parecer.';
        this.messageService.showMessage(errorMessage);
        this.isSubmitting.set(false);
      },
    });
  }
}