import { Component } from '@angular/core';
import { BaseChartDirective } from 'ng2-charts';
import { ChartConfiguration, ChartOptions } from 'chart.js';
import { MatCardModule } from '@angular/material/card';

@Component({
  selector: 'app-travel-month-data',
  imports: [BaseChartDirective, MatCardModule],
  templateUrl: './travel-month-data.html',
  styleUrl: './travel-month-data.scss',
})
export class TravelMonthData {

  public lineChartData: ChartConfiguration<'line'>['data'] = {
    labels: ['Jan', 'Fev', 'Mar', 'Abr', 'Mai'],
    datasets: [
      {
        data: [180, 210, 190, 250, 300],
        label: 'Passagens Emitidas',
        borderColor: '#36A2EB',         // Cor da linha
        backgroundColor: 'rgba(54, 162, 235, 0.2)', // Cor da área de preenchimento
        fill: true,                     // Preenche a área abaixo da linha
        tension: 0.4,                   // Deixa a linha curvada/suave
        pointRadius: 6,                 // Tamanho dos pontos
        pointBackgroundColor: '#36A2EB'
      }
    ]
  };

  public lineChartOptions: ChartOptions<'line'> = {
    responsive: true,
    plugins: {
      legend: {
        display: false // Removendo a legenda como solicitado anteriormente
      },
      datalabels: {
        anchor: 'end',
        align: 'top',
        font: { weight: 'bold' }
      }
    },
    scales: {
      y: {
        beginAtZero: true,
        grace: '10%'
      }
    }
  };

}
