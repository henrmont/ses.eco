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
import { MatChipsModule } from '@angular/material/chips';
import { MatSelectModule } from '@angular/material/select';
import { CommonModule } from '@angular/common';
import { map, Observable, startWith, finalize } from 'rxjs';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { MAT_DATE_LOCALE, MatNativeDateModule } from '@angular/material/core';

// Importação segura do Moment para evitar problemas de assinatura e chamadas em tempo de execução
import * as _moment from 'moment';
const moment = (_moment as any).default || _moment;

// Domínio & Infraestrutura
import { PatientRequestType } from '../../../enums/patient-request-type';
import { PatientRequestService } from '../../../services/patient-request-service';
import { MessageService } from '../../../../core/services/message-service';
import { CustomValidators } from '../../../../core/validators/custom.validator';

@Component({
  selector: 'app-create-patient-request-component',
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
    MatSelectModule
  ],
  templateUrl: './create-patient-request-component.html',
  styleUrl: './create-patient-request-component.scss',
  providers: [
    { provide: STEPPER_GLOBAL_OPTIONS, useValue: { showError: true } },
    { provide: MAT_DATE_LOCALE, useValue: 'pt-BR' } 
  ],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class CreatePatientRequestComponent implements OnInit {
  // Injeções de Dependência Dinâmicas
  protected readonly data = inject(MAT_DIALOG_DATA);
  private readonly fb = inject(FormBuilder);
  private readonly patientRequestService = inject(PatientRequestService);
  private readonly messageService = inject(MessageService);
  private readonly dialogRef = inject(MatDialogRef<CreatePatientRequestComponent>);
  private readonly cdr = inject(ChangeDetectorRef);
  private readonly destroyRef = inject(DestroyRef);

  // Estrutura do Formulário e Controles expostos ao template
  protected patientRequestForm!: FormGroup;
  protected readonly patientControl = new FormControl<string | any>('', [Validators.required]);
  protected readonly cidControl = new FormControl<string | any>('', [Validators.required]);
  protected readonly hospitalControl = new FormControl<string | any>('', [Validators.required]);

  // Estados gerenciados reativamente via Signals
  protected readonly types: string[] = Object.values(PatientRequestType);
  protected readonly isScheduling = signal<boolean>(false);
  protected readonly isSubmitting = signal<boolean>(false);

  protected readonly patientLoading = signal<boolean>(false);
  protected readonly patientReadOnly = signal<boolean>(true);

  protected readonly cidLoading = signal<boolean>(false);
  protected readonly cidReadOnly = signal<boolean>(true);

  protected readonly hospitalLoading = signal<boolean>(false);
  protected readonly hospitalReadOnly = signal<boolean>(true);

  // Armazena as flags do relatório selecionado para aplicar as regras de bloqueio
  protected readonly currentReportFlags = signal<{ lawsuit: boolean; hasEntranceOrLawsuit: boolean } | null>(null);

  // Listagem e Filtros de Autocomplete
  private patientOptions: any[] = [];
  private cidOptions: any[] = [];
  private hospitalOptions: any[] = [];

  protected filteredPatientOptions!: Observable<any[]>;
  protected filteredCidOptions!: Observable<any[]>;
  protected filteredHospitalOptions!: Observable<any[]>;

  // 🎯 Mapeamento local das mensagens de erro padronizado para a UI
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
    this.fetchPatients();
    this.fetchHospitalUnities();
    this.registerCleaners();
  }

  // --- MÉTODOS PRIVADOS DE INICIALIZAÇÃO E SUPORTE ---

  private initForm(): void {
    this.patientRequestForm = this.fb.group({
      report_id: [null, [Validators.required]],
      type: [{ value: null, disabled: true }, [Validators.required]],
      consultation_date: [{ value: null, disabled: true }],
      hospital_unity_id: [null, [Validators.required]],
      observation: [null, [Validators.required]]
    });
  }

  /**
   * Monitora se o usuário limpou o texto dos autocompletes para invalidar o formulário principal
   */
  private registerCleaners(): void {
    // Cleaner do Paciente
    this.patientControl.valueChanges
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((value) => {
        if (!value) {
          this.cidControl.setValue('');
          this.patientRequestForm.get('report_id')?.setValue(null);
          this.patientRequestForm.get('report_id')?.markAsDirty();
          
          this.patientRequestForm.get('type')?.disable();
          
          this.cidOptions = [];
          this.cidReadOnly.set(true);
          this.currentReportFlags.set(null);
          this.resetTypeSelection();
          this.cdr.markForCheck();
        }
      });

    // Cleaner do CID / Laudo
    this.cidControl.valueChanges
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((value) => {
        if (!value) {
          this.patientRequestForm.get('report_id')?.setValue(null);
          this.patientRequestForm.get('report_id')?.markAsDirty();
          
          this.patientRequestForm.get('type')?.disable();
          
          this.currentReportFlags.set(null);
          this.resetTypeSelection();
          this.cdr.markForCheck();
        }
      });

    // Cleaner da Unidade Hospitalar
    this.hospitalControl.valueChanges
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((value) => {
        if (!value) {
          this.patientRequestForm.get('hospital_unity_id')?.setValue(null);
          this.patientRequestForm.get('hospital_unity_id')?.markAsDirty();
        }
      });
  }

  // Reseta a seleção do tipo de solicitação quando as condições do CID mudarem ou forem limpas
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

  // --- CONTROLE DE ALTERAÇÃO DE TIPO (REATIVO) ---

  protected onTypeSelectionChange(value: string): void {
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

  /**
   * Tratamento de mudança de data baseado na implementação padronizada
   */
  protected setConsultationDate(event: MatDatepickerInputEvent<Date>): void {
    if (event.value) {
      const parsedDate = moment(event.value);
      this.patientRequestForm.get('consultation_date')?.setValue(parsedDate, { emitEvent: true });
      this.patientRequestForm.get('consultation_date')?.markAsDirty();
    }
  }

  /**
   * Evita a digitação manual de caracteres indesejados no campo de data
   */
  protected onlyNumbersAndSlashes(event: KeyboardEvent): boolean {
    const charCode = event.key;
    const allowedCharacters = /^[0-9\/]$/;
    
    if (!allowedCharacters.test(charCode)) {
      event.preventDefault();
      return false;
    }
    return true;
  }

  /**
   * Avalia dinamicamente se uma opção de tipo deve ser desabilitada no template.
   */
  protected isTypeOptionDisabled(option: string): boolean {
    const flags = this.currentReportFlags();
    if (!flags) return false;

    if (flags.hasEntranceOrLawsuit) {
      return option !== 'Agendamento';
    } else {
      if (flags.lawsuit) {
        return option !== 'Ação Judicial';
      } else {
        return option !== 'Entrada';
      }
    }
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
          this.patientOptions = (response || [])
            .filter((p: any) => p.status && p.is_valid)
            .map((item: any) => ({
              name: item.patient?.name || '',
              ...item
            }));
          this.configurePatientFilter();
          this.patientReadOnly.set(false);
        },
        error: () => {
          this.patientReadOnly.set(true);
          this.patientOptions = [];
        }
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
    this.patientRequestForm.patchValue({ report_id: null });
    this.patientRequestForm.get('type')?.disable();
    this.cidControl.setValue('');
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
        next: (response) => {
          this.cidOptions = (response || []).map((item: any) => ({
            ...item.cid,
            ...item
          }));
          this.configureCidFilter();
          this.cidReadOnly.set(false);
        },
        error: () => {
          this.cidReadOnly.set(true);
          this.cidOptions = [];
        }
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
    console.log('CID/Laudo selecionado:', report);
    if (report?.id) {
      this.patientRequestForm.get('report_id')?.setValue(report.id);
      this.patientRequestForm.get('report_id')?.markAsDirty();

      const lawsuit = !!report.lawsuit;
      const hasEntranceOrLawsuit = !!report.has_entrance_or_lawsuit;

      this.currentReportFlags.set({ lawsuit, hasEntranceOrLawsuit });

      // --- DETERMINAÇÃO DO AUTOFILL COM BASE NAS REGRAS ---
      let autoValue: string | null = null;

      if (hasEntranceOrLawsuit) {
        autoValue = 'Agendamento';
      } else {
        if (lawsuit) {
          autoValue = 'Ação Judicial';
        } else {
          autoValue = 'Entrada';
        }
      }

      if (autoValue) {
        const typeCtrl = this.patientRequestForm.get('type');
        typeCtrl?.setValue(autoValue);
        typeCtrl?.markAsDirty();
        
        typeCtrl?.disable();

        this.onTypeSelectionChange(autoValue);
      }

      this.cdr.markForCheck();
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
          this.hospitalOptions = response || [];
          this.configureHospitalFilter();
          this.hospitalReadOnly.set(false);
        },
        error: () => {
          this.hospitalReadOnly.set(true);
          this.hospitalOptions = [];
        }
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
      this.patientRequestForm.get('hospital_unity_id')?.setValue(hospital.id);
      this.patientRequestForm.get('hospital_unity_id')?.markAsDirty();
    }
  }

  // --- SUBMISSÃO DO FORMULÁRIO ---

  protected onSubmit(): void {
    this.patientControl.markAsTouched();
    this.cidControl.markAsTouched();
    this.hospitalControl.markAsTouched();

    if (this.patientRequestForm.invalid || this.patientControl.invalid || this.cidControl.invalid || this.hospitalControl.invalid) {
      this.patientRequestForm.markAllAsTouched();
      return;
    }

    this.isSubmitting.set(true);
    this.cdr.markForCheck();

    this.patientRequestService.createPatientRequest(this.patientRequestForm.getRawValue())
      .pipe(
        finalize(() => {
          this.isSubmitting.set(false);
          this.cdr.markForCheck();
        }),
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe({
        next: (response) => {
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