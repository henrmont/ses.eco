import { ChangeDetectionStrategy, Component, DestroyRef, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { MAT_DIALOG_DATA, MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { saveAs } from 'file-saver';

import { StorageService } from '../../../../core/services/storage-service';
import { PatientCare } from '../../../models/patient-care.model';
import { PatientRequestOpinion } from '../../../models/patient-request-opinion.model';
import { Travel } from '../../../models/travel';
import { CostAssistance } from '../../../models/cost-assistance';
import { Accountability } from '../../../models/accountability';

import { PatientDetailComponent } from '../../patient/patient-detail/patient-detail.component';
import { PatientReportDetailComponent } from '../../patient/patient-report-detail/patient-report-detail.component';
import { PatientRequestOpinionDetailComponent } from '../../patient-request-opinions/patient-request-opinion-detail/patient-request-opinion-detail.component';
import { ShowTravelComponent } from '../../travel/show-travel-component/show-travel-component';
import { ShowCostAssistanceComponent } from '../../cost-assistance/show-cost-assistance-component/show-cost-assistance-component';
import { ShowAccountabilityComponent } from '../../accountability/show-accountability-component/show-accountability-component';
import { Overlay } from '@angular/cdk/overlay';
import { PatientReport } from '../../../models/patient-report.model';

@Component({
  selector: 'app-patient-request-detail',
  imports: [
    CommonModule, 
    MatDialogModule, 
    MatButtonModule, 
    MatCardModule, 
    MatIconModule
  ],
  templateUrl: './patient-request-detail.component.html',
  styleUrl: './patient-request-detail.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush // ⚡ Performance máxima para componentes de leitura
})
export class PatientRequestDetailComponent {
  // Injeções de dependência modernas via inject()
  protected readonly data = inject(MAT_DIALOG_DATA);
  private readonly storageService = inject(StorageService);
  private readonly dialog = inject(MatDialog);
  private readonly overlay = inject(Overlay);
  private readonly destroyRef = inject(DestroyRef);

  // Agrega as propriedades do paciente e do atendimento em um único objeto de leitura para o template
  protected readonly patient = {
    ...this.data?.patientRequest?.report?.patient_care?.patient,
    ...this.data?.patientRequest?.report?.patient_care
  };

  protected download(archiveId: number | null | undefined, name: string): void {
    if (!archiveId) return;

    this.storageService.download(archiveId)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (response) => {
          if (response?.archive) {
            saveAs(response.archive, name);
          }
        }
      });
  }

  /**
   * Método centralizado para gerenciar a abertura reativa de sub-modais de detalhamento,
   * espelhando o comportamento e as travas de fechamento da PatientRequestsPage.
   */
  private openSubDialog(component: any, data: any, width: string, height = 'auto'): void {
    this.dialog.open(component, {
      width,
      height,
      disableClose: true,
      autoFocus: false,
      scrollStrategy: this.overlay.scrollStrategies.noop(),
      data
    }).afterClosed()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(); // Inscrição limpa e segura contra memory leaks
  }

  /**
   * Gerenciadores de Ação disparados a partir do template HTML.
   * Utilizam exatamente as mesmas dimensões mapeadas na listagem original.
   */
  protected showPatient(patientCare: PatientCare): void {
    this.openSubDialog(PatientDetailComponent, { patient_care: patientCare }, '1200px', '700px');
  }

  protected showPatientReport(report: PatientReport): void {
    this.openSubDialog(PatientReportDetailComponent, { report }, '800px');
  }

  protected showOpinion(opinion: PatientRequestOpinion): void {
    this.openSubDialog(PatientRequestOpinionDetailComponent, { opinion }, '1200px', '700px');
  }

  protected showTravel(travel: Travel): void {
    this.openSubDialog(ShowTravelComponent, { travel }, '800px');
  }

  protected showCostAssistance(costAssistance: CostAssistance): void {
    this.openSubDialog(ShowCostAssistanceComponent, { cost_assistance: costAssistance }, '800px');
  }

  protected showAccountability(accountability: Accountability): void {
    this.openSubDialog(ShowAccountabilityComponent, { accountability }, '800px');
  }
}