import { ChangeDetectionStrategy, Component, inject, OnInit, signal, ChangeDetectorRef, DestroyRef } from '@angular/core';
import { FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { STEPPER_GLOBAL_OPTIONS } from '@angular/cdk/stepper';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatIconModule } from '@angular/material/icon';
import { MatDatepickerInputEvent, MatDatepickerModule } from '@angular/material/datepicker';
import { MatStepperModule } from '@angular/material/stepper';
import { MatSelectModule } from '@angular/material/select';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatAutocompleteModule } from '@angular/material/autocomplete';
import { CommonModule } from '@angular/common';
import { NgxMaskDirective } from 'ngx-mask';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { map, Observable, startWith, finalize, filter, debounceTime, distinctUntilChanged } from 'rxjs';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { saveAs } from 'file-saver';

import * as _moment from 'moment';
const moment = (_moment as any).default || _moment;

import { ViacepService } from '../../../../core/services/viacep-service';
import { PatientService } from '../../../services/patient.service';
import { MessageService } from '../../../../core/services/message-service';
import { StorageService } from '../../../../core/services/storage-service';
import { CustomValidators } from '../../../../core/validators/custom.validator';
import { Gender } from '../../../enums/gender';
import { Ufs } from '../../../enums/ufs';

@Component({
  selector: 'app-patient-escort-update',
  standalone: true,
  imports: [
    CommonModule, 
    FormsModule, 
    ReactiveFormsModule, 
    MatAutocompleteModule, 
    MatDialogModule, 
    MatButtonModule, 
    MatFormFieldModule, 
    MatInputModule, 
    MatIconModule, 
    MatDatepickerModule, 
    MatStepperModule, 
    MatSelectModule, 
    MatSlideToggleModule, 
    MatTooltipModule, 
    NgxMaskDirective, 
    MatProgressSpinnerModule
  ],
  templateUrl: './patient-escort-update.component.html',
  styleUrl: './patient-escort-update.component.scss',
  providers: [
    { provide: STEPPER_GLOBAL_OPTIONS, useValue: { showError: true } }
  ],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class PatientEscortUpdateComponent implements OnInit {
  protected readonly data = inject(MAT_DIALOG_DATA, { optional: true });
  private readonly fb = inject(FormBuilder);
  private readonly viacepService = inject(ViacepService);
  private readonly patientService = inject(PatientService);
  private readonly messageService = inject(MessageService);
  private readonly storageService = inject(StorageService);
  private readonly dialogRef = inject(MatDialogRef<PatientEscortUpdateComponent>);
  private readonly cdr = inject(ChangeDetectorRef);
  private readonly destroyRef = inject(DestroyRef);

  protected readonly isSubmitting = signal<boolean>(false);
  protected readonly isSameAddressSignal = signal<boolean>(false);

  protected personalForm!: FormGroup;
  protected addressForm!: FormGroup;

  protected readonly genders: string[] = Object.values(Gender);
  private readonly ufs: string[] = Object.keys(Ufs);

  protected filteredUfsOptions!: Observable<string[]>;

  private readonly attachedFiles: { [key: string]: File | null } = {
    cns: null,
    document: null,
    address: null
  };

  protected readonly labelsFiles = {
    cns: signal<string>(this.data?.patientEscort?.file_cns_id ? 'Arquivo já cadastrado (Clique para alterar)' : 'Nenhum arquivo selecionado'),
    document: signal<string>(this.data?.patientEscort?.file_document_id ? 'Arquivo já cadastrado (Clique para alterar)' : 'Nenhum arquivo selecionado'),
    address: signal<string>(this.data?.patientEscort?.file_address_id ? 'Arquivo já cadastrado (Clique para alterar)' : 'Nenhum arquivo selecionado')
  };

  protected readonly errorMessages: { [key: string]: Array<{ type: string; message: string }> } = {
    cns: [
      { type: 'required', message: 'O número do CNS é obrigatório.' },
      { type: 'cnsInvalid', message: 'Número de CNS inválido.' },
      { type: 'cnsPatientExists', message: 'CNS já está vinculado ao paciente.' },
      { type: 'cnsExists', message: 'CNS já está vinculado a um acompanhante.' }
    ],
    document: [
      { type: 'required', message: 'O documento é obrigatório.' },
      { type: 'cpfInvalid', message: 'Formato de CPF inválido.' },
      { type: 'documentPatientExists', message: 'CPF já está vinculado ao paciente.' },
      { type: 'documentExists', message: 'CPF já está vinculado a um acompanhante.' }
    ],
    name: [{ type: 'required', message: 'O nome do acompanhante é obrigatório.' }],
    gender: [{ type: 'required', message: 'Selecione o gênero.' }],
    birth_date: [
      { type: 'required', message: 'A data de nascimento é obrigatória.' },
      { type: 'invalidDate', message: 'Digite uma data válida.' },
      { type: 'futureDate', message: 'A data de nascimento no futuro.' }
    ],
    is_same_address: [{ type: 'required', message: 'Informe se reside no mesmo endereço.' }],
    cep: [{ type: 'required', message: 'O CEP é obrigatório.' }],
    address: [{ type: 'required', message: 'O endereço é obrigatório.' }],
    number: [{ type: 'required', message: 'O número residencial é obrigatório.' }],
    neighborhood: [{ type: 'required', message: 'O bairro é obrigatório.' }]
  };

  ngOnInit(): void {
    this.initForms();
    this.registerAddressDependency();
    this.setFilteredUfs();
    this.registerReactiveLookups();
  }

  private initForms(): void {
    const patientEscort = this.data?.patientEscort;
    
    let initialBirthDate: any = null;
    if (patientEscort?.birth_date) {
      const cleanDate = patientEscort.birth_date.split(' ')[0].split('T')[0];
      initialBirthDate = moment(cleanDate, 'YYYY-MM-DD');
    }

    this.personalForm = this.fb.group({
      cns: [
        patientEscort?.cns, 
        [Validators.required, CustomValidators.cnsValidator()], 
        [this.patientService.cnsEscortExistsValidator(this.data?.patient_care, patientEscort?.cns)]
      ],
      file_cns_id: [patientEscort?.file_cns_id],
      document: [
        patientEscort?.document, 
        [Validators.required, CustomValidators.cpfValidator()], 
        [this.patientService.documentEscortExistsValidator(this.data?.patient_care, patientEscort?.document)]
      ],
      file_document_id: [patientEscort?.file_document_id],
      name: [patientEscort?.name, [Validators.required]],
      relation: [patientEscort?.relation],
      birth_date: [initialBirthDate, [Validators.required, CustomValidators.dateValidator(), CustomValidators.birthDateValidator()]],
      gender: [patientEscort?.gender, [Validators.required]],
      is_same_address: [patientEscort?.is_same_address ?? false, [Validators.required]],
    });

    this.addressForm = this.fb.group({
      cep: [patientEscort?.cep, [Validators.required]],
      address: [patientEscort?.address, [Validators.required]],
      file_address_id: [patientEscort?.file_address_id],
      number: [patientEscort?.number, [Validators.required]],
      complement: [patientEscort?.complement],
      neighborhood: [patientEscort?.neighborhood, [Validators.required]],
      city: [patientEscort?.city],
      state: [patientEscort?.state],
    });

    if (patientEscort?.is_same_address) {
      this.isSameAddressSignal.set(true);
      this.addressForm.disable();
    }
  }

  private registerReactiveLookups(): void {
    // Busca Reativa por CNS
    this.personalForm.get('cns')?.valueChanges.pipe(
      map(val => val ? String(val).replace(/\D/g, '') : ''),
      filter(val => val.length === 15),
      debounceTime(400),
      distinctUntilChanged(),
      takeUntilDestroyed(this.destroyRef)
    ).subscribe(cleanCns => {
      this.patientService.getEscortCns(cleanCns)
        .pipe(takeUntilDestroyed(this.destroyRef))
        .subscribe({
          next: (response) => this.populateFromResponse(response)
        });
    });

    // Busca Reativa por CPF
    this.personalForm.get('document')?.valueChanges.pipe(
      map(val => val ? String(val).replace(/\D/g, '') : ''),
      filter(val => val.length === 11),
      debounceTime(400),
      distinctUntilChanged(),
      takeUntilDestroyed(this.destroyRef)
    ).subscribe(cleanCpf => {
      this.patientService.getEscortDocument(cleanCpf)
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
                state: response.uf,
              });
              this.addressForm.markAsDirty();
              this.cdr.markForCheck();
            }
          }
        });
    });
  }

  private registerAddressDependency(): void {
    this.personalForm.get('is_same_address')?.valueChanges
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((isSame: boolean) => {
        this.isSameAddressSignal.set(isSame);
        
        if (isSame) {
          this.addressForm.disable();
          this.applyPatientAddress();
        } else {
          this.addressForm.enable();
          if (this.personalForm.get('is_same_address')?.dirty) {
            this.addressForm.reset();
          }
        }
        this.personalForm.markAsDirty();
        this.cdr.markForCheck();
      });
  }

  private applyPatientAddress(): void {
    const patientAddress = this.data?.patient_care?.patient;
    if (patientAddress) {
      this.addressForm.patchValue({
        cep: patientAddress.cep,
        address: patientAddress.address,
        number: patientAddress.number,
        complement: patientAddress.complement,
        neighborhood: patientAddress.neighborhood,
        city: patientAddress.city,
        state: patientAddress.state,
        file_address_id: patientAddress.file_address_id,
      }, { emitEvent: false });
    }
  }

  private populateFromResponse(response: any): void {
    if (!response) return;

    this.personalForm.patchValue({
      cns: response.cns,
      name: response.name,
      file_cns_id: response.file_cns_id,
      document: response.document,
      file_document_id: response.file_document_id,
      gender: response.gender,
      relation: response.relation,
      is_same_address: response.is_same_address,
    }, { emitEvent: false });

    this.addressForm.patchValue({
      cep: response.cep,
      address: response.address,
      file_address_id: response.file_address_id,
      number: response.number,
      complement: response.complement,
      neighborhood: response.neighborhood,
      city: response.city,
      state: response.state,
    }, { emitEvent: false });

    if (response.file_cns_id) {
      this.labelsFiles.cns.set('Arquivo já cadastrado (Clique para alterar)');
    }
    if (response.file_document_id) {
      this.labelsFiles.document.set('Arquivo já cadastrado (Clique para alterar)');
    }
    if (response.file_address_id) {
      this.labelsFiles.address.set('Arquivo já cadastrado (Clique para alterar)');
    }

    const birthDateControl = this.personalForm.get('birth_date');
    if (birthDateControl && response.birth_date) {
      const cleanDateStr = response.birth_date.split(' ')[0].split('T')[0];
      const parsedBirthDate = moment(cleanDateStr, 'YYYY-MM-DD');
      
      birthDateControl.setValue(parsedBirthDate, { emitEvent: false });
      birthDateControl.markAsDirty();
    }

    this.personalForm.markAsDirty();
    this.cdr.markForCheck(); 
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

  // --- MÉTODOS DE MANIPULAÇÃO DO TEMPLATE (PROTECTED) ---

  protected setBirthDate(event: MatDatepickerInputEvent<any>): void {
    if (event.value) {
      const momentDate = moment(event.value);
      this.personalForm.get('birth_date')?.setValue(momentDate, { emitEvent: true });
      this.personalForm.markAsDirty();
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

  protected onFileSelected(event: Event, type: 'cns' | 'document' | 'address', targetForm: FormGroup): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (file) {
      this.labelsFiles[type].set(file.name);
      this.attachedFiles[type] = file;
      targetForm.markAsDirty();
      this.cdr.markForCheck();
    }
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
    const forms = [this.personalForm, this.addressForm];
    return forms.every(form => form?.pristine);
  }

  // --- SUBMISSÃO ---

  protected onSubmit(): void {
    const patientEscortId = this.data?.patientEscort?.id;
    if (!patientEscortId) {
      this.messageService.showMessage('Identificador do acompanhante inválido.');
      return;
    }

    if (this.personalForm.invalid || (this.addressForm.invalid && !this.isSameAddressSignal())) {
      this.personalForm.markAllAsTouched();
      this.addressForm.markAllAsTouched();
      return;
    }

    this.isSubmitting.set(true);
    this.cdr.markForCheck();

    const personalValues = this.personalForm.getRawValue();
    if (personalValues.birth_date) {
      personalValues.birth_date = moment(personalValues.birth_date).format('YYYY-MM-DD');
    }

    const patientEscortPayload = {
      ...personalValues,
      ...this.addressForm.getRawValue(),
      file_cns: this.attachedFiles['cns'],
      file_document: this.attachedFiles['document'],
      file_address: this.attachedFiles['address'],
    };

    this.patientService.updatePatientEscort(patientEscortId, patientEscortPayload)
      .pipe(
        finalize(() => {
          this.isSubmitting.set(false);
          this.cdr.markForCheck();
        }),
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe({
        next: (response: any) => {
          this.messageService.showMessage(response?.message || 'Acompanhante atualizado com sucesso!');
          this.dialogRef.close(true);
        },
        error: (err) => {
          const fallBackError = err?.error?.message || 'Erro ao atualizar acompanhante.';
          this.messageService.showMessage(fallBackError);
        }
      });
  }
}