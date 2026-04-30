import { Component, inject, OnInit, signal } from '@angular/core';
import { FormBuilder, FormControl, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import {MatFormFieldModule} from '@angular/material/form-field';
import {MatInputModule} from '@angular/material/input';
import {MatAutocompleteModule} from '@angular/material/autocomplete';
import {MatProgressSpinnerModule} from '@angular/material/progress-spinner';
import { CommonModule } from '@angular/common';
import { map, Observable, startWith } from 'rxjs';
import { MatChipsModule } from '@angular/material/chips';
import { ERRORS } from '../../../consts/errors';
import { PatientRequestService } from '../../../services/patient-request-service';
import { MessageService } from '../../../../core/services/message-service';

@Component({
  selector: 'app-process-patient-request-component',
  imports: [CommonModule, FormsModule, ReactiveFormsModule, MatDialogModule, MatButtonModule, MatFormFieldModule, MatInputModule, MatAutocompleteModule, MatProgressSpinnerModule, MatChipsModule],
  templateUrl: './process-patient-request-component.html',
  styleUrl: './process-patient-request-component.scss',
})
export class ProcessPatientRequestComponent implements OnInit {

  data = inject(MAT_DIALOG_DATA)
  errorMessages = ERRORS
  tramitPatientRequestForm: FormGroup

  constructor(
    private formBuilder: FormBuilder,
    private patientRequestService: PatientRequestService,
    private messageService: MessageService,
    private dialog: MatDialogRef<ProcessPatientRequestComponent>,
  ) {
    this.tramitPatientRequestForm = this.formBuilder.group({
      medical_professional_id: [null, [Validators.required]],
    });
  }

  ngOnInit(): void {
    this.getMedicalProfessionals()
  }

  getMedicalProfessionals() {
    this.medicalProfessionalLoading.set(true)
    this.patientRequestService.getMedicalProfessionals().subscribe({
      next: (response) => {
        this.medicalProfessionalOptions = response.map((item: any) => {return {...item.patient, ...item}})
        this.setMedicalProfessionalOptions()
      },
      complete: () => {
        this.medicalProfessionalLoading.set(false)
        this.medicalProfessionalReadOnly.set(false)
      }
    })
  }
  medicalProfessionalControl = new FormControl<string | any>('', Validators.required);
  medicalProfessionalOptions!: any[];
  filteredMedicalProfessionalOptions!: Observable<any[]>;
  medicalProfessionalReadOnly = signal<boolean>(true)
  medicalProfessionalLoading = signal<boolean>(false)
  setMedicalProfessionalOptions() {
    this.filteredMedicalProfessionalOptions = this.medicalProfessionalControl.valueChanges.pipe(
      startWith(''),
      map(value => {
        const name = typeof value === 'string' ? value : value?.name;
        return name ? this._filterMedicalProfessional(name as string) : this.medicalProfessionalOptions.slice();
      }),
    );
  }
  onMedicalProfessionalSelected(option: any) {
    if (option && option.id) {
      this.tramitPatientRequestForm.patchValue({
        medical_professional_id: option.id
      });
    }
  }
  private _filterMedicalProfessional(name: string): any[] {
    const filterValue = name.toLowerCase();

    return this.medicalProfessionalOptions.filter(option => option.name.toLowerCase().includes(filterValue));
  }
  displayMedicalProfessional(medicalProfessional: any): string {
    return medicalProfessional && medicalProfessional.name ? medicalProfessional.name : '';
  }

  wSubmit = signal<boolean>(false)
  onTramitPatientRequestSubmit() {
    this.wSubmit.set(true);
    this.patientRequestService.processPatientRequestToMedical(this.data.patient_request.id, this.tramitPatientRequestForm.value).subscribe({
      next: (response: any) => {
        this.messageService.showMessage(response.message)
        this.dialog.close(true)
      },
      error: (err) => {
        this.messageService.showMessage(err.error.message)
        this.wSubmit.set(false);
      },
    })
  }

}
