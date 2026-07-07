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
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';

// Serviços e Constantes
import { PaymentService } from '../../../services/payment-service';
import { MessageService } from '../../../../core/services/message-service';

@Component({
  selector: 'app-payment-info-component',
  standalone: true,
  imports: [
    FormsModule, 
    ReactiveFormsModule, 
    MatDialogModule, 
    MatButtonModule, 
    MatFormFieldModule, 
    MatInputModule, 
    MatProgressSpinnerModule
  ],
  templateUrl: './payment-info-component.html',
  styleUrl: './payment-info-component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush // ⚡ Performance máxima com OnPush e Signals
})
export class PaymentInfoComponent implements OnInit {
  // 🔒 Injeções de dependência modernas via inject()
  protected readonly data = inject(MAT_DIALOG_DATA);
  private readonly fb = inject(FormBuilder);
  private readonly paymentService = inject(PaymentService);
  private readonly messageService = inject(MessageService);
  private readonly dialogRef = inject(MatDialogRef<PaymentInfoComponent>);
  private readonly cdr = inject(ChangeDetectorRef);
  private readonly destroyRef = inject(DestroyRef);

  // 📝 Estrutura do Formulário exposta ao template
  protected paymentInfoForm!: FormGroup;

  // 🎯 Mapeamento local das mensagens de erro para validação
  protected readonly errorMessages: { [key: string]: Array<{ type: string; message: string }> } = {
    description: [
      { type: 'required', message: 'A descrição das informações de pagamento é obrigatória.' }
    ]
  };

  // ⚡ Estados gerenciados reativamente via Signals
  protected readonly isSubmitting = signal<boolean>(false);

  constructor() {
    this.initForm();
  }

  ngOnInit(): void {
    // Pronto para lógicas extras de carregamento inicial, se necessário.
  }

  // --- MÉTODOS PRIVADOS DE INICIALIZAÇÃO E SUPORTE ---

  private initForm(): void {
    const currentDescription = this.data?.patient_request?.payment_info?.description || null;

    this.paymentInfoForm = this.fb.group({
      old: [currentDescription],
      description: [currentDescription, [Validators.required]]
    });
  }

  // --- MÉTODOS DE AÇÃO DO TEMPLATE (PROTECTED) ---

  /**
   * Submete o formulário com as informações de pagamento de forma segura, reativa e controlada.
   */
  protected onSubmit(): void {
    const requestId = this.data?.patient_request?.id;

    if (this.paymentInfoForm.invalid || !requestId) {
      this.paymentInfoForm.markAllAsTouched();
      return;
    }

    if (this.isSubmitting()) {
      return;
    }

    this.isSubmitting.set(true);
    this.cdr.markForCheck();

    this.paymentService.paymentInfo(requestId, this.paymentInfoForm.getRawValue())
      .pipe(
        finalize(() => {
          this.isSubmitting.set(false);
          this.cdr.markForCheck();
        }),
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe({
        next: (response: any) => {
          this.messageService.showMessage(response?.message || 'Informações de pagamento salvas com sucesso!');
          this.dialogRef.close(true);
        },
        error: (err) => {
          const fallbackError = 'Ocorreu um erro ao salvar as informações de pagamento.';
          this.messageService.showMessage(err?.error?.message || fallbackError);
        }
      });
  }
}