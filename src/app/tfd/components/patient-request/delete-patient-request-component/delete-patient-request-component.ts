import { Component, inject, signal } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { PatientRequestService } from '../../../services/patient-request-service';
import { MessageService } from '../../../../core/services/message-service';

@Component({
  selector: 'app-delete-patient-request-component',
  imports: [MatDialogModule, MatButtonModule, MatProgressSpinnerModule],
  templateUrl: './delete-patient-request-component.html',
  styleUrl: './delete-patient-request-component.scss',
})
export class DeletePatientRequestComponent {

  data = inject(MAT_DIALOG_DATA);
    
  constructor(
    private patientRequestService: PatientRequestService,
    private messageService: MessageService,
    private dialogRef: MatDialogRef<DeletePatientRequestComponent>,
  ) {}

  wSubmit = signal<boolean>(false)
  onDeletePatientRequestSubmit() {
    this.wSubmit.set(true)
    this.patientRequestService.deletePatientRequest(this.data.patient_request.id).subscribe({
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
