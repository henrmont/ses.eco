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
import { RoleService } from '../../services/role-service';
import { Role } from '../../models/role';
import { Permission } from '../../models/permission';
import { UpdateRoleComponent } from '../../components/role/update-role-component/update-role-component';
import { DeleteRoleComponent } from '../../components/role/delete-role-component/delete-role-component';

const TFD_ROLES_CHANNEL = new BroadcastChannel('tfd-roles-channel');

@Component({
  selector: 'app-roles-page',
  imports: [MatFormFieldModule, MatInputModule, MatTableModule, MatButtonModule, MatIconModule, MatTooltipModule],
  templateUrl: './roles-page.html',
  styleUrl: './roles-page.scss',
})
export class RolesPage implements OnInit {

  loadingDialog!: MatDialogRef<LoadingComponent>
  
  displayedColumns: string[] = ['name','actions'];
  dataSource = signal<MatTableDataSource<Role>>(new MatTableDataSource());
  applyFilter(event: Event) {
    const FILTER_VALUE = (event.target as HTMLInputElement).value;
    this.dataSource().filter = FILTER_VALUE.trim().toLowerCase();
  }

  constructor(
    private roleService: RoleService,
    private dialog: MatDialog,
    private route: ActivatedRoute
  ) {
    TFD_ROLES_CHANNEL.onmessage = (message) => {
      if (message.data === 'update') {
        this.upgradeRoles()
      }
    }
  }

  ngOnInit(): void {
    this.getRoles()
  }

  getRoles() {
    this.loading()
    this.roleService.getRoles().subscribe({
      next: (response) => {
        this.dataSource.set(new MatTableDataSource(response)) 
      },
      complete: () => {
        this.loadingDialog.close()
      }
    })
  }

  upgradeRoles() {
    this.roleService.getRoles().subscribe({
      next: (response) => {
        this.dataSource.set(new MatTableDataSource(response)) 
      },
    })
  }

  checkPermissions(name: string) {
    const ROLES = this.route.parent?.parent?.snapshot.data['user'].roles
    for (const item of ROLES) {
      if (item.permissions.filter((permission: Permission) => permission.name == name).length > 0)
        return false 
    }
    return true
  }

  loading() {
    this.loadingDialog = this.dialog.open(LoadingComponent, {
      height: '200px',
      disableClose: true,
      autoFocus: false,
    });
  }

  ownerRole(role: Role): boolean {
    const OWNER_ROLES = this.route.parent?.parent?.snapshot.data['user'].roles.map((item: any) => item.name)
    if (OWNER_ROLES.includes(role))
      return true
    return false
  }

  updateRole(role: Role) {
    this.dialog.open(UpdateRoleComponent, {
      width: '900px',
      disableClose: true,
      autoFocus: false,
      data: {
        role: role
      }
    }).afterClosed().subscribe(result => {
      if (result){
        this.upgradeRoles()
        TFD_ROLES_CHANNEL.postMessage('update')
      }
    })
  }
  
  deleteRole(role: Role) {
    this.dialog.open(DeleteRoleComponent, {
      width: '400px',
      disableClose: true,
      autoFocus: false,
      data: {
        role: role
      }
    }).afterClosed().subscribe(result => {
      if (result) {
        this.upgradeRoles()
        TFD_ROLES_CHANNEL.postMessage('update')
      }
    })
  }

}
