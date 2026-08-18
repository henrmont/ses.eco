import { ChangeDetectionStrategy, Component, DestroyRef, OnInit, ChangeDetectorRef, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { finalize } from 'rxjs/operators';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';

// Material Modules
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatDatepickerInputEvent, MatDatepickerModule } from '@angular/material/datepicker';
import { MAT_DATE_LOCALE, MatNativeDateModule } from '@angular/material/core';
import { MatSelectChange, MatSelectModule } from '@angular/material/select';

// Importação segura do Moment
import * as _moment from 'moment';
const moment = (_moment as any).default || _moment;

// Domínio & Serviços
import { TravelTransportation } from '../../../enums/travel-transportation';
import { TravelType } from '../../../enums/travel-type';
import { TravelCompany } from '../../../enums/travel-company';
import { PatientRequestTravelService } from '../../../services/patient-request-travel.service';
import { MessageService } from '../../../../core/services/message-service';
import { CustomValidators } from '../../../../core/validators/custom.validator';

@Component({
  selector: 'app-patient-request-travel-update',
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
    MatDatepickerModule,
    MatNativeDateModule,
    MatSelectModule
  ],
  templateUrl: './patient-request-travel-update.component.html',
  styleUrl: './patient-request-travel-update.component.scss',
  providers: [
    { provide: MAT_DATE_LOCALE, useValue: 'pt-BR' }
  ],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class PatientRequestTravelUpdateComponent implements OnInit {
  // ==========================================
  // Injeção de Dependências
  // ==========================================
  protected readonly data = inject(MAT_DIALOG_DATA);
  private readonly fb = inject(FormBuilder);
  private readonly travelService = inject(PatientRequestTravelService);
  private readonly messageService = inject(MessageService);
  private readonly dialogRef = inject(MatDialogRef<PatientRequestTravelUpdateComponent>);
  private readonly cdr = inject(ChangeDetectorRef);
  private readonly destroyRef = inject(DestroyRef);

  // ==========================================
  // Propriedades de Domínio e Suporte
  // ==========================================
  private readonly consultationDate = this.data?.travel?.patient_request?.consultation_date || this.data?.consultation_date;

  protected readonly transportations = Object.values(TravelTransportation);
  protected readonly types = Object.values(TravelType);
  protected readonly airlines = Object.entries(TravelCompany).map(([key, value]) => ({ key, value }));

  // ==========================================
  // Formulário Principal
  // ==========================================
  protected updateTravelForm!: FormGroup;

  // ==========================================
  // Estados Reativos via Signals
  // ==========================================
  protected readonly disableDepartureDate = signal<boolean>(true);
  protected readonly disableReturnDate = signal<boolean>(true);
  protected readonly isSubmitting = signal<boolean>(false);

  // ==========================================
  // Dicionário de Mensagens de Erro
  // ==========================================
  protected readonly errorMessages: Record<string, Array<{ type: string; message: string }>> = {
    transportation: [
      { type: 'required', message: 'O meio de transporte é obrigatório.' }
    ],
    type: [],
    company: [],
    origin: [],
    destination: [],
    departure_date: [
      { type: 'required', message: 'A data de partida é obrigatória.' },
      { type: 'invalidDate', message: 'Data de partida inválida.' },
      { type: 'dateBefore', message: 'A data de partida deve ser posterior à data da consulta.' }
    ],
    return_date: [
      { type: 'required', message: 'A data de retorno é obrigatória.' },
      { type: 'invalidDate', message: 'Data de retorno inválida.' },
      { type: 'dateAfter', message: 'A data de retorno deve ser anterior à data da consulta.' }
    ]
  };

  // ==========================================
  // Ciclo de Vida (Hooks)
  // ==========================================
  ngOnInit(): void {
    this.initForm();

    if (this.data?.travel?.type) {
      this.setType(this.data.travel.type);
    }
  }

  // ==========================================
  // Inicialização do Formulário
  // ==========================================
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

  // ==========================================
  // Regras de Negócio e Controle de Campos
  // ==========================================
  private setType(type: string): void {
    const departureCtrl = this.updateTravelForm.get('departure_date');
    const returnCtrl = this.updateTravelForm.get('return_date');

    const baseDepartureValidators = [
      CustomValidators.dateValidator(),
      CustomValidators.dateBeforeValidator(this.consultationDate)
    ];

    const baseReturnValidators = [
      CustomValidators.dateValidator(),
      CustomValidators.dateAfterValidator(this.consultationDate)
    ];

    if (type === 'Ida') {
      this.disableDepartureDate.set(false);
      this.disableReturnDate.set(true);

      departureCtrl?.enable({ emitEvent: false });
      departureCtrl?.setValidators([Validators.required, ...baseDepartureValidators]);

      returnCtrl?.disable({ emitEvent: false });
      returnCtrl?.setValue(null, { emitEvent: false });
      returnCtrl?.setValidators(baseReturnValidators);

    } else if (type === 'Volta') {
      this.disableDepartureDate.set(true);
      this.disableReturnDate.set(false);

      departureCtrl?.disable({ emitEvent: false });
      departureCtrl?.setValue(null, { emitEvent: false });
      departureCtrl?.setValidators(baseDepartureValidators);

      returnCtrl?.enable({ emitEvent: false });
      returnCtrl?.setValidators([Validators.required, ...baseReturnValidators]);

    } else if (type === 'Ida e Volta') {
      this.disableDepartureDate.set(false);
      this.disableReturnDate.set(false);

      departureCtrl?.enable({ emitEvent: false });
      departureCtrl?.setValidators([Validators.required, ...baseDepartureValidators]);

      returnCtrl?.enable({ emitEvent: false });
      returnCtrl?.setValidators([Validators.required, ...baseReturnValidators]);

    } else {
      this.disableDepartureDate.set(true);
      this.disableReturnDate.set(true);

      departureCtrl?.disable({ emitEvent: false });
      departureCtrl?.setValue(null, { emitEvent: false });
      departureCtrl?.setValidators(baseDepartureValidators);

      returnCtrl?.disable({ emitEvent: false });
      returnCtrl?.setValue(null, { emitEvent: false });
      returnCtrl?.setValidators(baseReturnValidators);
    }

    departureCtrl?.updateValueAndValidity({ emitEvent: false });
    returnCtrl?.updateValueAndValidity({ emitEvent: false });
    this.cdr.markForCheck();
  }

  // ==========================================
  // Handlers e Eventos da Interface
  // ==========================================
  protected onSelection(event: MatSelectChange): void {
    this.setType(event.value);
  }

  protected setDepartureDate(event: MatDatepickerInputEvent<any>): void {
    if (event.value) {
      const parsedDate = moment(event.value);
      if (parsedDate.isValid()) {
        this.updateTravelForm.get('departure_date')?.setValue(parsedDate, { emitEvent: true });
        this.updateTravelForm.get('departure_date')?.markAsDirty();
        this.cdr.markForCheck();
      }
    }
  }

  protected setReturnDate(event: MatDatepickerInputEvent<any>): void {
    if (event.value) {
      const parsedDate = moment(event.value);
      if (parsedDate.isValid()) {
        this.updateTravelForm.get('return_date')?.setValue(parsedDate, { emitEvent: true });
        this.updateTravelForm.get('return_date')?.markAsDirty();
        this.cdr.markForCheck();
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

  // ==========================================
  // Submissão do Formulário
  // ==========================================
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