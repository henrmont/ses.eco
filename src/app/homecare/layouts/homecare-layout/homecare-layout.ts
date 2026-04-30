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

const HOMECARE_USERS_CHANNEL = new BroadcastChannel('homecare-users-channel');

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

}
