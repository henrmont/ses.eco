import { ChangeDetectionStrategy, Component, inject, OnInit, signal, ChangeDetectorRef, DestroyRef, effect } from '@angular/core';
import { FormBuilder, FormControl, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
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
import { map, Observable, startWith, finalize } from 'rxjs';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';

// Domínio & Infraestrutura
import { PatientRequestType } from '../../../enums/patient-request-type';
import { PatientRequestService, ApiResponse } from '../../../services/patient-request-service';
import { MessageService } from '../../../../core/services/message-service';

@Component({
  selector: 'app-create-patient-request-component',
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
  templateUrl: './create-patient-request-component.html',
  styleUrl: './create-patient-request-component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class CreatePatientRequestComponent implements OnInit {
  // 🔒 Injeções de Dependência
  protected readonly data = inject(MAT_DIALOG_DATA);
  private readonly fb = inject(FormBuilder);
  private readonly patientRequestService = inject(PatientRequestService);
  private readonly messageService = inject(MessageService);
  private readonly dialogRef = inject(MatDialogRef<CreatePatientRequestComponent>);
  private readonly cdr = inject(ChangeDetectorRef);
  private readonly destroyRef = inject(DestroyRef);

  // 📋 Estrutura de Formulários e Controles Isolados
  protected createPatientRequestForm!: FormGroup;
  protected readonly patientControl = new FormControl<string | any>('');
  protected readonly cidControl = new FormControl<string | any>('');
  protected readonly hospitalControl = new FormControl<string | any>('');

  // 🚥 Estados Gerenciados via Signals
  protected readonly types: string[] = Object.values(PatientRequestType);
  protected readonly isScheduling = signal<boolean>(false);
  protected readonly isSubmitting = signal<boolean>(false);

  protected readonly patientLoading = signal<boolean>(false);
  protected readonly patientReadOnly = signal<boolean>(true);

  protected readonly cidLoading = signal<boolean>(false);
  protected readonly cidReadOnly = signal<boolean>(true);

  protected readonly hospitalLoading = signal<boolean>(false);
  protected readonly hospitalReadOnly = signal<boolean>(true);

  // 🗃️ Listagens Locais e Observables de Filtros
  private patientOptions: any[] = [];
  private cidOptions: any[] = [];
  private hospitalOptions: any[] = [];

  protected filteredPatientOptions!: Observable<any[]>;
  protected filteredCidOptions!: Observable<any[]>;
  protected filteredHospitalOptions!: Observable<any[]>;

  // 🎯 Mapeamento Local de Mensagens de Erro
  protected readonly errorMessages: { [key: string]: Array<{ type: string; message: string }> } = {
    patient_control: [{ type: 'required', message: 'A seleção do paciente é obrigatória.' }],
    cid_control: [{ type: 'required', message: 'A seleção de um CID/Laudo é obrigatória.' }],
    hospital_control: [{ type: 'required', message: 'A unidade hospitalar é obrigatória.' }],
    type: [{ type: 'required', message: 'Selecione o tipo de solicitação.' }],
    consultation_date: [{ type: 'required', message: 'A data do agendamento é obrigatória.' }],
    observation: [{ type: 'required', message: 'Insira uma observação para a solicitação.' }]
  };

  constructor() {
    this.initForm();

    // Reatividade controlada sobre a condicional de Agendamento/Data
    effect(() => {
      const dateControl = this.createPatientRequestForm.get('consultation_date');
      if (!dateControl) return;

      if (this.isScheduling()) {
        dateControl.enable();
        dateControl.setValidators([Validators.required]);
      } else {
        dateControl.disable();
        dateControl.setValue(null);
        dateControl.clearValidators();
      }
      dateControl.updateValueAndValidity();
      this.cdr.markForCheck();
    });
  }

  ngOnInit(): void {
    this.fetchPatients();
    this.fetchHospitalUnities();
  }

  private initForm(): void {
    this.createPatientRequestForm = this.fb.group({
      report_id: [null, [Validators.required]],
      type: [null, [Validators.required]],
      consultation_date: [null],
      hospital_unity_id: [null, [Validators.required]],
      observation: [null, [Validators.required]]
    });
  }

  // --- CONTROLE DE ALTERAÇÃO DE TIPO ---

  protected onTypeSelectionChange(event: MatSelectChange): void {
    this.isScheduling.set(event.value === 'Agendamento');
  }

  // --- FLUXO DE PACIENTES (AUTOCOMPLETE) ---

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
        next: (response) => {
          this.patientOptions = response
            .filter((p: any) => p.status && p.is_valid)
            .map((item: any) => ({
              name: item.patient?.name || '',
              ...item
            }));
          this.configurePatientFilter();
          this.patientReadOnly.set(false);
        },
        error: () => this.patientReadOnly.set(true)
      });
  }

  private configurePatientFilter(): void {
    this.filteredPatientOptions = this.patientControl.valueChanges.pipe(
      startWith(''),
      map(value => {
        const name = typeof value === 'string' ? value : value?.name;
        return name ? this._filterPatient(name) : this.patientOptions.slice();
      }),
      takeUntilDestroyed(this.destroyRef)
    );
  }

  private _filterPatient(name: string): any[] {
    const filterValue = name.toLowerCase();
    return this.patientOptions.filter(opt => opt.name.toLowerCase().includes(filterValue));
  }

  protected displayPatient(patient: any): string {
    return patient?.name || '';
  }

  protected onPatientSelected(patientCare: any): void {
    if (patientCare?.id) {
      this.fetchCidsByPatient(patientCare.id);
    }
  }

  // --- FLUXO DE CIDS / LAUDOS (AUTOCOMPLETE) ---

  private fetchCidsByPatient(patientCareId: number): void {
    this.createPatientRequestForm.patchValue({ report_id: null });
    this.cidControl.setValue('');
    
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
        next: (response) => {
          this.cidOptions = response.map((item: any) => ({
            ...item.cid,
            ...item
          }));
          this.configureCidFilter();
          this.cidReadOnly.set(false);
        },
        error: () => this.cidReadOnly.set(true)
      });
  }

  private configureCidFilter(): void {
    this.filteredCidOptions = this.cidControl.valueChanges.pipe(
      startWith(''),
      map(value => {
        const query = typeof value === 'string' ? value : (value?.code ? `${value.code} - ${value.name}` : '');
        return query ? this._filterCid(query) : this.cidOptions.slice(0, 10);
      }),
      takeUntilDestroyed(this.destroyRef)
    );
  }

  private _filterCid(query: string): any[] {
    const filterValue = query.toLowerCase();
    return this.cidOptions.filter(opt => 
      opt.name?.toLowerCase().includes(filterValue) || 
      opt.code?.toLowerCase().includes(filterValue)
    ).slice(0, 10);
  }

  protected displayCid(report: any): string {
    return report?.code && report?.name ? `${report.code} - ${report.name}` : '';
  }

  protected onCidSelected(report: any): void {
    if (report?.id) {
      this.createPatientRequestForm.patchValue({ report_id: report.id });
    }
  }

  // --- FLUXO DE UNIDADES HOSPITALARES (AUTOCOMPLETE) ---

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
        next: (response) => {
          this.hospitalOptions = response;
          this.configureHospitalFilter();
          this.hospitalReadOnly.set(false);
        },
        error: () => this.hospitalReadOnly.set(true)
      });
  }

  private configureHospitalFilter(): void {
    this.filteredHospitalOptions = this.hospitalControl.valueChanges.pipe(
      startWith(''),
      map(value => {
        const name = typeof value === 'string' ? value : value?.name;
        return name ? this._filterHospital(name) : this.hospitalOptions.slice();
      }),
      takeUntilDestroyed(this.destroyRef)
    );
  }

  private _filterHospital(name: string): any[] {
    const filterValue = name.toLowerCase();
    return this.hospitalOptions.filter(opt => opt.name.toLowerCase().includes(filterValue));
  }

  protected displayHospitalUnity(hospital: any): string {
    return hospital?.name || '';
  }

  protected onHospitalUnitySelected(hospital: any): void {
    if (hospital?.id) {
      this.createPatientRequestForm.patchValue({ hospital_unity_id: hospital.id });
    }
  }

  // --- SUBMISSÃO DO FORMULÁRIO ---

  protected onSubmit(): void {
    // Forçar validações visuais nos controles soltos de autocomplete antes de submeter
    this.patientControl.markAsTouched();
    this.cidControl.markAsTouched();
    this.hospitalControl.markAsTouched();

    if (this.createPatientRequestForm.invalid || this.patientControl.invalid || this.cidControl.invalid || this.hospitalControl.invalid) {
      this.createPatientRequestForm.markAllAsTouched();
      return;
    }

    this.isSubmitting.set(true);
    this.cdr.markForCheck();

    this.patientRequestService.createPatientRequest(this.createPatientRequestForm.value)
      .pipe(
        finalize(() => {
          this.isSubmitting.set(false);
          this.cdr.markForCheck();
        }),
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe({
        next: (response: ApiResponse) => {
          this.messageService.showMessage(response.message || 'Solicitação criada com sucesso!');
          this.dialogRef.close(true);
        },
        error: (err) => {
          const fallback = 'Houve um erro operacional ao criar a solicitação.';
          this.messageService.showMessage(err?.error?.message || fallback);
        }
      });
  }
}