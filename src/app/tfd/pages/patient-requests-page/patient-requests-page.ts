import { Component, OnInit, signal, viewChild } from '@angular/core';
import {MatTableDataSource, MatTableModule} from '@angular/material/table';
import {MatInputModule} from '@angular/material/input';
import {MatFormFieldModule} from '@angular/material/form-field';
import {MatButtonModule} from '@angular/material/button';
import {MatIconModule} from '@angular/material/icon';
import {MatTooltipModule} from '@angular/material/tooltip';
import { MatTabsModule } from '@angular/material/tabs';
import {MatSort, MatSortModule} from '@angular/material/sort';
import { MatDialog, MatDialogRef } from '@angular/material/dialog';
import { CommonModule } from '@angular/common';
import { ActivatedRoute } from '@angular/router';
import { NgxMaskDirective, NgxMaskPipe } from 'ngx-mask';
import { LoadingComponent } from '../../../core/components/loading-component/loading-component';
import { PatientRequest } from '../../models/patient-request';
import { PatientRequestService } from '../../services/patient-request-service';
import { Permission } from '../../models/permission';
import { UpdatePatientRequestComponent } from '../../components/patient-request/update-patient-request-component/update-patient-request-component';
import { HaltedPatientRequestComponent } from '../../components/patient-request/halted-patient-request-component/halted-patient-request-component';
import { PatientRequestAttachmentsComponent } from '../../components/patient-request/patient-request-attachments-component/patient-request-attachments-component';
import { DeletePatientRequestComponent } from '../../components/patient-request/delete-patient-request-component/delete-patient-request-component';
import { ProcessPatientRequestComponent } from '../../components/patient-request/process-patient-request-component/process-patient-request-component';
import { MovePatientRequestFromProcessesComponent } from '../../components/patient-request/move-patient-request-from-processes-component/move-patient-request-from-processes-component';
import { MovePatientRequestFromOthersComponent } from '../../components/patient-request/move-patient-request-from-others-component/move-patient-request-from-others-component';
import { ShowPatientRequestComponent } from '../../components/patient-request/show-patient-request-component/show-patient-request-component';
import { UndoMessageComponent } from '../../components/shared/undo-message-component/undo-message-component';

const TFD_PATIENT_REQUESTS_CHANNEL = new BroadcastChannel('tfd-patient-requests-channel');

@Component({
  selector: 'app-patient-requests-page',
  imports: [CommonModule, MatFormFieldModule, MatInputModule, MatTableModule, MatButtonModule, MatIconModule, MatTooltipModule, MatSortModule, MatTabsModule, NgxMaskPipe],
  templateUrl: './patient-requests-page.html',
  styleUrl: './patient-requests-page.scss',
})
export class PatientRequestsPage implements OnInit {

  sort = viewChild.required(MatSort);
  
  displayedOwnerColumns: string[] = ['bookmark','patient','cns','type','consultation_date','status','actions'];
  ownerDataSource = signal<MatTableDataSource<PatientRequest>>(new MatTableDataSource());
  applyOwnerFilter(event: Event) {
    const FILTER_VALUE = (event.target as HTMLInputElement).value;
    this.ownerDataSource().filter = FILTER_VALUE.trim().toLowerCase();
  }

  displayedProcessColumns: string[] = ['patient','cns','type','consultation_date','responsible','actions'];
  processDataSource = signal<MatTableDataSource<PatientRequest>>(new MatTableDataSource());
  applyProcessFilter(event: Event) {
    const FILTER_VALUE = (event.target as HTMLInputElement).value;
    this.processDataSource().filter = FILTER_VALUE.trim().toLowerCase();
  }

  displayedOthersColumns: string[] = ['patient','cns','type','consultation_date','responsible','actions'];
  othersDataSource = signal<MatTableDataSource<PatientRequest>>(new MatTableDataSource());
  applyOthersFilter(event: Event) {
    const FILTER_VALUE = (event.target as HTMLInputElement).value;
    this.othersDataSource().filter = FILTER_VALUE.trim().toLowerCase();
  }

  constructor(
    private patientRequestService: PatientRequestService,
    private dialog: MatDialog,
    private route: ActivatedRoute
  ) {
    TFD_PATIENT_REQUESTS_CHANNEL.onmessage = (message) => {
      if (message.data === 'update') {
        this.upgradePatientRequests()
      }
    }
  }

  ngOnInit(): void {
    this.getPatientRequests()
  }

  getPatientRequests() {
    this.loading()
    this.patientRequestService.getPatientRequests().subscribe({
      next: (response) => {
        this.ownerDataSource.set(new MatTableDataSource(response
          .filter((patient_request: any) => (!patient_request.medical_professional || patient_request.back_to_owner) && patient_request.owner)
          .map((item: any) => {return {
            name: item.report.patient_care.patient.name,
            cns: item.report.patient_care.patient.cns,
            type: item.type,
            consultation_date: item.consultation_date,
            status: item.status,
            ...item
          }})
        ))
        this.othersDataSource.set(new MatTableDataSource(response
          .filter((patient_request: any) => !patient_request.owner)
          .map((item: any) => {return {
            name: item.report.patient_care.patient.name,
            cns: item.report.patient_care.patient.cns,
            type: item.type,
            consultation_date: item.consultation_date,
            status: item.status,
            ...item
          }})
        ))
        this.processDataSource.set(new MatTableDataSource(response
          .filter((patient_request: any) => patient_request.medical_professional && patient_request.owner && !patient_request.back_to_owner)
          .map((item: any) => {return {
            name: item.report.patient_care.patient.name,
            cns: item.report.patient_care.patient.cns,
            type: item.type,
            consultation_date: item.consultation_date,
            status: item.status,
            ...item
          }})
        ))
        this.othersDataSource().sort = this.sort()
      },
      complete: () => {
        this.loadingDialog.close()
      }
    })
  }

