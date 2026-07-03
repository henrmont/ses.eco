import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';

// Serviços
import { CostAssistanceService } from '../../../services/cost-assistance-service';
import { MessageService } from '../../../../core/services/message-service';

@Component({
  selector: 'app-delete-cost-assistance-component',
  standalone: true,
  imports: [
    MatDialogModule, 
    MatButtonModule, 
    MatProgressSpinnerModule
  ],
  templateUrl: './delete-cost-assistance-component.html',
  styleUrl: './delete-cost-assistance-component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush // ⚡ Performance máxima com OnPush + Signals
})
export class DeleteCostAssistanceComponent {
  // Injeções de Dependência modernas via inject()
  protected readonly data = inject(MAT_DIALOG_DATA);
  private readonly costAssistanceService = inject(CostAssistanceService);
  private readonly messageService = inject(MessageService);
  private readonly dialogRef = inject(MatDialogRef<DeleteCostAssistanceComponent>);

  // Estado de submissão reativo
  protected readonly isSubmitting = signal<boolean>(false);

  /**
   * Dispara a requisição para remover a ajuda de custo
   */
  protected onSubmit(): void {
    const costAssistanceId = this.data?.cost_assistance?.id;

    if (!costAssistanceId) {
      this.messageService.showMessage('Erro: Identificador da ajuda de custo não encontrado.');
      return;
    }

    this.isSubmitting.set(true);

    this.costAssistanceService.deleteCostAssistance(costAssistanceId).subscribe({
      next: (response: any) => {
        this.messageService.showMessage(response?.message || 'Ajuda de custo removida com sucesso!');
        this.dialogRef.close(true); // Retorna true para sinalizar sucesso à listagem pai
      },
      error: (err) => {
        const errorMessage = err?.error?.message || 'Ocorreu um erro ao tentar remover a ajuda de custo.';
        this.messageService.showMessage(errorMessage);
        this.isSubmitting.set(false);
      },
    });
  }
}