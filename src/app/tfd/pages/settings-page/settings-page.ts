import { ChangeDetectionStrategy, Component } from '@angular/core';
import { CommonModule } from '@angular/common';

// Componentes Filhos
import { DailiesCostComponent } from '../../components/daily-cost/dailies-cost-component/dailies-cost-component';

@Component({
  selector: 'app-settings-page',
  imports: [
    CommonModule, 
    DailiesCostComponent
  ],
  templateUrl: './settings-page.html',
  styleUrl: './settings-page.scss',
  changeDetection: ChangeDetectionStrategy.OnPush // ⚡ Performance reativa máxima
})
export class SettingsPage {

}