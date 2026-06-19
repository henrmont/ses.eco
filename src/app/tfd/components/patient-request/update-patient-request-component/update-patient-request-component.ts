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
import { Observable, forkJoin } from 'rxjs';
import { map, startWith, finalize } from 'rxjs/operators';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';

import { PatientRequestService, ApiResponse } from '../../../services/patient-request-service';
import { MessageService } from '../../../../core/services/message-service';
import { PatientRequestType } from '../../../enums/patient-request-type';

@Component({
  selector: 'app-update-patient-request-component',
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
  templateUrl: './update-patient-request-component.html',
  styleUrl: './update-patient-request-component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class UpdatePatientRequestComponent implements OnInit {
  // --- INJEÇÕES DE DEPENDÊNCIA ---
  protected readonly data = inject(MAT_DIALOG_DATA);
  private readonly fb = inject(FormBuilder);
  private readonly patientRequestService = inject(PatientRequestService);
  private readonly messageService = inject(MessageService);
  private readonly dialogRef = inject(MatDialogRef<UpdatePatientRequestComponent>);
  private readonly cdr = inject(ChangeDetectorRef);
  private readonly destroyRef = inject(DestroyRef);

  // --- FORMULÁRIOS E CONTROLES EXPOSTOS (PROTECTED) ---
  protected updatePatientRequestForm!: FormGroup;
  protected readonly patientControl = new FormControl<string | any>('', Validators.required);
  protected readonly cidControl = new FormControl<string | any>('', Validators.required);
  protected readonly hospitalUnitiesControl = new FormControl<string | any>('', Validators.required);

  // --- SINAIS DE CONTROLE DE ESTADO REATIVO (SIGNALS) ---
  protected readonly types: string[] = Object.values(PatientRequestType);
  protected readonly isScheduling = signal<boolean>(false);
  protected readonly isSubmitting = signal<boolean>(false);
  
  protected readonly patientLoading = signal<boolean>(false);
  protected readonly patientReadOnly = signal<boolean>(true);

  protected readonly cidLoading = signal<boolean>(false);
  protected readonly cidReadOnly = signal<boolean>(true);

  protected readonly hospitalUnitiesLoading = signal<boolean>(false);
  protected readonly hospitalUnitiesReadOnly = signal<boolean>(true);

  // --- FONTES DE DADOS E OBSERVABLES PARA AUTOCOMPLETE ---
  private patientOptions: any[] = [];
  private cidOptions: any[] = [];
  private hospitalUnitiesOptions: any[] = [];

  protected filteredPatientOptions!: Observable<any[]>;
  protected filteredCidOptions!: Observable<any[]>;
  protected filteredHospitalUnitiesOptions!: Observable<any[]>;

  // 🎯 MAPEAMENTO LOCAL DE MENSAGENS DE ERRO (SUBSTITUINDO REFERÊNCIA EXTERNA)
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
    this.initReactiveEffects();
  }

  ngOnInit(): void {
    this.evaluateSchedulingState(this.data.patient_request.type);
    this.loadInitialDialogData();
  }

  // --- MÉTODOS PRIVADOS DE SUPORTE E INICIALIZAÇÃO ---

  private initForm(): void {
    const request = this.data.patient_request;
    const initialDate = request.consultation_date ? new Date(request.consultation_date) : null;

    this.updatePatientRequestForm = this.fb.group({
      report_id: [request.report_id, [Validators.required]],
      type: [request.type, [Validators.required]],
      consultation_date: [initialDate],
      hospital_unity_id: [request.hospital_unity_id, [Validators.required]],
      observation: [request.observation, [Validators.required]]
    });
  }

  private initReactiveEffects(): void {
    effect(() => {
      const schedulingActive = this.isScheduling();
      const dateControl = this.updatePatientRequestForm?.get('consultation_date');

      if (!dateControl) return;

      if (schedulingActive) {
        dateControl.enable();
        dateControl.setValidators([Validators.required]);
      } else {
        dateControl.disable();
        dateControl.reset(null);
        dateControl.clearValidators();
      }
      dateControl.updateValueAndValidity();
      this.cdr.markForCheck();
    });
  }

  private loadInitialDialogData(): void {
    this.patientLoading.set(true);
    this.hospitalUnitiesLoading.set(true);
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
        this.hospitalUnitiesLoading.set(false);
        this.cidLoading.set(false);
        this.cdr.markForCheck();
      }),
      takeUntilDestroyed(this.destroyRef)
    ).subscribe({
      next: (res) => {
        // 1. Processamento e Bind de Pacientes
        this.patientOptions = (res.patients || [])
          .filter((item: any) => item.status && item.is_valid)
          .map((item: any) => ({ name: item.patient.name, ...item }));
        this.configurePatientFilter();
        this.patientControl.setValue(request.report?.patient_care?.patient);
        this.patientReadOnly.set(false);

        // 2. Processamento e Bind de Hospitais
        this.hospitalUnitiesOptions = res.hospitals || [];
        this.configureHospitalFilter();
        this.hospitalUnitiesControl.setValue(request.hospital_unity);
        this.hospitalUnitiesReadOnly.set(false);

        // 3. Processamento e Bind de CIDs do Laudo
        if (currentPatientCareId) {
          this.cidOptions = (res.cids || []).map((item: any) => ({ ...item.cid, id_report: item.id }));
          this.configureCidFilter();
          
          if (request.report?.cid) {
            const currentCid = this.cidOptions.find(c => c.code === request.report.cid.code);
            this.cidControl.setValue(currentCid || request.report.cid);
          }
          this.cidReadOnly.set(false);
        }
      },
      error: () => {
        this.messageService.showMessage('Erro ao carregar dados cadastrais da solicitação.');
        this.patientReadOnly.set(true);
        this.hospitalUnitiesReadOnly.set(true);
        this.cidReadOnly.set(true);
      }
    });
  }

  // --- FILTROS DE AUTOCOMPLETE (DECLARATIVOS E SEGUROS) ---

  private configurePatientFilter(): void {
    this.filteredPatientOptions = this.patientControl.valueChanges.pipe(
      startWith(this.patientControl.value),
      map(value => {
        const name = typeof value === 'string' ? value : value?.name;
        return name ? this._filterPatient(name) : this.patientOptions.slice();
      }),
      takeUntilDestroyed(this.destroyRef)
    );
  }

  private _filterPatient(name: string): any[] {
    const filterValue = name.toLowerCase().trim();
    return this.patientOptions.filter(opt => opt.name.toLowerCase().includes(filterValue));
  }

  private configureHospitalFilter(): void {
    this.filteredHospitalUnitiesOptions = this.hospitalUnitiesControl.valueChanges.pipe(
      startWith(this.hospitalUnitiesControl.value),
      map(value => {
        const name = typeof value === 'string' ? value : value?.name;
        return name ? this._filterHospitalUnities(name) : this.hospitalUnitiesOptions.slice();
      }),
      takeUntilDestroyed(this.destroyRef)
    );
  }

  private _filterHospitalUnities(name: string): any[] {
    const filterValue = name.toLowerCase().trim();
    return this.hospitalUnitiesOptions.filter(opt => opt.name.toLowerCase().includes(filterValue));
  }

  private configureCidFilter(): void {
    this.filteredCidOptions = this.cidControl.valueChanges.pipe(
      startWith(this.cidControl.value),
      map(value => {
        const query = typeof value === 'string' ? value : (value?.code ? `${value.code} - ${value.name}` : '');
        return query ? this._filterCid(query) : this.cidOptions.slice(0, 10);
      }),
      takeUntilDestroyed(this.destroyRef)
    );
  }

  private _filterCid(term: string): any[] {
    const filterValue = term.toLowerCase().trim();
    return this.cidOptions
      .filter(opt => (opt.code && opt.code.toLowerCase().includes(filterValue)) || (opt.name && opt.name.toLowerCase().includes(filterValue)))
      .slice(0, 10);
  }

  // --- ATUALIZAÇÃO DINÂMICA DE CID EM MUDANÇA DE PACIENTE ---

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
          this.cidOptions = (response || []).map((item: any) => ({ ...item.cid, id_report: item.id }));
          this.configureCidFilter();
        }
      });
  }

  private evaluateSchedulingState(type: string): void {
    this.isScheduling.set(type === 'Agendamento');
  }

  // --- SELEÇÕES E SELETORES DO TEMPLATE (PROTECTED) ---

  protected displayPatient(patient: any): string {
    return patient?.name || '';
  }

  protected displayCid(cid: any): string {
    return cid?.code && cid?.name ? `${cid.code} - ${cid.name}` : '';
  }

  protected displayHospitalUnity(hospitalUnity: any): string {
    return hospitalUnity?.name || '';
  }

  protected onPatientSelected(option: any): void {
    if (option?.id) {
      this.cidControl.setValue('');
      this.updatePatientRequestForm.get('report_id')?.setValue(null);
      this.updatePatientRequestForm.markAsDirty();
      this.fetchCidsForPatient(option.id);
    }
  }

  protected onCidSelected(option: any): void {
    if (option?.id_report) {
      this.updatePatientRequestForm.get('report_id')?.setValue(option.id_report);
      this.updatePatientRequestForm.markAsDirty();
    }
  }

  protected onHospitalUnitySelected(option: any): void {
    if (option?.id) {
      this.updatePatientRequestForm.get('hospital_unity_id')?.setValue(option.id);
      this.updatePatientRequestForm.markAsDirty();
    }
  }

  protected onTypeSelectionChange(event: MatSelectChange): void {
    this.evaluateSchedulingState(event.value);
    this.updatePatientRequestForm.markAsDirty();
  }

  // --- SUBMISSÃO E PERSISTÊNCIA ---

  protected onSubmit(): void {
    this.patientControl.markAsTouched();
    this.cidControl.markAsTouched();
    this.hospitalUnitiesControl.markAsTouched();

    if (this.updatePatientRequestForm.invalid || this.patientControl.invalid || this.cidControl.invalid || this.hospitalUnitiesControl.invalid) {
      this.updatePatientRequestForm.markAllAsTouched();
      return;
    }

    this.isSubmitting.set(true);

    this.patientRequestService.updatePatientRequest(this.data.patient_request.id, this.updatePatientRequestForm.value)
      .pipe(
        finalize(() => {
          this.isSubmitting.set(false);
          this.cdr.markForCheck();
        }),
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe({
        next: (response: ApiResponse) => {
          this.messageService.showMessage(response?.message || 'Solicitação de paciente atualizada com sucesso!');
          this.dialogRef.close(true);
        },
        error: (err) => {
          const fallbackError = 'Houve um erro operacional ao atualizar a solicitação.';
          this.messageService.showMessage(err?.error?.message || fallbackError);
        },
      });
  }
}