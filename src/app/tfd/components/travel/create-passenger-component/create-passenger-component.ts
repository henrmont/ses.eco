import { Component, inject, OnInit, signal } from '@angular/core';
import { FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import {MatFormFieldModule} from '@angular/material/form-field';
import {MatInputModule} from '@angular/material/input';
import {MatSlideToggleModule} from '@angular/material/slide-toggle';
import {MatProgressSpinnerModule} from '@angular/material/progress-spinner';
import { CommonModule } from '@angular/common';
import { ERRORS } from '../../../consts/errors';
import { MessageService } from '../../../../core/services/message-service';
import { MatSelectModule } from '@angular/material/select';
import { TravelService } from '../../../services/travel-service';

@Component({
  selector: 'app-create-passenger-component',
  imports: [CommonModule, FormsModule, ReactiveFormsModule, MatDialogModule, MatButtonModule, MatFormFieldModule, MatInputModule, MatSlideToggleModule, MatProgressSpinnerModule, MatSelectModule],
  templateUrl: './create-passenger-component.html',
  styleUrl: './create-passenger-component.scss',
})
export class CreatePassengerComponent implements OnInit {

  data = inject(MAT_DIALOG_DATA)
  errorMessages = ERRORS
  createReportForm: FormGroup 
  
  constructor(
    private formBuilder: FormBuilder,
    private travelService: TravelService,
    private messageService: MessageService,
    private dialog: MatDialogRef<CreatePassengerComponent>,
  ) {
    this.createReportForm = this.formBuilder.group({
      is_patient: [false, [Validators.required]],
      passenger: [null, [Validators.required]],
      tariff: [null, [Validators.required]],
      tax: [null, [Validators.required]]
    });
  }

  ngOnInit() {
    this.setPassangerOptions()
  }
  
  passengers = signal<any[]>([])
  setPassangerOptions() {
    if (this.createReportForm.get('is_patient')?.value)
      this.passengers.set([this.data.travel.patient_request.report.patient_care.patient])
    else
      this.passengers.set(this.data.travel.patient_request.report.patient_care.escorts)
    this.createReportForm.get('passenger')?.setValue(null);
  }

  wSubmit = signal<boolean>(false)
  onSubmit() {
    this.wSubmit.set(true);
    this.travelService.createPassenger(this.data.travel.id, this.createReportForm.value).subscribe({
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
