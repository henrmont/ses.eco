import { Component, inject, signal } from '@angular/core';
import { FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import {MatFormFieldModule} from '@angular/material/form-field';
import {MatInputModule} from '@angular/material/input';
import { CommonModule } from '@angular/common';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MessageService } from '../../../../core/services/message-service';
import { PaymentService } from '../../../services/payment-service';

@Component({
  selector: 'app-payment-info-component',
  imports: [CommonModule, FormsModule, ReactiveFormsModule, MatDialogModule, MatButtonModule, MatFormFieldModule, MatInputModule, MatProgressSpinnerModule],
  templateUrl: './payment-info-component.html',
  styleUrl: './payment-info-component.scss',
})
export class PaymentInfoComponent {

  data = inject(MAT_DIALOG_DATA)
  undoPatientRequestForm: FormGroup

  constructor(
    private formBuilder: FormBuilder,
    private paymentService: PaymentService,
    private messageService: MessageService,
    private dialogRef: MatDialogRef<PaymentInfoComponent>,
  ) {
    this.undoPatientRequestForm = this.formBuilder.group({
      old: [this.data.patient_request.payment_info ? this.data.patient_request.payment_info.description : null],
      description: [this.data.patient_request.payment_info ? this.data.patient_request.payment_info.description : null],
    });
  }

  wSubmit = signal<boolean>(false)
  onUndoPatientRequestSubmit() {
    this.wSubmit.set(true);
    this.paymentService.paymentInfo(this.data.patient_request.id, this.undoPatientRequestForm.value).subscribe({
      next: (response: any) => {
        this.messageService.showMessage(response.message)
        this.dialogRef.close(true)
      },
      error: (err) => {
        this.messageService.showMessage(err.error.message)
        this.wSubmit.set(false);
      },
    })
  }

}
