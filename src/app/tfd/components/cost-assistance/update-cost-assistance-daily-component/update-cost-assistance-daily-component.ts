import { ChangeDetectionStrategy, Component, ChangeDetectorRef, DestroyRef, inject, OnInit, signal } from '@angular/core';
import { FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { finalize } from 'rxjs';

// Angular Material
import { MatButtonModule } from '@angular/material/button';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';

// Serviços e Models
import { CostAssistanceService } from '../../../services/cost-assistance-service';
import { MessageService } from '../../../../core/services/message-service';
import { DailyCost } from '../../../models/daily-cost';

@Component({
  selector: 'app-update-cost-assistance-daily-component',
  standalone: true,
  imports: [
    FormsModule, 
    ReactiveFormsModule, 
    MatDialogModule, 
    MatButtonModule, 
    MatFormFieldModule, 
    MatInputModule, 
    MatSelectModule, 
    MatProgressSpinnerModule
  ],
  templateUrl: './update-cost-assistance-daily-component.html',
  styleUrl: './update-cost-assistance-daily-component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush // ⚡ Performance máxima com OnPush e Signals
})
export class UpdateCostAssistanceDailyComponent implements OnInit {
  // Injeções de dependência modernas via inject()
  protected readonly data = inject(MAT_DIALOG_DATA);
  private readonly fb = inject(FormBuilder);
  private readonly costAssistanceService = inject(CostAssistanceService);
  private readonly messageService = inject(MessageService);
  private readonly dialogRef = inject(MatDialogRef<UpdateCostAssistanceDailyComponent>);
  private readonly cdr = inject(ChangeDetectorRef);
  private readonly destroyRef = inject(DestroyRef);

  // Estrutura do Formulário exposta ao template
  protected updateCostAssistanceDailyForm!: FormGroup;

  // 🎯 Mapeamento local das mensagens de erro conforme a referência técnica do projeto
  protected readonly errorMessages: { [key: string]: Array<{ type: string; message: string }> } = {
    daily_cost_id: [
      { type: 'required', message: 'O tipo de diária é obrigatório.' }
    ],
    amount: [
      { type: 'required', message: 'A quantidade é obrigatória.' },
      { type: 'min', message: 'A quantidade mínima deve ser igual a 1.' }
    ]
  };

  // Estados gerenciados reativamente via Signals
  protected readonly dailyCostsOptions = signal<DailyCost[]>([]);
  protected readonly isSubmitting = signal<boolean>(false);
  protected readonly isLoadingOptions = signal<boolean>(true);

  constructor() {
    this.initForm();
  }

  ngOnInit(): void {
    this.fetchDailyCosts();
  }

  // --- MÉTODOS PRIVADOS DE INICIALIZAÇÃO E SUPORTE ---

  private initForm(): void {
    this.updateCostAssistanceDailyForm = this.fb.group({
      daily_cost_id: [this.data?.cost_assistance_daily?.daily_cost_id || null, [Validators.required]],
      amount: [this.data?.cost_assistance_daily?.amount || null, [Validators.required, Validators.min(1)]],
    });
  }

  /**
   * Busca assíncrona das opções de tipos de diária disponíveis no sistema.
   */
  private fetchDailyCosts(): void {
    this.costAssistanceService.getDailyCosts()
      .pipe(
        finalize(() => {
          this.isLoadingOptions.set(false);
          this.cdr.markForCheck();
        }),
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe({
        next: (response) => {
          this.dailyCostsOptions.set(response || []);
        },
        error: () => {
          this.messageService.showMessage('Falha ao carregar as opções de diária.');
        }
      });
  }

  // --- MÉTODOS DE AÇÃO DO TEMPLATE (PROTECTED) ---

  /**
   * Submete as alterações da diária de forma segura, reativa e controlada.
   */
  protected onSubmit(): void {
    const dailyId = this.data?.cost_assistance_daily?.id;

    if (this.updateCostAssistanceDailyForm.invalid || !dailyId) {
      this.updateCostAssistanceDailyForm.markAllAsTouched();
      return;
    }

    if (this.isSubmitting()) {
      return;
    }

    this.isSubmitting.set(true);
    this.cdr.markForCheck();

    this.costAssistanceService.updateCostAssistanceDaily(dailyId, this.updateCostAssistanceDailyForm.getRawValue())
      .pipe(
        finalize(() => {
          this.isSubmitting.set(false);
          this.cdr.markForCheck();
        }),
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe({
        next: (response: any) => {
          this.messageService.showMessage(response?.message || 'Diária atualizada com sucesso!');
          this.dialogRef.close(true);
        },
        error: (err) => {
          const fallbackError = 'Ocorreu um erro ao atualizar a diária.';
          this.messageService.showMessage(err?.error?.message || fallbackError);
        }
      });
  }
}