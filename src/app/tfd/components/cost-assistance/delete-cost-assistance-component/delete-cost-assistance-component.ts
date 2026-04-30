import { Component, inject, signal } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MessageService } from '../../../../core/services/message-service';
import { CostAssistanceService } from '../../../services/cost-assistance-service';

@Component({
  selector: 'app-delete-cost-assistance-component',
  imports: [MatButtonModule, MatDialogModule, MatProgressSpinnerModule],
  templateUrl: './delete-cost-assistance-component.html',
  styleUrl: './delete-cost-assistance-component.scss',
})
export class DeleteCostAssistanceComponent {

  data = inject(MAT_DIALOG_DATA);
    
  constructor(
    private costAssistanceService: CostAssistanceService,
    private messageService: MessageService,
    private dialogRef: MatDialogRef<DeleteCostAssistanceComponent>,
  ) {}

  wSubmit = signal<boolean>(false)
  onSubmit() {
    this.wSubmit.set(true)
    this.costAssistanceService.deleteCostAssistance(this.data.cost_assistance.id).subscribe({
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
