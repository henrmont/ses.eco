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
import { PatientService } from '../../services/patient-service';
import { Permission } from '../../models/permission';
import { PatientCare } from '../../models/patient-care';
import { UpdatePatientComponent } from '../../components/patient/update-patient-component/update-patient-component';
import { PatientEscortsComponent } from '../../components/patient/patient-escorts-component/patient-escorts-component';
import { PatientReportsComponent } from '../../components/patient/patient-reports-component/patient-reports-component';
import { ArchivePatientComponent } from '../../components/patient/archive-patient-component/archive-patient-component';
import { MovePatientFromArchiveComponent } from '../../components/patient/move-patient-from-archive-component/move-patient-from-archive-component';
import { ValidatePatientComponent } from '../../components/patient/validate-patient-component/validate-patient-component';
import { MovePatientFromOthersComponent } from '../../components/patient/move-patient-from-others-component/move-patient-from-others-component';
import { ShowPatientComponent } from '../../components/patient/show-patient-component/show-patient-component';

const TFD_PATIENTS_CHANNEL = new BroadcastChannel('tfd-patients-channel');

@Component({
  selector: 'app-patients-page',
  imports: [MatFormFieldModule, MatInputModule, MatTableModule, MatButtonModule, MatIconModule, MatTooltipModule, MatBadgeModule, MatTabsModule, NgxMaskPipe],
  templateUrl: './patients-page.html',
  styleUrl: './patients-page.scss',
})
export class PatientsPage implements OnInit {

  displayedOwnerColumns: string[] = ['name','cns','document','valid','actions'];
  ownerDataSource = signal<MatTableDataSource<Patient>>(new MatTableDataSource());
  applyOwnerFilter(event: Event) {
    const FILTER_VALUE = (event.target as HTMLInputElement).value;
    this.ownerDataSource().filter = FILTER_VALUE.trim().toLowerCase();
  }

  displayedOthersColumns: string[] = ['name','cns','responsible','valid','actions'];
  othersDataSource = signal<MatTableDataSource<Patient>>(new MatTableDataSource());
  applyOthersFilter(event: Event) {
    const FILTER_VALUE = (event.target as HTMLInputElement).value;
    this.othersDataSource().filter = FILTER_VALUE.trim().toLowerCase();
  }

  constructor(
    private patientService: PatientService,
    private dialog: MatDialog,
    private route: ActivatedRoute
  ) {
    TFD_PATIENTS_CHANNEL.onmessage = (message) => {
      if (message.data === 'update') {
        this.upgradePatients()
      }
    }
  }

  ngOnInit(): void {
    this.getPatients()
  }

  getPatients() {
    this.loading()
    this.patientService.getPatients().subscribe({
      next: (response) => {
        console.log(response)
        this.ownerDataSource.set(new MatTableDataSource(response
          .filter((patient_care: any) => !patient_care.is_archived && patient_care.owner)
          .map((item: any) => {return {
            name: item.patient.name,
            cns: item.patient.cns,
            document: item.patient.document,
            document_type: item.patient.document_type,
            ...item
          }})
        ))
        this.othersDataSource.set(new MatTableDataSource(response
          .filter((patient_care: any) => !patient_care.is_archived && !patient_care.owner)
          .map((item: any) => {return {
            name: item.patient.name,
            cns: item.patient.cns,
            professional: item.user.professional.name,
            ...item
          }})
        ))
      },
      complete: () => {
        this.loadingDialog.close()
      }
    })
  }

  upgradePatients() {
    this.patientService.getPatients().subscribe({
      next: (response) => {
        this.ownerDataSource.set(new MatTableDataSource(response
          .filter((patient_care: any) => !patient_care.is_archived && patient_care.owner)
          .map((item: any) => {return {
            name: item.patient.name,
            cns: item.patient.cns,
            document: item.patient.document,
            document_type: item.patient.document_type,
            ...item
          }})
        ))
        this.othersDataSource.set(new MatTableDataSource(response
          .filter((patient_care: any) => !patient_care.is_archived && !patient_care.owner)
          .map((item: any) => {return {
            name: item.patient.name,
            cns: item.patient.cns,
            professional: item.user.professional.name,
            ...item
          }})
        ))
      },
    })
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
      height: '700px',
      disableClose: true,
      autoFocus: false,
      data: {
        patient_care: patient_care.patient
      }
    })
  }

  updatePatient(patient_care: PatientCare) {
    this.dialog.open(UpdatePatientComponent, {
      width: '1200px',
      height: '700px',
      disableClose: true,
      autoFocus: false,
      data: {
        patient: patient_care.patient
      }
    }).afterClosed().subscribe(result => {
      if (result) {
        this.upgradePatients()
        TFD_PATIENTS_CHANNEL.postMessage('update')
      }
    })
  }

  patientEscorts(patient_care: PatientCare) {
    this.dialog.open(PatientEscortsComponent, {
      width: '1200px',
      disableClose: true,
      autoFocus: false,
      data: {
        patient_care: patient_care,
        permissions: this.route.parent?.parent?.snapshot.data['user'].roles
      }
    })
  }

  patientReports(patient_care: PatientCare) {
    this.dialog.open(PatientReportsComponent, {
      width: '1200px',
      disableClose: true,
      autoFocus: false,
      data: {
        patient_care: patient_care,
      }
    })
  }

  archivePatient(patient_care: PatientCare) {
    this.dialog.open(ArchivePatientComponent, {
      width: '400px',
      height: 'auto',
      disableClose: true,
      autoFocus: false,
      data: {
        patient_care: patient_care
      }
    }).afterClosed().subscribe(result => {
      if (result) {
        this.upgradePatients()
        TFD_PATIENTS_CHANNEL.postMessage('update')
      }
    })
  }

  

  movePatientFromOthers(patient_care: PatientCare) {
    this.dialog.open(MovePatientFromOthersComponent, {
      width: '400px',
      height: 'auto',
      disableClose: true,
      autoFocus: false,
      data: {
        patient_care: patient_care
      }
    }).afterClosed().subscribe(result => {
      if (result) {
        this.upgradePatients()
        TFD_PATIENTS_CHANNEL.postMessage('update')
      }
    })
  }

  validatePatient(patient_care: PatientCare) {
    this.dialog.open(ValidatePatientComponent, {
      width: '400px',
      disableClose: true,
      autoFocus: false,
      data: {
        patient_care: patient_care
      }
    }).afterClosed().subscribe(result => {
      if (result) {
        this.upgradePatients()
        TFD_PATIENTS_CHANNEL.postMessage('update')
      }
    })
  }

}
