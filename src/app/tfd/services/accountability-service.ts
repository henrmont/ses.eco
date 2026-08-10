import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';

import { environment } from '../../../environments/environment.development';
import { PatientRequest } from '../models/patient-request';
import { Accountability } from '../models/accountability';
import { AccountabilityDaily } from '../models/accountability-daily';
import { DailyCost } from '../models/daily-cost';

// Interface genérica para padronizar as respostas de mutação do back-end (Laravel)
export interface ApiResponse {
  message: string;
  status?: string;
  [key: string]: any;
}

@Injectable({
  providedIn: 'root',
})
export class AccountabilityService {
  // 🔒 Injeções e URLs configuradas como imutáveis
  private readonly http = inject(HttpClient);
  private readonly apiUrl = `${environment.apiTfdUrl}/accountability`;

  // --- FLUXO DE SOLICITAÇÕES DE PACIENTE (PATIENT REQUESTS) ---

  getPatientRequests(): Observable<PatientRequest[]> {
    return this.http.get<PatientRequest[]>(`${this.apiUrl}/get-patient-requests`);
  }

  getArchivePatientRequests(): Observable<PatientRequest[]> {
    return this.http.get<PatientRequest[]>(`${this.apiUrl}/get-archive-patient-requests`);
  }

  haltedPatientRequest(patientRequestId: number): Observable<ApiResponse> {
    return this.http.patch<ApiResponse>(`${this.apiUrl}/halted-patient-request/${patientRequestId}`, {});
  }

  finishPatientRequestAccountability(patientRequestId: number): Observable<ApiResponse> {
    return this.http.patch<ApiResponse>(`${this.apiUrl}/finish-patient-request-accountability/${patientRequestId}`, {});
  }

  finishBackPatientRequest(patientRequestId: number): Observable<ApiResponse> {
    return this.http.patch<ApiResponse>(`${this.apiUrl}/finish-back-patient-request/${patientRequestId}`, {});
  }

  archivePatientRequest(patientRequestId: number): Observable<ApiResponse> {
    return this.http.patch<ApiResponse>(`${this.apiUrl}/archive-patient-request/${patientRequestId}`, {});
  }

  // --- FLUXO DE PRESTAÇÃO DE CONTAS (ACCOUNTABILITIES) ---

  getAccountabilities(patientRequestId: number): Observable<Accountability[]> {
    return this.http.get<Accountability[]>(`${this.apiUrl}/get-accountabilities/${patientRequestId}`);
  }

  getBalance(patientCareId: number): Observable<number> {
    return this.http.get<number>(`${this.apiUrl}/get-balance/${patientCareId}`);
  }

  createAccountability(patientRequestId: number, data: any): Observable<ApiResponse> {
    return this.http.post<ApiResponse>(`${this.apiUrl}/create-accountability/${patientRequestId}`, data);
  }

  updateAccountability(accountabilityId: number, data: any): Observable<ApiResponse> {
    return this.http.patch<ApiResponse>(`${this.apiUrl}/update-accountability/${accountabilityId}`, data);
  }

  deleteAccountability(accountabilityId: number): Observable<ApiResponse> {
    return this.http.delete<ApiResponse>(`${this.apiUrl}/delete-accountability/${accountabilityId}`);
  }

  // --- FLUXO DE DIÁRIAS (ACCOUNTABILITY DAILIES) ---

  getAccountabilityDailies(accountabilityId: number): Observable<AccountabilityDaily[]> {
    return this.http.get<AccountabilityDaily[]>(`${this.apiUrl}/get-accountability-dailies/${accountabilityId}`);
  }

  getDailyCosts(): Observable<DailyCost[]> {
    return this.http.get<DailyCost[]>(`${environment.apiTfdUrl}/cost-assistance/get-daily-costs`);
  }

  createAccountabilityDaily(accountabilityId: number, data: AccountabilityDaily): Observable<ApiResponse> {
    return this.http.post<ApiResponse>(`${this.apiUrl}/create-accountability-daily/${accountabilityId}`, data);
  }

  updateAccountabilityDaily(accountabilityDailyId: number, data: AccountabilityDaily): Observable<ApiResponse> {
    return this.http.patch<ApiResponse>(`${this.apiUrl}/update-accountability-daily/${accountabilityDailyId}`, data);
  }

  deleteAccountabilityDaily(accountabilityDailyId: number): Observable<ApiResponse> {
    return this.http.delete<ApiResponse>(`${this.apiUrl}/delete-accountability-daily/${accountabilityDailyId}`);
  }

  movePatientRequestFromArchive(patient_request: number): Observable<ApiResponse> {
    return this.http.patch<ApiResponse>(`${this.apiUrl}/move-patient-request-from-archive/${patient_request}`, {});
  }
}