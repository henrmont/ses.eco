import { Component, DestroyRef, inject } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import {MatCardModule} from '@angular/material/card';
import {MatIconModule} from '@angular/material/icon';
import { saveAs } from 'file-saver';
import { StorageService } from '../../../../core/services/storage-service';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';

@Component({
  selector: 'app-show-patient-report-component',
  imports: [MatDialogModule, MatButtonModule, MatCardModule, MatIconModule],
  templateUrl: './show-patient-report-component.html',
  styleUrl: './show-patient-report-component.scss',
})
export class ShowPatientReportComponent {

  protected readonly data = inject(MAT_DIALOG_DATA)
  private readonly destroyRef = inject(DestroyRef);
  private readonly storageService = inject(StorageService);
  
  protected download(archiveId: number, name: string): void {
    this.storageService.download(archiveId)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (response) => {
          if (response?.archive) {
            saveAs(response.archive, name);
          }
        }
      });
  }

}
