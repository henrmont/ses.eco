import { Component, inject, signal } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { PatientService } from '../../../services/patient-service';
import { MessageService } from '../../../../core/services/message-service';

@Component({
  selector: 'app-delete-patient-escort-component',
  imports: [MatDialogModule, MatButtonModule, MatProgressSpinnerModule],
  templateUrl: './delete-patient-escort-component.html',
  styleUrl: './delete-patient-escort-component.scss',
})
export class DeletePatientEscortComponent {

  data = inject(MAT_DIALOG_DATA);
  
  constructor(
    private patientService: PatientService,
    private messageService: MessageService,
    private dialog: MatDialogRef<DeletePatientEscortComponent>,
  ) {}

  wSubmit = signal<boolean>(false)
  onDeleteEscortSubmit() {
    this.wSubmit.set(true)
    this.patientService.deletePatientEscort(this.data.escort.pivot.id).subscribe({
      next: (response: any) => {
        this.messageService.showMessage(response.message)
        this.dialog.close(true)
      },
      error: (err) => {
        this.messageService.showMessage(err.error.message)
        this.wSubmit.set(false)
      },
    })
  }

}
