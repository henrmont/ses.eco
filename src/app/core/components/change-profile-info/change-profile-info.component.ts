import { ChangeDetectionStrategy, Component, DestroyRef, inject, Injector, OnInit, signal } from '@angular/core';
import { takeUntilDestroyed, toObservable } from '@angular/core/rxjs-interop';
import { FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { finalize } from 'rxjs';

// Angular Material
import { MatButtonModule } from '@angular/material/button';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';

// Core & Services
import { ApiResponse } from '../../models/api-response.model';
import { MessageService } from '../../services/message-service';
import { ProfileService } from '../../services/profile-service';

@Component({
  selector: 'app-change-profile-info',
  standalone: true,
  imports: [
    FormsModule,
    MatButtonModule,
    MatDialogModule,
    MatFormFieldModule,
    MatIconModule,
    MatInputModule,
    MatProgressSpinnerModule,
    ReactiveFormsModule
  ],
  templateUrl: './change-profile-info.component.html',
  styleUrl: './change-profile-info.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ChangeProfileInfoComponent implements OnInit {
  // ==========================================
  // Injeção de Dependências
  // ==========================================
  protected readonly data = inject(MAT_DIALOG_DATA);
  private readonly fb = inject(FormBuilder);
  private readonly profileService = inject(ProfileService);
  private readonly messageService = inject(MessageService);
  private readonly dialogRef = inject(MatDialogRef<ChangeProfileInfoComponent>);
  private readonly destroyRef = inject(DestroyRef);
  private readonly injector = inject(Injector);

  // ==========================================
  // Propriedades e Estado Reativo
  // ==========================================
  protected changeProfileInfoForm!: FormGroup;
  protected readonly isSubmitting = signal<boolean>(false);

  // Mapeamento de Mensagens de Erro Tipado
  protected readonly errorMessages: Record<string, Array<{ type: string; message: string }>> = {
    name: [
      { type: 'required', message: 'O nome é obrigatório.' }
    ]
  };

  // ==========================================
  // Ciclo de Vida (Hooks)
  // ==========================================
  ngOnInit(): void {
    this.initForm();
    this.setupFormSubmittingHandler();
  }

  // ==========================================
  // Métodos Acessíveis pelo Template (Protected)
  // ==========================================
  protected onSubmit(): void {
    const userId = this.data?.user?.id;

    if (!userId) {
      this.messageService.showMessage('Identificador de usuário inválido.');
      return;
    }

    if (this.changeProfileInfoForm.invalid) {
      this.changeProfileInfoForm.markAllAsTouched();
      return;
    }

    this.isSubmitting.set(true);

    this.profileService.changeProfileInfo(this.changeProfileInfoForm.getRawValue())
      .pipe(
        finalize(() => this.isSubmitting.set(false)),
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe({
        next: (response: ApiResponse) => {
          this.messageService.showMessage(response?.message || 'Informações do perfil atualizadas com sucesso!');
          this.dialogRef.close({ value: this.changeProfileInfoForm.get('name')?.value });
        },
        error: (err) => {
          const fallbackError = 'Erro ao atualizar as informações do perfil.';
          this.messageService.showMessage(err?.error?.message || fallbackError);
        }
      });
  }

  // ==========================================
  // Métodos Privados
  // ==========================================
  private initForm(): void {
    const user = this.data?.user;

    this.changeProfileInfoForm = this.fb.group({
      id: [user?.id ?? '', [Validators.required]],
      name: [user?.name ?? '', [Validators.required]]
    });
  }

  private setupFormSubmittingHandler(): void {
    toObservable(this.isSubmitting, { injector: this.injector })
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(isSubmitting => {
        if (isSubmitting) {
          this.changeProfileInfoForm.disable({ emitEvent: false });
        } else {
          this.changeProfileInfoForm.enable({ emitEvent: false });
        }
      });
  }
}