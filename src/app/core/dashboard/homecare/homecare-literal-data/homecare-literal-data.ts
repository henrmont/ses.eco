import { Component } from '@angular/core';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';

interface DashboardCard {
  title: string;
  value: string | number;
  icon: string;
  iconColor: string;
  percentage: string;
  isUp: boolean; // Controla se a seta vai para cima (green) ou para baixo (red)
}

@Component({
  selector: 'app-homecare-literal-data',
  imports: [MatCardModule, MatIconModule],
  templateUrl: './homecare-literal-data.html',
  styleUrl: './homecare-literal-data.scss',
})
export class HomecareLiteralData {

  protected readonly dashboardCards: DashboardCard[] = [
    {
      title: 'Pacientes Ativos',
      value: '142',
      icon: 'hotel',
      iconColor: 'rgb(102,178,255)', // Azul
      percentage: '+4.2%',
      isUp: true
    },
    {
      title: 'Atendimentos Agendados',
      value: '380',
      icon: 'calendar_month',
      iconColor: 'rgb(178,102,255)', // Roxo
      percentage: '+11.5%',
      isUp: true
    },
    {
      title: 'Oxigenoterapia / Equipamentos',
      value: '64',
      icon: 'vaccines',
      iconColor: 'rgb(255,125,51)', // Laranja
      percentage: '-2.1%',
      isUp: false
    },
    {
      title: 'Visitas Técnicas Concluídas',
      value: '1.240',
      icon: 'engineering',
      iconColor: 'rgb(255,51,153)', // Rosa
      percentage: '+8.7%',
      isUp: true
    }
  ];

}
