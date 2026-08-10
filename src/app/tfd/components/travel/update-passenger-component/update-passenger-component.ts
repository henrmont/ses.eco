import { ChangeDetectionStrategy, Component, DestroyRef, OnInit, ChangeDetectorRef, inject, signal } from '@angular/core';
import { FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSelectModule } from '@angular/material/select';
import { CommonModule, CurrencyPipe } from '@angular/common';
import { finalize } from 'rxjs';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';

import { TravelService, ApiResponse } from '../../../services/travel-service';
import { MessageService } from '../../../../core/services/message-service';
import { TravelGender } from '../../../enums/travel-gender';

@Component({
  selector: 'app-update-passenger-component',
  standalone: true,
  imports: [
    CommonModule,
    CurrencyPipe,
    FormsModule,
    ReactiveFormsModule,
    MatDialogModule,
    MatButtonModule,
    MatFormFieldModule,
    MatInputModule,
    MatIconModule,
    MatProgressSpinnerModule,
    MatSelectModule
  ],
  templateUrl: './update-passenger-component.html',
  styleUrl: './update-passenger-component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class UpdatePassengerComponent implements OnInit {
  // Injeções de Dependência
  protected readonly data = inject(MAT_DIALOG_DATA);
  private readonly fb = inject(FormBuilder);
  private readonly travelService = inject(TravelService);
  private readonly messageService = inject(MessageService);
  private readonly dialogRef = inject(MatDialogRef<UpdatePassengerComponent>);
  private readonly cdr = inject(ChangeDetectorRef);
  private readonly destroyRef = inject(DestroyRef);

  // Mapeamento de Key / Value para o select de Sexo
  protected readonly genders = Object.entries(TravelGender).map(([key, value]) => ({ key, value }));

  // Form Group Principal
  protected passengerForm!: FormGroup;

  // Nome formatado apenas para exibição visual no formulário
  protected passengerDisplayName = signal<string>('');

  // Estados reativos via Signals
  protected readonly isSubmitting = signal<boolean>(false);

  // Mensagens estáticas de erro do formulário
  protected readonly errorMessages: { [key: string]: Array<{ type: string; message: string }> } = {
    tariff: [
      { type: 'required', message: 'O valor da tarifa é obrigatório.' },
      { type: 'min', message: 'O valor da tarifa não pode ser negativo.' }
    ],
    tax: [
      { type: 'required', message: 'O valor da taxa é obrigatório.' },
      { type: 'min', message: 'O valor da taxa não pode ser negativo.' }
    ],
    discount: [
      { type: 'min', message: 'O desconto não pode ser menor que 0%.' },
      { type: 'max', message: 'O desconto não pode exceder 100%.' }
    ],
    gender: [],
    seat: [],
    ticket: []
  };

  ngOnInit(): void {
    this.initForm();
    this.setPassengerDisplayName();
  }

  // --- INICIALIZAÇÃO E REGRAS DO FORMULÁRIO ---

  private initForm(): void {
    const passenger = this.data?.passenger;

    this.passengerForm = this.fb.group({
      tariff: [passenger?.tariff ?? null, [Validators.required, Validators.min(0)]],
      tax: [passenger?.tax ?? null, [Validators.required, Validators.min(0)]],
      discount: [passenger?.discount ?? null, [Validators.min(0), Validators.max(100)]],
      gender: [passenger?.gender ?? null],
      seat: [passenger?.seat ?? null],
      ticket: [passenger?.ticket ?? null]
    });
  }

  /**
   * Formata o nome do passageiro (Paciente ou Acompanhante) para exibição read-only.
   */
  private setPassengerDisplayName(): void {
    const passenger = this.data?.passenger;

    if (!passenger) {
      this.passengerDisplayName.set('Não informado');
      return;
    }

    const name = passenger?.patient?.name || passenger?.escort?.name || 'Passageiro Desconhecido';
    const typeLabel = passenger?.is_patient ? 'Paciente' : 'Acompanhante';

    this.passengerDisplayName.set(`${name} (${typeLabel})`);
  }

  // --- SUBMISSÃO ---

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
        next: (response: ApiResponse) => {
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