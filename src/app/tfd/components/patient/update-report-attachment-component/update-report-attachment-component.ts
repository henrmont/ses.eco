import { Component, inject, signal } from '@angular/core';
import { FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { finalize, forkJoin, Observable, of, switchMap } from 'rxjs';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { saveAs } from 'file-saver';
import { CommonModule } from '@angular/common';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { ERRORS } from '../../../consts/errors';
import { PatientService } from '../../../services/patient-service';
import { MessageService } from '../../../../core/services/message-service';
import { StorageService } from '../../../../core/services/storage-service';

@Component({
  selector: 'app-update-report-attachment-component',
  imports: [CommonModule, MatDialogModule, MatButtonModule, MatFormFieldModule, MatInputModule, MatIconModule, MatTooltipModule, FormsModule, ReactiveFormsModule, MatProgressSpinnerModule],
  templateUrl: './update-report-attachment-component.html',
  styleUrl: './update-report-attachment-component.scss',
})
export class UpdateReportAttachmentComponent {

  data = inject(MAT_DIALOG_DATA)
  errorMessages = ERRORS
  updateReportAttachmentForm: FormGroup

  constructor(
    private formBuilder: FormBuilder,
    private patientService: PatientService,
    private messageService: MessageService,
    private storageService: StorageService,
    private dialogRef: MatDialogRef<UpdateReportAttachmentComponent>,
  ) {
    this.updateReportAttachmentForm = this.formBuilder.group({
      name: [this.data.report_attachment.name, [Validators.required]],
    })
  }

  labelFile = signal<string>('Nenhum arquivo selecionado');
  file!:File
  onFileSelected(event: any) {
    this.labelFile.set(event.target.files[0].name)
    this.file = event.target.files[0]
  }

  download(archive: number, name: string) {
    this.storageService.download(archive).subscribe({
      next: (response) => {
        saveAs(response.archive,name)
      }
    })
  }

  wSubmit = signal<boolean>(false)
  onUpdatePatientReportAttachmentSubmit() {
    this.wSubmit.set(true);
    const attachmentData = {
      ...this.updateReportAttachmentForm.value,
      file: this.file,
    };

    this.patientService.updateReportAttachment(this.data.report_attachment.id, attachmentData).subscribe({
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
