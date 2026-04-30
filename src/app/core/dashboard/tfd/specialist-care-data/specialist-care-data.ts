import { Component } from '@angular/core';
import { BaseChartDirective } from 'ng2-charts';
import { ChartConfiguration, ChartOptions } from 'chart.js';
import { MatCardModule } from '@angular/material/card';

@Component({
  selector: 'app-specialist-care-data',
  imports: [BaseChartDirective, MatCardModule],
  templateUrl: './specialist-care-data.html',
  styleUrl: './specialist-care-data.scss',
})
export class SpecialistCareData {

  public barChartData: ChartConfiguration<'bar'>['data'] = {
    labels: [
      'Ortopedia', 
      'Cardiologia', 
      'Neurologia', 
      'Oftalmologia', 
      'Ginecologia', 
      'Pediatria', 
      'Outras'
    ],
    datasets: [
      {
        data: [120, 100, 80, 70, 60, 50, 120],
        label: 'Atendimentos',
        // Array de cores para cada especialidade
        backgroundColor: '#4E79A7',
        borderWidth: 0,
        barThickness: 35, // Barras com largura moderada
        borderRadius: 5   // Leve arredondado no topo para estética moderna
      }
    ]
  };

  public barChartOptions: ChartOptions<'bar'> = {
    indexAxis: 'y',
    responsive: true,
    scales: {
      x: { 
        beginAtZero: true,
        grace: '10%', // O grace agora atua no eixo X (horizontal)
        title: {
          display: false,
        }
      },
      y: {
        // Eixo Y agora contém apenas as labels (especialidades)
      }
    },
    plugins: {
      legend: {
        display: false // Removida para limpar o visual, já que as legendas estão no eixo X
      },
      datalabels: {
        anchor: 'end',
        align: 'left',
        offset: 5,
        color: 'white',
        font: {
          weight: 'bold',
          size: 12
        }
      }
    },
  };

}
