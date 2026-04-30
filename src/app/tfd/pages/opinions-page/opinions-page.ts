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
import { OpinionService } from '../../services/opinion-service';
import { ProcessPatientRequestToSocialComponent } from '../../components/opinion/process-patient-request-to-social-component/process-patient-request-to-social-component';
import { OpinionsComponent } from '../../components/opinion/opinions-component/opinions-component';
import { UndoPatientRequestComponent } from '../../components/opinion/undo-patient-request-component/undo-patient-request-component';
import { UndoMessageComponent } from '../../components/shared/undo-message-component/undo-message-component';
import { PatientRequestAttachmentsComponent } from '../../components/patient-request/patient-request-attachments-component/patient-request-attachments-component';
import { ArchivePatientRequestComponent } from '../../components/opinion/archive-patient-request-component/archive-patient-request-component';
import { HaltedPatientRequestComponent } from '../../components/opinion/halted-patient-request-component/halted-patient-request-component';
import { ShowPatientRequestComponent } from '../../components/patient-request/show-patient-request-component/show-patient-request-component';
import { MovePatientRequestFromOthersComponent } from '../../components/opinion/move-patient-request-from-others-component/move-patient-request-from-others-component';
import { MovePatientRequestFromProcessesComponent } from '../../components/opinion/move-patient-request-from-processes-component/move-patient-request-from-processes-component';
import { HistoryPatientRequestComponent } from '../../components/opinion/history-patient-request-component/history-patient-request-component';
import { ProcessPatientRequestToCostAssistanceAndTravelComponent } from '../../components/opinion/process-patient-request-to-cost-assistance-and-travel-component/process-patient-request-to-cost-assistance-and-travel-component';

const TFD_OPINIONS_CHANNEL = new BroadcastChannel('tfd-opinions-channel');

@Component({
  selector: 'app-opinions-page',
  imports: [CommonModule, MatFormFieldModule, MatInputModule, MatTableModule, MatButtonModule, MatIconModule, MatTooltipModule, MatSortModule, MatTabsModule, NgxMaskDirective, NgxMaskPipe],
  templateUrl: './opinions-page.html',
  styleUrl: './opinions-page.scss',
})
export class OpinionsPage implements OnInit {

