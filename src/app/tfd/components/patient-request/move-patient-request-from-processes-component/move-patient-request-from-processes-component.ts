import { Component, inject, signal } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { PatientRequestService } from '../../../services/patient-request-service';
import { MessageService } from '../../../../core/services/message-service';

@Component({
  selector: 'app-move-patient-request-from-processes-component',
  imports: [MatDialogModule, MatButtonModule, MatProgressSpinnerModule],
  templateUrl: './move-patient-request-from-processes-component.html',
  styleUrl: './move-patient-request-from-processes-component.scss',
})
export class MovePatientRequestFromProcessesComponent {

  data = inject(MAT_DIALOG_DATA);
    
  constructor(
    private patientRequestService: PatientRequestService,
    private messageService: MessageService,
    private dialogRef: MatDialogRef<MovePatientRequestFromProcessesComponent>,
  ) {}

  wSubmit = signal<boolean>(false)
  onMovePatientRequestFromProcessesSubmit() {
    this.wSubmit.set(true)
    this.patientRequestService.movePatientRequestFromProcesses(this.data.patient_request.id).subscribe({
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
