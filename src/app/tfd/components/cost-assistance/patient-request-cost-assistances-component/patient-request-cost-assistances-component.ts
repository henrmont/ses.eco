import { ChangeDetectionStrategy, Component, DestroyRef, OnInit, ChangeDetectorRef, computed, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { finalize } from 'rxjs';
import { CommonModule, CurrencyPipe, DatePipe } from '@angular/common';
import { Overlay } from '@angular/cdk/overlay';

// Angular Material
import { MatButtonModule } from '@angular/material/button';
import { MAT_DIALOG_DATA, MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTableDataSource, MatTableModule } from '@angular/material/table';
import { MatTooltipModule } from '@angular/material/tooltip';

// Models e Serviços
import { CostAssistance } from '../../../models/cost-assistance';
import { Permission } from '../../../models/permission.model';
import { CostAssistanceService } from '../../../services/cost-assistance-service';
import { MessageService } from '../../../../core/services/message-service';

// Modais do Contexto de Ajudas de Custo
import { CreateCostAssistanceComponent } from '../create-cost-assistance-component/create-cost-assistance-component';
import { UpdateCostAssistanceComponent } from '../update-cost-assistance-component/update-cost-assistance-component';
import { DeleteCostAssistanceComponent } from '../delete-cost-assistance-component/delete-cost-assistance-component';
import { CostAssistanceDailiesComponent } from '../cost-assistance-dailies-component/cost-assistance-dailies-component';
import { ShowCostAssistanceComponent } from '../show-cost-assistance-component/show-cost-assistance-component';

const TFD_PATIENT_REQUESTS_CHANNEL = new BroadcastChannel('tfd-patient-requests-channel');

@Component({
  selector: 'app-patient-request-cost-assistances-component',
  standalone: true,
  imports: [
    CommonModule,
    CurrencyPipe,
    DatePipe,
    MatDialogModule,
    MatButtonModule,
    MatTableModule,
    MatIconModule,
    MatTooltipModule,
    MatProgressSpinnerModule
  ],
  templateUrl: './patient-request-cost-assistances-component.html',
  styleUrl: './patient-request-cost-assistances-component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class PatientRequestCostAssistancesComponent implements OnInit {
  // Injeções de Dependência
  protected readonly data = inject(MAT_DIALOG_DATA);
  private readonly dialog = inject(MatDialog);
  private readonly overlay = inject(Overlay);
  private readonly costAssistanceService = inject(CostAssistanceService);
  private readonly messageService = inject(MessageService);
  private readonly destroyRef = inject(DestroyRef);
  private readonly cdr = inject(ChangeDetectorRef);

  // Colunas e Coleções
  protected readonly displayedColumns: string[] = ['name', 'type', 'created_at', 'dailies', 'actions'];
  protected readonly costAssistancesList = signal<CostAssistance[]>([]);
  protected readonly dataSource = computed(() => new MatTableDataSource(this.costAssistancesList()));

  // Computado que define se o rodapé deve exibir as colunas ou ficar escondido quando a lista estiver vazia
  protected readonly footerColumns = computed(() => 
    this.costAssistancesList().length > 0 ? this.displayedColumns : []
  );

  // Estados Reativos via Signals
  protected readonly isLoading = signal<boolean>(true);
  protected readonly totalValue = signal<number>(0); // Saldo vindo do backend

  // Somatório computado do montante total de diárias das ajudas de custo da tabela
  protected readonly totalCostAssistances = computed(() =>
    this.costAssistancesList().reduce((acc, item) => acc + (Number(item.total_dailies) || 0), 0)
  );

  /**
   * Avalia dinamicamente se existe alguma ajuda de custo cadastrada que ainda não possui diárias lançadas
   */
  protected readonly hasCostAssistanceWithoutDailies = computed(() => {
    const list = this.costAssistancesList();
    if (!list || list.length === 0) return false;

    return list.some(item => {
      const totalDailies = Number(item.total_dailies) || 0;
      const dailiesArrayLength = Array.isArray(item.dailies) ? item.dailies.length : 0;
      return totalDailies === 0 && dailiesArrayLength === 0;
    });
  });

  ngOnInit(): void {
    this.refreshData(true);
  }

  // --- BUSCA E REFRESH DE DADOS ---

  /**
   * Dispara a atualização síncrona da listagem e do saldo
   */
  private refreshData(showLoading: boolean = false): void {
    this.fetchCostAssistances(showLoading);
    this.fetchBalance();
  }

  /**
   * Busca as ajudas de custo cadastradas para a solicitação do paciente
   */
  private fetchCostAssistances(showLoading: boolean = false): void {
    const requestId = this.data?.patient_request?.id;

    if (!requestId) {
      this.isLoading.set(false);
      this.cdr.markForCheck();
      return;
    }

    if (showLoading) {
      this.isLoading.set(true);
    }

    this.costAssistanceService.getCostAssistances(requestId)
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
          this.costAssistancesList.set(items);
        },
        error: (err) => {
          this.costAssistancesList.set([]);
          const fallbackError = 'Não foi possível carregar as ajudas de custo.';
          this.messageService.showMessage(err?.error?.message || fallbackError);
        }
      });
  }

  /**
   * Obtém o saldo acumulado calculated pelo backend com tratamento seguro de ID
   */
  private fetchBalance(): void {
    const patientRequest = this.data?.patient_request;
    const careId = patientRequest?.report?.patient_care?.id 
      || patientRequest?.patient_care_id 
      || patientRequest?.id;

    if (!careId) return;

    this.costAssistanceService.getBalance(careId)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (response: any) => {
          const balanceValue = typeof response === 'number'
            ? response
            : (response?.balance ?? response?.total ?? response?.value ?? 0);

          this.totalValue.set(Number(balanceValue) || 0);
          this.cdr.markForCheck();
        },
        error: () => {
          this.totalValue.set(0);
          this.cdr.markForCheck();
        }
      });
  }

  // --- GERENCIAMENTO DE MODAIS E PERMISSÕES ---

  /**
   * Centraliza a abertura de modais com tratamento automático do pós-fechamento
   */
  private openDialog(
    component: any, 
    data: any, 
    width: string = '800px', 
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
            this.refreshData(false);
          }
          
          if (emitGlobalBroadcast) {
            TFD_PATIENT_REQUESTS_CHANNEL.postMessage('update');
          }
          this.cdr.markForCheck();
        }
      });
  }

  /**
   * Verifica se a permissão informada NÃO existe nos papéis recebidos.
   */
  protected checkPermissions(name: string): boolean {
    const roles = this.data?.permissions || [];
    for (const item of roles) {
      const hasPermission = item.permissions?.some((p: Permission) => p.name === name);
      if (hasPermission) {
        return false;
      }
    }
    return true;
  }

  // --- MÉTODOS DE AÇÃO DO TEMPLATE ---

  protected createCostAssistance(): void {
    this.openDialog(CreateCostAssistanceComponent, 
      { patient_request: this.data?.patient_request },
      '800px'
    );
  }

  protected showCostAssistance(costAssistance: CostAssistance): void {
    this.openDialog(ShowCostAssistanceComponent, { cost_assistance: costAssistance }, '800px', 'auto', false, false);
  }

  protected updateCostAssistance(costAssistance: CostAssistance): void {
    this.openDialog(UpdateCostAssistanceComponent, { cost_assistance: costAssistance }, '800px');
  }

  protected deleteCostAssistance(costAssistance: CostAssistance): void {
    this.openDialog(DeleteCostAssistanceComponent, { cost_assistance: costAssistance }, '400px', 'auto', true);
  }

  protected costAssistanceDailies(costAssistance: CostAssistance): void {
    this.openDialog(CostAssistanceDailiesComponent, 
      { cost_assistance: costAssistance, permissions: this.data?.permissions }, 
      '1000px', 'auto', true
    );
  }
}