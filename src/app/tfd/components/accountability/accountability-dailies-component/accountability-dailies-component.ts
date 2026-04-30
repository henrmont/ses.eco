import { Component, inject, OnInit, signal } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MAT_DIALOG_DATA, MatDialog, MatDialogModule } from '@angular/material/dialog';
import {MatTableModule, MatTableDataSource} from '@angular/material/table';
import {MatIconModule} from '@angular/material/icon';
import {MatTooltipModule} from '@angular/material/tooltip';
import {MatProgressSpinnerModule} from '@angular/material/progress-spinner';
import { CommonModule } from '@angular/common';
import { Permission } from '../../../models/permission';
import { AccountabilityDaily } from '../../../models/accountability-daily';
import { AccountabilityService } from '../../../services/accountability-service';
import { CreateAccountabilityDailyComponent } from '../create-accountability-daily-component/create-accountability-daily-component';
import { UpdateAccountabilityDailyComponent } from '../update-accountability-daily-component/update-accountability-daily-component';
import { DeleteAccountabilityDailyComponent } from '../delete-accountability-daily-component/delete-accountability-daily-component';

@Component({
  selector: 'app-accountability-dailies-component',
  imports: [CommonModule, MatDialogModule, MatButtonModule, MatTableModule, MatIconModule, MatTooltipModule, MatProgressSpinnerModule],
  templateUrl: './accountability-dailies-component.html',
  styleUrl: './accountability-dailies-component.scss',
})
export class AccountabilityDailiesComponent implements OnInit {

  data = inject(MAT_DIALOG_DATA);
  displayedColumns: string[] = ['name','value','amount','partial','actions'];
  dataSource = signal<MatTableDataSource<AccountabilityDaily>>(new MatTableDataSource());
  isLoading = signal<boolean>(true);
  totalValue = signal<number>(0)

  constructor(
    private dialog: MatDialog,
    private accountabilityService: AccountabilityService,
  ) {}

  ngOnInit(): void {
    this.getAccountabilityDailies();
  }

  getAccountabilityDailies() {
    this.accountabilityService.getAccountabilityDailies(this.data.accountability.id).subscribe({
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
  
  createAccountabilityDaily() {
    this.dialog.open(CreateAccountabilityDailyComponent, {
      width: '500px',
      disableClose: true,
      autoFocus: false,
      data: {
        accountability: this.data.accountability,
      }
    }).afterClosed().subscribe(result => {
      if (result) {
        this.isLoading.set(true);
        this.getAccountabilityDailies()
      }
    })
  }

  updateAccountabilityDaily(accountability_daily: AccountabilityDaily) {
    this.dialog.open(UpdateAccountabilityDailyComponent, {
      width: '500px',
      disableClose: true,
      autoFocus: false,
      data: {
        accountability_daily: accountability_daily,
      }
    }).afterClosed().subscribe(result => {
      if (result) {
        this.isLoading.set(true);
        this.getAccountabilityDailies()
      }
    })
  }

  deleteAccountabilityDaily(accountability_daily: AccountabilityDaily) {
    this.dialog.open(DeleteAccountabilityDailyComponent, {
      width: '400px',
      disableClose: true,
      autoFocus: false,
      data: {
        accountability_daily: accountability_daily,
      }
    }).afterClosed().subscribe(result => {
      if (result) {
        this.isLoading.set(true);
        this.getAccountabilityDailies()
      }
    })
  }

}
