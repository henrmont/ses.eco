import { Component, inject } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import {MatCardModule} from '@angular/material/card';
import {MatIconModule} from '@angular/material/icon';
import { CommonModule } from '@angular/common';
import { NgxMaskPipe } from 'ngx-mask';
import { AirlineCompany } from '../../../enums/airline-company';

@Component({
  selector: 'app-show-travel-component',
  imports: [CommonModule, MatDialogModule, MatButtonModule, MatCardModule, MatIconModule, NgxMaskPipe],
  templateUrl: './show-travel-component.html',
  styleUrl: './show-travel-component.scss',
})
export class ShowTravelComponent {

  protected readonly data = inject(MAT_DIALOG_DATA);
  /**
   * Converte a Key do Enum vinda do banco (ex: "LATAM") no seu Value de exibição (ex: "LATAM Airlines").
   */
  protected getAirlineCompanyLabel(key?: string): string {
    if (!key) return 'Não informada';
    return AirlineCompany[key as keyof typeof AirlineCompany] || key;
  }

}
