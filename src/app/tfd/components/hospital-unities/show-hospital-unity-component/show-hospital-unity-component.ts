import { Component, inject } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import {MatCardModule} from '@angular/material/card';
import {MatIconModule} from '@angular/material/icon';

@Component({
  selector: 'app-show-hospital-unity-component',
  imports: [MatDialogModule, MatButtonModule, MatCardModule, MatIconModule],
  templateUrl: './show-hospital-unity-component.html',
  styleUrl: './show-hospital-unity-component.scss',
})
export class ShowHospitalUnityComponent {

  data = inject(MAT_DIALOG_DATA)

}
