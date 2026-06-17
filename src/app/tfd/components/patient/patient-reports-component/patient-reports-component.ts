import { ChangeDetectionStrategy, Component, DestroyRef, OnInit, computed, inject, signal } from '@angular/core';
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
  // Injeções de dependência modernas
  protected readonly data = inject(MAT_DIALOG_DATA);
  private readonly dialog = inject(MatDialog);
  private readonly patientService = inject(PatientService);
  private readonly destroyRef = inject(DestroyRef);

  // Propriedades expostas para o Template com computed e signals
  protected readonly displayedColumns: string[] = ['protocol', 'cid', 'actions'];
  protected readonly reportsList = signal<any[]>([]); // Substitua 'any' pelo seu Model de Report caso exista
  protected readonly dataSource = computed(() => new MatTableDataSource(this.reportsList()));
  protected readonly isLoading = signal<boolean>(true);

  ngOnInit(): void {
    this.fetchPatientReports(true);
  }

  /**
   * Busca os laudos do paciente de forma reativa e segura.
   */
  private fetchPatientReports(showLoading = false): void {
    const careId = this.data?.patient_care?.id; // Captura segura

    if (!careId) {
      this.isLoading.set(false);
      return;
    }

    if (showLoading) {
      this.isLoading.set(true);
    }

    this.patientService.getPatientReports(careId) // Passa a variável segura tratada
      .pipe(
        finalize(() => {
          if (showLoading) {
            this.isLoading.set(false);
          }
        }),
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe({
        next: (response) => {
          this.reportsList.set(response);
        },
        error: () => {
          // Trata o erro de conexão impedindo exceções soltas na aplicação e nos testes
        }
      });
  }

  /**
   * Centraliza a abertura de modais com tratamento automático do após fechamento e emissão de eventos
   */
  private openDialog(
    component: any, 
    data: any, 
    options: { width?: string; height?: string; refreshWithLoading?: boolean; postMessage?: boolean } = {}
  ): void {
    this.dialog.open(component, {
      width: options.width || '800px',
      height: options.height || '700px',
      disableClose: true,
      autoFocus: false,
      data
    }).afterClosed()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((result) => {
        if (result) {
          this.fetchPatientReports(options.refreshWithLoading || false);
          
          // Se a modal modificou dados e exige notificação global pelo canal
          if (options.postMessage !== false) {
            TFD_PATIENTS_CHANNEL.postMessage('update');
          }
        }
      });
  }

  // Métodos de ação disparados pelo template HTML (Modificadores Protected)
  protected showPatientReport(report: any): void {
    this.openDialog(ShowPatientReportComponent, { report }, { height: 'auto', postMessage: false });
  }

  protected createPatientReport(): void {
    this.openDialog(CreatePatientReportComponent, 
      { patient_care: this.data.patient_care },
      { height: 'auto' }
    );
  }

  protected updatePatientReport(report: any): void {
    this.openDialog(UpdatePatientReportComponent, 
      { report },
      { height: 'auto' }
    );
  }

  protected deletePatientReport(report: any): void {
    this.openDialog(
      DeletePatientReportComponent,
      { report },
      { width: '400px', height: 'auto', refreshWithLoading: true }
    );
  }

  protected reportAttachments(report: any): void {
    // Abre os anexos sem disparar o postMessage global já que é uma tela de listagem/gerenciamento interno
    this.openDialog(ReportAttachmentsComponent, { report }, { width: '600px', height: 'auto', postMessage: false });
  }
}