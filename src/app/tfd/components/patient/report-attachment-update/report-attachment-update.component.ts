import { ChangeDetectionStrategy, Component, DestroyRef, inject, OnInit, signal, ChangeDetectorRef } from '@angular/core';
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

import { PatientService } from '../../../services/patient.service';
import { MessageService } from '../../../../core/services/message-service';
import { StorageService } from '../../../../core/services/storage-service';

@Component({
  selector: 'app-report-attachment-update',
  standalone: true,
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
  templateUrl: './report-attachment-update.component.html',
  styleUrl: './report-attachment-update.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ReportAttachmentUpdateComponent implements OnInit {
  protected readonly data = inject(MAT_DIALOG_DATA, { optional: true });
  private readonly fb = inject(FormBuilder);
  private readonly patientService = inject(PatientService);
  private readonly messageService = inject(MessageService);
  private readonly storageService = inject(StorageService);
  private readonly dialogRef = inject(MatDialogRef<ReportAttachmentUpdateComponent>);
  private readonly cdr = inject(ChangeDetectorRef);
  private readonly destroyRef = inject(DestroyRef);

  protected attachmentForm!: FormGroup;

  protected readonly isSubmitting = signal<boolean>(false);
  protected readonly hasFile = signal<boolean>(false);
  
  private readonly attachmentData = this.data?.reportAttachment || this.data?.attachment;

  protected readonly fileLabel = signal<string>(
    this.attachmentData?.archive_id 
      ? 'Arquivo já cadastrado (Clique para alterar)' 
      : 'Nenhum arquivo selecionado'
  );

  private selectedFile: File | null = null;

  protected readonly errorMessages: { [key: string]: Array<{ type: string; message: string }> } = {
    name: [
      { type: 'required', message: 'O nome do anexo é obrigatório.' }
    ]
  };

  ngOnInit(): void {
    this.initForm();
  }

  private initForm(): void {
    const currentName = this.attachmentData?.name || null;
    this.attachmentForm = this.fb.group({
      name: [currentName, [Validators.required]],
    });
  }

  protected onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;

    if (input.files && input.files.length > 0) {
      const file = input.files[0];
      this.selectedFile = file;
      this.fileLabel.set(file.name);
      this.hasFile.set(true);

      const currentName = this.attachmentForm.get('name')?.value;
      if (!currentName) {
        const sanitizedName = file.name.split('.').slice(0, -1).join('.');
        this.attachmentForm.get('name')?.setValue(sanitizedName);
        this.attachmentForm.get('name')?.markAsDirty();
      }

      this.cdr.markForCheck();
    }
  }

  protected download(archiveId: number | null | undefined, name: string): void {
    if (!archiveId) {
      this.messageService.showMessage('Arquivo não encontrado para download.');
      return;
    }

    this.storageService.download(archiveId)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (response) => {
          if (response?.archive) {
            saveAs(response.archive, name || 'anexo_laudo');
          }
        },
        error: (err) => {
          const fallbackError = err?.error?.message || 'Erro ao realizar download do arquivo.';
          this.messageService.showMessage(fallbackError);
        }
      });
  }

  protected isFormsPristine(): boolean {
    return this.attachmentForm.pristine && !this.hasFile();
  }

  protected onSubmit(): void {
    const attachmentId = this.attachmentData?.id;

    if (!attachmentId) {
      this.messageService.showMessage('Identificador do anexo não encontrado.');
      return;
    }

    if (this.attachmentForm.invalid) {
      this.attachmentForm.markAllAsTouched();
      return;
    }

    this.isSubmitting.set(true);
    this.cdr.markForCheck();

    const attachmentPayload = {
      ...this.attachmentForm.getRawValue(),
      file: this.selectedFile
    };

    this.patientService.updateReportAttachment(attachmentId, attachmentPayload)
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
          const fallbackError = err?.error?.message || 'Erro ao processar a atualização do anexo.';
          this.messageService.showMessage(fallbackError);
        }
      });
  }
}