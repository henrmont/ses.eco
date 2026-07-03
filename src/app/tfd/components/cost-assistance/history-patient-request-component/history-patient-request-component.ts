import { ChangeDetectionStrategy, Component, DestroyRef, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { finalize } from 'rxjs';
import { saveAs } from 'file-saver';

// Angular Material
import { MatButtonModule } from '@angular/material/button';
import { MAT_DIALOG_DATA, MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatExpansionModule } from '@angular/material/expansion';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatCardModule } from '@angular/material/card';

// Modelos, Serviços e Componentes Relacionados
import { PatientRequest } from '../../../models/patient-request';
import { Opinion } from '../../../models/opinion';
import { CostAssistanceService } from '../../../services/cost-assistance-service';
import { StorageService } from '../../../../core/services/storage-service';
import { ShowPatientRequestComponent } from '../../patient-request/show-patient-request-component/show-patient-request-component';
import { MovePatientRequestFromHistoryComponent } from '../move-patient-request-from-history-component/move-patient-request-from-history-component';
import { ShowOpinionComponent } from '../../opinion/show-opinion-component/show-opinion-component';

@Component({
  selector: 'app-history-patient-request-component',
  standalone: true,
  imports: [
    CommonModule,
    MatDialogModule,
    MatButtonModule,
    MatIconModule,
    MatTooltipModule,
    MatProgressSpinnerModule,
    MatExpansionModule,
    MatCardModule
  ],
  templateUrl: './history-patient-request-component.html',
  styleUrl: './history-patient-request-component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class HistoryPatientRequestComponent implements OnInit {
  // Injeções de dependência modernas via inject()
  protected readonly data = inject(MAT_DIALOG_DATA);
  private readonly dialog = inject(MatDialog);
  private readonly costAssistanceService = inject(CostAssistanceService);
  private readonly storageService = inject(StorageService);
  private readonly destroyRef = inject(DestroyRef);

  // Propriedades reativas expostas para o Template via Signals
  protected readonly isLoading = signal<boolean>(true);
  protected readonly patient_requests = signal<PatientRequest[]>([]);

  ngOnInit(): void {
    this.getHistoryPatientRequests();
  }

  /**
   * Busca o histórico de requisições de forma reativa e segura.
   */
  private getHistoryPatientRequests(): void {
    const reportId = this.data?.patient_request?.report?.id;
    const requestId = this.data?.patient_request?.id;

    if (!reportId || !requestId) {
      this.isLoading.set(false);
      return;
    }

    this.isLoading.set(true);

    this.costAssistanceService.getHistoryPatientRequests(reportId, requestId)
      .pipe(
        finalize(() => this.isLoading.set(false)),
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe({
        next: (response) => {
          this.patient_requests.set(response || []);
        },
        error: () => {}
      });
  }

  /**
   * Centraliza a abertura de modais com tipagem genérica básica para reutilização limpa.
   */
  private openDialog(component: any, data: any, options: { width?: string; height?: string } = {}): any {
    return this.dialog.open(component, {
      width: options.width || '1200px',
      height: options.height || '700px',
      disableClose: true,
      autoFocus: false,
      data
    });
  }

  // Métodos de ação disparados pelo template HTML (Modificadores Protected)
  protected download(archive: number, name: string): void {
    this.storageService.download(archive)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (response) => {
          if (response?.archive) {
            saveAs(response.archive, name);
          }
        },
        error: () => {}
      });
  }

  protected clickEvent(event: MouseEvent): void {
    event.stopPropagation();
  }

  protected showPatientRequest(patient_request: PatientRequest): void {
    this.openDialog(ShowPatientRequestComponent, { patient_request }, { width: '1000px', height: 'auto' });
  }

  protected showOpinion(opinion: Opinion): void {
    this.openDialog(ShowOpinionComponent, { opinion });
  }

  protected movePatientRequestFromHistory(patient_request: PatientRequest): void {
    this.openDialog(MovePatientRequestFromHistoryComponent, { patient_request }, { width: '400px', height: 'auto' })
      .afterClosed()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((result: any) => {
        if (result) {
          this.getHistoryPatientRequests();
        }
      });
  }
}