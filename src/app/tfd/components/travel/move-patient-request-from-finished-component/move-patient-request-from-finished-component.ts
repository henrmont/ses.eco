import { Component, inject, signal } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { PatientRequestService } from '../../../services/patient-request-service';
import { MessageService } from '../../../../core/services/message-service';
import { TravelService } from '../../../services/travel-service';

@Component({
  selector: 'app-move-patient-request-from-finished-component',
  imports: [MatDialogModule, MatButtonModule, MatProgressSpinnerModule],
  templateUrl: './move-patient-request-from-finished-component.html',
  styleUrl: './move-patient-request-from-finished-component.scss',
})
export class MovePatientRequestFromFinishedComponent {

  data = inject(MAT_DIALOG_DATA);
    
  constructor(
    private travelService: TravelService,
    private messageService: MessageService,
    private dialogRef: MatDialogRef<MovePatientRequestFromFinishedComponent>,
  ) {}

  wSubmit = signal<boolean>(false)
  onMovePatientRequestFromOthersSubmit() {
    this.wSubmit.set(true)
    this.travelService.movePatientRequestFromFinished(this.data.patient_request.id).subscribe({
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
