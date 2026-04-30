import { Component, OnInit, signal } from '@angular/core';
import {MatButtonModule} from '@angular/material/button';
import {MatCardModule} from '@angular/material/card';
import {MatListModule} from '@angular/material/list';
import {MatIconModule} from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatDialog } from '@angular/material/dialog';
import { CommonModule } from '@angular/common';
import { MatTooltipModule } from '@angular/material/tooltip';
import { DailyCost } from '../../../models/daily-cost';
import { SettingService } from '../../../services/setting-service';
import { UpdateDailyCostComponent } from '../update-daily-cost-component/update-daily-cost-component';

@Component({
  selector: 'app-dailies-cost-component',
  imports: [CommonModule, MatCardModule, MatListModule, MatIconModule, MatButtonModule, MatProgressSpinnerModule, MatTooltipModule],
  templateUrl: './dailies-cost-component.html',
  styleUrl: './dailies-cost-component.scss',
})
export class DailiesCostComponent implements OnInit {

  dailiesCost = signal<DailyCost[]>([]);
  isLoading = signal<boolean>(true);
  
  constructor(
    private dialog: MatDialog,
    private settingService: SettingService
  ) {}

  ngOnInit(): void {
    this.getDailyCosts();
  }

  getDailyCosts() {
    this.settingService.getDailiesCost().subscribe({
      next: (response) => {
        this.dailiesCost.set(response);
      },
      complete: () => {
        this.isLoading.set(false);
      }
    });
  }

  updateDailyCost(daily_cost: DailyCost) {
    this.dialog.open(UpdateDailyCostComponent, {
      width: '400px',
      disableClose: true,
      autoFocus: false,
      data: {
        daily_cost: daily_cost
      }
    }).afterClosed().subscribe(result => {
      if (result)
        this.getDailyCosts();
    })
  }

}
