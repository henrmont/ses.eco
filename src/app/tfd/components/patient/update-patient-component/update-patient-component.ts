import { ChangeDetectionStrategy, Component, effect, inject, OnInit, signal, ChangeDetectorRef, DestroyRef, WritableSignal } from '@angular/core';
import { FormBuilder, FormControl, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { STEPPER_GLOBAL_OPTIONS } from '@angular/cdk/stepper';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatStepperModule } from '@angular/material/stepper';
import { MatIconModule } from '@angular/material/icon';
import { MatDatepickerInputEvent, MatDatepickerModule } from '@angular/material/datepicker';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatAutocompleteModule } from '@angular/material/autocomplete';
import { MatTooltipModule } from '@angular/material/tooltip';
import { CommonModule, formatDate } from '@angular/common';
import { MatSelectModule } from '@angular/material/select';
import { NgxMaskDirective } from 'ngx-mask';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { finalize, map, Observable, startWith } from 'rxjs';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { saveAs } from 'file-saver';

// Importação segura do Moment para evitar problemas de assinatura e chamadas em tempo de execução
import * as _moment from 'moment';
const moment = (_moment as any).default || _moment;

import { ViacepService } from '../../../../core/services/viacep-service';
import { PatientService } from '../../../services/patient-service';
import { MessageService } from '../../../../core/services/message-service';
import { StorageService } from '../../../../core/services/storage-service';
import { CustomValidators } from '../../../../core/validators/custom.validator';
import { Deficiency } from '../../../enums/deficiency';
import { MaritalStatus } from '../../../enums/marital-status';
import { Gender } from '../../../enums/gender';
import { Ethnicity } from '../../../enums/ethnicity';
import { Profession } from '../../../enums/profession';
import { Ufs } from '../../../enums/ufs';
import { Race } from '../../../enums/race';

