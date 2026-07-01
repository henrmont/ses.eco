import { ChangeDetectionStrategy, Component, inject, OnInit, signal, ChangeDetectorRef, DestroyRef, effect } from '@angular/core';
import { FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatAutocompleteModule } from '@angular/material/autocomplete';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatChipsModule } from '@angular/material/chips';
import { MatSelectChange, MatSelectModule } from '@angular/material/select';
import { CommonModule } from '@angular/common';
import { finalize } from 'rxjs';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';

import { Transportation } from '../../../enums/transportation';
import { TravelType } from '../../../enums/travel-type';
import { TravelService } from '../../../services/travel-service';
import { MessageService } from '../../../../core/services/message-service';

@Component({
  selector: 'app-create-travel-component',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    MatDialogModule,
    MatButtonModule,
    MatFormFieldModule,
    MatInputModule,
    MatAutocompleteModule,
    MatProgressSpinnerModule,
    MatDatepickerModule,
    MatChipsModule,
    MatSelectModule
  ],
  templateUrl: './create-travel-component.html',
  styleUrl: './create-travel-component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class CreateTravelComponent implements OnInit {
  // Injeções de Dependência Dinâmicas
  protected readonly data = inject(MAT_DIALOG_DATA);
  private readonly fb = inject(FormBuilder);
  private readonly travelService = inject(TravelService);
  private readonly messageService = inject(MessageService);
  private readonly dialogRef = inject(MatDialogRef<CreateTravelComponent>);
  private readonly cdr = inject(ChangeDetectorRef);
  private readonly destroyRef = inject(DestroyRef);

  // Estrutura do Formulário exposta ao template
  protected createTravelForm!: FormGroup;

  // Propriedades e Listagens estáticas de Enums
  protected readonly transportations = Object.values(Transportation);
  protected readonly types = Object.values(TravelType);

  // Estados gerenciados reativamente via Signals
  protected readonly disableDepartureDate = signal<boolean>(true);
  protected readonly disableReturnDate = signal<boolean>(true);
  protected readonly isSubmitting = signal<boolean>(false);

  // 🎯 Mapeamento local das mensagens de erro (Idêntico ao modelo de referência)
  protected readonly errorMessages: { [key: string]: Array<{ type: string; message: string }> } = {
    transportation: [
      { type: 'required', message: 'O meio de transporte é obrigatório.' }
    ],
    type: [
      { type: 'required', message: 'O tipo da viagem é obrigatório.' }
    ],
    origin: [
      { type: 'required', message: 'A cidade de origem é obrigatória.' }
    ],
    destination: [
      { type: 'required', message: 'A cidade de destino é obrigatória.' }
    ]
  };

  constructor() {
    this.initForm();
    this.configureReactiveDateEffects();
  }

  ngOnInit(): void {
    // Pronto para lógicas extras de carregamento inicial, se necessário.
  }

  // --- MÉTODOS PRIVADOS DE INICIALIZAÇÃO E SUPORTE ---

  private initForm(): void {
    this.createTravelForm = this.fb.group({
      transportation: [null, [Validators.required]],
      type: [null],
      origin: [null],
      destination: [null],
      departure_date: [{ value: null, disabled: true }],
      return_date: [{ value: null, disabled: true }],
      description: [null],
      os: [null],
      locator: [null]
    });
  }

  /**
   * Configura os efeitos colaterais reativos para gerenciar de forma limpa e silenciosa
   * a alteração e desabilitação dos controles de data do formulário.
   */
  private configureReactiveDateEffects(): void {
    effect(() => {
      const departureCtrl = this.createTravelForm.get('departure_date');
      if (this.disableDepartureDate()) {
        departureCtrl?.disable({ emitEvent: false });
        departureCtrl?.setValue(null, { emitEvent: false });
      } else {
        departureCtrl?.enable({ emitEvent: false });
      }
    });

    effect(() => {
      const returnCtrl = this.createTravelForm.get('return_date');
      if (this.disableReturnDate()) {
        returnCtrl?.disable({ emitEvent: false });
        returnCtrl?.setValue(null, { emitEvent: false });
      } else {
        returnCtrl?.enable({ emitEvent: false });
      }
    });
  }

  /**
   * Altera os estados dos Signals reativos baseados na seleção do Tipo de Viagem
   */
  private setType(type: string): void {
    if (type === 'Ida') {
      this.disableDepartureDate.set(false);
      this.disableReturnDate.set(true);
    } else if (type === 'Volta') {
      this.disableDepartureDate.set(true);
      this.disableReturnDate.set(false);
    } else {
      // Caso seja Ida e Volta ou indefinido
      this.disableDepartureDate.set(false);
      this.disableReturnDate.set(false);
    }
  }

  // --- MÉTODOS DE AÇÃO DO TEMPLATE (PROTECTED) ---

  protected onSelection(event: MatSelectChange): void {
    this.setType(event.value);
  }

  protected onSubmit(): void {
    const requestId = this.data?.patient_request?.id;
    if (this.createTravelForm.invalid || !requestId) {
      this.createTravelForm.markAllAsTouched();
      return;
    }

    this.isSubmitting.set(true);
    this.cdr.markForCheck();

    // getRawValue garante a captura dos campos desabilitados mantendo a integridade da árvore do form
    this.travelService.createTravel(requestId, this.createTravelForm.getRawValue())
      .pipe(
        finalize(() => {
          this.isSubmitting.set(false);
          this.cdr.markForCheck();
        }),
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe({
        next: (response: any) => {
          this.messageService.showMessage(response?.message || 'Viagem criada com sucesso!');
          this.dialogRef.close(true);
        },
        error: (err) => {
          const fallbackError = 'Erro ao processar a criação da viagem.';
          this.messageService.showMessage(err?.error?.message || fallbackError);
        }
      });
  }
}