import { ChangeDetectionStrategy, Component, inject, OnInit, signal, ChangeDetectorRef, DestroyRef } from '@angular/core';
import { FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatIconModule } from '@angular/material/icon';
import { finalize } from 'rxjs';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { NgxMaskDirective } from 'ngx-mask';
import { SettingService } from '../../../services/setting-service';
import { MessageService } from '../../../../core/services/message-service';

@Component({
  selector: 'app-update-daily-cost-component',
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    MatDialogModule,
    MatButtonModule,
    MatFormFieldModule,
    MatInputModule,
    MatProgressSpinnerModule,
    MatIconModule,
    NgxMaskDirective
  ],
  templateUrl: './update-daily-cost-component.html',
  styleUrl: './update-daily-cost-component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class UpdateDailyCostComponent implements OnInit {
  // Injeções de Dependência Dinâmicas
  protected readonly data = inject(MAT_DIALOG_DATA);
  private readonly fb = inject(FormBuilder);
  private readonly settingService = inject(SettingService);
  private readonly messageService = inject(MessageService);
  private readonly dialogRef = inject(MatDialogRef<UpdateDailyCostComponent>);
  private readonly cdr = inject(ChangeDetectorRef);
  private readonly destroyRef = inject(DestroyRef);

  // Estrutura do Formulário exposta ao template
  protected dailyCostForm!: FormGroup;

  // Estados gerenciados reativamente via Signals
  protected readonly isSubmitting = signal<boolean>(false);

  // 🎯 Mapeamento local das mensagens de erro padronizado
  protected readonly errorMessages: { [key: string]: Array<{ type: string; message: string }> } = {
    value: [
      { type: 'required', message: 'O valor é obrigatório.' },
      { type: 'min', message: 'O valor deve ser maior que zero.' }
    ]
  };

  ngOnInit(): void {
    this.initForm();
  }

  private initForm(): void {
    this.dailyCostForm = this.fb.group({
      value: [this.data?.daily_cost?.value, [Validators.required, Validators.min(0.01)]],
    });
  }

  // --- MÉTODOS DE AÇÃO DO TEMPLATE (PROTECTED) ---

  protected onSubmit(): void {
    const dailyCostId = this.data?.daily_cost?.id;
    if (!dailyCostId) {
      this.messageService.showMessage('Identificador do custo de diária inválido.');
      return;
    }

    if (this.dailyCostForm.invalid) {
      this.dailyCostForm.markAllAsTouched();
      return;
    }

    this.isSubmitting.set(true);
    this.cdr.markForCheck();

    this.settingService.updateDailyCost(dailyCostId, this.dailyCostForm.getRawValue())
      .pipe(
        finalize(() => {
          this.isSubmitting.set(false);
          this.cdr.markForCheck();
        }),
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe({
        next: (response: any) => {
          this.messageService.showMessage(response?.message || 'Custo de diária atualizado com sucesso!');
          this.dialogRef.close(true);
        },
        error: (err) => {
          const fallbackError = 'Erro ao atualizar o custo da diária.';
          this.messageService.showMessage(err?.error?.message || fallbackError);
        }
      });
  }
}