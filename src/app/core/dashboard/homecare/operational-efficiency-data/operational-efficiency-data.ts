import { Component, ChangeDetectionStrategy } from '@angular/core';
import { BaseChartDirective } from 'ng2-charts';
import { ChartConfiguration, ChartOptions } from 'chart.js';
import { MatCardModule } from '@angular/material/card';

@Component({
  selector: 'app-operational-efficiency-data',
  standalone: true,
  imports: [BaseChartDirective, MatCardModule],
  templateUrl: './operational-efficiency-data.html',
  styleUrl: './operational-efficiency-data.scss',
  changeDetection: ChangeDetectionStrategy.OnPush // ⚡ Padrão de alta performance mantido
})
export class OperationalEfficiencyData {

  // Dados focados em KPIs de Eficiência Operacional (Valores em %)
  protected readonly barChartData: ChartConfiguration<'bar'>['data'] = {
    labels: [
      'Pontualidade das Visitas', 
      'Retenção de Pacientes (Alta)', 
      'Adesão ao Plano Terapêutico',
      'Tempo de Resposta (Implantação)', 
      'Resolução de Intercorrências', 
      'Satisfação Geral (NPS)'
    ],
    datasets: [
      {
        data: [94, 88, 91, 85, 89, 92],
        label: 'Eficiência (%)',
        backgroundColor: '#9B2C2C', // 🔴 Vermelho Escuro (Crimson/Material Red 800)
        borderWidth: 0,
        barThickness: 28, // Ajustado para dar um espaçamento elegante entre as barras
        borderRadius: 4   // Arredondado sutil na ponta direita da barra
      }
    ]
  };

  // Configuração customizada para o comportamento horizontal
  protected readonly barChartOptions: ChartOptions<'bar'> = {
    indexAxis: 'y', // 🔁 Inversão de eixo para gráfico horizontal
    responsive: true,
    scales: {
      x: { 
        beginAtZero: true,
        max: 100, // Força o limite em 100% para dar contexto real de eficiência
        ticks: {
          callback: (value) => `${value}%` // Adiciona o símbolo de porcentagem no eixo horizontal
        }
      },
      y: {
        grid: {
          display: false // Limpa as linhas verticais para destacar os textos dos indicadores
        }
      }
    },
    plugins: {
      legend: {
        display: false // Ocultado para manter o visual minimalista
      },
      tooltip: {
        callbacks: {
          label: (context) => ` Eficiência: ${context.parsed.x}%`
        }
      },
      // Configuração mantida caso utilize o chartjs-plugin-datalabels
      datalabels: {
        anchor: 'end',
        align: 'left',
        offset: 8,
        color: '#ffffff', // Contraste branco dentro da barra vermelha
        font: {
          weight: 'bold',
          size: 11
        },
        formatter: (value) => `${value}%`
      }
    },
  };
}