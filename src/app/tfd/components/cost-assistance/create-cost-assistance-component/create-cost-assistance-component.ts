import { Component, inject, signal } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import {MatFormFieldModule} from '@angular/material/form-field';
import {MatInputModule} from '@angular/material/input';
import { FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatSelectModule } from '@angular/material/select';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { CostAssistanceService } from '../../../services/cost-assistance-service';
import { MessageService } from '../../../../core/services/message-service';
import { CostAssistanceType } from '../../../enums/cost-assistance-type';
import { ERRORS } from '../../../consts/errors';

@Component({
  selector: 'app-create-cost-assistance-component',
  imports: [FormsModule, ReactiveFormsModule, MatDialogModule, MatButtonModule, MatFormFieldModule, MatInputModule, MatSelectModule, MatProgressSpinnerModule],
  templateUrl: './create-cost-assistance-component.html',
  styleUrl: './create-cost-assistance-component.scss',
})
export class CreateCostAssistanceComponent {

  data = inject(MAT_DIALOG_DATA);
  errorMessages = ERRORS
  createCostAssistanceForm: FormGroup
  
  constructor(
    private formBuilder: FormBuilder,
    private costAssistanceService: CostAssistanceService,
    private messageService: MessageService,
    private dialogRef: MatDialogRef<CreateCostAssistanceComponent>,
  ) {
    this.createCostAssistanceForm = this.formBuilder.group({
      name: [null, Validators.required],
      type: [null, Validators.required],
    });
  }

  types = Object.values(CostAssistanceType)

  wSubmit = signal<boolean>(false);
  onCreateCostAssistanceSubmit() {
    this.wSubmit.set(true);
    this.costAssistanceService.createCostAssistance(this.data.patient_request.id, this.createCostAssistanceForm.value).subscribe({
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
