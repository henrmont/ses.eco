import { Component, effect, inject, OnInit, signal } from '@angular/core';
import { FormBuilder, FormControl, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import {MatFormFieldModule} from '@angular/material/form-field';
import {MatInputModule} from '@angular/material/input';
import {MatAutocompleteModule} from '@angular/material/autocomplete';
import {MatProgressSpinnerModule} from '@angular/material/progress-spinner';
import {MatDatepickerModule} from '@angular/material/datepicker';
import {MatChipsModule} from '@angular/material/chips';
import { map, Observable, startWith } from 'rxjs';
import { CommonModule, formatDate } from '@angular/common';
import { MatSelectChange, MatSelectModule } from '@angular/material/select';
import { ERRORS } from '../../../consts/errors';
import { PatientRequestService } from '../../../services/patient-request-service';
import { MessageService } from '../../../../core/services/message-service';
import { PatientRequestType } from '../../../enums/patient-request-type';

@Component({
  selector: 'app-update-patient-request-component',
  imports: [CommonModule, FormsModule, ReactiveFormsModule, MatDialogModule, MatButtonModule, MatFormFieldModule, MatInputModule, MatAutocompleteModule, MatProgressSpinnerModule, MatDatepickerModule, MatChipsModule, MatSelectModule],
  templateUrl: './update-patient-request-component.html',
  styleUrl: './update-patient-request-component.scss',
})
export class UpdatePatientRequestComponent implements OnInit {

  data = inject(MAT_DIALOG_DATA)
  errorMessages = ERRORS
  updatePatientRequestForm: FormGroup

  constructor(
    private formBuilder: FormBuilder,
    private patientRequestService: PatientRequestService,
    private messageService: MessageService,
    private dialogRef: MatDialogRef<UpdatePatientRequestComponent>,
  ) {
    this.updatePatientRequestForm = this.formBuilder.group({
      report_id: [this.data.patient_request.report_id, [Validators.required]],
      type: [this.data.patient_request.type, [Validators.required]],
      consultation_date: [this.data.patient_request.consultation_date ? formatDate(this.data.patient_request.consultation_date, 'yyyy-MM-dd', 'en') : null],
      hospital_unity_id: [this.data.patient_request.hospital_unity_id, [Validators.required]],
      observation: [this.data.patient_request.observation, [Validators.required]]
    });
    effect(() => {
      if (this.type()) {
        this.updatePatientRequestForm.get('consultation_date')?.disable();
        this.updatePatientRequestForm.get('consultation_date')?.reset();
        this.updatePatientRequestForm.get('consultation_date')?.clearValidators();
        this.updatePatientRequestForm.get('consultation_date')?.updateValueAndValidity();
      } else {
        this.updatePatientRequestForm.get('consultation_date')?.enable();
        this.updatePatientRequestForm.get('consultation_date')?.setValidators([Validators.required]);
        this.updatePatientRequestForm.get('consultation_date')?.updateValueAndValidity();
      }
    })
  }

  ngOnInit() {
    this.setType(this.data.patient_request.type)
    this.getPatients()
    this.getCid(this.data.patient_request.report.patient_care.id)
    this.getHospitalUnities()
  }

  types: any[] = Object.values(PatientRequestType)
  type = signal<boolean>(true)
  onSelection(event: MatSelectChange) {
    this.setType(event.value)
  }
  setType(type: string) {
    if (type === 'Agendamento')
      this.type.set(false)
    else
      this.type.set(true)
  }

  getType() {
    if (this.data.patient_request.type == 'Agendamento')
      return false
    return true
  }

  getPatients() {
    this.patientLoading.set(true)
    this.patientRequestService.getPatients().subscribe({
      next: (response) => {
        this.patientOptions = response
          .filter((patient: any) => patient.status && patient.is_valid)
          .map((item: any) => {return {
            name: item.patient.name,
            ...item
          }})
        this.setPatientOptions()
      },
      complete: () => {
        this.patientLoading.set(false)
        this.patientReadOnly.set(false)
        this.patientControl.setValue(this.data.patient_request.report.patient_care.patient)
        this.cidControl.setValue(this.data.patient_request.report.cid)
        this.hospitalUnitiesControl.setValue(this.data.patient_request.hospital_unity)
      }
    })
  }
  
  patientControl = new FormControl<string | any>('', Validators.required);
  patientOptions!: any[];
  filteredPatientOptions!: Observable<any[]>;
  patientReadOnly = signal<boolean>(true)
  patientLoading = signal<boolean>(false)
  setPatientOptions() {
    this.filteredPatientOptions = this.patientControl.valueChanges.pipe(
      startWith(''),
      map(value => {
        const name = typeof value === 'string' ? value : value?.name;
        return name ? this._filterPatient(name as string) : this.patientOptions.slice();
      }),
    );
  }
  onPatientSelected(option: any) {
    if (option && option.id) {
      this.getCid(option.id)
    }
  }
  private _filterPatient(name: string): any[] {
    const filterValue = name.toLowerCase();

    return this.patientOptions.filter(option => option.name.toLowerCase().includes(filterValue));
  }
  displayPatient(patient: any): string {
    return patient && patient.name ? patient.name : '';
  }

  getCid(patient_care_id: any) {
    this.cidControl.setValue('')
    this.cidLoading.set(true)
    this.patientRequestService.getReports(patient_care_id).subscribe({
      next: (response) => {
        this.cidOptions = response.map((item: any) => {return {...item.cid, ...item}})
        this.setCidOptions()
      },
      complete: () => {
        this.cidLoading.set(false)
        this.cidReadOnly.set(false)
      }
    })
  }
  cidControl = new FormControl<string | any>('', Validators.required);
  cidOptions!: any[];
  filteredCidOptions!: Observable<any[]>;
  cidReadOnly = signal<boolean>(true)
  cidLoading = signal<boolean>(false)
  setCidOptions() {
    this.filteredCidOptions = this.cidControl.valueChanges.pipe(
      startWith(''),
      map(value => {
        const name = typeof value === 'string' ? value : value?.code+' - '+value?.name;
        return name ? this._filterCid(name as string) : this.cidOptions.slice(0,10);
      }),
    );
  }
  onCidSelected(option: any) {
    if (option && option.id) {
      this.updatePatientRequestForm.patchValue({
        report_id: option.id
      });
    }
  }
  private _filterCid(name: string): any[] {
    const filterValue = name.toLowerCase();

    return this.cidOptions.filter(option => option.name.toLowerCase().includes(filterValue) || option.code.toLowerCase().includes(filterValue)).slice(0,10);
  }
  displayCid(cid: any): string {
    return cid && cid.name && cid.code ? cid.code+' - '+cid.name : '';
  }

  getHospitalUnities() {
    this.hospitalUnitiesLoading.set(true)
    this.patientRequestService.getHospitalUnities().subscribe({
      next: (response) => {
        this.hospitalUnitiesOptions = response
        this.setHospitalUnitiesOptions()
      },
      complete: () => {
        this.hospitalUnitiesLoading.set(false)
        this.hospitalUnitiesReadOnly.set(false)
      }
    })
  }
  hospitalUnitiesControl = new FormControl<string | any>('', Validators.required);
  hospitalUnitiesOptions!: any[];
  filteredHospitalUnitiesOptions!: Observable<any[]>;
  hospitalUnitiesReadOnly = signal<boolean>(true)
  hospitalUnitiesLoading = signal<boolean>(false)
  setHospitalUnitiesOptions() {
    this.filteredHospitalUnitiesOptions = this.hospitalUnitiesControl.valueChanges.pipe(
      startWith(''),
      map(value => {
        const name = typeof value === 'string' ? value : value?.name;
        return name ? this._filterHospitalUnities(name as string) : this.hospitalUnitiesOptions.slice();
      }),
    );
  }
  onHospitalUnitySelected(option: any) {
    if (option && option.id) {
      this.updatePatientRequestForm.patchValue({
        hospital_unity_id: option.id
      });
    }
  }
  private _filterHospitalUnities(name: string): any[] {
    const filterValue = name.toLowerCase();

    return this.hospitalUnitiesOptions.filter(option => option.name.toLowerCase().includes(filterValue));
  }
  displayHospitalUnity(hospitalUnity: any): string {
    return hospitalUnity && hospitalUnity.name ? hospitalUnity.name : '';
  }
  
  wSubmit = signal<boolean>(false)
  onUpdatePatientRequestSubmit() {
    this.wSubmit.set(true)
    this.patientRequestService.updatePatientRequest(this.data.patient_request.id, this.updatePatientRequestForm.value).subscribe({
      next: (response: any) => {
        this.messageService.showMessage(response.message)
        this.dialogRef.close(true)
      },
      error: (err) => {
        this.messageService.showMessage(err.error.message)
        this.wSubmit.set(false)
      },
    })
  }

}
