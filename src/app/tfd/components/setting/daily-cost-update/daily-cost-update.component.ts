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
import { NgxMaskDirective } from 'ngx-mask';

import { SettingService } from '../../../services/setting.service';
import { MessageService } from '../../../../core/services/message-service';
import { ApiResponse } from '../../../../core/models/api-response.model';
import { DailyCost } from '../../../models/daily-cost.model';

@Component({
  selector: 'app-daily-cost-update',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    MatDialogModule,
    MatButtonModule,
    MatFormFieldModule,
    MatInputModule,
    MatProgressSpinnerModule,
    MatIconModule,
    NgxMaskDirective
  ],
  templateUrl: './daily-cost-update.component.html',
  styleUrl: './daily-cost-update.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class DailyCostUpdateComponent implements OnInit {
  // Injeções de Dependência
  protected readonly data = inject(MAT_DIALOG_DATA, { optional: true }) as { daily_cost?: DailyCost };
  private readonly fb = inject(FormBuilder);
  private readonly settingService = inject(SettingService);
  private readonly messageService = inject(MessageService);
  private readonly dialogRef = inject(MatDialogRef<DailyCostUpdateComponent>);
  private readonly destroyRef = inject(DestroyRef);

  // Formulário Reativo
  protected dailyCostForm!: FormGroup;

  // Estado de Submissão em Signal
  protected readonly isSubmitting = signal<boolean>(false);

  // Mapeamento de Mensagens de Erro Tipado
  protected readonly errorMessages: Record<string, Array<{ type: string; message: string }>> = {
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
      value: [this.data?.daily_cost?.value ?? '', [Validators.required, Validators.min(0.01)]]
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

    this.settingService.updateDailyCost(dailyCostId, this.dailyCostForm.getRawValue())
      .pipe(
        finalize(() => this.isSubmitting.set(false)),
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe({
        next: (response: ApiResponse) => {
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