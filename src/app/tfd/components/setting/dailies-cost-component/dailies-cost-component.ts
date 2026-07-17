import { ChangeDetectionStrategy, Component, DestroyRef, OnDestroy, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { finalize } from 'rxjs';

// Angular Material
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatListModule } from '@angular/material/list';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';

// Core & Shared
import { DailyCost } from '../../../models/daily-cost';
import { SettingService } from '../../../services/setting-service';
import { UpdateDailyCostComponent } from '../update-daily-cost-component/update-daily-cost-component';

const TFD_SETTINGS_CHANNEL = new BroadcastChannel('tfd-settings-channel');

@Component({
  selector: 'app-dailies-cost-component',
  imports: [
    CommonModule, 
    MatDialogModule,
    MatCardModule, 
    MatListModule, 
    MatIconModule, 
    MatButtonModule, 
    MatProgressSpinnerModule, 
    MatTooltipModule
  ],
  templateUrl: './dailies-cost-component.html',
  styleUrl: './dailies-cost-component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class DailiesCostComponent implements OnInit, OnDestroy {
  // Injeções de Dependência Dinâmicas
  private readonly dialog = inject(MatDialog);
  private readonly settingService = inject(SettingService);
  private readonly destroyRef = inject(DestroyRef);

  // Estados gerenciados reativamente via Signals
  protected readonly dailiesCost = signal<DailyCost[]>([]);
  protected readonly isLoading = signal<boolean>(true);

  ngOnInit(): void {
    this.fetchDailiesCost();

    // Sincronização em tempo real entre abas/módulos do sistema
    TFD_SETTINGS_CHANNEL.onmessage = (message) => {
      if (message.data === 'update_dailies') {
        this.fetchDailiesCost();
      }
    };
  }

  ngOnDestroy(): void {
    TFD_SETTINGS_CHANNEL.close();
  }

  /**
   * Obtém a listagem atualizada de custos de diárias do servidor
   * e desliga o estado reativo de carregamento da tela.
   */
  private fetchDailiesCost(): void {
    this.isLoading.set(true);

    this.settingService.getDailiesCost()
      .pipe(
        finalize(() => this.isLoading.set(false)),
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe({
        next: (response) => {
          this.dailiesCost.set(response || []);
        },
        error: () => {
          this.dailiesCost.set([]); // Fallback seguro em caso de erro na API
        }
      });
  }

  /**
   * Centralizador genérico para abertura e gerenciamento de modais dialógicos.
   */
  private openDialog(component: any, data: any, width = '400px', height = 'auto', requiresRefresh = true): void {
    this.dialog.open(component, {
      width,
      height,
      disableClose: true,
      autoFocus: false,
      data
    }).afterClosed()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(result => {
        if (result && requiresRefresh) {
          this.handleDataChange();
        }
      });
  }

  /**
   * Executa a atualização local dos dados e notifica outras abas ativas.
   */
  private handleDataChange(): void {
    this.fetchDailiesCost();
    TFD_SETTINGS_CHANNEL.postMessage('update_dailies');
  }

  // --- MÉTODOS DE AÇÃO DO TEMPLATE (PROTECTED) ---

  protected updateDailyCost(dailyCost: DailyCost): void { 
    this.openDialog(UpdateDailyCostComponent, { daily_cost: dailyCost }); 
  }
}