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

import { PatientService } from '../../../services/patient.service';
import { MessageService } from '../../../../core/services/message-service';

@Component({
  selector: 'app-report-attachment-create',
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
  templateUrl: './report-attachment-create.component.html',
  styleUrl: './report-attachment-create.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ReportAttachmentCreateComponent implements OnInit {
  protected readonly data = inject(MAT_DIALOG_DATA, { optional: true });
  private readonly fb = inject(FormBuilder);
  private readonly patientService = inject(PatientService);
  private readonly messageService = inject(MessageService);
  private readonly dialogRef = inject(MatDialogRef<ReportAttachmentCreateComponent>);
  private readonly cdr = inject(ChangeDetectorRef);
  private readonly destroyRef = inject(DestroyRef);

  protected attachmentForm!: FormGroup;

  protected readonly isSubmitting = signal<boolean>(false);
  protected readonly hasFile = signal<boolean>(false);
  protected readonly fileLabel = signal<string>('Nenhum arquivo selecionado');
  
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
    this.attachmentForm = this.fb.group({
      name: [null, [Validators.required]],
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

  protected onSubmit(): void {
    const reportId = this.data?.report?.id || this.data?.report_id;

    if (!reportId) {
      this.messageService.showMessage('Identificador do laudo não encontrado.');
      return;
    }

    if (this.attachmentForm.invalid || !this.selectedFile) {
      this.attachmentForm.markAllAsTouched();
      
      if (!this.selectedFile) {
        this.messageService.showMessage('A seleção de um arquivo anexo é obrigatória.');
      }
      return;
    }

    this.isSubmitting.set(true);
    this.cdr.markForCheck();

    const attachmentPayload = {
      ...this.attachmentForm.getRawValue(),
      file: this.selectedFile
    };

    this.patientService.createReportAttachment(reportId, attachmentPayload)
      .pipe(
        finalize(() => {
          this.isSubmitting.set(false);
          this.cdr.markForCheck();
        }),
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe({
        next: (response: any) => {
          this.messageService.showMessage(response?.message || 'Arquivo anexado com sucesso!');
          this.dialogRef.close(true);
        },
        error: (err) => {
          const fallbackError = err?.error?.message || 'Erro ao processar o upload do anexo.';
          this.messageService.showMessage(fallbackError);
        }
      });
  }
}