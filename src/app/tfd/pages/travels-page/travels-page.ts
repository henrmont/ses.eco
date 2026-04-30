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
import { Permission } from '../../models/permission';
import { ShowPatientRequestComponent } from '../../components/patient-request/show-patient-request-component/show-patient-request-component';
import { UndoMessageComponent } from '../../components/shared/undo-message-component/undo-message-component';
import { TravelService } from '../../services/travel-service';
import { HaltedPatientRequestComponent } from '../../components/travel/halted-patient-request-component/halted-patient-request-component';
import { PatientRequestAttachmentsComponent } from '../../components/patient-request/patient-request-attachments-component/patient-request-attachments-component';
import { PatientCare } from '../../models/patient-care';
import { PatientEscortsComponent } from '../../components/patient/patient-escorts-component/patient-escorts-component';
import { UndoPatientRequestComponent } from '../../components/travel/undo-patient-request-component/undo-patient-request-component';
import { FinishPatientRequestTravelComponent } from '../../components/travel/finish-patient-request-travel-component/finish-patient-request-travel-component';
import { MovePatientRequestFromFinishedComponent } from '../../components/travel/move-patient-request-from-finished-component/move-patient-request-from-finished-component';
import { PatientRequestTravelsComponent } from '../../components/travel/patient-request-travels-component/patient-request-travels-component';

const TFD_TRAVELS_CHANNEL = new BroadcastChannel('tfd-travels-channel');

@Component({
  selector: 'app-travels-page',
  imports: [CommonModule, MatFormFieldModule, MatInputModule, MatTableModule, MatButtonModule, MatIconModule, MatTooltipModule, MatSortModule, MatTabsModule, NgxMaskPipe],
  templateUrl: './travels-page.html',
  styleUrl: './travels-page.scss',
})
export class TravelsPage implements OnInit {

  sort = viewChild.required(MatSort);
    
  displayedOwnerColumns: string[] = ['bookmark','patient','cns','type','consultation_date','status','actions'];
  ownerDataSource = signal<MatTableDataSource<PatientRequest>>(new MatTableDataSource());
  applyOwnerFilter(event: Event) {
    const FILTER_VALUE = (event.target as HTMLInputElement).value;
    this.ownerDataSource().filter = FILTER_VALUE.trim().toLowerCase();
  }

  displayedFinishColumns: string[] = ['patient','cns','type','consultation_date','responsible','actions'];
  finishDataSource = signal<MatTableDataSource<PatientRequest>>(new MatTableDataSource());
  applyFinishFilter(event: Event) {
    const FILTER_VALUE = (event.target as HTMLInputElement).value;
    this.finishDataSource().filter = FILTER_VALUE.trim().toLowerCase();
  }

  displayedOthersColumns: string[] = ['patient','cns','type','consultation_date','responsible','actions'];
  othersDataSource = signal<MatTableDataSource<PatientRequest>>(new MatTableDataSource());
  applyOthersFilter(event: Event) {
    const FILTER_VALUE = (event.target as HTMLInputElement).value;
    this.othersDataSource().filter = FILTER_VALUE.trim().toLowerCase();
  }

  constructor(
    private travelService: TravelService,
    private dialog: MatDialog,
    private route: ActivatedRoute
  ) {
    TFD_TRAVELS_CHANNEL.onmessage = (message) => {
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
    this.travelService.getPatientRequests().subscribe({
      next: (response) => {
        this.ownerDataSource.set(new MatTableDataSource(response
          .filter((patient_request: any) => !patient_request.is_travel_finished && patient_request.travel)
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
          .filter((patient_request: any) => !patient_request.is_travel_finished && !patient_request.travel)
          .map((item: any) => {return {
            name: item.report.patient_care.patient.name,
            cns: item.report.patient_care.patient.cns,
            type: item.type,
            consultation_date: item.consultation_date,
            status: item.status,
            ...item
          }})
        ))
        this.finishDataSource.set(new MatTableDataSource(response
          .filter((patient_request: any) => patient_request.is_travel_finished && patient_request.travel)
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
    this.travelService.getPatientRequests().subscribe({
      next: (response) => {
        this.ownerDataSource.set(new MatTableDataSource(response
          .filter((patient_request: any) => !patient_request.is_travel_finished && patient_request.travel)
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
          .filter((patient_request: any) => !patient_request.is_travel_finished && !patient_request.travel)
          .map((item: any) => {return {
            name: item.report.patient_care.patient.name,
            cns: item.report.patient_care.patient.cns,
            type: item.type,
            consultation_date: item.consultation_date,
            status: item.status,
            ...item
          }})
        ))
        this.finishDataSource.set(new MatTableDataSource(response
          .filter((patient_request: any) => patient_request.is_travel_finished && patient_request.travel)
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
        TFD_TRAVELS_CHANNEL.postMessage('update')
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

  patientEscorts(patient_request: PatientRequest) {
    this.dialog.open(PatientEscortsComponent, {
      width: '1200px',
      disableClose: true,
      autoFocus: false,
      data: {
        patient_care: patient_request.report?.patient_care,
        patient_request: patient_request,
        permissions: this.route.parent?.parent?.snapshot.data['user'].roles
      }
    })
  }

  undoPatientRequest(patient_request: PatientRequest) {
    this.dialog.open(UndoPatientRequestComponent, {
      width: '500px',
      disableClose: true,
      autoFocus: false,
      data: {
        patient_request: patient_request,
      }
    }).afterClosed().subscribe(result => {
      if (result) {
        this.upgradePatientRequests()
        TFD_TRAVELS_CHANNEL.postMessage('update')
      }
    })
  }

  finishPatientRequestTravel(patient_request: PatientRequest) {
    this.dialog.open(FinishPatientRequestTravelComponent, {
      width: '400px',
      disableClose: true,
      autoFocus: false,
      data: {
        patient_request: patient_request,
      }
    }).afterClosed().subscribe(result => {
      if (result) {
        this.upgradePatientRequests()
        TFD_TRAVELS_CHANNEL.postMessage('update')
      }
    })
  }

  movePatientRequestFromFinished(patient_request: PatientRequest) {
    this.dialog.open(MovePatientRequestFromFinishedComponent, {
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
        TFD_TRAVELS_CHANNEL.postMessage('update')
      }
    })
  }

  movePatientRequestFromOthers(patient_request: PatientRequest) {
    // this.dialog.open(UpdatePatientRequestComponent, {
    //   width: '800px',
    //   height: 'auto',
    //   disableClose: true,
    //   autoFocus: false,
    //   data: {
    //     patient_request: patient_request,
    //   }
    // }).afterClosed().subscribe(result => {
    //   if (result) {
    //     this.upgradePatientRequests()
    //     TFD_TRAVELS_CHANNEL.postMessage('update')
    //   }
    // })
  }

  patientRequestTravels(patient_request: PatientRequest) {
    this.dialog.open(PatientRequestTravelsComponent, {
      width: '1000px',
      height: 'auto',
      disableClose: true,
      autoFocus: false,
      data: {
        patient_request: patient_request
      }
    }).afterClosed().subscribe(result => {
      if (result) {
        this.upgradePatientRequests()
        TFD_TRAVELS_CHANNEL.postMessage('update')
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
