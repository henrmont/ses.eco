import { Component, inject } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import {MatCardModule} from '@angular/material/card';
import {MatIconModule} from '@angular/material/icon';
import { CommonModule } from '@angular/common';
import { NgxMaskPipe } from 'ngx-mask';

@Component({
  selector: 'app-show-accountability-component',
  imports: [CommonModule, MatDialogModule, MatButtonModule, MatCardModule, MatIconModule, NgxMaskPipe],
  templateUrl: './show-accountability-component.html',
  styleUrl: './show-accountability-component.scss',
})
export class ShowAccountabilityComponent {

  data = inject(MAT_DIALOG_DATA)

}
