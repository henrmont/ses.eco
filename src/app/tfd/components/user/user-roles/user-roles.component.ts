import { 
  ChangeDetectionStrategy, 
  Component, 
  DestroyRef, 
  OnInit, 
  inject, 
  signal 
} from '@angular/core';
import { FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatListModule } from '@angular/material/list';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatCardModule } from '@angular/material/card';
import { finalize } from 'rxjs';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';

import { Role } from '../../../models/role.model';
import { UserService } from '../../../services/user.service';
import { MessageService } from '../../../../core/services/message-service';
import { ApiResponse } from '../../../../core/models/api-response.model';

@Component({
  selector: 'app-user-roles',
  standalone: true,
  imports: [
    FormsModule, 
    ReactiveFormsModule, 
    MatDialogModule, 
    MatButtonModule, 
    MatSlideToggleModule, 
    MatListModule, 
    MatProgressSpinnerModule,
    MatCardModule
  ],
  templateUrl: './user-roles.component.html',
  styleUrl: './user-roles.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class UserRolesComponent implements OnInit {
  // Injeções de Dependência
  protected readonly data = inject(MAT_DIALOG_DATA, { optional: true });
  private readonly fb = inject(FormBuilder);
  private readonly userService = inject(UserService);
  private readonly messageService = inject(MessageService);
  private readonly dialogRef = inject(MatDialogRef<UserRolesComponent>);
  private readonly destroyRef = inject(DestroyRef);

  // Formulário Reativo
  protected userRolesForm!: FormGroup;
  
  // Estados Reativos via Signals
  protected readonly isLoading = signal<boolean>(true);
  protected readonly isSubmitting = signal<boolean>(false);
  protected readonly roles = signal<Role[]>([]);

  ngOnInit(): void {
    this.initForm();
    this.fetchRoles();
  }

  private initForm(): void {
    const initialRoleIds = this.data?.user?.roles?.map((item: Role) => item.id) || [];

    this.userRolesForm = this.fb.group({
      id: [this.data?.user?.id, [Validators.required]],
      roles: [initialRoleIds]
    });
  }

  private fetchRoles(): void {
    this.userService.getRoles()
      .pipe(
        finalize(() => this.isLoading.set(false)),
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe({
        next: (response: Role[]) => {
          this.roles.set(response || []);
        },
        error: (err) => {
          const fallbackError = 'Erro ao carregar a lista de permissões.';
          this.messageService.showMessage(err?.error?.message || fallbackError);
        }
      });
  }

  protected toggleRole(item: Role): void {
    const rolesControl = this.userRolesForm.get('roles');
    if (!rolesControl) return;

    const currentRoles: number[] = [...rolesControl.value];
    const index = currentRoles.indexOf(item.id);

    if (index !== -1) {
      currentRoles.splice(index, 1);
    } else {
      currentRoles.push(item.id);
    }

    this.userRolesForm.markAsDirty();
    rolesControl.setValue(currentRoles);
    rolesControl.updateValueAndValidity();
  }

  protected checkRole(id: number): boolean {
    const currentRoles: number[] = this.userRolesForm?.get('roles')?.value || [];
    return currentRoles.includes(id);
  }

  protected formatRoleName(roleName: string): string {
    if (!roleName) return '';
    return roleName.split('/').pop() || roleName;
  }

  protected onSubmit(): void {
    const userId = this.data?.user?.id;
    if (!userId) {
      this.messageService.showMessage('Identificador do usuário inválido.');
      return;
    }

    if (this.userRolesForm.invalid || this.isSubmitting()) {
      this.userRolesForm.markAllAsTouched();
      return;
    }

    this.isSubmitting.set(true);

    this.userService.rolesUser(userId, this.userRolesForm.getRawValue())
      .pipe(
        finalize(() => this.isSubmitting.set(false)),
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe({
        next: (response: ApiResponse) => {
          this.messageService.showMessage(response?.message || 'Permissões atualizadas com sucesso!');
          this.dialogRef.close(true);
        },
        error: (err) => {
          const fallbackError = 'Erro ao atualizar permissões.';
          this.messageService.showMessage(err?.error?.message || fallbackError);
        }
      });
  }
}