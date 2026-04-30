import { Component, OnInit, signal } from '@angular/core';
import {MatTableDataSource, MatTableModule} from '@angular/material/table';
import {MatInputModule} from '@angular/material/input';
import {MatFormFieldModule} from '@angular/material/form-field';
import {MatButtonModule} from '@angular/material/button';
import {MatIconModule} from '@angular/material/icon';
import {MatTooltipModule} from '@angular/material/tooltip';
import { MatDialog, MatDialogRef } from '@angular/material/dialog';
import { ActivatedRoute } from '@angular/router';
import { LoadingComponent } from '../../../core/components/loading-component/loading-component';
import { Permission } from '../../models/permission';
import { HospitalUnityService } from '../../services/hospital-unity-service';
import { HospitalUnity } from '../../models/hospital-unity';
import { UpdateHospitalUnityComponent } from '../../components/hospital-unity/update-hospital-unity-component/update-hospital-unity-component';
import { DeleteHospitalUnityComponent } from '../../components/hospital-unity/delete-hospital-unity-component/delete-hospital-unity-component';
import { ShowHospitalUnityComponent } from '../../components/hospital-unity/show-hospital-unity-component/show-hospital-unity-component';

const TFD_HOSPITAL_UNITIES_CHANNEL = new BroadcastChannel('tfd-hospital-unities-channel');

@Component({
  selector: 'app-hospital-unities-page',
  imports: [MatFormFieldModule, MatInputModule, MatTableModule, MatButtonModule, MatIconModule, MatTooltipModule],
  templateUrl: './hospital-unities-page.html',
  styleUrl: './hospital-unities-page.scss',
})
export class HospitalUnitiesPage implements OnInit {

  displayedColumns: string[] = ['name','cnes','actions'];
  dataSource = signal<MatTableDataSource<any>>(new MatTableDataSource());
  applyFilter(event: Event) {
    const FILTER_VALUE = (event.target as HTMLInputElement).value;
    this.dataSource().filter = FILTER_VALUE.trim().toLowerCase();
  }

  constructor(
    private hospitalUnityService: HospitalUnityService,
    private dialog: MatDialog,
    private route: ActivatedRoute
  ) {
    TFD_HOSPITAL_UNITIES_CHANNEL.onmessage = (message) => {
      if (message.data == 'update') {
        this.upgradeHospitalUnities()
      }
    }
  }

  ngOnInit(): void {
    this.getHospitalUnities()
  }

  getHospitalUnities() {
    this.loading()
    this.hospitalUnityService.getHospitalUnities().subscribe({
      next: (response) => {
        this.dataSource.set(new MatTableDataSource(response))
      },
      complete: () => {
        this.loadingDialog.close()
      }
    })
  }

  upgradeHospitalUnities() {
    this.hospitalUnityService.getHospitalUnities().subscribe({
      next: (response) => {
        this.dataSource.set(new MatTableDataSource(response))
      },
    })
  }

  loadingDialog!: MatDialogRef<LoadingComponent>
  loading() {
    this.loadingDialog = this.dialog.open(LoadingComponent, {
      height: '200px',
      disableClose: true,
      autoFocus: false,
    });
  }

  checkPermissions(name: string) {
    const ROLES = this.route.parent?.parent?.snapshot.data['user'].roles
    for (const item of ROLES) {
      if (item.permissions.filter((permission: Permission) => permission.name == name).length > 0)
        return false 
    }
    return true
  }

  showHospitalUnity(hospital_unity: HospitalUnity) {
    this.dialog.open(ShowHospitalUnityComponent, {
      width: '500px',
      disableClose: true,
      autoFocus: false,
      data: {
        hospital_unity: hospital_unity
      }
    })
  }

  updateHospitalUnity(hospital_unity: HospitalUnity) {
    this.dialog.open(UpdateHospitalUnityComponent, {
      width: '500px',
      disableClose: true,
      autoFocus: false,
      data: {
        hospital_unity: hospital_unity
      }
    }).afterClosed().subscribe(result => {
      if (result) {
        this.upgradeHospitalUnities()
        TFD_HOSPITAL_UNITIES_CHANNEL.postMessage('update')
      }
    })
  }

  deleteHospitalUnity(hospital_unity: HospitalUnity) {
    this.dialog.open(DeleteHospitalUnityComponent, {
      width: '400px',
      disableClose: true,
      autoFocus: false,
      data: {
        hospital_unity: hospital_unity
      }
    }).afterClosed().subscribe(result => {
      if (result) {
        this.upgradeHospitalUnities()
        TFD_HOSPITAL_UNITIES_CHANNEL.postMessage('update')
      }
    })
  }

}
