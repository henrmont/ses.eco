import { Component, inject, OnInit, signal } from '@angular/core';
import { FormBuilder, FormControl, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import {MatFormFieldModule} from '@angular/material/form-field';
import {MatInputModule} from '@angular/material/input';
import {MatIconModule} from '@angular/material/icon';
import {MatSlideToggleModule} from '@angular/material/slide-toggle';
import {MatTooltipModule} from '@angular/material/tooltip';
import {MatProgressSpinnerModule} from '@angular/material/progress-spinner';
import {MatAutocompleteModule} from '@angular/material/autocomplete';
import { map, Observable, startWith } from 'rxjs';
import { CommonModule } from '@angular/common';
import { ERRORS } from '../../../consts/errors';
import { PatientService } from '../../../services/patient-service';
import { MessageService } from '../../../../core/services/message-service';

@Component({
  selector: 'app-create-patient-report-component',
  imports: [CommonModule, FormsModule, ReactiveFormsModule, MatDialogModule, MatButtonModule, MatFormFieldModule, MatInputModule, MatIconModule, MatSlideToggleModule, MatTooltipModule, MatProgressSpinnerModule, MatAutocompleteModule],
  templateUrl: './create-patient-report-component.html',
  styleUrl: './create-patient-report-component.scss',
})
export class CreatePatientReportComponent implements OnInit {

  data = inject(MAT_DIALOG_DATA)
  errorMessages = ERRORS
  createReportForm: FormGroup 
  
  constructor(
    private formBuilder: FormBuilder,
    private patientService: PatientService,
    private messageService: MessageService,
    private dialog: MatDialogRef<CreatePatientReportComponent>,
  ) {
    this.createReportForm = this.formBuilder.group({
      protocol: [null, [Validators.required]],
      cid_id: [null, [Validators.required]],
      lawsuit: [false, [Validators.required]],
      diagnosis: [null, [Validators.required]],
    });
  }

  ngOnInit() {
    this.getCids()
  }

  cidControl = new FormControl<string | any>('');
  cidOptions!: any[];
  filteredCidOptions!: Observable<any[]>;
  cidReadOnly = signal<boolean>(true)
  cidLoading = signal<boolean>(false)
  setCidOptions() {
    this.filteredCidOptions = this.cidControl.valueChanges.pipe(
      startWith(''),
      map(value => {
        const name = typeof value === 'string' ? value : value?.code+' - '+value.name;
        return name ? this._filterCid(name as string) : this.cidOptions.slice(0,10);
      }),
    );
  }
  private _filterCid(name: string): any[] {
    const filterValue = name.toLowerCase();

    return this.cidOptions.filter(option => option.name.toLowerCase().includes(filterValue) || option.code.toLowerCase().includes(filterValue)).slice(0,10);
  }
  displayCid(cid: any): string {
    return cid && cid.name && cid.code ? cid.code+' - '+cid.name : '';
  }

  getCids() {
    this.cidLoading.set(true)
    this.patientService.getCids(this.data.patient_care.id).subscribe({
      next: (response) => {
        this.cidOptions = response
        this.setCidOptions()
      },
      complete: () => {
        this.cidLoading.set(false)
        this.cidReadOnly.set(false)
      }
    })
  }

  setCid(cid: any) {
    this.createReportForm.get('cid_id')?.setValue(cid)
  }

  wSubmit = signal<boolean>(false)
  onSubmit() {
    this.wSubmit.set(true);
    this.patientService.createPatientReport(this.data.patient_care.id, this.createReportForm.value).subscribe({
      next: (response: any) => {
        this.messageService.showMessage(response.message);
        this.dialog.close(true);
      },
      error: (err) => {
        this.messageService.showMessage(err.error.message);
        this.wSubmit.set(false);
      }
    });
  }

}
