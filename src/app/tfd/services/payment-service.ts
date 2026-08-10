import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';

import { environment } from '../../../environments/environment.development';
import { PatientRequest } from '../models/patient-request';

// Interface genérica para padronizar as respostas de mutação do back-end (Laravel)
export interface ApiResponse {
  message: string;
  status?: string;
  [key: string]: any;
}

@Injectable({
  providedIn: 'root',
})
export class PaymentService {
  // Injeções e URLs configuradas como imutáveis
  private readonly http = inject(HttpClient);
  private readonly apiUrl = `${environment.apiTfdUrl}/payment`;

  // --- FLUXO DE PAGAMENTOS (PAYMENTS) ---

  getPayments(): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/get-payments`);
  }

  getArchivePatientRequests(): Observable<PatientRequest[]> {
    return this.http.get<PatientRequest[]>(`${this.apiUrl}/get-archive-patient-requests`);
  }

  haltedPatientRequest(patientRequestId: number): Observable<ApiResponse> {
    return this.http.patch<ApiResponse>(`${this.apiUrl}/halted-patient-request/${patientRequestId}`, {});
  }

  updatePayment(paymentId: number, data: any): Observable<ApiResponse> {
    return this.http.patch<ApiResponse>(`${this.apiUrl}/update-payment/${paymentId}`, data);
  }

  finishPatientRequestPayment(patientRequestId: number): Observable<ApiResponse> {
    return this.http.patch<ApiResponse>(`${this.apiUrl}/finish-patient-request-payment/${patientRequestId}`, {});
  }

  undoPatientRequest(patientRequestId: number, data: PatientRequest): Observable<ApiResponse> {
    return this.http.patch<ApiResponse>(`${this.apiUrl}/undo-patient-request/${patientRequestId}`, data);
  }

  archivePatientRequest(patientRequestId: number): Observable<ApiResponse> {
    return this.http.patch<ApiResponse>(`${this.apiUrl}/archive-patient-request/${patientRequestId}`, {});
  }

  movePatientRequestFromArchive(patient_request: number): Observable<ApiResponse> {
    return this.http.patch<ApiResponse>(`${this.apiUrl}/move-patient-request-from-archive/${patient_request}`, {});
  }

  /**
   * Faz o download do arquivo PDF mesclado.
   * É obrigatório declarar { responseType: 'blob' } para tratar o binário retornado.
   */
  downloadMergedPdf(paymentId: number): Observable<Blob> {
    return this.http.get(`${this.apiUrl}/download-merged-pdf/${paymentId}`, {
      responseType: 'blob'
    });
  }

  /**
   * Faz o download do arquivo PDF mesclado.
   * É obrigatório declarar { responseType: 'blob' } para tratar o binário retornado.
   */
  downloadMemoPdf(paymentId: number): Observable<Blob> {
    return this.http.get(`${this.apiUrl}/download-memo-pdf/${paymentId}`, {
      responseType: 'blob'
    });
  }

}