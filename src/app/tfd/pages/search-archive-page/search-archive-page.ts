import { Component, OnInit, signal } from '@angular/core';
import {MatTableDataSource, MatTableModule} from '@angular/material/table';
import {MatInputModule} from '@angular/material/input';
import {MatFormFieldModule} from '@angular/material/form-field';
import {MatButtonModule} from '@angular/material/button';
import {MatIconModule} from '@angular/material/icon';
import {MatTooltipModule} from '@angular/material/tooltip';
import {MatBadgeModule} from '@angular/material/badge';
import { MatTabsModule } from '@angular/material/tabs';
import { MatDialog, MatDialogRef } from '@angular/material/dialog';
import { ActivatedRoute } from '@angular/router';
import { NgxMaskPipe } from 'ngx-mask';
import { LoadingComponent } from '../../../core/components/loading-component/loading-component';
import { Patient } from '../../models/patient';
import { Permission } from '../../models/permission';
import { PatientCare } from '../../models/patient-care';
import { MovePatientFromArchiveComponent } from '../../components/patient/move-patient-from-archive-component/move-patient-from-archive-component';
import { ShowPatientComponent } from '../../components/patient/show-patient-component/show-patient-component';
import { SearchService } from '../../services/search-service';
import { finalize, forkJoin } from 'rxjs';
import { CommonModule } from '@angular/common';
import { PatientRequest } from '../../models/patient-request';
import { ShowPatientRequestComponent } from '../../components/patient-request/show-patient-request-component/show-patient-request-component';
import { MovePatientRequestFromArchiveComponent } from '../../components/patient-request/move-patient-request-from-archive-component/move-patient-request-from-archive-component';

const TFD_PATIENTS_CHANNEL = new BroadcastChannel('tfd-patients-channel');
const TFD_PATIENT_REQUESTS_CHANNEL = new BroadcastChannel('tfd-patient-requests-channel');

@Component({
  selector: 'app-search-archive-page',
  imports: [CommonModule, MatFormFieldModule, MatInputModule, MatTableModule, MatButtonModule, MatIconModule, MatTooltipModule, MatBadgeModule, MatTabsModule, NgxMaskPipe],
  templateUrl: './search-archive-page.html',
  styleUrl: './search-archive-page.scss',
})
export class SearchArchivePage implements OnInit {

  displayedPatientColumns: string[] = ['name','cns','document','responsible','valid','actions'];
  patientDataSource = signal<MatTableDataSource<Patient>>(new MatTableDataSource());
  applyPatientFilter(event: Event) {
    const FILTER_VALUE = (event.target as HTMLInputElement).value;
    this.patientDataSource().filter = FILTER_VALUE.trim().toLowerCase();
  }

  displayedPatientRequestColumns: string[] = ['patient','cns','type','consultation_date','responsible','actions'];
  patientRequestDataSource = signal<MatTableDataSource<PatientRequest>>(new MatTableDataSource());
  applyPatientRequestFilter(event: Event) {
    const FILTER_VALUE = (event.target as HTMLInputElement).value;
    this.patientRequestDataSource().filter = FILTER_VALUE.trim().toLowerCase();
  }

  constructor(
    private searchService: SearchService,
    private dialog: MatDialog,
    private route: ActivatedRoute
  ) {}

  ngOnInit(): void {
    this.getArchivedData()
  }

  getArchivedData() {
    this.loading()

    const archivedPatients$ = this.searchService.getArchivedPatients();
    const archivedPatientsRequests$ = this.searchService.getArchivedPatientsRequests();

    forkJoin({
      patients: archivedPatients$,
      patient_requests: archivedPatientsRequests$
    })
    .pipe(
      finalize(() => {
        if (this.loadingDialog) {
          this.loadingDialog.close();
        }
      })
    )
    .subscribe({
      next: (response) => {
        this.patientDataSource.set(new MatTableDataSource(response.patients
          .map((item: any) => ({
            name: item.patient.name,
            cns: item.patient.cns,
            document: item.patient.document,
            document_type: item.patient.document_type,
            ...item
          }))
        ));
        this.patientRequestDataSource.set(new MatTableDataSource(response.patient_requests
          .map((item: any) => {return {
            name: item.report.patient_care.patient.name,
            cns: item.report.patient_care.patient.cns,
            type: item.type,
            consultation_date: item.consultation_date,
            status: item.status,
            ...item
          }})
        ))
      },
    });
  }

  loadingDialog!: MatDialogRef<LoadingComponent>
  loading() {
    this.loadingDialog = this.dialog.open(LoadingComponent, {
      height: '200px',
      disableClose: true,
      autoFocus: false,
    });
  }

  checkPermissions(name: string) {
    const roles = this.route.parent?.parent?.snapshot.data['user'].roles
    for (const item of roles) {
      if (item.permissions.filter((permission: Permission) => permission.name == name).length > 0)
        return false 
    }
    return true
  }

  showPatient(patient_care: PatientCare) {
    this.dialog.open(ShowPatientComponent, {
      width: '1200px',
      height: 'auto',
      disableClose: true,
      autoFocus: false,
      data: {
        patient_care: patient_care.patient
      }
    })
  }

  showPatientRequest(patient_request: PatientRequest) {
    this.dialog.open(ShowPatientRequestComponent, {
      width: '1000px',
      height: 'auto',
      disableClose: true,
      autoFocus: false,
      data: {
        patient_request: patient_request
      }
    })
  }

  movePatientFromArchive(patient_care: PatientCare) {
    this.dialog.open(MovePatientFromArchiveComponent, {
      width: '400px',
      height: 'auto',
      disableClose: true,
      autoFocus: false,
      data: {
        patient_care: patient_care
      }
    }).afterClosed().subscribe(result => {
      if (result) {
        this.getArchivedData()
        TFD_PATIENTS_CHANNEL.postMessage('update')
      }
    })
  }

  movePatientRequestFromArchive(patient_request: PatientRequest) {
    this.dialog.open(MovePatientRequestFromArchiveComponent, {
      width: '400px',
      height: 'auto',
      disableClose: true,
      autoFocus: false,
      data: {
        patient_request: patient_request
      }
    }).afterClosed().subscribe(result => {
      if (result) {
        this.getArchivedData()
        TFD_PATIENT_REQUESTS_CHANNEL.postMessage('update')
      }
    })
  }

}
