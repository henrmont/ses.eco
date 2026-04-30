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
import { CommonModule } from '@angular/common';
import { MatSelectChange, MatSelectModule } from '@angular/material/select';
import { ERRORS } from '../../../consts/errors';
import { PatientRequestService } from '../../../services/patient-request-service';
import { MessageService } from '../../../../core/services/message-service';
import { PatientRequestType } from '../../../enums/patient-request-type';

@Component({
  selector: 'app-create-patient-request-component',
  imports: [CommonModule, FormsModule, ReactiveFormsModule, MatDialogModule, MatButtonModule, MatFormFieldModule, MatInputModule, MatAutocompleteModule, MatProgressSpinnerModule, MatDatepickerModule, MatChipsModule, MatSelectModule],
  templateUrl: './create-patient-request-component.html',
  styleUrl: './create-patient-request-component.scss',
})
export class CreatePatientRequestComponent implements OnInit {

  data = inject(MAT_DIALOG_DATA)
  errorMessages = ERRORS
  createPatientRequestForm: FormGroup

  constructor(
    private formBuilder: FormBuilder,
    private patientRequestService: PatientRequestService,
    private messageService: MessageService,
    private dialogRef: MatDialogRef<CreatePatientRequestComponent>,
  ) {
    this.createPatientRequestForm = this.formBuilder.group({
      report_id: [null, [Validators.required]],
      type: [null, [Validators.required]],
      consultation_date: [null],
      hospital_unity_id: [null, [Validators.required]],
      observation: [null, [Validators.required]]
    });
    effect(() => {
      if (this.type()) {
        this.createPatientRequestForm.get('consultation_date')?.disable();
        this.createPatientRequestForm.get('consultation_date')?.setValue(null);
        this.createPatientRequestForm.get('consultation_date')?.clearValidators();
        this.createPatientRequestForm.get('consultation_date')?.updateValueAndValidity();
      } else {
        this.createPatientRequestForm.get('consultation_date')?.enable();
        this.createPatientRequestForm.get('consultation_date')?.setValidators([Validators.required]);
        this.createPatientRequestForm.get('consultation_date')?.updateValueAndValidity();
      }
    })
  }

  ngOnInit() {
    this.getPatients()
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
      this.createPatientRequestForm.patchValue({
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
      this.createPatientRequestForm.patchValue({
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
  onSubmit() {
    this.wSubmit.set(true)
    this.patientRequestService.createPatientRequest(this.createPatientRequestForm.value).subscribe({
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
