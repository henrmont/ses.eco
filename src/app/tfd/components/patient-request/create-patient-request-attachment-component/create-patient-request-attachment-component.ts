import { ChangeDetectionStrategy, Component, inject, OnInit, signal, ChangeDetectorRef, DestroyRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { finalize } from 'rxjs';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';

import { PatientRequestService } from '../../../services/patient-request-service';
import { MessageService } from '../../../../core/services/message-service';

@Component({
  selector: 'app-create-patient-request-attachment-component',
  imports: [
    CommonModule, 
    FormsModule, 
    ReactiveFormsModule, 
    MatDialogModule, 
    MatButtonModule, 
    MatFormFieldModule, 
    MatInputModule, 
    MatIconModule, 
    MatTooltipModule, 
    MatProgressSpinnerModule
  ],
  templateUrl: './create-patient-request-attachment-component.html',
  styleUrl: './create-patient-request-attachment-component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class CreatePatientRequestAttachmentComponent implements OnInit {
  // Injeções de Dependência Dinâmicas
  protected readonly data = inject(MAT_DIALOG_DATA);
  private readonly fb = inject(FormBuilder);
  private readonly patientRequestService = inject(PatientRequestService);
  private readonly messageService = inject(MessageService);
  private readonly dialogRef = inject(MatDialogRef<CreatePatientRequestAttachmentComponent>);
  private readonly cdr = inject(ChangeDetectorRef);
  private readonly destroyRef = inject(DestroyRef);

  // Estrutura do Formulário exposta ao template
  protected attachmentForm!: FormGroup;

  // Estados gerenciados reativamente via Signals
  protected readonly isSubmitting = signal<boolean>(false);
  protected readonly hasFile = signal<boolean>(false);
  protected readonly fileLabel = signal<string>('Nenhum arquivo selecionado');
  
  // Referência do binário em memória
  private selectedFile: File | null = null;

  // 🎯 Mapeamento local das mensagens de erro padronizado para a UI
  protected readonly errorMessages: { [key: string]: Array<{ type: string; message: string }> } = {
    name: [
      { type: 'required', message: 'O nome do anexo é obrigatório.' }
    ]
  };

  ngOnInit(): void {
    this.initForm();
  }

  // --- MÉTODOS PRIVADOS DE INICIALIZAÇÃO E SUPORTE ---

  private initForm(): void {
    this.attachmentForm = this.fb.group({
      name: [null, [Validators.required]],
    });
  }

  // --- MÉTODOS DE AÇÃO DO TEMPLATE (PROTECTED) ---

  /**
   * Captura e processa o arquivo carregado no input nativo
   */
  protected onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    
    if (input.files && input.files.length > 0) {
      const file = input.files[0];
      this.selectedFile = file;
      this.fileLabel.set(file.name);
      this.hasFile.set(true);
      
      // UX Inteligente: Sugere o nome do arquivo limpo sem a extensão se o input estiver vazio
      const currentName = this.attachmentForm.get('name')?.value;
      if (!currentName) {
        const sanitizedName = file.name.split('.').slice(0, -1).join('.');
        this.attachmentForm.get('name')?.setValue(sanitizedName);
        this.attachmentForm.get('name')?.markAsDirty();
      }
      
      this.cdr.markForCheck();
    }
  }

  /**
   * Processa a submissão e upload do anexo vinculado à solicitação do paciente
   */
  protected onSubmit(): void {
    const patientRequestId = this.data?.patient_request?.id;

    if (!patientRequestId) {
      this.messageService.showMessage('Identificador da solicitação não encontrado.');
      return;
    }

    // Bloqueia preventivamente se o form estiver inválido ou sem arquivo
    if (this.attachmentForm.invalid || !this.selectedFile) {
      this.attachmentForm.markAllAsTouched();
      
      if (!this.selectedFile) {
        this.messageService.showMessage('A seleção de um arquivo anexo é obrigatória.');
      }
      return;
    }

    this.isSubmitting.set(true);
    this.cdr.markForCheck(); // Sincroniza imediatamente o estado de submissão no DOM

    const attachmentPayload = {
      ...this.attachmentForm.getRawValue(),
      file: this.selectedFile
    };

    this.patientRequestService.createPatientRequestAttachment(patientRequestId, attachmentPayload)
      .pipe(
        finalize(() => {
          this.isSubmitting.set(false);
          this.cdr.markForCheck();
        }),
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe({
        next: (response) => {
          this.messageService.showMessage(response?.message || 'Arquivo anexado com sucesso!');
          this.dialogRef.close(true);
        },
        error: (err) => {
          const fallbackError = 'Erro ao processar o upload do anexo.';
          this.messageService.showMessage(err?.error?.message || fallbackError);
        }
      });
  }
}