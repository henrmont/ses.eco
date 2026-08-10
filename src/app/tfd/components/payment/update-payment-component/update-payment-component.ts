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
import { PaymentService } from '../../../services/payment-service';
import { MessageService } from '../../../../core/services/message-service';

@Component({
  selector: 'app-update-payment-component',
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
  templateUrl: './update-payment-component.html',
  styleUrl: './update-payment-component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class UpdatePaymentComponent implements OnInit {
  // Injeções de Dependência
  protected readonly data = inject(MAT_DIALOG_DATA);
  private readonly fb = inject(FormBuilder);
  private readonly paymentService = inject(PaymentService);
  private readonly messageService = inject(MessageService);
  private readonly dialogRef = inject(MatDialogRef<UpdatePaymentComponent>);
  private readonly cdr = inject(ChangeDetectorRef);
  private readonly destroyRef = inject(DestroyRef);

  // Form Group Principal
  protected updatePaymentForm!: FormGroup;

  // Estados reativos via Signals
  protected readonly isSubmitting = signal<boolean>(false);

  // Mensagens estáticas de erro do formulário
  protected readonly errorMessages: { [key: string]: Array<{ type: string; message: string }> } = {
    sigadoc: [
      { type: 'required', message: 'O número do SIGADOC é obrigatório.' }
    ],
    creditor: [
      { type: 'required', message: 'O código do credor é obrigatório.' }
    ],
    document_number: [
      { type: 'required', message: 'O número do documento é obrigatório.' }
    ]
  };

  ngOnInit(): void {
    this.initForm();
  }

  // --- INICIALIZAÇÃO E REGRAS DO FORMULÁRIO ---

  private initForm(): void {
    const payment = this.data?.payment;

    this.updatePaymentForm = this.fb.group({
      sigadoc: [payment?.sigadoc || null, [Validators.required]],
      creditor: [payment?.creditor || null, [Validators.required]],
      document_number: [payment?.document_number || null, [Validators.required]]
    });
  }

  // --- SUBMISSÃO ---

  /**
   * Submete o formulário para atualização do pagamento.
   */
  protected onSubmit(): void {
    const paymentId = this.data?.payment?.id;

    if (this.updatePaymentForm.invalid || !paymentId) {
      this.updatePaymentForm.markAllAsTouched();
      return;
    }

    if (this.isSubmitting()) {
      return;
    }

    this.isSubmitting.set(true);
    this.cdr.markForCheck();

    const payload = this.updatePaymentForm.value;

    this.paymentService.updatePayment(paymentId, payload)
      .pipe(
        finalize(() => {
          this.isSubmitting.set(false);
          this.cdr.markForCheck();
        }),
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe({
        next: (response: any) => {
          this.messageService.showMessage(response?.message || 'Pagamento atualizado com sucesso!');
          this.dialogRef.close(true);
        },
        error: (err) => {
          const fallbackError = 'Ocorreu um erro ao atualizar o pagamento.';
          this.messageService.showMessage(err?.error?.message || fallbackError);
        }
      });
  }
}