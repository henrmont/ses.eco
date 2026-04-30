import { Component, inject, signal } from '@angular/core';
import { FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { saveAs } from 'file-saver';
import { CommonModule } from '@angular/common';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { ERRORS } from '../../../consts/errors';
import { PatientRequestService } from '../../../services/patient-request-service';
import { MessageService } from '../../../../core/services/message-service';
import { StorageService } from '../../../../core/services/storage-service';

@Component({
  selector: 'app-update-patient-request-attachment-component',
  imports: [CommonModule, MatDialogModule, MatButtonModule, MatFormFieldModule, MatInputModule, MatIconModule, MatTooltipModule, FormsModule, ReactiveFormsModule, MatProgressSpinnerModule],
  templateUrl: './update-patient-request-attachment-component.html',
  styleUrl: './update-patient-request-attachment-component.scss',
})
export class UpdatePatientRequestAttachmentComponent {

  data = inject(MAT_DIALOG_DATA)
  errorMessages = ERRORS
  updatePatientRequestAttachmentForm: FormGroup

  constructor(
    private formBuilder: FormBuilder,
    private patientRequestService: PatientRequestService,
    private messageService: MessageService,
    private storageService: StorageService,
    private dialogRef: MatDialogRef<UpdatePatientRequestAttachmentComponent>,
  ) {
    this.updatePatientRequestAttachmentForm = this.formBuilder.group({
      name: [this.data.patient_request_attachment.name, [Validators.required]],
    })
  }

  labelFile = signal<string>('Nenhum arquivo selecionado');
  file!:File
  onFileSelected(event: any) {
    this.labelFile.set(event.target.files[0].name)
    this.file = event.target.files[0]
    this.updatePatientRequestAttachmentForm.markAsDirty()
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
      ...this.updatePatientRequestAttachmentForm.value,
      file: this.file,
    };

    this.patientRequestService.updatePatientRequestAttachment(this.data.patient_request_attachment.id, attachmentData).subscribe({
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
