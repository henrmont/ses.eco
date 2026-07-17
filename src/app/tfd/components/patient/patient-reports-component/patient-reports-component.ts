import { ChangeDetectionStrategy, Component, DestroyRef, OnInit, computed, inject, signal, ChangeDetectorRef } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { finalize } from 'rxjs';

// Angular Material
import { MatButtonModule } from '@angular/material/button';
import { MAT_DIALOG_DATA, MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTableDataSource, MatTableModule } from '@angular/material/table';
import { MatTooltipModule } from '@angular/material/tooltip';

// Serviços e Modais do Contexto de Laudos
import { PatientService } from '../../../services/patient-service';
import { MessageService } from '../../../../core/services/message-service';
import { CreatePatientReportComponent } from '../create-patient-report-component/create-patient-report-component';
import { DeletePatientReportComponent } from '../delete-patient-report-component/delete-patient-report-component';
import { ReportAttachmentsComponent } from '../report-attachments-component/report-attachments-component';
import { ShowPatientReportComponent } from '../show-patient-report-component/show-patient-report-component';
import { UpdatePatientReportComponent } from '../update-patient-report-component/update-patient-report-component';

const TFD_PATIENTS_CHANNEL = new BroadcastChannel('tfd-patients-channel');

@Component({
  selector: 'app-patient-reports-component',
  imports: [
    MatDialogModule,
    MatButtonModule,
    MatTableModule,
    MatIconModule,
    MatTooltipModule,
    MatProgressSpinnerModule
  ],
  templateUrl: './patient-reports-component.html',
  styleUrl: './patient-reports-component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class PatientReportsComponent implements OnInit {
  // Injeções de Dependência Dinâmicas
  protected readonly data = inject(MAT_DIALOG_DATA);
  private readonly dialog = inject(MatDialog);
  private readonly patientService = inject(PatientService);
  private readonly messageService = inject(MessageService);
  private readonly destroyRef = inject(DestroyRef);
  private readonly cdr = inject(ChangeDetectorRef);

  // Estados gerenciados reativamente via Signals e Computeds
  protected readonly displayedColumns: string[] = ['protocol', 'cid', 'lawsuit', 'actions'];
  protected readonly reportsList = signal<any[]>([]); 
  protected readonly dataSource = computed(() => new MatTableDataSource<any>(this.reportsList()));
  protected readonly isLoading = signal<boolean>(true);

  ngOnInit(): void {
    this.fetchPatientReports(true);
  }

  /**
   * Busca os laudos do paciente de forma reativa e atualiza os signals.
   */
  private fetchPatientReports(showLoading: boolean = false): void {
    const patientCareId = this.data?.patient_care?.id;

    if (!patientCareId) {
      this.isLoading.set(false);
      this.cdr.markForCheck();
      return;
    }

    if (showLoading) {
      this.isLoading.set(true);
    }

    this.patientService.getPatientReports(patientCareId)
      .pipe(
        finalize(() => {
          this.isLoading.set(false);
          this.cdr.markForCheck(); // Assegura a pintura visual correta ao finalizar o carregamento no OnPush
        }),
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe({
        next: (response) => {
          this.reportsList.set(response || []);
        },
        error: (err) => {
          this.reportsList.set([]);
          const fallbackError = 'Não foi possível carregar os laudos do paciente.';
          this.messageService.showMessage(err?.error?.message || fallbackError);
        }
      });
  }

  /**
   * Centraliza a abertura de modais com tratamento automático do afterClosed (Conforme Código de Referência)
   */
  private openDialog(component: any, data: any, width = '800px', height = 'auto', requiresRefresh = true, emitGlobalBroadcast = true): void {
    this.dialog.open(component, {
      width,
      height,
      disableClose: true,
      autoFocus: false,
      data
    }).afterClosed()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((result) => {
        if (result) {
          this.fetchPatientReports(requiresRefresh || false);
          
          // Mantém a notificação via canal global se a ação exigir a sincronização de outras listagens
          if (emitGlobalBroadcast) {
            TFD_PATIENTS_CHANNEL.postMessage('update');
          }
          this.cdr.markForCheck();
        }
      });
  }

  // --- MÉTODOS DE AÇÃO DISPARADOS PELO TEMPLATE HTML (PROTECTED) ---

  protected showPatientReport(report: any): void {
    this.openDialog(ShowPatientReportComponent, { report }, '800px', 'auto', false, false);
  }

  protected createPatientReport(): void {
    this.openDialog(CreatePatientReportComponent, { patient_care: this.data.patient_care });
  }

  protected updatePatientReport(report: any): void {
    this.openDialog(UpdatePatientReportComponent, { report });
  }

  protected deletePatientReport(report: any): void {
    this.openDialog(DeletePatientReportComponent, { report }, '400px', 'auto', false);
  }

  protected reportAttachments(report: any): void {
    this.openDialog(ReportAttachmentsComponent, { report }, '600px', 'auto', false, false);
  }
}