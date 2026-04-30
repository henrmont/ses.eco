import { Component, inject, OnInit, signal } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import {MatFormFieldModule} from '@angular/material/form-field';
import {MatInputModule} from '@angular/material/input';
import { FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatSelectModule } from '@angular/material/select';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MessageService } from '../../../../core/services/message-service';
import { DailyCost } from '../../../models/daily-cost';
import { ERRORS } from '../../../consts/errors';
import { AccountabilityService } from '../../../services/accountability-service';

@Component({
  selector: 'app-create-accountability-daily-component',
  imports: [FormsModule, ReactiveFormsModule, MatDialogModule, MatButtonModule, MatFormFieldModule, MatInputModule, MatSelectModule, MatProgressSpinnerModule],
  templateUrl: './create-accountability-daily-component.html',
  styleUrl: './create-accountability-daily-component.scss',
})
export class CreateAccountabilityDailyComponent implements OnInit {

  data = inject(MAT_DIALOG_DATA);
  errorMessages = ERRORS;
  createCostAssistanceDailyForm: FormGroup
  
  constructor(
    private formBuilder: FormBuilder,
    private accountabilityService: AccountabilityService,
    private messageService: MessageService,
    private dialogRef: MatDialogRef<CreateAccountabilityDailyComponent>,
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
    this.accountabilityService.getDailyCosts().subscribe({
      next: (response) => {
        this.dailyCostsOptions = response
      },
    })
  }

  wSubmit = signal<boolean>(false);
  onCreateCostAssistanceDailySubmit() {
    this.wSubmit.set(true);
    this.accountabilityService.createAccountabilityDaily(this.data.accountability.id, this.createCostAssistanceDailyForm.value).subscribe({
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
