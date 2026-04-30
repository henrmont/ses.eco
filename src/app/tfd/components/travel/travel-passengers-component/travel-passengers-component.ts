import { Component, inject, OnInit, signal } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MAT_DIALOG_DATA, MatDialog, MatDialogModule } from '@angular/material/dialog';
import {MatTableModule, MatTableDataSource} from '@angular/material/table';
import {MatIconModule} from '@angular/material/icon';
import {MatTooltipModule} from '@angular/material/tooltip';
import {MatProgressSpinnerModule} from '@angular/material/progress-spinner';
import { CommonModule } from '@angular/common';
import { Travel } from '../../../models/travel';
import { TravelService } from '../../../services/travel-service';
import { CreatePassengerComponent } from '../create-passenger-component/create-passenger-component';
import { UpdatePassengerComponent } from '../update-passenger-component/update-passenger-component';
import { Passenger } from '../../../models/passenger';
import { DeletePassengerComponent } from '../delete-passenger-component/delete-passenger-component';

@Component({
  selector: 'app-travel-passengers-component',
  imports: [CommonModule, MatDialogModule, MatButtonModule, MatTableModule, MatIconModule, MatTooltipModule, MatProgressSpinnerModule],
  templateUrl: './travel-passengers-component.html',
  styleUrl: './travel-passengers-component.scss',
})
export class TravelPassengersComponent implements OnInit {

  data = inject(MAT_DIALOG_DATA);
  displayedColumns: string[] = ['passenger','is_patient','tariff','tax','total','actions'];
  dataSource = signal<MatTableDataSource<Travel>>(new MatTableDataSource());
  isLoading = signal<boolean>(true);
  totalValue = signal<number>(0)

  constructor(
    private dialog: MatDialog,
    private travelService: TravelService,
  ) {}

  ngOnInit(): void {
    this.getPassengers();
  }

  getPassengers() {
    this.travelService.getPassengers(this.data.travel.id).subscribe({
      next: (response) => {
        this.totalValue.set(response.map((item: any) => item.tariff+item.tax).reduce((acc: any, value: any) => acc + value, 0))
        this.dataSource.set(new MatTableDataSource(response.map((item: any) => {
          return {
            ...item,
            total: item.tariff + item.tax
          }
        }))
      )},
      complete: () => {
        this.isLoading.set(false);
      }
    })
  }

  createPassenger() {
    this.dialog.open(CreatePassengerComponent, {
      width: '600px',
      disableClose: true,
      autoFocus: false,
      data: {
        travel: this.data.travel,
      }
    }).afterClosed().subscribe(result => {
      if (result) {
        this.isLoading.set(true);
        this.getPassengers()
      }
    })
  }

  updatePassenger(passenger: Passenger) {
    this.dialog.open(UpdatePassengerComponent, {
      width: '600px',
      disableClose: true,
      autoFocus: false,
      data: {
        passenger: passenger,
      }
    }).afterClosed().subscribe(result => {
      if (result) {
        this.isLoading.set(true);
        this.getPassengers()
      }
    })
  }

  deletePassenger(passenger: Passenger) {
    this.dialog.open(DeletePassengerComponent, {
      width: '400px',
      disableClose: true,
      autoFocus: false,
      data: {
        passenger: passenger,
      }
    }).afterClosed().subscribe(result => {
      if (result) {
        this.isLoading.set(true);
        this.getPassengers()
      }
    })
  }

}
