import { Component } from '@angular/core';
import { BaseChartDirective } from 'ng2-charts';
import { ChartConfiguration, ChartOptions, Chart } from 'chart.js';
import { MatCardModule } from '@angular/material/card';

@Component({
  selector: 'app-judicialized-data',
  imports: [BaseChartDirective, MatCardModule],
  templateUrl: './judicialized-data.html',
  styleUrl: './judicialized-data.scss',
})
export class JudicializedData {

  public doughnutChartData: ChartConfiguration<'doughnut'>['data'] = {
    labels: ['Judicializado', 'Não Judicializado'],
    datasets: [
      {
        data: [270, 360],
        backgroundColor: ['#E15759', '#76B7B2'], // Vermelho para alerta, Verde/Azul para normal
        hoverOffset: 10,
        borderWidth: 2
      }
    ]
  };

  public doughnutChartOptions: ChartOptions<'doughnut'> = {
    responsive: true,
    plugins: {
      legend: {
        position: 'bottom', // Legenda embaixo para dar destaque à rosca
      },
      datalabels: {
        color: '#fff',
        font: {
          weight: 'bold',
          size: 14
        },
        // FUNÇÃO PARA CALCULAR PERCENTUAL:
        formatter: (value, ctx) => {
          const datasets = ctx.chart.data.datasets;
          const total = (datasets[0].data as number[]).reduce((acc, val) => acc + val, 0);
          const percentage = ((value * 100) / total).toFixed(1) + '%';
          return percentage;
        },
      }
    },
    // Ajuste opcional para o "furo" da rosca (cutout)
    cutout: '60%' 
  };

}
