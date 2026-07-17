import { ChangeDetectionStrategy, Component, DestroyRef, OnInit, computed, inject, signal, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
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
import { Overlay } from '@angular/cdk/overlay';

// Modelos, Serviços e Modais do Contexto de Anexos
import { ReportAttachment } from '../../../models/report-attachment';
import { PatientService } from '../../../services/patient-service';
import { StorageService } from '../../../../core/services/storage-service';
import { CreateReportAttachmentComponent } from '../create-report-attachment-component/create-report-attachment-component';
import { UpdateReportAttachmentComponent } from '../update-report-attachment-component/update-report-attachment-component';
import { DeleteReportAttachmentComponent } from '../delete-report-attachment-component/delete-report-attachment-component';

// Canal global de sincronização (específico para os laudos de pacientes)
const TFD_PATIENTS_CHANNEL = new BroadcastChannel('tfd-patients-channel');

@Component({
  selector: 'app-patient-report-attachments-component',
  standalone: true,
  imports: [
    CommonModule,
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
  // Injeções de Dependência Dinâmicas
  protected readonly data = inject(MAT_DIALOG_DATA);
  private readonly dialog = inject(MatDialog);
  private readonly overlay = inject(Overlay);
  private readonly patientService = inject(PatientService);
  private readonly storageService = inject(StorageService);
  private readonly destroyRef = inject(DestroyRef);
  private readonly cdr = inject(ChangeDetectorRef);

  // Estados gerenciados reativamente via Signals e Computeds
  protected readonly displayedColumns: string[] = ['name', 'actions'];
  protected readonly attachmentsList = signal<ReportAttachment[]>([]);
  protected readonly dataSource = computed(() => new MatTableDataSource(this.attachmentsList()));
  protected readonly isLoading = signal<boolean>(true);

  ngOnInit(): void {
    this.fetchReportAttachments(true);

    // Fecha o canal global adequadamente ao destruir o componente
    this.destroyRef.onDestroy(() => {
      TFD_PATIENTS_CHANNEL.close();
    });
  }

  // --- MÉTODOS PRIVADOS DE SUPORTE ---

  /**
   * Busca os anexos do laudo de forma reativa e segura.
   */
  private fetchReportAttachments(showLoading = false): void {
    const reportId = this.data?.report?.id;

    if (!reportId) {
      this.isLoading.set(false);
      this.cdr.markForCheck();
      return;
    }

    if (showLoading) {
      this.isLoading.set(true);
    }

    this.patientService.getReportAttachments(reportId)
      .pipe(
        finalize(() => {
          this.isLoading.set(false);
          this.cdr.markForCheck(); // Assegura a renderização visual com OnPush ao findar o stream
        }),
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe({
        next: (response) => {
          this.attachmentsList.set(response || []);
        },
        error: () => {
          this.attachmentsList.set([]);
        }
      });
  }

  /**
   * Centraliza a abertura de modais com tratamento pós-fechamento (Padrão de Referência de Sucesso)
   */
  private openDialog(
    component: any, 
    data: any, 
    width = '400px', 
    height = 'auto', 
    requiresRefresh = true, 
    emitGlobalBroadcast = true
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
      .subscribe((result) => {
        if (result) {
          this.fetchReportAttachments(requiresRefresh || false);
          
          if (emitGlobalBroadcast) {
            TFD_PATIENTS_CHANNEL.postMessage('update');
          }
          this.cdr.markForCheck();
        }
      });
  }

  // --- MÉTODOS DE AÇÃO DO TEMPLATE (PROTECTED) ---

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

  protected createReportAttachment(): void {
    this.openDialog(CreateReportAttachmentComponent, { report: this.data?.report });
  }

  protected updateReportAttachment(reportAttachment: ReportAttachment): void {
    this.openDialog(UpdateReportAttachmentComponent, { report_attachment: reportAttachment });
  }

  protected deleteReportAttachment(reportAttachment: ReportAttachment): void {
    this.openDialog(DeleteReportAttachmentComponent, { report_attachment: reportAttachment }, '400px', 'auto', true);
  }
}