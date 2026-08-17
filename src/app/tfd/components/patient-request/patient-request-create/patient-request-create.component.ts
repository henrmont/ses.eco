import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, ChangeDetectorRef, Component, DestroyRef, OnInit, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { STEPPER_GLOBAL_OPTIONS } from '@angular/cdk/stepper';
import { Observable, finalize, map, startWith } from 'rxjs';

// Material Modules
import { MatAutocompleteModule } from '@angular/material/autocomplete';
import { MatButtonModule } from '@angular/material/button';
import { MatChipsModule } from '@angular/material/chips';
import { MAT_DATE_LOCALE, MatNativeDateModule } from '@angular/material/core';
import { MatDatepickerInputEvent, MatDatepickerModule } from '@angular/material/datepicker';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';

// Importação segura do Moment
import * as _moment from 'moment';
const moment = (_moment as any).default || _moment;

// Services, Models e Validators
import { MessageService } from '../../../../core/services/message-service';
import { CustomValidators } from '../../../../core/validators/custom.validator';
import { PatientRequestService } from '../../../services/patient-request.service';

interface OptionItem {
  id?: number;
  name?: string;
  code?: string;
  lawsuit?: boolean;
  has_entrance_or_lawsuit?: boolean;
  has_entrance_or_lawsuit_finished?: boolean;
  [key: string]: any;
}

