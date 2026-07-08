import { ChangeDetectionStrategy, Component, effect, inject, OnInit, signal } from '@angular/core';
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
import { MatSelectChange, MatSelectModule } from '@angular/material/select';
import { NgxMaskDirective } from 'ngx-mask';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { map, Observable, startWith, finalize } from 'rxjs';

import { ViacepService } from '../../../../core/services/viacep-service';
import { MessageService } from '../../../../core/services/message-service';
import { CustomValidators } from '../../../../core/validators/custom.validator';

import { Deficiency } from '../../../enums/deficiency';
import { MaritalStatus } from '../../../enums/marital-status';
import { Gender } from '../../../enums/gender';
import { Profession } from '../../../enums/profession';
import { Ufs } from '../../../enums/ufs';
import { Ethnicity } from '../../../enums/ethnicity';
import { Race } from '../../../enums/race';
import { PatientService } from '../../../services/patient-service';

@Component({
  selector: 'app-create-patient-component',
  imports: [
    CommonModule, FormsModule, ReactiveFormsModule, MatSelectModule, MatDialogModule, 
    MatButtonModule, MatFormFieldModule, MatInputModule, MatStepperModule, MatIconModule, 
    MatDatepickerModule, MatSlideToggleModule, MatAutocompleteModule, MatTooltipModule, 
    NgxMaskDirective, MatProgressSpinnerModule
  ],
  templateUrl: './create-patient-component.html',
  styleUrl: './create-patient-component.scss',
  providers: [{ provide: STEPPER_GLOBAL_OPTIONS, useValue: { showError: true } }],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class CreatePatientComponent implements OnInit {
  // Injeções de Dependência
  private readonly fb = inject(FormBuilder);
  private readonly viacepService = inject(ViacepService);
  private readonly patientService = inject(PatientService);
  private readonly messageService = inject(MessageService);
  private readonly dialogRef = inject(MatDialogRef<CreatePatientComponent>);

  // Estados com Signals
  readonly isSubmitting = signal<boolean>(false);
  readonly ethnicityType = signal<boolean>(true);

  // Estrutura dos Formulários
  createPatientIdentificationForm!: FormGroup;
  createPatientPersonalForm!: FormGroup;
  createPatientAddressForm!: FormGroup;
  createPatientInfoForm!: FormGroup;

  // Listas extraídas dos Enums para os Selects
  races: string[] = Object.values(Race);
  deficiencies: string[] = Object.values(Deficiency);
  marital_status: string[] = Object.values(MaritalStatus);
  genders: string[] = Object.values(Gender);
  ethnicities: string[] = Object.values(Ethnicity);
  professions: string[] = Object.values(Profession);
  ufs: string[] = Object.keys(Ufs);

  // Autocomplete de Naturalidade
  naturalnessControl = new FormControl<string | any>('', Validators.required);
  naturalnessOptions!: any[];
  filteredNaturalnessOptions!: Observable<any[]>;
  readonly naturalnessReadOnly = signal<boolean>(true);
  readonly naturalnessLoading = signal<boolean>(false);

  // Filtros de Autocomplete Restantes
  filteredProfessionsOptions!: Observable<string[]>;
  filteredUfsOptions!: Observable<string[]>;

  // Dicionário de Arquivos e Controle de Labels unificado
  files: { [key: string]: File | null } = {
    cns: null,
    document: null,
    deficiency: null,
    address: null,
    protocol: null
  };

  labelsFiles = {
    cns: signal<string>('Nenhum arquivo selecionado'),
    document: signal<string>('Nenhum arquivo selecionado'),
    deficiency: signal<string>('Nenhum arquivo selecionado'),
    address: signal<string>('Nenhum arquivo selecionado'),
    protocol: signal<string>('Nenhum arquivo selecionado')
  };

  // Mapeamento local das mensagens de erro do formulário
  errorMessages: { [key: string]: Array<{ type: string; message: string }> } = {
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
    birth_date: [{ type: 'required', message: 'A data de nascimento é obrigatória.' }],
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

  constructor() {
    this.initForms();

    // Reatividade: Habilita/Desabilita etnia dinamicamente com base na Raça selecionada
    effect(() => {
      const ethnicityControl = this.createPatientPersonalForm.get('ethnicity');
      if (this.ethnicityType()) {
        ethnicityControl?.disable();
        ethnicityControl?.reset();
      } else {
        ethnicityControl?.enable();
      }
    });
  }

  ngOnInit() {
    this.setFilteredProfessions();
    this.setFilteredUfs();
    this.getNaturalness();
  }

  private initForms() {
    this.createPatientIdentificationForm = this.fb.group({
      cns: [null, [Validators.required, CustomValidators.cnsValidator()], [this.patientService.cnsPatientExistsValidator(null)]],
      document_type: [null, [Validators.required]],
      document: [null, [Validators.required, CustomValidators.cpfOrCnjValidator()], [this.patientService.documentPatientExistsValidator(null)]],
      sigadoc: [null, [Validators.required]],
    });

    this.createPatientPersonalForm = this.fb.group({
      name: [null, [Validators.required]],
      birth_date: [null, [Validators.required]],
      gender: [null, [Validators.required]],
      newborn: [false],
      race: [null, [Validators.required]],
      ethnicity: [null],
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

    this.createPatientAddressForm = this.fb.group({
      cep: [null, [Validators.required, Validators.pattern(/^\d{5}-?\d{3}$/)]],
      address: [null, [Validators.required]],
      number: [null, [Validators.required]],
      complement: [null],
      neighborhood: [null, [Validators.required]],
      city: [null],
      state: [null],
    });

    this.createPatientInfoForm = this.fb.group({
      control_number: [null],
      observation: [null],
    });
  }

  // --- LOGICA DE SELEÇÃO E EVENTOS ---

  onSelection(event: MatSelectChange) {
    this.setEthnicityType(event.value);
  }

  setEthnicityType(type: string) {
    this.ethnicityType.set(type !== 'Indígena');
  }

  setBirthDate(event: MatDatepickerInputEvent<Date>) {
    this.createPatientPersonalForm.get('birth_date')?.setValue(event.value);
  }

  onFileSelected(event: any, type: 'cns' | 'document' | 'deficiency' | 'address' | 'protocol') {
    const file = event.target.files[0];
    if (file) {
      this.labelsFiles[type].set(file.name);
      this.files[type] = file;
    }
  }

  // --- BUSCAS DE APIS EXTERNAS e FILTROS ---

  getNaturalness() {
    this.naturalnessControl.setValue('');
    this.naturalnessLoading.set(true);
    this.viacepService.getNaturalness().subscribe({
      next: (response) => {
        this.naturalnessOptions = response.map((item: any) => item.nome);
        this.setNaturalnessOptions();
      },
      complete: () => {
        this.naturalnessLoading.set(false);
        this.naturalnessReadOnly.set(false);
      }
    });
  }

  setNaturalnessOptions() {
    this.filteredNaturalnessOptions = this.naturalnessControl.valueChanges.pipe(
      startWith(''),
      map(value => value ? this._filter(this.naturalnessOptions, value).slice(0, 10) : this.naturalnessOptions.slice(0, 10)),
    );
  }

  onNaturalnessSelected(option: any) {
    this.createPatientPersonalForm.patchValue({ naturalness: option });
  }

  setFilteredProfessions() {
    this.filteredProfessionsOptions = this.createPatientPersonalForm.get('profession')!.valueChanges.pipe(
      startWith(''),
      map(value => this._filter(this.professions, value || '')),
    );
  }

  setFilteredUfs() {
    this.filteredUfsOptions = this.createPatientAddressForm.get('state')!.valueChanges.pipe(
      startWith(''),
      map(value => this._filter(this.ufs, value || '')),
    );
  }

  private _filter(options: string[], value: string): string[] {
    const filterValue = value.toLowerCase();
    return options.filter(option => option.toLowerCase().includes(filterValue));
  }

  getAddress() {
    const cep = this.createPatientAddressForm.get('cep')?.value;
    if (cep && cep.replace(/\D/g, '').length === 8) {
      this.viacepService.getAddress(cep).subscribe({
        next: (response) => {
          this.createPatientAddressForm.patchValue({
            address: response.logradouro,
            neighborhood: response.bairro,
            city: response.localidade,
            state: response.uf,
          });
        }
      });
    }
  }

  // --- SUBMISSÃO ---

  onSubmit() {
    // Impede o envio se houver erros estruturais nos formulários
    if (
      this.createPatientIdentificationForm.invalid ||
      this.createPatientPersonalForm.invalid ||
      this.createPatientAddressForm.invalid ||
      this.createPatientInfoForm.invalid
    ) {
      return;
    }

    this.isSubmitting.set(true);

    const patientData = {
      ...this.createPatientIdentificationForm.value,
      ...this.createPatientPersonalForm.value,
      ...this.createPatientAddressForm.value,
      ...this.createPatientInfoForm.value,
      file_cns: this.files['cns'],
      file_document: this.files['document'],
      file_deficiency: this.files['deficiency'],
      file_address: this.files['address'],
      file_protocol: this.files['protocol'],
    };

    this.patientService.createPatient(patientData)
      .pipe(finalize(() => this.isSubmitting.set(false)))
      .subscribe({
        next: (response: any) => {
          this.messageService.showMessage(response.message || 'Paciente cadastrado com sucesso!');
          this.dialogRef.close(true);
        },
        error: (err) => {
          const errMsg = err?.error?.message || 'Erro ao salvar paciente.';
          this.messageService.showMessage(errMsg);
        }
      });
  }
}