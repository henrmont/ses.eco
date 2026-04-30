import { Component, inject } from '@angular/core';
import {MatDialogModule, MAT_DIALOG_DATA} from '@angular/material/dialog';
import {MatIconModule} from '@angular/material/icon';
import {MatButtonModule} from '@angular/material/button';
import {MatListModule} from '@angular/material/list';
import { ProfileService } from '../../services/profile-service';

@Component({
  selector: 'app-change-profile-module-component',
  imports: [MatDialogModule, MatIconModule, MatButtonModule, MatListModule],
  templateUrl: './change-profile-module-component.html',
  styleUrl: './change-profile-module-component.scss',
})
export class ChangeProfileModuleComponent {

  public data = inject(MAT_DIALOG_DATA);

  constructor(
    private profileService: ProfileService,
  ) {}

  changeProfileModule(module: number) {
    this.profileService.changeProfileModule(module).subscribe({
      complete: () => {
        window.location.href = 'principal'
      }
    })
  }

  checkModule(module: number): boolean {
    if (this.data.user.module_id == module) {
      return true
    }
    return false
  }

}
