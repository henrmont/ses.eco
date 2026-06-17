import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { finalize } from 'rxjs';
import { PatientService } from '../../../services/patient-service';
import { MessageService } from '../../../../core/services/message-service';

@Component({
  selector: 'app-validate-patient-component',
  imports: [MatDialogModule, MatButtonModule, MatProgressSpinnerModule],
  templateUrl: './validate-patient-component.html',
  styleUrl: './validate-patient-component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush // ⚡ Performance máxima com OnPush + Signals
})
export class ValidatePatientComponent {
  // Injeções de Dependência modernas via inject()
  protected readonly data = inject(MAT_DIALOG_DATA);
  private readonly patientService = inject(PatientService);
  private readonly messageService = inject(MessageService);
  private readonly dialogRef = inject(MatDialogRef<ValidatePatientComponent>);

  // Estado de submissão reativo
  protected readonly isSubmitting = signal<boolean>(false);

  /**
   * Dispara a requisição para alternar a validação do atendimento do paciente
   */
  protected onSubmit(): void {
    const patientCareId = this.data?.patient_care?.id;

    if (!patientCareId) {
      this.messageService.showMessage('Erro: Identificador do atendimento não encontrado.');
      return;
    }

    this.isSubmitting.set(true);

    // Mapeia dinamicamente a ação com base no estado atual do atendimento
    const isValid = this.data?.patient_care?.is_valid;
    const acaoSucesso = isValid ? 'invalidado' : 'validado';
    const acaoErro = isValid ? 'invalidar' : 'validar';

    this.patientService.validatePatient(patientCareId)
      .pipe(
        finalize(() => this.isSubmitting.set(false))
      )
      .subscribe({
        next: (response: any) => {
          this.messageService.showMessage(response.message || `Atendimento ${acaoSucesso} com sucesso!`);
          this.dialogRef.close(true); // Sinaliza sucesso à listagem pai
        },
        error: (err) => {
          const errorMessage = err?.error?.message || `Ocorreu um erro ao tentar ${acaoErro} o atendimento.`;
          this.messageService.showMessage(errorMessage);
        },
      });
  }
}