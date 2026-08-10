import { ChangeDetectionStrategy, Component, inject, OnInit, signal, ChangeDetectorRef, DestroyRef, computed } from '@angular/core';
import { FormBuilder, FormControl, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatAutocompleteModule } from '@angular/material/autocomplete';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatChipsModule } from '@angular/material/chips';
import { MatStepperModule } from '@angular/material/stepper';
import { MatIconModule } from '@angular/material/icon';
import { STEPPER_GLOBAL_OPTIONS } from '@angular/cdk/stepper';
import { CdkDragDrop, DragDropModule, moveItemInArray, transferArrayItem } from '@angular/cdk/drag-drop';
import { map, Observable, startWith, finalize } from 'rxjs';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';

import { CostAssistanceService } from '../../../services/cost-assistance-service';
import { MessageService } from '../../../../core/services/message-service';
import { CommonModule } from '@angular/common';
import { PatientRequestAttachment } from '../../../models/patient-request-attachment';

export interface FixedSlot {
  key: string;
  title: string;
  required: boolean;
  assignedFile: PatientRequestAttachment[];
}

@Component({
  selector: 'app-process-patient-request-to-payment-component',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule, 
    ReactiveFormsModule, 
    DragDropModule,
    MatStepperModule,
    MatDialogModule, 
    MatButtonModule, 
    MatFormFieldModule, 
    MatInputModule, 
    MatAutocompleteModule, 
    MatProgressSpinnerModule, 
    MatChipsModule, 
    MatIconModule
  ],
  providers: [
    { provide: STEPPER_GLOBAL_OPTIONS, useValue: { showError: true } }
  ],
  templateUrl: './process-patient-request-to-payment-component.html',
  styleUrl: './process-patient-request-to-payment-component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ProcessPatientRequestToPaymentComponent implements OnInit {
  protected readonly data = inject(MAT_DIALOG_DATA);
  private readonly fb = inject(FormBuilder);
  private readonly costAssistanceService = inject(CostAssistanceService);
  private readonly messageService = inject(MessageService);
  private readonly dialogRef = inject(MatDialogRef<ProcessPatientRequestToPaymentComponent>);
  private readonly cdr = inject(ChangeDetectorRef);
  private readonly destroyRef = inject(DestroyRef);

  protected readonly errorMessages: { [key: string]: Array<{ type: string; message: string }> } = {
    payment_professional_id: [
      { type: 'required', message: 'A seleção do profissional é obrigatória.' }
    ],
    cost_assistance_id: [
      { type: 'required', message: 'A seleção da ajuda de custo é obrigatória.' }
    ],
    travel_id: [
      { type: 'required', message: 'A seleção da viagem é obrigatória.' }
    ]
  };

  protected step1FormGroup!: FormGroup;
  protected step2FormGroup!: FormGroup;
  protected tramitPatientRequestForm!: FormGroup;

  // Controles dos Autocompletes
  protected readonly paymentProfessionalControl = new FormControl<string | any>('', [Validators.required]);
  protected readonly costAssistanceControl = new FormControl<string | any>('', [Validators.required]);
  protected readonly travelControl = new FormControl<string | any>('', [Validators.required]);

  protected readonly paymentProfessionalReadOnly = signal<boolean>(true);
  protected readonly paymentProfessionalLoading = signal<boolean>(false);
  protected readonly isSubmitting = signal<boolean>(false);
  
  protected readonly availableFiles = signal<PatientRequestAttachment[]>([]);

  protected readonly fixedSlots = signal<FixedSlot[]>([
    { key: 'cost_assistance_request', title: 'Requerimento de ajuda de custo', required: true, assignedFile: [] },
    { key: 'medical_declaration', title: 'Declaração médica', required: false, assignedFile: [] },
    { key: 'bank_statement', title: 'Comprovante bancário', required: true, assignedFile: [] },
    { key: 'registration_status', title: 'Situação cadastral', required: true, assignedFile: [] }
  ]);

  // Validação computada para checar se todos os slots obrigatórios foram preenchidos
  protected readonly areSlotsValid = computed(() => {
    return this.fixedSlots().every(
      slot => !slot.required || slot.assignedFile.length > 0
    );
  });

  readonly availableListId = 'available-files-list';
  slotListIds = computed(() => this.fixedSlots().map((_, index) => `slot-${index}`));

  // Opções para cada autocomplete
  protected paymentProfessionalOptions: any[] = [];
  protected filteredPaymentProfessionalOptions!: Observable<any[]>;

  protected costAssistanceOptions: any[] = [];
  protected filteredCostAssistanceOptions!: Observable<any[]>;

  protected travelOptions: any[] = [];
  protected filteredTravelOptions!: Observable<any[]>;

  ngOnInit(): void {
    this.initForms();
    this.loadArchives();
    this.getPaymentProfessionals();
    this.loadCostAssistanceOptions();
    this.loadTravelOptions();
  }

  private initForms(): void {
    this.step1FormGroup = this.fb.group({
      payment_professional_id: [null, [Validators.required]],
      cost_assistance_id: [null, [Validators.required]],
      travel_id: [null, [Validators.required]]
    });

    this.step2FormGroup = this.fb.group({});

    this.tramitPatientRequestForm = this.fb.group({
      step1: this.step1FormGroup,
      step2: this.step2FormGroup
    });

    // Sincroniza a limpeza do ID do form de trás quando a pessoa limpa a digitação no input
    this.paymentProfessionalControl.valueChanges.pipe(takeUntilDestroyed(this.destroyRef)).subscribe(val => {
      if (!val || typeof val !== 'object') {
        this.step1FormGroup.get('payment_professional_id')?.setValue(null);
        this.step1FormGroup.get('payment_professional_id')?.markAsTouched();
      }
    });

    this.costAssistanceControl.valueChanges.pipe(takeUntilDestroyed(this.destroyRef)).subscribe(val => {
      if (!val || typeof val !== 'object') {
        this.step1FormGroup.get('cost_assistance_id')?.setValue(null);
        this.step1FormGroup.get('cost_assistance_id')?.markAsTouched();
      }
    });

    this.travelControl.valueChanges.pipe(takeUntilDestroyed(this.destroyRef)).subscribe(val => {
      if (!val || typeof val !== 'object') {
        this.step1FormGroup.get('travel_id')?.setValue(null);
        this.step1FormGroup.get('travel_id')?.markAsTouched();
      }
    });

    this.validateSlots();
  }

  private loadArchives(): void {
    const rawArchives: PatientRequestAttachment[] = this.data?.patient_request?.attachments || [];
    this.availableFiles.set([...rawArchives]);
  }

  // --- SELEÇÃO DE PROFISSIONAL ---
  private setPaymentProfessionalOptions(): void {
    this.filteredPaymentProfessionalOptions = this.paymentProfessionalControl.valueChanges.pipe(
      startWith(this.paymentProfessionalControl.value),
      map(value => {
        if (value && typeof value === 'object') {
          return this._filterOptions(value.name || '', this.paymentProfessionalOptions);
        }
        return value ? this._filterOptions(value as string, this.paymentProfessionalOptions) : this.paymentProfessionalOptions.slice(0, 10);
      })
    );
  }

  protected displayPaymentProfessional(professional: any): string {
    return professional?.name || '';
  }

  protected setPaymentProfessional(option: any): void {
    if (option?.id) {
      this.step1FormGroup.get('payment_professional_id')?.setValue(option.id);
      this.step1FormGroup.markAsDirty();
      this.cdr.markForCheck();
    }
  }

  // --- SELEÇÃO DE AJUDA DE CUSTO ---
  private loadCostAssistanceOptions(): void {
    this.costAssistanceOptions = this.data?.patient_request?.cost_assistances || this.data?.cost_assistances || [];
    
    this.filteredCostAssistanceOptions = this.costAssistanceControl.valueChanges.pipe(
      startWith(this.costAssistanceControl.value),
      map(value => {
        if (value && typeof value === 'object') {
          return this._filterOptions(value.description || value.name || '', this.costAssistanceOptions);
        }
        return value ? this._filterOptions(value as string, this.costAssistanceOptions) : this.costAssistanceOptions.slice(0, 10);
      })
    );
  }

  protected displayCostAssistance(item: any): string {
    if (!item) return '';
    return item.description ? `${item.description} - R$ ${item.value || '0,00'}` : (item.name || '');
  }

  protected setCostAssistance(option: any): void {
    if (option?.id) {
      this.step1FormGroup.get('cost_assistance_id')?.setValue(option.id);
      this.step1FormGroup.markAsDirty();
      this.cdr.markForCheck();
    }
  }

  // --- SELEÇÃO DE VIAGEM ---
  private loadTravelOptions(): void {
    this.travelOptions = this.data?.patient_request?.travels || this.data?.travels || [];

    this.filteredTravelOptions = this.travelControl.valueChanges.pipe(
      startWith(this.travelControl.value),
      map(value => {
        if (value && typeof value === 'object') {
          return this._filterOptions(value.destination || value.description || '', this.travelOptions);
        }
        return value ? this._filterOptions(value as string, this.travelOptions) : this.travelOptions.slice(0, 10);
      })
    );
  }

  protected displayTravel(item: any): string {
    if (!item) return '';
    return item.destination ? `${item.destination} - R$ ${item.value || '0,00'}` : (item.description || '');
  }

  protected setTravel(option: any): void {
    if (option?.id) {
      this.step1FormGroup.get('travel_id')?.setValue(option.id);
      this.step1FormGroup.markAsDirty();
      this.cdr.markForCheck();
    }
  }

  // --- FILTRO GENÉRICO ---
  private _filterOptions(searchTerm: string, options: any[]): any[] {
    if (!searchTerm) {
      return options.slice(0, 10);
    }
    const filterValue = searchTerm.toLowerCase().trim();
    return options
      .filter(option => {
        const text = option.name || option.description || option.destination || '';
        return text.toLowerCase().includes(filterValue);
      })
      .slice(0, 10);
  }

  // --- DRAG AND DROP ---
  dropToAvailable(event: CdkDragDrop<PatientRequestAttachment[]>): void {
    if (event.previousContainer === event.container) {
      moveItemInArray(event.container.data, event.previousIndex, event.currentIndex);
    } else {
      transferArrayItem(
        event.previousContainer.data,
        event.container.data,
        event.previousIndex,
        event.currentIndex
      );
    }
    this.validateSlots();
    this.cdr.markForCheck();
  }

  protected isSlotAvailable = (drag: any, drop: any): boolean => {
    return drop.data && drop.data.length === 0;
  };

  dropToSlot(event: CdkDragDrop<PatientRequestAttachment[]>, slotIndex: number): void {
    const slots = [...this.fixedSlots()];

    if (event.previousContainer !== event.container) {
      transferArrayItem(
        event.previousContainer.data,
        event.container.data,
        event.previousIndex,
        0
      );
    } else {
      moveItemInArray(event.container.data, event.previousIndex, event.currentIndex);
    }

    this.fixedSlots.set(slots);
    this.validateSlots();
    this.cdr.markForCheck();
  }

  removeFileFromSlot(slotIndex: number): void {
    const slots = [...this.fixedSlots()];
    const targetSlot = slots[slotIndex];

    if (targetSlot.assignedFile.length > 0) {
      const removedFile = targetSlot.assignedFile.pop();
      if (removedFile) {
        this.availableFiles.update(files => [...files, removedFile]);
      }
    }

    this.fixedSlots.set(slots);
    this.validateSlots();
    this.cdr.markForCheck();
  }

  private validateSlots(): void {
    const isValid = this.areSlotsValid();

    if (!isValid) {
      this.step2FormGroup.setErrors({ incompleteSlots: true });
    } else {
      this.step2FormGroup.setErrors(null);
    }
  }

  // --- HTTP ---
  protected getPaymentProfessionals(): void {
    this.paymentProfessionalLoading.set(true);

    this.costAssistanceService.getPaymentProfessionals()
      .pipe(
        finalize(() => {
          this.paymentProfessionalLoading.set(false);
          this.cdr.markForCheck();
        }),
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe({
        next: (response) => {
          if (response) {
            this.paymentProfessionalOptions = response.map((item: any) => ({
              ...item?.patient,
              ...item
            }));
            this.setPaymentProfessionalOptions();
            this.paymentProfessionalReadOnly.set(false);
            this.cdr.markForCheck();
          }
        },
        error: () => {
          this.paymentProfessionalReadOnly.set(true);
        }
      });
  }

  protected onSubmit(): void {
    if (this.tramitPatientRequestForm.invalid || !this.areSlotsValid() || this.isSubmitting()) {
      this.tramitPatientRequestForm.markAllAsTouched();
      this.step1FormGroup.markAllAsTouched();
      this.paymentProfessionalControl.markAsTouched();
      this.costAssistanceControl.markAsTouched();
      this.travelControl.markAsTouched();
      return;
    }

    const requestId = this.data?.patient_request?.id;

    if (!requestId) {
      this.messageService.showMessage('Identificador da solicitação não encontrado.');
      return;
    }

    this.isSubmitting.set(true);
    this.cdr.markForCheck();

    const payload = {
      payment_professional_id: this.step1FormGroup.value.payment_professional_id,
      cost_assistance_id: this.step1FormGroup.value.cost_assistance_id,
      travel_id: this.step1FormGroup.value.travel_id,
      attachments: this.fixedSlots().map(slot => ({
        slot_key: slot.key,
        id: slot.assignedFile[0]?.id || null
      }))
    };

    this.costAssistanceService.processPatientRequestToPayment(requestId, payload)
      .pipe(
        finalize(() => {
          this.isSubmitting.set(false);
          this.cdr.markForCheck();
        }),
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe({
        next: (response: any) => {
          this.messageService.showMessage(response?.message || 'Solicitação processada para pagamento com sucesso!');
          this.dialogRef.close(true);
        },
        error: (err) => {
          const errMsg = err?.error?.message || 'Erro ao tentar processar a solicitação para pagamento.';
          this.messageService.showMessage(errMsg);
        }
      });
  }
}