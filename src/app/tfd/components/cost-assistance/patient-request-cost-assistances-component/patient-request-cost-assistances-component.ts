import { ChangeDetectionStrategy, Component, DestroyRef, OnInit, computed, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { finalize } from 'rxjs';
import { CommonModule } from '@angular/common';

// Angular Material
import { MatButtonModule } from '@angular/material/button';
import { MAT_DIALOG_DATA, MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTableDataSource, MatTableModule } from '@angular/material/table';
import { MatTooltipModule } from '@angular/material/tooltip';

// Models e Serviços do Contexto de Auxílios
import { CostAssistance } from '../../../models/cost-assistance';
import { Permission } from '../../../models/permission';
import { CostAssistanceService } from '../../../services/cost-assistance-service';

// Modais do Contexto de Auxílios
import { CreateCostAssistanceComponent } from '../create-cost-assistance-component/create-cost-assistance-component';
import { UpdateCostAssistanceComponent } from '../update-cost-assistance-component/update-cost-assistance-component';
import { DeleteCostAssistanceComponent } from '../delete-cost-assistance-component/delete-cost-assistance-component';
import { CostAssistanceDailiesComponent } from '../cost-assistance-dailies-component/cost-assistance-dailies-component';
import { ShowCostAssistanceComponent } from '../show-cost-assistance-component/show-cost-assistance-component';

@Component({
  selector: 'app-patient-request-cost-assistances-component',
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
  templateUrl: './patient-request-cost-assistances-component.html',
  styleUrl: './patient-request-cost-assistances-component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush // ⚡ Performance máxima unindo OnPush + Signals + Computed
})
export class PatientRequestCostAssistancesComponent implements OnInit {
  // Injeções de dependência modernas via inject()
  protected readonly data = inject(MAT_DIALOG_DATA);
  private readonly dialog = inject(MatDialog);
  private readonly costAssistanceService = inject(CostAssistanceService);
  private readonly destroyRef = inject(DestroyRef);

  // Propriedades expostas para o Template com computed e signals
  protected readonly displayedColumns: string[] = ['name', 'type', 'created_at', 'dailies', 'actions'];
  protected readonly costAssistancesList = signal<CostAssistance[]>([]);
  protected readonly dataSource = computed(() => new MatTableDataSource(this.costAssistancesList()));
  protected readonly isLoading = signal<boolean>(true);
  protected readonly totalValue = signal<number>(0);

  ngOnInit(): void {
    this.refreshData(true);
  }

  /**
   * Dispara a atualização síncrona da listagem e do saldo do atendimento
   */
  private refreshData(showLoading = false): void {
    this.fetchCostAssistances(showLoading);
    this.fetchBalance();
  }

  /**
   * Busca os auxílios financeiros de forma reativa, performática e segura.
   */
  private fetchCostAssistances(showLoading = false): void {
    const requestId = this.data?.patient_request?.id;

    if (!requestId) {
      this.isLoading.set(false);
      return;
    }

    if (showLoading) {
      this.isLoading.set(true);
    }

    this.costAssistanceService.getCostAssistances(requestId)
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
          this.costAssistancesList.set(response);
        },
        error: () => {
          // Evita estouro de exceções soltas na aplicação e nos testes
        }
      });
  }

  /**
   * Obtém o saldo (balanço) atualizado baseado no atendimento do paciente
   */
  private fetchBalance(): void {
    const careId = this.data?.patient_request?.report?.patient_care?.id;
    if (!careId) return;

    this.costAssistanceService.getBalance(careId)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (response) => {
          this.totalValue.set(response);
        },
        error: () => {}
      });
  }

  /**
   * Centraliza a abertura de modais com tratamento automático reativo pós-fechamento
   */
  private openDialog(
    component: any, 
    data: any, 
    options: { width?: string; refreshWithLoading?: boolean; updateBalance?: boolean } = {}
  ): void {
    this.dialog.open(component, {
      width: options.width || '800px',
      disableClose: true,
      autoFocus: false,
      data
    }).afterClosed()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((result) => {
        // Se a modal retornar true ou se for a modal de diárias (que atualiza dados independentemente do confirm)
        if (result || options.updateBalance) {
          this.refreshData(options.refreshWithLoading || false);
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

  // Métodos de ação disparados pelo template HTML (Modificadores Protected)
  protected createCostAssistance(): void {
    this.openDialog(CreateCostAssistanceComponent, 
      { patient_request: this.data.patient_request },
      { width: '400px', refreshWithLoading: true }
    );
  }

  protected showCostAssistance(costAssistance: CostAssistance): void {
    this.openDialog(ShowCostAssistanceComponent, { cost_assistance: costAssistance });
  }

  protected updateCostAssistance(costAssistance: CostAssistance): void {
    this.openDialog(UpdateCostAssistanceComponent, { cost_assistance: costAssistance }, { width: '500px', refreshWithLoading: true });
  }

  protected deleteCostAssistance(costAssistance: CostAssistance): void {
    this.openDialog(DeleteCostAssistanceComponent, { cost_assistance: costAssistance }, { width: '400px', refreshWithLoading: true });
  }

  protected costAssistanceDailies(costAssistance: CostAssistance): void {
    this.openDialog(CostAssistanceDailiesComponent, 
      { cost_assistance: costAssistance, permissions: this.data?.permissions }, 
      { width: '1000px', refreshWithLoading: true, updateBalance: true }
    );
  }
}