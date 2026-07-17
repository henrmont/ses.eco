import { ChangeDetectionStrategy, Component, inject, OnInit, signal, ChangeDetectorRef, DestroyRef } from '@angular/core';
import { FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatIconModule } from '@angular/material/icon';
import { finalize } from 'rxjs';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Permission } from '../../../models/permission';
import { RoleService } from '../../../services/role-service';
import { MessageService } from '../../../../core/services/message-service';
import { CustomValidators } from '../../../../core/validators/custom.validator';
import { MatCardModule } from '@angular/material/card';

@Component({
  selector: 'app-update-role-component',
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
  templateUrl: './update-role-component.html',
  styleUrl: './update-role-component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class UpdateRoleComponent implements OnInit {
  // Dynamic Dependency Injections
  protected readonly data = inject(MAT_DIALOG_DATA);
  private readonly fb = inject(FormBuilder);
  private readonly roleService = inject(RoleService);
  private readonly messageService = inject(MessageService);
  private readonly dialogRef = inject(MatDialogRef<UpdateRoleComponent>);
  private readonly cdr = inject(ChangeDetectorRef);
  private readonly destroyRef = inject(DestroyRef);

  // Form Structure exposed to the template
  protected roleForm!: FormGroup;

  // Static Data Structure for template mapping
  protected readonly permissionGroups = [
    { label: 'Usuários', icon: 'people', filter: 'usuário' },
    { label: 'Regras', icon: 'security', filter: 'regra' },
    { label: 'Unidades hospitalares', icon: 'domain', filter: 'unidade hospitalar' },
    { label: 'Datasus', icon: 'medical_services', filter: 'datasus' },
    { label: 'Configurações', icon: 'settings', filter: 'configuração' },
    { label: 'Pacientes', icon: 'personal_injury', filter: 'paciente' },
    { label: 'Solicitações', icon: 'assignment', filter: 'solicitação' },
    { label: 'Consultar', icon: 'search', filter: 'consultar' },
    { label: 'Pareceres', icon: 'grading', filter: 'parecer' },
    { label: 'Passagens', icon: 'luggage', filter: 'passagem' },
    { label: 'Ajudas de custo', icon: 'price_check', filter: 'ajuda de custo' },
    { label: 'Pagamentos', icon: 'payments', filter: 'pagamento' }
  ];

  // States managed reactively via Signals
  protected readonly isLoading = signal<boolean>(true);
  protected readonly isSubmitting = signal<boolean>(false);
  protected readonly permissions = signal<Permission[]>([]);

  // 🎯 Local mapping for standardized UI error messages
  protected readonly errorMessages: { [key: string]: Array<{ type: string; message: string }> } = {
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

  /**
   * Fetches available permissions from the server and turns off
   * the screen's initial loading state.
   */
  private fetchPermissions(): void {
    this.roleService.getPermissions()
      .pipe(
        finalize(() => {
          this.isLoading.set(false);
          this.cdr.markForCheck();
        }),
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

  // --- TEMPLATE ACTION METHODS (PROTECTED) ---

  protected getFilteredRole(group: string): Permission[] {
    return this.permissions().filter((permission: Permission) => {
      const name = permission.name;
      const slashIndex = name.indexOf('/');
      const lastSpaceIndex = name.lastIndexOf(' ');

      if (slashIndex === -1) return false;

      const intermediateWord = lastSpaceIndex > slashIndex 
        ? name.substring(slashIndex + 1, lastSpaceIndex) 
        : name.substring(slashIndex + 1);

      return intermediateWord.trim() === group;
    });
  }

  protected togglePermission(item: Permission): void {
    const permissionsControl = this.roleForm.get('permissions');
    if (!permissionsControl) return;

    const currentPermissions: any[] = [...permissionsControl.value];
    const index = currentPermissions.indexOf(item.id);

    if (index !== -1) {
      currentPermissions.splice(index, 1);
    } else {
      currentPermissions.push(item.id);
    }

    this.roleForm.markAsDirty();
    permissionsControl.setValue(currentPermissions);
    permissionsControl.updateValueAndValidity();
    this.cdr.markForCheck();
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
    this.cdr.markForCheck();

    this.roleService.updateRole(this.data.role.id, this.roleForm.getRawValue())
      .pipe(
        finalize(() => {
          this.isSubmitting.set(false);
          this.cdr.markForCheck();
        }),
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe({
        next: (response: any) => {
          this.messageService.showMessage(response?.message || 'Regra atualizada com sucesso!');
          this.dialogRef.close(true);
        },
        error: (err) => {
          const fallbackError = 'Erro ao atualizar a regra.';
          this.messageService.showMessage(err?.error?.message || fallbackError);
        },
      });
  }
}