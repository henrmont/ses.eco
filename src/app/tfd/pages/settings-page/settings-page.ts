import { Component } from '@angular/core';
import { DailiesCostComponent } from '../../components/daily-cost/dailies-cost-component/dailies-cost-component';

@Component({
  selector: 'app-settings-page',
  imports: [DailiesCostComponent],
  templateUrl: './settings-page.html',
  styleUrl: './settings-page.scss',
})
export class SettingsPage {

}
