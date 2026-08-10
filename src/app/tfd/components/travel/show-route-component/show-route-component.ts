import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { CommonModule, DatePipe, DecimalPipe } from '@angular/common';

// Angular Material
import { MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { AirlineCompany } from '../../../enums/airline-company';

@Component({
  selector: 'app-show-route-component',
  standalone: true,
  imports: [
    CommonModule, 
    DatePipe,
    DecimalPipe,
    MatDialogModule, 
    MatButtonModule, 
    MatCardModule, 
    MatIconModule
  ],
  templateUrl: './show-route-component.html',
  styleUrl: './show-route-component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ShowRouteComponent {
  protected readonly data = inject(MAT_DIALOG_DATA);
  /**
   * Converte a Key do Enum vinda do banco (ex: "LATAM") no seu Value de exibição (ex: "LATAM Airlines").
   */
  protected getAirlineCompanyLabel(key?: string): string {
    if (!key) return 'Não informada';
    return AirlineCompany[key as keyof typeof AirlineCompany] || key;
  }
}