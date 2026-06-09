import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { finalize } from 'rxjs';
import { UserService } from '../../../services/user-service';
import { MessageService } from '../../../../core/services/message-service';

@Component({
  selector: 'app-validate-user-component',
  imports: [MatDialogModule, MatButtonModule, MatProgressSpinnerModule],
  templateUrl: './validate-user-component.html',
  styleUrl: './validate-user-component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush, // ⚡ Performance otimizada com OnPush
})
export class ValidateUserComponent {
  protected readonly data = inject(MAT_DIALOG_DATA);
  private readonly userService = inject(UserService);
  private readonly messageService = inject(MessageService);
  private readonly dialogRef = inject(MatDialogRef<ValidateUserComponent>);

  readonly isSubmitting = signal<boolean>(false);

  onSubmit(): void {
    this.isSubmitting.set(true);
    
    // 🌟 Mapeia o estado dinâmico utilizando a propriedade correta: 'is_valid'
    const isValid = this.data.user.module?.pivot?.is_valid;
    
    const acao = isValid ? 'invalidado' : 'validado';
    const acaoErro = isValid ? 'invalidar' : 'validar';

    this.userService.validateUser(this.data.user.id)
      .pipe(finalize(() => this.isSubmitting.set(false)))
      .subscribe({
        next: (response: any) => {
          this.messageService.showMessage(response.message || `Usuário ${acao} com sucesso!`);
          this.dialogRef.close(true);
        },
        error: (err) => {
          const fallbackMessage = err?.error?.message || `Erro ao tentar ${acaoErro} o usuário.`;
          this.messageService.showMessage(fallbackMessage);
        },
      });
  }
}