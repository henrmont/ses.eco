import { Component, computed, inject, signal } from '@angular/core';
import { LiteralData } from '../../dashboard/tfd/literal-data/literal-data';
import { PatientRequestData } from '../../dashboard/tfd/patient-request-data/patient-request-data';
import { TravelMonthData } from '../../dashboard/tfd/travel-month-data/travel-month-data';
import { CostAssistanceVsAccountabilityData } from '../../dashboard/tfd/cost-assistance-vs-accountability-data/cost-assistance-vs-accountability-data';
import { SpecialistCareData } from '../../dashboard/tfd/specialist-care-data/specialist-care-data';
import ChartDataLabels from 'chartjs-plugin-datalabels';
import { Chart } from 'chart.js';
import { JudicializedData } from '../../dashboard/transplante/judicialized-data/judicialized-data';
import { SpecialistTransplantData } from '../../dashboard/transplante/specialist-transplant-data/specialist-transplant-data';
import { HomecareLiteralData } from '../../dashboard/homecare/homecare-literal-data/homecare-literal-data';
import { PatientMonthCostData } from '../../dashboard/homecare/patient-month-cost-data/patient-month-cost-data';
import { OperationalEfficiencyData } from '../../dashboard/homecare/operational-efficiency-data/operational-efficiency-data';
import { AuthService } from '../../services/auth-service';
import { AvaliableModules } from '../../enums/avaliable-modules';

Chart.register(ChartDataLabels);

@Component({
  selector: 'app-dashboard-page',
  imports: [LiteralData, PatientRequestData, TravelMonthData, CostAssistanceVsAccountabilityData, SpecialistCareData, JudicializedData, SpecialistTransplantData, HomecareLiteralData, PatientMonthCostData, OperationalEfficiencyData],
  templateUrl: './dashboard-page.html',
  styleUrl: './dashboard-page.scss',
})
export class DashboardPage {
  // Exponha o enum para o template
  protected readonly AvaliableModules = AvaliableModules;

  // Injeção do serviço de autenticação
  private readonly authService = inject(AuthService);

  // Obtém o usuário do AuthService reativamente
  protected readonly currentUser = computed(() => this.authService.currentUser());

  /**
   * Extrai o nome/código do módulo como string em letras minúsculas de forma segura
   */
  protected readonly module = computed<string | undefined>(() => {
    const rawModule = this.currentUser()?.module;
    if (!rawModule) return undefined;

    if (typeof rawModule === 'object' && rawModule !== null) {
      // Faz a conversão intermediária para 'unknown' para evitar o erro TS2352
      const obj = (rawModule as unknown) as Record<string, unknown>;
      return String(obj['name'] || obj['code'] || obj['slug'] || obj['value'] || '').toLowerCase();
    }

    return String(rawModule).toLowerCase();
  });

}
