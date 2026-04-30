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
import { AccountabilityService } from '../../../services/accountability-service';

@Component({
  selector: 'app-update-accountability-daily-component',
  imports: [FormsModule, ReactiveFormsModule, MatDialogModule, MatButtonModule, MatFormFieldModule, MatInputModule, MatSelectModule, MatProgressSpinnerModule],
  templateUrl: './update-accountability-daily-component.html',
  styleUrl: './update-accountability-daily-component.scss',
})
export class UpdateAccountabilityDailyComponent implements OnInit {

  data = inject(MAT_DIALOG_DATA);
  errorMessages = ERRORS;
  createCostAssistanceDailyForm: FormGroup
  
  constructor(
    private formBuilder: FormBuilder,
    private accountabilityService: AccountabilityService,
    private messageService: MessageService,
    private dialogRef: MatDialogRef<UpdateAccountabilityDailyComponent>,
  ) {
    this.createCostAssistanceDailyForm = this.formBuilder.group({
      daily_cost_id: [this.data.accountability_daily.daily_cost_id, Validators.required],
      amount: [this.data.accountability_daily.amount, Validators.required],
    });
  }

  ngOnInit() {
    this.getDailyCosts()
  }

  dailyCostsOptions!: DailyCost[];
  getDailyCosts() {
    this.accountabilityService.getDailyCosts().subscribe({
      next: (response) => {
        this.dailyCostsOptions = response
      },
    })
  }

  wSubmit = signal<boolean>(false);
  onCreateCostAssistanceDailySubmit() {
    this.wSubmit.set(true);
    this.accountabilityService.updateAccountabilityDaily(this.data.accountability_daily.id, this.createCostAssistanceDailyForm.value).subscribe({
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
