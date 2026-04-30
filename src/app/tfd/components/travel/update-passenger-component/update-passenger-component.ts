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
  selector: 'app-update-passenger-component',
  imports: [CommonModule, FormsModule, ReactiveFormsModule, MatDialogModule, MatButtonModule, MatFormFieldModule, MatInputModule, MatSlideToggleModule, MatProgressSpinnerModule, MatSelectModule],
  templateUrl: './update-passenger-component.html',
  styleUrl: './update-passenger-component.scss',
})
export class UpdatePassengerComponent {

  data = inject(MAT_DIALOG_DATA)
  errorMessages = ERRORS
  createReportForm: FormGroup 
  
  constructor(
    private formBuilder: FormBuilder,
    private travelService: TravelService,
    private messageService: MessageService,
    private dialog: MatDialogRef<UpdatePassengerComponent>,
  ) {
    this.createReportForm = this.formBuilder.group({
      tariff: [this.data.passenger.tariff, [Validators.required]],
      tax: [this.data.passenger.tax, [Validators.required]]
    });
  }

  wSubmit = signal<boolean>(false)
  onSubmit() {
    this.wSubmit.set(true);
    this.travelService.updatePassenger(this.data.passenger.id, this.createReportForm.value).subscribe({
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
