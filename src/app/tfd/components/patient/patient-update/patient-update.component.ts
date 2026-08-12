import { ChangeDetectionStrategy, Component, DestroyRef, OnInit, ChangeDetectorRef, inject, signal } from '@angular/core';
import { CommonModule, formatDate } from '@angular/common';
import { FormBuilder, FormControl, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { STEPPER_GLOBAL_OPTIONS } from '@angular/cdk/stepper';
import { map, Observable, startWith, finalize, filter, debounceTime, distinctUntilChanged } from 'rxjs';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { saveAs } from 'file-saver';

// Material Modules
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
import { MatSelectModule } from '@angular/material/select';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { NgxMaskDirective } from 'ngx-mask';

// Importação do Moment
import * as _moment from 'moment';
const moment = (_moment as any).default || _moment;

// Services, Models & Enums
import { ViacepService } from '../../../../core/services/viacep-service';
import { PatientService } from '../../../services/patient.service';
import { MessageService } from '../../../../core/services/message-service';
import { StorageService } from '../../../../core/services/storage-service';
import { CustomValidators } from '../../../../core/validators/custom.validator';
import { ApiResponse } from '../../../../core/models/api-response.model';
import { Patient } from '../../../models/patient.model';

import { Deficiency } from '../../../enums/deficiency';
import { MaritalStatus } from '../../../enums/marital-status';
import { Gender } from '../../../enums/gender';
import { Profession } from '../../../enums/profession';
import { Ufs } from '../../../enums/ufs';
import { Ethnicity } from '../../../enums/ethnicity';
import { Race } from '../../../enums/race';

interface NaturalnessOption {
  nome: string;
  [key: string]: unknown;
}

type FileType = 'cns' | 'document' | 'deficiency' | 'address' | 'protocol';

@Component({
  selector: 'app-patient-update',
  standalone: true,
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
  templateUrl: './patient-update.component.html',
  styleUrl: './patient-update.component.scss',
  providers: [{ provide: STEPPER_GLOBAL_OPTIONS, useValue: { showError: true } }],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class PatientUpdateComponent implements OnInit {
  // Injeção de dependências
  protected readonly data = inject<{ patient: Patient }>(MAT_DIALOG_DATA);
  private readonly fb = inject(FormBuilder);
  private readonly viacepService = inject(ViacepService);
  private readonly patientService = inject(PatientService);
  private readonly messageService = inject(MessageService);
  private readonly storageService = inject(StorageService);
  private readonly dialogRef = inject(MatDialogRef<PatientUpdateComponent>);
  private readonly cdr = inject(ChangeDetectorRef);
  private readonly destroyRef = inject(DestroyRef);

  // Estados reativos via Signals
  protected readonly isSubmitting = signal<boolean>(false);
  protected readonly isEthnicityDisabled = signal<boolean>(true);
  protected readonly naturalnessReadOnly = signal<boolean>(true);
  protected readonly naturalnessLoading = signal<boolean>(false);

  // FormGroups expostos
  protected identificationForm!: FormGroup;
  protected personalForm!: FormGroup;
  protected addressForm!: FormGroup;
  protected infoForm!: FormGroup;

  // Listagens estáticas de Enums
  protected readonly races: string[] = Object.values(Race);
  protected readonly deficiencies: string[] = Object.values(Deficiency);
  protected readonly maritalStatuses: string[] = Object.values(MaritalStatus);
  protected readonly genders: string[] = Object.values(Gender);
  protected readonly ethnicities: string[] = Object.values(Ethnicity);
  protected readonly professions: string[] = Object.values(Profession);
  protected readonly ufs: string[] = Object.keys(Ufs);

  // Autocomplete e Observables
  protected readonly naturalnessControl = new FormControl<string>('', { nonNullable: true, validators: [Validators.required] });
  protected naturalnessOptions: string[] = [];
  protected filteredNaturalnessOptions!: Observable<string[]>;
  protected filteredProfessionsOptions!: Observable<string[]>;
  protected filteredUfsOptions!: Observable<string[]>;

  // Arquivos anexados
  private readonly attachedFiles: Record<FileType, File | null> = {
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

  // Mensagens de erro para validação dinâmica no template
  protected readonly errorMessages: Record<string, Array<{ type: string; message: string }>> = {
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
    this.registerReactiveLookups();
  }

  private initForms(): void {
    const patient = this.data?.patient;

    let initialBirthDate: any = null;
    if (patient?.birth_date) {
      const cleanDate = String(patient.birth_date).split(' ')[0].split('T')[0];
      initialBirthDate = moment(cleanDate, 'YYYY-MM-DD');
    }

    this.identificationForm = this.fb.group({
      cns: [
        patient?.cns ?? null,
        [Validators.required, CustomValidators.cnsValidator()],
        [this.patientService.cnsPatientExistsValidator(patient?.cns ?? null)]
      ],
      document_type: [patient?.document_type ?? 'CPF', [Validators.required]],
      document: [
        patient?.document ?? null,
        [Validators.required, CustomValidators.cpfOrCnjValidator()],
        [this.patientService.documentPatientExistsValidator(patient?.document ?? null)]
      ],
      sigadoc: [patient?.sigadoc ?? null, [Validators.required]]
    });

    this.personalForm = this.fb.group({
      name: [patient?.name ?? null, [Validators.required]],
      birth_date: [
        initialBirthDate,
        [Validators.required, CustomValidators.dateValidator(), CustomValidators.birthDateValidator()]
      ],
      gender: [patient?.gender ?? null, [Validators.required]],
      newborn: [patient?.newborn ?? false],
      race: [patient?.race ?? null, [Validators.required]],
      ethnicity: [{ value: patient?.ethnicity ?? null, disabled: patient?.race !== 'Indígena' }],
      marital_status: [patient?.marital_status ?? null],
      mother_name: [patient?.mother_name ?? null],
      father_name: [patient?.father_name ?? null],
      naturalness: [patient?.naturalness ?? null, [Validators.required]],
      phone: [patient?.phone ?? null],
      cell_phone: [patient?.cell_phone ?? null],
      email: [patient?.email ?? null],
      profession: [patient?.profession ?? null],
      deficiency: [patient?.deficiency ?? null]
    });

    this.addressForm = this.fb.group({
      cep: [patient?.cep ?? null, [Validators.required, Validators.pattern(/^\d{5}-?\d{3}$/)]],
      address: [patient?.address ?? null, [Validators.required]],
      number: [patient?.number ?? null, [Validators.required]],
      complement: [patient?.complement ?? null],
      neighborhood: [patient?.neighborhood ?? null, [Validators.required]],
      city: [patient?.city ?? null],
      state: [patient?.state ?? null]
    });

    this.infoForm = this.fb.group({
      control_number: [patient?.patient_info?.control_number ?? null],
      observation: [patient?.patient_info?.observation ?? null]
    });
  }

  private registerReactiveLookups(): void {
    // Busca Reativa por CNS
    this.identificationForm.get('cns')?.valueChanges.pipe(
      map(val => val ? String(val).replace(/\D/g, '') : ''),
      filter(val => val.length === 15),
      debounceTime(400),
      distinctUntilChanged(),
      takeUntilDestroyed(this.destroyRef)
    ).subscribe(cleanCns => {
      this.patientService.getPatientCns(cleanCns)
        .pipe(takeUntilDestroyed(this.destroyRef))
        .subscribe({
          next: (response) => this.populateFromResponse(response)
        });
    });

    // Busca Reativa por Documento (CPF / CNJ)
    this.identificationForm.get('document')?.valueChanges.pipe(
      map(val => val ? String(val).replace(/\D/g, '') : ''),
      filter(val => val.length === 11 || val.length === 14),
      debounceTime(400),
      distinctUntilChanged(),
      takeUntilDestroyed(this.destroyRef)
    ).subscribe(cleanDoc => {
      this.patientService.getPatientDocument(cleanDoc)
        .pipe(takeUntilDestroyed(this.destroyRef))
        .subscribe({
          next: (response) => this.populateFromResponse(response)
        });
    });

    // Busca Reativa por CEP
    this.addressForm.get('cep')?.valueChanges.pipe(
      map(val => val ? String(val).replace(/\D/g, '') : ''),
      filter(val => val.length === 8),
      debounceTime(400),
      distinctUntilChanged(),
      takeUntilDestroyed(this.destroyRef)
    ).subscribe(cleanCep => {
      this.viacepService.getAddress(cleanCep)
        .pipe(takeUntilDestroyed(this.destroyRef))
        .subscribe({
          next: (response) => {
            if (response) {
              this.addressForm.patchValue({
                address: response.logradouro,
                neighborhood: response.bairro,
                city: response.localidade,
                state: response.uf
              });
              this.addressForm.markAsDirty();
              this.cdr.markForCheck();
            }
          }
        });
    });
  }

  private registerRaceDependency(): void {
    const isInitialIndigena = this.data?.patient?.race === 'Indígena';
    this.isEthnicityDisabled.set(!isInitialIndigena);

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

  // --- MÉTODOS DE AÇÃO DO TEMPLATE ---

  protected setBirthDate(event: MatDatepickerInputEvent<any>): void {
    if (event.value) {
      const momentDate = moment(event.value);
      this.personalForm.get('birth_date')?.setValue(momentDate, { emitEvent: true });
      this.personalForm.markAsDirty();
      this.cdr.markForCheck();
    }
  }

  protected onFileSelected(event: Event, type: FileType, targetForm: FormGroup): void {
    const target = event.target as HTMLInputElement;
    const file = target.files?.[0];

    if (file) {
      this.fileLabels[type].set(file.name);
      this.attachedFiles[type] = file;
      targetForm.markAsDirty();
      this.cdr.markForCheck();
    }
  }

  private populateFromResponse(response: Patient): void {
    if (!response) return;

    this.identificationForm.patchValue({
      cns: response.cns,
      document_type: response.document_type,
      document: response.document,
      sigadoc: response.sigadoc
    }, { emitEvent: false });

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
      deficiency: response.deficiency
    }, { emitEvent: false });

    if (response.naturalness) {
      this.naturalnessControl.setValue(response.naturalness, { emitEvent: false });
    }

    this.addressForm.patchValue({
      cep: response.cep,
      address: response.address,
      number: response.number,
      complement: response.complement,
      neighborhood: response.neighborhood,
      city: response.city,
      state: response.state
    }, { emitEvent: false });

    this.infoForm.patchValue({
      control_number: response.patient_info?.control_number ?? null,
      observation: response.patient_info?.observation ?? null
    }, { emitEvent: false });

    const birthDateControl = this.personalForm.get('birth_date');
    if (birthDateControl && response.birth_date) {
      const cleanDateStr = String(response.birth_date).split(' ')[0].split('T')[0];
      const parsedBirthDate = moment(cleanDateStr, 'YYYY-MM-DD');

      birthDateControl.setValue(parsedBirthDate, { emitEvent: false });
      birthDateControl.markAsDirty();
    }

    const isIndigena = response.race === 'Indígena';
    this.isEthnicityDisabled.set(!isIndigena);
    const ethnicityCtrl = this.personalForm.get('ethnicity');
    if (isIndigena) {
      ethnicityCtrl?.enable({ emitEvent: false });
    } else {
      ethnicityCtrl?.disable({ emitEvent: false });
    }

    this.identificationForm.markAsDirty();
    this.personalForm.markAsDirty();
    this.addressForm.markAsDirty();
    this.infoForm.markAsDirty();

    this.cdr.markForCheck();
  }

  protected onNaturalnessSelected(option: string): void {
    this.personalForm.patchValue({ naturalness: option });
    this.personalForm.get('naturalness')?.markAsDirty();
  }

  protected download(archiveId: number | null | undefined, name: string): void {
    if (!archiveId) return;

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

  protected isFormsPristine(): boolean {
    return (
      this.identificationForm.pristine &&
      this.personalForm.pristine &&
      this.addressForm.pristine &&
      this.infoForm.pristine &&
      this.naturalnessControl.pristine
    );
  }

  // --- FILTROS E BUSCAS EXTERNAS ---

  private fetchNaturalness(): void {
    this.naturalnessLoading.set(true);

    this.viacepService.getNaturalness()
      .pipe(
        finalize(() => {
          this.naturalnessLoading.set(false);
          this.naturalnessReadOnly.set(false);
          if (this.data?.patient?.naturalness) {
            this.naturalnessControl.setValue(this.data.patient.naturalness, { emitEvent: false });
          }
          this.cdr.markForCheck();
        }),
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe({
        next: (response: NaturalnessOption[]) => {
          this.naturalnessOptions = (response || []).map((item) => item.nome);
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

  // --- SUBMISSÃO DO FORMULÁRIO ---

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
    this.cdr.markForCheck();

    const personalValues = this.personalForm.getRawValue();
    if (personalValues.birth_date) {
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
      file_protocol: this.attachedFiles['protocol']
    };

    this.patientService.updatePatient(patientId, patientPayload)
      .pipe(
        finalize(() => {
          this.isSubmitting.set(false);
          this.cdr.markForCheck();
        }),
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe({
        next: (response: ApiResponse) => {
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