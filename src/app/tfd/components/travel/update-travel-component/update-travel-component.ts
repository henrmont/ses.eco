import { ChangeDetectionStrategy, Component, DestroyRef, OnInit, ChangeDetectorRef, inject, signal, effect, Injector } from '@angular/core';
import { FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatAutocompleteModule } from '@angular/material/autocomplete';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatDatepickerInputEvent, MatDatepickerModule } from '@angular/material/datepicker';
import { MatChipsModule } from '@angular/material/chips';
import { MatSelectChange, MatSelectModule } from '@angular/material/select';
import { CommonModule } from '@angular/common';
import { finalize } from 'rxjs';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { MAT_DATE_LOCALE, MatNativeDateModule } from '@angular/material/core';

// Importação segura do Moment
import * as _moment from 'moment';
const moment = (_moment as any).default || _moment;

// Domínio & Infraestrutura
import { Transportation } from '../../../enums/transportation';
import { TravelType } from '../../../enums/travel-type';
import { AirlineCompany } from '../../../enums/airline-company'; // Import do enum da companhia aérea
import { TravelService } from '../../../services/travel-service';
import { MessageService } from '../../../../core/services/message-service';
import { CustomValidators } from '../../../../core/validators/custom.validator';

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
    MatNativeDateModule,
    MatChipsModule,
    MatSelectModule
  ],
  templateUrl: './update-travel-component.html',
  styleUrl: './update-travel-component.scss',
  providers: [
    { provide: MAT_DATE_LOCALE, useValue: 'pt-BR' }
  ],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class UpdateTravelComponent implements OnInit {
  // Injeções de Dependência
  protected readonly data = inject(MAT_DIALOG_DATA);
  private readonly fb = inject(FormBuilder);
  private readonly travelService = inject(TravelService);
  private readonly messageService = inject(MessageService);
  private readonly dialogRef = inject(MatDialogRef<UpdateTravelComponent>);
  private readonly cdr = inject(ChangeDetectorRef);
  private readonly destroyRef = inject(DestroyRef);
  private readonly injector = inject(Injector);

  // Data de referência da consulta (vinda do objeto travel ou diretamente do dialog)
  private readonly consultationDate = this.data?.travel?.patient_request?.consultation_date || this.data?.consultation_date;

  // Form Group Principal
  protected updateTravelForm!: FormGroup;

  // Listagens estáticas dos Enums
  protected readonly transportations = Object.values(Transportation);
  protected readonly types = Object.values(TravelType);

  // Mapeamento de Key / Value para o select de Companhia Aérea
  protected readonly airlines = Object.entries(AirlineCompany).map(([key, value]) => ({ key, value }));

  // Estados reativos via Signals
  protected readonly disableDepartureDate = signal<boolean>(true);
  protected readonly disableReturnDate = signal<boolean>(true);
  protected readonly isSubmitting = signal<boolean>(false);

  // Mensagens estáticas de erro do formulário
  protected readonly errorMessages: { [key: string]: Array<{ type: string; message: string }> } = {
    transportation: [{ type: 'required', message: 'O meio de transporte é obrigatório.' }],
    type: [],
    company: [],
    origin: [],
    destination: [],
    departure_date: [
      { type: 'required', message: 'A data de partida é obrigatória.' },
      { type: 'invalidDate', message: 'Data de partida inválida.' },
      { type: 'dateBefore', message: 'A data de partida posterior à data da consulta.' }
    ],
    return_date: [
      { type: 'required', message: 'A data de retorno é obrigatória.' },
      { type: 'invalidDate', message: 'Data de retorno inválida.' },
      { type: 'dateAfter', message: 'A data de retorno anterior à data da consulta.' }
    ]
  };

  ngOnInit(): void {
    this.initForm();
    this.configureReactiveDateEffects();
    
    if (this.data?.travel?.type) {
      this.setType(this.data.travel.type);
    }
  }

  // --- INICIALIZAÇÃO E REGRAS DO FORMULÁRIO ---

  private initForm(): void {
    const travel = this.data?.travel;

    const departureDate = travel?.departure_date ? moment(travel.departure_date) : null;
    const returnDate = travel?.return_date ? moment(travel.return_date) : null;

    this.updateTravelForm = this.fb.group({
      transportation: [travel?.transportation || null, [Validators.required]],
      type: [travel?.type || null],
      company: [travel?.company || null],
      origin: [travel?.origin || null],
      destination: [travel?.destination || null],
      departure_date: [
        { value: departureDate, disabled: true },
        [
          CustomValidators.dateValidator(),
          CustomValidators.dateBeforeValidator(this.consultationDate)
        ]
      ],
      return_date: [
        { value: returnDate, disabled: true },
        [
          CustomValidators.dateValidator(),
          CustomValidators.dateAfterValidator(this.consultationDate)
        ]
      ],
      description: [travel?.description || null],
      os: [travel?.os || null],
      locator: [travel?.locator || null]
    });
  }

  /**
   * Efeitos colaterais reativos para habilitar/desabilitar os campos de data 
   * e alternar dinamicamente o validador 'required' sem perder os validadores customizados.
   */
  private configureReactiveDateEffects(): void {
    effect(() => {
      const departureCtrl = this.updateTravelForm.get('departure_date');
      const baseValidators = [
        CustomValidators.dateValidator(),
        CustomValidators.dateBeforeValidator(this.consultationDate)
      ];

      if (this.disableDepartureDate()) {
        departureCtrl?.disable({ emitEvent: false });
        departureCtrl?.setValidators(baseValidators);
      } else {
        departureCtrl?.enable({ emitEvent: false });
        departureCtrl?.setValidators([Validators.required, ...baseValidators]);
      }
      departureCtrl?.updateValueAndValidity({ emitEvent: false });
    }, { injector: this.injector });

    effect(() => {
      const returnCtrl = this.updateTravelForm.get('return_date');
      const baseValidators = [
        CustomValidators.dateValidator(),
        CustomValidators.dateAfterValidator(this.consultationDate)
      ];

      if (this.disableReturnDate()) {
        returnCtrl?.disable({ emitEvent: false });
        returnCtrl?.setValidators(baseValidators);
      } else {
        returnCtrl?.enable({ emitEvent: false });
        returnCtrl?.setValidators([Validators.required, ...baseValidators]);
      }
      returnCtrl?.updateValueAndValidity({ emitEvent: false });
    }, { injector: this.injector });
  }

  private setType(type: string): void {
    if (type === 'Ida') {
      this.disableDepartureDate.set(false);
      this.disableReturnDate.set(true);
      this.updateTravelForm.get('return_date')?.setValue(null, { emitEvent: false });
    } else if (type === 'Volta') {
      this.disableDepartureDate.set(true);
      this.disableReturnDate.set(false);
      this.updateTravelForm.get('departure_date')?.setValue(null, { emitEvent: false });
    } else if (type === 'Ida e Volta') {
      this.disableDepartureDate.set(false);
      this.disableReturnDate.set(false);
    } else {
      this.disableDepartureDate.set(true);
      this.disableReturnDate.set(true);
      this.updateTravelForm.get('departure_date')?.setValue(null, { emitEvent: false });
      this.updateTravelForm.get('return_date')?.setValue(null, { emitEvent: false });
    }
  }

  // --- MÉTODOS DE AÇÃO DO TEMPLATE ---

  protected onSelection(event: MatSelectChange): void {
    this.setType(event.value);
  }

  protected setDepartureDate(event: MatDatepickerInputEvent<any>): void {
    if (event.value) {
      const parsedDate = moment(event.value);
      if (parsedDate.isValid()) {
        this.updateTravelForm.get('departure_date')?.setValue(parsedDate, { emitEvent: true });
        this.updateTravelForm.get('departure_date')?.markAsDirty();
      }
    }
  }

  protected setReturnDate(event: MatDatepickerInputEvent<any>): void {
    if (event.value) {
      const parsedDate = moment(event.value);
      if (parsedDate.isValid()) {
        this.updateTravelForm.get('return_date')?.setValue(parsedDate, { emitEvent: true });
        this.updateTravelForm.get('return_date')?.markAsDirty();
      }
    }
  }

  protected onlyNumbersAndSlashes(event: KeyboardEvent): boolean {
    const charCode = event.key;
    const allowedCharacters = /^[0-9\/]$/;
    
    if (!allowedCharacters.test(charCode)) {
      event.preventDefault();
      return false;
    }
    return true;
  }

  // --- SUBMISSÃO ---

  protected onSubmit(): void {
    const travelId = this.data?.travel?.id;

    if (!travelId) {
      this.messageService.showMessage('Identificador da viagem não encontrado.');
      return;
    }

    if (this.updateTravelForm.invalid) {
      this.updateTravelForm.markAllAsTouched();
      return;
    }

    this.isSubmitting.set(true);
    this.cdr.markForCheck();

    const rawValue = this.updateTravelForm.getRawValue();
    const payload = {
      ...rawValue,
      departure_date: rawValue.departure_date && moment.isMoment(rawValue.departure_date)
        ? rawValue.departure_date.format('YYYY-MM-DD')
        : rawValue.departure_date,
      return_date: rawValue.return_date && moment.isMoment(rawValue.return_date)
        ? rawValue.return_date.format('YYYY-MM-DD')
        : rawValue.return_date
    };

    this.travelService.updateTravel(travelId, payload)
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