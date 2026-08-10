import { ChangeDetectionStrategy, Component, DestroyRef, OnDestroy, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { finalize } from 'rxjs';

// Angular Material & CDK
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { Overlay } from '@angular/cdk/overlay';

// Core & Shared
import { BudgetAllocation } from '../../../models/budget-allocation.model';
import { BudgetAllocationUpdateComponent } from '../budget-allocation-update/budget-allocation-update.component';
import { SettingService } from '../../../services/setting.service';

const TFD_SETTINGS_CHANNEL = new BroadcastChannel('tfd-settings-channel');

@Component({
  selector: 'app-budget-allocation',
  standalone: true,
  imports: [
    CommonModule, 
    MatDialogModule,
    MatCardModule, 
    MatIconModule, 
    MatButtonModule, 
    MatProgressSpinnerModule, 
    MatTooltipModule
  ],
  templateUrl: './budget-allocation.component.html',
  styleUrl: './budget-allocation.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class BudgetAllocationComponent implements OnInit, OnDestroy {
  // Injeções de Dependência
  private readonly dialog = inject(MatDialog);
  private readonly overlay = inject(Overlay);
  private readonly settingService = inject(SettingService);
  private readonly destroyRef = inject(DestroyRef);

  // Estados gerenciados reativamente via Signals
  protected readonly budgetAllocation = signal<BudgetAllocation | null>(null);
  protected readonly isLoading = signal<boolean>(true);

  ngOnInit(): void {
    this.fetchBudgetAllocation();

    // Sincronização reativa via BroadcastChannel
    TFD_SETTINGS_CHANNEL.onmessage = (message: MessageEvent<string>) => {
      if (message.data === 'update_budget') {
        this.fetchBudgetAllocation();
      }
    };
  }

  ngOnDestroy(): void {
    TFD_SETTINGS_CHANNEL.close();
  }

  private fetchBudgetAllocation(): void {
    this.isLoading.set(true);

    this.settingService.getBudgetAllocation()
      .pipe(
        finalize(() => this.isLoading.set(false)),
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe({
        next: (response) => {
          this.budgetAllocation.set(response || null);
        },
        error: () => {
          this.budgetAllocation.set(null);
        }
      });
  }

  /**
   * Método de abertura de dialog padronizado no sistema
   */
  private openDialog<T>(
    component: new (...args: any[]) => T, 
    data: { budgetAllocation: BudgetAllocation }, 
    width = '600px', 
    height = 'auto', 
    requiresRefresh = true
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
      .subscribe(result => {
        if (result && requiresRefresh) {
          this.handleDataChange();
        }
      });
  }

  private handleDataChange(): void {
    this.fetchBudgetAllocation();
    TFD_SETTINGS_CHANNEL.postMessage('update_budget');
  }

  // --- MÉTODOS DE AÇÃO DO TEMPLATE (PROTECTED) ---

  protected updateBudgetAllocation(budgetAllocation: BudgetAllocation | null): void { 
    if (!budgetAllocation) return;
    this.openDialog(BudgetAllocationUpdateComponent, { budgetAllocation }); 
  }
}