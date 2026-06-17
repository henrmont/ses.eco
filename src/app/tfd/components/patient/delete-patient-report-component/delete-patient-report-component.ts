import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { PatientService } from '../../../services/patient-service';
import { MessageService } from '../../../../core/services/message-service';

@Component({
  selector: 'app-delete-patient-report-component',
  imports: [MatDialogModule, MatButtonModule, MatProgressSpinnerModule],
  templateUrl: './delete-patient-report-component.html',
  styleUrl: './delete-patient-report-component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush // ⚡ Performance máxima com OnPush + Signals
})
export class DeletePatientReportComponent {
  // Injeções de Dependência modernas via inject()
  protected readonly data = inject(MAT_DIALOG_DATA);
  private readonly patientService = inject(PatientService);
  private readonly messageService = inject(MessageService);
  private readonly dialogRef = inject(MatDialogRef<DeletePatientReportComponent>);

  // Estado de submissão reativo
  protected readonly isSubmitting = signal<boolean>(false);

  /**
   * Dispara a requisição para remover o laudo do paciente
   */
  protected onSubmit(): void {
    const reportId = this.data?.report?.id;

    if (!reportId) {
      this.messageService.showMessage('Erro: Identificador do laudo não encontrado.');
      return;
    }

    this.isSubmitting.set(true);

    this.patientService.deletePatientReport(reportId).subscribe({
      next: (response: any) => {
        this.messageService.showMessage(response.message || 'Laudo removido com sucesso!');
        this.dialogRef.close(true); // Retorna true para sinalizar sucesso à grid/listagem pai
      },
      error: (err) => {
        const errorMessage = err?.error?.message || 'Ocorreu um erro ao tentar remover o laudo.';
        this.messageService.showMessage(errorMessage);
        this.isSubmitting.set(false);
      },
    });
  }
}