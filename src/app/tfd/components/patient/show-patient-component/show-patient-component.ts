import { Component, DestroyRef, inject } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import {MatCardModule} from '@angular/material/card';
import {MatIconModule} from '@angular/material/icon';
import { CommonModule } from '@angular/common';
import { saveAs } from 'file-saver';
import { NgxMaskPipe } from 'ngx-mask';
import { StorageService } from '../../../../core/services/storage-service';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';

@Component({
  selector: 'app-show-patient-component',
  imports: [CommonModule, MatDialogModule, MatButtonModule, MatCardModule, MatIconModule, NgxMaskPipe],
  templateUrl: './show-patient-component.html',
  styleUrl: './show-patient-component.scss',
})
export class ShowPatientComponent {

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
