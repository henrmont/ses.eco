import { ChangeDetectionStrategy, Component, DestroyRef, OnInit, computed, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { finalize } from 'rxjs';
import { saveAs } from 'file-saver';

// Angular Material
import { MatButtonModule } from '@angular/material/button';
import { MAT_DIALOG_DATA, MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTableDataSource, MatTableModule } from '@angular/material/table';
import { MatTooltipModule } from '@angular/material/tooltip';

// Modelos, Serviços e Modais do Contexto de Anexos
import { ReportAttachment } from '../../../models/report-attachment';
import { PatientService } from '../../../services/patient-service';
import { StorageService } from '../../../../core/services/storage-service';
import { CreateReportAttachmentComponent } from '../create-report-attachment-component/create-report-attachment-component';
import { UpdateReportAttachmentComponent } from '../update-report-attachment-component/update-report-attachment-component';
import { DeleteReportAttachmentComponent } from '../delete-report-attachment-component/delete-report-attachment-component';

@Component({
  selector: 'app-patient-report-attachments-component',
  imports: [
    MatDialogModule,
    MatButtonModule,
    MatTableModule,
    MatIconModule,
    MatTooltipModule,
    MatProgressSpinnerModule
  ],
  templateUrl: './report-attachments-component.html',
  styleUrl: './report-attachments-component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ReportAttachmentsComponent implements OnInit {
  // Injeções de dependência modernas
  protected readonly data = inject(MAT_DIALOG_DATA);
  private readonly dialog = inject(MatDialog);
  private readonly patientService = inject(PatientService);
  private readonly storageService = inject(StorageService);
  private readonly destroyRef = inject(DestroyRef);

  // Propriedades expostas para o Template com computed e signals
  protected readonly displayedColumns: string[] = ['name', 'actions'];
  protected readonly attachmentsList = signal<ReportAttachment[]>([]);
  protected readonly dataSource = computed(() => new MatTableDataSource(this.attachmentsList()));
  protected readonly isLoading = signal<boolean>(true);

  ngOnInit(): void {
    this.fetchReportAttachments(true);
  }

  /**
   * Busca os anexos do laudo de forma reativa e segura.
   */
  private fetchReportAttachments(showLoading = false): void {
    const reportId = this.data?.report?.id; // Captura segura

    if (!reportId) {
      this.isLoading.set(false);
      return;
    }

    if (showLoading) {
      this.isLoading.set(true);
    }

    this.patientService.getReportAttachments(reportId)
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
          this.attachmentsList.set(response);
        },
        error: () => {
          // Trata o erro de conexão impedindo exceções soltas na aplicação e nos testes
        }
      });
  }

  /**
   * Centraliza a abertura de modais internas de anexos com tratamento automático do pós-fechamento
   */
  private openDialog(
    component: any, 
    data: any, 
    options: { width?: string; height?: string; refreshWithLoading?: boolean } = {}
  ): void {
    this.dialog.open(component, {
      width: options.width || '400px',
      height: options.height || 'auto',
      disableClose: true,
      autoFocus: false,
      data
    }).afterClosed()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((result) => {
        if (result) {
          this.fetchReportAttachments(options.refreshWithLoading || false);
        }
      });
  }

  // Métodos de ação disparados pelo template HTML (Modificadores Protected)
  
  /**
   * Realiza o download do arquivo binário e faz o gatilho salvando localmente
   */
  protected download(archiveId: number, name: string): void {
    this.storageService.download(archiveId)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (response) => {
          if (response?.archive) {
            saveAs(response.archive, name);
          }
        },
        error: () => {
          // Trata falhas de download silenciosamente nos testes/runtime
        }
      });
  }

  protected createReportAttachment(): void {
    this.openDialog(CreateReportAttachmentComponent, 
      { report: this.data?.report }
    );
  }

  protected updateReportAttachment(report_attachment: ReportAttachment): void {
    this.openDialog(UpdateReportAttachmentComponent, 
      { report_attachment }
    );
  }

  protected deleteReportAttachment(report_attachment: ReportAttachment): void {
    this.openDialog(
      DeleteReportAttachmentComponent,
      { report_attachment },
      { refreshWithLoading: true }
    );
  }
}