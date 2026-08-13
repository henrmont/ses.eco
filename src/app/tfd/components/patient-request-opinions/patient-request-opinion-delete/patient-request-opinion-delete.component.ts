import { ChangeDetectionStrategy, Component, inject, ChangeDetectorRef, DestroyRef, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { finalize } from 'rxjs/operators';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';

import { PatientRequestOpinionService } from '../../../services/patient-request-opinion.service';
import { MessageService } from '../../../../core/services/message-service';

@Component({
  selector: 'app-patient-request-opinion-delete',
  standalone: true,
  imports: [
    CommonModule, 
    MatDialogModule, 
    MatButtonModule, 
    MatProgressSpinnerModule
  ],
  templateUrl: './patient-request-opinion-delete.component.html',
  styleUrl: './patient-request-opinion-delete.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class PatientRequestOpinionDeleteComponent {
  // Injeções de Dependência Dinâmicas
  protected readonly data = inject(MAT_DIALOG_DATA);
  private readonly opinionService = inject(PatientRequestOpinionService);
  private readonly messageService = inject(MessageService);
  private readonly dialogRef = inject(MatDialogRef<PatientRequestOpinionDeleteComponent>);
  private readonly cdr = inject(ChangeDetectorRef);
  private readonly destroyRef = inject(DestroyRef);

  // Estados gerenciados reativamente via Signals
  protected readonly isSubmitting = signal<boolean>(false);

  // --- MÉTODOS DE AÇÃO DO TEMPLATE (PROTECTED) ---

  protected onSubmit(): void {
    const opinionId = this.data?.opinion?.id;
    if (!opinionId) {
      this.messageService.showMessage('Identificador do parecer não encontrado.');
      return;
    }

    this.isSubmitting.set(true);
    this.cdr.markForCheck(); // ⚡ Força a atualização do DOM para pintar o spinner imediatamente no OnPush

    this.opinionService.deleteOpinion(opinionId)
      .pipe(
        finalize(() => {
          this.isSubmitting.set(false);
          this.cdr.markForCheck(); // ⚡ Garante o desligamento do loading visual na tela
        }),
        takeUntilDestroyed(this.destroyRef) // 🛡️ Proteção reativa contra memory leaks
      )
      .subscribe({
        next: (response) => {
          this.messageService.showMessage(response?.message || 'Parecer removido com sucesso!');
          this.dialogRef.close(true);
        },
        error: (err) => {
          const fallbackError = 'Ocorreu um erro ao tentar remover o parecer.';
          this.messageService.showMessage(err?.error?.message || fallbackError);
        },
      });
  }
}