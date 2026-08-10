import { Component, inject } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { CommonModule, CurrencyPipe } from '@angular/common';
import { NgxMaskPipe } from 'ngx-mask';

import { TravelGender } from '../../../enums/travel-gender';

@Component({
  selector: 'app-show-passenger-component',
  standalone: true,
  imports: [
    CommonModule, 
    CurrencyPipe,
    MatDialogModule, 
    MatButtonModule, 
    MatCardModule, 
    MatIconModule, 
    NgxMaskPipe
  ],
  templateUrl: './show-passenger-component.html',
  styleUrl: './show-passenger-component.scss',
})
export class ShowPassengerComponent {
  protected readonly data = inject(MAT_DIALOG_DATA);

  /**
   * Converte a Key do Enum de Sexo vinda do banco (ex: "M") no seu Value de exibição (ex: "Masculino").
   */
  protected getGenderLabel(key?: string): string {
    if (!key) return 'Não informado';
    return TravelGender[key as keyof typeof TravelGender] || key;
  }

  /**
   * Converte a sigla do tipo de passageiro (ADT / CHD) para um rótulo legível.
   */
  protected getPassengerTypeLabel(type?: string): string {
    if (!type) return 'Não informado';
    
    switch (type.toUpperCase()) {
      case 'ADT':
        return 'Adulto (ADT)';
      case 'CHD':
        return 'Criança (CHD)';
      default:
        return type;
    }
  }
}