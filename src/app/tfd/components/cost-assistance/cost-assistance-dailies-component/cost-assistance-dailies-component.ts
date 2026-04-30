import { Component, inject, OnInit, signal } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MAT_DIALOG_DATA, MatDialog, MatDialogModule } from '@angular/material/dialog';
import {MatTableModule, MatTableDataSource} from '@angular/material/table';
import {MatIconModule} from '@angular/material/icon';
import {MatTooltipModule} from '@angular/material/tooltip';
import {MatProgressSpinnerModule} from '@angular/material/progress-spinner';
import { CommonModule } from '@angular/common';
import { CostAssistanceDaily } from '../../../models/cost-assistance-daily';
import { CostAssistanceService } from '../../../services/cost-assistance-service';
import { Permission } from '../../../models/permission';
import { CreateCostAssistanceDailyComponent } from '../create-cost-assistance-daily-component/create-cost-assistance-daily-component';
import { UpdateCostAssistanceDailyComponent } from '../update-cost-assistance-daily-component/update-cost-assistance-daily-component';
import { DeleteCostAssistanceDailyComponent } from '../delete-cost-assistance-daily-component/delete-cost-assistance-daily-component';

@Component({
  selector: 'app-cost-assistance-dailies-component',
  imports: [CommonModule, MatDialogModule, MatButtonModule, MatTableModule, MatIconModule, MatTooltipModule, MatProgressSpinnerModule],
  templateUrl: './cost-assistance-dailies-component.html',
  styleUrl: './cost-assistance-dailies-component.scss',
})
export class CostAssistanceDailiesComponent implements OnInit {

  data = inject(MAT_DIALOG_DATA);
  displayedColumns: string[] = ['name','value','amount','partial','actions'];
  dataSource = signal<MatTableDataSource<CostAssistanceDaily>>(new MatTableDataSource());
  isLoading = signal<boolean>(true);
  totalValue = signal<number>(0)

  constructor(
    private dialog: MatDialog,
    private costAssistanceService: CostAssistanceService,
  ) {}

  ngOnInit(): void {
    this.getCostAssistanceDailies();
  }

  getCostAssistanceDailies() {
    this.costAssistanceService.getCostAssistanceDailies(this.data.cost_assistance.id).subscribe({
      next: (response) => {
        this.totalValue.set(response.map((item: any) => item.amount * item.daily_cost.value).reduce((acc: any, value: any) => acc + value, 0))
        this.dataSource.set(new MatTableDataSource(response.map((item: any) => {
          return {
            ...item,
            partial: item.amount * item.daily_cost.value
          }
        }))
      )},
      complete: () => {
        this.isLoading.set(false);
      }
    })
  }

  checkPermissions(name: string) {
    const ROLES = this.data.permissions
    for (const item of ROLES) {
      if (item.permissions.filter((permission: Permission) => permission.name == name).length > 0)
        return false 
    }
    return true
  }
  
  createCostAssistanceDaily() {
    this.dialog.open(CreateCostAssistanceDailyComponent, {
      width: '500px',
      disableClose: true,
      autoFocus: false,
      data: {
        cost_assistance: this.data.cost_assistance,
      }
    }).afterClosed().subscribe(result => {
      if (result) {
        this.isLoading.set(true);
        this.getCostAssistanceDailies()
      }
    })
  }

  updateCostAssistanceDaily(cost_assistance_daily: CostAssistanceDaily) {
    this.dialog.open(UpdateCostAssistanceDailyComponent, {
      width: '500px',
      disableClose: true,
      autoFocus: false,
      data: {
        cost_assistance_daily: cost_assistance_daily,
      }
    }).afterClosed().subscribe(result => {
      if (result) {
        this.isLoading.set(true);
        this.getCostAssistanceDailies()
      }
    })
  }

  deleteCostAssistanceDaily(cost_assistance_daily: CostAssistanceDaily) {
    this.dialog.open(DeleteCostAssistanceDailyComponent, {
      width: '400px',
      disableClose: true,
      autoFocus: false,
      data: {
        cost_assistance_daily: cost_assistance_daily,
      }
    }).afterClosed().subscribe(result => {
      if (result) {
        this.isLoading.set(true);
        this.getCostAssistanceDailies()
      }
    })
  }

}
