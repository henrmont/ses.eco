import { ChangeDetectionStrategy, Component, effect, inject, OnInit, signal, ChangeDetectorRef } from '@angular/core';
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
import { map, Observable, startWith, finalize } from 'rxjs';
import { toSignal } from '@angular/core/rxjs-interop';
import { MAT_DATE_LOCALE, MatNativeDateModule } from '@angular/material/core';
import { saveAs } from 'file-saver';

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
    CommonModule, FormsModule, ReactiveFormsModule, MatAutocompleteModule, MatDialogModule, 
    MatButtonModule, MatFormFieldModule, MatInputModule, MatIconModule, MatDatepickerModule, 
    MatNativeDateModule, MatStepperModule, MatSelectModule, MatSlideToggleModule, MatTooltipModule, 
    NgxMaskDirective, MatProgressSpinnerModule
  ],
  templateUrl: './update-patient-escort-component.html',
  styleUrl: './update-patient-escort-component.scss',
  providers: [
    { provide: STEPPER_GLOBAL_OPTIONS, useValue: { showError: true } },
    { provide: MAT_DATE_LOCALE, useValue: 'pt-BR' } 
  ],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class UpdatePatientEscortComponent implements OnInit {
  // Injeções de Dependência
  protected readonly data = inject(MAT_DIALOG_DATA);
  private readonly fb = inject(FormBuilder);
  private readonly viacepService = inject(ViacepService);
  private readonly patientService = inject(PatientService);
  private readonly messageService = inject(MessageService);
  private readonly storageService = inject(StorageService);
  private readonly dialogRef = inject(MatDialogRef<UpdatePatientEscortComponent>);
  private readonly cdr = inject(ChangeDetectorRef);

  // Estados com Signals expostos ao template (protected)
  protected readonly isSubmitting = signal<boolean>(false);
  protected isSameAddressSignal!: () => boolean;

  // Estrutura dos Formulários expostos ao template (protected)
  protected updateEscortPersonalForm!: FormGroup;
  protected updateEscortAddressForm!: FormGroup;

  // Listas extraídas dos Enums para os Selects
  protected readonly genders: string[] = Object.values(Gender);
  private readonly ufs: string[] = Object.keys(Ufs);

  // Filtros de Autocomplete
  protected filteredUfsOptions!: Observable<string[]>;

  // Dicionário de Arquivos Interno e Controle de Labels unificado (protected)
  private readonly files: { [key: string]: File | null } = {
    cns: null,
    document: null,
    address: null
  };

  protected readonly labelsFiles = {
    cns: signal<string>(this.data.escort.file_cns_id ? 'Arquivo já cadastrado (Clique para alterar)' : 'Nenhum arquivo selecionado'),
    document: signal<string>(this.data.escort.file_document_id ? 'Arquivo já cadastrado (Clique para alterar)' : 'Nenhum arquivo selecionado'),
    address: signal<string>(this.data.escort.file_address_id ? 'Arquivo já cadastrado (Clique para alterar)' : 'Nenhum arquivo selecionado')
  };

  // Mapeamento local das mensagens de erro (protected) embutidas no componente
  protected readonly errorMessages: { [key: string]: Array<{ type: string; message: string }> } = {
    cns: [
      { type: 'required', message: 'O número do CNS é obrigatório.' },
      { type: 'cnsInvalid', message: 'Número de CNS inválido.' },
      { type: 'cnsPatientExists', message: 'Este CNS já está vinculado ao paciente.' },
      { type: 'cnsExists', message: 'Este CNS já está vinculado a um acompanhante para este atendimento.' }
    ],
    document: [
      { type: 'required', message: 'O documento é obrigatório.' },
      { type: 'cpfInvalid', message: 'Formato de CPF inválido.' },
      { type: 'documentPatientExists', message: 'Este documento já está vinculado ao paciente.' },
      { type: 'documentExists', message: 'Este CPF já está vinculado a um acompanhante para este atendimento.' }
    ],
    name: [{ type: 'required', message: 'O nome do acompanhante é obrigatório.' }],
    gender: [{ type: 'required', message: 'Selecione o gênero.' }],
    is_same_address: [{ type: 'required', message: 'Informe se reside no mesmo endereço.' }],
    cep: [{ type: 'required', message: 'O CEP é obrigatório.' }],
    address: [{ type: 'required', message: 'O endereço é obrigatório.' }],
    number: [{ type: 'required', message: 'O número residencial é obrigatório.' }],
    neighborhood: [{ type: 'required', message: 'O bairro é obrigatório.' }]
  };

  constructor() {
    this.initForms();

    this.isSameAddressSignal = toSignal(
      this.updateEscortPersonalForm.get('is_same_address')!.valueChanges,
      { initialValue: !!this.updateEscortPersonalForm.get('is_same_address')?.value }
    );

    effect(() => {
      const isSame = this.isSameAddressSignal();
      
      if (isSame) {
        this.updateEscortAddressForm.disable();
        this.applyPatientAddress();
      } else {
        this.updateEscortAddressForm.enable();
      }
    });
  }

  ngOnInit(): void {
    this.setFilteredUfs();
  }

  // --- MÉTODOS PRIVADOS DE INICIALIZAÇÃO E SUPORTE ---

  private initForms(): void {
    let parsedBirthDate: Date | null = null;
    if (this.data.escort.birth_date && typeof this.data.escort.birth_date === 'string') {
      const dateOnlyStr = this.data.escort.birth_date.split(' ')[0];
      const cleanDateStr = dateOnlyStr.split('T')[0];
      const parts = cleanDateStr.split('-');
      if (parts.length === 3) {
        parsedBirthDate = new Date(Number(parts[0]), Number(parts[1]) - 1, Number(parts[2]));
      }
    }

    this.updateEscortPersonalForm = this.fb.group({
      cns: [
        this.data.escort.cns, 
        [Validators.required, CustomValidators.cnsValidator()], 
        [this.patientService.cnsEscortExistsValidator(this.data.patient_care, this.data.escort.cns)]
      ],
      file_cns_id: [this.data.escort.file_cns_id],
      document: [
        this.data.escort.document, 
        [Validators.required, CustomValidators.cpfValidator()], 
        [this.patientService.documentEscortExistsValidator(this.data.patient_care, this.data.escort.document)]
      ],
      file_document_id: [this.data.escort.file_document_id],
      name: [this.data.escort.name, [Validators.required]],
      relation: [this.data.escort.relation],
      birth_date: [parsedBirthDate],
      gender: [this.data.escort.gender, [Validators.required]],
      is_same_address: [this.data.escort.is_same_address ?? false, [Validators.required]],
    });

    this.updateEscortAddressForm = this.fb.group({
      cep: [this.data.escort.cep, [Validators.required]],
      address: [this.data.escort.address, [Validators.required]],
      file_address_id: [this.data.escort.file_address_id],
      number: [this.data.escort.number, [Validators.required]],
      complement: [this.data.escort.complement],
      neighborhood: [this.data.escort.neighborhood, [Validators.required]],
      city: [this.data.escort.city],
      state: [this.data.escort.state],
    });
  }

  private setFilteredUfs(): void {
    this.filteredUfsOptions = this.updateEscortAddressForm.get('state')!.valueChanges.pipe(
      startWith(''),
      map(value => this._filter(this.ufs, value || '')),
    );
  }

  private _filter(options: string[], value: string): string[] {
    const filterValue = value.toLowerCase();
    return options.filter(option => option.toLowerCase().includes(filterValue));
  }

  private applyPatientAddress(): void {
    const patientAddress = this.data.patient_care.patient;
    this.updateEscortAddressForm.patchValue({
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

  // --- MÉTODOS DE AÇÃO DO TEMPLATE (PROTECTED) ---

  protected setBirthDate(event: MatDatepickerInputEvent<Date>): void {
    if (event.value) {
      this.updateEscortPersonalForm.get('birth_date')?.setValue(event.value, { emitEvent: false });
    }
  }

  protected resetAddress(): void {
    const isSameAddress = this.isSameAddressSignal();
    if (!isSameAddress) {
      this.updateEscortAddressForm.reset();
    }
  }

  protected onFileSelected(event: any, type: 'cns' | 'document' | 'address'): void {
    const file = event.target.files[0];
    if (file) {
      this.labelsFiles[type].set(file.name);
      this.files[type] = file;
      
      if (type === 'address') {
        this.updateEscortAddressForm.markAsDirty();
      } else {
        this.updateEscortPersonalForm.markAsDirty();
      }
    }
  }

  protected download(archive: number, name: string): void {
    this.storageService.download(archive).subscribe({
      next: (response) => {
        saveAs(response.archive, name);
      }
    });
  }

  protected getAddress(): void {
    const cep = this.updateEscortAddressForm.get('cep')?.value;
    if (cep && cep.length === 8) {
      this.viacepService.getAddress(cep).subscribe({
        next: (response) => {
          this.updateEscortAddressForm.patchValue({
            address: response.logradouro,
            neighborhood: response.bairro,
            city: response.localidade,
            state: response.uf,
          });
        }
      });
    }
  }

  protected onSubmit(): void {
    if (this.updateEscortPersonalForm.invalid || (this.updateEscortAddressForm.invalid && !this.isSameAddressSignal())) {
      return;
    }

    this.isSubmitting.set(true);

    const patientEscortData = {
      ...this.updateEscortPersonalForm.value,
      ...this.updateEscortAddressForm.getRawValue(),
      file_cns: this.files['cns'],
      file_document: this.files['document'],
      file_address: this.files['address'],
    };

    this.patientService.updatePatientEscort(this.data.escort.id, patientEscortData)
      .pipe(finalize(() => this.isSubmitting.set(false)))
      .subscribe({
        next: (response: any) => {
          this.messageService.showMessage(response.message || 'Acompanhante atualizado com sucesso!');
          this.dialogRef.close(true);
        },
        error: (err) => {
          const errMsg = err?.error?.message || 'Erro ao atualizar acompanhante.';
          this.messageService.showMessage(errMsg);
        }
      });
  }
}