import { Component, inject, OnInit, signal } from '@angular/core';
import { FormBuilder, FormControl, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import {MatFormFieldModule} from '@angular/material/form-field';
import {MatInputModule} from '@angular/material/input';
import {MatIconModule} from '@angular/material/icon';
import {MatSlideToggleModule} from '@angular/material/slide-toggle';
import {MatTooltipModule} from '@angular/material/tooltip';
import {MatAutocompleteModule} from '@angular/material/autocomplete';
import {MatProgressSpinnerModule} from '@angular/material/progress-spinner';
import { saveAs } from 'file-saver';
import { map, Observable, startWith } from 'rxjs';
import { CommonModule } from '@angular/common';
import { ERRORS } from '../../../consts/errors';
import { PatientService } from '../../../services/patient-service';
import { MessageService } from '../../../../core/services/message-service';
import { StorageService } from '../../../../core/services/storage-service';

@Component({
  selector: 'app-update-patient-report-component',
  imports: [CommonModule, FormsModule, ReactiveFormsModule, MatDialogModule, MatButtonModule, MatFormFieldModule, MatInputModule, MatIconModule, MatSlideToggleModule, MatTooltipModule, MatAutocompleteModule, MatProgressSpinnerModule],
  templateUrl: './update-patient-report-component.html',
  styleUrl: './update-patient-report-component.scss',
})
export class UpdatePatientReportComponent implements OnInit {

  data = inject(MAT_DIALOG_DATA)
  errorMessages = ERRORS
  updateReportForm: FormGroup 
  
  constructor(
    private formBuilder: FormBuilder,
    private patientService: PatientService,
    private messageService: MessageService,
    private storageService: StorageService,
    private dialogRef: MatDialogRef<UpdatePatientReportComponent>,
  ) {
    this.updateReportForm = this.formBuilder.group({
      protocol: [this.data.report.protocol, [Validators.required]],
      cid_id: [this.data.report.cid_id, [Validators.required]],
      lawsuit: [this.data.report.lawsuit, [Validators.required]],
      diagnosis: [this.data.report.diagnosis, [Validators.required]],
    });
  }

  ngOnInit(): void {
    this.getCids()
  }

  download(archive: number, name: string) {
    this.storageService.download(archive).subscribe({
      next: (response) => {
        saveAs(response.archive,name)
      }
    })
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
    this.patientService.getCids(this.data.report.patient_care.id).subscribe({
      next: (response) => {
        this.cidOptions = response
        this.setCidOptions()
      },
      complete: () => {
        this.cidLoading.set(false)
        this.cidReadOnly.set(false)
        this.cidControl.setValue(this.data.report.cid)
      }
    })
  }

  setCid(cid: any) {
    this.updateReportForm.get('cid_id')?.setValue(cid)
    this.updateReportForm.markAsDirty()
  }

  wSubmit = signal<boolean>(false)
  onSubmit() {
    this.wSubmit.set(true);
    this.patientService.updatePatientReport(this.data.report.id, this.updateReportForm.value).subscribe({
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
