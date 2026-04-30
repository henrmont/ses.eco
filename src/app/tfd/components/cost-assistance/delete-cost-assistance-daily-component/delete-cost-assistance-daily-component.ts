import { Component, inject, signal } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MessageService } from '../../../../core/services/message-service';
import { CostAssistanceService } from '../../../services/cost-assistance-service';

@Component({
  selector: 'app-delete-cost-assistance-daily-component',
  imports: [MatButtonModule, MatDialogModule, MatProgressSpinnerModule],
  templateUrl: './delete-cost-assistance-daily-component.html',
  styleUrl: './delete-cost-assistance-daily-component.scss',
})
export class DeleteCostAssistanceDailyComponent {

  data = inject(MAT_DIALOG_DATA);
    
  constructor(
    private costAssistanceService: CostAssistanceService,
    private messageService: MessageService,
    private dialogRef: MatDialogRef<DeleteCostAssistanceDailyComponent>,
  ) {}

  wSubmit = signal<boolean>(false)
  onSubmit() {
    this.wSubmit.set(true)
    this.costAssistanceService.deleteCostAssistanceDaily(this.data.cost_assistance_daily.id).subscribe({
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
