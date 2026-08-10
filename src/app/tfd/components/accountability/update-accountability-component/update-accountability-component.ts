import { ChangeDetectionStrategy, Component, DestroyRef, OnInit, ChangeDetectorRef, inject, signal } from '@angular/core';
import { FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatIconModule } from '@angular/material/icon';
import { CommonModule } from '@angular/common';
import { finalize } from 'rxjs';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';

// Serviços
import { AccountabilityService } from '../../../services/accountability-service';
import { MessageService } from '../../../../core/services/message-service';

@Component({
  selector: 'app-update-accountability-component',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule, 
    ReactiveFormsModule, 
    MatDialogModule, 
    MatButtonModule, 
    MatFormFieldModule, 
    MatInputModule, 
    MatProgressSpinnerModule,
    MatIconModule
  ],
  templateUrl: './update-accountability-component.html',
  styleUrl: './update-accountability-component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class UpdateAccountabilityComponent implements OnInit {
  // Injeções de Dependência
  protected readonly data = inject(MAT_DIALOG_DATA);
  private readonly fb = inject(FormBuilder);
  private readonly accountabilityService = inject(AccountabilityService);
  private readonly messageService = inject(MessageService);
  private readonly dialogRef = inject(MatDialogRef<UpdateAccountabilityComponent>);
  private readonly cdr = inject(ChangeDetectorRef);
  private readonly destroyRef = inject(DestroyRef);

  // Form Group Principal
  protected updateAccountabilityForm!: FormGroup;

  // Estados reativos via Signals
  protected readonly isSubmitting = signal<boolean>(false);

  // Mensagens estáticas de erro do formulário
  protected readonly errorMessages: { [key: string]: Array<{ type: string; message: string }> } = {
    name: [
      { type: 'required', message: 'O nome da prestação de contas é obrigatório.' }
    ]
  };

  ngOnInit(): void {
    this.initForm();
  }

  // --- INICIALIZAÇÃO E REGRAS DO FORMULÁRIO ---

  private initForm(): void {
    const accountability = this.data?.accountability;

    this.updateAccountabilityForm = this.fb.group({
      name: [accountability?.name || null, [Validators.required]],
    });
  }

  // --- SUBMISSÃO ---

  /**
   * Submete o formulário para atualização da prestação de contas.
   */
  protected onSubmit(): void {
    const accountabilityId = this.data?.accountability?.id;

    if (this.updateAccountabilityForm.invalid || !accountabilityId) {
      this.updateAccountabilityForm.markAllAsTouched();
      return;
    }

    if (this.isSubmitting()) {
      return;
    }

    this.isSubmitting.set(true);
    this.cdr.markForCheck();

    const payload = {
      name: this.updateAccountabilityForm.get('name')?.value
    };

    this.accountabilityService.updateAccountability(accountabilityId, payload)
      .pipe(
        finalize(() => {
          this.isSubmitting.set(false);
          this.cdr.markForCheck();
        }),
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe({
        next: (response: any) => {
          this.messageService.showMessage(response?.message || 'Prestação de contas atualizada com sucesso!');
          this.dialogRef.close(true);
        },
        error: (err) => {
          const fallbackError = 'Ocorreu um erro ao atualizar a prestação de contas.';
          this.messageService.showMessage(err?.error?.message || fallbackError);
        }
      });
  }
}