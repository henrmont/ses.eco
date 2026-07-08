import { Component, ChangeDetectionStrategy } from '@angular/core';
import { BaseChartDirective } from 'ng2-charts';
import { ChartConfiguration, ChartOptions } from 'chart.js';
import { MatCardModule } from '@angular/material/card';

@Component({
  selector: 'app-patient-month-cost-data',
  imports: [BaseChartDirective, MatCardModule],
  templateUrl: './patient-month-cost-data.html',
  styleUrl: './patient-month-cost-data.scss',
})
export class PatientMonthCostData {
  // Configuração dos dados estruturada em escalas de Verde
  protected readonly barChartData: ChartConfiguration<'bar'>['data'] = {
    labels: ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun'],
    datasets: [
      {
        data: [1250, 1300, 1420, 1380, 1500, 1620],
        label: 'Média Ano 2025',
        backgroundColor: '#2E7D32', // Verde Escuro (Forest/Material Green)
        borderColor: '#2E7D32',
        borderWidth: 1,
        barThickness: 40, // Ajustado para 20 para acomodar bem 12 meses lado a lado
        borderRadius: 4
      },
      {
        data: [1400, 1480, 1510, 1600, 1650, 1780],
        label: 'Média Ano 2026',
        backgroundColor: '#66BB6A', // Verde Claro (Mint/Emerald Green)
        borderColor: '#66BB6A',
        borderWidth: 1,
        barThickness: 40,
        borderRadius: 4
      }
    ]
  };

  // Opções de customização e comportamento do gráfico
  protected readonly barChartOptions: ChartOptions<'bar'> = {
    responsive: true,
    scales: {
      x: {
        grid: {
          display: false // Remove linhas verticais de grade para um visual mais limpo
        }
      },
      y: {
        beginAtZero: true,
        grace: '15%', // Espaço confortável no topo para os rótulos de valores altos
        ticks: {
          // Adiciona o prefixo de moeda (R$) no eixo Y
          callback: (value) => `R$ ${value}`
        }
      }
    },
    plugins: {
      legend: {
        display: true,
        position: 'top',
        labels: {
          boxWidth: 15,
          font: { size: 12, weight: 'bold' }
        }
      },
      tooltip: {
        callbacks: {
          // Formata o tooltip flutuante para padrão monetário brasileiro
          label: (context) => {
            let label = context.dataset.label || '';
            if (label) label += ': ';
            if (context.parsed.y !== null) {
              label += new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(context.parsed.y);
            }
            return label;
          }
        }
      },
      // Configuração mantida caso use o plugin chartjs-plugin-datalabels
      datalabels: {
        anchor: 'end',
        align: 'top',
        font: { size: 9, weight: 'bold' },
        formatter: (value) => `R$ ${value}`
      }
    },
  };
}
