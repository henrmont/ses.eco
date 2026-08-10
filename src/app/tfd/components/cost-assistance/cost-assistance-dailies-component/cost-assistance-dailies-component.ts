import { ChangeDetectionStrategy, Component, DestroyRef, OnInit, ChangeDetectorRef, computed, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { finalize } from 'rxjs';
import { CommonModule, CurrencyPipe } from '@angular/common';
import { Overlay } from '@angular/cdk/overlay';

// Angular Material
import { MatButtonModule } from '@angular/material/button';
import { MAT_DIALOG_DATA, MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTableDataSource, MatTableModule } from '@angular/material/table';
import { MatTooltipModule } from '@angular/material/tooltip';

// Models e Serviços
import { CostAssistanceDaily } from '../../../models/cost-assistance-daily';
import { CostAssistanceService } from '../../../services/cost-assistance-service';
import { MessageService } from '../../../../core/services/message-service';

// Modais do Contexto de Diárias
import { CreateCostAssistanceDailyComponent } from '../create-cost-assistance-daily-component/create-cost-assistance-daily-component';
import { UpdateCostAssistanceDailyComponent } from '../update-cost-assistance-daily-component/update-cost-assistance-daily-component';
import { DeleteCostAssistanceDailyComponent } from '../delete-cost-assistance-daily-component/delete-cost-assistance-daily-component';

const TFD_PATIENT_REQUESTS_CHANNEL = new BroadcastChannel('tfd-patient-requests-channel');

@Component({
  selector: 'app-cost-assistance-dailies-component',
  standalone: true,
  imports: [
    CommonModule,
    CurrencyPipe,
    MatDialogModule,
    MatButtonModule,
    MatTableModule,
    MatIconModule,
    MatTooltipModule,
    MatProgressSpinnerModule
  ],
  templateUrl: './cost-assistance-dailies-component.html',
  styleUrl: './cost-assistance-dailies-component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class CostAssistanceDailiesComponent implements OnInit {
  // Injeções de Dependência
  protected readonly data = inject(MAT_DIALOG_DATA);
  private readonly dialog = inject(MatDialog);
  private readonly overlay = inject(Overlay);
  private readonly costAssistanceService = inject(CostAssistanceService);
  private readonly messageService = inject(MessageService);
  private readonly destroyRef = inject(DestroyRef);
  private readonly cdr = inject(ChangeDetectorRef);

  // Colunas e Coleções
  protected readonly displayedColumns: string[] = ['name', 'value', 'amount', 'partial', 'actions'];
  protected readonly dailiesList = signal<CostAssistanceDaily[]>([]);
  protected readonly isLoading = signal<boolean>(true);

  // Computado que define se o rodapé deve exibir as colunas ou ficar escondido quando a lista estiver vazia
  protected readonly footerColumns = computed(() => 
    this.dailiesList().length > 0 ? this.displayedColumns : []
  );

  // Mapeia a lista adicionando o valor computado 'partial' (subtotal) individual de forma reativa
  private readonly mappedDailies = computed(() => 
    this.dailiesList().map(item => ({
      ...item,
      partial: (Number(item.amount) || 0) * (Number(item.daily_cost?.value) || 0)
    }))
  );

  // Fonte de dados reativa vinculada diretamente ao computed anterior para alimentar a MatTable
  protected readonly dataSource = computed(() => new MatTableDataSource(this.mappedDailies()));

  // Calcula o valor total global somando todos os parciais de maneira limpa e reativa
  protected readonly totalValue = computed(() => 
    this.mappedDailies().reduce((acc, item) => acc + item.partial, 0)
  );

  ngOnInit(): void {
    this.fetchCostAssistanceDailies(true);
  }

  // --- BUSCA E REFRESH DE DADOS ---

  /**
   * Busca as diárias vinculadas à ajuda de custo de forma reativa e segura.
   */
  private fetchCostAssistanceDailies(showLoading: boolean = false): void {
    const costAssistanceId = this.data?.cost_assistance?.id;

    if (!costAssistanceId) {
      this.isLoading.set(false);
      this.cdr.markForCheck();
      return;
    }

    if (showLoading) {
      this.isLoading.set(true);
    }

    this.costAssistanceService.getCostAssistanceDailies(costAssistanceId)
      .pipe(
        finalize(() => {
          this.isLoading.set(false);
          this.cdr.markForCheck();
        }),
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe({
        next: (response: any) => {
          const items = Array.isArray(response) ? response : (response?.data || []);
          this.dailiesList.set(items);
        },
        error: (err) => {
          this.dailiesList.set([]);
          const fallbackError = 'Não foi possível carregar as diárias da ajuda de custo.';
          this.messageService.showMessage(err?.error?.message || fallbackError);
        }
      });
  }

  // --- GERENCIAMENTO DE MODAIS E PERMISSÕES ---

  /**
   * Centraliza a abertura das modais internas de diárias com atualização do estado pós-fechamento
   */
  private openDialog(
    component: any, 
    data: any, 
    width: string = '500px',
    height: string = 'auto',
    requiresRefresh: boolean = true,
    emitGlobalBroadcast: boolean = true
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
          if (requiresRefresh) {
            this.fetchCostAssistanceDailies(false);
          }

          if (emitGlobalBroadcast) {
            TFD_PATIENT_REQUESTS_CHANNEL.postMessage('update');
          }
          this.cdr.markForCheck();
        }
      });
  }

  // --- MÉTODOS DE AÇÃO DO TEMPLATE ---

  protected createCostAssistanceDaily(): void {
    this.openDialog(
      CreateCostAssistanceDailyComponent, 
      { cost_assistance: this.data?.cost_assistance }, 
      '500px', 'auto', true, true
    );
  }

  protected updateCostAssistanceDaily(costAssistanceDaily: CostAssistanceDaily): void {
    this.openDialog(
      UpdateCostAssistanceDailyComponent, 
      { cost_assistance_daily: costAssistanceDaily }, 
      '500px', 'auto', true, true
    );
  }

  protected deleteCostAssistanceDaily(costAssistanceDaily: CostAssistanceDaily): void {
    this.openDialog(
      DeleteCostAssistanceDailyComponent, 
      { cost_assistance_daily: costAssistanceDaily }, 
      '400px', 'auto', true, true
    );
  }
}