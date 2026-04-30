import { Component, inject, signal } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { PatientRequestService } from '../../../services/patient-request-service';
import { MessageService } from '../../../../core/services/message-service';

@Component({
  selector: 'app-move-patient-request-from-archive-component',
  imports: [MatDialogModule, MatButtonModule, MatProgressSpinnerModule],
  templateUrl: './move-patient-request-from-archive-component.html',
  styleUrl: './move-patient-request-from-archive-component.scss',
})
export class MovePatientRequestFromArchiveComponent {

  data = inject(MAT_DIALOG_DATA);
    
  constructor(
    private patientRequestService: PatientRequestService,
    private messageService: MessageService,
    private dialogRef: MatDialogRef<MovePatientRequestFromArchiveComponent>,
  ) {}

  wSubmit = signal<boolean>(false)
  onMovePatientRequestFromOthersSubmit() {
    this.wSubmit.set(true)
    this.patientRequestService.movePatientRequestFromArchive(this.data.patient_request.id).subscribe({
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
