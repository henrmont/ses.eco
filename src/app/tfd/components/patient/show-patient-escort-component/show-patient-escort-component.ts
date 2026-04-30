import { Component, inject } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import {MatCardModule} from '@angular/material/card';
import {MatIconModule} from '@angular/material/icon';
import { CommonModule } from '@angular/common';
import { saveAs } from 'file-saver';
import { NgxMaskPipe } from 'ngx-mask';
import { StorageService } from '../../../../core/services/storage-service';

@Component({
  selector: 'app-show-patient-escort-component',
  imports: [CommonModule, MatDialogModule, MatButtonModule, MatCardModule, MatIconModule, NgxMaskPipe],
  templateUrl: './show-patient-escort-component.html',
  styleUrl: './show-patient-escort-component.scss',
})
export class ShowPatientEscortComponent {

  data = inject(MAT_DIALOG_DATA)
  
  constructor(
    private storageService: StorageService
  ) {}

  download(archive: number, name: string) {
    this.storageService.download(archive).subscribe({
      next: (response) => {
        saveAs(response.archive,name)
      }
    })
  }

}
