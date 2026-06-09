import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { finalize } from 'rxjs'; // 👈 Adicionado o finalize
import { UserService } from '../../../services/user-service';
import { MessageService } from '../../../../core/services/message-service';

@Component({
  selector: 'app-lock-user-component',
  imports: [MatDialogModule, MatButtonModule, MatProgressSpinnerModule],
  templateUrl: './lock-user-component.html',
  styleUrl: './lock-user-component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush, // ⚡ Performance otimizada com OnPush
})
export class LockUserComponent {
  protected readonly data = inject(MAT_DIALOG_DATA);
  private readonly userService = inject(UserService);
  private readonly messageService = inject(MessageService);
  private readonly dialogRef = inject(MatDialogRef<LockUserComponent>);

  readonly isSubmitting = signal<boolean>(false);

  onSubmit(): void {
    this.isSubmitting.set(true);
    
    this.userService.lockUser(this.data.user.id)
      .pipe(finalize(() => this.isSubmitting.set(false))) // 👈 Centraliza o fechamento do loading de forma segura
      .subscribe({
        next: (response: any) => {
          this.messageService.showMessage(response.message || 'Status do usuário atualizado com sucesso!');
          this.dialogRef.close(true);
        },
        error: (err) => {
          const fallbackMessage = err?.error?.message || 'Erro ao tentar alterar o status do usuário.';
          this.messageService.showMessage(fallbackMessage);
        },
      });
  }
}