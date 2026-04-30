import { Component, effect, inject, OnInit, signal } from '@angular/core';
import { FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import {STEPPER_GLOBAL_OPTIONS} from '@angular/cdk/stepper';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import {MatFormFieldModule} from '@angular/material/form-field';
import {MatInputModule} from '@angular/material/input';
import {MatIconModule} from '@angular/material/icon';
import {MatDatepickerModule} from '@angular/material/datepicker';
import {MatStepperModule} from '@angular/material/stepper';
import {MatSelectModule} from '@angular/material/select';
import {MatSlideToggleModule} from '@angular/material/slide-toggle';
import {MatTooltipModule} from '@angular/material/tooltip';
import { finalize, forkJoin, map, Observable, of, startWith, switchMap } from 'rxjs';
import { MatAutocompleteModule } from '@angular/material/autocomplete';
import { CommonModule, formatDate } from '@angular/common';
import { saveAs } from 'file-saver';
import { NgxMaskDirective } from 'ngx-mask';
import {MatProgressSpinnerModule} from '@angular/material/progress-spinner';
import { ERRORS } from '../../../consts/errors';
import { ViacepService } from '../../../../core/services/viacep-service';
import { PatientService } from '../../../services/patient-service';
import { MessageService } from '../../../../core/services/message-service';
import { StorageService } from '../../../../core/services/storage-service';
import { CustomValidators } from '../../../../core/validators/custom.validator';
import { Gender } from '../../../enums/gender';
import { Ufs } from '../../../enums/ufs';

@Component({
  selector: 'app-update-patient-escort-component',
  imports: [CommonModule, FormsModule, ReactiveFormsModule, MatAutocompleteModule, MatDialogModule, MatButtonModule, MatFormFieldModule, MatInputModule, MatIconModule, MatDatepickerModule, MatStepperModule, MatSelectModule, MatSlideToggleModule, MatTooltipModule, NgxMaskDirective, MatProgressSpinnerModule],
  templateUrl: './update-patient-escort-component.html',
  styleUrl: './update-patient-escort-component.scss',
  providers: [{provide: STEPPER_GLOBAL_OPTIONS, useValue: {showError: true}}],
})
export class UpdatePatientEscortComponent implements OnInit {

  data = inject(MAT_DIALOG_DATA)
  errorMessages = ERRORS
  updateEscortPersonalForm: FormGroup
  updateEscortAddressForm: FormGroup
  
  constructor(
    private formBuilder: FormBuilder,
    private viacepService: ViacepService,
    private patientService: PatientService,
    private messageService: MessageService,
    private storageService: StorageService,
    private dialogRef: MatDialogRef<UpdatePatientEscortComponent>,
  ) {
    this.updateEscortPersonalForm = this.formBuilder.group({
      cns: [this.data.escort.cns, [Validators.required, CustomValidators.cnsValidator()],[this.patientService.cnsEscortExistsValidator(this.data.patient_care, this.data.escort.cns)]],
      document: [this.data.escort.document, [Validators.required, CustomValidators.cpfValidator()], [this.patientService.documentEscortExistsValidator(this.data.patient_care, this.data.escort.document)]],
      name: [this.data.escort.name, [Validators.required]],
      relation: [this.data.escort.relation],
      birth_date: [formatDate(this.data.escort.birth_date, 'yyyy-MM-dd', 'en')],
      gender: [this.data.escort.gender, [Validators.required]],
      is_same_address: [this.data.escort.is_same_address, [Validators.required]],
    })
    this.updateEscortAddressForm = this.formBuilder.group({
      cep: [this.data.escort.cep, [Validators.required]],
      address: [this.data.escort.address, [Validators.required]],
      file_address_id: [this.data.escort.file_address_id],
      number: [this.data.escort.number, [Validators.required]],
      complement: [this.data.escort.complement],
      neighborhood: [this.data.escort.neighborhood, [Validators.required]],
      city: [this.data.escort.city],
      state: [this.data.escort.state],
    })
    effect(() => {
      if (this.statusAddress())
        this.updateEscortAddressForm.disable();
      else
        this.updateEscortAddressForm.enable();
    })
  }

  ngOnInit() {
    this.setFilteredUfs()
    this.useSameAddress()
  }

  genders: string[] = Object.values(Gender)

  filteredUfsOptions!: Observable<string[]>;
  ufs: string[] = Object.keys(Ufs)
  setFilteredUfs() {
    this.filteredUfsOptions = this.updateEscortAddressForm.get('state')!.valueChanges.pipe(
      startWith(''),
      map(value => this._filter(this.ufs, value || '')),
    );
  }

  private _filter(options: any, value: string): string[] {
    const filterValue = value.toLowerCase();

    return options.filter((option: any) => option.toLowerCase().includes(filterValue));
  }

  download(archive: number, name: string) {
    this.storageService.download(archive).subscribe({
      next: (response) => {
        saveAs(response.archive,name)
      }
    })
  }

  getAddress() {
    const cep = this.updateEscortAddressForm.get('cep')?.value
    if (cep && cep.length === 8) {
      this.viacepService.getAddress(cep).subscribe({
        next: (response) => {
          this.updateEscortAddressForm.patchValue({
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
    const isSameAddress = this.updateEscortPersonalForm.get('is_same_address')?.value
    this.statusAddress.set(isSameAddress)
    if (isSameAddress) {
      const patientAddress = this.data.patient_care.patient
      this.updateEscortAddressForm.patchValue({
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
    const isSameAddress = this.updateEscortPersonalForm.get('is_same_address')?.value
    if (!isSameAddress)
      this.updateEscortAddressForm.reset()
  }

  labelFileCNS = signal<string>('Nenhum arquivo selecionado');
  fileCNS!:File
  onFileCNSSelected(event: any) {
    this.labelFileCNS.set(event.target.files[0].name)
    this.fileCNS = event.target.files[0]
    this.updateEscortPersonalForm.markAsDirty()
  }

  labelFileDocument = signal<string>('Nenhum arquivo selecionado');
  fileDocument!:File
  onFileDocumentSelected(event: any) {
    this.labelFileDocument.set(event.target.files[0].name)
    this.fileDocument = event.target.files[0]
    this.updateEscortPersonalForm.markAsDirty()
  }

  labelFileAddress = signal<string>('Nenhum arquivo selecionado');
  fileAddress!:File 
  onFileAddressSelected(event: any) {
    this.labelFileAddress.set(event.target.files[0].name)
    this.fileAddress = event.target.files[0]
    this.updateEscortAddressForm.markAsDirty()
  }

  wSubmit = signal<boolean>(false)
  onUpdatePatientEscortSubmit() {
    this.wSubmit.set(true);
    const patientEscortData = {
      ...this.updateEscortPersonalForm.value,
      ...this.updateEscortAddressForm.value,
      file_cns: this.fileCNS,
      file_document: this.fileDocument,
      file_address: this.fileAddress,
    };

    this.patientService.updatePatientEscort(this.data.escort.id, patientEscortData).subscribe({
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
