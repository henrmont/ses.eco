import { 
  ChangeDetectionStrategy, 
  Component, 
  DestroyRef, 
  OnInit, 
  inject, 
  signal 
} from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatIconModule } from '@angular/material/icon';
import { finalize } from 'rxjs';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';

import { SettingService } from '../../../services/setting.service';
import { MessageService } from '../../../../core/services/message-service';
import { ApiResponse } from '../../../../core/models/api-response.model';
import { BudgetAllocation } from '../../../models/budget-allocation.model';

@Component({
  selector: 'app-budget-allocation-update',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    MatDialogModule,
    MatButtonModule,
    MatFormFieldModule,
    MatInputModule,
    MatProgressSpinnerModule,
    MatIconModule
  ],
  templateUrl: './budget-allocation-update.component.html',
  styleUrl: './budget-allocation-update.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class BudgetAllocationUpdateComponent implements OnInit {
  // Injeções de Dependência
  protected readonly data = inject(MAT_DIALOG_DATA, { optional: true }) as { budgetAllocation?: BudgetAllocation };
  private readonly fb = inject(FormBuilder);
  private readonly settingService = inject(SettingService);
  private readonly messageService = inject(MessageService);
  private readonly dialogRef = inject(MatDialogRef<BudgetAllocationUpdateComponent>);
  private readonly destroyRef = inject(DestroyRef);

  // Formulário Reativo
  protected budgetAllocationForm!: FormGroup;

  // Estado de Submissão em Signal
  protected readonly isSubmitting = signal<boolean>(false);

  // Mapeamento de Mensagens de Erro Tipado
  protected readonly errorMessages: Record<string, Array<{ type: string; message: string }>> = {
    program: [
      { type: 'required', message: 'O programa é obrigatório.' }
    ],
    active_project: [
      { type: 'required', message: 'O projeto ativo é obrigatório.' }
    ],
    nature_of_expenditure: [
      { type: 'required', message: 'A natureza da despesa é obrigatória.' }
    ],
    source: [
      { type: 'required', message: 'A fonte é obrigatória.' }
    ]
  };

  ngOnInit(): void {
    this.initForm();
  }

  private initForm(): void {
    const budget = this.data?.budgetAllocation;

    this.budgetAllocationForm = this.fb.group({
      program: [budget?.program || '', [Validators.required]],
      active_project: [budget?.active_project || '', [Validators.required]],
      nature_of_expenditure: [budget?.nature_of_expenditure || '', [Validators.required]],
      source: [budget?.source || '', [Validators.required]]
    });
  }

  // --- MÉTODOS DE AÇÃO DO TEMPLATE (PROTECTED) ---

  protected onSubmit(): void {
    const budgetId = this.data?.budgetAllocation?.id;
    if (!budgetId) {
      this.messageService.showMessage('Identificador da alocação orçamentária inválido.');
      return;
    }

    if (this.budgetAllocationForm.invalid) {
      this.budgetAllocationForm.markAllAsTouched();
      return;
    }

    this.isSubmitting.set(true);

    this.settingService.updateBudgetAllocation(budgetId, this.budgetAllocationForm.getRawValue())
      .pipe(
        finalize(() => this.isSubmitting.set(false)),
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe({
        next: (response: ApiResponse) => {
          this.messageService.showMessage(response?.message || 'Alocação orçamentária atualizada com sucesso!');
          this.dialogRef.close(true);
        },
        error: (err) => {
          const fallbackError = 'Erro ao atualizar a alocação orçamentária.';
          this.messageService.showMessage(err?.error?.message || fallbackError);
        }
      });
  }
}