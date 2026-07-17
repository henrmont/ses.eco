import { ChangeDetectionStrategy, ChangeDetectorRef, Component, DestroyRef, inject, signal } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { PatientService } from '../../../services/patient-service';
import { MessageService } from '../../../../core/services/message-service';
import { finalize } from 'rxjs';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';

@Component({
  selector: 'app-delete-report-attachment-component',
  imports: [MatDialogModule, MatButtonModule, MatProgressSpinnerModule],
  templateUrl: './delete-report-attachment-component.html',
  styleUrl: './delete-report-attachment-component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush // ⚡ Performance máxima com OnPush + Signals
})
export class DeleteReportAttachmentComponent {
  // Injeções de Dependência Dinâmicas
  protected readonly data = inject(MAT_DIALOG_DATA);
  private readonly patientService = inject(PatientService);
  private readonly messageService = inject(MessageService);
  private readonly dialogRef = inject(MatDialogRef<DeleteReportAttachmentComponent>);
  private readonly cdr = inject(ChangeDetectorRef);
  private readonly destroyRef = inject(DestroyRef);

  // Estados gerenciados reativamente via Signals
  protected readonly isSubmitting = signal<boolean>(false);

  // --- MÉTODOS DE AÇÃO DO TEMPLATE (PROTECTED) ---

  /**
   * Dispara a requisição para remover o anexo da solicitação do paciente
   */
  protected onSubmit(): void {
    const attachmentId = this.data?.report_attachment?.id;

    if (!attachmentId) {
      this.messageService.showMessage('Identificador do anexo não encontrado.');
      return;
    }

    this.isSubmitting.set(true);
    this.cdr.markForCheck(); // ⚡ Força a atualização do DOM para pintar o spinner imediatamente no OnPush

    this.patientService.deleteReportAttachment(attachmentId)
      .pipe(
        finalize(() => {
          this.isSubmitting.set(false);
          this.cdr.markForCheck(); // ⚡ Garante o desligamento do loading visual na tela
        }),
        takeUntilDestroyed(this.destroyRef) // 🛡️ Proteção reativa contra memory leaks
      )
      .subscribe({
        next: (response) => {
          this.messageService.showMessage(response?.message || 'Anexo removido com sucesso!');
          this.dialogRef.close(true); // Retorna true para atualizar a listagem pai
        },
        error: (err) => {
          const fallbackError = 'Ocorreu um erro ao tentar remover o anexo.';
          this.messageService.showMessage(err?.error?.message || fallbackError);
        },
      });
  }
  
}