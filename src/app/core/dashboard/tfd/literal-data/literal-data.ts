import { CommonModule } from '@angular/common';
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
  imports: [
    CommonModule,
    MatCardModule, 
    MatIconModule
  ],
  templateUrl: './literal-data.html',
  styleUrl: './literal-data.scss',
})
export class LiteralData {

  protected readonly dashboardCards: DashboardCard[] = [
    {
      title: 'SOLICITAÇÕES EM ABERTO',
      value: '120',
      icon: 'assignment',
      iconColor: 'rgb(178,102,255)',
      percentage: '-8,4%',
      isUp: false
    },
    {
      title: 'SOLICITAÇÕES REALIZADAS',
      value: '450',
      icon: 'assignment_turned_in',
      iconColor: 'rgb(102,178,255)',
      percentage: '-12,7%',
      isUp: true
    },
    {
      title: 'PASSAGENS EMITIDAS',
      value: '300',
      icon: 'airplane_ticket',
      iconColor: 'rgb(255,125,51)',
      percentage: '-9,5%',
      isUp: true
    },
    {
      title: 'AJUDA DE CUSTOS REALIZADAS',
      value: '200',
      icon: 'volunteer_activism',
      iconColor: 'rgb(255,51,153)',
      percentage: '-6,3%',
      isUp: true
    },
    {
      title: 'PRESTAÇÃO DE CONTAS',
      value: '180',
      icon: 'price_check',
      iconColor: 'rgb(178,102,255)',
      percentage: '-5,9%',
      isUp: true
    },
    {
      title: 'TOTAL DE DIÁRIAS',
      value: '520',
      icon: 'luggage',
      iconColor: 'rgb(102,178,255)',
      percentage: '-7,4%',
      isUp: true
    },
    {
      title: 'VALOR PAGO EM DIÁRIAS',
      value: 'R$ 150.000',
      icon: 'monetization_on',
      iconColor: 'rgb(255,125,51)',
      percentage: '-8,1%',
      isUp: true
    },
    {
      title: 'ATENDIMENTOS REALIZADOS',
      value: '600',
      icon: 'medical_information',
      iconColor: 'rgb(255,51,153)',
      percentage: '-11,2%',
      isUp: true
    }
  ];

}
