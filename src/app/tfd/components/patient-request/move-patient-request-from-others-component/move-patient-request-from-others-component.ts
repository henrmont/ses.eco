import { Component, inject, signal } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { PatientRequestService } from '../../../services/patient-request-service';
import { MessageService } from '../../../../core/services/message-service';

@Component({
  selector: 'app-move-patient-request-from-others-component',
  imports: [MatDialogModule, MatButtonModule, MatProgressSpinnerModule],
  templateUrl: './move-patient-request-from-others-component.html',
  styleUrl: './move-patient-request-from-others-component.scss',
})
export class MovePatientRequestFromOthersComponent {

  data = inject(MAT_DIALOG_DATA);
    
  constructor(
    private patientRequestService: PatientRequestService,
    private messageService: MessageService,
    private dialogRef: MatDialogRef<MovePatientRequestFromOthersComponent>,
  ) {}

  wSubmit = signal<boolean>(false)
  onMovePatientRequestFromOthersSubmit() {
    this.wSubmit.set(true)
    this.patientRequestService.movePatientRequestFromOthers(this.data.patient_request.id).subscribe({
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
