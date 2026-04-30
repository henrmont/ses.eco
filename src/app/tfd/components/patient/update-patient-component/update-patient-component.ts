import { Component, effect, inject, OnInit, signal } from '@angular/core';
import { FormBuilder, FormControl, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import {STEPPER_GLOBAL_OPTIONS} from '@angular/cdk/stepper';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import {MatFormFieldModule} from '@angular/material/form-field';
import {MatInputModule} from '@angular/material/input';
import {MatStepperModule} from '@angular/material/stepper';
import {MatIconModule} from '@angular/material/icon';
import {MatDatepickerInputEvent, MatDatepickerModule} from '@angular/material/datepicker';
import {MatSlideToggleModule} from '@angular/material/slide-toggle';
import {MatAutocompleteModule} from '@angular/material/autocomplete';
import {MatTooltipModule} from '@angular/material/tooltip';
import { map, Observable, startWith } from 'rxjs';
import { CommonModule, formatDate } from '@angular/common';
import { MatSelectChange, MatSelectModule } from '@angular/material/select';
import { saveAs } from 'file-saver';
import { NgxMaskDirective } from 'ngx-mask';
import {MatProgressSpinnerModule} from '@angular/material/progress-spinner';
import { ERRORS } from '../../../consts/errors';
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

@Component({
  selector: 'app-update-patient-component',
  imports: [FormsModule, ReactiveFormsModule, CommonModule, MatSelectModule, MatDialogModule, MatButtonModule, MatFormFieldModule, MatInputModule, MatStepperModule, MatIconModule, MatDatepickerModule, MatSlideToggleModule, MatAutocompleteModule, MatTooltipModule, NgxMaskDirective, MatProgressSpinnerModule],
  templateUrl: './update-patient-component.html',
  styleUrl: './update-patient-component.scss',
  providers: [{provide: STEPPER_GLOBAL_OPTIONS, useValue: {showError: true}}],
})
export class UpdatePatientComponent implements OnInit {

  data = inject(MAT_DIALOG_DATA)
  errorMessages = ERRORS
  updatePatientPersonalForm: FormGroup
  updatePatientAddressForm: FormGroup
  updatePatientIdentificationForm: FormGroup
  updatePatientInfoForm: FormGroup

  constructor(
    private formBuilder: FormBuilder,
    private viacepService: ViacepService,
    private patientService: PatientService,
    private messageService: MessageService,
    private storageService: StorageService,
    private dialogRef: MatDialogRef<UpdatePatientComponent>,
  ) {
    this.updatePatientIdentificationForm = this.formBuilder.group({
      cns: [this.data.patient.cns, [Validators.required, CustomValidators.cnsValidator()],[this.patientService.cnsPatientExistsValidator(this.data.patient.cns)]],
      file_cns_id: [this.data.patient.file_cns_id],
      document_type: [this.data.patient.document_type, [Validators.required]],
      document: [this.data.patient.document, [Validators.required, CustomValidators.cpfOrCnjValidator()], [this.patientService.documentPatientExistsValidator(this.data.patient.document)]],
      file_document_id: [this.data.patient.file_document_id],
      sigadoc: [this.data.patient.sigadoc, [Validators.required]],
    })
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
    })
    this.updatePatientAddressForm = this.formBuilder.group({
      cep: [this.data.patient.cep, [Validators.required, Validators.pattern(/^\d{5}-?\d{3}$/)]],
      address: [this.data.patient.address, [Validators.required]],
      file_address_id: [this.data.patient.file_address_id],
      number: [this.data.patient.number, [Validators.required]],
      complement: [this.data.patient.complement],
      neighborhood: [this.data.patient.neighborhood, [Validators.required]],
      city: [this.data.patient.city],
      state: [this.data.patient.state],
    })
    this.updatePatientInfoForm = this.formBuilder.group({
      control_number: [this.data.patient.patient_info.control_number],
      observation: [this.data.patient.patient_info.observation],
      file_protocol_id: [this.data.patient.patient_info.file_protocol_id],
    })
    effect(() => {
      if (this.ethnicityType()) {
        this.updatePatientPersonalForm.get('ethnicity')?.disable();
        this.updatePatientPersonalForm.get('ethnicity')?.reset();
      } else {
        this.updatePatientPersonalForm.get('ethnicity')?.enable();
      }
    })
  }

  ngOnInit() {
    this.setEthnicityType(this.data.patient.race)
    this.setFilteredProfessions()
    this.setFilteredUfs()
    this.getNaturalness()
  }

  type = signal<boolean>(true)
  setType(type: boolean) {
    this.type.set(type)
  }

  races: any[] = Object.values(Race)
  ethnicityType = signal<boolean>(true);
  onSelection(event: MatSelectChange) {
    this.setEthnicityType(event.value)
  }
  setEthnicityType(type: string) {
    if (type === 'Indígena')
      this.ethnicityType.set(false)
    else
      this.ethnicityType.set(true)
  }

  deficiencies: string[] = Object.values(Deficiency)
  marital_status: string[] = Object.values(MaritalStatus)
  genders: string[] = Object.values(Gender)
  ethnicities: string[] = Object.values(Ethnicity)

  setBirthDate(event: MatDatepickerInputEvent<Date>) {
    this.updatePatientPersonalForm.get('birth_date')?.setValue(event.value);
    this.updatePatientPersonalForm.markAsDirty();
  }

  getNaturalness() {
    this.naturalnessControl.setValue('')
    this.naturalnessLoading.set(true)
    this.viacepService.getNaturalness().subscribe({
      next: (response) => {
        this.naturalnessOptions = response.map((item: any) => item.nome)
        this.setNaturalnessOptions()
      },
      complete: () => {
        this.naturalnessLoading.set(false)
        this.naturalnessReadOnly.set(false)
        this.naturalnessControl.setValue(this.data.patient.naturalness)
      }
    })
  }
  naturalnessControl = new FormControl<string | any>('', Validators.required);
  naturalnessOptions!: any[];
  filteredNaturalnessOptions!: Observable<any[]>;
  naturalnessReadOnly = signal<boolean>(true)
  naturalnessLoading = signal<boolean>(false)
  setNaturalnessOptions() {
    this.filteredNaturalnessOptions = this.naturalnessControl.valueChanges.pipe(
      startWith(''),
      map(value => {
        const name = typeof value === 'string' ? value : value;
        return name ? this._filterNaturalness(name as string) : this.naturalnessOptions.slice(0,10);
      }),
    );
  }
  onNaturalnessSelected(option: any) {
    this.updatePatientPersonalForm.patchValue({
      naturalness: option
    });
    this.updatePatientPersonalForm.markAsDirty();
  }
  private _filterNaturalness(name: string): any[] {
    const filterValue = name.toLowerCase();

    return this.naturalnessOptions.filter(option => option.toLowerCase().includes(filterValue)).slice(0,10);
  }
  displayNaturalness(naturalness: any): string {
    return naturalness && naturalness ? naturalness : '';
  }

  filteredProfessionsOptions!: Observable<string[]>;
  professions: string[] = Object.values(Profession)
  setFilteredProfessions() {
    this.filteredProfessionsOptions = this.updatePatientPersonalForm.get('profession')!.valueChanges.pipe(
      startWith(''),
      map(value => this._filter(this.professions, value || '')),
    );
  }

  filteredUfsOptions!: Observable<string[]>;
  ufs: string[] = Object.keys(Ufs)
  setFilteredUfs() {
    this.filteredUfsOptions = this.updatePatientAddressForm.get('state')!.valueChanges.pipe(
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
    const cep = this.updatePatientAddressForm.get('cep')?.value
    if (cep && cep.length === 8) {
      this.viacepService.getAddress(cep).subscribe({
        next: (response) => {
          this.updatePatientAddressForm.patchValue({
            address: response.logradouro,
            neighborhood: response.bairro,
            city: response.localidade,
            state: response.uf,
          })
        }
      })
    }
  }

  labelFileCNS = signal<string>('Nenhum arquivo selecionado');
  fileCNS!:File
  onFileCNSSelected(event: any) {
    this.labelFileCNS.set(event.target.files[0].name)
    this.fileCNS = event.target.files[0]
    this.updatePatientIdentificationForm.markAsDirty();
  }

  labelFileDocument = signal<string>('Nenhum arquivo selecionado');
  fileDocument!:File
  onFileDocumentSelected(event: any) {
    this.labelFileDocument.set(event.target.files[0].name)
    this.fileDocument = event.target.files[0]
    this.updatePatientIdentificationForm.markAsDirty();
  }

  labelFileDeficiency = signal<string>('Nenhum arquivo selecionado');
  fileDeficiency!:File
  onFileDeficiencySelected(event: any) {
    this.labelFileDeficiency.set(event.target.files[0].name)
    this.fileDeficiency = event.target.files[0]
    this.updatePatientPersonalForm.markAsDirty();
  }

  labelFileAddress = signal<string>('Nenhum arquivo selecionado');
  fileAddress!:File
  onFileAddressSelected(event: any) {
    this.labelFileAddress.set(event.target.files[0].name)
    this.fileAddress = event.target.files[0]
    this.updatePatientAddressForm.markAsDirty();
  }

  labelFileProtocol = signal<string>('Nenhum arquivo selecionado');
  fileProtocol!:File
  onFileProtocolSelected(event: any) {
    this.labelFileProtocol.set(event.target.files[0].name)
    this.fileProtocol = event.target.files[0]
    this.updatePatientInfoForm.markAsDirty();
  }

  wSubmit = signal<boolean>(false)
  onUpdatePatientSubmit() {
    this.wSubmit.set(true);
    const patientData = {
      ...this.updatePatientIdentificationForm.value,
      ...this.updatePatientPersonalForm.value,
      ...this.updatePatientAddressForm.value,
      ...this.updatePatientInfoForm.value,
      file_cns: this.fileCNS,
      file_document: this.fileDocument,
      file_deficiency: this.fileDeficiency,
      file_address: this.fileAddress,
      file_protocol: this.fileProtocol,
    };

    this.patientService.updatePatient(this.data.patient.id, patientData).subscribe({
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
