import { ChangeDetectionStrategy, Component, DestroyRef, OnInit, inject, signal } from '@angular/core';
import { FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatIconModule } from '@angular/material/icon';
import { MatCardModule } from '@angular/material/card';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { finalize } from 'rxjs';

import { Permission } from '../../../models/permission.model';
import { RoleService } from '../../../services/role.service';
import { MessageService } from '../../../../core/services/message-service';
import { CustomValidators } from '../../../../core/validators/custom.validator';

@Component({
  selector: 'app-role-update',
  imports: [
    FormsModule,
    ReactiveFormsModule,
    MatDialogModule,
    MatButtonModule,
    MatFormFieldModule,
    MatInputModule,
    MatSlideToggleModule,
    MatProgressSpinnerModule,
    MatIconModule,
    MatCardModule
  ],
  templateUrl: './role-update.component.html',
  styleUrl: './role-update.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class RoleUpdateComponent implements OnInit {
  protected readonly data = inject(MAT_DIALOG_DATA, { optional: true });
  private readonly fb = inject(FormBuilder);
  private readonly roleService = inject(RoleService);
  private readonly messageService = inject(MessageService);
  private readonly dialogRef = inject(MatDialogRef<RoleUpdateComponent>);
  private readonly destroyRef = inject(DestroyRef);

  protected roleForm!: FormGroup;

  protected readonly permissionGroups = [
    { label: 'Usuários', icon: 'people', filter: 'usuário' },
    { label: 'Regras', icon: 'security', filter: 'regra' },
    { label: 'Unidades hospitalares', icon: 'domain', filter: 'unidade hospitalar' },
    { label: 'Datasus', icon: 'medical_services', filter: 'datasus' },
    { label: 'Configurações', icon: 'settings', filter: 'configuração' },
    { label: 'Pacientes', icon: 'personal_injury', filter: 'paciente' },
    { label: 'Solicitações', icon: 'assignment', filter: 'solicitação' },
    { label: 'Pareceres', icon: 'grading', filter: 'parecer' },
    { label: 'Passagens', icon: 'luggage', filter: 'passagem' },
    { label: 'Ajudas de custo', icon: 'price_check', filter: 'ajuda de custo' },
    { label: 'Pagamentos', icon: 'payments', filter: 'pagamento' }
  ];

  protected readonly isLoading = signal<boolean>(true);
  protected readonly isSubmitting = signal<boolean>(false);
  protected readonly permissions = signal<Permission[]>([]);

  protected readonly errorMessages: Record<string, Array<{ type: string; message: string }>> = {
    name: [{ type: 'required', message: 'O nome da regra é obrigatório.' }],
    permissions: [{ type: 'invalidPermissions', message: 'Selecione as permissões válidas para esta regra.' }]
  };

  ngOnInit(): void {
    this.initForm();
    this.fetchPermissions();
  }

  private initForm(): void {
    const roleName = this.data?.role?.name ? this.data.role.name.split('/')[1] : '';
    const rolePermissions = this.data?.role?.permissions 
      ? this.data.role.permissions.map((item: Permission) => item.id) 
      : [];

    this.roleForm = this.fb.group({
      name: [roleName, [Validators.required]],
      permissions: [rolePermissions, [CustomValidators.permissionsValidator(2)]]
    });
  }

  private fetchPermissions(): void {
    this.roleService.getPermissions()
      .pipe(
        finalize(() => this.isLoading.set(false)),
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe({
        next: (response) => {
          this.permissions.set(response || []);
        },
        error: (err) => {
          const fallbackError = 'Erro ao carregar lista de permissões.';
          this.messageService.showMessage(err?.error?.message || fallbackError);
        }
      });
  }

  protected getFilteredRole(groupFilter: string): Permission[] {
    return this.permissions().filter((permission: Permission) => {
      const name = permission.name;
      const slashIndex = name.indexOf('/');
      const lastSpaceIndex = name.lastIndexOf(' ');

      if (slashIndex === -1) return false;

      const intermediateWord = lastSpaceIndex > slashIndex 
        ? name.substring(slashIndex + 1, lastSpaceIndex) 
        : name.substring(slashIndex + 1);

      return intermediateWord.trim().toLowerCase() === groupFilter.toLowerCase();
    });
  }

  protected togglePermission(item: Permission): void {
    const permissionsControl = this.roleForm.get('permissions');
    if (!permissionsControl) return;

    const currentPermissions: number[] = [...(permissionsControl.value || [])];
    const index = currentPermissions.indexOf(item.id);

    if (index !== -1) {
      currentPermissions.splice(index, 1);
    } else {
      currentPermissions.push(item.id);
    }

    permissionsControl.setValue(currentPermissions);
    permissionsControl.markAsDirty();
    permissionsControl.updateValueAndValidity();
  }

  protected checkPermission(id: number): boolean {
    const permissions = this.roleForm.get('permissions')?.value;
    return Array.isArray(permissions) ? permissions.includes(id) : false;
  }

  protected onSubmit(): void {
    if (this.roleForm.invalid) {
      this.roleForm.markAllAsTouched();
      return;
    }

    this.isSubmitting.set(true);

    this.roleService.updateRole(this.data?.role?.id, this.roleForm.getRawValue())
      .pipe(
        finalize(() => this.isSubmitting.set(false)),
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe({
        next: (response) => {
          this.messageService.showMessage(response?.message || 'Regra atualizada com sucesso!');
          this.dialogRef.close(true);
        },
        error: (err) => {
          const fallbackError = 'Erro ao atualizar a regra.';
          this.messageService.showMessage(err?.error?.message || fallbackError);
        }
      });
  }
}