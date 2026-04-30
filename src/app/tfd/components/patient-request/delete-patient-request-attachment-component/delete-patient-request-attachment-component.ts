import { Component, inject, signal } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { PatientRequestService } from '../../../services/patient-request-service';
import { MessageService } from '../../../../core/services/message-service';

@Component({
  selector: 'app-delete-patient-request-attachment-component',
  imports: [MatDialogModule, MatButtonModule, MatProgressSpinnerModule],
  templateUrl: './delete-patient-request-attachment-component.html',
  styleUrl: './delete-patient-request-attachment-component.scss',
})
export class DeletePatientRequestAttachmentComponent {

  data = inject(MAT_DIALOG_DATA);
  
  constructor(
    private patientRequestService: PatientRequestService,
    private messageService: MessageService,
    private dialogRef: MatDialogRef<DeletePatientRequestAttachmentComponent>,
  ) {}

  wSubmit = signal<boolean>(false)
  onDeletePatientReportAttachmentSubmit() {
    this.wSubmit.set(true)
    this.patientRequestService.deletePatientRequestAttachment(this.data.patient_request_attachment.id).subscribe({
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
