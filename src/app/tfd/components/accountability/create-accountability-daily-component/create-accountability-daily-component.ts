import { ChangeDetectionStrategy, Component, DestroyRef, OnInit, ChangeDetectorRef, inject, signal } from '@angular/core';
import { FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { CommonModule } from '@angular/common';
import { finalize } from 'rxjs';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';

// Diretiva de Máscara
import { NgxMaskDirective } from 'ngx-mask';

// Serviços e Models
import { AccountabilityService } from '../../../services/accountability-service';
import { MessageService } from '../../../../core/services/message-service';
import { DailyCost } from '../../../models/daily-cost';

@Component({
  selector: 'app-create-accountability-daily-component',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule, 
    ReactiveFormsModule, 
    MatDialogModule, 
    MatButtonModule, 
    MatFormFieldModule, 
    MatInputModule, 
    MatSelectModule, 
    MatProgressSpinnerModule,
    NgxMaskDirective
  ],
  templateUrl: './create-accountability-daily-component.html',
  styleUrl: './create-accountability-daily-component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class CreateAccountabilityDailyComponent implements OnInit {
  // Injeções de Dependência
  protected readonly data = inject(MAT_DIALOG_DATA);
  private readonly fb = inject(FormBuilder);
  private readonly accountabilityService = inject(AccountabilityService);
  private readonly messageService = inject(MessageService);
  private readonly dialogRef = inject(MatDialogRef<CreateAccountabilityDailyComponent>);
  private readonly cdr = inject(ChangeDetectorRef);
  private readonly destroyRef = inject(DestroyRef);

  // Form Group Principal
  protected createAccountabilityDailyForm!: FormGroup;

  // Estados reativos via Signals
  protected readonly dailyCostsOptions = signal<DailyCost[]>([]);
  protected readonly isSubmitting = signal<boolean>(false);
  protected readonly isLoadingOptions = signal<boolean>(true);

  // Mensagens estáticas de erro do formulário
  protected readonly errorMessages: { [key: string]: Array<{ type: string; message: string }> } = {
    daily_cost_id: [
      { type: 'required', message: 'O tipo de diária é obrigatório.' }
    ],
    amount: [
      { type: 'required', message: 'A quantidade é obrigatória.' },
      { type: 'min', message: 'A quantidade mínima deve ser igual a 1.' }
    ]
  };

  ngOnInit(): void {
    this.initForm();
    this.fetchDailyCosts();
  }

  // --- INICIALIZAÇÃO E BUSCA DE DADOS ---

  private initForm(): void {
    this.createAccountabilityDailyForm = this.fb.group({
      daily_cost_id: [null, [Validators.required]],
      amount: [null, [Validators.required, Validators.min(1)]]
    });
  }

  /**
   * Busca as opções de tipos de diária disponíveis.
   */
  private fetchDailyCosts(): void {
    this.accountabilityService.getDailyCosts()
      .pipe(
        finalize(() => {
          this.isLoadingOptions.set(false);
          this.cdr.markForCheck();
        }),
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe({
        next: (response: any) => {
          const items = Array.isArray(response) ? response : (response?.data || []);
          this.dailyCostsOptions.set(items);
        },
        error: () => {
          this.messageService.showMessage('Falha ao carregar as opções de diária.');
        }
      });
  }

  // --- SUBMISSÃO ---

  /**
   * Submete o formulário para inclusão de uma nova diária.
   */
  protected onSubmit(): void {
    const accountabilityId = this.data?.accountability?.id;

    if (this.createAccountabilityDailyForm.invalid || !accountabilityId) {
      this.createAccountabilityDailyForm.markAllAsTouched();
      return;
    }

    if (this.isSubmitting()) {
      return;
    }

    this.isSubmitting.set(true);
    this.cdr.markForCheck();

    this.accountabilityService.createAccountabilityDaily(accountabilityId, this.createAccountabilityDailyForm.getRawValue())
      .pipe(
        finalize(() => {
          this.isSubmitting.set(false);
          this.cdr.markForCheck();
        }),
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe({
        next: (response: any) => {
          this.messageService.showMessage(response?.message || 'Diária adicionada com sucesso!');
          this.dialogRef.close(true);
        },
        error: (err) => {
          const fallbackError = 'Ocorreu um erro ao vincular a diária.';
          this.messageService.showMessage(err?.error?.message || fallbackError);
        }
      });
  }
}