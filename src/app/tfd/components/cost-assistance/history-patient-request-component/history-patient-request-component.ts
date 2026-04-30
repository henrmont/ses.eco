import { Component, inject, OnInit, signal } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MAT_DIALOG_DATA, MatDialog, MatDialogModule } from '@angular/material/dialog';
import {MatIconModule} from '@angular/material/icon';
import {MatTooltipModule} from '@angular/material/tooltip';
import {MatProgressSpinnerModule} from '@angular/material/progress-spinner';
import {MatExpansionModule} from '@angular/material/expansion';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { saveAs } from 'file-saver';
import { PatientRequest } from '../../../models/patient-request';
import { OpinionService } from '../../../services/opinion-service';
import { StorageService } from '../../../../core/services/storage-service';
import { ShowPatientRequestComponent } from '../../patient-request/show-patient-request-component/show-patient-request-component';
import { Opinion } from '../../../models/opinion';
import { CostAssistanceService } from '../../../services/cost-assistance-service';
import { MovePatientRequestFromHistoryComponent } from '../move-patient-request-from-history-component/move-patient-request-from-history-component';

@Component({
  selector: 'app-history-patient-request-component',
  imports: [CommonModule, MatDialogModule, MatButtonModule, MatIconModule, MatTooltipModule, MatProgressSpinnerModule, MatExpansionModule, MatCardModule],
  templateUrl: './history-patient-request-component.html',
  styleUrl: './history-patient-request-component.scss',
})
export class HistoryPatientRequestComponent implements OnInit {

  data = inject(MAT_DIALOG_DATA);
  isLoading = true;
  patient_requests = signal<PatientRequest[]>([])

  constructor(
    private dialog: MatDialog,
    private costAssistanceService: CostAssistanceService,
    private storageService: StorageService
  ) {}

  ngOnInit(): void {
    this.getHistoryPatientRequests();
  }

  getHistoryPatientRequests() {
    this.costAssistanceService.getHistoryPatientRequests(this.data.patient_request.report.id, this.data.patient_request.id).subscribe({
      next: (response) => {
        console.log(response)
        this.patient_requests.set(response)
      },
      complete: () => {
        this.isLoading = false;
      }
    })
  }

  download(archive: number, name: string) {
    this.storageService.download(archive).subscribe({
      next: (response) => {
        saveAs(response.archive,name)
      }
    })
  }

  clickEvent(event: MouseEvent) {
    event.stopPropagation();
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

  movePatientRequestFromHistory(patient_request: PatientRequest) {
    this.dialog.open(MovePatientRequestFromHistoryComponent, {
      width: '400px',
      disableClose: true,
      autoFocus: false,
      data: {
        patient_request: patient_request
      }
    }).afterClosed().subscribe(result => {
      if (result) {
        this.getHistoryPatientRequests()
      }
    })
  }

}
