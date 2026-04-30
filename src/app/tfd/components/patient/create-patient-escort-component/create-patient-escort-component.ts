import { Component, effect, ElementRef, inject, OnInit, signal, ViewChild, viewChild } from '@angular/core';
import { FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import {STEPPER_GLOBAL_OPTIONS} from '@angular/cdk/stepper';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import {MatFormFieldModule} from '@angular/material/form-field';
import {MatInputModule} from '@angular/material/input';
import {MatIconModule} from '@angular/material/icon';
import {MatDatepickerInputEvent, MatDatepickerModule} from '@angular/material/datepicker';
import {MatStepperModule} from '@angular/material/stepper';
import {MatSelectModule} from '@angular/material/select';
import {MatSlideToggleModule} from '@angular/material/slide-toggle';
import {MatTooltipModule} from '@angular/material/tooltip';
import { forkJoin, map, Observable, of, startWith, switchMap } from 'rxjs';
import { MatAutocompleteModule } from '@angular/material/autocomplete';
import { CommonModule } from '@angular/common';
import { NgxMaskDirective, NgxMaskPipe } from 'ngx-mask';
import {MatProgressSpinnerModule} from '@angular/material/progress-spinner';
import { ERRORS } from '../../../consts/errors';
import { ViacepService } from '../../../../core/services/viacep-service';
import { PatientService } from '../../../services/patient-service';
import { MessageService } from '../../../../core/services/message-service';
import { CustomValidators } from '../../../../core/validators/custom.validator';
import { Gender } from '../../../enums/gender';
import { Ufs } from '../../../enums/ufs';

@Component({
  selector: 'app-create-patient-escort-component',
  imports: [CommonModule, FormsModule, ReactiveFormsModule, MatAutocompleteModule, MatDialogModule, MatButtonModule, MatFormFieldModule, MatInputModule, MatIconModule, MatDatepickerModule, MatStepperModule, MatSelectModule, MatSlideToggleModule, MatTooltipModule, NgxMaskDirective, MatProgressSpinnerModule],
  templateUrl: './create-patient-escort-component.html',
  styleUrl: './create-patient-escort-component.scss',
  providers: [{provide: STEPPER_GLOBAL_OPTIONS, useValue: {showError: true}}],
})
export class CreatePatientEscortComponent implements OnInit {

  data = inject(MAT_DIALOG_DATA)
  errorMessages = ERRORS
  createEscortPersonalForm: FormGroup
  createEscortAddressForm: FormGroup
  
  constructor(
    private formBuilder: FormBuilder,
    private viacepService: ViacepService,
    private patientService: PatientService,
    private messageService: MessageService,
    private dialogRef: MatDialogRef<CreatePatientEscortComponent>,
  ) {
    this.createEscortPersonalForm = this.formBuilder.group({
      cns: [null, [Validators.required, CustomValidators.cnsValidator()],[this.patientService.cnsEscortExistsValidator(this.data.patient_care, null)]],
      file_cns_id: [null],
      document: [null, [Validators.required, CustomValidators.cpfValidator()],[this.patientService.documentEscortExistsValidator(this.data.patient_care, null)]],
      file_document_id: [null],
      name: [null, [Validators.required]],
      relation: [null],
      birth_date: [null],
      gender: [null, [Validators.required]],
      is_same_address: [false, [Validators.required]],
    })
    this.createEscortAddressForm = this.formBuilder.group({
      cep: [null, [Validators.required]],
      address: [null, [Validators.required]],
      file_address_id: [null],
      number: [null, [Validators.required]],
      complement: [null],
      neighborhood: [null, [Validators.required]],
      city: [null],
      state: [null],
    })
    effect(() => {
      if (this.statusAddress())
        this.createEscortAddressForm.disable();
      else
        this.createEscortAddressForm.enable();

      if (this.createEscortPersonalForm.get('birth_date')?.value != null)
        this.createEscortPersonalForm.get('birth_date')?.updateValueAndValidity()
    })
  }

  ngOnInit() {
    this.setFilteredUfs()
  }

  @ViewChild('birthDateInput') birthDateInput!: ElementRef<HTMLInputElement>
  setBirthDate(event: MatDatepickerInputEvent<Date>) {
    this.createEscortPersonalForm.get('birth_date')?.setValue(event.value);
  }

  genders: string[] = Object.values(Gender)

  filteredUfsOptions!: Observable<string[]>;
  ufs: string[] = Object.keys(Ufs)
  setFilteredUfs() {
    this.filteredUfsOptions = this.createEscortAddressForm.get('state')!.valueChanges.pipe(
      startWith(''),
      map(value => this._filter(this.ufs, value || '')),
    );
  }

  private _filter(options: any, value: string): string[] {
    const filterValue = value.toLowerCase();

    return options.filter((option: any) => option.toLowerCase().includes(filterValue));
  }

  getEscortCns() {
    const escort = this.createEscortPersonalForm.get('cns')?.value
    if (escort && escort.length === 15) {
      this.patientService.getEscortCns(escort).subscribe({
        next: (response) => {
          this.createEscortPersonalForm.patchValue({
            name: response.name,
            file_cns_id: response.file_cns_id,
            document: response.document,
            file_document_id: response.file_document_id,
            gender: response.gender,
            relation: response.relation,
            birth_date: response.birth_date,
            is_same_address: response.is_same_address,
          })
          this.createEscortAddressForm.patchValue({
            cep: response.cep,
            address: response.address,
            file_address_id: response.file_address_id,
            number: response.number,
            complement: response.complement,
            neighborhood: response.neighborhood,
            city: response.city,
            state: response.state,
          })
          this.birthDateInput.nativeElement.value = response.birth_date ? new Date(response.birth_date).toLocaleDateString() : ''
        },
      })
    }
  }

  getEscortDocument() {
    const escort = this.createEscortPersonalForm.get('document')?.value
    if (escort && escort.length === 11) {
      this.patientService.getEscortDocument(escort).subscribe({
        next: (response) => {
          this.createEscortPersonalForm.patchValue({
            cns: response.cns,
            name: response.name,
            file_cns_id: response.file_cns_id,
            file_document_id: response.file_document_id,
            gender: response.gender,
            relation: response.relation,
            birth_date: response.birth_date,
            is_same_address: response.is_same_address,
          })
          this.createEscortAddressForm.patchValue({
            cep: response.cep,
            address: response.address,
            file_address_id: response.file_address_id,
            number: response.number,
            complement: response.complement,
            neighborhood: response.neighborhood,
            city: response.city,
            state: response.state,
          })
          this.birthDateInput.nativeElement.value = response.birth_date ? new Date(response.birth_date).toLocaleDateString() : ''
        },
      })
    }
  }

  getAddress() {
    const cep = this.createEscortAddressForm.get('cep')?.value
    if (cep && cep.length === 8) {
      this.viacepService.getAddress(cep).subscribe({
        next: (response) => {
          this.createEscortAddressForm.patchValue({
            address: response.logradouro,
            neighborhood: response.bairro,
            city: response.localidade,
            state: response.uf,
          })
        }
      })
    }
  }

  statusAddress = signal<boolean | null>(null)
  useSameAddress() {
    const isSameAddress = this.createEscortPersonalForm.get('is_same_address')?.value
    this.statusAddress.set(isSameAddress)
    if (isSameAddress) {
      const patientAddress = this.data.patient_care.patient
      this.createEscortAddressForm.patchValue({
        cep: patientAddress.cep,
        address: patientAddress.address,
        number: patientAddress.number,
        complement: patientAddress.complement,
        neighborhood: patientAddress.neighborhood,
        city: patientAddress.city,
        state: patientAddress.state,
        file_address_id: patientAddress.file_address_id,
      })
    }
  }
  resetAddress() {
    const isSameAddress = this.createEscortPersonalForm.get('is_same_address')?.value
    if (!isSameAddress)
      this.createEscortAddressForm.reset()
  }

  labelFileCNS = signal<string>('Nenhum arquivo selecionado');
  fileCNS!:File
  onFileCNSSelected(event: any) {
    this.labelFileCNS.set(event.target.files[0].name)
    this.fileCNS = event.target.files[0]
  }

  labelFileDocument = signal<string>('Nenhum arquivo selecionado');
  fileDocument!:File
  onFileDocumentSelected(event: any) {
    this.labelFileDocument.set(event.target.files[0].name)
    this.fileDocument = event.target.files[0]
  }

  labelFileAddress = signal<string>('Nenhum arquivo selecionado');
  fileAddress!:File 
  onFileAddressSelected(event: any) {
    this.labelFileAddress.set(event.target.files[0].name)
    this.fileAddress = event.target.files[0]
  }

  
  wSubmit = signal<boolean>(false)
  onSubmit() {
    this.wSubmit.set(true);
    const patientEscortData = {
      ...this.createEscortPersonalForm.value,
      ...this.createEscortAddressForm.value,
      file_cns: this.fileCNS,
      file_document: this.fileDocument,
      file_address: this.fileAddress,
    };

    this.patientService.createPatientEscort(this.data.patient_care.id, patientEscortData).subscribe({
      next: (response: any) => {
        this.messageService.showMessage(response.message);
        this.dialogRef.close(true);
      },
      error: (err) => {
        this.messageService.showMessage(err.error.message);
        this.wSubmit.set(false);
      }
    });
  }

}
