import { Component, signal } from '@angular/core';
import { LiteralData } from '../../dashboard/tfd/literal-data/literal-data';
import { PatientRequestData } from '../../dashboard/tfd/patient-request-data/patient-request-data';
import { TravelMonthData } from '../../dashboard/tfd/travel-month-data/travel-month-data';
import { CostAssistanceVsAccountabilityData } from '../../dashboard/tfd/cost-assistance-vs-accountability-data/cost-assistance-vs-accountability-data';
import { SpecialistCareData } from '../../dashboard/tfd/specialist-care-data/specialist-care-data';
import ChartDataLabels from 'chartjs-plugin-datalabels';
import { Chart } from 'chart.js';
import { ActivatedRoute } from '@angular/router';
import { JudicializedData } from '../../dashboard/transplante/judicialized-data/judicialized-data';
import { SpecialistTransplantData } from '../../dashboard/transplante/specialist-transplant-data/specialist-transplant-data';
import { HomecareLiteralData } from '../../dashboard/homecare/homecare-literal-data/homecare-literal-data';
import { PatientMonthCostData } from '../../dashboard/homecare/patient-month-cost-data/patient-month-cost-data';
import { OperationalEfficiencyData } from '../../dashboard/homecare/operational-efficiency-data/operational-efficiency-data';

Chart.register(ChartDataLabels);

@Component({
  selector: 'app-dashboard-page',
  imports: [LiteralData, PatientRequestData, TravelMonthData, CostAssistanceVsAccountabilityData, SpecialistCareData, JudicializedData, SpecialistTransplantData, HomecareLiteralData, PatientMonthCostData, OperationalEfficiencyData],
  templateUrl: './dashboard-page.html',
  styleUrl: './dashboard-page.scss',
})
export class DashboardPage {

  module = signal<string>('')

  constructor(
    private route: ActivatedRoute
  ) {
    this.module.set(this.route.parent?.snapshot.data['user'].module?.name) 
  }

}
