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
import { CommonModule, formatDate } from '@angular/common';
import { NgxMaskDirective } from 'ngx-mask';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { map, Observable, startWith, finalize } from 'rxjs';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { saveAs } from 'file-saver';

import * as _moment from 'moment';
const moment = (_moment as any).default || _moment;

import { ViacepService } from '../../../../core/services/viacep-service';
import { PatientService } from '../../../services/patient-service';
import { MessageService } from '../../../../core/services/message-service';
import { StorageService } from '../../../../core/services/storage-service';
import { CustomValidators } from '../../../../core/validators/custom.validator';
import { Gender } from '../../../enums/gender';
import { Ufs } from '../../../enums/ufs';

@Component({
  selector: 'app-update-patient-escort-component',
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
  templateUrl: './update-patient-escort-component.html',
  styleUrl: './update-patient-escort-component.scss',
  providers: [
    { provide: STEPPER_GLOBAL_OPTIONS, useValue: { showError: true } }
  ],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class UpdatePatientEscortComponent implements OnInit {
  protected readonly data = inject(MAT_DIALOG_DATA);
  private readonly fb = inject(FormBuilder);
  private readonly viacepService = inject(ViacepService);
  private readonly patientService = inject(PatientService);
  private readonly messageService = inject(MessageService);
  private readonly storageService = inject(StorageService);
  private readonly dialogRef = inject(MatDialogRef<UpdatePatientEscortComponent>);
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
    cns: signal<string>(this.data?.escort?.file_cns_id ? 'Arquivo já cadastrado (Clique para alterar)' : 'Nenhum arquivo selecionado'),
    document: signal<string>(this.data?.escort?.file_document_id ? 'Arquivo já cadastrado (Clique para alterar)' : 'Nenhum arquivo selecionado'),
    address: signal<string>(this.data?.escort?.file_address_id ? 'Arquivo já cadastrado (Clique para alterar)' : 'Nenhum arquivo selecionado')
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
  }

  private initForms(): void {
    const escort = this.data?.escort;
    
    let initialBirthDate: any = null;
    if (escort?.birth_date) {
      const cleanDate = escort.birth_date.split(' ')[0].split('T')[0];
      initialBirthDate = moment(cleanDate, 'YYYY-MM-DD');
    }

    this.personalForm = this.fb.group({
      cns: [
        escort?.cns, 
        [Validators.required, CustomValidators.cnsValidator()], 
        [this.patientService.cnsEscortExistsValidator(this.data.patient_care, escort?.cns)]
      ],
      file_cns_id: [escort?.file_cns_id],
      document: [
        escort?.document, 
        [Validators.required, CustomValidators.cpfValidator()], 
        [this.patientService.documentEscortExistsValidator(this.data.patient_care, escort?.document)]
      ],
      file_document_id: [escort?.file_document_id],
      name: [escort?.name, [Validators.required]],
      relation: [escort?.relation],
      birth_date: [initialBirthDate, [Validators.required, CustomValidators.dateValidator(), CustomValidators.birthDateValidator()]],
      gender: [escort?.gender, [Validators.required]],
      is_same_address: [escort?.is_same_address ?? false, [Validators.required]],
    });

    this.addressForm = this.fb.group({
      cep: [escort?.cep, [Validators.required]],
      address: [escort?.address, [Validators.required]],
      file_address_id: [escort?.file_address_id],
      number: [escort?.number, [Validators.required]],
      complement: [escort?.complement],
      neighborhood: [escort?.neighborhood, [Validators.required]],
      city: [escort?.city],
      state: [escort?.state],
    });

    if (escort?.is_same_address) {
      this.isSameAddressSignal.set(true);
      this.addressForm.disable();
    }
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
        this.cdr.markForCheck(); // CORREÇÃO: Força atualização reativa imediata na UI
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

    // CORREÇÃO DEFINITIVA DE POPULAÇÃO AUTOMÁTICA:
    const birthDateControl = this.personalForm.get('birth_date');
    if (birthDateControl && response.birth_date) {
      const cleanDateStr = response.birth_date.split(' ')[0].split('T')[0];
      const parsedBirthDate = moment(cleanDateStr, 'YYYY-MM-DD');
      
      // Passando emitEvent true e forçando estado dirty para o Angular notar a mutação
      birthDateControl.setValue(parsedBirthDate, { emitEvent: true });
      birthDateControl.markAsDirty();
    }

    this.personalForm.markAsDirty();
    
    // Força o ciclo de detecção de mudanças a rodar de forma síncrona imediatamente
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
      
      // Garante sincronia visual imediata quando o usuário muda a data clicando na UI
      this.cdr.markForCheck(); 
    }
  }

  protected onlyNumbersAndSlashes(event: KeyboardEvent): boolean {
    const charCode = event.key;
    // Permite apenas números (0-9) e a barra (/)
    const allowedCharacters = /^[0-9\/]$/;
    
    if (!allowedCharacters.test(charCode)) {
      event.preventDefault();
      return false;
    }
    return true;
  }

  protected onFileSelected(event: any, type: 'cns' | 'document' | 'address', targetForm: FormGroup): void {
    const file = event.target.files?.[0];
    if (file) {
      this.labelsFiles[type].set(file.name);
      this.attachedFiles[type] = file;
      targetForm.markAsDirty();
      this.cdr.markForCheck();
    }
  }

  protected getEscortCns(): void {
    const escort = this.personalForm.get('cns')?.value;
    if (escort && escort.length === 15) {
      this.patientService.getEscortCns(escort)
        .pipe(takeUntilDestroyed(this.destroyRef))
        .subscribe({
          next: (response) => this.populateFromResponse(response)
        });
    }
  }

  protected getEscortDocument(): void {
    const escort = this.personalForm.get('document')?.value;
    if (escort && escort.length === 11) {
      this.patientService.getEscortDocument(escort)
        .pipe(takeUntilDestroyed(this.destroyRef))
        .subscribe({
          next: (response) => this.populateFromResponse(response)
        });
    }
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

  protected isFormsPristine(): boolean {
    const forms = [this.personalForm, this.addressForm];
    return forms.every(form => form?.pristine);
  }

  // --- SUBMISSÃO ---

  protected onSubmit(): void {
    const escortId = this.data?.escort?.id;
    if (!escortId) {
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
      if (moment.isMoment(personalValues.birth_date)) {
        personalValues.birth_date = personalValues.birth_date.format('YYYY-MM-DD');
      } else {
        personalValues.birth_date = formatDate(personalValues.birth_date, 'yyyy-MM-dd', 'en');
      }
    }

    const patientEscortPayload = {
      ...personalValues,
      ...this.addressForm.getRawValue(),
      file_cns: this.attachedFiles['cns'],
      file_document: this.attachedFiles['document'],
      file_address: this.attachedFiles['address'],
    };

    this.patientService.updatePatientEscort(escortId, patientEscortPayload)
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
          const fallbackError = 'Erro ao atualizar acompanhante.';
          this.messageService.showMessage(err?.error?.message || fallbackError);
        }
      });
  }
}