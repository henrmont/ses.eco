import { Component, inject, signal } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MessageService } from '../../../../core/services/message-service';
import { PaymentService } from '../../../services/payment-service';
import { AccountabilityService } from '../../../services/accountability-service';

@Component({
  selector: 'app-finish-patient-request-accountability-component',
  imports: [MatDialogModule, MatButtonModule, MatProgressSpinnerModule],
  templateUrl: './finish-patient-request-accountability-component.html',
  styleUrl: './finish-patient-request-accountability-component.scss',
})
export class FinishPatientRequestAccountabilityComponent {

  data = inject(MAT_DIALOG_DATA);
    
  constructor(
    private accountabilityService: AccountabilityService,
    private messageService: MessageService,
    private dialogRef: MatDialogRef<FinishPatientRequestAccountabilityComponent>,
  ) {}

  wSubmit = signal<boolean>(false)
  onDeletePatientRequestSubmit() {
    this.wSubmit.set(true)
    this.accountabilityService.finishPatientRequestAccountability(this.data.patient_request.id).subscribe({
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
