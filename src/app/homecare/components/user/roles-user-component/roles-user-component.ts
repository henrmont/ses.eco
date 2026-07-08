import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { NonNullableFormBuilder, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatListModule } from '@angular/material/list';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { finalize } from 'rxjs'; // 👈 Importado para travar os states de loading/submitting
import { Role } from '../../../models/role';
import { UserService } from '../../../services/user-service';
import { MessageService } from '../../../../core/services/message-service';

@Component({
  selector: 'app-roles-user-component',
  imports: [
    FormsModule, 
    ReactiveFormsModule, 
    MatDialogModule, 
    MatButtonModule, 
    MatSlideToggleModule, 
    MatListModule, 
    MatProgressSpinnerModule
  ],
  templateUrl: './roles-user-component.html',
  styleUrl: './roles-user-component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush, // ⚡ Otimização de performance com OnPush
})
export class RolesUserComponent {
  // 🌟 Injeções padronizadas e limpas com inject()
  protected readonly data = inject(MAT_DIALOG_DATA);
  private readonly fb = inject(NonNullableFormBuilder);
  private readonly userService = inject(UserService);
  private readonly messageService = inject(MessageService);
  private readonly dialogRef = inject(MatDialogRef<RolesUserComponent>);

  readonly rolesUserForm: FormGroup;
  
  // Signals para controle de estado da tela
  readonly isLoading = signal<boolean>(true);
  readonly isSubmitting = signal<boolean>(false);
  readonly roles = signal<Role[]>([]);

  constructor() {
    // 🌟 Inicialização do formulário movida para o constructor, eliminando a necessidade do OnInit
    const initialRoleIds = this.data.user.roles?.map((item: any) => item.id) || [];

    this.rolesUserForm = this.fb.group({
      id: [this.data.user.id, [Validators.required]],
      roles: [initialRoleIds]
    });

    // Dispara a busca das roles imediatamente na construção do componente
    this.getRoles();
  }

  getRoles(): void {
    this.userService.getRoles()
      .pipe(finalize(() => this.isLoading.set(false))) // 👈 Garante que o loading pare independente de sucesso ou falha
      .subscribe({
        next: (response) => {
          this.roles.set(response)
        },
        error: () => this.messageService.showMessage('Erro ao carregar a lista de permissões.')
      });
  }

  toggleRole(item: Role): void {
    const currentRolesControl = this.rolesUserForm.get('roles');
    if (!currentRolesControl) return;

    // Imutabilidade defendida com sucesso!
    const currentRoles: number[] = [...currentRolesControl.value];
    const index = currentRoles.indexOf(item.id);

    if (index !== -1) {
      currentRoles.splice(index, 1);
    } else {
      currentRoles.push(item.id);
    }

    currentRolesControl.setValue(currentRoles);
    currentRolesControl.markAsDirty();
  }

  checkRole(id: number): boolean {
    const currentRoles: number[] = this.rolesUserForm?.get('roles')?.value || [];
    return currentRoles.includes(id);
  }

  /**
   * 🌟 Método utilitário para limpar o prefixo técnico (ex: 'xxx/nome_da_regra') 
   * para exibição amigável no HTML do modal.
   */
  formatRoleName(roleName: string): string {
    if (!roleName) return '';
    return roleName.split('/').pop() || roleName;
  }

  onSubmit(): void {
    if (this.rolesUserForm.invalid || this.isSubmitting()) return;

    this.isSubmitting.set(true);
    
    this.userService.rolesUser(this.data.user.id, this.rolesUserForm.value)
      .pipe(finalize(() => this.isSubmitting.set(false))) // 👈 Substitui a limpeza manual no bloco error
      .subscribe({
        next: (response: any) => {
          this.messageService.showMessage(response.message || 'Permissões atualizadas com sucesso!');
          this.dialogRef.close(true);
        },
        error: (err) => {
          const errorMsg = err?.error?.message || 'Erro ao atualizar permissões.';
          this.messageService.showMessage(errorMsg);
        },
      });
  }
}