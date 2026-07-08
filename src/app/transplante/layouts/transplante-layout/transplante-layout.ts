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

const TRANSPLANTE_USERS_CHANNEL = new BroadcastChannel('transplante-users-channel');
const TRANSPLANTE_ROLES_CHANNEL = new BroadcastChannel('transplante-roles-channel');
const TRANSPLANTE_PATIENTS_CHANNEL = new BroadcastChannel('transplante-patients-channel');

@Component({
  selector: 'app-transplante-layout',
  imports: [MatSidenavModule, MatListModule, MatIconModule, RouterModule],
  templateUrl: './transplante-layout.html',
  styleUrl: './transplante-layout.scss',
})
export class TransplanteLayout {

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
        TRANSPLANTE_USERS_CHANNEL.postMessage('update')
    })
  }

  createRole() {
    this.dialog.open(CreateRoleComponent, {
      width: '700px',
      disableClose: true,
      autoFocus: false,
    }).afterClosed().subscribe(result => {
      if (result)
        TRANSPLANTE_ROLES_CHANNEL.postMessage('update')
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
        TRANSPLANTE_PATIENTS_CHANNEL.postMessage('update')
    });
  }

}
