import { ChangeDetectionStrategy, Component, inject, OnInit, signal, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { finalize } from 'rxjs';

import { OpinionService } from '../../../services/opinion-service';
import { MessageService } from '../../../../core/services/message-service';

@Component({
  selector: 'app-undo-patient-request-component',
  standalone: true,
  imports: [
    CommonModule, 
    FormsModule, 
    ReactiveFormsModule, 
    MatDialogModule, 
    MatButtonModule, 
    MatFormFieldModule, 
    MatInputModule, 
    MatSelectModule, 
    MatProgressSpinnerModule
  ],
  templateUrl: './undo-patient-request-component.html',
  styleUrl: './undo-patient-request-component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush // ⚡ Performance máxima com OnPush + Signals
})
export class UndoPatientRequestComponent implements OnInit {
  // Injeções de Dependência via inject()
  protected readonly data = inject(MAT_DIALOG_DATA);
  private readonly fb = inject(FormBuilder);
  private readonly opinionService = inject(OpinionService);
  private readonly messageService = inject(MessageService);
  private readonly dialogRef = inject(MatDialogRef<UndoPatientRequestComponent>);
  private readonly cdr = inject(ChangeDetectorRef);

  // Mapeamento local das mensagens de erro (idêntico ao modelo de referência)
  protected readonly errorMessages: { [key: string]: Array<{ type: string; message: string }> } = {
    reason: [
      { type: 'required', message: 'A justificativa do retorno é obrigatória.' }
    ],
    to: [
      { type: 'required', message: 'A definição do setor de destino é obrigatória.' }
    ]
  };

  // Formulário exposto ao template
  protected tramitPatientRequestForm!: FormGroup;

  // Estados reativos com Signals
  protected readonly isSubmitting = signal<boolean>(false);

  constructor() {
    this.initForm();
  }

  ngOnInit(): void {
    // Mantido para compatibilidade e ciclos de inicialização padrão da arquitetura
  }

  // --- MÉTODOS PRIVADOS DE SUPORTE ---

  private initForm(): void {
    this.tramitPatientRequestForm = this.fb.group({
      reason: [null, [Validators.required]],
      to: [null, [Validators.required]]
    });
  }

  // --- MÉTODOS DE AÇÃO DO TEMPLATE (PROTECTED) ---

  protected onSubmit(): void {
    if (this.tramitPatientRequestForm.invalid) {
      this.tramitPatientRequestForm.markAllAsTouched();
      return;
    }

    const requestId = this.data?.patient_request?.id;
    if (!requestId) {
      this.messageService.showMessage('Erro: Identificador da solicitação não encontrado.');
      return;
    }

    this.isSubmitting.set(true);

    this.opinionService.undoPatientRequest(requestId, this.tramitPatientRequestForm.getRawValue())
      .pipe(
        finalize(() => {
          this.isSubmitting.set(false);
          this.cdr.markForCheck(); // Assegura desligamento visual estável
        })
      )
      .subscribe({
        next: (response: any) => {
          this.messageService.showMessage(response.message || 'Solicitação devolvida com sucesso!');
          this.dialogRef.close(true);
        },
        error: (err) => {
          const errMsg = err?.error?.message || 'Erro ao tentar desfazer/devolver a solicitação.';
          this.messageService.showMessage(errMsg);
        }
      });
  }
}