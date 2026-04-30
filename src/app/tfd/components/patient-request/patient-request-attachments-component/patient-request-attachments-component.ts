import { Component, inject, OnInit, signal } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MAT_DIALOG_DATA, MatDialog, MatDialogModule } from '@angular/material/dialog';
import {MatTableModule, MatTableDataSource} from '@angular/material/table';
import {MatIconModule} from '@angular/material/icon';
import {MatTooltipModule} from '@angular/material/tooltip';
import {MatProgressSpinnerModule} from '@angular/material/progress-spinner';
import { saveAs } from 'file-saver';
import { PatientRequestAttachment } from '../../../models/patient-request-attachment';
import { PatientRequestService } from '../../../services/patient-request-service';
import { StorageService } from '../../../../core/services/storage-service';
import { CreatePatientRequestAttachmentComponent } from '../create-patient-request-attachment-component/create-patient-request-attachment-component';
import { UpdatePatientRequestAttachmentComponent } from '../update-patient-request-attachment-component/update-patient-request-attachment-component';
import { DeletePatientRequestAttachmentComponent } from '../delete-patient-request-attachment-component/delete-patient-request-attachment-component';

const TFD_PATIENT_REQUESTS_CHANNEL = new BroadcastChannel('tfd-patient-requests-channel');

@Component({
  selector: 'app-patient-request-attachments-component',
  imports: [MatDialogModule, MatButtonModule, MatTableModule, MatIconModule, MatTooltipModule, MatProgressSpinnerModule],
  templateUrl: './patient-request-attachments-component.html',
  styleUrl: './patient-request-attachments-component.scss',
})
export class PatientRequestAttachmentsComponent implements OnInit {

  data = inject(MAT_DIALOG_DATA);
  displayedColumns: string[] = ['name','actions'];
  dataSource = signal<MatTableDataSource<PatientRequestAttachment>>(new MatTableDataSource());
  isLoading = signal<boolean>(true);

  constructor(
    private dialog: MatDialog,
    private patientRequestService: PatientRequestService,
    private storageService: StorageService,
  ) {}

  ngOnInit(): void {
    this.getPatientRequestAttachments();
  }

  getPatientRequestAttachments() {
    this.patientRequestService.getPatientRequestAttachments(this.data.patient_request.id).subscribe({
      next: (response) => {
        this.dataSource.set(new MatTableDataSource(response)) 
      },
      complete: () => {
        this.isLoading.set(false);
      }
    })
  }

  upgradePatientRequestAttachments() {
    this.patientRequestService.getPatientRequestAttachments(this.data.patient_request.id).subscribe({
      next: (response) => {
        this.dataSource.set(new MatTableDataSource(response)) 
      },
    })
  }

  download(archive: number, name: string) {
    this.storageService.download(archive).subscribe({
      next: (response) => {
        saveAs(response.archive,name)
      }
    })
  }

  createPatientRequestAttachment() {
    this.dialog.open(CreatePatientRequestAttachmentComponent, {
      width: '400px',
      disableClose: true,
      autoFocus: false,
      data: {
        patient_request: this.data.patient_request,
      }
    }).afterClosed().subscribe(result => {
      if (result) {
        this.upgradePatientRequestAttachments();
        TFD_PATIENT_REQUESTS_CHANNEL.postMessage('update')
      }
    })
  }

  updatePatientRequestAttachment(patient_request_attachment: PatientRequestAttachment) {
    this.dialog.open(UpdatePatientRequestAttachmentComponent, {
      width: '400px',
      disableClose: true,
      autoFocus: false,
      data: {
        patient_request_attachment: patient_request_attachment,
      }
    }).afterClosed().subscribe(result => {
      if (result) {
        this.upgradePatientRequestAttachments();
        TFD_PATIENT_REQUESTS_CHANNEL.postMessage('update')
      }
    })
  }

  deletePatientRequestAttachment(patient_request_attachment: PatientRequestAttachment) {
    this.dialog.open(DeletePatientRequestAttachmentComponent, {
      width: '400px',
      disableClose: true,
      autoFocus: false,
      data: {
        patient_request_attachment: patient_request_attachment,
      }
    }).afterClosed().subscribe(result => {
      if (result) {
        this.isLoading.set(true);
        this.getPatientRequestAttachments();
        TFD_PATIENT_REQUESTS_CHANNEL.postMessage('update')
      }
    })
  }

}
