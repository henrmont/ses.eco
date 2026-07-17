import { ChangeDetectionStrategy, Component, inject, OnInit, signal, ChangeDetectorRef, DestroyRef } from '@angular/core';
import { FormBuilder, FormControl, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { STEPPER_GLOBAL_OPTIONS } from '@angular/cdk/stepper';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatAutocompleteModule } from '@angular/material/autocomplete';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatDatepickerInputEvent, MatDatepickerModule } from '@angular/material/datepicker';
import { MatSelectModule } from '@angular/material/select';
import { CommonModule } from '@angular/common';
import { Observable, forkJoin } from 'rxjs';
import { map, startWith, finalize } from 'rxjs/operators';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { MAT_DATE_LOCALE, MatNativeDateModule } from '@angular/material/core';

import * as _moment from 'moment';
const moment = (_moment as any).default || _moment;

import { PatientRequestService } from '../../../services/patient-request-service';
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
    MatNativeDateModule,
    MatSelectModule
  ],
  templateUrl: './update-patient-request-component.html',
  styleUrl: './update-patient-request-component.scss',
  providers: [
    { provide: STEPPER_GLOBAL_OPTIONS, useValue: { showError: true } },
    { provide: MAT_DATE_LOCALE, useValue: 'pt-BR' } 
  ],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class UpdatePatientRequestComponent implements OnInit {
  // --- INJEÇÕES DE DEPENDÊNCIA DINÂMICAS ---
  protected readonly data = inject(MAT_DIALOG_DATA);
  private readonly fb = inject(FormBuilder);
  private readonly patientRequestService = inject(PatientRequestService);
  private readonly messageService = inject(MessageService);
  private readonly dialogRef = inject(MatDialogRef<UpdatePatientRequestComponent>);
  private readonly cdr = inject(ChangeDetectorRef);
  private readonly destroyRef = inject(DestroyRef);

  // --- FORMULÁRIOS E CONTROLES EXPOSTOS AO TEMPLATE ---
  protected patientRequestForm!: FormGroup;
  protected readonly patientControl = new FormControl<string | any>('', [Validators.required]);
  protected readonly cidControl = new FormControl<string | any>('', [Validators.required]);
  protected readonly hospitalControl = new FormControl<string | any>('', [Validators.required]);

  // --- ESTADOS GERENCIADOS REATIVAMENTE VIA SIGNALS ---
  protected readonly types: string[] = Object.values(PatientRequestType);
  protected readonly isScheduling = signal<boolean>(false);
  protected readonly isSubmitting = signal<boolean>(false);
  
  protected readonly patientLoading = signal<boolean>(false);
  protected readonly patientReadOnly = signal<boolean>(true);

  protected readonly cidLoading = signal<boolean>(false);
  protected readonly cidReadOnly = signal<boolean>(true);

  protected readonly hospitalLoading = signal<boolean>(false);
  protected readonly hospitalReadOnly = signal<boolean>(true);

  protected readonly currentReportFlags = signal<{ lawsuit: boolean; hasEntranceOrLawsuit: boolean } | null>(null);

  // --- LISTAGEM E FILTROS DE AUTOCOMPLETE ---
  private patientOptions: any[] = [];
  private cidOptions: any[] = [];
  private hospitalOptions: any[] = [];

  protected filteredPatientOptions!: Observable<any[]>;
  protected filteredCidOptions!: Observable<any[]>;
  protected filteredHospitalOptions!: Observable<any[]>;

  protected readonly errorMessages: { [key: string]: Array<{ type: string; message: string }> } = {
    patient_control: [{ type: 'required', message: 'A seleção do paciente é obrigatória.' }],
    cid_control: [{ type: 'required', message: 'A seleção de um CID/Laudo é obrigatória.' }],
    hospital_control: [{ type: 'required', message: 'A unidade hospitalar é obrigatória.' }],
    type: [{ type: 'required', message: 'Selecione o tipo de solicitação.' }],
    consultation_date: [{ type: 'required', message: 'A data do agendamento é obrigatória.' }],
    observation: [{ type: 'required', message: 'Insira uma observação para a solicitação.' }]
  };

  ngOnInit(): void {
    this.initForm();
    this.loadInitialDialogData();
    this.registerCleaners();
  }

  private initForm(): void {
    const request = this.data.patient_request;
    const initialDate = request.consultation_date ? new Date(request.consultation_date) : null;

    this.patientRequestForm = this.fb.group({
      report_id: [request.report_id, [Validators.required]],
      type: [{ value: request.type, disabled: true }, [Validators.required]],
      consultation_date: [{ value: initialDate, disabled: true }],
      hospital_unity_id: [request.hospital_unity_id, [Validators.required]],
      observation: [request.observation, [Validators.required]]
    });
  }

  private registerCleaners(): void {
    this.patientControl.valueChanges
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((value) => {
        if (!value) {
          this.cidControl.setValue('');
          this.patientRequestForm.get('report_id')?.setValue(null);
          this.patientRequestForm.markAsDirty();
          this.patientRequestForm.get('type')?.disable();
          this.cidOptions = [];
          this.cidReadOnly.set(true);
          this.currentReportFlags.set(null);
          this.resetTypeSelection();
          this.cdr.markForCheck();
        }
      });

    this.cidControl.valueChanges
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((value) => {
        if (!value) {
          this.patientRequestForm.get('report_id')?.setValue(null);
          this.patientRequestForm.markAsDirty();
          this.patientRequestForm.get('type')?.disable();
          this.currentReportFlags.set(null);
          this.resetTypeSelection();
          this.cdr.markForCheck();
        }
      });

    this.hospitalControl.valueChanges
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((value) => {
        if (!value) {
          this.patientRequestForm.get('hospital_unity_id')?.setValue(null);
          this.patientRequestForm.markAsDirty();
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

  protected onTypeSelectionChange(value: string): void {
    const isSched = value === 'Agendamento' || value === 'Ação Judicial';
    this.isScheduling.set(isSched);

    const dateControl = this.patientRequestForm.get('consultation_date');
    if (dateControl) {
      if (isSched) {
        dateControl.enable();
        dateControl.setValidators([Validators.required]);
      } else {
        dateControl.disable();
        dateControl.setValue(null);
        dateControl.clearValidators();
      }
      dateControl.updateValueAndValidity();
    }
    this.cdr.markForCheck();
  }

  protected setConsultationDate(event: MatDatepickerInputEvent<Date>): void {
    if (event.value) {
      const parsedDate = moment(event.value);
      this.patientRequestForm.get('consultation_date')?.setValue(parsedDate, { emitEvent: true });
      this.patientRequestForm.get('consultation_date')?.markAsDirty();
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
          .map((item: any) => ({ name: item.patient.name, ...item }));
        this.configurePatientFilter();
        this.patientControl.setValue(request.report?.patient_care?.patient);
        this.patientReadOnly.set(false);

        this.hospitalOptions = res.hospitals || [];
        this.configureHospitalFilter();
        this.hospitalControl.setValue(request.hospital_unity);
        this.hospitalReadOnly.set(false);

        if (currentPatientCareId) {
          this.cidOptions = (res.cids || []).map((item: any) => ({
            ...item.cid,
            id_report: item.id,
            lawsuit: item.lawsuit,
            has_entrance_or_lawsuit: item.has_entrance_or_lawsuit
          }));
          this.configureCidFilter();
          
          if (request.report?.cid) {
            const currentCid = this.cidOptions.find(c => c.code === request.report.cid.code);
            const reportToUse = currentCid || request.report;
            this.cidControl.setValue(reportToUse);

            const lawsuit = !!reportToUse.lawsuit;
            const hasEntranceOrLawsuit = !!reportToUse.has_entrance_or_lawsuit;
            this.currentReportFlags.set({ lawsuit, hasEntranceOrLawsuit });

            this.onTypeSelectionChange(request.type);
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
    this.filteredHospitalOptions = this.hospitalControl.valueChanges.pipe(
      startWith(this.hospitalControl.value),
      map(value => {
        const name = typeof value === 'string' ? value : value?.name;
        return name ? this._filterHospitalUnities(name) : this.hospitalOptions.slice();
      }),
      takeUntilDestroyed(this.destroyRef)
    );
  }

  private _filterHospitalUnities(name: string): any[] {
    const filterValue = name.toLowerCase().trim();
    return this.hospitalOptions.filter(opt => opt.name.toLowerCase().includes(filterValue));
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
            id_report: item.id,
            lawsuit: item.lawsuit,
            has_entrance_or_lawsuit: item.has_entrance_or_lawsuit
          }));
          this.configureCidFilter();
        }
      });
  }

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
      this.patientRequestForm.get('report_id')?.setValue(null);
      this.patientRequestForm.markAsDirty();
      this.currentReportFlags.set(null);
      this.resetTypeSelection();
      this.fetchCidsForPatient(option.id);
    }
  }

  protected onCidSelected(report: any): void {
    if (report?.id_report) {
      const originalRequest = this.data.patient_request;
      this.patientRequestForm.get('report_id')?.setValue(report.id_report);
      this.patientRequestForm.markAsDirty();

      const lawsuit = !!report.lawsuit;
      const hasEntranceOrLawsuit = !!report.has_entrance_or_lawsuit;
      this.currentReportFlags.set({ lawsuit, hasEntranceOrLawsuit });

      const typeCtrl = this.patientRequestForm.get('type');

      // 🛡️ REGRA DE PROTEÇÃO NA EDIÇÃO: Só altera o tipo se o usuário estiver trocando para um CID diferente do original
      if (report.id_report !== originalRequest.report_id) {
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
          this.onTypeSelectionChange(autoValue);
        }
      } else {
        // Se voltou pro CID original do registro, restaura o tipo salvo no banco e mantém bloqueado
        typeCtrl?.setValue(originalRequest.type);
        typeCtrl?.disable();
        this.onTypeSelectionChange(originalRequest.type);
      }

      this.cdr.markForCheck();
    }
  }

  protected onHospitalUnitySelected(option: any): void {
    if (option?.id) {
      this.patientRequestForm.get('hospital_unity_id')?.setValue(option.id);
      this.patientRequestForm.markAsDirty();
    }
  }

  protected onSubmit(): void {
    const patientRequestId = this.data?.patient_request?.id;
    if (!patientRequestId) {
      this.messageService.showMessage('Identificador da solicitação não encontrado.');
      return;
    }

    this.patientControl.markAsTouched();
    this.cidControl.markAsTouched();
    this.hospitalControl.markAsTouched();

    if (this.patientRequestForm.invalid || this.patientControl.invalid || this.cidControl.invalid || this.hospitalControl.invalid) {
      this.patientRequestForm.markAllAsTouched();
      return;
    }

    this.isSubmitting.set(true);
    this.cdr.markForCheck();

    this.patientRequestService.updatePatientRequest(patientRequestId, this.patientRequestForm.getRawValue())
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
        },
      });
  }
}