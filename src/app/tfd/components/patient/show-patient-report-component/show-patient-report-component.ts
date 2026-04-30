import { Component, inject } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import {MatCardModule} from '@angular/material/card';
import {MatIconModule} from '@angular/material/icon';
import { saveAs } from 'file-saver';
import { StorageService } from '../../../../core/services/storage-service';

@Component({
  selector: 'app-show-patient-report-component',
  imports: [MatDialogModule, MatButtonModule, MatCardModule, MatIconModule],
  templateUrl: './show-patient-report-component.html',
  styleUrl: './show-patient-report-component.scss',
})
export class ShowPatientReportComponent {

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