@Component({
  selector: 'app-patient-request-create',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    MatAutocompleteModule,
    MatDialogModule,
    MatButtonModule,
    MatFormFieldModule,
    MatInputModule,
    MatProgressSpinnerModule,
    MatDatepickerModule,
    MatNativeDateModule,
    MatChipsModule,
    MatIconModule
  ],
  templateUrl: './patient-request-create.component.html',
  styleUrl: './patient-request-create.component.scss',
  providers: [
    { provide: STEPPER_GLOBAL_OPTIONS, useValue: { showError: true } },
    { provide: MAT_DATE_LOCALE, useValue: 'pt-BR' }
  ],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class PatientRequestCreateComponent implements OnInit {
  // ==========================================
  // Injeção de Dependências
  // ==========================================
  protected readonly data = inject(MAT_DIALOG_DATA, { optional: true });
  private readonly fb = inject(FormBuilder);
  private readonly patientRequestService = inject(PatientRequestService);
  private readonly messageService = inject(MessageService);
  private readonly dialogRef = inject(MatDialogRef<PatientRequestCreateComponent>);
  private readonly cdr = inject(ChangeDetectorRef);
  private readonly destroyRef = inject(DestroyRef);

  // ==========================================
  // Mensagens de Erro por Controle
  // ==========================================
  protected readonly errorMessages: Record<string, Array<{ type: string; message: string }>> = {
    patient_search: [
      { type: 'required', message: 'A seleção do paciente é obrigatória.' }
    ],
    cid_search: [
      { type: 'required', message: 'A seleção de um CID/Laudo é obrigatória.' }
    ],
    hospital_search: [
      { type: 'required', message: 'A unidade hospitalar é obrigatória.' }
    ],
    type: [
      { type: 'required', message: 'Sem solicitação de entrada aprovada.' }
    ],
    consultation_date: [
      { type: 'required', message: 'A data do agendamento é obrigatória.' },
      { type: 'invalidDate', message: 'Digite uma data válida.' }
    ],
    observation: [
      { type: 'required', message: 'Insira uma observação para a solicitação.' }
    ]
  };

  // ==========================================
  // Estados Reativos via Signals
  // ==========================================
  protected readonly isScheduling = signal<boolean>(false);
  protected readonly isSubmitting = signal<boolean>(false);

  protected readonly patientLoading = signal<boolean>(false);
  protected readonly patientReadOnly = signal<boolean>(true);

  protected readonly cidLoading = signal<boolean>(false);
  protected readonly cidReadOnly = signal<boolean>(true);

  protected readonly hospitalLoading = signal<boolean>(false);
  protected readonly hospitalReadOnly = signal<boolean>(true);

  protected readonly currentReportFlags = signal<{ lawsuit: boolean; hasEntranceOrLawsuit: boolean } | null>(null);

  // ==========================================
  // FormGroups
  // ==========================================
  protected patientRequestForm!: FormGroup;

  // ==========================================
  // Autocomplete e Observables
  // ==========================================
  private patientOptions: OptionItem[] = [];
  protected filteredPatientOptions!: Observable<OptionItem[]>;

  private cidOptions: OptionItem[] = [];
  protected filteredCidOptions!: Observable<OptionItem[]>;

  private hospitalOptions: OptionItem[] = [];
  protected filteredHospitalOptions!: Observable<OptionItem[]>;

  // ==========================================
  // Ciclo de Vida (Hooks)
  // ==========================================
  ngOnInit(): void {
    this.initForm();
    this.fetchPatients();
    this.fetchHospitalUnities();
    this.registerCleaners();
  }

  // ==========================================
  // Inicialização de Formulário
  // ==========================================
  private initForm(): void {
    this.patientRequestForm = this.fb.group({
      patient_search: [null, [Validators.required]],
      report_id: [null, [Validators.required]],
      cid_search: [null, [Validators.required]],
      type: [null, [Validators.required]],
      consultation_date: [{ value: null, disabled: true }],
      hospital_unity_id: [null, [Validators.required]],
      hospital_search: [null, [Validators.required]],
      observation: [null, [Validators.required]]
    });
  }

  // ==========================================
  // Autocomplete e Filtros
  // ==========================================
  private configurePatientFilter(): void {
    const patientSearchCtrl = this.patientRequestForm.get('patient_search');
    if (patientSearchCtrl) {
      this.filteredPatientOptions = patientSearchCtrl.valueChanges.pipe(
        startWith(''),
        map(value => {
          const name = typeof value === 'string' ? value : value?.name;
          return name ? this._filterPatient(name) : this.patientOptions.slice();
        }),
        takeUntilDestroyed(this.destroyRef)
      );
    }
  }

  private configureCidFilter(): void {
    const cidSearchCtrl = this.patientRequestForm.get('cid_search');
    if (cidSearchCtrl) {
      this.filteredCidOptions = cidSearchCtrl.valueChanges.pipe(
        startWith(''),
        map(value => {
          const query = typeof value === 'string' ? value : (value?.code ? `${value.code} - ${value.name}` : '');
          return query ? this._filterCid(query) : this.cidOptions.slice(0, 10);
        }),
        takeUntilDestroyed(this.destroyRef)
      );
    }
  }

  private configureHospitalFilter(): void {
    const hospitalSearchCtrl = this.patientRequestForm.get('hospital_search');
    if (hospitalSearchCtrl) {
      this.filteredHospitalOptions = hospitalSearchCtrl.valueChanges.pipe(
        startWith(''),
        map(value => {
          const name = typeof value === 'string' ? value : value?.name;
          return name ? this._filterHospital(name) : this.hospitalOptions.slice();
        }),
        takeUntilDestroyed(this.destroyRef)
      );
    }
  }

  private registerCleaners(): void {
    this.patientRequestForm.get('patient_search')?.valueChanges
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(value => {
        if (!value || typeof value !== 'object') {
          this.patientRequestForm.get('cid_search')?.setValue('');
          this.patientRequestForm.get('report_id')?.setValue(null);
          this.patientRequestForm.get('report_id')?.markAsDirty();

          this.cidOptions = [];
          this.cidReadOnly.set(true);
          this.currentReportFlags.set(null);
          this.resetTypeSelection();
          this.cdr.markForCheck();
        }
      });

    this.patientRequestForm.get('cid_search')?.valueChanges
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(value => {
        if (!value || typeof value !== 'object') {
          this.patientRequestForm.get('report_id')?.setValue(null);
          this.patientRequestForm.get('report_id')?.markAsDirty();

          this.currentReportFlags.set(null);
          this.resetTypeSelection();
          this.cdr.markForCheck();
        }
      });

    this.patientRequestForm.get('hospital_search')?.valueChanges
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(value => {
        if (!value || typeof value !== 'object') {
          this.patientRequestForm.get('hospital_unity_id')?.setValue(null);
          this.patientRequestForm.get('hospital_unity_id')?.markAsDirty();
        }
      });
  }

  private _filterPatient(name: string): OptionItem[] {
    const filterValue = name.toLowerCase();
    return this.patientOptions.filter(opt => opt.name?.toLowerCase().includes(filterValue));
  }

  private _filterCid(query: string): OptionItem[] {
    const filterValue = query.toLowerCase();
    return this.cidOptions.filter(opt =>
      opt.name?.toLowerCase().includes(filterValue) ||
      opt.code?.toLowerCase().includes(filterValue)
    ).slice(0, 10);
  }

  private _filterHospital(name: string): OptionItem[] {
    const filterValue = name.toLowerCase();
    return this.hospitalOptions.filter(opt => opt.name?.toLowerCase().includes(filterValue));
  }

  // ==========================================
  // Carregamento de Dados
  // ==========================================
  protected fetchPatients(): void {
    this.patientLoading.set(true);
    this.cdr.markForCheck();

    this.patientRequestService.getPatients()
      .pipe(
        finalize(() => {
          this.patientLoading.set(false);
          this.cdr.markForCheck();
        }),
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe({
        next: response => {
          this.patientOptions = (response || [])
            .filter((p: any) => p.status && p.is_valid)
            .map((item: any) => ({
              name: item.patient?.name || '',
              ...item
            }));
          this.configurePatientFilter();
          this.patientReadOnly.set(false);
          this.cdr.markForCheck();
        },
        error: () => {
          this.patientReadOnly.set(true);
          this.patientOptions = [];
          this.cdr.markForCheck();
        }
      });
  }

  private fetchCidsByPatient(patientCareId: number): void {
    this.patientRequestForm.patchValue({
      report_id: null,
      cid_search: ''
    });
    this.currentReportFlags.set(null);
    this.resetTypeSelection();

    this.cidLoading.set(true);
    this.cdr.markForCheck();

    this.patientRequestService.getReports(patientCareId)
      .pipe(
        finalize(() => {
          this.cidLoading.set(false);
          this.cdr.markForCheck();
        }),
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe({
        next: response => {
          this.cidOptions = (response || []).map((item: any) => ({
            ...item.cid,
            ...item
          }));
          this.configureCidFilter();
          this.cidReadOnly.set(false);
          this.cdr.markForCheck();
        },
        error: () => {
          this.cidReadOnly.set(true);
          this.cidOptions = [];
          this.cdr.markForCheck();
        }
      });
  }

  protected fetchHospitalUnities(): void {
    this.hospitalLoading.set(true);
    this.cdr.markForCheck();

    this.patientRequestService.getHospitalUnities()
      .pipe(
        finalize(() => {
          this.hospitalLoading.set(false);
          this.cdr.markForCheck();
        }),
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe({
        next: response => {
          this.hospitalOptions = response || [];
          this.configureHospitalFilter();
          this.hospitalReadOnly.set(false);
          this.cdr.markForCheck();
        },
        error: () => {
          this.hospitalReadOnly.set(true);
          this.hospitalOptions = [];
          this.cdr.markForCheck();
        }
      });
  }

  // ==========================================
  // Helpers de Exibição e Seleção
  // ==========================================
  protected displayPatient(patient: OptionItem): string {
    return patient?.name || '';
  }

  protected displayCid(report: OptionItem): string {
    return report?.code && report?.name ? `${report.code} - ${report.name}` : '';
  }

  protected displayHospitalUnity(hospital: OptionItem): string {
    return hospital?.name || '';
  }

  protected setPatient(patientCare: OptionItem): void {
    if (patientCare?.id) {
      this.fetchCidsByPatient(patientCare.id);
    }
  }

  protected setCid(report: OptionItem): void {
    if (report?.id) {
      this.patientRequestForm.get('report_id')?.setValue(report.id);
      this.patientRequestForm.get('report_id')?.markAsDirty();

      const lawsuit = !!report.lawsuit;
      const hasEntranceOrLawsuit = !!report.has_entrance_or_lawsuit;
      const hasEntranceOrLawsuitFinished = !!report.has_entrance_or_lawsuit_finished;

      this.currentReportFlags.set({ lawsuit, hasEntranceOrLawsuit });

      let autoValue: string | null = null;

      if (hasEntranceOrLawsuitFinished) {
        autoValue = 'Agendamento';
      } else if (!hasEntranceOrLawsuit) {
        autoValue = lawsuit ? 'Ação Judicial' : 'Entrada';
      }

      if (autoValue) {
        const typeCtrl = this.patientRequestForm.get('type');
        typeCtrl?.setValue(autoValue);
        typeCtrl?.markAsDirty();

        this.setType(autoValue);
      }

      this.cdr.markForCheck();
    }
  }

  protected setHospitalUnity(hospital: OptionItem): void {
    if (hospital?.id) {
      this.patientRequestForm.get('hospital_unity_id')?.setValue(hospital.id);
      this.patientRequestForm.get('hospital_unity_id')?.markAsDirty();
    }
  }

  protected setType(value: string): void {
    const isSched = value === 'Agendamento' || value === 'Ação Judicial';
    this.isScheduling.set(isSched);

    const dateControl = this.patientRequestForm.get('consultation_date');
    if (dateControl) {
      if (isSched) {
        dateControl.enable();
        dateControl.setValidators([Validators.required, CustomValidators.dateValidator()]);
      } else {
        dateControl.disable();
        dateControl.setValue(null);
        dateControl.clearValidators();
      }
      dateControl.updateValueAndValidity();
    }
    this.cdr.markForCheck();
  }

  protected setConsultationDate(event: MatDatepickerInputEvent<any>): void {
    if (event.value) {
      const parsedDate = moment(event.value);
      this.patientRequestForm.get('consultation_date')?.setValue(parsedDate, { emitEvent: true });
      this.patientRequestForm.get('consultation_date')?.markAsDirty();
      this.cdr.markForCheck();
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

  private resetTypeSelection(): void {
    const typeControl = this.patientRequestForm.get('type');
    const dateControl = this.patientRequestForm.get('consultation_date');

    if (typeControl) {
      typeControl.setValue(null);
      typeControl.markAsUntouched();
    }

    if (dateControl) {
      dateControl.setValue(null);
      dateControl.disable();
      dateControl.clearValidators();
      dateControl.updateValueAndValidity();
    }

    this.isScheduling.set(false);
  }

  // ==========================================
  // Submissão
  // ==========================================
  protected onSubmit(): void {
    if (this.patientRequestForm.invalid) {
      this.patientRequestForm.markAllAsTouched();
      return;
    }

    this.isSubmitting.set(true);
    this.cdr.markForCheck();

    const payload = this.patientRequestForm.getRawValue();

    this.patientRequestService.createPatientRequest(payload)
      .pipe(
        finalize(() => {
          this.isSubmitting.set(false);
          this.cdr.markForCheck();
        }),
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe({
        next: response => {
          this.messageService.showMessage(response?.message || 'Solicitação criada com sucesso!');
          this.dialogRef.close(true);
        },
        error: err => {
          const fallbackError = 'Houve um erro operacional ao criar a solicitação.';
          this.messageService.showMessage(err?.error?.message || fallbackError);
        }
      });
  }
}