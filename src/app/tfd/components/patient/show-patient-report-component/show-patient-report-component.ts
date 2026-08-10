import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { saveAs } from 'file-saver';

import { StorageService } from '../../../../core/services/storage-service';
import { Specialty } from '../../../enums/specialties';

@Component({
  selector: 'app-show-patient-report-component',
  standalone: true,
  imports: [MatDialogModule, MatButtonModule, MatCardModule, MatIconModule, MatTooltipModule],
  templateUrl: './show-patient-report-component.html',
  styleUrl: './show-patient-report-component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ShowPatientReportComponent {
  protected readonly data = inject(MAT_DIALOG_DATA);
  private readonly storageService = inject(StorageService);

  // Getter simples para mapear a especialidade sem lógica adicional no ngOnInit
  protected get specialtyLabel(): string {
    const rawSpecialty = this.data?.report?.specialty;
    return Specialty[rawSpecialty as keyof typeof Specialty] ?? rawSpecialty ?? 'Não informado';
  }

  protected download(archiveId: number, name: string): void {
    if (!archiveId) return;

    this.storageService.download(archiveId)
      .pipe(takeUntilDestroyed())
      .subscribe({
        next: (response) => {
          if (response?.archive) {
            saveAs(response.archive, name);
          }
        }
      });
  }
}