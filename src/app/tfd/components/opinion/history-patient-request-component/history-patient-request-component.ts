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
import { ShowOpinionComponent } from '../show-opinion-component/show-opinion-component';
import { Opinion } from '../../../models/opinion';

@Component({
  selector: 'app-history-patient-request-component',
  imports: [CommonModule, MatDialogModule, MatButtonModule, MatIconModule, MatTooltipModule, MatProgressSpinnerModule, MatExpansionModule, MatCardModule],
  templateUrl: './history-patient-request-component.html',
  styleUrl: './history-patient-request-component.scss',
})
export class HistoryPatientRequestComponent {

  data = inject(MAT_DIALOG_DATA);
  isLoading = true;
  patient_requests = signal<PatientRequest[]>([])

  constructor(
    private dialog: MatDialog,
    private opinionService: OpinionService,
    private storageService: StorageService
  ) {}

  ngOnInit(): void {
    this.getHistoryPatientRequests();
  }

  getHistoryPatientRequests() {
    this.opinionService.getHistoryPatientRequests(this.data.patient_request.report.id, this.data.patient_request.id).subscribe({
      next: (response) => {
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

  showOpinion(opinion: Opinion) {
    this.dialog.open(ShowOpinionComponent, {
      width: '1200px',
      height: '700px',
      disableClose: true,
      autoFocus: false,
      data: {
        opinion: opinion,
      }
    })
  }

}
