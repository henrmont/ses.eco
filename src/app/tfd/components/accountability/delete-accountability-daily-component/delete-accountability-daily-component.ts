import { Component, inject, signal } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MessageService } from '../../../../core/services/message-service';
import { AccountabilityService } from '../../../services/accountability-service';

@Component({
  selector: 'app-delete-accountability-daily-component',
  imports: [MatButtonModule, MatDialogModule, MatProgressSpinnerModule],
  templateUrl: './delete-accountability-daily-component.html',
  styleUrl: './delete-accountability-daily-component.scss',
})
export class DeleteAccountabilityDailyComponent {

  data = inject(MAT_DIALOG_DATA);
    
  constructor(
    private accountabilityService: AccountabilityService,
    private messageService: MessageService,
    private dialogRef: MatDialogRef<DeleteAccountabilityDailyComponent>,
  ) {}

  wSubmit = signal<boolean>(false)
  onSubmit() {
    this.wSubmit.set(true)
    this.accountabilityService.deleteAccountabilityDaily(this.data.accountability_daily.id).subscribe({
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
