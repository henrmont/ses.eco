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
  selector: 'app-literal-data',
  imports: [MatCardModule, MatIconModule],
  templateUrl: './literal-data.html',
  styleUrl: './literal-data.scss',
})
export class LiteralData {

  protected readonly dashboardCards: DashboardCard[] = [
    {
      title: 'Solicitações em aberto',
      value: '120',
      icon: 'assignment',
      iconColor: 'rgb(178,102,255)',
      percentage: '-8,4%',
      isUp: false
    },
    {
      title: 'Solicitações realizadas',
      value: '450',
      icon: 'assignment_turned_in',
      iconColor: 'rgb(102,178,255)',
      percentage: '-12,7%',
      isUp: true
    },
    {
      title: 'Passagens emitidas',
      value: '300',
      icon: 'airplane_ticket',
      iconColor: 'rgb(255,125,51)',
      percentage: '-9,5%',
      isUp: true
    },
    {
      title: 'Ajuda de custos realizadas',
      value: '200',
      icon: 'volunteer_activism',
      iconColor: 'rgb(255,51,153)',
      percentage: '-6,3%',
      isUp: true
    },
    {
      title: 'Prestação de contas',
      value: '180',
      icon: 'price_check',
      iconColor: 'rgb(178,102,255)',
      percentage: '-5,9%',
      isUp: true
    },
    {
      title: 'Total de diárias',
      value: '520',
      icon: 'luggage',
      iconColor: 'rgb(102,178,255)',
      percentage: '-7,4%',
      isUp: true
    },
    {
      title: 'Valor pago em diárias',
      value: 'R$ 150.000',
      icon: 'attach_money',
      iconColor: 'rgb(255,125,51)',
      percentage: '-8,1%',
      isUp: true
    },
    {
      title: 'Atendimentos realizados',
      value: '600',
      icon: 'medical_information',
      iconColor: 'rgb(255,51,153)',
      percentage: '-11,2%',
      isUp: true
    }
  ];

}
