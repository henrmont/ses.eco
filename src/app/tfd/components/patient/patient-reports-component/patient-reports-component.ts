import { Component, inject, OnInit, signal } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MAT_DIALOG_DATA, MatDialog, MatDialogModule } from '@angular/material/dialog';
import {MatTableModule, MatTableDataSource} from '@angular/material/table';
import {MatIconModule} from '@angular/material/icon';
import {MatTooltipModule} from '@angular/material/tooltip';
import {MatProgressSpinnerModule} from '@angular/material/progress-spinner';
import { PatientService } from '../../../services/patient-service';
import { CreatePatientReportComponent } from '../create-patient-report-component/create-patient-report-component';
import { UpdatePatientReportComponent } from '../update-patient-report-component/update-patient-report-component';
import { DeletePatientReportComponent } from '../delete-patient-report-component/delete-patient-report-component';
import { ShowPatientReportComponent } from '../show-patient-report-component/show-patient-report-component';
import { ReportAttachmentsComponent } from '../report-attachments-component/report-attachments-component';

const TFD_PATIENTS_CHANNEL = new BroadcastChannel('tfd-patients-channel');

@Component({
  selector: 'app-patient-reports-component',
  imports: [MatDialogModule, MatButtonModule, MatTableModule, MatIconModule, MatTooltipModule, MatProgressSpinnerModule],
  templateUrl: './patient-reports-component.html',
  styleUrl: './patient-reports-component.scss',
})
export class PatientReportsComponent implements OnInit {

  data = inject(MAT_DIALOG_DATA);
  displayedColumns: string[] = ['protocol','cid','actions'];
  dataSource = signal<MatTableDataSource<Report>>(new MatTableDataSource());
  isLoading = signal<boolean>(true);

  constructor(
    private dialog: MatDialog,
    private patientService: PatientService,
  ) {}

  ngOnInit(): void {
    this.getPatientReports();
  }

  getPatientReports() {
    this.patientService.getPatientReports(this.data.patient_care.id).subscribe({
      next: (response) => {
        this.dataSource.set(new MatTableDataSource(response)) 
      },
      complete: () => {
        this.isLoading.set(false);
      }
    })
  }

  upgradePatientReports() {
    this.patientService.getPatientReports(this.data.patient_care.id).subscribe({
      next: (response) => {
        this.dataSource.set(new MatTableDataSource(response)) 
      },
    })
  }

  showPatientReport(report: Report) {
    this.dialog.open(ShowPatientReportComponent, {
      width: '800px',
      disableClose: true,
      autoFocus: false,
      data: {
        report: report,
      }
    })
  }

  createPatientReport() {
    this.dialog.open(CreatePatientReportComponent, {
      width: '800px',
      disableClose: true,
      autoFocus: false,
      data: {
        patient_care: this.data.patient_care,
      }
    }).afterClosed().subscribe(result => {
      if (result) {
        this.upgradePatientReports();
        TFD_PATIENTS_CHANNEL.postMessage('update')
      }
    })
  }

  updatePatientReport(report: Report) {
    this.dialog.open(UpdatePatientReportComponent, {
      width: '800px',
      disableClose: true,
      autoFocus: false,
      data: {
        report: report,
      }
    }).afterClosed().subscribe(result => {
      if (result) {
        this.upgradePatientReports();
        TFD_PATIENTS_CHANNEL.postMessage('update')
      }
    })
  }

  deletePatientReport(report: Report) {
    this.dialog.open(DeletePatientReportComponent, {
      width: '400px',
      disableClose: true,
      autoFocus: false,
      data: {
        report: report,
      }
    }).afterClosed().subscribe(result => {
      if (result) {
        this.isLoading.set(true);
        this.getPatientReports();
        TFD_PATIENTS_CHANNEL.postMessage('update')
      }
    })
  }

  reportAttachments(report: Report) {
    this.dialog.open(ReportAttachmentsComponent, {
      width: '600px',
      disableClose: true,
      autoFocus: false,
      data: {
        report: report,
      }
    })
  }

}
