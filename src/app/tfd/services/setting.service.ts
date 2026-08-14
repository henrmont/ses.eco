import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';

// Core & Environment
import { environment } from '../../../environments/environment.development';
import { ApiResponse } from '../../core/models/api-response.model';

// Models
import { BudgetAllocation } from '../models/budget-allocation.model';
import { DailyCost } from '../models/daily-cost.model';

@Injectable({
  providedIn: 'root'
})
export class SettingService {
  // ==========================================
  // Injeção de Dependências e Propriedades
  // ==========================================
  private readonly http = inject(HttpClient);
  private readonly apiUrl = `${environment.apiTfdUrl}/setting`;

  // ==========================================
  // Métodos de Diárias / Custos (Daily Costs)
  // ==========================================
  public getDailiesCost(): Observable<DailyCost[]> {
    return this.http.get<DailyCost[]>(`${this.apiUrl}/get-daily-costs`);
  }

  public updateDailyCost(dailyCostId: number, data: DailyCost): Observable<ApiResponse> {
    return this.http.patch<ApiResponse>(`${this.apiUrl}/update-daily-cost/${dailyCostId}`, data);
  }

  // ==========================================
  // Métodos de Dotação Orçamentária (Budget Allocation)
  // ==========================================
  public getBudgetAllocation(): Observable<BudgetAllocation> {
    return this.http.get<BudgetAllocation>(`${this.apiUrl}/get-budget-allocation`);
  }

  public updateBudgetAllocation(budgetAllocationId: number, data: BudgetAllocation): Observable<ApiResponse> {
    return this.http.patch<ApiResponse>(`${this.apiUrl}/update-budget-allocation/${budgetAllocationId}`, data);
  }
}