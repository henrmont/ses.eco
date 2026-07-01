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
  selector: 'app-update-travel-component',
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
  templateUrl: './update-travel-component.html',
  styleUrl: './update-travel-component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class UpdateTravelComponent implements OnInit {
  // Injeções de Dependência Dinâmicas e Seguras
  protected readonly data = inject(MAT_DIALOG_DATA);
  private readonly fb = inject(FormBuilder);
  private readonly travelService = inject(TravelService);
  private readonly messageService = inject(MessageService);
  private readonly dialogRef = inject(MatDialogRef<UpdateTravelComponent>);
  private readonly cdr = inject(ChangeDetectorRef);
  private readonly destroyRef = inject(DestroyRef);

  // Estrutura do Formulário exposta ao template
  protected updateTravelForm!: FormGroup;

  // Propriedades e Listagens estáticas de Enums
  protected readonly transportations = Object.values(Transportation);
  protected readonly types = Object.values(TravelType);

  // Estados gerenciados reativamente via Signals
  protected readonly disableDepartureDate = signal<boolean>(true);
  protected readonly disableReturnDate = signal<boolean>(true);
  protected readonly isSubmitting = signal<boolean>(false);

  // 🎯 Mapeamento local das mensagens de erro (Alinhado com o padrão do projeto)
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
    // Inicializa o estado das datas e do formulário baseado no tipo vindo do backend
    if (this.data?.travel?.type) {
      this.setType(this.data.travel.type);
    }
  }

  // --- MÉTODOS PRIVADOS DE INICIALIZAÇÃO E SUPORTE ---

  private initForm(): void {
    const travel = this.data?.travel;
    
    this.updateTravelForm = this.fb.group({
      transportation: [travel?.transportation || null, [Validators.required]],
      type: [travel?.type || null],
      origin: [travel?.origin || null],
      destination: [travel?.destination || null],
      departure_date: [travel?.departure_date || null],
      return_date: [travel?.return_date || null],
      description: [travel?.description || null],
      os: [travel?.os || null],
      locator: [travel?.locator || null]
    });
  }

  /**
   * Configura os efeitos colaterais reativos para gerenciar de forma limpa
   * a desabilitação e a limpeza síncrona dos controles de data.
   */
  private configureReactiveDateEffects(): void {
    effect(() => {
      const departureCtrl = this.updateTravelForm.get('departure_date');
      if (this.disableDepartureDate()) {
        departureCtrl?.disable({ emitEvent: false });
        departureCtrl?.setValue(null, { emitEvent: false });
      } else {
        departureCtrl?.enable({ emitEvent: false });
      }
    });

    effect(() => {
      const returnCtrl = this.updateTravelForm.get('return_date');
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
      // Caso seja Ida e Volta ou qualquer outro tipo alternativo
      this.disableDepartureDate.set(false);
      this.disableReturnDate.set(false);
    }
  }

  // --- MÉTODOS DE AÇÃO DO TEMPLATE (PROTECTED) ---

  protected onSelection(event: MatSelectChange): void {
    this.setType(event.value);
  }

  protected onSubmit(): void {
    const travelId = this.data?.travel?.id;
    if (this.updateTravelForm.invalid || !travelId) {
      this.updateTravelForm.markAllAsTouched();
      return;
    }

    this.isSubmitting.set(true);
    this.cdr.markForCheck();

    // getRawValue() extrai as informações completas, incluindo os inputs que o effect desabilitou
    this.travelService.updateTravel(travelId, this.updateTravelForm.getRawValue())
      .pipe(
        finalize(() => {
          this.isSubmitting.set(false);
          this.cdr.markForCheck();
        }),
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe({
        next: (response: any) => {
          this.messageService.showMessage(response?.message || 'Viagem atualizada com sucesso!');
          this.dialogRef.close(true);
        },
        error: (err) => {
          const fallbackError = 'Erro ao processar a atualização da viagem.';
          this.messageService.showMessage(err?.error?.message || fallbackError);
        }
      });
  }
}