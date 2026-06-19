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
import { PatientRequestAttachment } from '../../../models/patient-request-attachment';
import { PatientRequestService } from '../../../services/patient-request-service';
import { StorageService } from '../../../../core/services/storage-service';
import { CreatePatientRequestAttachmentComponent } from '../create-patient-request-attachment-component/create-patient-request-attachment-component';
import { UpdatePatientRequestAttachmentComponent } from '../update-patient-request-attachment-component/update-patient-request-attachment-component';
import { DeletePatientRequestAttachmentComponent } from '../delete-patient-request-attachment-component/delete-patient-request-attachment-component';

const TFD_PATIENT_REQUESTS_CHANNEL = new BroadcastChannel('tfd-patient-requests-channel');

@Component({
  selector: 'app-patient-request-attachments-component',
  standalone: true,
  imports: [
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
  // Injeções de dependência modernas
  protected readonly data = inject(MAT_DIALOG_DATA);
  private readonly dialog = inject(MatDialog);
  private readonly patientRequestService = inject(PatientRequestService);
  private readonly storageService = inject(StorageService);
  private readonly destroyRef = inject(DestroyRef);

  // Propriedades expostas para o Template com computed e signals
  protected readonly displayedColumns: string[] = ['name', 'actions'];
  protected readonly attachmentsList = signal<PatientRequestAttachment[]>([]);
  protected readonly dataSource = computed(() => new MatTableDataSource(this.attachmentsList()));
  protected readonly isLoading = signal<boolean>(true);

  ngOnInit(): void {
    this.fetchPatientRequestAttachments(true);
  }

  /**
   * Busca os anexos de forma reativa e segura baseada na referência.
   */
  private fetchPatientRequestAttachments(showLoading = false): void {
    const requestId = this.data?.patient_request?.id;

    if (!requestId) {
      this.isLoading.set(false);
      return;
    }

    if (showLoading) {
      this.isLoading.set(true);
    }

    this.patientRequestService.getPatientRequestAttachments(requestId)
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
          // Trata o erro silenciosamente
        }
      });
  }

  /**
   * Centraliza a abertura de modais internas de anexos com transmissão em canal
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
          this.fetchPatientRequestAttachments(options.refreshWithLoading || false);
          TFD_PATIENT_REQUESTS_CHANNEL.postMessage('update');
        }
      });
  }

  // Métodos de ação disparados pelo template HTML

  /**
   * Realiza o download do arquivo binário
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
          // Trata falhas silenciosamente nos testes
        }
      });
  }

  protected createPatientRequestAttachment(): void {
    this.openDialog(CreatePatientRequestAttachmentComponent, 
      { patient_request: this.data?.patient_request }
    );
  }

  protected updatePatientRequestAttachment(patient_request_attachment: PatientRequestAttachment): void {
    this.openDialog(UpdatePatientRequestAttachmentComponent, 
      { patient_request_attachment }
    );
  }

  protected deletePatientRequestAttachment(patient_request_attachment: PatientRequestAttachment): void {
    this.openDialog(
      DeletePatientRequestAttachmentComponent,
      { patient_request_attachment },
      { refreshWithLoading: true }
    );
  }
}