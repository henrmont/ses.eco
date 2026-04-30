import { Component, OnInit, signal } from '@angular/core';
import {MatTableDataSource, MatTableModule} from '@angular/material/table';
import {MatInputModule} from '@angular/material/input';
import {MatFormFieldModule} from '@angular/material/form-field';
import {MatButtonModule} from '@angular/material/button';
import {MatIconModule} from '@angular/material/icon';
import {MatTooltipModule} from '@angular/material/tooltip';
import { MatDialog, MatDialogRef } from '@angular/material/dialog';
import { ActivatedRoute } from '@angular/router';
import { UserService } from '../../services/user-service';
import { LoadingComponent } from '../../../core/components/loading-component/loading-component';
import { User } from '../../models/user';
import { Permission } from '../../models/permission';
import { LockUserComponent } from '../../components/user/lock-user-component/lock-user-component';
import { ValidateUserComponent } from '../../components/user/validate-user-component/validate-user-component';
import { ShowUserComponent } from '../../components/user/show-user-component/show-user-component';
import { RolesUserComponent } from '../../components/user/roles-user-component/roles-user-component';
import { DeleteUserComponent } from '../../components/user/delete-user-component/delete-user-component';
import { UpdateUserComponent } from '../../components/user/update-user-component/update-user-component';
import { SearchService } from '../../services/search-service';
import { NgxMaskPipe } from 'ngx-mask';

@Component({
  selector: 'app-search-patient-page',
  imports: [MatFormFieldModule, MatInputModule, MatTableModule, MatButtonModule, MatIconModule, MatTooltipModule, NgxMaskPipe],
  templateUrl: './search-patient-page.html',
  styleUrl: './search-patient-page.scss',
})
export class SearchPatientPage implements OnInit {

  displayedColumns: string[] = ['name','cns','responsible','valid','actions'];
  dataSource = signal<MatTableDataSource<any>>(new MatTableDataSource());
  applyFilter(event: Event) {
    const FILTER_VALUE = (event.target as HTMLInputElement).value;
    this.dataSource().filter = FILTER_VALUE.trim().toLowerCase();
  }

  constructor(
    private searchService: SearchService,
    private dialog: MatDialog,
    private route: ActivatedRoute
  ) {}

  ngOnInit(): void {
    this.getPatients()
  }

  getPatients() {
    this.loading()
    this.searchService.getPatients().subscribe({
      next: (response) => {
        this.dataSource.set(new MatTableDataSource(response
          .map((item: any) => {return {
            name: item.patient.name,
            cns: item.patient.cns,
            document: item.patient.document,
            document_type: item.patient.document_type,
            ...item
          }})
        ))
      },
      complete: () => {
        this.loadingDialog.close()
      }
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
