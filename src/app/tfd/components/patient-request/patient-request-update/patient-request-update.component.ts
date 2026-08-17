import { ChangeDetectionStrategy, Component, DestroyRef, OnInit, ChangeDetectorRef, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { STEPPER_GLOBAL_OPTIONS } from '@angular/cdk/stepper';
import { forkJoin, Observable } from 'rxjs';
import { map, startWith, finalize } from 'rxjs/operators';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';

// Material Modules
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatAutocompleteModule } from '@angular/material/autocomplete';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatDatepickerInputEvent, MatDatepickerModule } from '@angular/material/datepicker';
import { MAT_DATE_LOCALE, MatNativeDateModule } from '@angular/material/core';
import { MatSelectModule } from '@angular/material/select';
import { MatIconModule } from '@angular/material/icon';

// Importação segura do Moment
import * as _moment from 'moment';
const moment = (_moment as any).default || _moment;

// Services, Enums & Validators
import { PatientRequestService } from '../../../services/patient-request.service';
import { MessageService } from '../../../../core/services/message-service';
import { CustomValidators } from '../../../../core/validators/custom.validator';

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
  selector: 'app-patient-request-update',
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
    MatSelectModule,
    MatIconModule
  ],
  templateUrl: './patient-request-update.component.html',
  styleUrl: './patient-request-update.component.scss',
  providers: [
    { provide: STEPPER_GLOBAL_OPTIONS, useValue: { showError: true } },
    { provide: MAT_DATE_LOCALE, useValue: 'pt-BR' } 
  ],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class PatientRequestUpdateComponent implements OnInit {
  // ==========================================
  // Injeção de Dependências
  // ==========================================
  protected readonly data = inject(MAT_DIALOG_DATA);
  private readonly fb = inject(FormBuilder);
  private readonly patientRequestService = inject(PatientRequestService);
  private readonly messageService = inject(MessageService);
  private readonly dialogRef = inject(MatDialogRef<PatientRequestUpdateComponent>);
  private readonly cdr = inject(ChangeDetectorRef);
  private readonly destroyRef = inject(DestroyRef);

  // ==========================================
  // Formulário Principal
  // ==========================================
  protected patientRequestForm!: FormGroup;

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
  // Autocomplete e Observables
  // ==========================================
  private patientOptions: OptionItem[] = [];
  protected filteredPatientOptions!: Observable<OptionItem[]>;

  private cidOptions: OptionItem[] = [];
  protected filteredCidOptions!: Observable<OptionItem[]>;

  private hospitalOptions: OptionItem[] = [];
  protected filteredHospitalOptions!: Observable<OptionItem[]>;

  // ==========================================
  // Dicionário de Mensagens de Erro
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
      { type: 'required', message: 'Selecione o tipo de solicitação.' }
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
  // Ciclo de Vida (Hooks)
  // ==========================================
  ngOnInit(): void {
    this.initForm();
    this.loadInitialDialogData();
    this.registerCleaners();
  }

  // ==========================================
  // Inicialização do Formulário
  // ==========================================
  private initForm(): void {
    const request = this.data.patient_request;
    const initialDate = request.consultation_date ? moment(request.consultation_date) : null;

    this.patientRequestForm = this.fb.group({
      patient_search: [null, [Validators.required]],
      report_id: [request.report_id, [Validators.required]],
      cid_search: [null, [Validators.required]],
      type: [{ value: request.type, disabled: true }, [Validators.required]],
      consultation_date: [{ value: initialDate, disabled: true }],
      hospital_unity_id: [request.hospital_unity_id, [Validators.required]],
      hospital_search: [null, [Validators.required]],
      observation: [request.observation, [Validators.required]]
    });
  }

  // ==========================================
  // Observadores e Limpadores
  // ==========================================
  private registerCleaners(): void {
    this.patientRequestForm.get('patient_search')?.valueChanges
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((value) => {
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
      .subscribe((value) => {
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
      .subscribe((value) => {
        if (!value || typeof value !== 'object') {
          this.patientRequestForm.get('hospital_unity_id')?.setValue(null);
          this.patientRequestForm.get('hospital_unity_id')?.markAsDirty();
        }
      });
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
  // Filtros dos Autocompletes
  // ==========================================
  private configurePatientFilter(): void {
    const patientSearchCtrl = this.patientRequestForm.get('patient_search');
    if (patientSearchCtrl) {
      this.filteredPatientOptions = patientSearchCtrl.valueChanges.pipe(
        startWith(patientSearchCtrl.value),
        map(value => {
          const name = typeof value === 'string' ? value : value?.name;
          return name ? this._filterPatient(name) : this.patientOptions.slice();
        }),
        takeUntilDestroyed(this.destroyRef)
      );
    }
  }

  private configureHospitalFilter(): void {
    const hospitalSearchCtrl = this.patientRequestForm.get('hospital_search');
    if (hospitalSearchCtrl) {
      this.filteredHospitalOptions = hospitalSearchCtrl.valueChanges.pipe(
        startWith(hospitalSearchCtrl.value),
        map(value => {
          const name = typeof value === 'string' ? value : value?.name;
          return name ? this._filterHospitalUnities(name) : this.hospitalOptions.slice();
        }),
        takeUntilDestroyed(this.destroyRef)
      );
    }
  }

  private configureCidFilter(): void {
    const cidSearchCtrl = this.patientRequestForm.get('cid_search');
    if (cidSearchCtrl) {
      this.filteredCidOptions = cidSearchCtrl.valueChanges.pipe(
        startWith(cidSearchCtrl.value),
        map(value => {
          const query = typeof value === 'string' ? value : (value?.code ? `${value.code} - ${value.name}` : '');
          return query ? this._filterCid(query) : this.cidOptions.slice(0, 10);
        }),
        takeUntilDestroyed(this.destroyRef)
      );
    }
  }

  private _filterPatient(name: string): OptionItem[] {
    const filterValue = name.toLowerCase().trim();
    return this.patientOptions.filter(opt => opt.name?.toLowerCase().includes(filterValue));
  }

  private _filterHospitalUnities(name: string): OptionItem[] {
    const filterValue = name.toLowerCase().trim();
    return this.hospitalOptions.filter(opt => opt.name?.toLowerCase().includes(filterValue));
  }

  private _filterCid(term: string): OptionItem[] {
    const filterValue = term.toLowerCase().trim();
    return this.cidOptions
      .filter(opt => (opt.code && opt.code.toLowerCase().includes(filterValue)) || (opt.name && opt.name.toLowerCase().includes(filterValue)))
      .slice(0, 10);
  }

  // ==========================================
  // Carregamento de Dados Iniciais
  // ==========================================
  private loadInitialDialogData(): void {
    this.patientLoading.set(true);
    this.hospitalLoading.set(true);
    this.cidLoading.set(true);

    const request = this.data.patient_request;
    const currentPatientCareId = request.report?.patient_care?.id;

    forkJoin({
      patients: this.patientRequestService.getPatients(),
      hospitals: this.patientRequestService.getHospitalUnities(),
      cids: currentPatientCareId ? this.patientRequestService.getReports(currentPatientCareId) : []
    }).pipe(
      finalize(() => {
        this.patientLoading.set(false);
        this.hospitalLoading.set(false);
        this.cidLoading.set(false);
        this.cdr.markForCheck();
      }),
      takeUntilDestroyed(this.destroyRef)
    ).subscribe({
      next: (res) => {
        this.patientOptions = (res.patients || [])
          .filter((item: any) => item.status && item.is_valid)
          .map((item: any) => ({ name: item.patient?.name || '', ...item }));
        this.configurePatientFilter();
        
        const initialPatient = request.report?.patient_care?.patient;
        if (initialPatient) {
          this.patientRequestForm.get('patient_search')?.setValue(initialPatient);
        }
        this.patientReadOnly.set(false);

        this.hospitalOptions = res.hospitals || [];
        this.configureHospitalFilter();
        
        const initialHospital = request.hospital_unity;
        if (initialHospital) {
          this.patientRequestForm.get('hospital_search')?.setValue(initialHospital);
        }
        this.hospitalReadOnly.set(false);

        if (currentPatientCareId) {
          this.cidOptions = (res.cids || []).map((item: any) => ({
            ...item.cid,
            ...item
          }));
          this.configureCidFilter();
          
          if (request.report?.cid) {
            const currentCid = this.cidOptions.find(c => c.code === request.report.cid.code);
            const reportToUse = currentCid || request.report;
            this.patientRequestForm.get('cid_search')?.setValue(reportToUse);

            const lawsuit = !!reportToUse.lawsuit;
            const hasEntranceOrLawsuit = !!reportToUse.has_entrance_or_lawsuit;
            this.currentReportFlags.set({ lawsuit, hasEntranceOrLawsuit });

            this.setType(request.type);
          }
          this.cidReadOnly.set(false);
        }
      },
      error: () => {
        this.messageService.showMessage('Erro ao carregar dados cadastrais da solicitação.');
        this.patientReadOnly.set(true);
        this.hospitalReadOnly.set(true);
        this.cidReadOnly.set(true);
      }
    });
  }

  private fetchCidsForPatient(patientCareId: number): void {
    this.cidLoading.set(true);
    this.cidReadOnly.set(true);

    this.patientRequestService.getReports(patientCareId)
      .pipe(
        finalize(() => {
          this.cidLoading.set(false);
          this.cidReadOnly.set(false);
          this.cdr.markForCheck();
        }),
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe({
        next: (response) => {
          this.cidOptions = (response || []).map((item: any) => ({ 
            ...item.cid, 
            ...item
          }));
          this.configureCidFilter();
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

  protected displayHospitalUnity(hospitalUnity: OptionItem): string {
    return hospitalUnity?.name || '';
  }

  protected setPatient(patientCare: OptionItem): void {
    if (patientCare?.id) {
      this.patientRequestForm.get('cid_search')?.setValue('');
      this.patientRequestForm.get('report_id')?.setValue(null);
      this.patientRequestForm.get('report_id')?.markAsDirty();

      this.currentReportFlags.set(null);
      this.resetTypeSelection();
      this.fetchCidsForPatient(patientCare.id);
    }
  }

  protected setCid(report: OptionItem): void {
    if (report?.id) {
      const originalRequest = this.data.patientRequest;
      this.patientRequestForm.get('report_id')?.setValue(report.id);
      this.patientRequestForm.get('report_id')?.markAsDirty();

      const lawsuit = !!report.lawsuit;
      const hasEntranceOrLawsuit = !!report.has_entrance_or_lawsuit;
      this.currentReportFlags.set({ lawsuit, hasEntranceOrLawsuit });

      const typeCtrl = this.patientRequestForm.get('type');

      // 🛡️ REGRA DE PROTEÇÃO NA EDIÇÃO: Só altera o tipo se o usuário estiver trocando para um CID diferente do original
      if (report.id !== originalRequest.report_id) {
        let autoValue: string | null = null;

        if (hasEntranceOrLawsuit) {
          autoValue = 'Agendamento';
        } else {
          autoValue = lawsuit ? 'Ação Judicial' : 'Entrada';
        }

        if (autoValue) {
          typeCtrl?.setValue(autoValue);
          typeCtrl?.markAsDirty();
          typeCtrl?.disable();
          this.setType(autoValue);
        }
      } else {
        // Se voltou pro CID original do registro, restaura o tipo salvo no banco e mantém bloqueado
        typeCtrl?.setValue(originalRequest.type);
        typeCtrl?.disable();
        this.setType(originalRequest.type);
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

  // ==========================================
  // Submissão do Formulário
  // ==========================================
  protected onSubmit(): void {
    const patientRequestId = this.data?.patient_request?.id;
    if (!patientRequestId) {
      this.messageService.showMessage('Identificador da solicitação não encontrado.');
      return;
    }

    if (this.patientRequestForm.invalid) {
      this.patientRequestForm.markAllAsTouched();
      return;
    }

    this.isSubmitting.set(true);
    this.cdr.markForCheck();

    const payload = this.patientRequestForm.getRawValue();

    this.patientRequestService.updatePatientRequest(patientRequestId, payload)
      .pipe(
        finalize(() => {
          this.isSubmitting.set(false);
          this.cdr.markForCheck();
        }),
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe({
        next: (response) => {
          this.messageService.showMessage(response?.message || 'Solicitação de paciente atualizada com sucesso!');
          this.dialogRef.close(true);
        },
        error: (err) => {
          const fallbackError = 'Houve um erro operacional ao atualizar a solicitação.';
          this.messageService.showMessage(err?.error?.message || fallbackError);
        }
      });
  }
}