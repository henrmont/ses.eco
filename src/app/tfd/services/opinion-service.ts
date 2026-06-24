import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';

// Environments & Models
import { environment } from '../../../environments/environment.development';
import { PatientRequest } from '../models/patient-request';
import { Professional } from '../models/professional';
import { Opinion } from '../models/opinion';

// Interface genérica para padronizar as respostas de mutação do back-end (Laravel)
export interface ApiResponse {
  message: string;
  status?: string;
  [key: string]: any;
}

@Injectable({
  providedIn: 'root',
})
export class OpinionService {
  // 🔒 Injeções e URL base configurada como imutável
  private readonly http = inject(HttpClient);
  private readonly apiUrl = `${environment.apiTfdUrl}/opinion`;

  // 🧹 Headers manuais removidos. O Interceptor gerencia o Token de forma global.

  // --- CONSULTAS / GETTERS ---

  getPatientRequests(): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/get-patient-requests`);
  }

  getType(): Observable<string> {
    return this.http.get<string>(`${this.apiUrl}/get-type`);
  }

  getSocialProfessionals(): Observable<Professional[]> {
    return this.http.get<Professional[]>(`${this.apiUrl}/get-social-professionals`);
  }

  getOpinions(patient_request: number): Observable<Opinion[]> {
    return this.http.get<Opinion[]>(`${this.apiUrl}/get-opinions/${patient_request}`);
  }

  getHistoryPatientRequests(report: number, patient_request: number): Observable<PatientRequest[]> {
    return this.http.get<PatientRequest[]>(`${this.apiUrl}/get-history-patient-requests/${report}/${patient_request}`);
  }

  getCostAssistanceProfessionals(): Observable<Professional[]> {
    return this.http.get<Professional[]>(`${this.apiUrl}/get-cost-assistance-professionals`);
  }

  getTravelProfessionals(): Observable<Professional[]> {
    return this.http.get<Professional[]>(`${this.apiUrl}/get-travel-professionals`);
  }

  downloadOpinion(opinion: number): Observable<Blob> {
    return this.http.get(`${this.apiUrl}/download/${opinion}`, { responseType: 'blob' });
  }

  // --- OPERAÇÕES DO PARECER (MUTATIONS) ---

  createOpinion(patient_request: number, data: Opinion): Observable<ApiResponse> {
    return this.http.post<ApiResponse>(`${this.apiUrl}/create-opinion/${patient_request}`, data);
  }

  updateOpinion(opinion: number, data: Opinion): Observable<ApiResponse> {
    return this.http.patch<ApiResponse>(`${this.apiUrl}/update-opinion/${opinion}`, data);
  }

  deleteOpinion(opinion: number): Observable<ApiResponse> {
    return this.http.delete<ApiResponse>(`${this.apiUrl}/delete-opinion/${opinion}`);
  }

  // --- MOVIMENTAÇÕES E FLUXOS ---

  processPatientRequestToSocial(patient_request: number, data: PatientRequest): Observable<ApiResponse> {
    return this.http.patch<ApiResponse>(`${this.apiUrl}/process-patient-request-to-social/${patient_request}`, data);
  }

  processPatientRequestToCostAssistanceAndTravel(patient_request: number, data: any): Observable<ApiResponse> {
    return this.http.patch<ApiResponse>(`${this.apiUrl}/process-patient-request-to-cost-assistance-and-travel/${patient_request}`, data);
  }

  undoPatientRequest(patient_request: number, data: PatientRequest): Observable<ApiResponse> {
    return this.http.patch<ApiResponse>(`${this.apiUrl}/undo-patient-request/${patient_request}`, data);
  }

  haltedPatientRequest(type: string, patient_request: number): Observable<ApiResponse> {
    return this.http.patch<ApiResponse>(`${this.apiUrl}/halted-patient-request/${type}/${patient_request}`, {});
  }

  movePatientRequestFromOthers(type: string, patient_request: number): Observable<ApiResponse> {
    return this.http.patch<ApiResponse>(`${this.apiUrl}/move-patient-request-from-others/${type}/${patient_request}`, {});
  }

  movePatientRequestFromProcesses(type: string, patient_request: number): Observable<ApiResponse> {
    return this.http.patch<ApiResponse>(`${this.apiUrl}/move-patient-request-from-processes/${type}/${patient_request}`, {});
  }

  archivePatientRequest(patient_request: number): Observable<ApiResponse> {
    return this.http.patch<ApiResponse>(`${this.apiUrl}/archive-patient-request/${patient_request}`, {});
  }

  restorePatientRequest(patient_request: number): Observable<ApiResponse> {
    return this.http.patch<ApiResponse>(`${this.apiUrl}/restore/patient-request/${patient_request}`, {});
  }
}