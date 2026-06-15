import { ChangeDetectionStrategy, Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatListModule } from '@angular/material/list';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { finalize } from 'rxjs';

// Modelos & Serviços
import { DailyCost } from '../../../models/daily-cost';
import { SettingService } from '../../../services/setting-service';
import { UpdateDailyCostComponent } from '../update-daily-cost-component/update-daily-cost-component';

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
  changeDetection: ChangeDetectionStrategy.OnPush // ⚡ Performance reativa otimizada
})
export class DailiesCostComponent implements OnInit {
  // 🔒 Injeções de dependência modernas com inject()
  private readonly dialog = inject(MatDialog);
  private readonly settingService = inject(SettingService);

  // 🚦 Signals de estado reativo
  readonly dailiesCost = signal<DailyCost[]>([]);
  readonly isLoading = signal<boolean>(true);

  ngOnInit(): void {
    this.getDailyCosts();
  }

  getDailyCosts(): void {
    this.isLoading.set(true);

    this.settingService.getDailiesCost()
      .pipe(finalize(() => this.isLoading.set(false))) // Garante o desligamento do loading de forma segura
      .subscribe({
        next: (response) => {
          this.dailiesCost.set(response || []);
        },
        error: () => {
          this.dailiesCost.set([]); // Fallback seguro em caso de erro na API
        }
      });
  }

  updateDailyCost(daily_cost: DailyCost): void {
    this.dialog.open(UpdateDailyCostComponent, {
      width: '400px',
      disableClose: true,
      autoFocus: false,
      data: { daily_cost }
    })
    .afterClosed()
    .subscribe({
      next: (result) => {
        if (result) {
          this.getDailyCosts(); // Atualiza a listagem caso o modal retorne true
        }
      }
    });
  }
}