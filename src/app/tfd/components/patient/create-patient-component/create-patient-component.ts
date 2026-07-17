import { ChangeDetectionStrategy, Component, inject, OnInit, signal, ChangeDetectorRef, DestroyRef } from '@angular/core';
import { FormBuilder, FormControl, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { STEPPER_GLOBAL_OPTIONS } from '@angular/cdk/stepper';
import { MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatStepperModule } from '@angular/material/stepper';
import { MatIconModule } from '@angular/material/icon';
import { MatDatepickerInputEvent, MatDatepickerModule } from '@angular/material/datepicker';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatAutocompleteModule } from '@angular/material/autocomplete';
import { MatTooltipModule } from '@angular/material/tooltip';
import { CommonModule } from '@angular/common';
import { MatSelectModule } from '@angular/material/select';
import { NgxMaskDirective } from 'ngx-mask';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { map, Observable, startWith, finalize } from 'rxjs';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';

// Importação segura do Moment para evitar problemas de assinatura e chamadas em tempo de execução
import * as _moment from 'moment';
const moment = (_moment as any).default || _moment;

import { ViacepService } from '../../../../core/services/viacep-service';
import { PatientService } from '../../../services/patient-service';
import { MessageService } from '../../../../core/services/message-service';
import { CustomValidators } from '../../../../core/validators/custom.validator';
import { Deficiency } from '../../../enums/deficiency';
import { MaritalStatus } from '../../../enums/marital-status';
import { Gender } from '../../../enums/gender';
import { Profession } from '../../../enums/profession';
import { Ufs } from '../../../enums/ufs';
import { Ethnicity } from '../../../enums/ethnicity';
import { Race } from '../../../enums/race';

