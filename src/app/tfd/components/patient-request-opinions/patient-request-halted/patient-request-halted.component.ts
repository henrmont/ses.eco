import { ChangeDetectionStrategy, ChangeDetectorRef, Component, DestroyRef, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { finalize } from 'rxjs';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';

import { PatientRequestOpinionService } from '../../../services/patient-request-opinion.service';
import { MessageService } from '../../../../core/services/message-service';

@Component({
  selector: 'app-patient-request-halted',
  standalone: true,
  imports: [
    CommonModule,
    MatDialogModule, 
    MatButtonModule, 
    MatProgressSpinnerModule
  ],
  templateUrl: './patient-request-halted.component.html',
  styleUrl: './patient-request-halted.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush // ⚡ Performance máxima com OnPush + Signals
})
export class PatientRequestHaltedComponent {
  // Injeções de Dependência Dinâmicas
  protected readonly data = inject(MAT_DIALOG_DATA);
  private readonly opinionService = inject(PatientRequestOpinionService);
  private readonly messageService = inject(MessageService);
  private readonly dialogRef = inject(MatDialogRef<PatientRequestHaltedComponent>);
  private readonly cdr = inject(ChangeDetectorRef);
  private readonly destroyRef = inject(DestroyRef);

  // Estados gerenciados reativamente via Signals
  protected readonly isSubmitting = signal<boolean>(false);

  // --- MÉTODOS DE AÇÃO DO TEMPLATE (PROTECTED) ---

  /**
   * Dispara a requisição para paralisar/sobrestar a solicitação do parecerista (médico/social)
   */
  protected onSubmit(): void {
    const requestId = this.data?.patient_request?.id;
    const profileType = this.data?.type;

    if (!requestId) {
      this.messageService.showMessage('Identificador da solicitação inválido.');
      return;
    }

    this.isSubmitting.set(true);
    this.cdr.markForCheck(); // ⚡ Força a atualização do DOM para pintar o spinner imediatamente no OnPush

    this.opinionService.haltedPatientRequest(profileType, requestId)
      .pipe(
        finalize(() => {
          this.isSubmitting.set(false);
          this.cdr.markForCheck(); // ⚡ Garante o desligamento do loading visual na tela
        }),
        takeUntilDestroyed(this.destroyRef) // 🛡️ Proteção reativa contra memory leaks
      )
      .subscribe({
        next: (response) => {
          this.messageService.showMessage(response?.message || 'Status de sobrestamento atualizado!');
          this.dialogRef.close(true); // Retorna sinal positivo para atualizar a grid na OpinionsPage
        },
        error: (err) => {
          const fallbackMessage = 'Ocorreu um erro ao tentar atualizar o sobrestamento.';
          this.messageService.showMessage(err?.error?.message || fallbackMessage);
        },
      });
  }
}