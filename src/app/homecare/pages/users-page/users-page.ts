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
import { User } from '../../models/user';
import { Permission } from '../../models/permission';
import { UserService } from '../../services/user-service';

const HOMECARE_USERS_CHANNEL = new BroadcastChannel('homecare-users-channel');

@Component({
  selector: 'app-users-page',
  imports: [MatFormFieldModule, MatInputModule, MatTableModule, MatButtonModule, MatIconModule, MatTooltipModule],
  templateUrl: './users-page.html',
  styleUrl: './users-page.scss',
})
export class UsersPage {

  displayedColumns: string[] = ['is_editable','email','name','type','is_valid','actions'];
  dataSource = signal<MatTableDataSource<any>>(new MatTableDataSource());
  applyFilter(event: Event) {
    const FILTER_VALUE = (event.target as HTMLInputElement).value;
    this.dataSource().filter = FILTER_VALUE.trim().toLowerCase();
  }

  constructor(
    private userService: UserService,
    private dialog: MatDialog,
    private route: ActivatedRoute
  ) {
    HOMECARE_USERS_CHANNEL.onmessage = (message) => {
      if (message.data == 'update') {
        this.upgradeUsers()
      }
    }
  }

  ngOnInit(): void {
    this.getUsers()
  }

  getUsers() {
    this.loading()
    this.userService.getUsers().subscribe({
      next: (response) => {
        this.dataSource.set(new MatTableDataSource(response.map((item: any) => {return {
          id: item.id,
          email: item.email,
          name: item.professional?.name || item.name,
          type: item.professional?.type || 'Não alocado',
          module: item.modules?.[0],
          professional: item.professional,
          roles: item.roles
        }}))) 
      },
      complete: () => {
        this.loadingDialog.close()
      }
    })
  }

  upgradeUsers() {
    this.userService.getUsers().subscribe({
      next: (response) => {
        this.dataSource.set(new MatTableDataSource(response.map((item: any) => {return {
          id: item.id,
          email: item.email,
          name: item.professional?.name || item.name,
          type: item.professional?.type || 'Não alocado',
          module: item.modules?.[0],
          professional: item.professional,
          roles: item.roles
        }})))
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

  checkEditable(user: User): boolean {
    const USER = this.route.parent?.parent?.snapshot.data['user']
    if (USER.id == user.id) 
      return false
    return !user.module?.pivot.is_editable
  }

  checkPermissions(name: string) {
    const ROLES = this.route.parent?.parent?.snapshot.data['user'].roles
    for (const item of ROLES) {
      if (item.permissions.filter((permission: Permission) => permission.name == name).length > 0)
        return false 
    }
    return true
  }

  lockUser(user: User) {
    // this.dialog.open(LockUserComponent, {
    //   width: '400px',
    //   disableClose: true,
    //   autoFocus: false,
    //   data: {
    //     user: user
    //   }
    // }).afterClosed().subscribe(result => {
    //   if (result) {
    //     this.upgradeUsers()
    //     TFD_USERS_CHANNEL.postMessage('update')
    //   }
    // })
  }

  validateUser(user: User) {
    // this.dialog.open(ValidateUserComponent, {
    //   width: '400px',
    //   disableClose: true,
    //   autoFocus: false,
    //   data: {
    //     user: user
    //   }
    // }).afterClosed().subscribe(result => {
    //   if (result) {
    //     this.upgradeUsers()
    //     TFD_USERS_CHANNEL.postMessage('update')
    //   }
    // })
  }

  showUser(user: User) {
    // this.dialog.open(ShowUserComponent, {
    //   width: '700px',
    //   disableClose: true,
    //   autoFocus: false,
    //   data: {
    //     user: user
    //   }
    // })
  }

  rolesUser(user: User) {
    // this.dialog.open(RolesUserComponent, {
    //   width: '400px',
    //   disableClose: true,
    //   autoFocus: false,
    //   data: {
    //     user: user,
    //   }
    // }).afterClosed().subscribe(result => {
    //   if (result) {
    //     this.upgradeUsers()
    //     TFD_USERS_CHANNEL.postMessage('update')
    //   }
    // })
  }

  updateUser(user: User) {
    // this.dialog.open(UpdateUserComponent, {
    //   width: '700px',
    //   disableClose: true,
    //   autoFocus: false,
    //   data: {
    //     user: user
    //   }
    // }).afterClosed().subscribe(result => {
    //   if (result) {
    //     this.upgradeUsers()
    //     TFD_USERS_CHANNEL.postMessage('update')
    //   }
    // })
  }

  deleteUser(user: User) {
    // this.dialog.open(DeleteUserComponent, {
    //   width: '400px',
    //   disableClose: true,
    //   autoFocus: false,
    //   data: {
    //     user: user
    //   }
    // }).afterClosed().subscribe(result => {
    //   if (result) {
    //     this.upgradeUsers()
    //     TFD_USERS_CHANNEL.postMessage('update')
    //   }
    // })
  }

}
