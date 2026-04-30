import { Component, inject, signal } from '@angular/core';
import { FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import {MatFormFieldModule} from '@angular/material/form-field';
import {MatInputModule} from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { CommonModule } from '@angular/common';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { ERRORS } from '../../../consts/errors';
import { MessageService } from '../../../../core/services/message-service';
import { PaymentService } from '../../../services/payment-service';

@Component({
  selector: 'app-undo-patient-request-component',
  imports: [CommonModule, FormsModule, ReactiveFormsModule, MatDialogModule, MatButtonModule, MatFormFieldModule, MatInputModule, MatSelectModule, MatProgressSpinnerModule],
  templateUrl: './undo-patient-request-component.html',
  styleUrl: './undo-patient-request-component.scss',
})
export class UndoPatientRequestComponent {

  data = inject(MAT_DIALOG_DATA)
  errorMessages = ERRORS
  undoPatientRequestForm: FormGroup

  constructor(
    private formBuilder: FormBuilder,
    private paymentService: PaymentService,
    private messageService: MessageService,
    private dialogRef: MatDialogRef<UndoPatientRequestComponent>,
  ) {
    this.undoPatientRequestForm = this.formBuilder.group({
      reason: [null, [Validators.required]],
      to: [null, [Validators.required]]
    });
  }

  wSubmit = signal<boolean>(false)
  onUndoPatientRequestSubmit() {
    this.wSubmit.set(true);
    this.paymentService.undoPatientRequest(this.data.patient_request.id, this.undoPatientRequestForm.value).subscribe({
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
