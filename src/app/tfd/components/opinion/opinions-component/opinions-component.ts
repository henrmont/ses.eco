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

// Modelos, Serviços e Componentes de Parecer (Opinion)
import { Opinion } from '../../../models/opinion';
import { OpinionService } from '../../../services/opinion-service';
import { CreateOpinionComponent } from '../create-opinion-component/create-opinion-component';
import { DeleteOpinionComponent } from '../delete-opinion-component/delete-opinion-component';
import { ShowOpinionComponent } from '../show-opinion-component/show-opinion-component';
import { UpdateOpinionComponent } from '../update-opinion-component/update-opinion-component';

const TFD_OPINIONS_CHANNEL = new BroadcastChannel('tfd-opinions-channel');

@Component({
  selector: 'app-opinions-component',
  standalone: true,
  imports: [
    MatDialogModule,
    MatButtonModule,
    MatTableModule,
    MatIconModule,
    MatTooltipModule,
    MatProgressSpinnerModule
  ],
  templateUrl: './opinions-component.html',
  styleUrl: './opinions-component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush // ⚡ Performance máxima com OnPush + Signals
})
export class OpinionsComponent implements OnInit {
  // Injeções de dependência modernas via inject()
  protected readonly data = inject(MAT_DIALOG_DATA);
  private readonly dialog = inject(MatDialog);
  private readonly opinionService = inject(OpinionService);
  private readonly destroyRef = inject(DestroyRef);

  // Propriedades reativas expostas para o Template
  protected readonly displayedColumns: string[] = ['name', 'owner', 'is_approved', 'actions'];
  protected readonly opinionsList = signal<Opinion[]>([]);
  protected readonly dataSource = computed(() => new MatTableDataSource(this.opinionsList()));
  protected readonly isLoading = signal<boolean>(true);

  ngOnInit(): void {
    this.fetchOpinions(true);
  }

  /**
   * Busca as opiniões de forma reativa e segura.
   */
  private fetchOpinions(showLoading = false): void {
    const requestId = this.data?.patient_request?.id;

    if (!requestId) {
      this.isLoading.set(false);
      return;
    }

    if (showLoading) {
      this.isLoading.set(true);
    }

    this.opinionService.getOpinions(requestId)
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
          this.opinionsList.set(response);
        },
        error: () => {
          // Evita estouros de exceção em ambiente de execução e de testes
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
      width: options.width || '1200px',
      height: options.height || '700px',
      disableClose: true,
      autoFocus: false,
      data
    }).afterClosed()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((result) => {
        if (result) {
          this.fetchOpinions(options.refreshWithLoading || false);
          
          // Se a modal modificou dados e exige notificação global pelo canal do broadcast
          if (options.postMessage !== false) {
            TFD_OPINIONS_CHANNEL.postMessage('update');
          }
        }
      });
  }

  /**
   * Verifica se o usuário possui determinada permissão
   * Retorna false se possuir a permissão, true caso contrário (mantendo a lógica inversa de negócio original)
   */
  protected checkPermissions(permissionName: string): boolean {
    const roles = this.data?.permissions || [];
    return !roles.some((role: any) => 
      role?.permissions?.some((p: any) => p?.name === permissionName)
    );
  }

  // Métodos de ação disparados pelo template HTML (Modificadores Protected)
  protected createOpinion(): void {
    this.openDialog(CreateOpinionComponent, 
      { patient_request: this.data?.patient_request },
      { refreshWithLoading: false }
    );
  }
  
  protected showOpinion(opinion: Opinion): void {
    this.openDialog(ShowOpinionComponent, 
      { opinion }, 
      { postMessage: false } // Apenas visualização, sem disparar evento no canal
    );
  }

  protected updateOpinion(opinion: Opinion): void {
    this.openDialog(UpdateOpinionComponent, 
      { opinion },
      { refreshWithLoading: false }
    );
  }

  protected deleteOpinion(opinion: Opinion): void {
    this.openDialog(DeleteOpinionComponent, 
      { opinion },
      { width: '400px', height: 'auto', refreshWithLoading: true } // Exclusão força recarregamento com loading visível
    );
  }
}