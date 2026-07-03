import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';

import { CostAssistanceService } from '../../../services/cost-assistance-service';
import { MessageService } from '../../../../core/services/message-service';

@Component({
  selector: 'app-move-patient-request-from-processes-component',
  standalone: true,
  imports: [
    CommonModule,
    MatDialogModule, 
    MatButtonModule, 
    MatProgressSpinnerModule
  ],
  templateUrl: './move-patient-request-from-processes-component.html',
  styleUrl: './move-patient-request-from-processes-component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class MovePatientRequestFromProcessesComponent {
  protected readonly data = inject(MAT_DIALOG_DATA);
  private readonly costAssistanceService = inject(CostAssistanceService);
  private readonly messageService = inject(MessageService);
  private readonly dialogRef = inject(MatDialogRef<MovePatientRequestFromProcessesComponent>);

  protected readonly isSubmitting = signal<boolean>(false);

  protected onSubmit(): void {
    const requestId = this.data?.patient_request?.id;

    if (!requestId) {
      this.messageService.showMessage('Erro: Identificador da solicitação não encontrado.');
      return;
    }

    this.isSubmitting.set(true);

    // 🎯 Ajustado para passar apenas o ID, respeitando o seu service real
    this.costAssistanceService.movePatientRequestFromProcesses(requestId).subscribe({
      next: (response: any) => {
        this.messageService.showMessage(response.message || 'Solicitação movimentada com sucesso!');
        this.dialogRef.close(true);
      },
      error: (err) => {
        const errorMessage = err?.error?.message || 'Ocorreu um erro ao tentar movimentar a solicitação.';
        this.messageService.showMessage(errorMessage);
        this.isSubmitting.set(false);
      },
    });
  }
}