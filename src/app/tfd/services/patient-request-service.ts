import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import * as moment from 'moment';

// Environments & Models
import { environment } from '../../../environments/environment.development';
import { HospitalUnity } from '../models/hospital-unity';
import { Patient } from '../models/patient';
import { PatientRequest } from '../models/patient-request';
import { PatientRequestAttachment } from '../models/patient-request-attachment';
import { Professional } from '../models/professional';

// Interface genérica para padronizar as respostas de mutação do back-end (Laravel)
export interface ApiResponse {
  message: string;
  status?: string;
  [key: string]: any;
}

@Injectable({
  providedIn: 'root',
})
export class PatientRequestService {
  // 🔒 Injeções e URL base configurada como imutável
  private readonly http = inject(HttpClient);
  private readonly apiUrl = `${environment.apiTfdUrl}/patient-request`;

  // 🧹 Os headers manuais foram completamente removidos! O Interceptor gerencia o Token globalmente.

  // --- CONSULTAS / GETTERS ---

  getPatientRequests(): Observable<PatientRequest[]> {
    return this.http.get<PatientRequest[]>(`${this.apiUrl}/get-patient-requests`);
  }

  getPatients(): Observable<Patient[]> {
    return this.http.get<Patient[]>(`${this.apiUrl}/get-patients`);
  }

  getReports(patientCareId: number): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/get-patient-reports/${patientCareId}`);
  }

  getHospitalUnities(): Observable<HospitalUnity[]> {
    return this.http.get<HospitalUnity[]>(`${this.apiUrl}/get-hospital-unities`);
  }

  getMedicalProfessionals(): Observable<Professional[]> {
    return this.http.get<Professional[]>(`${this.apiUrl}/get-medical-professionals`);
  }

  getPatientRequestAttachments(patientRequestId: number): Observable<PatientRequestAttachment[]> {
    return this.http.get<PatientRequestAttachment[]>(`${this.apiUrl}/get-patient-request-attachments/${patientRequestId}`);
  }

  // --- OPERAÇÕES DA SOLICITAÇÃO (MUTATIONS) ---

  createPatientRequest(data: PatientRequest): Observable<ApiResponse> {
    return this.http.post<ApiResponse>(`${this.apiUrl}/create-patient-request`, data);
  }

  updatePatientRequest(patientRequestId: number, data: PatientRequest): Observable<ApiResponse> {
    return this.http.patch<ApiResponse>(`${this.apiUrl}/update-patient-request/${patientRequestId}`, data);
  }

  deletePatientRequest(patientRequestId: number): Observable<ApiResponse> {
    return this.http.delete<ApiResponse>(`${this.apiUrl}/delete-patient-request/${patientRequestId}`);
  }

  haltedPatientRequest(patientRequestId: number): Observable<ApiResponse> {
    return this.http.patch<ApiResponse>(`${this.apiUrl}/halted-patient-request/${patientRequestId}`, {});
  }

  processPatientRequestToMedical(patientRequestId: number, data: any): Observable<ApiResponse> {
    return this.http.patch<ApiResponse>(`${this.apiUrl}/process-patient-request-to-medical/${patientRequestId}`, data);
  }

  // --- TRÂMITE ENTRE CAIXAS E FLUXOS ---

  movePatientRequestFromProcesses(patientRequestId: number): Observable<ApiResponse> {
    return this.http.patch<ApiResponse>(`${this.apiUrl}/move-patient-request-from-processes/${patientRequestId}`, {});
  }

  movePatientRequestFromOthers(patientRequestId: number): Observable<ApiResponse> {
    return this.http.patch<ApiResponse>(`${this.apiUrl}/move-patient-request-from-others/${patientRequestId}`, {});
  }

  movePatientRequestFromArchive(patientRequestId: number): Observable<ApiResponse> {
    return this.http.patch<ApiResponse>(`${this.apiUrl}/move-patient-request-from-archive/${patientRequestId}`, {});
  }

  // --- ANEXOS DA SOLICITAÇÃO (ATTACHMENTS) ---

  createPatientRequestAttachment(patientRequestId: number, data: any): Observable<ApiResponse> {
    return this.http.post<ApiResponse>(`${this.apiUrl}/create-patient-request-attachment/${patientRequestId}`, this.mountFormData(data));
  }

  updatePatientRequestAttachment(patientRequestAttachmentId: number, data: any): Observable<ApiResponse> {
    return this.http.patch<ApiResponse>(`${this.apiUrl}/update-patient-request-attachment/${patientRequestAttachmentId}`, this.mountFormData(data));
  }

  deletePatientRequestAttachment(patientRequestAttachmentId: number): Observable<ApiResponse> {
    return this.http.delete<ApiResponse>(`${this.apiUrl}/delete-patient-request-attachment/${patientRequestAttachmentId}`);
  }

  // --- TRATAMENTO E COMPOSIÇÃO DE MULTIPART/FORM-DATA ---

  private mountFormData(data: any): FormData {
    const formData = new FormData();
    
    if (!data) return formData;

    for (const [key, value] of Object.entries(data)) {
      if (value instanceof File || value instanceof Blob) {
        formData.append(key, value, 'file');
      } else if (moment.isMoment(value)) {
        formData.append(key, value.format('YYYY-MM-DD'));
      } else if (value !== null && value !== undefined) {
        formData.append(key, String(value));
      }
    }
    
    return formData;
  }
}