@Component({
  selector: 'app-create-patient-component',
  imports: [
    CommonModule, 
    FormsModule, 
    ReactiveFormsModule, 
    MatSelectModule, 
    MatDialogModule, 
    MatButtonModule, 
    MatFormFieldModule, 
    MatInputModule, 
    MatStepperModule, 
    MatIconModule, 
    MatDatepickerModule, 
    MatSlideToggleModule, 
    MatAutocompleteModule, 
    MatTooltipModule, 
    NgxMaskDirective, 
    MatProgressSpinnerModule
  ],
  templateUrl: './create-patient-component.html',
  styleUrl: './create-patient-component.scss',
  providers: [{ provide: STEPPER_GLOBAL_OPTIONS, useValue: { showError: true } }],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class CreatePatientComponent implements OnInit {
  // Injeções de Dependência Dinâmicas
  private readonly fb = inject(FormBuilder);
  private readonly viacepService = inject(ViacepService);
  private readonly patientService = inject(PatientService);
  private readonly messageService = inject(MessageService);
  private readonly dialogRef = inject(MatDialogRef<CreatePatientComponent>);
  private readonly cdr = inject(ChangeDetectorRef);
  private readonly destroyRef = inject(DestroyRef);

  // Estados gerenciados reativamente via Signals
  protected readonly isSubmitting = signal<boolean>(false);
  protected readonly isEthnicityDisabled = signal<boolean>(true);
  protected readonly naturalnessReadOnly = signal<boolean>(true);
  protected readonly naturalnessLoading = signal<boolean>(false);

  // Estruturas dos Formulários expostas ao template
  protected identificationForm!: FormGroup;
  protected personalForm!: FormGroup;
  protected addressForm!: FormGroup;
  protected infoForm!: FormGroup;

  // Listagens estáticas extraídas dos Enums
  protected readonly races: string[] = Object.values(Race);
  protected readonly deficiencies: string[] = Object.values(Deficiency);
  protected readonly maritalStatuses: string[] = Object.values(MaritalStatus);
  protected readonly genders: string[] = Object.values(Gender);
  protected readonly ethnicities: string[] = Object.values(Ethnicity);
  protected readonly professions: string[] = Object.values(Profession);
  protected readonly ufs: string[] = Object.keys(Ufs);

  // Autocomplete e Observables de Filtro
  protected readonly naturalnessControl = new FormControl<string | any>('', Validators.required);
  protected naturalnessOptions: any[] = [];
  protected filteredNaturalnessOptions!: Observable<any[]>;
  protected filteredProfessionsOptions!: Observable<string[]>;
  protected filteredUfsOptions!: Observable<string[]>;

  // Dicionário de Arquivos e Controle de Labels unificado
  private readonly attachedFiles: { [key: string]: File | null } = {
    cns: null,
    document: null,
    deficiency: null,
    address: null,
    protocol: null
  };

  protected readonly fileLabels = {
    cns: signal<string>('Nenhum arquivo selecionado'),
    document: signal<string>('Nenhum arquivo selecionado'),
    deficiency: signal<string>('Nenhum arquivo selecionado'),
    address: signal<string>('Nenhum arquivo selecionado'),
    protocol: signal<string>('Nenhum arquivo selecionado')
  };

  // 🎯 Mapeamento local das mensagens de erro padronizado para a UI
  protected readonly errorMessages: { [key: string]: Array<{ type: string; message: string }> } = {
    cns: [
      { type: 'required', message: 'O número do CNS é obrigatório.' },
      { type: 'cnsInvalid', message: 'Número de CNS inválido.' },
      { type: 'cnsExists', message: 'Este CNS já está cadastrado.' }
    ],
    document_type: [{ type: 'required', message: 'Selecione o tipo de documento.' }],
    document: [
      { type: 'required', message: 'O documento é obrigatório.' },
      { type: 'cpfInvalid', message: 'Formato de CPF inválido.' },
      { type: 'cnjInvalid', message: 'Formato de CNJ inválido.' },
      { type: 'documentExists', message: 'Este documento já está cadastrado.' }
    ],
    sigadoc: [{ type: 'required', message: 'O número do SigaDoc é obrigatório.' }],
    name: [{ type: 'required', message: 'O nome do paciente é obrigatório.' }],
    birth_date: [
      { type: 'required', message: 'A data de nascimento é obrigatória.' },
      { type: 'invalidDate', message: 'Digite uma data válida.' },
      { type: 'futureDate', message: 'A data de nascimento no futuro.' }
    ],
    gender: [{ type: 'required', message: 'Selecione o gênero.' }],
    race: [{ type: 'required', message: 'A raça/cor é obrigatória.' }],
    naturalness: [{ type: 'required', message: 'A naturalidade é obrigatória.' }],
    cep: [
      { type: 'required', message: 'O CEP é obrigatório.' },
      { type: 'pattern', message: 'Formato de CEP inválido (Ex: 00000-000).' }
    ],
    address: [{ type: 'required', message: 'O endereço é obrigatório.' }],
    number: [{ type: 'required', message: 'O número residencial é obrigatório.' }],
    neighborhood: [{ type: 'required', message: 'O bairro é obrigatório.' }]
  };

  ngOnInit(): void {
    this.initForms();
    this.registerRaceDependency();
    this.setFilteredProfessions();
    this.setFilteredUfs();
    this.fetchNaturalness();
  }

  private initForms(): void {
    this.identificationForm = this.fb.group({
      cns: [null, [Validators.required, CustomValidators.cnsValidator()], [this.patientService.cnsPatientExistsValidator(null)]],
      document_type: [null, [Validators.required]],
      document: [null, [Validators.required, CustomValidators.cpfOrCnjValidator()], [this.patientService.documentPatientExistsValidator(null)]],
      sigadoc: [null, [Validators.required]],
    });

    this.personalForm = this.fb.group({
      name: [null, [Validators.required]],
      birth_date: [null, [Validators.required, CustomValidators.dateValidator(), CustomValidators.birthDateValidator()]],
      gender: [null, [Validators.required]],
      newborn: [false],
      race: [null, [Validators.required]],
      ethnicity: [{ value: null, disabled: true }],
      marital_status: [null],
      mother_name: [null],
      father_name: [null],
      naturalness: [null, [Validators.required]],
      phone: [null],
      cell_phone: [null],
      email: [null],
      profession: [null],
      deficiency: [null],
    });

    this.addressForm = this.fb.group({
      cep: [null, [Validators.required, Validators.pattern(/^\d{5}-?\d{3}$/)]],
      address: [null, [Validators.required]],
      number: [null, [Validators.required]],
      complement: [null],
      neighborhood: [null, [Validators.required]],
      city: [null],
      state: [null],
    });

    this.infoForm = this.fb.group({
      control_number: [null],
      observation: [null],
    });
  }

  /**
   * Gerencia de maneira reativa a ativação e limpeza do controle de Etnia
   * baseado na alteração síncrona do controle de Raça.
   */
  private registerRaceDependency(): void {
    this.personalForm.get('race')?.valueChanges
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((selectedRace: string) => {
        const ethnicityCtrl = this.personalForm.get('ethnicity');
        const isIndigena = selectedRace === 'Indígena';
        
        this.isEthnicityDisabled.set(!isIndigena);
        
        if (isIndigena) {
          ethnicityCtrl?.enable();
        } else {
          ethnicityCtrl?.disable();
          ethnicityCtrl?.reset();
        }
        this.cdr.markForCheck();
      });
  }

  // --- MÉTODOS DE AÇÃO DO TEMPLATE (PROTECTED) ---

  protected setBirthDate(event: MatDatepickerInputEvent<Date>): void {
    this.personalForm.get('birth_date')?.setValue(event.value);
    this.personalForm.get('birth_date')?.markAsDirty();
  }

  protected onFileSelected(event: any, type: 'cns' | 'document' | 'deficiency' | 'address' | 'protocol'): void {
    const file = event.target.files?.[0];
    if (file) {
      this.fileLabels[type].set(file.name);
      this.attachedFiles[type] = file;
      this.cdr.markForCheck();
    }
  }

  private populateFromResponse(response: any): void {
    // 1. Popula o formulário de Identificação
    this.identificationForm.patchValue({
      cns: response.cns,
      document_type: response.document_type,
      document: response.document,
      sigadoc: response.sigadoc,
    });

    // 2. Popula o formulário Pessoal (exceto a data de nascimento, tratada abaixo)
    this.personalForm.patchValue({
      name: response.name,
      gender: response.gender,
      newborn: !!response.newborn,
      race: response.race,
      ethnicity: response.ethnicity,
      marital_status: response.marital_status,
      mother_name: response.mother_name,
      father_name: response.father_name,
      naturalness: response.naturalness,
      phone: response.phone,
      cell_phone: response.cell_phone,
      email: response.email,
      profession: response.profession,
      deficiency: response.deficiency,
    });

    // Sincroniza o input reativo de autocomplete de naturalidade de forma isolada
    if (response.naturalness) {
      this.naturalnessControl.setValue(response.naturalness);
    }

    // 3. Popula o formulário de Endereço
    this.addressForm.patchValue({
      cep: response.cep,
      address: response.address,
      number: response.number,
      complement: response.complement,
      neighborhood: response.neighborhood,
      city: response.city,
      state: response.state,
    });

    // 4. Popula o formulário de Informações Adicionais
    this.infoForm.patchValue({
      control_number: response.patient_info?.control_number || null,
      observation: response.patient_info?.observation || null,
    });

    // 5. CORREÇÃO DEFINITIVA DE POPULAÇÃO AUTOMÁTICA DA DATA (conforme referência):
    const birthDateControl = this.personalForm.get('birth_date');
    if (birthDateControl && response.birth_date) {
      const cleanDateStr = response.birth_date.split(' ')[0].split('T')[0];
      const parsedBirthDate = moment(cleanDateStr, 'YYYY-MM-DD');
      
      // Passando emitEvent true e forçando estado dirty para o Angular notar a mutação
      birthDateControl.setValue(parsedBirthDate, { emitEvent: true });
      birthDateControl.markAsDirty();
    }

    // 6. Atualiza dinamicamente as permissões/estados do campo de etnia se necessário
    const isIndigena = response.race === 'Indígena';
    this.isEthnicityDisabled.set(!isIndigena);
    const ethnicityCtrl = this.personalForm.get('ethnicity');
    if (isIndigena) {
      ethnicityCtrl?.enable();
    } else {
      ethnicityCtrl?.disable();
    }

    // Marca todos os formulários principais como alterados
    this.identificationForm.markAsDirty();
    this.personalForm.markAsDirty();
    this.addressForm.markAsDirty();
    this.infoForm.markAsDirty();

    // Força o ciclo de detecção de mudanças a rodar de forma síncrona imediatamente
    this.cdr.detectChanges();
  }

  protected getPatientCns(): void {
    const patient = this.identificationForm.get('cns')?.value;
    if (patient && patient.length === 15) {
      this.patientService.getPatientCns(patient)
        .pipe(takeUntilDestroyed(this.destroyRef))
        .subscribe({
          next: (response) => this.populateFromResponse(response)
        });
    }
  }

  protected getPatientDocument(): void {
    const patient = this.identificationForm.get('document')?.value;
    if (patient && patient.length === 11) {
      this.patientService.getPatientDocument(patient)
        .pipe(takeUntilDestroyed(this.destroyRef))
        .subscribe({
          next: (response) => this.populateFromResponse(response)
        });
    }
  }

  protected onNaturalnessSelected(option: any): void {
    this.personalForm.patchValue({ naturalness: option });
    this.personalForm.get('naturalness')?.markAsDirty();
  }

  // --- BUSCAS DE APIS EXTERNAS E FILTROS DE AUTOCOMPLETE ---

  private fetchNaturalness(): void {
    this.naturalnessControl.setValue('');
    this.naturalnessLoading.set(true);
    
    this.viacepService.getNaturalness()
      .pipe(
        finalize(() => {
          this.naturalnessLoading.set(false);
          this.naturalnessReadOnly.set(false);
          this.cdr.markForCheck();
        }),
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe({
        next: (response) => {
          this.naturalnessOptions = (response || []).map((item: any) => item.nome);
          this.setupNaturalnessFilter();
        }
      });
  }

  private setupNaturalnessFilter(): void {
    this.filteredNaturalnessOptions = this.naturalnessControl.valueChanges.pipe(
      startWith(''),
      map(value => {
        const currentStr = typeof value === 'string' ? value : '';
        return currentStr ? this._filter(this.naturalnessOptions, currentStr).slice(0, 10) : this.naturalnessOptions.slice(0, 10);
      })
    );
  }

  private setFilteredProfessions(): void {
    const professionCtrl = this.personalForm.get('profession');
    if (professionCtrl) {
      this.filteredProfessionsOptions = professionCtrl.valueChanges.pipe(
        startWith(''),
        map(value => this._filter(this.professions, value || ''))
      );
    }
  }

  private setFilteredUfs(): void {
    const stateCtrl = this.addressForm.get('state');
    if (stateCtrl) {
      this.filteredUfsOptions = stateCtrl.valueChanges.pipe(
        startWith(''),
        map(value => this._filter(this.ufs, value || ''))
      );
    }
  }

  private _filter(options: string[], value: string): string[] {
    const filterValue = value.toLowerCase();
    return options.filter(option => option.toLowerCase().includes(filterValue));
  }

  protected fetchAddress(): void {
    const cep = this.addressForm.get('cep')?.value;
    if (cep && cep.replace(/\D/g, '').length === 8) {
      this.viacepService.getAddress(cep)
        .pipe(takeUntilDestroyed(this.destroyRef))
        .subscribe({
          next: (response) => {
            if (response) {
              this.addressForm.patchValue({
                address: response.logradouro,
                neighborhood: response.bairro,
                city: response.localidade,
                state: response.uf,
              });
              this.addressForm.markAsDirty();
              this.cdr.markForCheck();
            }
          }
        });
    }
  }

  // --- SUBMISSÃO E ENVIOS ---

  protected onSubmit(): void {
    if (
      this.identificationForm.invalid ||
      this.personalForm.invalid ||
      this.addressForm.invalid ||
      this.infoForm.invalid
    ) {
      this.identificationForm.markAllAsTouched();
      this.personalForm.markAllAsTouched();
      this.addressForm.markAllAsTouched();
      this.infoForm.markAllAsTouched();
      return;
    }

    this.isSubmitting.set(true);
    this.cdr.markForCheck();

    const patientPayload = {
      ...this.identificationForm.getRawValue(),
      ...this.personalForm.getRawValue(),
      ...this.addressForm.getRawValue(),
      ...this.infoForm.getRawValue(),
      file_cns: this.attachedFiles['cns'],
      file_document: this.attachedFiles['document'],
      file_deficiency: this.attachedFiles['deficiency'],
      file_address: this.attachedFiles['address'],
      file_protocol: this.attachedFiles['protocol'],
    };

    this.patientService.createPatient(patientPayload)
      .pipe(
        finalize(() => {
          this.isSubmitting.set(false);
          this.cdr.markForCheck();
        }),
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe({
        next: (response: any) => {
          this.messageService.showMessage(response?.message || 'Paciente cadastrado com sucesso!');
          this.dialogRef.close(true);
        },
        error: (err) => {
          const fallbackError = 'Erro ao salvar paciente.';
          this.messageService.showMessage(err?.error?.message || fallbackError);
        }
      });
  }
}