import { Component, inject } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import {MatCardModule} from '@angular/material/card';
import {MatIconModule} from '@angular/material/icon';
import { CommonModule } from '@angular/common';
import { saveAs } from 'file-saver';
import { StorageService } from '../../../../core/services/storage-service';
import { PatientCare } from '../../../models/patient-care';
import { ShowPatientComponent } from '../../patient/show-patient-component/show-patient-component';
import { ShowPatientReportComponent } from '../../patient/show-patient-report-component/show-patient-report-component';
import { Opinion } from '../../../models/opinion';
import { ShowOpinionComponent } from '../../opinion/show-opinion-component/show-opinion-component';
import { ShowTravelComponent } from '../../travel/show-travel-component/show-travel-component';
import { Travel } from '../../../models/travel';
import { ShowCostAssistanceComponent } from '../../cost-assistance/show-cost-assistance-component/show-cost-assistance-component';
import { CostAssistance } from '../../../models/cost-assistance';
import { Accountability } from '../../../models/accountability';
import { ShowAccountabilityComponent } from '../../accountability/show-accountability-component/show-accountability-component';

@Component({
  selector: 'app-show-patient-request-component',
  imports: [CommonModule, MatDialogModule, MatButtonModule, MatCardModule, MatIconModule],
  templateUrl: './show-patient-request-component.html',
  styleUrl: './show-patient-request-component.scss',
})
export class ShowPatientRequestComponent {

  data = inject(MAT_DIALOG_DATA)
  patient = {...this.data.patient_request.report.patient_care.patient, ...this.data.patient_request.report.patient_care}

  constructor (
    private storageService: StorageService,
    private dialog: MatDialog,
  ) {}

  download(archive: number, name: string) {
    this.storageService.download(archive).subscribe({
      next: (response) => {
        saveAs(response.archive,name)
      }
    })
  }

  showPatient(patient_care: PatientCare) {
    this.dialog.open(ShowPatientComponent, {
      width: '1200px',
      height: '700px',
      disableClose: true,
      autoFocus: false,
      data: {
        patient_care: patient_care
      }
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

  showTravel(travel: Travel) {
    this.dialog.open(ShowTravelComponent, {
      width: '800px',
      disableClose: true,
      autoFocus: false,
      data: {
        travel: travel,
      }
    })
  }

  showCostAssistance(cost_assistance: CostAssistance) {
    this.dialog.open(ShowCostAssistanceComponent, {
      width: '800px',
      disableClose: true,
      autoFocus: false,
      data: {
        cost_assistance: cost_assistance,
      }
    })
  }

  showAccountability(accountability: Accountability) {
    this.dialog.open(ShowAccountabilityComponent, {
      width: '800px',
      disableClose: true,
      autoFocus: false,
      data: {
        accountability: accountability,
      }
    })
  }


}
