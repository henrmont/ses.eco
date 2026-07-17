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

// Modelos, Serviços e Modais do Contexto de Anexos
import { PatientRequestAttachment } from '../../../models/patient-request-attachment';
import { PatientRequestService } from '../../../services/patient-request-service';
import { StorageService } from '../../../../core/services/storage-service';
import { CreatePatientRequestAttachmentComponent } from '../create-patient-request-attachment-component/create-patient-request-attachment-component';
import { UpdatePatientRequestAttachmentComponent } from '../update-patient-request-attachment-component/update-patient-request-attachment-component';
import { DeletePatientRequestAttachmentComponent } from '../delete-patient-request-attachment-component/delete-patient-request-attachment-component';
import { Overlay } from '@angular/cdk/overlay';

const TFD_PATIENT_REQUESTS_CHANNEL = new BroadcastChannel('tfd-patient-requests-channel');

@Component({
  selector: 'app-patient-request-attachments-component',
  imports: [
    CommonModule,
    MatDialogModule,
    MatButtonModule,
    MatTableModule,
    MatIconModule,
    MatTooltipModule,
    MatProgressSpinnerModule
  ],
  templateUrl: './patient-request-attachments-component.html',
  styleUrl: './patient-request-attachments-component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class PatientRequestAttachmentsComponent implements OnInit {
  // Injeções de Dependência Dinâmicas
  protected readonly data = inject(MAT_DIALOG_DATA);
  private readonly dialog = inject(MatDialog);
  private readonly overlay = inject(Overlay);
  private readonly patientRequestService = inject(PatientRequestService);
  private readonly storageService = inject(StorageService);
  private readonly destroyRef = inject(DestroyRef);
  private readonly cdr = inject(ChangeDetectorRef);

  // Estados gerenciados reativamente via Signals e Computeds
  protected readonly displayedColumns: string[] = ['name', 'actions'];
  protected readonly attachmentsList = signal<PatientRequestAttachment[]>([]);
  protected readonly dataSource = computed(() => new MatTableDataSource(this.attachmentsList()));
  protected readonly isLoading = signal<boolean>(true);

  ngOnInit(): void {
    this.fetchPatientRequestAttachments(true);
  }

  // --- MÉTODOS PRIVADOS DE SUPORTE ---

  /**
   * Busca os anexos do paciente de forma reativa e atualiza os signals.
   */
  private fetchPatientRequestAttachments(showLoading: boolean = false): void {
    const requestId = this.data?.patient_request?.id;

    if (!requestId) {
      this.isLoading.set(false);
      this.cdr.markForCheck();
      return;
    }

    if (showLoading) {
      this.isLoading.set(true);
    }

    this.patientRequestService.getPatientRequestAttachments(requestId)
      .pipe(
        finalize(() => {
          this.isLoading.set(false);
          this.cdr.markForCheck(); // Assegura a pintura visual correta ao finalizar o carregamento no OnPush
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
   * Centraliza a abertura de modais com tratamento automático do afterClosed (Alinhado com Código de Referência)
   */
  private openDialog(component: any, data: any, width = '400px', height = 'auto', requiresRefresh = true, emitGlobalBroadcast = true): void {
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
          this.fetchPatientRequestAttachments(requiresRefresh || false);
          
          // Mantém a notificação via canal global se a ação exigir a sincronização de outras listagens
          if (emitGlobalBroadcast) {
            TFD_PATIENT_REQUESTS_CHANNEL.postMessage('update');
          }
          this.cdr.markForCheck();
        }
      });
  }

  // --- MÉTODOS DE AÇÃO DISPARADOS PELO TEMPLATE HTML (PROTECTED) ---

  protected download(archiveId: number, name: string): void {
    this.storageService.download(archiveId)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (response) => {
          if (response?.archive) {
            saveAs(response.archive, name);
          }
        },
      });
  }

  protected createPatientRequestAttachment(): void {
    this.openDialog(CreatePatientRequestAttachmentComponent, { patient_request: this.data?.patient_request });
  }

  protected updatePatientRequestAttachment(patientRequestAttachment: PatientRequestAttachment): void {
    this.openDialog(UpdatePatientRequestAttachmentComponent, { patient_request_attachment: patientRequestAttachment });
  }

  protected deletePatientRequestAttachment(patientRequestAttachment: PatientRequestAttachment): void {
    this.openDialog(DeletePatientRequestAttachmentComponent, { patient_request_attachment: patientRequestAttachment }, '400px', 'auto', true);
  }
}