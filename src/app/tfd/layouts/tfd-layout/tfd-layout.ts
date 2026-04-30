import { Component, ElementRef, viewChild } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { MatListModule } from '@angular/material/list';
import {MatSidenavModule} from '@angular/material/sidenav';
import {MatMenuModule} from '@angular/material/menu';
import { ActivatedRoute, RouterModule } from '@angular/router';
import { MatDialog, MatDialogRef } from '@angular/material/dialog';
import { MessageService } from '../../../core/services/message-service';
import { LoadingComponent } from '../../../core/components/loading-component/loading-component';
import { CreateUserComponent } from '../../components/user/create-user-component/create-user-component';
import { CreateRoleComponent } from '../../components/role/create-role-component/create-role-component';
import { CreateHospitalUnityComponent } from '../../components/hospital-unity/create-hospital-unity-component/create-hospital-unity-component';
import { DatasusService } from '../../services/datasus-service';
import { CreatePatientComponent } from '../../components/patient/create-patient-component/create-patient-component';
import { CreatePatientRequestComponent } from '../../components/patient-request/create-patient-request-component/create-patient-request-component';
import { ImportTravelsComponent } from '../../components/travel/import-travels-component/import-travels-component';

const TFD_ROLES_CHANNEL = new BroadcastChannel('tfd-roles-channel');
const TFD_USERS_CHANNEL = new BroadcastChannel('tfd-users-channel');
const TFD_HOSPITAL_UNITIES_CHANNEL = new BroadcastChannel('tfd-hospital-unities-channel');
const TFD_SIGTAP_CHANNEL = new BroadcastChannel('tfd-sigtap-channel');
const TFD_PATIENTS_CHANNEL = new BroadcastChannel('tfd-patients-channel');
const TFD_PATIENT_REQUESTS_CHANNEL = new BroadcastChannel('tfd-patient-requests-channel');
const TFD_TRAVELS_CHANNEL = new BroadcastChannel('tfd-travels-channel');

@Component({
  selector: 'app-tfd-layout',
  imports: [MatSidenavModule, MatListModule, MatIconModule, RouterModule, MatMenuModule],
  templateUrl: './tfd-layout.html',
  styleUrl: './tfd-layout.scss',
})
export class TfdLayout {

  constructor(
    private route: ActivatedRoute,
    private dialog: MatDialog,
    private messageService: MessageService,
    private datasusService: DatasusService
  ) {}

  checkPermission(names: string[]): boolean {
    const module = this.route.snapshot.routeConfig?.path
    const roles = this.route.parent?.snapshot.data['user'].roles
    let check = false
    for (const item of roles) {
      const permissions = item.permissions.map(((item: any) => item.name))
      for (const name of names) {
        if (permissions.includes(module+'/'+name))
          check = true
      }
    }
    return check
  }

  createUser() {
    this.dialog.open(CreateUserComponent, {
      width: '700px',
      disableClose: true,
      autoFocus: false,
    }).afterClosed().subscribe(result => {
      if (result)
        TFD_USERS_CHANNEL.postMessage('update')
    })
  }

  createRole() {
    this.dialog.open(CreateRoleComponent, {
      disableClose: true,
      autoFocus: false,
      width: '900px',
    }).afterClosed().subscribe(result => {
      if (result)
        TFD_ROLES_CHANNEL.postMessage('update')
    })
  }

  createHospitalUnity() {
    this.dialog.open(CreateHospitalUnityComponent, {
      width: '500px',
      disableClose: true,
      autoFocus: false,
    }).afterClosed().subscribe(result => {
      if (result)
        TFD_HOSPITAL_UNITIES_CHANNEL.postMessage('update')
    })
  }

  competence = viewChild.required<ElementRef>('competence');
  importCompetence() {
    this.competence().nativeElement.click()
  }

  file!:File
  onFileChange(event: any) {
    if (event.target.files.length > 0 && event.target.files[0].type == 'application/zip') {
      this.loading()
      this.file = event.target.files[0];
      this.datasusService.process(this.file).subscribe({
        next: (response) => {
          this.messageService.showMessage(response.message)
          this.loadingDialog.close();
          TFD_SIGTAP_CHANNEL.postMessage('update')
        },
        error: (error) => {
          this.messageService.showMessage(error.error.message)
        },
      })
    }
  }

  loadingDialog!: MatDialogRef<LoadingComponent>
  loading() {
    this.loadingDialog = this.dialog.open(LoadingComponent, {
      height: '200px',
      disableClose: true,
      autoFocus: false,
    });
  }
        
  createPatient() {
    this.dialog.open(CreatePatientComponent, {
      width: '1200px',
      height: '700px',
      disableClose: true,
      autoFocus: false,
    }).afterClosed().subscribe(result => {
      if (result)
        TFD_PATIENTS_CHANNEL.postMessage('update')
    })
  }

  createPatientRequest() {
    this.dialog.open(CreatePatientRequestComponent, {
      width: '800px',
      height: 'auto',
      disableClose: true,
      autoFocus: false,
    }).afterClosed().subscribe(result => {
      if (result)
        TFD_PATIENT_REQUESTS_CHANNEL.postMessage('update')
    })
  }

  importTravels() {
    this.dialog.open(ImportTravelsComponent, {
      width: '400px',
      height: 'auto',
      disableClose: true,
      autoFocus: false,
    }).afterClosed().subscribe(result => {
      if (result)
        TFD_TRAVELS_CHANNEL.postMessage('update')
    })
  }

}
