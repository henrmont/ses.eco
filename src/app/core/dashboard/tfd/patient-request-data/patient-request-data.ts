import { Component } from '@angular/core';
import { BaseChartDirective } from 'ng2-charts';
import { ChartConfiguration, ChartOptions, Chart } from 'chart.js';
import { MatCardModule } from '@angular/material/card';

@Component({
  selector: 'app-patient-request-data',
  imports: [BaseChartDirective, MatCardModule],
  templateUrl: './patient-request-data.html',
  styleUrl: './patient-request-data.scss',
})
export class PatientRequestData {

  public barChartData: ChartConfiguration<'bar'>['data'] = {
    labels: ['Solicitações realizadas', 'Aprovadas', 'Em aberto', 'Finalizadas'],
    datasets: [{
      data: [450,280,120,250],
      backgroundColor: [
        '#FF6384', // Rosa
        '#36A2EB', // Azul
        '#FFCE56', // Amarelo
        '#4BC0C0', // Verde
      ],
      borderColor: [
        '#FF6384',
        '#36A2EB',
        '#FFCE56',
        '#4BC0C0',
      ],
      barThickness: 50, // Valor fixo em pixels para barras finas
      borderRadius: 5
    }]
  };

  public barChartOptions: ChartOptions<'bar'> = {
    responsive: true,
    scales: {
      y: { 
        beginAtZero: true,
        grace: '15%' // Espaço extra no topo para o valor não ser cortado
      }
    },
    plugins: {
      legend: {
        display: false 
      },
      datalabels: {
        anchor: 'end',
        align: 'top',
        font: { weight: 'bold' }
      }
    }
  };

}
