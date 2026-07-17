import { ChangeDetectionStrategy, Component } from '@angular/core';

// Componentes Filhos
import { DailiesCostComponent } from '../../components/setting/dailies-cost-component/dailies-cost-component';

@Component({
  selector: 'app-settings-page',
  imports: [
    DailiesCostComponent
  ],
  templateUrl: './settings-page.html',
  styleUrl: './settings-page.scss',
  changeDetection: ChangeDetectionStrategy.OnPush // ⚡ Performance reativa máxima
})
export class SettingsPage {

}