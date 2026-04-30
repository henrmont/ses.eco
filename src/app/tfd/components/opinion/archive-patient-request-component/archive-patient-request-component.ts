import { Component, inject, signal } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { OpinionService } from '../../../services/opinion-service';
import { MessageService } from '../../../../core/services/message-service';

@Component({
  selector: 'app-archive-patient-request-component',
  imports: [MatDialogModule, MatButtonModule, MatProgressSpinnerModule],
  templateUrl: './archive-patient-request-component.html',
  styleUrl: './archive-patient-request-component.scss',
})
export class ArchivePatientRequestComponent {

  data = inject(MAT_DIALOG_DATA);
  
  constructor(
    private opinionService: OpinionService,
    private messageService: MessageService,
    private dialogRef: MatDialogRef<ArchivePatientRequestComponent>,
  ) {}

  wSubmit = signal<boolean>(false)
  onArchivePatientRequestSubmit() {
    this.wSubmit.set(true)
    this.opinionService.archivePatientRequest(this.data.patient_request.id).subscribe({
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
