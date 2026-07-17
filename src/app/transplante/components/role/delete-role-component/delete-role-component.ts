import { ChangeDetectionStrategy, Component, inject, signal, ChangeDetectorRef, DestroyRef } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { finalize } from 'rxjs';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { RoleService } from '../../../services/role-service';
import { MessageService } from '../../../../core/services/message-service';

@Component({
  selector: 'app-delete-role-component',
  imports: [
    MatDialogModule,
    MatButtonModule,
    MatProgressSpinnerModule
  ],
  templateUrl: './delete-role-component.html',
  styleUrl: './delete-role-component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class DeleteRoleComponent {
  // Injeções de Dependência Dinâmicas
  protected readonly data = inject(MAT_DIALOG_DATA);
  private readonly roleService = inject(RoleService);
  private readonly messageService = inject(MessageService);
  private readonly dialogRef = inject(MatDialogRef<DeleteRoleComponent>);
  private readonly cdr = inject(ChangeDetectorRef);
  private readonly destroyRef = inject(DestroyRef);

  // Estados gerenciados reativamente via Signals
  protected readonly isSubmitting = signal<boolean>(false);

  // --- MÉTODOS DE AÇÃO DO TEMPLATE (PROTECTED) ---

  protected onSubmit(): void {
    const roleId = this.data?.role?.id;
    if (!roleId) {
      this.messageService.showMessage('Identificador da regra inválido.');
      return;
    }

    this.isSubmitting.set(true);
    this.cdr.markForCheck(); // Força a atualização do DOM para pintar o spinner imediatamente no OnPush

    this.roleService.deleteRole(roleId)
      .pipe(
        finalize(() => {
          this.isSubmitting.set(false);
          this.cdr.markForCheck(); // Garante o desligamento do loading visual na tela
        }),
        takeUntilDestroyed(this.destroyRef) // Proteção reativa contra memory leaks se fecharem o modal rápido
      )
      .subscribe({
        next: (response: any) => {
          this.messageService.showMessage(response?.message || 'Regra removida com sucesso!');
          this.dialogRef.close(true);
        },
        error: (err) => {
          const fallbackError = 'Erro ao tentar remover a regra.';
          this.messageService.showMessage(err?.error?.message || fallbackError);
        },
      });
  }
}