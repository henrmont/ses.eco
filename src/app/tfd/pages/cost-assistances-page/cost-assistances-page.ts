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
import { NgxMaskPipe } from 'ngx-mask';
import { LoadingComponent } from '../../../core/components/loading-component/loading-component';
import { PatientRequest } from '../../models/patient-request';
import { Permission } from '../../models/permission';
import { CostAssistanceService } from '../../services/cost-assistance-service';
import { HaltedPatientRequestComponent } from '../../components/cost-assistance/halted-patient-request-component/halted-patient-request-component';
import { ShowPatientRequestComponent } from '../../components/patient-request/show-patient-request-component/show-patient-request-component';
import { PatientRequestAttachmentsComponent } from '../../components/patient-request/patient-request-attachments-component/patient-request-attachments-component';
import { PatientRequestCostAssistancesComponent } from '../../components/cost-assistance/patient-request-cost-assistances-component/patient-request-cost-assistances-component';
import { HistoryPatientRequestComponent } from '../../components/cost-assistance/history-patient-request-component/history-patient-request-component';
import { MovePatientRequestFromProcessesComponent } from '../../components/cost-assistance/move-patient-request-from-processes-component/move-patient-request-from-processes-component';
import { MovePatientRequestFromOthersComponent } from '../../components/cost-assistance/move-patient-request-from-others-component/move-patient-request-from-others-component';
import { UndoPatientRequestComponent } from '../../components/cost-assistance/undo-patient-request-component/undo-patient-request-component';
import { UndoMessageComponent } from '../../components/shared/undo-message-component/undo-message-component';
import { ProcessPatientRequestToPaymentComponent } from '../../components/cost-assistance/process-patient-request-to-payment-component/process-patient-request-to-payment-component';

const TFD_COST_ASSISTANCES_CHANNEL = new BroadcastChannel('tfd-cost-assistances-channel');

@Component({
  selector: 'app-cost-assistances-page',
  imports: [CommonModule, MatFormFieldModule, MatInputModule, MatTableModule, MatButtonModule, MatIconModule, MatTooltipModule, MatSortModule, MatTabsModule, NgxMaskPipe],
  templateUrl: './cost-assistances-page.html',
  styleUrl: './cost-assistances-page.scss',
})
export class CostAssistancesPage implements OnInit {

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
    private costAssistanceService: CostAssistanceService,
    private dialog: MatDialog,
    private route: ActivatedRoute
  ) {
    TFD_COST_ASSISTANCES_CHANNEL.onmessage = (message) => {
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
    this.costAssistanceService.getPatientRequests().subscribe({
      next: (response) => {
        this.ownerDataSource.set(new MatTableDataSource(response
          .filter((patient_request: any) => (!patient_request.payment_professional || patient_request.back_to_cost_assistance) && patient_request.cost_assistance)
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
          .filter((patient_request: any) => !patient_request.cost_assistance)
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
          .filter((patient_request: any) => patient_request.payment_professional && patient_request.cost_assistance && !patient_request.back_to_cost_assistance)
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
    this.costAssistanceService.getPatientRequests().subscribe({
      next: (response) => {
        this.ownerDataSource.set(new MatTableDataSource(response
          .filter((patient_request: any) => (!patient_request.payment_professional || patient_request.back_to_cost_assistance) && patient_request.cost_assistance)
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
          .filter((patient_request: any) => !patient_request.cost_assistance)
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
          .filter((patient_request: any) => patient_request.payment_professional && patient_request.cost_assistance && !patient_request.back_to_cost_assistance)
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
        TFD_COST_ASSISTANCES_CHANNEL.postMessage('update')
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

  costAssistances(patient_request: PatientRequest) {
    this.dialog.open(PatientRequestCostAssistancesComponent, {
      width: '1200px',
      height: 'auto',
      disableClose: true,
      autoFocus: false,
      data: {
        patient_request: patient_request,
        permissions: this.route.parent?.parent?.snapshot.data['user'].roles
      }
    }).afterClosed().subscribe(result => {
      if (result) {
        this.upgradePatientRequests()
        TFD_COST_ASSISTANCES_CHANNEL.postMessage('update')
      }
    })
  }

  history(patient_request: PatientRequest) {
    this.dialog.open(HistoryPatientRequestComponent, {
      width: '1000px',
      height: 'auto',
      disableClose: true,
      autoFocus: false,
      data: {
        patient_request: patient_request,
      }
    })
  }

  undoPatientRequest(patient_request: PatientRequest) {
    this.dialog.open(UndoPatientRequestComponent, {
      width: '500px',
      disableClose: true,
      autoFocus: false,
      data: {
        patient_request: patient_request
      }
    }).afterClosed().subscribe(result => {
      if (result) {
        this.upgradePatientRequests()
        TFD_COST_ASSISTANCES_CHANNEL.postMessage('update')
      }
    })
  }

  processPatientRequest(patient_request: PatientRequest) {
    this.dialog.open(ProcessPatientRequestToPaymentComponent, {
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
        TFD_COST_ASSISTANCES_CHANNEL.postMessage('update')
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
        TFD_COST_ASSISTANCES_CHANNEL.postMessage('update')
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
        TFD_COST_ASSISTANCES_CHANNEL.postMessage('update')
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
