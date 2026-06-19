import { ChangeDetectionStrategy, Component, inject, signal, ChangeDetectorRef, DestroyRef } from '@angular/core';
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
  standalone: true,
  imports: [
    CommonModule,
    MatDialogModule,
    MatButtonModule,
    MatFormFieldModule,
    MatInputModule,
    MatIconModule,
    MatTooltipModule,
    FormsModule,
    ReactiveFormsModule,
    MatProgressSpinnerModule
  ],
  templateUrl: './update-patient-request-attachment-component.html',
  styleUrl: './update-patient-request-attachment-component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class UpdatePatientRequestAttachmentComponent {
  // Injeções de Dependência Funcionais
  protected readonly data = inject(MAT_DIALOG_DATA);
  private readonly fb = inject(FormBuilder);
  private readonly patientRequestService = inject(PatientRequestService);
  private readonly messageService = inject(MessageService);
  private readonly storageService = inject(StorageService);
  private readonly dialogRef = inject(MatDialogRef<UpdatePatientRequestAttachmentComponent>);
  private readonly cdr = inject(ChangeDetectorRef);
  private readonly destroyRef = inject(DestroyRef);

  // Estrutura do Formulário exposta ao template
  protected updateAttachmentForm!: FormGroup;

  // Estados Reativos baseados em Signals
  protected readonly isSubmitting = signal<boolean>(false);
  protected readonly isDownloading = signal<boolean>(false);
  protected readonly fileLabel = signal<string>('Nenhum arquivo selecionado');

  // Referência em memória para substituição opcional do binário
  private selectedFile: File | null = null;

  // 🎯 Mapeamento local estático das mensagens de erro
  protected readonly errorMessages: { [key: string]: Array<{ type: string; message: string }> } = {
    name: [
      { type: 'required', message: 'O nome do anexo é obrigatório.' }
    ]
  };

  constructor() {
    this.initForm();
  }

  // --- MÉTODOS PRIVADOS DE INICIALIZAÇÃO ---

  /**
   * Inicializa o formulário com o estado persistido do anexo vindo da listagem de solicitações do paciente
   */
  private initForm(): void {
    const currentName = this.data?.patient_request_attachment?.name || null;
    this.updateAttachmentForm = this.fb.group({
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

      // UX Inteligente: Se o usuário limpou o input de texto, sugere o nome do novo arquivo sem extensão
      const currentName = this.updateAttachmentForm.get('name')?.value;
      if (!currentName) {
        const sanitizedName = file.name.split('.').slice(0, -1).join('.');
        this.updateAttachmentForm.get('name')?.setValue(sanitizedName);
      }

      this.cdr.markForCheck();
    }
  }

  /**
   * Realiza o download seguro do binário existente na nuvem
   */
  protected download(archiveId: number, fileName: string): void {
    if (!archiveId) return;

    this.isDownloading.set(true);
    this.cdr.markForCheck();

    this.storageService.download(archiveId)
      .pipe(
        finalize(() => {
          this.isDownloading.set(false);
          this.cdr.markForCheck();
        }),
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe({
        next: (response) => {
          if (response?.archive) {
            saveAs(response.archive, fileName);
          }
        },
        error: () => {
          this.messageService.showMessage('Falha ao tentar baixar o arquivo.');
        }
      });
  }

  /**
   * Submete a atualização cadastral (Nome do anexo e/ou novo arquivo binário)
   */
  protected onSubmit(): void {
    const attachmentId = this.data?.patient_request_attachment?.id;

    if (this.updateAttachmentForm.invalid || !attachmentId) {
      this.updateAttachmentForm.markAllAsTouched();
      return;
    }

    this.isSubmitting.set(true);
    this.cdr.markForCheck();

    const attachmentPayload = {
      ...this.updateAttachmentForm.value,
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
        next: (response: any) => {
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