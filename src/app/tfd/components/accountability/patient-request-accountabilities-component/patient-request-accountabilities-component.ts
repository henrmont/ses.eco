import { Component, inject, OnInit, signal } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MAT_DIALOG_DATA, MatDialog, MatDialogModule } from '@angular/material/dialog';
import {MatTableModule, MatTableDataSource} from '@angular/material/table';
import {MatIconModule} from '@angular/material/icon';
import {MatTooltipModule} from '@angular/material/tooltip';
import {MatProgressSpinnerModule} from '@angular/material/progress-spinner';
import { CommonModule } from '@angular/common';
import { Permission } from '../../../models/permission';
import { AccountabilityService } from '../../../services/accountability-service';
import { Accountability } from '../../../models/accountability';
import { CreateAccountabilityComponent } from '../create-accountability-component/create-accountability-component';
import { UpdateAccountabilityComponent } from '../update-accountability-component/update-accountability-component';
import { DeleteAccountabilityComponent } from '../delete-accountability-component/delete-accountability-component';
import { AccountabilityDailiesComponent } from '../accountability-dailies-component/accountability-dailies-component';
import { ShowAccountabilityComponent } from '../show-accountability-component/show-accountability-component';

@Component({
  selector: 'app-patient-request-accountabilities-component',
  imports: [CommonModule, MatDialogModule, MatButtonModule, MatTableModule, MatIconModule, MatTooltipModule, MatProgressSpinnerModule],
  templateUrl: './patient-request-accountabilities-component.html',
  styleUrl: './patient-request-accountabilities-component.scss',
})
export class PatientRequestAccountabilitiesComponent implements OnInit {

  data = inject(MAT_DIALOG_DATA);
  displayedColumns: string[] = ['name','created_at','dailies','actions'];
  dataSource = signal<MatTableDataSource<any>>(new MatTableDataSource());
  isLoading = signal<boolean>(true);
  totalValue = signal<number>(0)

  constructor(
    private dialog: MatDialog,
    private accountabilityService: AccountabilityService,
  ) {}

  ngOnInit(): void {
    this.getAccountabilities();
    this.getBalance()
  }

  getAccountabilities() {
    this.accountabilityService.getAccountabilities(this.data.patient_request.id).subscribe({
      next: (response) => {
        this.dataSource.set(new MatTableDataSource(response))
      },
      complete: () => {
        this.isLoading.set(false);
      }
    })
  }

  getBalance() {
    this.accountabilityService.getBalance(this.data.patient_request.report.patient_care.id).subscribe({
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
  
  accountabilityDailies(accountability: Accountability) {
    this.dialog.open(AccountabilityDailiesComponent, {
      width: '1000px',
      disableClose: true,
      autoFocus: false,
      data: {
        accountability: accountability,
        permissions: this.data.permissions
      }
    }).afterClosed().subscribe(result => {
        this.isLoading.set(true);
        this.getAccountabilities()
        this.getBalance()
    })
  }

  showAccountability(accountability: Accountability) {
    this.dialog.open(ShowAccountabilityComponent, {
      width: '800px',
      disableClose: true,
      autoFocus: false,
      data: {
        accountability: accountability
      }
    })
  }

  createAccountability() {
    this.dialog.open(CreateAccountabilityComponent, {
      width: '400px',
      disableClose: true,
      autoFocus: false,
      data: {
        patient_request: this.data.patient_request,
      }
    }).afterClosed().subscribe(result => {
      if (result) {
        this.isLoading.set(true);
        this.getAccountabilities()
      }
    })
  }

  updateAccountability(accountability: Accountability) {
    this.dialog.open(UpdateAccountabilityComponent, {
      width: '500px',
      disableClose: true,
      autoFocus: false,
      data: {
        accountability: accountability,
      }
    }).afterClosed().subscribe(result => {
      if (result) {
        this.isLoading.set(true);
        this.getAccountabilities()
      }
    })
  }

  deleteAccountability(accountability: Accountability) {
    this.dialog.open(DeleteAccountabilityComponent, {
      width: '400px',
      disableClose: true,
      autoFocus: false,
      data: {
        accountability: accountability,
      }
    }).afterClosed().subscribe(result => {
      if (result) {
        this.isLoading.set(true);
        this.getAccountabilities()
      }
    })
  }

}