  upgradePatientRequests() {
    this.patientRequestService.getPatientRequests().subscribe({
      next: (response) => {
        this.ownerDataSource.set(new MatTableDataSource(response
          .filter((patient_request: any) => (!patient_request.medical_professional || patient_request.back_to_owner) && patient_request.owner)
          .map((item: any) => {return {
            name: item.report.patient_care.patient.name,
            cns: item.report.patient_care.patient.cns,
            type: item.type,
            consultation_date: item.consultation_date,
            status: item.status,
            ...item
          }})
        ))
        this.othersDataSource.set(new MatTableDataSource(response
          .filter((patient_request: any) => !patient_request.owner)
          .map((item: any) => {return {
            name: item.report.patient_care.patient.name,
            cns: item.report.patient_care.patient.cns,
            type: item.type,
            consultation_date: item.consultation_date,
            status: item.status,
            ...item
          }})
        ))
        this.processDataSource.set(new MatTableDataSource(response
          .filter((patient_request: any) => patient_request.medical_professional && patient_request.owner && !patient_request.back_to_owner)
          .map((item: any) => {return {
            name: item.report.patient_care.patient.name,
            cns: item.report.patient_care.patient.cns,
            type: item.type,
            consultation_date: item.consultation_date,
            status: item.status,
            ...item
          }})
        ))
        this.othersDataSource().sort = this.sort()
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
    const ROLES = this.route.parent?.parent?.snapshot.data['user'].roles
    for (const item of ROLES) {
      if (item.permissions.filter((permission: Permission) => permission.name == name).length > 0)
        return false 
    }
    return true
  }

  checkStatus(patient_request: PatientRequest) {
    if (patient_request.medical_status && patient_request.social_status)
      return true
    return false
  }

  haltedPatientRequest(patient_request: PatientRequest) {
    this.dialog.open(HaltedPatientRequestComponent, {
      width: '400px',
      height: 'auto',
      disableClose: true,
      autoFocus: false,
      data: {
        patient_request: patient_request
      }
    }).afterClosed().subscribe(result => {
      if (result) {
        this.upgradePatientRequests()
        TFD_PATIENT_REQUESTS_CHANNEL.postMessage('update')
      }
    })
  }

  patientRequestAttachments(patient_request: PatientRequest) {
    this.dialog.open(PatientRequestAttachmentsComponent, {
      width: '600px',
      disableClose: true,
      autoFocus: false,
      data: {
        patient_request: patient_request,
      }
    })
  }

  updatePatientRequest(patient_request: PatientRequest) {
    this.dialog.open(UpdatePatientRequestComponent, {
      width: '800px',
      height: 'auto',
      disableClose: true,
      autoFocus: false,
      data: {
        patient_request: patient_request,
      }
    }).afterClosed().subscribe(result => {
      if (result) {
        this.upgradePatientRequests()
        TFD_PATIENT_REQUESTS_CHANNEL.postMessage('update')
      }
    })
  }

  deletePatientRequest(patient_request: PatientRequest) {
    this.dialog.open(DeletePatientRequestComponent, {
      width: '400px',
      disableClose: true,
      autoFocus: false,
      data: {
        patient_request: patient_request
      }
    }).afterClosed().subscribe(result => {
      if (result) {
        this.upgradePatientRequests()
        TFD_PATIENT_REQUESTS_CHANNEL.postMessage('update')
      }
    })
  }

  processPatientRequest(patient_request: PatientRequest) {
    this.dialog.open(ProcessPatientRequestComponent, {
      width: '500px',
      height: 'auto',
      disableClose: true,
      autoFocus: false,
      data: {
        patient_request: patient_request,
      }
    }).afterClosed().subscribe(result => {
      if (result) {
        this.upgradePatientRequests()
        TFD_PATIENT_REQUESTS_CHANNEL.postMessage('update')
      }
    })
  }

  movePatientRequestFromProcesses(patient_request: PatientRequest) {
    this.dialog.open(MovePatientRequestFromProcessesComponent, {
      width: '400px',
      height: 'auto',
      disableClose: true,
      autoFocus: false,
      data: {
        patient_request: patient_request
      }
    }).afterClosed().subscribe(result => {
      if (result) {
        this.upgradePatientRequests()
        TFD_PATIENT_REQUESTS_CHANNEL.postMessage('update')
      }
    })
  }

  movePatientRequestFromOthers(patient_request: PatientRequest) {
    this.dialog.open(MovePatientRequestFromOthersComponent, {
      width: '400px',
      height: 'auto',
      disableClose: true,
      autoFocus: false,
      data: {
        patient_request: patient_request
      }
    }).afterClosed().subscribe(result => {
      if (result) {
        this.upgradePatientRequests()
        TFD_PATIENT_REQUESTS_CHANNEL.postMessage('update')
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

  undoMessage(message: string) {
    this.dialog.open(UndoMessageComponent, {
      width: '400px',
      disableClose: true,
      autoFocus: false,
      data: {
        message: message
      }
    })
  }

}
