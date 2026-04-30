import { Component, inject, signal } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import {MatFormFieldModule} from '@angular/material/form-field';
import {MatInputModule} from '@angular/material/input';
import { FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MessageService } from '../../../../core/services/message-service';
import { AccountabilityService } from '../../../services/accountability-service';
import { ERRORS } from '../../../consts/errors';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-create-accountability-component',
  imports: [CommonModule, FormsModule, ReactiveFormsModule, MatDialogModule, MatButtonModule, MatFormFieldModule, MatInputModule, MatProgressSpinnerModule],
  templateUrl: './create-accountability-component.html',
  styleUrl: './create-accountability-component.scss',
})
export class CreateAccountabilityComponent {

  data = inject(MAT_DIALOG_DATA);
  errorMessages = ERRORS
  createCostAssistanceForm: FormGroup
  
  constructor(
    private formBuilder: FormBuilder,
    private accountabilityService: AccountabilityService,
    private messageService: MessageService,
    private dialogRef: MatDialogRef<CreateAccountabilityComponent>,
  ) {
    this.createCostAssistanceForm = this.formBuilder.group({
      name: [null, Validators.required],
    });
  }

  wSubmit = signal<boolean>(false);
  onCreateCostAssistanceSubmit() {
    this.wSubmit.set(true);
    this.accountabilityService.createAccountability(this.data.patient_request.id, this.createCostAssistanceForm.value).subscribe({
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
