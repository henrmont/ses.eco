import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { TravelService } from '../../../services/travel-service';
import { MessageService } from '../../../../core/services/message-service';

@Component({
  selector: 'app-delete-passenger-component',
  standalone: true,
  imports: [MatDialogModule, MatButtonModule, MatProgressSpinnerModule],
  templateUrl: './delete-passenger-component.html',
  styleUrl: './delete-passenger-component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush // ⚡ Performance máxima com OnPush + Signals
})
export class DeletePassengerComponent {
  // Injeções de Dependência modernas via inject()
  protected readonly data = inject(MAT_DIALOG_DATA);
  private readonly travelService = inject(TravelService);
  private readonly messageService = inject(MessageService);
  private readonly dialogRef = inject(MatDialogRef<DeletePassengerComponent>);

  // Estado de submissão reativo
  protected readonly isSubmitting = signal<boolean>(false);

  /**
   * Dispara a requisição para remover o passageiro
   */
  protected onSubmit(): void {
    const passengerId = this.data?.passenger?.id;

    if (!passengerId) {
      this.messageService.showMessage('Erro: Identificador do passageiro não encontrado.');
      return;
    }

    this.isSubmitting.set(true);

    this.travelService.deletePassenger(passengerId).subscribe({
      next: (response: any) => {
        this.messageService.showMessage(response?.message || 'Passageiro removido com sucesso!');
        this.dialogRef.close(true); // Retorna true para sinalizar sucesso à listagem pai
      },
      error: (err) => {
        const errorMessage = err?.error?.message || 'Ocorreu um erro ao tentar remover o passageiro.';
        this.messageService.showMessage(errorMessage);
        this.isSubmitting.set(false);
      },
    });
  }
}