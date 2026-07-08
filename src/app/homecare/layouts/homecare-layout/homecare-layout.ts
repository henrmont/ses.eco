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
import { CreatePatientComponent } from '../../components/patient/create-patient-component/create-patient-component';

const HOMECARE_USERS_CHANNEL = new BroadcastChannel('homecare-users-channel');
const HOMECARE_ROLES_CHANNEL = new BroadcastChannel('homecare-roles-channel');
const HOMECARE_PATIENTS_CHANNEL = new BroadcastChannel('homecare-patients-channel');

@Component({
  selector: 'app-homecare-layout',
  imports: [MatSidenavModule, MatListModule, MatIconModule, RouterModule],
  templateUrl: './homecare-layout.html',
  styleUrl: './homecare-layout.scss',
})
export class HomecareLayout {

  constructor(
    private route: ActivatedRoute,
    private dialog: MatDialog,
    private messageService: MessageService,
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
        HOMECARE_USERS_CHANNEL.postMessage('update')
    })
  }

  createRole() {
    this.dialog.open(CreateRoleComponent, {
      width: '700px',
      disableClose: true,
      autoFocus: false,
    }).afterClosed().subscribe(result => {
      if (result)
        HOMECARE_ROLES_CHANNEL.postMessage('update')
    })
  }

  createPatient(): void {
    this.dialog.open(CreatePatientComponent, {
      width: '1200px',
      height: '700px',
      disableClose: true,
      autoFocus: false,
    }).afterClosed().subscribe(result => {
      if (result)
        HOMECARE_PATIENTS_CHANNEL.postMessage('update')
    });
  }

}
