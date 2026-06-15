import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { MatDialogModule, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { NgxMaskDirective } from 'ngx-mask';
import { finalize } from 'rxjs';
import { SettingService } from '../../../services/setting-service';
import { MessageService } from '../../../../core/services/message-service';

@Component({
  selector: 'app-update-daily-cost-component',
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatDialogModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatProgressSpinnerModule,
    NgxMaskDirective,
  ],
  templateUrl: './update-daily-cost-component.html',
  styleUrls: ['./update-daily-cost-component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush // ⚡ Otimização de performance com OnPush
})
export class UpdateDailyCostComponent {
  private readonly fb = inject(FormBuilder);
  private readonly settingService = inject(SettingService);
  private readonly messageService = inject(MessageService);
  private readonly dialogRef = inject(MatDialogRef<UpdateDailyCostComponent>);

  // 🔒 Encapsulamento idêntico ao update-user para escopo de template
  protected readonly data = inject(MAT_DIALOG_DATA);

  updateDailyCostForm!: FormGroup;
  readonly isSubmitting = signal<boolean>(false);

  // 📝 Dicionário de mensagens de erro padronizado
  errorMessages: { [key: string]: Array<{ type: string; message: string }> } = {
    value: [
      { type: 'required', message: 'O valor é obrigatório.' },
      { type: 'min', message: 'O valor deve ser maior que zero.' }
    ]
  };

  constructor() {
    // 🌟 Instanciação e carga de dados movidas para o constructor
    this.updateDailyCostForm = this.fb.group({
      value: [this.data?.daily_cost?.value, [Validators.required, Validators.min(0.01)]],
    });

    this.updateDailyCostForm.updateValueAndValidity();
  }

  onSubmit(): void {
    if (this.updateDailyCostForm.invalid) {
      return;
    }

    this.isSubmitting.set(true);
    const formData = this.updateDailyCostForm.getRawValue();

    this.settingService.updateDailyCost(this.data.daily_cost.id, formData)
      .pipe(finalize(() => this.isSubmitting.set(false)))
      .subscribe({
        next: (res: any) => {
          this.messageService.showMessage(res.message || 'Custo de diária atualizado com sucesso!');
          this.dialogRef.close(true);
        },
        error: (err: any) => {
          const errMsg = err?.error?.message || 'Erro ao atualizar o custo da diária';
          this.messageService.showMessage(errMsg);
        }
      });
  }
}