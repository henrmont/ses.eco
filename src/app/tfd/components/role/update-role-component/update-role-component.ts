import { ChangeDetectionStrategy, Component, inject, OnInit, signal } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatIconModule } from '@angular/material/icon';
import { finalize } from 'rxjs';

// Core & Shared
import { Permission } from '../../../models/permission';
import { RoleService } from '../../../services/role-service';
import { MessageService } from '../../../../core/services/message-service';
import { CustomValidators } from '../../../../core/validators/custom.validator';

@Component({
  selector: 'app-update-role-component',
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatDialogModule,
    MatButtonModule,
    MatFormFieldModule,
    MatInputModule,
    MatSlideToggleModule,
    MatProgressSpinnerModule,
    MatIconModule
  ],
  templateUrl: './update-role-component.html',
  styleUrl: './update-role-component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush // ⚡ Performance otimizada com OnPush reativo
})
export class UpdateRoleComponent implements OnInit {
  // 🔒 Injeções de dependência funcionais e imutáveis via inject()
  private readonly fb = inject(FormBuilder);
  private readonly roleService = inject(RoleService);
  private readonly messageService = inject(MessageService);
  private readonly dialogRef = inject(MatDialogRef<UpdateRoleComponent>);
  protected readonly data = inject(MAT_DIALOG_DATA);

  updateRoleForm!: FormGroup;

  // Signals puros de controle de estado (padronizados com CreateRole)
  readonly isLoading = signal<boolean>(true);
  readonly isSubmitting = signal<boolean>(false);
  readonly permissions = signal<Permission[]>([]);

  // 📝 Dicionário de mensagens de erro padronizado
  errorMessages: { [key: string]: Array<{ type: string; message: string }> } = {
    name: [{ type: 'required', message: 'O nome da regra é obrigatório.' }],
    permissions: [{ type: 'invalidPermissions', message: 'Selecione as permissões válidas para esta regra.' }]
  };

  constructor() {
    // Inicializa o formulário tratando de forma segura os dados passados pelo modal de edição
    const roleName = this.data?.role?.name ? this.data.role.name.split('/')[1] : '';
    const rolePermissions = this.data?.role?.permissions 
      ? this.data.role.permissions.map((item: Permission) => item.id) 
      : [];

    this.updateRoleForm = this.fb.group({
      name: [roleName, [Validators.required]],
      permissions: [rolePermissions, [CustomValidators.permissionsValidator(2)]]
    });
  }

  ngOnInit(): void {
    this.getPermissions();
  }

  getPermissions(): void {
    this.roleService.getPermissions()
      .pipe(finalize(() => this.isLoading.set(false))) // Desliga o loading reativamente
      .subscribe({
        next: (response) => {
          this.permissions.set(response);
        },
        error: (err) => {
          const errMsg = err?.error?.message || 'Erro ao carregar lista de permissões.';
          this.messageService.showMessage(errMsg);
        }
      });
  }

  getFilteredRole(group: string): Permission[] {
    return this.permissions().filter((permission: Permission) => {
      const nome = permission.name;
      const indiceBarra = nome.indexOf('/');
      const indiceUltimoEspaco = nome.lastIndexOf(' ');

      if (indiceBarra === -1) return false;

      const palavraIntermediaria = indiceUltimoEspaco > indiceBarra 
        ? nome.substring(indiceBarra + 1, indiceUltimoEspaco) 
        : nome.substring(indiceBarra + 1);

      return palavraIntermediaria.trim() === group;
    });
  }

  togglePermission(item: Permission): void {
    const permissionsControl = this.updateRoleForm.get('permissions');
    if (!permissionsControl) return;

    let currentPermissions: any[] = [...permissionsControl.value];
    const index = currentPermissions.indexOf(item.id);

    if (index !== -1) {
      currentPermissions.splice(index, 1);
    } else {
      currentPermissions.push(item.id);
    }

    // Sinaliza que o formulário foi alterado pelo usuário (Dirty) e força revalidação
    this.updateRoleForm.markAsDirty();
    permissionsControl.setValue(currentPermissions);
    permissionsControl.updateValueAndValidity();
  }

  checkPermission(id: number): boolean {
    const permissions = this.updateRoleForm.get('permissions')?.value;
    return Array.isArray(permissions) ? permissions.includes(id) : false;
  }

  onSubmit(): void {
    if (this.updateRoleForm.invalid) {
      return;
    }

    this.isSubmitting.set(true);

    this.roleService.updateRole(this.data.role.id, this.updateRoleForm.value)
      .pipe(finalize(() => this.isSubmitting.set(false))) // Desliga o spinner automaticamente
      .subscribe({
        next: (response: any) => {
          this.messageService.showMessage(response.message || 'Regra atualizada com sucesso!');
          this.dialogRef.close(true);
        },
        error: (err) => {
          const errMsg = err?.error?.message || 'Erro ao atualizar a regra.';
          this.messageService.showMessage(errMsg);
        },
      });
  }
}