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
  selector: 'app-update-cost-assistance-component',
  imports: [FormsModule, ReactiveFormsModule, MatDialogModule, MatButtonModule, MatFormFieldModule, MatInputModule, MatSelectModule, MatProgressSpinnerModule],
  templateUrl: './update-cost-assistance-component.html',
  styleUrl: './update-cost-assistance-component.scss',
})
export class UpdateCostAssistanceComponent {

  data = inject(MAT_DIALOG_DATA);
  errorMessages = ERRORS
  createCostAssistanceForm: FormGroup
  
  constructor(
    private formBuilder: FormBuilder,
    private costAssistanceService: CostAssistanceService,
    private messageService: MessageService,
    private dialogRef: MatDialogRef<UpdateCostAssistanceComponent>,
  ) {
    this.createCostAssistanceForm = this.formBuilder.group({
      name: [this.data.cost_assistance.name, Validators.required],
      type: [this.data.cost_assistance.type, Validators.required],
    });
  }

  types = Object.values(CostAssistanceType)

  wSubmit = signal<boolean>(false);
  onCreateCostAssistanceSubmit() {
    this.wSubmit.set(true);
    this.costAssistanceService.updateCostAssistance(this.data.cost_assistance.id, this.createCostAssistanceForm.value).subscribe({
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
