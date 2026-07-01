import { ChangeDetectionStrategy, Component, inject, OnInit, signal, ChangeDetectorRef, DestroyRef } from '@angular/core';
import { FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSelectModule } from '@angular/material/select';
import { CommonModule } from '@angular/common';
import { finalize } from 'rxjs';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';

import { TravelService } from '../../../services/travel-service';
import { MessageService } from '../../../../core/services/message-service';

@Component({
  selector: 'app-update-passenger-component',
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
    MatSelectModule
  ],
  templateUrl: './update-passenger-component.html',
  styleUrl: './update-passenger-component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class UpdatePassengerComponent implements OnInit {
  // Injeções de Dependência Dinâmicas
  protected readonly data = inject(MAT_DIALOG_DATA);
  private readonly fb = inject(FormBuilder);
  private readonly travelService = inject(TravelService);
  private readonly messageService = inject(MessageService);
  private readonly dialogRef = inject(MatDialogRef<UpdatePassengerComponent>);
  private readonly cdr = inject(ChangeDetectorRef);
  private readonly destroyRef = inject(DestroyRef);

  // Estrutura do Formulário exposta ao template
  protected passengerForm!: FormGroup;

  // Estados gerenciados reativamente via Signals
  protected readonly isSubmitting = signal<boolean>(false);

  // 🎯 Mapeamento local das mensagens de erro (Idêntico ao modelo de referência)
  protected readonly errorMessages: { [key: string]: Array<{ type: string; message: string }> } = {
    tariff: [
      { type: 'required', message: 'O valor da tarifa é obrigatório.' },
      { type: 'min', message: 'O valor da tarifa não pode ser negativo.' }
    ],
    tax: [
      { type: 'required', message: 'O valor da taxa é obrigatório.' },
      { type: 'min', message: 'O valor da taxa não pode ser negativo.' }
    ]
  };

  constructor() {
    this.initForm();
  }

  ngOnInit(): void {
    // Pronto para lógicas extras de carregamento inicial se necessário
  }

  // --- MÉTODOS PRIVADOS DE INICIALIZAÇÃO E SUPORTE ---

  private initForm(): void {
    const passenger = this.data?.passenger;

    this.passengerForm = this.fb.group({
      tariff: [passenger?.tariff ?? null, [Validators.required, Validators.min(0)]],
      tax: [passenger?.tax ?? null, [Validators.required, Validators.min(0)]]
    });
  }

  // --- MÉTODOS DE AÇÃO DO TEMPLATE (PROTECTED) ---

  protected onSubmit(): void {
    const passengerId = this.data?.passenger?.id;
    if (this.passengerForm.invalid || !passengerId) {
      this.passengerForm.markAllAsTouched();
      return;
    }

    this.isSubmitting.set(true);
    this.cdr.markForCheck();

    this.travelService.updatePassenger(passengerId, this.passengerForm.getRawValue())
      .pipe(
        finalize(() => {
          this.isSubmitting.set(false);
          this.cdr.markForCheck();
        }),
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe({
        next: (response: any) => {
          this.messageService.showMessage(response?.message || 'Passageiro atualizado com sucesso!');
          this.dialogRef.close(true);
        },
        error: (err) => {
          const fallbackError = 'Erro ao processar a atualização do passageiro.';
          this.messageService.showMessage(err?.error?.message || fallbackError);
        }
      });
  }
}