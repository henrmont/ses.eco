import { ChangeDetectionStrategy, Component, DestroyRef, inject, signal } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { finalize } from 'rxjs';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';

import { UserService } from '../../../services/user.service';
import { MessageService } from '../../../../core/services/message-service';
import { ApiResponse } from '../../../../core/models/api-response.model';

@Component({
  selector: 'app-user-delete',
  standalone: true,
  imports: [
    MatDialogModule,
    MatButtonModule,
    MatProgressSpinnerModule
  ],
  templateUrl: './user-delete.component.html',
  styleUrl: './user-delete.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class UserDeleteComponent {
  // Injeções de Dependência
  protected readonly data = inject(MAT_DIALOG_DATA, { optional: true });
  private readonly userService = inject(UserService);
  private readonly messageService = inject(MessageService);
  private readonly dialogRef = inject(MatDialogRef<UserDeleteComponent>);
  private readonly destroyRef = inject(DestroyRef);

  // Estado Reativo via Signal
  protected readonly isSubmitting = signal<boolean>(false);

  protected onSubmit(): void {
    const userId = this.data?.user?.id;
    if (!userId) {
      this.messageService.showMessage('Identificador do usuário inválido.');
      return;
    }

    this.isSubmitting.set(true);

    this.userService.deleteUser(userId)
      .pipe(
        finalize(() => this.isSubmitting.set(false)),
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe({
        next: (response: ApiResponse) => {
          this.messageService.showMessage(response?.message || 'Usuário removido com sucesso!');
          this.dialogRef.close(true);
        },
        error: (err) => {
          const fallbackError = 'Erro ao tentar remover o usuário.';
          this.messageService.showMessage(err?.error?.message || fallbackError);
        }
      });
  }
}