@Component({
  selector: 'app-update-patient-component',
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
  templateUrl: './update-patient-component.html',
  styleUrl: './update-patient-component.scss',
  providers: [{ provide: STEPPER_GLOBAL_OPTIONS, useValue: { showError: true } }],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class UpdatePatientComponent implements OnInit {
  // Dados injetados da Modal e Dependências do Core
  protected readonly data = inject(MAT_DIALOG_DATA);
  private readonly fb = inject(FormBuilder);
  private readonly viacepService = inject(ViacepService);
  private readonly patientService = inject(PatientService);
  private readonly messageService = inject(MessageService);
  private readonly storageService = inject(StorageService);
  private readonly dialogRef = inject(MatDialogRef<UpdatePatientComponent>);
  private readonly cdr = inject(ChangeDetectorRef);
  private readonly destroyRef = inject(DestroyRef);

  // Estados gerenciados reativamente via Signals (Padrão do Create)
  protected readonly isSubmitting = signal<boolean>(false);
  protected readonly isEthnicityDisabled = signal<boolean>(true);
  protected readonly naturalnessReadOnly = signal<boolean>(true);
  protected readonly naturalnessLoading = signal<boolean>(false);

  // Estruturas dos Formulários vinculadas à UI
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

  // Controles e Streams para Autocomplete
  protected readonly naturalnessControl = new FormControl<string | any>('', Validators.required);
  protected naturalnessOptions: string[] = [];
  protected filteredNaturalnessOptions!: Observable<string[]>;
  protected filteredProfessionsOptions!: Observable<string[]>;
  protected filteredUfsOptions!: Observable<string[]>;

  // Dicionário de Arquivos e Labels unificado
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

  // Mensagens de erro locais mapeadas conforme referência do Create
  protected readonly errorMessages: { [key: string]: Array<{ type: string; message: string }> } = {
    cns: [
      { type: 'required', message: 'O número do CNS é obrigatório.' },
      { type: 'invalidCns', message: 'Número de CNS inválido.' },
      { type: 'cnsExists', message: 'Este CNS já está cadastrado.' }
    ],
    document_type: [{ type: 'required', message: 'Selecione o tipo de documento.' }],
    document: [
      { type: 'required', message: 'O documento é obrigatório.' },
      { type: 'invalidCpfOrCnj', message: 'Formato de CPF ou CNJ inválido.' },
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
    ethnicity: [{ type: 'required', message: 'A etnia é obrigatória.' }],
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
    const patient = this.data.patient;

    // Tratamento unificado e seguro do parse de data inicial
    let initialBirthDate: any = null;
    if (patient.birth_date) {
      const cleanDate = patient.birth_date.split(' ')[0].split('T')[0];
      initialBirthDate = moment(cleanDate, 'YYYY-MM-DD');
    }

    this.identificationForm = this.fb.group({
      cns: [patient.cns, [Validators.required, CustomValidators.cnsValidator()], [this.patientService.cnsPatientExistsValidator(patient.cns)]],
      file_cns_id: [patient.file_cns_id],
      document_type: [patient.document_type, [Validators.required]],
      document: [patient.document, [Validators.required, CustomValidators.cpfOrCnjValidator()], [this.patientService.documentPatientExistsValidator(patient.document)]],
      file_document_id: [patient.file_document_id],
      sigadoc: [patient.sigadoc, [Validators.required]],
    });

    this.personalForm = this.fb.group({
      name: [patient.name, [Validators.required]],
      birth_date: [initialBirthDate, [Validators.required, CustomValidators.dateValidator(), CustomValidators.birthDateValidator()]],
      gender: [patient.gender, [Validators.required]],
      newborn: [patient.newborn],
      race: [patient.race, [Validators.required]],
      ethnicity: [{ value: patient.ethnicity, disabled: patient.race !== 'Indígena' }],
      marital_status: [patient.marital_status],
      mother_name: [patient.mother_name],
      father_name: [patient.father_name],
      naturalness: [patient.naturalness, [Validators.required]],
      phone: [patient.phone],
      cell_phone: [patient.cell_phone],
      email: [patient.email],
      profession: [patient.profession],
      deficiency: [patient.deficiency],
      file_deficiency_id: [patient.file_deficiency_id],
    });

    this.addressForm = this.fb.group({
      cep: [patient.cep, [Validators.required, Validators.pattern(/^\d{5}-?\d{3}$/)]],
      address: [patient.address, [Validators.required]],
      file_address_id: [patient.file_address_id],
      number: [patient.number, [Validators.required]],
      complement: [patient.complement],
      neighborhood: [patient.neighborhood, [Validators.required]],
      city: [patient.city],
      state: [patient.state],
    });

    this.infoForm = this.fb.group({
      control_number: [patient.patient_info?.control_number || null],
      observation: [patient.patient_info?.observation || null],
      file_protocol_id: [patient.patient_info?.file_protocol_id || null],
    });
  }

  /**
   * Gerencia de maneira síncrona/reativa a liberação do input de Etnia
   * baseado na escolha do Enum Race, espelhando o comportamento do Create.
   */
  private registerRaceDependency(): void {
    this.isEthnicityDisabled.set(this.data.patient.race !== 'Indígena');

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
        this.personalForm.markAsDirty();
        this.cdr.detectChanges(); // CORREÇÃO: Sincronização explícita imediata na UI
      });
  }

  // --- MÉTODOS DE MANIPULAÇÃO DO TEMPLATE (PROTECTED) ---

  protected setBirthDate(event: MatDatepickerInputEvent<any>): void {
    if (event.value) {
      const momentDate = moment(event.value);
      this.personalForm.get('birth_date')?.setValue(momentDate, { emitEvent: true });
      this.personalForm.markAsDirty();
      this.cdr.detectChanges(); // CORREÇÃO: Força renderização visual síncrona do valor
    }
  }

  protected onFileSelected(event: any, type: 'cns' | 'document' | 'deficiency' | 'address' | 'protocol', targetForm: FormGroup): void {
    const file = event.target.files?.[0];
    if (file) {
      this.fileLabels[type].set(file.name);
      this.attachedFiles[type] = file;
      targetForm.markAsDirty();
      this.cdr.detectChanges();
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

  protected onNaturalnessSelected(option: string): void {
    this.personalForm.patchValue({ naturalness: option });
    this.personalForm.markAsDirty();
    this.cdr.detectChanges();
  }

  // --- BUSCAS DE ENDEREÇO E AUTOCOMPLETES FILTRADOS ---

  private fetchNaturalness(): void {
    this.naturalnessControl.setValue('');
    this.naturalnessLoading.set(true);
    
    this.viacepService.getNaturalness()
      .pipe(
        finalize(() => {
          this.naturalnessLoading.set(false);
          this.naturalnessReadOnly.set(false);
          this.naturalnessControl.setValue(this.data.patient.naturalness);
          this.cdr.detectChanges();
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
              this.cdr.detectChanges();
            }
          }
        });
    }
  }

  protected isFormsPristine(): boolean {
    const forms = [
      this.identificationForm,
      this.personalForm,
      this.addressForm,
      this.infoForm
    ];
    return forms.every(form => form?.pristine);
  }

  protected download(archiveId: number, name: string): void {
    this.storageService.download(archiveId)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (response) => {
          if (response?.archive) {
            saveAs(response.archive, name);
          }
        }
      });
  }

  // --- SUBMISSÃO ---

  protected onSubmit(): void {
    const patientId = this.data?.patient?.id;
    if (!patientId) {
      this.messageService.showMessage('Identificador do paciente inválido.');
      return;
    }

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
    this.cdr.detectChanges();

    const personalValues = this.personalForm.getRawValue();
    if (personalValues.birth_date) {
      // Conversão consistente do objeto de data para string YYYY-MM-DD
      if (moment.isMoment(personalValues.birth_date)) {
        personalValues.birth_date = personalValues.birth_date.format('YYYY-MM-DD');
      } else {
        personalValues.birth_date = formatDate(personalValues.birth_date, 'yyyy-MM-dd', 'en');
      }
    }

    const patientPayload = {
      ...this.identificationForm.getRawValue(),
      ...personalValues,
      ...this.addressForm.getRawValue(),
      ...this.infoForm.getRawValue(),
      file_cns: this.attachedFiles['cns'],
      file_document: this.attachedFiles['document'],
      file_deficiency: this.attachedFiles['deficiency'],
      file_address: this.attachedFiles['address'],
      file_protocol: this.attachedFiles['protocol'],
    };

    this.patientService.updatePatient(patientId, patientPayload)
      .pipe(
        finalize(() => {
          this.isSubmitting.set(false);
          this.cdr.detectChanges();
        }),
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe({
        next: (response: any) => {
          this.messageService.showMessage(response?.message || 'Paciente atualizado com sucesso!');
          this.dialogRef.close(true);
        },
        error: (err) => {
          const fallbackError = 'Erro ao atualizar paciente.';
          this.messageService.showMessage(err?.error?.message || fallbackError);
        }
      });
  }
}