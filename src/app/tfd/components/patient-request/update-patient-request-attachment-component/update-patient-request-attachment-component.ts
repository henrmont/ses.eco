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
import { saveAs } from 'file-saver';

import { PatientRequestService } from '../../../services/patient-request-service';
import { MessageService } from '../../../../core/services/message-service';
import { StorageService } from '../../../../core/services/storage-service';

@Component({
  selector: 'app-update-patient-request-attachment-component',
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
  templateUrl: './update-patient-request-attachment-component.html',
  styleUrl: './update-patient-request-attachment-component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class UpdatePatientRequestAttachmentComponent implements OnInit {
  // Injeções de Dependência Dinâmicas
  protected readonly data = inject(MAT_DIALOG_DATA);
  private readonly fb = inject(FormBuilder);
  private readonly patientRequestService = inject(PatientRequestService);
  private readonly messageService = inject(MessageService);
  private readonly storageService = inject(StorageService);
  private readonly dialogRef = inject(MatDialogRef<UpdatePatientRequestAttachmentComponent>);
  private readonly cdr = inject(ChangeDetectorRef);
  private readonly destroyRef = inject(DestroyRef);

  // Estrutura do Formulário exposta ao template
  protected attachmentForm!: FormGroup;

  // Estados Reativos baseados em Signals
  protected readonly isSubmitting = signal<boolean>(false);
  protected readonly hasFile = signal<boolean>(false);
  
  // Rótulo dinâmico baseado na existência de arquivo original prévio (Alinhado com a referência)
  protected readonly fileLabel = signal<string>(
    this.data?.patient_request_attachment?.archive_id 
      ? 'Arquivo já cadastrado (Clique para alterar)' 
      : 'Nenhum arquivo selecionado'
  );

  // Referência em memória para substituição opcional do binário
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

  /**
   * Inicializa o formulário com o estado persistido do anexo
   */
  private initForm(): void {
    const currentName = this.data?.patient_request_attachment?.name || null;
    this.attachmentForm = this.fb.group({
      name: [currentName, [Validators.required]],
    });
  }

  // --- MÉTODOS DE AÇÃO DO TEMPLATE (PROTECTED) ---

  /**
   * Captura a alteração do arquivo binário (Opcional na edição)
   */
  protected onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;

    if (input.files && input.files.length > 0) {
      const file = input.files[0];
      this.selectedFile = file;
      this.fileLabel.set(file.name);
      this.hasFile.set(true);

      // UX Inteligente: Se o usuário limpou o input de texto, sugere o nome do novo arquivo sem extensão
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
   * Realiza o download seguro do binário existente na nuvem
   */
  protected download(archiveId: number, name: string): void {
    this.storageService.download(archiveId)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (response) => {
          if (response?.archive) {
            saveAs(response.archive, name);
          }
        }
      });
  }

  /**
   * Controla se o formulário não recebeu alteração nenhuma (Evita requisições desnecessárias)
   */
  protected isFormsPristine(): boolean {
    return this.attachmentForm.pristine && !this.hasFile();
  }

  /**
   * Submete a atualização cadastral (Nome do anexo e/ou novo arquivo binário)
   */
  protected onSubmit(): void {
    const attachmentId = this.data?.patient_request_attachment?.id;

    if (!attachmentId) {
      this.messageService.showMessage('Identificador do anexo inválido.');
      return;
    }

    if (this.attachmentForm.invalid) {
      this.attachmentForm.markAllAsTouched();
      return;
    }

    this.isSubmitting.set(true);
    this.cdr.markForCheck(); // Sincroniza imediatamente o estado de submissão no DOM

    const attachmentPayload = {
      ...this.attachmentForm.getRawValue(),
      file: this.selectedFile // Se mantido null, o backend atualiza apenas o nome textual
    };

    this.patientRequestService.updatePatientRequestAttachment(attachmentId, attachmentPayload)
      .pipe(
        finalize(() => {
          this.isSubmitting.set(false);
          this.cdr.markForCheck();
        }),
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe({
        next: (response) => {
          this.messageService.showMessage(response?.message || 'Anexo atualizado com sucesso!');
          this.dialogRef.close(true);
        },
        error: (err) => {
          const fallbackError = 'Erro ao processar a atualização do anexo.';
          this.messageService.showMessage(err?.error?.message || fallbackError);
        }
      });
  }
}