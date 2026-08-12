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
import { ReportAttachment } from '../../../models/report-attachment.model';
import { PatientService } from '../../../services/patient.service';
import { StorageService } from '../../../../core/services/storage-service';
import { MessageService } from '../../../../core/services/message-service';
import { ReportAttachmentCreateComponent } from '../report-attachment-create/report-attachment-create.component';
import { ReportAttachmentUpdateComponent } from '../report-attachment-update/report-attachment-update.component';
import { ReportAttachmentDeleteComponent } from '../report-attachment-delete/report-attachment-delete.component';

// Canal global de sincronização
const TFD_PATIENTS_CHANNEL = new BroadcastChannel('tfd-patients-channel');

@Component({
  selector: 'app-report-attachments',
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
  templateUrl: './report-attachments.component.html',
  styleUrl: './report-attachments.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ReportAttachmentsComponent implements OnInit {
  // Injeções de Dependência Dinâmicas
  protected readonly data = inject(MAT_DIALOG_DATA, { optional: true });
  private readonly dialog = inject(MatDialog);
  private readonly overlay = inject(Overlay);
  private readonly patientService = inject(PatientService);
  private readonly storageService = inject(StorageService);
  private readonly messageService = inject(MessageService);
  private readonly destroyRef = inject(DestroyRef);
  private readonly cdr = inject(ChangeDetectorRef);

  // Estados gerenciados reativamente via Signals e Computeds
  protected readonly displayedColumns: string[] = ['name', 'actions'];
  protected readonly attachmentsList = signal<ReportAttachment[]>([]);
  protected readonly dataSource = computed(() => new MatTableDataSource<ReportAttachment>(this.attachmentsList()));
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
        error: (err) => {
          const fallbackError = 'Não foi possível carregar os anexos do laudo.';
          this.messageService.showMessage(err?.error?.message || fallbackError);
        }
      });
  }

  /**
   * Centraliza a abertura de modais com tratamento automático pós-fechamento
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
          this.fetchReportAttachments(requiresRefresh);
          
          if (emitGlobalBroadcast) {
            TFD_PATIENTS_CHANNEL.postMessage('update');
          }
          this.cdr.markForCheck();
        }
      });
  }

  // --- MÉTODOS DE AÇÃO DO TEMPLATE (PROTECTED) ---

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

  protected createReportAttachment(): void {
    this.openDialog(ReportAttachmentCreateComponent, { report: this.data?.report });
  }

  protected updateReportAttachment(reportAttachment: ReportAttachment): void {
    this.openDialog(ReportAttachmentUpdateComponent, { reportAttachment });
  }

  protected deleteReportAttachment(reportAttachment: ReportAttachment): void {
    this.openDialog(ReportAttachmentDeleteComponent, { reportAttachment }, '400px', 'auto', true);
  }
}