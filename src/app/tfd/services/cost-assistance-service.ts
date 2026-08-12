import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';

import { environment } from '../../../environments/environment.development';
import { PatientRequest } from '../models/patient-request';
import { CostAssistance } from '../models/cost-assistance';
import { CostAssistanceDaily } from '../models/cost-assistance-daily';
import { DailyCost } from '../models/daily-cost.model';
import { Professional } from '../models/professional.model';

// Interface genérica para padronizar as respostas de mutação do back-end (Laravel)
export interface ApiResponse {
  message: string;
  status?: string;
  [key: string]: any;
}

@Injectable({
  providedIn: 'root',
})
export class CostAssistanceService {
  // 🔒 Injeções e URLs configuradas como imutáveis
  private readonly http = inject(HttpClient);
  private readonly apiUrl = `${environment.apiTfdUrl}/cost-assistance`;

  // --- FLUXO DE SOLICITAÇÕES DE PACIENTE (PATIENT REQUESTS) ---

  getPatientRequests(): Observable<PatientRequest[]> {
    return this.http.get<PatientRequest[]>(`${this.apiUrl}/get-patient-requests`);
  }

  haltedPatientRequest(patientRequestId: number): Observable<ApiResponse> {
    return this.http.patch<ApiResponse>(`${this.apiUrl}/halted-patient-request/${patientRequestId}`, {});
  }

  getHistoryPatientRequests(reportId: number, patientRequestId: number): Observable<PatientRequest[]> {
    return this.http.get<PatientRequest[]>(`${this.apiUrl}/get-history-patient-requests/${reportId}/${patientRequestId}`);
  }

  undoPatientRequest(patientRequestId: number, data: PatientRequest): Observable<ApiResponse> {
    return this.http.patch<ApiResponse>(`${this.apiUrl}/undo-patient-request/${patientRequestId}`, data);
  }

  processPatientRequestToPayment(patientRequestId: number, data: any): Observable<ApiResponse> {
    return this.http.patch<ApiResponse>(`${this.apiUrl}/process-patient-request-to-payment/${patientRequestId}`, data);
  }

  // --- TRAMITAÇÕES E MOVIMENTAÇÕES DE CAIXA ---

  movePatientRequestFromHistory(patientRequestId: number): Observable<ApiResponse> {
    return this.http.patch<ApiResponse>(`${this.apiUrl}/move-patient-request-from-history/${patientRequestId}`, {});
  }

  movePatientRequestFromOthers(patientRequestId: number): Observable<ApiResponse> {
    return this.http.patch<ApiResponse>(`${this.apiUrl}/move-patient-request-from-others/${patientRequestId}`, {});
  }

  movePatientRequestFromProcesses(patientRequestId: number): Observable<ApiResponse> {
    return this.http.patch<ApiResponse>(`${this.apiUrl}/move-patient-request-from-processes/${patientRequestId}`, {});
  }

  // --- FLUXO DE AJUDAS DE CUSTO (COST ASSISTANCES) ---

  getCostAssistances(patientRequestId: number): Observable<CostAssistance[]> {
    return this.http.get<CostAssistance[]>(`${this.apiUrl}/get-cost-assistances/${patientRequestId}`);
  }

  getBalance(patientCareId: number): Observable<number> {
    return this.http.get<number>(`${this.apiUrl}/get-balance/${patientCareId}`);
  }

  createCostAssistance(patientRequestId: number, data: any): Observable<ApiResponse> {
    return this.http.post<ApiResponse>(`${this.apiUrl}/create-cost-assistance/${patientRequestId}`, data);
  }

  updateCostAssistance(costAssistanceId: number, data: any): Observable<ApiResponse> {
    return this.http.patch<ApiResponse>(`${this.apiUrl}/update-cost-assistance/${costAssistanceId}`, data);
  }

  deleteCostAssistance(costAssistanceId: number): Observable<ApiResponse> {
    return this.http.delete<ApiResponse>(`${this.apiUrl}/delete-cost-assistance/${costAssistanceId}`);
  }

  // --- FLUXO DE DIÁRIAS (COST ASSISTANCE DAILIES) ---

  getCostAssistanceDailies(costAssistanceId: number): Observable<CostAssistanceDaily[]> {
    return this.http.get<CostAssistanceDaily[]>(`${this.apiUrl}/get-cost-assistance-dailies/${costAssistanceId}`);
  }

  getDailyCosts(): Observable<DailyCost[]> {
    return this.http.get<DailyCost[]>(`${this.apiUrl}/get-daily-costs`);
  }

  createCostAssistanceDaily(costAssistanceId: number, data: CostAssistanceDaily): Observable<ApiResponse> {
    return this.http.post<ApiResponse>(`${this.apiUrl}/create-cost-assistance-daily/${costAssistanceId}`, data);
  }

  updateCostAssistanceDaily(costAssistanceDailyId: number, data: CostAssistanceDaily): Observable<ApiResponse> {
    return this.http.patch<ApiResponse>(`${this.apiUrl}/update-cost-assistance-daily/${costAssistanceDailyId}`, data);
  }

  deleteCostAssistanceDaily(costAssistanceDailyId: number): Observable<ApiResponse> {
    return this.http.delete<ApiResponse>(`${this.apiUrl}/delete-cost-assistance-daily/${costAssistanceDailyId}`);
  }

  // --- RECURSOS COMPLEMENTARES ---

  getPaymentProfessionals(): Observable<Professional[]> {
    return this.http.get<Professional[]>(`${this.apiUrl}/get-payment-professionals`);
  }

  finishBackPatientRequest(patientRequestId: number): Observable<ApiResponse> {
    return this.http.patch<ApiResponse>(`${this.apiUrl}/finish-back-patient-request/${patientRequestId}`, {});
  }
}