  sort = viewChild.required(MatSort);
  type!: string

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
    private opinionService: OpinionService,
    private dialog: MatDialog,
    private route: ActivatedRoute
  ) {
    TFD_OPINIONS_CHANNEL.onmessage = (message) => {
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
    this.opinionService.getType().subscribe({
      next: (response) => {
        if (response == 'Médico') {
          this.opinionService.getPatientRequests().subscribe({
            next: (response) => {
              this.type = 'medical';
              this.ownerDataSource.set(new MatTableDataSource(response
                .filter((patient_request: any) => (!patient_request.social_professional || patient_request.back_to_medical) && patient_request.medical)
                .map((item: any) => {return {
                  name: item.report.patient_care.patient.name,
                  cns: item.report.patient_care.patient.cns,
                  type: item.type,
                  consultation_date: item.consultation_date,
                  ...item
                }})
              ))
              this.processDataSource.set(new MatTableDataSource(response
                .filter((patient_request: any) => (patient_request.social_professional && !patient_request.back_to_medical) && patient_request.medical)
                .map((item: any) => {return {
                  name: item.report.patient_care.patient.name,
                  cns: item.report.patient_care.patient.cns,
                  type: item.type,
                  consultation_date: item.consultation_date,
                  professional: item.social_professional.name,
                  ...item
                }})
              ))
              this.othersDataSource.set(new MatTableDataSource(response
                .filter((patient_request: any) => patient_request.medical_professional && !patient_request.medical)
                .map((item: any) => {return {
                  name: item.report.patient_care.patient.name,
                  cns: item.report.patient_care.patient.cns,
                  type: item.type,
                  consultation_date: item.consultation_date,
                  professional: item.medical_professional.name,
                  ...item
                }})
              ))
              this.othersDataSource().sort = this.sort()
            },
            complete: () => {
              this.loadingDialog.close()
            }
          })
        } else {
          this.opinionService.getPatientRequests().subscribe({
            next: (response) => {
              this.type = 'social';
              this.ownerDataSource.set(new MatTableDataSource(response
                .filter((patient_request: any) => (!patient_request.cost_assistance_professional || patient_request.back_to_social) && patient_request.social && !patient_request.back_to_medical)
                .map((item: any) => {return {
                  name: item.report.patient_care.patient.name,
                  cns: item.report.patient_care.patient.cns,
                  type: item.type,
                  consultation_date: item.consultation_date,
                  ...item
                }})
              ))
              this.processDataSource.set(new MatTableDataSource(response
                .filter((patient_request: any) => (patient_request.cost_assistance_professional && !patient_request.back_to_social) && patient_request.social)
                .map((item: any) => {return {
                  name: item.report.patient_care.patient.name,
                  cns: item.report.patient_care.patient.cns,
                  type: item.type,
                  consultation_date: item.consultation_date,
                  professional: item.social_professional.name,
                  ...item
                }})
              ))
              this.othersDataSource.set(new MatTableDataSource(response
                .filter((patient_request: any) => patient_request.social_professional && !patient_request.social)
                .map((item: any) => {return {
                  name: item.report.patient_care.patient.name,
                  cns: item.report.patient_care.patient.cns,
                  type: item.type,
                  consultation_date: item.consultation_date,
                  professional: item.social_professional.name,
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
      }
    })
  }

  upgradePatientRequests() {
    if (this.type == 'medical') {
      this.opinionService.getPatientRequests().subscribe({
        next: (response) => {
          this.type = 'medical';
          this.ownerDataSource.set(new MatTableDataSource(response
            .filter((patient_request: any) => (!patient_request.social_professional || patient_request.back_to_medical) && patient_request.medical)
            .map((item: any) => {return {
              name: item.report.patient_care.patient.name,
              cns: item.report.patient_care.patient.cns,
              type: item.type,
              consultation_date: item.consultation_date,
              ...item
            }})
          ))
          this.processDataSource.set(new MatTableDataSource(response
            .filter((patient_request: any) => (patient_request.social_professional && !patient_request.back_to_medical) && patient_request.medical)
            .map((item: any) => {return {
              name: item.report.patient_care.patient.name,
              cns: item.report.patient_care.patient.cns,
              type: item.type,
              consultation_date: item.consultation_date,
              professional: item.social_professional.name,
              ...item
            }})
          ))
          this.othersDataSource.set(new MatTableDataSource(response
            .filter((patient_request: any) => patient_request.medical_professional && !patient_request.medical)
            .map((item: any) => {return {
              name: item.report.patient_care.patient.name,
              cns: item.report.patient_care.patient.cns,
              type: item.type,
              consultation_date: item.consultation_date,
              professional: item.medical_professional.name,
              ...item
            }})
          ))
          this.othersDataSource().sort = this.sort()
        },
      })
    } else {
      this.opinionService.getPatientRequests().subscribe({
        next: (response) => {
          this.type = 'social';
          this.ownerDataSource.set(new MatTableDataSource(response
            .filter((patient_request: any) => (!patient_request.cost_assistance_professional || patient_request.back_to_social) && patient_request.social && !patient_request.back_to_medical)
            .map((item: any) => {return {
              name: item.report.patient_care.patient.name,
              cns: item.report.patient_care.patient.cns,
              type: item.type,
              consultation_date: item.consultation_date,
              ...item
            }})
          ))
          this.processDataSource.set(new MatTableDataSource(response
            .filter((patient_request: any) => (patient_request.cost_assistance_professional && !patient_request.back_to_social) &&  patient_request.social)
            .map((item: any) => {return {
              name: item.report.patient_care.patient.name,
              cns: item.report.patient_care.patient.cns,
              type: item.type,
              consultation_date: item.consultation_date,
              professional: item.social_professional.name,
              ...item
            }})
          ))
          this.othersDataSource.set(new MatTableDataSource(response
            .filter((patient_request: any) => patient_request.social_professional && !patient_request.social)
            .map((item: any) => {return {
              name: item.report.patient_care.patient.name,
              cns: item.report.patient_care.patient.cns,
              type: item.type,
              consultation_date: item.consultation_date,
              professional: item.social_professional.name,
              ...item
            }})
          ))
          this.othersDataSource().sort = this.sort()
        },
      })
    }
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

  movePatientRequestFromOthers(patient_request: PatientRequest) {
    this.dialog.open(MovePatientRequestFromOthersComponent, {
      width: '400px',
      height: 'auto',
      disableClose: true,
      autoFocus: false,
      data: {
        patient_request: patient_request,
        type: this.type
      }
    }).afterClosed().subscribe(result => {
      if (result) {
        this.upgradePatientRequests()
        TFD_OPINIONS_CHANNEL.postMessage('update')
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
        patient_request: patient_request,
        type: this.type
      }
    }).afterClosed().subscribe(result => {
      if (result) {
        this.upgradePatientRequests()
        TFD_OPINIONS_CHANNEL.postMessage('update')
      }
    })
  }

  opinions(patient_request: PatientRequest) {
    this.dialog.open(OpinionsComponent, {
      width: '800px',
      height: 'auto',
      disableClose: true,
      autoFocus: false,
      data: {
        patient_request: patient_request,
        permissions: this.route.parent?.parent?.snapshot.data['user'].roles
      }
    })
  }

  history(patient_request: PatientRequest) {
    this.dialog.open(HistoryPatientRequestComponent, {
      width: '800px',
      height: 'auto',
      disableClose: true,
      autoFocus: false,
      data: {
        patient_request: patient_request,
        type: this.type
      }
    })
  }

  processPatientRequestToSocial(patient_request: PatientRequest) {
    this.dialog.open(ProcessPatientRequestToSocialComponent, {
      width: '500px',
      height: 'auto',
      disableClose: true,
      autoFocus: false,
      data: {
        patient_request: patient_request,
      }
    }).afterClosed().subscribe(result => {
      if (result) {
        this.getPatientRequests()
        TFD_OPINIONS_CHANNEL.postMessage('update')
      }
    })
  }

  processPatientRequestToCostAssistanceAndTravel(patient_request: PatientRequest) {
    this.dialog.open(ProcessPatientRequestToCostAssistanceAndTravelComponent, {
      width: '500px',
      height: 'auto',
      disableClose: true,
      autoFocus: false,
      data: {
        patient_request: patient_request,
      }
    }).afterClosed().subscribe(result => {
      if (result) {
        this.getPatientRequests()
        TFD_OPINIONS_CHANNEL.postMessage('update')
      }
    })
  }

  undoPatientRequest(patient_request: PatientRequest) {
    this.dialog.open(UndoPatientRequestComponent, {
      width: '500px',
      height: 'auto',
      disableClose: true,
      autoFocus: false,
      data: {
        patient_request: patient_request,
        type: this.type
      }
    }).afterClosed().subscribe(result => {
      if (result) {
        this.getPatientRequests()
        TFD_OPINIONS_CHANNEL.postMessage('update')
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

  haltedPatientRequest(patient_request: PatientRequest) {
    this.dialog.open(HaltedPatientRequestComponent, {
      width: '400px',
      height: 'auto',
      disableClose: true,
      autoFocus: false,
      data: {
        patient_request: patient_request,
        type: this.type
      }
    }).afterClosed().subscribe(result => {
      if (result) {
        this.getPatientRequests()
        TFD_OPINIONS_CHANNEL.postMessage('update')
      }
    })
  }

  archivePatientRequest(patient_request: PatientRequest) {
    this.dialog.open(ArchivePatientRequestComponent, {
      width: '400px',
      height: 'auto',
      disableClose: true,
      autoFocus: false,
      data: {
        patient_request: patient_request,
      }
    }).afterClosed().subscribe(result => {
      if (result) {
        this.getPatientRequests()
        TFD_OPINIONS_CHANNEL.postMessage('update')
      }
    })
  }

}
