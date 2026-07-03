import { ChangeDetectionStrategy, Component, ChangeDetectorRef, DestroyRef, inject, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { finalize } from 'rxjs';
import { signal } from '@angular/core';

// Angular Material
import { MatButtonModule } from '@angular/material/button';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';

// Serviços e Enums
import { CostAssistanceService } from '../../../services/cost-assistance-service';
import { MessageService } from '../../../../core/services/message-service';
import { CostAssistanceType } from '../../../enums/cost-assistance-type';

@Component({
  selector: 'app-update-cost-assistance-component',
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
  templateUrl: './update-cost-assistance-component.html',
  styleUrl: './update-cost-assistance-component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush // ⚡ Performance máxima com OnPush e Signals
})
export class UpdateCostAssistanceComponent implements OnInit {
  // Injeções de dependência modernas via inject()
  protected readonly data = inject(MAT_DIALOG_DATA);
  private readonly fb = inject(FormBuilder);
  private readonly costAssistanceService = inject(CostAssistanceService);
  private readonly messageService = inject(MessageService);
  private readonly dialogRef = inject(MatDialogRef<UpdateCostAssistanceComponent>);
  private readonly cdr = inject(ChangeDetectorRef);
  private readonly destroyRef = inject(DestroyRef);

  // Estrutura do Formulário exposta ao template
  protected updateCostAssistanceForm!: FormGroup;

  // 🎯 Mapeamento local das mensagens de erro (Idêntico ao modelo de referência)
  protected readonly errorMessages: { [key: string]: Array<{ type: string; message: string }> } = {
    name: [
      { type: 'required', message: 'O nome da ajuda de custo é obrigatório.' }
    ],
    type: [
      { type: 'required', message: 'O tipo da ajuda de custo é obrigatório.' }
    ]
  };

  protected readonly types = Object.values(CostAssistanceType);

  // Estados gerenciados reativamente via Signals
  protected readonly isSubmitting = signal<boolean>(false);

  constructor() {
    this.initForm();
  }

  ngOnInit(): void {
    // Pronto para lógicas extras de carregamento inicial, se necessário.
  }

  // --- MÉTODOS PRIVADOS DE INICIALIZAÇÃO E SUPORTE ---

  private initForm(): void {
    const costAssistance = this.data?.cost_assistance;

    this.updateCostAssistanceForm = this.fb.group({
      name: [costAssistance?.name || null, [Validators.required]],
      type: [costAssistance?.type || null, [Validators.required]],
    });
  }

  // --- MÉTODOS DE AÇÃO DO TEMPLATE (PROTECTED) ---

  /**
   * Submete o formulário para atualização da ajuda de custo de forma segura, reativa e controlada.
   */
  protected onSubmit(): void {
    const costAssistanceId = this.data?.cost_assistance?.id;

    if (this.updateCostAssistanceForm.invalid || !costAssistanceId) {
      this.updateCostAssistanceForm.markAllAsTouched();
      return;
    }

    if (this.isSubmitting()) {
      return;
    }

    this.isSubmitting.set(true);
    this.cdr.markForCheck();

    this.costAssistanceService.updateCostAssistance(costAssistanceId, this.updateCostAssistanceForm.getRawValue())
      .pipe(
        finalize(() => {
          this.isSubmitting.set(false);
          this.cdr.markForCheck();
        }),
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe({
        next: (response: any) => {
          this.messageService.showMessage(response?.message || 'Ajuda de custo atualizada com sucesso!');
          this.dialogRef.close(true);
        },
        error: (err) => {
          const fallbackError = 'Ocorreu um erro ao atualizar a ajuda de custo.';
          this.messageService.showMessage(err?.error?.message || fallbackError);
        }
      });
  }
}