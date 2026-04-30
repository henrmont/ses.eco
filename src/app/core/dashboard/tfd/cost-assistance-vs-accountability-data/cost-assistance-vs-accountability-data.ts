import { Component } from '@angular/core';
import { BaseChartDirective } from 'ng2-charts';
import { ChartConfiguration, ChartOptions } from 'chart.js';
import { MatCardModule } from '@angular/material/card';

@Component({
  selector: 'app-cost-assistance-vs-accountability-data',
  imports: [BaseChartDirective, MatCardModule],
  templateUrl: './cost-assistance-vs-accountability-data.html',
  styleUrl: './cost-assistance-vs-accountability-data.scss',
})
export class CostAssistanceVsAccountabilityData {

  public barChartData: ChartConfiguration<'bar'>['data'] = {
    labels: ['Jan', 'Fev', 'Mar', 'Abr', 'Mai'],
    datasets: [
      {
        data: [120, 150, 160, 170, 200],
        label: 'Ajuda de Custo',
        backgroundColor: '#36A2EB', // Azul
        borderColor: '#36A2EB',
        borderWidth: 1,
        barThickness: 40, // Deixa a barra fina
        borderRadius: 5
      },
      {
        data: [90, 110, 130, 150, 180],
        label: 'Prestação de Contas',
        backgroundColor: '#FF6384', // Rosa/Vermelho
        borderColor: '#FF6384',
        borderWidth: 1,
        barThickness: 40, // Deixa a barra fina
        borderRadius: 5
      }
    ]
  };

  public barChartOptions: ChartOptions<'bar'> = {
    responsive: true,
    scales: {
      y: {
        beginAtZero: true,
        grace: '10%' // Garante espaço para o valor de 200 no topo
      }
    },
    plugins: {
      legend: {
        display: true, // Aqui a legenda é útil para distinguir AC de PC
        position: 'top'
      },
      datalabels: {
        anchor: 'end',
        align: 'top',
        font: { size: 10, weight: 'bold' }
      }
    },
  };

}
