import { Component, inject, signal } from '@angular/core';
import { FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import {MatFormFieldModule} from '@angular/material/form-field';
import {MatInputModule} from '@angular/material/input';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { NgxMaskDirective } from 'ngx-mask';
import { SettingService } from '../../../services/setting-service';
import { MessageService } from '../../../../core/services/message-service';

@Component({
  selector: 'app-update-daily-cost-component',
  imports: [FormsModule, ReactiveFormsModule, MatDialogModule, MatButtonModule, MatFormFieldModule, MatInputModule, MatProgressSpinnerModule, NgxMaskDirective],
  templateUrl: './update-daily-cost-component.html',
  styleUrl: './update-daily-cost-component.scss',
})
export class UpdateDailyCostComponent {

  data = inject(MAT_DIALOG_DATA)
  updateDailyCostForm: FormGroup

  constructor(
    private formBuilder: FormBuilder,
    private settingService: SettingService,
    private messageService: MessageService,
    private dialogRef: MatDialogRef<UpdateDailyCostComponent>,
  ) {
    this.updateDailyCostForm = this.formBuilder.group({
      value: [this.data.daily_cost.value, Validators.required],
    });
  }

  wSubmit = signal<boolean>(false)
  onUpdateDailyCostSubmit() {
    this.wSubmit.set(true)
    this.settingService.updateDailyCost(this.data.daily_cost.id, this.updateDailyCostForm.value).subscribe({
      next: (response: any) => {
        this.messageService.showMessage(response.message)
        this.dialogRef.close(true)
      },
      error: (err) => {
        this.messageService.showMessage(err.error.message)
        this.wSubmit.set(false)
      },
    })
  }

}
