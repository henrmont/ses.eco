import { ChangeDetectionStrategy, Component, effect, inject, OnInit, signal, WritableSignal } from '@angular/core';
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
import { finalize, map, Observable, startWith } from 'rxjs';
import { CommonModule, formatDate } from '@angular/common';
import { MatSelectChange, MatSelectModule } from '@angular/material/select';
import { saveAs } from 'file-saver';
import { NgxMaskDirective } from 'ngx-mask';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';

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

interface ErrorMessageStructure {
  type: string;
  message: string;
}

@Component({
  selector: 'app-update-patient-component',
  imports: [
    FormsModule, ReactiveFormsModule, CommonModule, MatSelectModule, MatDialogModule, 
    MatButtonModule, MatFormFieldModule, MatInputModule, MatStepperModule, MatIconModule, 
    MatDatepickerModule, MatSlideToggleModule, MatAutocompleteModule, MatTooltipModule, 
    NgxMaskDirective, MatProgressSpinnerModule
  ],
  templateUrl: './update-patient-component.html',
  styleUrl: './update-patient-component.scss',
  providers: [{ provide: STEPPER_GLOBAL_OPTIONS, useValue: { showError: true } }],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class UpdatePatientComponent implements OnInit {
  readonly data = inject(MAT_DIALOG_DATA);
  private readonly formBuilder = inject(FormBuilder);
  private readonly viacepService = inject(ViacepService);
  private readonly patientService = inject(PatientService);
  private readonly messageService = inject(MessageService);
  private readonly storageService = inject(StorageService);
  private readonly dialogRef = inject(MatDialogRef<UpdatePatientComponent>);

  readonly isSubmitting = signal<boolean>(false);
  readonly ethnicityType = signal<boolean>(true);
  readonly type = signal<boolean>(true);

  updatePatientIdentificationForm!: FormGroup;
  updatePatientPersonalForm!: FormGroup;
  updatePatientAddressForm!: FormGroup;
  updatePatientInfoForm!: FormGroup;

  races: string[] = Object.values(Race);
  deficiencies: string[] = Object.values(Deficiency);
  marital_status: string[] = Object.values(MaritalStatus);
  genders: string[] = Object.values(Gender);
  ethnicities: string[] = Object.values(Ethnicity);
  professions: string[] = Object.values(Profession);
  ufs: string[] = Object.keys(Ufs);

  naturalnessControl = new FormControl<string | any>('', Validators.required);
  naturalnessOptions!: any[];
  filteredNaturalnessOptions!: Observable<any[]>;
  readonly naturalnessReadOnly = signal<boolean>(true);
  readonly naturalnessLoading = signal<boolean>(false);

  filteredProfessionsOptions!: Observable<string[]>;
  filteredUfsOptions!: Observable<string[]>;

  files: { [key: string]: File | null } = {
    cns: null,
    document: null,
    deficiency: null,
    address: null,
    protocol: null
  };

  // Alterado para garantir o tipo estrito da string para o template
  labelsFiles: Record<string, WritableSignal<string>> = {
    cns: signal<string>('Nenhum arquivo selecionado'),
    document: signal<string>('Nenhum arquivo selecionado'),
    deficiency: signal<string>('Nenhum arquivo selecionado'),
    address: signal<string>('Nenhum arquivo selecionado'),
    protocol: signal<string>('Nenhum arquivo selecionado')
  };

  errorMessages: Record<string, ErrorMessageStructure[]> = {
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
    birth_date: [{ type: 'required', message: 'A data de nascimento é obrigatória.' }],
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

  constructor() {
    this.initForms();

    effect(() => {
      const ethnicityControl = this.updatePatientPersonalForm?.get('ethnicity');
      if (this.ethnicityType()) {
        ethnicityControl?.disable();
        ethnicityControl?.reset();
      } else {
        ethnicityControl?.enable();
      }
    });
  }

  ngOnInit() {
    this.setEthnicityType(this.data.patient.race);
    this.setFilteredProfessions();
    this.setFilteredUfs();
    this.getNaturalness();
  }

  private initForms() {
    this.updatePatientIdentificationForm = this.formBuilder.group({
      cns: [this.data.patient.cns, [Validators.required, CustomValidators.cnsValidator()], [this.patientService.cnsPatientExistsValidator(this.data.patient.cns)]],
      file_cns_id: [this.data.patient.file_cns_id],
      document_type: [this.data.patient.document_type, [Validators.required]],
      document: [this.data.patient.document, [Validators.required, CustomValidators.cpfOrCnjValidator()], [this.patientService.documentPatientExistsValidator(this.data.patient.document)]],
      file_document_id: [this.data.patient.file_document_id],
      sigadoc: [this.data.patient.sigadoc, [Validators.required]],
    });

    this.updatePatientPersonalForm = this.formBuilder.group({
      name: [this.data.patient.name, [Validators.required]],
      birth_date: [this.data.patient.birth_date ? formatDate(this.data.patient.birth_date, 'yyyy-MM-dd', 'en') : null, [Validators.required]],
      gender: [this.data.patient.gender, [Validators.required]],
      newborn: [this.data.patient.newborn],
      race: [this.data.patient.race, [Validators.required]],
      ethnicity: [this.data.patient.ethnicity],
      marital_status: [this.data.patient.marital_status],
      mother_name: [this.data.patient.mother_name],
      father_name: [this.data.patient.father_name],
      naturalness: [this.data.patient.naturalness, [Validators.required]],
      phone: [this.data.patient.phone],
      cell_phone: [this.data.patient.cell_phone],
      email: [this.data.patient.email],
      profession: [this.data.patient.profession],
      deficiency: [this.data.patient.deficiency],
      file_deficiency_id: [this.data.patient.file_deficiency_id],
    });

    this.updatePatientAddressForm = this.formBuilder.group({
      cep: [this.data.patient.cep, [Validators.required, Validators.pattern(/^\d{5}-?\d{3}$/)]],
      address: [this.data.patient.address, [Validators.required]],
      file_address_id: [this.data.patient.file_address_id],
      number: [this.data.patient.number, [Validators.required]],
      complement: [this.data.patient.complement],
      neighborhood: [this.data.patient.neighborhood, [Validators.required]],
      city: [this.data.patient.city],
      state: [this.data.patient.state],
    });

    this.updatePatientInfoForm = this.formBuilder.group({
      control_number: [this.data.patient.patient_info?.control_number || null],
      observation: [this.data.patient.patient_info?.observation || null],
      file_protocol_id: [this.data.patient.patient_info?.file_protocol_id || null],
    });
  }

  setType(type: boolean) {
    this.type.set(type);
  }

  onSelection(event: MatSelectChange) {
    this.setEthnicityType(event.value);
  }

  setEthnicityType(type: string) {
    this.ethnicityType.set(type !== 'Indígena');
  }

  setBirthDate(event: MatDatepickerInputEvent<Date>) {
    this.updatePatientPersonalForm.get('birth_date')?.setValue(event.value);
    this.updatePatientPersonalForm.markAsDirty();
  }

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
        this.naturalnessControl.setValue(this.data.patient.naturalness);
      }
    });
  }

  setNaturalnessOptions() {
    this.filteredNaturalnessOptions = this.naturalnessControl.valueChanges.pipe(
      startWith(''),
      map(value => value ? this._filterNaturalness(value) : this.naturalnessOptions.slice(0, 10)),
    );
  }

  onNaturalnessSelected(option: any) {
    this.updatePatientPersonalForm.patchValue({ naturalness: option });
    this.updatePatientPersonalForm.markAsDirty();
  }

  private _filterNaturalness(name: string): any[] {
    const filterValue = name.toLowerCase();
    return this.naturalnessOptions.filter(option => option.toLowerCase().includes(filterValue)).slice(0, 10);
  }

  displayNaturalness(naturalness: any): string {
    return naturalness ? naturalness : '';
  }

  setFilteredProfessions() {
    this.filteredProfessionsOptions = this.updatePatientPersonalForm.get('profession')!.valueChanges.pipe(
      startWith(''),
      map(value => this._filter(this.professions, value || '')),
    );
  }

  setFilteredUfs() {
    this.filteredUfsOptions = this.updatePatientAddressForm.get('state')!.valueChanges.pipe(
      startWith(''),
      map(value => this._filter(this.ufs, value || '')),
    );
  }

  private _filter(options: string[], value: string): string[] {
    const filterValue = value.toLowerCase();
    return options.filter(option => option.toLowerCase().includes(filterValue));
  }

  getAddress() {
    const cep = this.updatePatientAddressForm.get('cep')?.value;
    if (cep && cep.replace(/\D/g, '').length === 8) {
      this.viacepService.getAddress(cep).subscribe({
        next: (response) => {
          this.updatePatientAddressForm.patchValue({
            address: response.logradouro,
            neighborhood: response.bairro,
            city: response.localidade,
            state: response.uf,
          });
        }
      });
    }
  }

  download(archive: number, name: string) {
    this.storageService.download(archive).subscribe({
      next: (response) => {
        saveAs(response.archive, name);
      }
    });
  }

  onFileSelected(event: any, type: 'cns' | 'document' | 'deficiency' | 'address' | 'protocol', formToDirty: FormGroup) {
    const file = event.target.files[0];
    if (file) {
      this.labelsFiles[type].set(file.name);
      this.files[type] = file;
      formToDirty.markAsDirty();
    }
  }

  onUpdatePatientSubmit() {
    if (
      this.updatePatientIdentificationForm.invalid ||
      this.updatePatientPersonalForm.invalid ||
      this.updatePatientAddressForm.invalid ||
      this.updatePatientInfoForm.invalid
    ) {
      return;
    }

    this.isSubmitting.set(true);

    const patientData = {
      ...this.updatePatientIdentificationForm.value,
      ...this.updatePatientPersonalForm.value,
      ...this.updatePatientAddressForm.value,
      ...this.updatePatientInfoForm.value,
      file_cns: this.files['cns'],
      file_document: this.files['document'],
      file_deficiency: this.files['deficiency'],
      file_address: this.files['address'],
      file_protocol: this.files['protocol'],
    };

    this.patientService.updatePatient(this.data.patient.id, patientData)
      .pipe(finalize(() => this.isSubmitting.set(false)))
      .subscribe({
        next: (response: any) => {
          this.messageService.showMessage(response.message || 'Paciente atualizado com sucesso!');
          this.dialogRef.close(true);
        },
        error: (err) => {
          const errMsg = err?.error?.message || 'Erro ao atualizar paciente.';
          this.messageService.showMessage(errMsg);
        }
      });
  }
}