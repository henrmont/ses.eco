import { Component, inject, OnInit, signal } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import {MatFormFieldModule} from '@angular/material/form-field';
import {MatInputModule} from '@angular/material/input';
import { FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatSelectModule } from '@angular/material/select';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { CostAssistanceService } from '../../../services/cost-assistance-service';
import { MessageService } from '../../../../core/services/message-service';
import { DailyCost } from '../../../models/daily-cost';
import { ERRORS } from '../../../consts/errors';

@Component({
  selector: 'app-create-cost-assistance-daily-component',
  imports: [FormsModule, ReactiveFormsModule, MatDialogModule, MatButtonModule, MatFormFieldModule, MatInputModule, MatSelectModule, MatProgressSpinnerModule],
  templateUrl: './create-cost-assistance-daily-component.html',
  styleUrl: './create-cost-assistance-daily-component.scss',
})
export class CreateCostAssistanceDailyComponent implements OnInit {

  data = inject(MAT_DIALOG_DATA);
  errorMessages = ERRORS;
  createCostAssistanceDailyForm: FormGroup
  
  constructor(
    private formBuilder: FormBuilder,
    private costAssistanceService: CostAssistanceService,
    private messageService: MessageService,
    private dialogRef: MatDialogRef<CreateCostAssistanceDailyComponent>,
  ) {
    this.createCostAssistanceDailyForm = this.formBuilder.group({
      daily_cost_id: [null, Validators.required],
      amount: [null, Validators.required],
    });
  }

  ngOnInit() {
    this.getDailyCosts()
  }

  dailyCostsOptions!: DailyCost[];
  getDailyCosts() {
    this.costAssistanceService.getDailyCosts().subscribe({
      next: (response) => {
        this.dailyCostsOptions = response
      },
    })
  }

  wSubmit = signal<boolean>(false);
  onCreateCostAssistanceDailySubmit() {
    this.wSubmit.set(true);
    this.costAssistanceService.createCostAssistanceDaily(this.data.cost_assistance.id, this.createCostAssistanceDailyForm.value).subscribe({
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
