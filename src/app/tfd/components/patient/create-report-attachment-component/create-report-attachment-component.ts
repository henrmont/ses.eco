import { Component, inject, signal } from '@angular/core';
import { FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { CommonModule } from '@angular/common';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { ERRORS } from '../../../consts/errors';
import { PatientService } from '../../../services/patient-service';
import { MessageService } from '../../../../core/services/message-service';

@Component({
  selector: 'app-create-report-attachment-component',
  imports: [CommonModule, FormsModule, ReactiveFormsModule, MatDialogModule, MatButtonModule, MatFormFieldModule, MatInputModule, MatIconModule, MatTooltipModule, MatProgressSpinnerModule],
  templateUrl: './create-report-attachment-component.html',
  styleUrl: './create-report-attachment-component.scss',
})
export class CreateReportAttachmentComponent  {

  data = inject(MAT_DIALOG_DATA)
  errorMessages = ERRORS
  createReportAttachmentForm: FormGroup

  constructor(
    private formBuilder: FormBuilder,
    private patientService: PatientService,
    private messageService: MessageService,
    private dialogRef: MatDialogRef<CreateReportAttachmentComponent>,
  ) {
    this.createReportAttachmentForm = this.formBuilder.group({
      name: [null, [Validators.required]],
    })
  }

  hasFile = false
  labelFile = signal<string>('Nenhum arquivo selecionado');
  file!:File
  onFileSelected(event: any) {
    this.labelFile.set(event.target.files[0].name)
    this.file = event.target.files[0]
    this.hasFile = true
  }

  wSubmit = signal<boolean>(false)
  onCreatePatientReportAttachmentSubmit() {
    this.wSubmit.set(true);
    const attachmentData = {
      ...this.createReportAttachmentForm.value,
      file: this.file,
    };

    this.patientService.createReportAttachment(this.data.report.id, attachmentData).subscribe({
      next: (response: any) => {
        this.messageService.showMessage(response.message);
        this.dialogRef.close(true);
      },
      error: (err) => {
        this.messageService.showMessage(err.error.message);
        this.wSubmit.set(false);
      }
    });
  }

}
