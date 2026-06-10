import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { finalize } from 'rxjs';

// Serviços
import { RoleService } from '../../../services/role-service';
import { MessageService } from '../../../../core/services/message-service';

@Component({
  selector: 'app-delete-role-component',
  imports: [MatDialogModule, MatButtonModule, MatProgressSpinnerModule],
  templateUrl: './delete-role-component.html',
  styleUrl: './delete-role-component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush, // ⚡ Performance otimizada com OnPush
})
export class DeleteRoleComponent {
  // Padronização da injeção de dependências usando o inject()
  protected readonly data = inject(MAT_DIALOG_DATA);
  private readonly roleService = inject(RoleService);
  private readonly messageService = inject(MessageService);
  private readonly dialogRef = inject(MatDialogRef<DeleteRoleComponent>);

  // Signal para controlar o estado de carregamento do botão (loading)
  readonly isSubmitting = signal<boolean>(false);

  onSubmit(): void {
    this.isSubmitting.set(true);

    this.roleService.deleteRole(this.data.role.id)
      .pipe(finalize(() => this.isSubmitting.set(false))) // 👈 Centraliza o fechamento do loading de forma segura
      .subscribe({
        next: (response: any) => {
          this.messageService.showMessage(response.message || 'Regra removida com sucesso!');
          this.dialogRef.close(true);
        },
        error: (err) => {
          const errMsg = err?.error?.message || 'Erro ao tentar remover a regra.';
          this.messageService.showMessage(errMsg);
        },
      });
  }
}