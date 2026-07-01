import { ChangeDetectionStrategy, Component, inject, OnInit, signal, ChangeDetectorRef, DestroyRef } from '@angular/core';
import { FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSelectModule } from '@angular/material/select';
import { MatSlideToggleChange, MatSlideToggleModule } from '@angular/material/slide-toggle';
import { CommonModule } from '@angular/common';
import { finalize } from 'rxjs';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';

import { TravelService } from '../../../services/travel-service';
import { MessageService } from '../../../../core/services/message-service';

@Component({
  selector: 'app-create-passenger-component',
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
    MatSelectModule,
    MatSlideToggleModule
  ],
  templateUrl: './create-passenger-component.html',
  styleUrl: './create-passenger-component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class CreatePassengerComponent implements OnInit {
  // Injeções de Dependência Dinâmicas
  protected readonly data = inject(MAT_DIALOG_DATA);
  private readonly fb = inject(FormBuilder);
  private readonly travelService = inject(TravelService);
  private readonly messageService = inject(MessageService);
  private readonly dialogRef = inject(MatDialogRef<CreatePassengerComponent>);
  private readonly cdr = inject(ChangeDetectorRef);
  private readonly destroyRef = inject(DestroyRef);

  // Estrutura do Formulário exposta ao template
  protected passengerForm!: FormGroup;

  // Estados gerenciados reativamente via Signals
  protected readonly passengersOptions = signal<any[]>([]);
  protected readonly isSubmitting = signal<boolean>(false);

  // 🎯 Mapeamento local das mensagens de erro (Idêntico ao modelo de referência)
  protected readonly errorMessages: { [key: string]: Array<{ type: string; message: string }> } = {
    passenger: [
      { type: 'required', message: 'A seleção do passageiro é obrigatória.' }
    ],
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
    this.setPassengerOptions();
  }

  // --- MÉTODOS PRIVADOS DE INICIALIZAÇÃO E SUPORTE ---

  private initForm(): void {
    this.passengerForm = this.fb.group({
      is_patient: [false, [Validators.required]],
      passenger: [null, [Validators.required]],
      tariff: [null, [Validators.required, Validators.min(0)]],
      tax: [null, [Validators.required, Validators.min(0)]]
    });
  }

  /**
   * Altera as opções disponíveis do select com base no estado do toggle (Paciente / Acompanhante)
   */
  private setPassengerOptions(): void {
    const reportData = this.data?.travel?.patient_request?.report?.patient_care;
    const isPatient = this.passengerForm.get('is_patient')?.value;

    if (!reportData) {
      this.passengersOptions.set([]);
      return;
    }

    if (isPatient) {
      this.passengersOptions.set(reportData.patient ? [reportData.patient] : []);
    } else {
      this.passengersOptions.set(reportData.escorts || []);
    }

    // Reseta o controle de seleção para evitar estados visuais inconsistentes
    this.passengerForm.get('passenger')?.setValue(null);
  }

  // --- MÉTODOS DE AÇÃO DO TEMPLATE (PROTECTED) ---

  protected onToggleChange(event: MatSlideToggleChange): void {
    this.setPassengerOptions();
  }

  protected onSubmit(): void {
    const travelId = this.data?.travel?.id;
    if (this.passengerForm.invalid || !travelId) {
      this.passengerForm.markAllAsTouched();
      return;
    }

    this.isSubmitting.set(true);
    this.cdr.markForCheck();

    this.travelService.createPassenger(travelId, this.passengerForm.getRawValue())
      .pipe(
        finalize(() => {
          this.isSubmitting.set(false);
          this.cdr.markForCheck();
        }),
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe({
        next: (response: any) => {
          this.messageService.showMessage(response?.message || 'Passageiro adicionado com sucesso!');
          this.dialogRef.close(true);
        },
        error: (err) => {
          const fallbackError = 'Erro ao processar o cadastro do passageiro.';
          this.messageService.showMessage(err?.error?.message || fallbackError);
        }
      });
  }
}