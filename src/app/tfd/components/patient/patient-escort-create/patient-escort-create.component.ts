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
import { map, Observable, startWith, finalize, debounceTime, distinctUntilChanged } from 'rxjs';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { MAT_DATE_LOCALE, MatNativeDateModule } from '@angular/material/core';

import * as _moment from 'moment';
const moment = (_moment as any).default || _moment;

import { ViacepService } from '../../../../core/services/viacep-service';
import { PatientService } from '../../../services/patient.service';
import { MessageService } from '../../../../core/services/message-service';
import { CustomValidators } from '../../../../core/validators/custom.validator';
import { Gender } from '../../../enums/gender';
import { Ufs } from '../../../enums/ufs';

@Component({
  selector: 'app-patient-escort-create',
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
    MatNativeDateModule, 
    MatStepperModule, 
    MatSelectModule, 
    MatSlideToggleModule, 
    MatTooltipModule, 
    NgxMaskDirective, 
    MatProgressSpinnerModule
  ],
  templateUrl: './patient-escort-create.component.html',
  styleUrl: './patient-escort-create.component.scss',
  providers: [
    { provide: STEPPER_GLOBAL_OPTIONS, useValue: { showError: true } },
    { provide: MAT_DATE_LOCALE, useValue: 'pt-BR' } 
  ],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class PatientEscortCreateComponent implements OnInit {
  protected readonly data = inject(MAT_DIALOG_DATA, { optional: true });
  private readonly fb = inject(FormBuilder);
  private readonly viacepService = inject(ViacepService);
  private readonly patientService = inject(PatientService);
  private readonly messageService = inject(MessageService);
  private readonly dialogRef = inject(MatDialogRef<PatientEscortCreateComponent>);
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
    cns: signal<string>('Nenhum arquivo selecionado'),
    document: signal<string>('Nenhum arquivo selecionado'),
    address: signal<string>('Nenhum arquivo selecionado')
  };

  protected readonly errorMessages: { [key: string]: Array<{ type: string; message: string }> } = {
    cns: [
      { type: 'required', message: 'O número do CNS é obrigatório.' },
      { type: 'cnsInvalid', message: 'Número de CNS inválido.' },
      { type: 'cnsPatientExists', message: 'CNS já está vinculado ao paciente.' },
      { type: 'cnsExists', message: 'CNS já está vinculado a um acompanhante.' }
    ],
    document: [
      { type: 'required', message: 'O CPF é obrigatório.' },
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
    this.registerReactiveLookups();
    this.setFilteredUfs();
  }

  private initForms(): void {
    const patientCare = this.data?.patientCare;

    this.personalForm = this.fb.group({
      cns: [null, [Validators.required, CustomValidators.cnsValidator()], [this.patientService.cnsEscortExistsValidator(patientCare, null)]],
      file_cns_id: [null],
      document: [null, [Validators.required, CustomValidators.cpfValidator()], [this.patientService.documentEscortExistsValidator(patientCare, null)]],
      file_document_id: [null],
      name: [null, [Validators.required]],
      relation: [null],
      birth_date: [null, [Validators.required, CustomValidators.dateValidator(), CustomValidators.birthDateValidator()]],
      gender: [null, [Validators.required]],
      is_same_address: [false, [Validators.required]],
    });

    this.addressForm = this.fb.group({
      cep: [null, [Validators.required]],
      address: [null, [Validators.required]],
      file_address_id: [null],
      number: [null, [Validators.required]],
      complement: [null],
      neighborhood: [null, [Validators.required]],
      city: [null],
      state: [null],
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
          this.addressForm.reset();
        }
        this.cdr.markForCheck();
      });
  }

  private registerReactiveLookups(): void {
    // Busca reativa por CNS
    this.personalForm.get('cns')?.valueChanges
      .pipe(
        debounceTime(400),
        distinctUntilChanged(),
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe((cnsValue: string | null) => {
        const rawCns = cnsValue ? cnsValue.replace(/\D/g, '') : '';
        if (rawCns.length === 15) {
          this.patientService.getEscortCns(rawCns)
            .pipe(takeUntilDestroyed(this.destroyRef))
            .subscribe({
              next: (response) => this.populateFromResponse(response)
            });
        }
      });

    // Busca reativa por CPF / Documento
    this.personalForm.get('document')?.valueChanges
      .pipe(
        debounceTime(400),
        distinctUntilChanged(),
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe((docValue: string | null) => {
        const rawDoc = docValue ? docValue.replace(/\D/g, '') : '';
        if (rawDoc.length === 11) {
          this.patientService.getEscortDocument(rawDoc)
            .pipe(takeUntilDestroyed(this.destroyRef))
            .subscribe({
              next: (response) => this.populateFromResponse(response)
            });
        }
      });

    // Busca reativa por CEP
    this.addressForm.get('cep')?.valueChanges
      .pipe(
        debounceTime(400),
        distinctUntilChanged(),
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe((cepValue: string | null) => {
        const rawCep = cepValue ? cepValue.replace(/\D/g, '') : '';
        if (rawCep.length === 8) {
          this.viacepService.getAddress(rawCep)
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
      });
  }

  private applyPatientAddress(): void {
    const patientAddress = this.data?.patientCare?.patient;
    if (!patientAddress) return;

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
    });

    this.addressForm.patchValue({
      cep: response.cep,
      address: response.address,
      file_address_id: response.file_address_id,
      number: response.number,
      complement: response.complement,
      neighborhood: response.neighborhood,
      city: response.city,
      state: response.state,
    });

    const birthDateControl = this.personalForm.get('birth_date');
    if (birthDateControl && response.birth_date) {
      const cleanDateStr = response.birth_date.split(' ')[0].split('T')[0];
      const parsedBirthDate = moment(cleanDateStr, 'YYYY-MM-DD');
      
      birthDateControl.setValue(parsedBirthDate, { emitEvent: true });
      birthDateControl.markAsDirty();
    }

    this.personalForm.markAsDirty();
    this.cdr.markForCheck(); 
  }

  protected setBirthDate(event: MatDatepickerInputEvent<Date>): void {
    if (event.value) {
      this.personalForm.get('birth_date')?.setValue(event.value);
      this.personalForm.get('birth_date')?.markAsDirty();
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

  protected onFileSelected(event: any, type: 'cns' | 'document' | 'address'): void {
    const file = event.target.files?.[0];
    if (file) {
      this.labelsFiles[type].set(file.name);
      this.attachedFiles[type] = file;
      this.cdr.markForCheck();
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

  protected onSubmit(): void {
    const patientCaretId = this.data?.patientCare?.id;
    if (!patientCaretId) {
      this.messageService.showMessage('Identificador do atendimento do paciente inválido.');
      return;
    }

    if (this.personalForm.invalid || (this.addressForm.invalid && !this.isSameAddressSignal())) {
      this.personalForm.markAllAsTouched();
      this.addressForm.markAllAsTouched();
      return;
    }

    this.isSubmitting.set(true);
    this.cdr.markForCheck();

    const patientEscortData = {
      ...this.personalForm.getRawValue(),
      ...this.addressForm.getRawValue(),
      file_cns: this.attachedFiles['cns'],
      file_document: this.attachedFiles['document'],
      file_address: this.attachedFiles['address'],
    };

    this.patientService.createPatientEscort(patientCaretId, patientEscortData)
      .pipe(
        finalize(() => {
          this.isSubmitting.set(false);
          this.cdr.markForCheck();
        }),
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe({
        next: (response: any) => {
          this.messageService.showMessage(response?.message || 'Acompanhante cadastrado com sucesso!');
          this.dialogRef.close(true);
        },
        error: (err) => {
          const fallbackError = err?.error?.message || 'Erro ao salvar acompanhante.';
          this.messageService.showMessage(fallbackError);
        }
      });
  }
}