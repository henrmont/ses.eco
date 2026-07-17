import { ChangeDetectionStrategy, Component, inject, signal, ChangeDetectorRef, DestroyRef } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { finalize } from 'rxjs';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { UserService } from '../../../services/user-service';
import { MessageService } from '../../../../core/services/message-service';

@Component({
  selector: 'app-validate-user-component',
  imports: [
    MatDialogModule,
    MatButtonModule,
    MatProgressSpinnerModule
  ],
  templateUrl: './validate-user-component.html',
  styleUrl: './validate-user-component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ValidateUserComponent {
  // Injeções de Dependência Dinâmicas
  protected readonly data = inject(MAT_DIALOG_DATA);
  private readonly userService = inject(UserService);
  private readonly messageService = inject(MessageService);
  private readonly dialogRef = inject(MatDialogRef<ValidateUserComponent>);
  private readonly cdr = inject(ChangeDetectorRef);
  private readonly destroyRef = inject(DestroyRef);

  // Estados gerenciados reativamente via Signals
  protected readonly isSubmitting = signal<boolean>(false);

  // --- MÉTODOS DE AÇÃO DO TEMPLATE (PROTECTED) ---

  protected onSubmit(): void {
    const userId = this.data?.user?.id;
    if (!userId) {
      this.messageService.showMessage('Identificador do usuário inválido.');
      return;
    }

    this.isSubmitting.set(true);
    this.cdr.markForCheck(); // Força a atualização do DOM para pintar o spinner imediatamente no OnPush

    this.userService.validateUser(userId)
      .pipe(
        finalize(() => {
          this.isSubmitting.set(false);
          this.cdr.markForCheck(); // Garante o desligamento do loading visual na tela
        }),
        takeUntilDestroyed(this.destroyRef) // Proteção reativa contra memory leaks se fecharem o modal rápido
      )
      .subscribe({
        next: (response: any) => {
          this.messageService.showMessage(response?.message || `Usuário validado/invalidado com sucesso!`);
          this.dialogRef.close(true);
        },
        error: (err) => {
          const fallbackMessage = `Erro ao tentar validar/invalidar o usuário.`;
          this.messageService.showMessage(err?.error?.message || fallbackMessage);
        },
      });
  }
}