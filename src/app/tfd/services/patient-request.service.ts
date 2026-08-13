import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import * as moment from 'moment';

// Environments & Models
import { environment } from '../../../environments/environment.development';
import { HospitalUnity } from '../models/hospital-unity.model';
import { Patient } from '../models/patient.model';
import { PatientRequest } from '../models/patient-request.model';
import { PatientRequestAttachment } from '../models/patient-request-attachment.model';
import { Professional } from '../models/professional.model';
import { PatientReport } from '../models/patient-report.model';
import { ApiResponse } from '../../core/models/api-response.model';

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

  getReports(patientCareId: number): Observable<PatientReport[]> {
    return this.http.get<PatientReport[]>(`${this.apiUrl}/get-patient-reports/${patientCareId}`);
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

  finishBackPatientRequest(patientRequestId: number): Observable<ApiResponse> {
    return this.http.patch<ApiResponse>(`${this.apiUrl}/finish-back-patient-request/${patientRequestId}`, {});
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

  private mountFormData(data: Record<string, unknown>): FormData {
    const formData = new FormData();

    if (!data) return formData;

    Object.entries(data).forEach(([key, value]) => {
      if (value === null || value === undefined) {
        return;
      }

      if (value instanceof File || value instanceof Blob) {
        formData.append(key, value);
      } else if (moment.isMoment(value)) {
        formData.append(key, value.format('YYYY-MM-DD'));
      } else if (typeof value === 'boolean') {
        formData.append(key, value ? '1' : '0');
      } else {
        formData.append(key, String(value));
      }
    });

    return formData;
  }
}