import { Component } from '@angular/core';
import { BaseChartDirective } from 'ng2-charts';
import { ChartConfiguration, ChartOptions, Chart } from 'chart.js';
import { MatCardModule } from '@angular/material/card';

@Component({
  selector: 'app-specialist-transplant-data',
  imports: [BaseChartDirective, MatCardModule],
  templateUrl: './specialist-transplant-data.html',
  styleUrl: './specialist-transplant-data.scss',
})
export class SpecialistTransplantData {

  public lineChartData: ChartConfiguration<'line'>['data'] = {
    labels: ['Jan', 'Fev', 'Mar', 'Abr', 'Mai'],
    datasets: [
      {
        data: [120, 150, 80, 100, 130],
        label: 'Cardiologia',
        borderColor: '#E15759',      // Vermelho
        backgroundColor: 'rgba(225, 87, 89, 0.2)',
        fill: true,                  // Preenchimento suave abaixo da linha
        tension: 0.4,                // Curvatura da linha
        pointRadius: 5,
        pointHoverRadius: 8
      },
      {
        data: [80, 95, 120, 80, 180],
        label: 'Nefrologia',
        borderColor: '#4E79A7',      // Azul
        backgroundColor: 'rgba(78, 121, 167, 0.2)',
        fill: true,
        tension: 0.4,
        pointRadius: 5,
        pointHoverRadius: 8
      }
    ]
  };

  public lineChartOptions: ChartOptions<'line'> = {
    responsive: true,
    scales: {
      y: {
        beginAtZero: true,
        grace: '15%', // Espaço no topo para os valores não colarem no teto
        title: {
          display: false,
        }
      }
    },
    plugins: {
      legend: {
        display: true,
        position: 'top'
      },
      datalabels: {
        anchor: 'end',
        align: 'top',
        offset: 5,
        font: { weight: 'bold', size: 11 },
        // Formata para mostrar o valor apenas se necessário
        formatter: (value) => value
      }
    }
  };

}
