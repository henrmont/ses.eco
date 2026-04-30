import { Component, signal } from '@angular/core';
import { ActivatedRoute, RouterModule } from '@angular/router';
import {MatSidenavModule} from '@angular/material/sidenav';
import {MatListModule} from '@angular/material/list';
import {MatIconModule} from '@angular/material/icon';
import {MatToolbarModule} from '@angular/material/toolbar';
import {MatMenuModule} from '@angular/material/menu';
import {MatButtonModule} from '@angular/material/button';
import {MatDialog} from '@angular/material/dialog';
import { AuthService } from '../../services/auth-service';
import { User } from '../../models/user';
import { Module } from '../../models/module';
import { ChangeProfileModuleComponent } from '../../components/change-profile-module-component/change-profile-module-component';
import { ChangeProfileImageComponent } from '../../components/change-profile-image-component/change-profile-image-component';
import { ChangeProfileInfoComponent } from '../../components/change-profile-info-component/change-profile-info-component';

@Component({
  selector: 'app-core-layout',
  imports: [RouterModule, MatSidenavModule, MatListModule, MatIconModule, MatToolbarModule, MatMenuModule, MatButtonModule],
  templateUrl: './core-layout.html',
  styleUrl: './core-layout.scss',
})
export class CoreLayout {

  user = signal<User>({} as User);
  module = signal<Module>({} as Module);

  constructor (
    private route: ActivatedRoute,
    private authService: AuthService,
    private dialog: MatDialog,
  ) {
    this.user.set(this.route.snapshot.data['user'])
    this.module.set(this.route.snapshot.data['user'].module)
  }

  logout() {
    this.authService.logout().subscribe({
      next: () => {
        window.localStorage.clear()
      },
      complete: () => {
        window.location.reload();
      }
    })
  }

  // moduleStatus = true
  // checkModuleStatus() {
  //   this.mainService.getUserModule(this.user.module_id).subscribe({
  //     next: (response) => {
  //       const url = fetch(response.url, { method: 'GET', mode: 'no-cors' })
  //       url.then((res) => {
  //         this.moduleStatus = false
  //       })
  //     },
  //   })
  // }

  changeProfileModule() {
    this.dialog.open(ChangeProfileModuleComponent, {
      disableClose: true,
      autoFocus: false,
      data: {
        user: this.user(),
      }
    })
  }

  openAboutBox() {
    
  }

  onFileSelected(event: any) {
    this.changeProfileImage(event)
  }

  changeProfileImage(event: any) {
    this.dialog.open(ChangeProfileImageComponent, {
      disableClose: true,
      autoFocus: false,
      data: {
        user: this.user(),
        event: event
      }
    }).afterClosed().subscribe(result => {
      this.user.update(user => ({
        ...user,
        image: result ? result.value : user.image
      }))
    })
  }

  changeProfileInfo() {
    this.dialog.open(ChangeProfileInfoComponent, {
      disableClose: true,
      autoFocus: false,
      width: '400px',
      data: {
        user: this.user(),
      }
    }).afterClosed().subscribe(result => {
      this.user.update(user => ({
        ...user,
        name: result ? result.value : user.name
      }))
    })
  }

}
