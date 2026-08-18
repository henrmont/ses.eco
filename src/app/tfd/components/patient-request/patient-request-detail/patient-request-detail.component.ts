import { ChangeDetectionStrategy, Component, DestroyRef, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Overlay } from '@angular/cdk/overlay';

// Material Modules
import { MAT_DIALOG_DATA, MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';

// File Handling
import { saveAs } from 'file-saver';

// Services & Models
import { StorageService } from '../../../../core/services/storage-service';
import { PatientCare } from '../../../models/patient-care.model';
import { PatientReport } from '../../../models/patient-report.model';
import { PatientRequestOpinion } from '../../../models/patient-request-opinion.model';
import { PatientRequestTravel } from '../../../models/patient-request-travel.model';
import { CostAssistance } from '../../../models/cost-assistance';
import { Accountability } from '../../../models/accountability';
import { Patient } from '../../../models/patient.model';

// Sub-dialogs
import { PatientDetailComponent } from '../../patient/patient-detail/patient-detail.component';
import { PatientReportDetailComponent } from '../../patient/patient-report-detail/patient-report-detail.component';
import { PatientRequestOpinionDetailComponent } from '../../patient-request-opinions/patient-request-opinion-detail/patient-request-opinion-detail.component';
import { PatientRequestTravelDetailComponent } from '../../patient-request-travels/patient-request-travel-detail/patient-request-travel-detail.component';
import { ShowCostAssistanceComponent } from '../../cost-assistance/show-cost-assistance-component/show-cost-assistance-component';
import { ShowAccountabilityComponent } from '../../accountability/show-accountability-component/show-accountability-component';

// Define o tipo aceito para as propriedades do Modal
type PatientRequestSubDialogData =
  { patient: Patient | undefined }
  | { patient_care: PatientCare }
  | { patient_report: PatientReport }
  | { opinion: PatientRequestOpinion }
  | { travel: PatientRequestTravel }
  | { cost_assistance: CostAssistance }
  | { accountability: Accountability };

@Component({
  selector: 'app-patient-request-detail',
  standalone: true,
  imports: [
    CommonModule, 
    MatDialogModule, 
    MatButtonModule, 
    MatCardModule, 
    MatIconModule,
    MatProgressSpinnerModule
  ],
  templateUrl: './patient-request-detail.component.html',
  styleUrl: './patient-request-detail.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class PatientRequestDetailComponent {
  // ==========================================
  // Injeção de Dependências
  // ==========================================
  protected readonly data = inject(MAT_DIALOG_DATA);
  private readonly storageService = inject(StorageService);
  private readonly dialog = inject(MatDialog);
  private readonly overlay = inject(Overlay);
  private readonly destroyRef = inject(DestroyRef);

  // ==========================================
  // Operações de Arquivo / Download
  // ==========================================
  protected download(archiveId: number | null | undefined, name: string): void {
    if (!archiveId) return;

    this.storageService.download(archiveId)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: response => {
          if (response?.archive) {
            saveAs(response.archive, name);
          }
        }
      });
  }

  // ==========================================
  // Gestão Centralizada de Dialogs
  // ==========================================
  private openSubDialog<T>(
    component: new (...args: any[]) => T,
      data: PatientRequestSubDialogData,
      width = '1200px',
      height = 'auto',
  ): void {
    this.dialog.open(component, {
      width,
      height,
      disableClose: true,
      autoFocus: false,
      scrollStrategy: this.overlay.scrollStrategies.noop(),
      data
    }).afterClosed()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe();
  }

  // ==========================================
  // Handlers para Abertura de Sub-Modais
  // ==========================================
  protected patientDetail(patientCare: PatientCare): void {
    if (!patientCare) return;
    this.openSubDialog(PatientDetailComponent, { patient: patientCare.patient }, '1200px', '700px');
  }

  protected patientReportDetail(patientReport: PatientReport): void {
    if (!patientReport) return;
    this.openSubDialog(PatientReportDetailComponent, { patient_report: patientReport }, '800px');
  }

  protected patientRequestOpinionDetail(opinion: PatientRequestOpinion): void {
    if (!opinion) return;
    this.openSubDialog(PatientRequestOpinionDetailComponent, { opinion }, '1200px', '700px');
  }

  protected patientRequestTravelDetail(travel: PatientRequestTravel): void {
    if (!travel) return;
    this.openSubDialog(PatientRequestTravelDetailComponent, { travel }, '800px');
  }

  protected showCostAssistance(costAssistance: CostAssistance): void {
    if (!costAssistance) return;
    this.openSubDialog(ShowCostAssistanceComponent, { cost_assistance: costAssistance }, '800px');
  }

  protected showAccountability(accountability: Accountability): void {
    if (!accountability) return;
    this.openSubDialog(ShowAccountabilityComponent, { accountability }, '800px');
  }
}