import { Component, inject } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import {MatCardModule} from '@angular/material/card';
import {MatIconModule} from '@angular/material/icon';
import { NgxMaskPipe } from 'ngx-mask';

@Component({
  selector: 'app-show-user-component',
  imports: [MatDialogModule, MatButtonModule, MatCardModule, MatIconModule, NgxMaskPipe],
  templateUrl: './show-user-component.html',
  styleUrl: './show-user-component.scss',
})
export class ShowUserComponent {

  data = inject(MAT_DIALOG_DATA)

}
