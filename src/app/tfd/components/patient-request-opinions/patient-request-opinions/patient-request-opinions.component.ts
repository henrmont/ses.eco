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

// Modelos, Serviços e Componentes de Parecer (Opinion)
import { PatientRequestOpinion } from '../../../models/patient-request-opinion.model';
import { PatientRequestOpinionService } from '../../../services/patient-request-opinion.service';
import { MessageService } from '../../../../core/services/message-service';
import { PatientRequestOpinionCreateComponent } from '../patient-request-opinion-create/patient-request-opinion-create.component';
import { PatientRequestOpinionDeleteComponent } from '../patient-request-opinion-delete/patient-request-opinion-delete.component';
import { PatientRequestOpinionDetailComponent } from '../patient-request-opinion-detail/patient-request-opinion-detail.component';
import { PatientRequestOpinionUpdateComponent } from '../patient-request-opinion-update/patient-request-opinion-update.component';
import { Overlay } from '@angular/cdk/overlay';

const TFD_OPINIONS_CHANNEL = new BroadcastChannel('tfd-opinions-channel');

@Component({
  selector: 'app-patient-request-opinions',
  standalone: true,
  imports: [
    MatDialogModule,
    MatButtonModule,
    MatTableModule,
    MatIconModule,
    MatTooltipModule,
    MatProgressSpinnerModule
  ],
  templateUrl: './patient-request-opinions.component.html',
  styleUrl: './patient-request-opinions.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class PatientRequestOpinionsComponent implements OnInit {
  // Injeções de Dependência Dinâmicas
  protected readonly data = inject(MAT_DIALOG_DATA);
  private readonly dialog = inject(MatDialog);
  private readonly overlay = inject(Overlay);
  private readonly opinionService = inject(PatientRequestOpinionService);
  private readonly messageService = inject(MessageService);
  private readonly destroyRef = inject(DestroyRef);
  private readonly cdr = inject(ChangeDetectorRef);

  // Estados gerenciados reativamente via Signals e Computeds
  protected readonly displayedColumns: string[] = ['name', 'owner', 'is_approved', 'actions'];
  protected readonly opinionsList = signal<PatientRequestOpinion[]>([]);
  protected readonly dataSource = computed(() => new MatTableDataSource<PatientRequestOpinion>(this.opinionsList()));
  protected readonly isLoading = signal<boolean>(true);

  ngOnInit(): void {
    this.fetchOpinions(true);
  }

  /**
   * Busca os pareceres de forma reativa e atualiza os signals.
   */
  private fetchOpinions(showLoading: boolean = false): void {
    const requestId = this.data?.patient_request?.id;

    if (!requestId) {
      this.isLoading.set(false);
      this.cdr.markForCheck();
      return;
    }

    if (showLoading) {
      this.isLoading.set(true);
    }

    this.opinionService.getOpinions(requestId)
      .pipe(
        finalize(() => {
          this.isLoading.set(false);
          this.cdr.markForCheck(); // Assegura a pintura visual correta ao finalizar o carregamento no OnPush
        }),
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe({
        next: (response) => {
          this.opinionsList.set(response || []);
        },
        error: (err) => {
          this.opinionsList.set([]);
          const fallbackError = 'Não foi possível carregar os pareceres da solicitação.';
          this.messageService.showMessage(err?.error?.message || fallbackError);
        }
      });
  }

  /**
   * Centraliza a abertura de modais com tratamento automático do após fechamento
   */
  private openDialog(component: any, data: any, width = '800px', height = 'auto', requiresRefresh = true, emitGlobalBroadcast = true): void {
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
          this.fetchOpinions(requiresRefresh || false);
          
          if (emitGlobalBroadcast) {
            TFD_OPINIONS_CHANNEL.postMessage('update');
          }
          this.cdr.markForCheck();
        }
      });
  }

  /**
   * Avalia as permissões do usuário logado.
   * Retorna 'true' caso o usuário NÃO tenha acesso (desabilita botões no template).
   */
  protected checkPermissions(permissionName: string): boolean {
    const roles = this.data?.permissions || [];
    return !roles.some((role: any) => 
      role?.permissions?.some((p: any) => p?.name === permissionName)
    );
  }

  // --- MÉTODOS DE AÇÃO DISPARADOS PELO TEMPLATE HTML (PROTECTED) ---

  protected createOpinion(): void {
    this.openDialog(PatientRequestOpinionCreateComponent, { patient_request: this.data?.patient_request }, '1200px');
  }

  protected showOpinion(opinion: PatientRequestOpinion): void {
    this.openDialog(PatientRequestOpinionDetailComponent, { opinion }, '1200px', 'auto', false, false);
  }

  protected updateOpinion(opinion: PatientRequestOpinion): void {
    this.openDialog(PatientRequestOpinionUpdateComponent, { opinion }, '1200px');
  }

  protected deleteOpinion(opinion: PatientRequestOpinion): void {
    this.openDialog(PatientRequestOpinionDeleteComponent, { opinion }, '400px', 'auto', false);
  }
}