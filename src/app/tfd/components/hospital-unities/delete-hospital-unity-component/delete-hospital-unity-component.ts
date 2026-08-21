import { Component, inject, signal } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MessageService } from '../../../../core/services/message-service';
import { HospitalUnityService } from '../../../services/hospital-unity-service';

@Component({
  selector: 'app-delete-hospital-unity-component',
  imports: [MatDialogModule, MatButtonModule, MatProgressSpinnerModule],
  templateUrl: './delete-hospital-unity-component.html',
  styleUrl: './delete-hospital-unity-component.scss',
})
export class DeleteHospitalUnityComponent {

  data = inject(MAT_DIALOG_DATA);
    
  constructor(
    private hospitalUnityService: HospitalUnityService,
    private messageService: MessageService,
    private dialogRef: MatDialogRef<DeleteHospitalUnityComponent>,
  ) {}

  wSubmit = signal<boolean>(false)
  onSubmit() {
    this.wSubmit.set(true)
    this.hospitalUnityService.deleteHospitalUnity(this.data.hospital_unity.id).subscribe({
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
