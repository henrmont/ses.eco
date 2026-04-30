import { Component, inject, OnInit, signal } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MAT_DIALOG_DATA, MatDialog, MatDialogModule } from '@angular/material/dialog';
import {MatTableModule, MatTableDataSource} from '@angular/material/table';
import {MatIconModule} from '@angular/material/icon';
import {MatTooltipModule} from '@angular/material/tooltip';
import {MatProgressSpinnerModule} from '@angular/material/progress-spinner';
import { saveAs } from 'file-saver';
import { CommonModule } from '@angular/common';
import { Permission } from '../../../models/permission';
import { Travel } from '../../../models/travel';
import { TravelService } from '../../../services/travel-service';
import { CreateTravelComponent } from '../create-travel-component/create-travel-component';
import { ShowTravelComponent } from '../show-travel-component/show-travel-component';
import { UpdateTravelComponent } from '../update-travel-component/update-travel-component';
import { DeleteTravelComponent } from '../delete-travel-component/delete-travel-component';
import { TravelPassengersComponent } from '../travel-passengers-component/travel-passengers-component';
import { TravelRoutesComponent } from '../travel-routes-component/travel-routes-component';

@Component({
  selector: 'app-patient-request-travels-component',
  imports: [CommonModule, MatDialogModule, MatButtonModule, MatTableModule, MatIconModule, MatTooltipModule, MatProgressSpinnerModule],
  templateUrl: './patient-request-travels-component.html',
  styleUrl: './patient-request-travels-component.scss',
})
export class PatientRequestTravelsComponent implements OnInit {

  data = inject(MAT_DIALOG_DATA);
  displayedColumns: string[] = ['os','origin','destination','departure_date','actions'];
  dataSource = signal<MatTableDataSource<Travel>>(new MatTableDataSource());
  isLoading = signal<boolean>(true);

  constructor(
    private dialog: MatDialog,
    private travelService: TravelService,
  ) {}

  ngOnInit(): void {
    this.getTravels();
  }

  getTravels() {
    this.travelService.getTravels(this.data.patient_request.id).subscribe({
      next: (response) => {
        this.dataSource.set(new MatTableDataSource(response)) 
      },
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
  
  createTravel() {
    this.dialog.open(CreateTravelComponent, {
      width: '800px',
      disableClose: true,
      autoFocus: false,
      data: {
        patient_request: this.data.patient_request,
      }
    }).afterClosed().subscribe(result => {
      if (result) {
        this.isLoading.set(true);
        this.getTravels()
      }
    })
  }

  showTravel(travel: Travel) {
    this.dialog.open(ShowTravelComponent, {
      width: '800px',
      disableClose: true,
      autoFocus: false,
      data: {
        travel: travel,
      }
    })
  }

  updateTravel(travel: Travel) {
    this.dialog.open(UpdateTravelComponent, {
      width: '800px',
      disableClose: true,
      autoFocus: false,
      data: {
        travel: travel,
      }
    }).afterClosed().subscribe(result => {
      if (result) {
        this.isLoading.set(true);
        this.getTravels()
      }
    })
  }

  deleteTravel(travel: Travel) {
    this.dialog.open(DeleteTravelComponent, {
      width: '400px',
      disableClose: true,
      autoFocus: false,
      data: {
        travel: travel,
      }
    }).afterClosed().subscribe(result => {
      if (result) {
        this.isLoading.set(true);
        this.getTravels()
      }
    })
  }

  passengers(travel: Travel) {
    this.dialog.open(TravelPassengersComponent, {
      width: '1200px',
      disableClose: true,
      autoFocus: false,
      data: {
        travel: travel,
      }
    })
  }

  routes(travel: Travel) {
    this.dialog.open(TravelRoutesComponent, {
      width: '800px',
      disableClose: true,
      autoFocus: false,
      data: {
        travel: travel,
      }
    })
  }

}
