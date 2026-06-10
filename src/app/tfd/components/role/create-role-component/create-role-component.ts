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
  selector: 'app-create-role-component',
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
  templateUrl: './create-role-component.html',
  styleUrl: './create-role-component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush // ⚡ Performance otimizada com OnPush reativo
})
export class CreateRoleComponent implements OnInit {
  // 🔒 Injeções de dependência funcionais e imutáveis via inject()
  private readonly fb = inject(FormBuilder);
  private readonly roleService = inject(RoleService);
  private readonly messageService = inject(MessageService);
  private readonly dialogRef = inject(MatDialogRef<CreateRoleComponent>);
  protected readonly data = inject(MAT_DIALOG_DATA);

  createRoleForm!: FormGroup;
  
  // Signals puros de controle de estado
  readonly isLoading = signal<boolean>(true);
  readonly isSubmitting = signal<boolean>(false);
  readonly permissions = signal<Permission[]>([]);

  // 📝 Dicionário de mensagens de erro padronizado com o modelo de usuários
  errorMessages: { [key: string]: Array<{ type: string; message: string }> } = {
    name: [{ type: 'required', message: 'O nome da regra é obrigatório.' }],
    permissions: [{ type: 'invalidPermissions', message: 'Selecione as permissões válidas para esta regra.' }]
  };

  constructor() {
    this.createRoleForm = this.fb.group({
      name: ['', [Validators.required]],
      permissions: [[], [CustomValidators.permissionsValidator()]]
    });
  }

  ngOnInit(): void {
    this.getPermissions();
  }
  
  private getPermissions(): void {
    this.roleService.getPermissions()
      .pipe(finalize(() => this.isLoading.set(false))) // Desliga o loading de forma limpa e reativa
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

  protected getFilteredRole(group: string): Permission[] {
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

  protected togglePermission(item: Permission): void {
    const permissionsControl = this.createRoleForm.get('permissions');
    if (!permissionsControl) return;

    let currentPermissions: any[] = [...permissionsControl.value];
    const index = currentPermissions.indexOf(item.id);

    if (index !== -1) {
      currentPermissions.splice(index, 1); // Remove se já existir
    } else {
      currentPermissions.push(item.id); // Adiciona se não existir
    }

    // Atualiza o formulário e força a revalidação reativa
    permissionsControl.setValue(currentPermissions);
    permissionsControl.updateValueAndValidity();
  }

  onSubmit(): void {
    if (this.createRoleForm.invalid) {
      return;
    }

    this.isSubmitting.set(true);

    this.roleService.createRole(this.createRoleForm.value)
      .pipe(finalize(() => this.isSubmitting.set(false))) // Desliga o spinner de envio automaticamente
      .subscribe({
        next: (response: any) => {
          this.messageService.showMessage(response.message || 'Regra criada com sucesso!');
          this.dialogRef.close(true);
        },
        error: (err) => {
          const errMsg = err?.error?.message || 'Erro ao criar a regra.';
          this.messageService.showMessage(errMsg);
        },
      });
  }
}