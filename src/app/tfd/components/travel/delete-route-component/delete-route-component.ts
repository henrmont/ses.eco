import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { TravelService } from '../../../services/travel-service';
import { MessageService } from '../../../../core/services/message-service';

@Component({
  selector: 'app-delete-route-component',
  standalone: true,
  imports: [MatDialogModule, MatButtonModule, MatProgressSpinnerModule],
  templateUrl: './delete-route-component.html',
  styleUrl: './delete-route-component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush // ⚡ Performance máxima com OnPush + Signals
})
export class DeleteRouteComponent {
  // Injeções de Dependência modernas via inject()
  protected readonly data = inject(MAT_DIALOG_DATA);
  private readonly travelService = inject(TravelService);
  private readonly messageService = inject(MessageService);
  private readonly dialogRef = inject(MatDialogRef<DeleteRouteComponent>);

  // Estado de submissão reativo
  protected readonly isSubmitting = signal<boolean>(false);

  /**
   * Dispara a requisição para remover a rota
   */
  protected onSubmit(): void {
    const routeId = this.data?.route?.id;

    if (!routeId) {
      this.messageService.showMessage('Erro: Identificador da rota não encontrado.');
      return;
    }

    this.isSubmitting.set(true);

    this.travelService.deleteRoute(routeId).subscribe({
      next: (response: any) => {
        this.messageService.showMessage(response?.message || 'Rota removida com sucesso!');
        this.dialogRef.close(true); // Retorna true para sinalizar sucesso à listagem pai
      },
      error: (err) => {
        const errorMessage = err?.error?.message || 'Ocorreu um erro ao tentar remover a rota.';
        this.messageService.showMessage(errorMessage);
        this.isSubmitting.set(false);
      },
    });
  }
}