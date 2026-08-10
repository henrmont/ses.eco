import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';

import { environment } from '../../../environments/environment.development';
import { DailyCost } from '../models/daily-cost.model';
import { BudgetAllocation } from '../models/budget-allocation.model';
import { ApiResponse } from '../../core/models/api-response.model';

@Injectable({
  providedIn: 'root',
})
export class SettingService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = `${environment.apiTfdUrl}/setting`;

  getDailiesCost(): Observable<DailyCost[]> {
    return this.http.get<DailyCost[]>(`${this.apiUrl}/get-daily-costs`);
  }

  updateDailyCost(dailyCostId: number, data: Partial<DailyCost>): Observable<ApiResponse> {
    return this.http.patch<ApiResponse>(`${this.apiUrl}/update-daily-cost/${dailyCostId}`, data);
  }

  getBudgetAllocation(): Observable<BudgetAllocation> {
    return this.http.get<BudgetAllocation>(`${this.apiUrl}/get-budget-allocation`);
  }

  updateBudgetAllocation(budgetAllocationId: number, data: Partial<BudgetAllocation>): Observable<ApiResponse> {
    return this.http.patch<ApiResponse>(`${this.apiUrl}/update-budget-allocation/${budgetAllocationId}`, data);
  }
}