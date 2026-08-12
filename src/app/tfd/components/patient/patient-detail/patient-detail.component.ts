import { Component, DestroyRef, inject } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { NgxMaskPipe } from 'ngx-mask';
import { saveAs } from 'file-saver';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { StorageService } from '../../../../core/services/storage-service';

@Component({
  selector: 'app-patient-detail',
  standalone: true,
  imports: [
    CommonModule, 
    DatePipe, 
    MatDialogModule, 
    MatButtonModule, 
    MatCardModule, 
    MatIconModule, 
    NgxMaskPipe
  ],
  templateUrl: './patient-detail.component.html',
  styleUrl: './patient-detail.component.scss',
})
export class PatientDetailComponent {
  protected readonly data = inject(MAT_DIALOG_DATA, { optional: true });
  private readonly destroyRef = inject(DestroyRef);
  private readonly storageService = inject(StorageService);

  protected download(archiveId: number | null | undefined, name: string): void {
    if (!archiveId) return;

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