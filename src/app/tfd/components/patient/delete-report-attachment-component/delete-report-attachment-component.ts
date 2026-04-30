import { Component, inject, signal } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { PatientService } from '../../../services/patient-service';
import { MessageService } from '../../../../core/services/message-service';

@Component({
  selector: 'app-delete-report-attachment-component',
  imports: [MatDialogModule, MatButtonModule, MatProgressSpinnerModule],
  templateUrl: './delete-report-attachment-component.html',
  styleUrl: './delete-report-attachment-component.scss',
})
export class DeleteReportAttachmentComponent {

  data = inject(MAT_DIALOG_DATA);
  
  constructor(
    private patientService: PatientService,
    private messageService: MessageService,
    private dialogRef: MatDialogRef<DeleteReportAttachmentComponent>,
  ) {}

  wSubmit = signal<boolean>(false)
  onDeletePatientReportAttachmentSubmit() {
    this.wSubmit.set(true)
    this.patientService.deleteReportAttachment(this.data.report_attachment.id).subscribe({
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
