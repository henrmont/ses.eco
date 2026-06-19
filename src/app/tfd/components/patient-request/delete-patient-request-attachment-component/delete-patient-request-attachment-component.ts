import { ChangeDetectionStrategy, Component, inject, signal, ChangeDetectorRef, DestroyRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { finalize } from 'rxjs';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';

import { PatientRequestService } from '../../../services/patient-request-service';
import { MessageService } from '../../../../core/services/message-service';

@Component({
  selector: 'app-delete-patient-request-attachment-component',
  standalone: true,
  imports: [
    CommonModule, 
    MatDialogModule, 
    MatButtonModule, 
    MatProgressSpinnerModule
  ],
  templateUrl: './delete-patient-request-attachment-component.html',
  styleUrl: './delete-patient-request-attachment-component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush // ⚡ Performance máxima com OnPush + Signals
})
export class DeletePatientRequestAttachmentComponent {
  // Injeções de Dependência modernas via inject()
  protected readonly data = inject(MAT_DIALOG_DATA);
  private readonly patientRequestService = inject(PatientRequestService);
  private readonly messageService = inject(MessageService);
  private readonly dialogRef = inject(MatDialogRef<DeletePatientRequestAttachmentComponent>);
  private readonly cdr = inject(ChangeDetectorRef);
  private readonly destroyRef = inject(DestroyRef);

  // Estado de submissão reativo
  protected readonly isSubmitting = signal<boolean>(false);

  /**
   * Dispara a requisição para remover o anexo da solicitação do paciente
   */
  protected onSubmit(): void {
    const attachmentId = this.data?.patient_request_attachment?.id;

    if (!attachmentId) {
      this.messageService.showMessage('Erro: Identificador do anexo não encontrado.');
      return;
    }

    this.isSubmitting.set(true);
    this.cdr.markForCheck();

    this.patientRequestService.deletePatientRequestAttachment(attachmentId)
      .pipe(
        finalize(() => {
          this.isSubmitting.set(false);
          this.cdr.markForCheck();
        }),
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe({
        next: (response: any) => {
          this.messageService.showMessage(response.message || 'Anexo removido com sucesso!');
          this.dialogRef.close(true); // Retorna true para sinalizar sucesso à listagem pai
        },
        error: (err) => {
          const errorMessage = err?.error?.message || 'Ocorreu um erro ao tentar remover o anexo.';
          this.messageService.showMessage(errorMessage);
        },
      });
  }
}