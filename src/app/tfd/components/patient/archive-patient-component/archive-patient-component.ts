import { Component, inject, signal } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { PatientService } from '../../../services/patient-service';
import { MessageService } from '../../../../core/services/message-service';

@Component({
  selector: 'app-archive-patient-component',
  imports: [MatDialogModule, MatButtonModule, MatProgressSpinnerModule],
  templateUrl: './archive-patient-component.html',
  styleUrl: './archive-patient-component.scss',
})
export class ArchivePatientComponent {

  data = inject(MAT_DIALOG_DATA);
    
  constructor(
    private patientService: PatientService,
    private messageService: MessageService,
    private dialogRef: MatDialogRef<ArchivePatientComponent>,
  ) {}

  wSubmit = signal<boolean>(false)
  onArchivePatientSubmit() {
    this.wSubmit.set(true)
    this.patientService.archivePatient(this.data.patient_care.id).subscribe({
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
