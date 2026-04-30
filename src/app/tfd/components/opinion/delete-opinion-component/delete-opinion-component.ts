import { Component, inject, signal } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { OpinionService } from '../../../services/opinion-service';
import { MessageService } from '../../../../core/services/message-service';

@Component({
  selector: 'app-delete-opinion-component',
  imports: [MatDialogModule, MatButtonModule, MatProgressSpinnerModule],
  templateUrl: './delete-opinion-component.html',
  styleUrl: './delete-opinion-component.scss',
})
export class DeleteOpinionComponent {

  data = inject(MAT_DIALOG_DATA);
    
  constructor(
    private opinionService: OpinionService,
    private messageService: MessageService,
    private dialogRef: MatDialogRef<DeleteOpinionComponent>,
  ) {}

  wSubmit = signal<boolean>(false)
  onDeleteOpinionSubmit() {
    this.wSubmit.set(true)
    this.opinionService.deleteOpinion(this.data.opinion.id).subscribe({
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
