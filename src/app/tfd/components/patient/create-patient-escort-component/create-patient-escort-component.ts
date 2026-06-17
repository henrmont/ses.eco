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

import { ViacepService } from '../../../../core/services/viacep-service';
import { PatientService } from '../../../services/patient-service';
import { MessageService } from '../../../../core/services/message-service';
import { CustomValidators } from '../../../../core/validators/custom.validator';
import { Gender } from '../../../enums/gender';
import { Ufs } from '../../../enums/ufs';

@Component({
  selector: 'app-create-patient-escort-component',
  imports: [
    CommonModule, FormsModule, ReactiveFormsModule, MatAutocompleteModule, MatDialogModule, 
    MatButtonModule, MatFormFieldModule, MatInputModule, MatIconModule, MatDatepickerModule, 
    MatNativeDateModule, MatStepperModule, MatSelectModule, MatSlideToggleModule, MatTooltipModule, 
    NgxMaskDirective, MatProgressSpinnerModule
  ],
  templateUrl: './create-patient-escort-component.html',
  styleUrl: './create-patient-escort-component.scss',
  providers: [
    { provide: STEPPER_GLOBAL_OPTIONS, useValue: { showError: true } },
    { provide: MAT_DATE_LOCALE, useValue: 'pt-BR' } 
  ],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class CreatePatientEscortComponent implements OnInit {
  // Injeções de Dependência
  protected readonly data = inject(MAT_DIALOG_DATA);
  private readonly fb = inject(FormBuilder);
  private readonly viacepService = inject(ViacepService);
  private readonly patientService = inject(PatientService);
  private readonly messageService = inject(MessageService);
  private readonly dialogRef = inject(MatDialogRef<CreatePatientEscortComponent>);
  private readonly cdr = inject(ChangeDetectorRef);

  // Estados com Signals expostos ao template (protected)
  protected readonly isSubmitting = signal<boolean>(false);
  protected isSameAddressSignal!: () => boolean;

  // Estrutura dos Formulários expostos ao template (protected)
  protected createEscortPersonalForm!: FormGroup;
  protected createEscortAddressForm!: FormGroup;

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
    cns: signal<string>('Nenhum arquivo selecionado'),
    document: signal<string>('Nenhum arquivo selecionado'),
    address: signal<string>('Nenhum arquivo selecionado')
  };

  // Mapeamento local das mensagens de erro (protected)
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
      this.createEscortPersonalForm.get('is_same_address')!.valueChanges,
      { initialValue: !!this.createEscortPersonalForm.get('is_same_address')?.value }
    );

    effect(() => {
      const isSame = this.isSameAddressSignal();
      
      if (isSame) {
        this.createEscortAddressForm.disable();
        this.applyPatientAddress();
      } else {
        this.createEscortAddressForm.enable();
      }
    });
  }

  ngOnInit(): void {
    this.setFilteredUfs();
  }

  // --- MÉTODOS PRIVADOS DE INICIALIZAÇÃO E SUPORTE ---

  private initForms(): void {
    this.createEscortPersonalForm = this.fb.group({
      cns: [null, [Validators.required, CustomValidators.cnsValidator()], [this.patientService.cnsEscortExistsValidator(this.data.patient_care, null)]],
      file_cns_id: [null],
      document: [null, [Validators.required, CustomValidators.cpfValidator()], [this.patientService.documentEscortExistsValidator(this.data.patient_care, null)]],
      file_document_id: [null],
      name: [null, [Validators.required]],
      relation: [null],
      birth_date: [null],
      gender: [null, [Validators.required]],
      is_same_address: [false, [Validators.required]],
    });

    this.createEscortAddressForm = this.fb.group({
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

  private setFilteredUfs(): void {
    this.filteredUfsOptions = this.createEscortAddressForm.get('state')!.valueChanges.pipe(
      startWith(''),
      map(value => this._filter(this.ufs, value || '')),
    );
  }

  private _filter(options: string[], value: string): string[] {
    const filterValue = value.toLowerCase();
    return options.filter(option => option.toLowerCase().includes(filterValue));
  }

  private populateFromResponse(response: any): void {
    let parsedBirthDate: Date | null = null;
    
    // 🌟 Tratamento corrigido para o formato 'YYYY-MM-DD HH:mm:ss'
    if (response.birth_date && typeof response.birth_date === 'string') {
      // Primeiro separa pelo espaço para eliminar o '00:00:00' se ele existir
      const dateOnlyStr = response.birth_date.split(' ')[0];
      // Depois separa pelo 'T' caso venha no formato ISO completo
      const cleanDateStr = dateOnlyStr.split('T')[0];
      
      const parts = cleanDateStr.split('-');
      if (parts.length === 3) {
        // Agora sim: Ano (2026), Mês (5) e Dia (2) puros e sem texto grudado!
        parsedBirthDate = new Date(Number(parts[0]), Number(parts[1]) - 1, Number(parts[2]));
      }
    }

    // Faz o patch normal das outras propriedades textuais
    this.createEscortPersonalForm.patchValue({
      cns: response.cns,
      name: response.name,
      file_cns_id: response.file_cns_id,
      document: response.document,
      file_document_id: response.file_document_id,
      gender: response.gender,
      relation: response.relation,
      is_same_address: response.is_same_address,
    });

    this.createEscortAddressForm.patchValue({
      cep: response.cep,
      address: response.address,
      file_address_id: response.file_address_id,
      number: response.number,
      complement: response.complement,
      neighborhood: response.neighborhood,
      city: response.city,
      state: response.state,
    });

    // Atualiza o controle de data com o objeto Date limpo e perfeito
    const birthDateControl = this.createEscortPersonalForm.get('birth_date');
    if (birthDateControl) {
      birthDateControl.setValue(parsedBirthDate);
      birthDateControl.updateValueAndValidity();
    }

    this.cdr.markForCheck();
  }

  private applyPatientAddress(): void {
    const patientAddress = this.data.patient_care.patient;
    this.createEscortAddressForm.patchValue({
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
      this.createEscortPersonalForm.get('birth_date')?.setValue(event.value, { emitEvent: false });
    }
  }

  protected resetAddress(): void {
    const isSameAddress = this.isSameAddressSignal();
    if (!isSameAddress) {
      this.createEscortAddressForm.reset();
    }
  }

  protected onFileSelected(event: any, type: 'cns' | 'document' | 'address'): void {
    const file = event.target.files[0];
    if (file) {
      this.labelsFiles[type].set(file.name);
      this.files[type] = file;
    }
  }

  protected getEscortCns(): void {
    const escort = this.createEscortPersonalForm.get('cns')?.value;
    if (escort && escort.length === 15) {
      this.patientService.getEscortCns(escort).subscribe({
        next: (response) => this.populateFromResponse(response)
      });
    }
  }

  protected getEscortDocument(): void {
    const escort = this.createEscortPersonalForm.get('document')?.value;
    if (escort && escort.length === 11) {
      this.patientService.getEscortDocument(escort).subscribe({
        next: (response) => this.populateFromResponse(response)
      });
    }
  }

  protected getAddress(): void {
    const cep = this.createEscortAddressForm.get('cep')?.value;
    if (cep && cep.length === 8) {
      this.viacepService.getAddress(cep).subscribe({
        next: (response) => {
          this.createEscortAddressForm.patchValue({
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
    if (this.createEscortPersonalForm.invalid || (this.createEscortAddressForm.invalid && !this.isSameAddressSignal())) {
      return;
    }

    this.isSubmitting.set(true);

    const patientEscortData = {
      ...this.createEscortPersonalForm.value,
      ...this.createEscortAddressForm.getRawValue(),
      file_cns: this.files['cns'],
      file_document: this.files['document'],
      file_address: this.files['address'],
    };

    this.patientService.createPatientEscort(this.data.patient_care.id, patientEscortData)
      .pipe(finalize(() => this.isSubmitting.set(false)))
      .subscribe({
        next: (response: any) => {
          this.messageService.showMessage(response.message || 'Acompanhante cadastrado com sucesso!');
          this.dialogRef.close(true);
        },
        error: (err) => {
          const errMsg = err?.error?.message || 'Erro ao salvar acompanhante.';
          this.messageService.showMessage(errMsg);
        }
      });
  }
}