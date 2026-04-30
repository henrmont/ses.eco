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
import { CreateRouteComponent } from '../create-route-component/create-route-component';
import { Route } from '../../../models/route';
import { UpdateRouteComponent } from '../update-route-component/update-route-component';
import { DeleteRouteComponent } from '../delete-route-component/delete-route-component';

@Component({
  selector: 'app-travel-routes-component',
  imports: [CommonModule, MatDialogModule, MatButtonModule, MatTableModule, MatIconModule, MatTooltipModule, MatProgressSpinnerModule],
  templateUrl: './travel-routes-component.html',
  styleUrl: './travel-routes-component.scss',
})
export class TravelRoutesComponent implements OnInit {

  data = inject(MAT_DIALOG_DATA);
  displayedColumns: string[] = ['origin','destination','distance','actions'];
  dataSource = signal<MatTableDataSource<Travel>>(new MatTableDataSource());
  isLoading = signal<boolean>(true);
  totalDistance = signal<number>(0)

  constructor(
    private dialog: MatDialog,
    private travelService: TravelService,
  ) {}

  ngOnInit(): void {
    this.getRoutes();
  }

  getRoutes() {
    this.travelService.getRoutes(this.data.travel.id).subscribe({
      next: (response) => {
        this.totalDistance.set(response.map((item: any) => item.distance).reduce((acc: any, value: any) => acc + value, 0))
        this.dataSource.set(new MatTableDataSource(response))
      },
      complete: () => {
        this.isLoading.set(false);
      }
    })
  }

  createRoute() {
    this.dialog.open(CreateRouteComponent, {
      width: '400px',
      disableClose: true,
      autoFocus: false,
      data: {
        travel: this.data.travel,
      }
    }).afterClosed().subscribe(result => {
      if (result) {
        this.isLoading.set(true);
        this.getRoutes()
      }
    })
  }

  updateRoute(route: Route) {
    this.dialog.open(UpdateRouteComponent, {
      width: '400px',
      disableClose: true,
      autoFocus: false,
      data: {
        route: route,
      }
    }).afterClosed().subscribe(result => {
      if (result) {
        this.isLoading.set(true);
        this.getRoutes()
      }
    })
  }

  deleteRoute(route: Route) {
    this.dialog.open(DeleteRouteComponent, {
      width: '400px',
      disableClose: true,
      autoFocus: false,
      data: {
        route: route,
      }
    }).afterClosed().subscribe(result => {
      if (result) {
        this.isLoading.set(true);
        this.getRoutes()
      }
    })
  }

}
