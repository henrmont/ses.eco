import { Component, inject, OnInit, signal } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MAT_DIALOG_DATA, MatDialog, MatDialogModule } from '@angular/material/dialog';
import {MatTableModule, MatTableDataSource} from '@angular/material/table';
import {MatIconModule} from '@angular/material/icon';
import {MatTooltipModule} from '@angular/material/tooltip';
import {MatProgressSpinnerModule} from '@angular/material/progress-spinner';
import { saveAs } from 'file-saver';
import { ReportAttachment } from '../../../models/report-attachment';
import { PatientService } from '../../../services/patient-service';
import { StorageService } from '../../../../core/services/storage-service';
import { CreateReportAttachmentComponent } from '../create-report-attachment-component/create-report-attachment-component';
import { UpdateReportAttachmentComponent } from '../update-report-attachment-component/update-report-attachment-component';
import { DeleteReportAttachmentComponent } from '../delete-report-attachment-component/delete-report-attachment-component';

@Component({
  selector: 'app-patient-report-attachments-component',
  imports: [MatDialogModule, MatButtonModule, MatTableModule, MatIconModule, MatTooltipModule, MatProgressSpinnerModule],
  templateUrl: './report-attachments-component.html',
  styleUrl: './report-attachments-component.scss',
})
export class ReportAttachmentsComponent implements OnInit {

  data = inject(MAT_DIALOG_DATA);
  displayedColumns: string[] = ['name','actions'];
  dataSource = signal<MatTableDataSource<ReportAttachment>>(new MatTableDataSource());
  isLoading = signal<boolean>(true);

  constructor(
    private dialog: MatDialog,
    private patientService: PatientService,
    private storageService: StorageService,
  ) {}

  ngOnInit(): void {
    this.getReportAttachments();
  }

  getReportAttachments() {
    this.patientService.getReportAttachments(this.data.report.id).subscribe({
      next: (response) => {
        this.dataSource.set(new MatTableDataSource(response)) 
      },
      complete: () => {
        this.isLoading.set(false);
      }
    })
  }

  upgradeReportAttachments() {
    this.patientService.getReportAttachments(this.data.report.id).subscribe({
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

  createReportAttachment() {
    this.dialog.open(CreateReportAttachmentComponent, {
      width: '400px',
      disableClose: true,
      autoFocus: false,
      data: {
        report: this.data.report,
      }
    }).afterClosed().subscribe(result => {
      if (result)
        this.upgradeReportAttachments();
    })
  }

  updateReportAttachment(report_attachment: ReportAttachment) {
    this.dialog.open(UpdateReportAttachmentComponent, {
      width: '400px',
      disableClose: true,
      autoFocus: false,
      data: {
        report_attachment: report_attachment,
      }
    }).afterClosed().subscribe(result => {
      if (result)
        this.upgradeReportAttachments();
    })
  }

  deleteReportAttachment(report_attachment: ReportAttachment) {
    this.dialog.open(DeleteReportAttachmentComponent, {
      width: '400px',
      disableClose: true,
      autoFocus: false,
      data: {
        report_attachment: report_attachment,
      }
    }).afterClosed().subscribe(result => {
      if (result) {
        this.isLoading.set(true);
        this.getReportAttachments();
      }
    })
  }

}
