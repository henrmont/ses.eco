import { Component, inject, signal } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MessageService } from '../../../../core/services/message-service';
import { TravelService } from '../../../services/travel-service';

@Component({
  selector: 'app-delete-travel-component',
  imports: [MatDialogModule, MatButtonModule, MatProgressSpinnerModule],
  templateUrl: './delete-travel-component.html',
  styleUrl: './delete-travel-component.scss',
})
export class DeleteTravelComponent {

  data = inject(MAT_DIALOG_DATA);
    
  constructor(
    private travelService: TravelService,
    private messageService: MessageService,
    private dialogRef: MatDialogRef<DeleteTravelComponent>,
  ) {}

  wSubmit = signal<boolean>(false)
  onSubmit() {
    this.wSubmit.set(true)
    this.travelService.deleteTravel(this.data.travel.id).subscribe({
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
