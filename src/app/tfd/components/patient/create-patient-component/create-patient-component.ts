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
import { CommonModule } from '@angular/common';
import { MatSelectChange, MatSelectModule } from '@angular/material/select';
import { NgxMaskDirective } from 'ngx-mask';
import {MatProgressSpinnerModule} from '@angular/material/progress-spinner';
import { ERRORS } from '../../../consts/errors';
import { ViacepService } from '../../../../core/services/viacep-service';
import { PatientService } from '../../../services/patient-service';
import { MessageService } from '../../../../core/services/message-service';
import { CustomValidators } from '../../../../core/validators/custom.validator';
import { Deficiency } from '../../../enums/deficiency';
import { MaritalStatus } from '../../../enums/marital-status';
import { Gender } from '../../../enums/gender';
import { Profession } from '../../../enums/profession';
import { Ufs } from '../../../enums/ufs';
import { Ethnicity } from '../../../enums/ethnicity';
import { Race } from '../../../enums/race';

@Component({
  selector: 'app-create-patient-component',
  imports: [FormsModule, ReactiveFormsModule, CommonModule, MatSelectModule, MatDialogModule, MatButtonModule, MatFormFieldModule, MatInputModule, MatStepperModule, MatIconModule, MatDatepickerModule, MatSlideToggleModule, MatAutocompleteModule, MatTooltipModule, NgxMaskDirective, MatProgressSpinnerModule],
  templateUrl: './create-patient-component.html',
  styleUrl: './create-patient-component.scss',
  providers: [{provide: STEPPER_GLOBAL_OPTIONS, useValue: {showError: true}}],
})
export class CreatePatientComponent implements OnInit {

  data = inject(MAT_DIALOG_DATA)
  errorMessages = ERRORS
  createPatientPersonalForm: FormGroup
  createPatientAddressForm: FormGroup
  createPatientIdentificationForm: FormGroup
  createPatientInfoForm: FormGroup

  constructor(
    private formBuilder: FormBuilder,
    private viacepService: ViacepService,
    private patientService: PatientService,
    private messageService: MessageService,
    private dialogRef: MatDialogRef<CreatePatientComponent>,
  ) {
    this.createPatientIdentificationForm = this.formBuilder.group({
      cns: [null, [Validators.required, CustomValidators.cnsValidator()],[this.patientService.cnsPatientExistsValidator(null)]],
      document_type: [null, [Validators.required]],
      document: [null, [Validators.required, CustomValidators.cpfOrCnjValidator()], [this.patientService.documentPatientExistsValidator(null)]],
      sigadoc: [null, [Validators.required]],
    })
    this.createPatientPersonalForm = this.formBuilder.group({
      name: [null, [Validators.required]],
      birth_date: [null, [Validators.required]],
      gender: [null, [Validators.required]],
      newborn: [false],
      race: [null, [Validators.required]],
      ethnicity: [null],
      marital_status: [null],
      mother_name: [null],
      father_name: [null],
      naturalness: [null, [Validators.required]],
      phone: [null],
      cell_phone: [null],
      email: [null],
      profession: [null],
      deficiency: [null],
    })
    this.createPatientAddressForm = this.formBuilder.group({
      cep: [null, [Validators.required, Validators.pattern(/^\d{5}-?\d{3}$/)]],
      address: [null, [Validators.required]],
      number: [null, [Validators.required]],
      complement: [null],
      neighborhood: [null, [Validators.required]],
      city: [null],
      state: [null],
    })
    this.createPatientInfoForm = this.formBuilder.group({
      control_number: [null],
      observation: [null],
    })
    effect(() => {
      if (this.ethnicityType()) {
        this.createPatientPersonalForm.get('ethnicity')?.disable();
        this.createPatientPersonalForm.get('ethnicity')?.reset();
      } else {
        this.createPatientPersonalForm.get('ethnicity')?.enable();
      }
    })
  }

  ngOnInit() {
    this.setFilteredProfessions()
    this.setFilteredUfs()
    this.getNaturalness()
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
    this.createPatientPersonalForm.get('birth_date')?.setValue(event.value);
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
    this.createPatientPersonalForm.patchValue({
      naturalness: option
    });
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
    this.filteredProfessionsOptions = this.createPatientPersonalForm.get('profession')!.valueChanges.pipe(
      startWith(''),
      map(value => this._filter(this.professions, value || '')),
    );
  }

  filteredUfsOptions!: Observable<string[]>;
  ufs: string[] = Object.keys(Ufs)
  setFilteredUfs() {
    this.filteredUfsOptions = this.createPatientAddressForm.get('state')!.valueChanges.pipe(
      startWith(''),
      map(value => this._filter(this.ufs, value || '')),
    );
  }

  private _filter(options: any, value: string): string[] {
    const filterValue = value.toLowerCase();

    return options.filter((option: any) => option.toLowerCase().includes(filterValue));
  }

  getAddress() {
    const cep = this.createPatientAddressForm.get('cep')?.value
    if (cep && cep.length === 8) {
      this.viacepService.getAddress(cep).subscribe({
        next: (response) => {
          this.createPatientAddressForm.patchValue({
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
  }

  labelFileDocument = signal<string>('Nenhum arquivo selecionado');
  fileDocument!:File
  onFileDocumentSelected(event: any) {
    this.labelFileDocument.set(event.target.files[0].name)
    this.fileDocument = event.target.files[0]
  }

  labelFileDeficiency = signal<string>('Nenhum arquivo selecionado');
  fileDeficiency!:File
  onFileDeficiencySelected(event: any) {
    this.labelFileDeficiency.set(event.target.files[0].name)
    this.fileDeficiency = event.target.files[0]
  }

  labelFileAddress = signal<string>('Nenhum arquivo selecionado');
  fileAddress!:File 
  onFileAddressSelected(event: any) {
    this.labelFileAddress.set(event.target.files[0].name)
    this.fileAddress = event.target.files[0]
  }

  labelFileProtocol = signal<string>('Nenhum arquivo selecionado');
  fileProtocol!:File
  onFileProtocolSelected(event: any) {
    this.labelFileProtocol.set(event.target.files[0].name)
    this.fileProtocol = event.target.files[0]
  }

  wSubmit = signal<boolean>(false)
  onCreatePatientSubmit() {
    this.wSubmit.set(true)
    const patientData = {
      ...this.createPatientIdentificationForm.value,
      ...this.createPatientPersonalForm.value,
      ...this.createPatientAddressForm.value,
      ...this.createPatientInfoForm.value,
      file_cns: this.fileCNS,
      file_document: this.fileDocument,
      file_deficiency: this.fileDeficiency,
      file_address: this.fileAddress,
      file_protocol: this.fileProtocol,
    };

    this.patientService.createPatient(patientData).subscribe({
      next: (response: any) => {
        this.messageService.showMessage(response.message);
        this.dialogRef.close(true);
      },
      error: (err) => {
        this.messageService.showMessage(err.error.message);
        this.wSubmit.set(false)
      }
    });
  }

}
