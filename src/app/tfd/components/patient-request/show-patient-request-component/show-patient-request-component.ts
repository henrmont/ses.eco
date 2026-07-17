import { ChangeDetectionStrategy, Component, DestroyRef, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { MAT_DIALOG_DATA, MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { saveAs } from 'file-saver';

import { StorageService } from '../../../../core/services/storage-service';
import { PatientCare } from '../../../models/patient-care';
import { Opinion } from '../../../models/opinion';
import { Travel } from '../../../models/travel';
import { CostAssistance } from '../../../models/cost-assistance';
import { Accountability } from '../../../models/accountability';

import { ShowPatientComponent } from '../../patient/show-patient-component/show-patient-component';
import { ShowPatientReportComponent } from '../../patient/show-patient-report-component/show-patient-report-component';
import { ShowOpinionComponent } from '../../opinion/show-opinion-component/show-opinion-component';
import { ShowTravelComponent } from '../../travel/show-travel-component/show-travel-component';
import { ShowCostAssistanceComponent } from '../../cost-assistance/show-cost-assistance-component/show-cost-assistance-component';
import { ShowAccountabilityComponent } from '../../accountability/show-accountability-component/show-accountability-component';
import { Overlay } from '@angular/cdk/overlay';

@Component({
  selector: 'app-show-patient-request-component',
  imports: [
    CommonModule, 
    MatDialogModule, 
    MatButtonModule, 
    MatCardModule, 
    MatIconModule
  ],
  templateUrl: './show-patient-request-component.html',
  styleUrl: './show-patient-request-component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush // ⚡ Performance máxima para componentes de leitura
})
export class ShowPatientRequestComponent {
  // Injeções de dependência modernas via inject()
  protected readonly data = inject(MAT_DIALOG_DATA);
  private readonly storageService = inject(StorageService);
  private readonly dialog = inject(MatDialog);
  private readonly overlay = inject(Overlay);
  private readonly destroyRef = inject(DestroyRef);

  // Agrega as propriedades do paciente e do atendimento em um único objeto de leitura para o template
  protected readonly patient = {
    ...this.data?.patient_request?.report?.patient_care?.patient,
    ...this.data?.patient_request?.report?.patient_care
  };

  protected download(archiveId: number, name: string): void {
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
    this.openSubDialog(ShowPatientComponent, { patient_care: patientCare }, '1200px', '700px');
  }

  protected showPatientReport(report: any): void {
    this.openSubDialog(ShowPatientReportComponent, { report }, '800px');
  }

  protected showOpinion(opinion: Opinion): void {
    this.openSubDialog(ShowOpinionComponent, { opinion }, '1200px', '700px');
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