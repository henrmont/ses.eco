import { Component, inject, OnInit, signal } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MAT_DIALOG_DATA, MatDialog, MatDialogModule } from '@angular/material/dialog';
import {MatTableModule, MatTableDataSource} from '@angular/material/table';
import {MatIconModule} from '@angular/material/icon';
import {MatTooltipModule} from '@angular/material/tooltip';
import {MatProgressSpinnerModule} from '@angular/material/progress-spinner';
import { CommonModule } from '@angular/common';
import { CostAssistanceService } from '../../../services/cost-assistance-service';
import { CostAssistance } from '../../../models/cost-assistance';
import { Permission } from '../../../models/permission';
import { CreateCostAssistanceComponent } from '../create-cost-assistance-component/create-cost-assistance-component';
import { UpdateCostAssistanceComponent } from '../update-cost-assistance-component/update-cost-assistance-component';
import { DeleteCostAssistanceComponent } from '../delete-cost-assistance-component/delete-cost-assistance-component';
import { CostAssistanceDailiesComponent } from '../cost-assistance-dailies-component/cost-assistance-dailies-component';
import { ShowCostAssistanceComponent } from '../show-cost-assistance-component/show-cost-assistance-component';

@Component({
  selector: 'app-patient-request-cost-assistances-component',
  imports: [CommonModule, MatDialogModule, MatButtonModule, MatTableModule, MatIconModule, MatTooltipModule, MatProgressSpinnerModule],
  templateUrl: './patient-request-cost-assistances-component.html',
  styleUrl: './patient-request-cost-assistances-component.scss',
})
export class PatientRequestCostAssistancesComponent implements OnInit {

  data = inject(MAT_DIALOG_DATA);
  displayedColumns: string[] = ['name','type','created_at','dailies','actions'];
  dataSource = signal<MatTableDataSource<any>>(new MatTableDataSource());
  isLoading = signal<boolean>(true);
  totalValue = signal<number>(0)

  constructor(
    private dialog: MatDialog,
    private costAssistanceService: CostAssistanceService,
  ) {}

  ngOnInit(): void {
    this.getCostAssistances();
    this.getBalance()
  }

  getCostAssistances() {
    this.costAssistanceService.getCostAssistances(this.data.patient_request.id).subscribe({
      next: (response) => {
        this.dataSource.set(new MatTableDataSource(response))
      },
      complete: () => {
        this.isLoading.set(false);
      }
    })
  }

  getBalance() {
    this.costAssistanceService.getBalance(this.data.patient_request.report.patient_care.id).subscribe({
      next: (response) => {
        this.totalValue.set(response)
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
  
  costAssistanceDailies(cost_assistance: CostAssistance) {
    this.dialog.open(CostAssistanceDailiesComponent, {
      width: '1000px',
      disableClose: true,
      autoFocus: false,
      data: {
        cost_assistance: cost_assistance,
        permissions: this.data.permissions
      }
    }).afterClosed().subscribe(result => {
        this.isLoading.set(true);
        this.getCostAssistances()
        this.getBalance()
    })
  }

  showCostAssistance(cost_assistance: CostAssistance) {
    this.dialog.open(ShowCostAssistanceComponent, {
      width: '800px',
      disableClose: true,
      autoFocus: false,
      data: {
        cost_assistance: cost_assistance
      }
    })
  }

  createCostAssistance() {
    this.dialog.open(CreateCostAssistanceComponent, {
      width: '400px',
      disableClose: true,
      autoFocus: false,
      data: {
        patient_request: this.data.patient_request,
      }
    }).afterClosed().subscribe(result => {
      if (result) {
        this.isLoading.set(true);
        this.getCostAssistances()
      }
    })
  }

  updateCostAssistance(cost_assistance: CostAssistance) {
    this.dialog.open(UpdateCostAssistanceComponent, {
      width: '500px',
      disableClose: true,
      autoFocus: false,
      data: {
        cost_assistance: cost_assistance,
      }
    }).afterClosed().subscribe(result => {
      if (result) {
        this.isLoading.set(true);
        this.getCostAssistances()
      }
    })
  }

  deleteCostAssistance(cost_assistance: CostAssistance) {
    this.dialog.open(DeleteCostAssistanceComponent, {
      width: '400px',
      disableClose: true,
      autoFocus: false,
      data: {
        cost_assistance: cost_assistance,
      }
    }).afterClosed().subscribe(result => {
      if (result) {
        this.isLoading.set(true);
        this.getCostAssistances()
      }
    })
  }

}
