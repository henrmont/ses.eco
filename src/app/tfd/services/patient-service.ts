import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { catchError, map, Observable, of } from 'rxjs';
import { environment } from '../../../environments/environment.development';
import { Patient } from '../models/patient';
import { AbstractControl, AsyncValidatorFn, ValidationErrors } from '@angular/forms';
import { PatientCare } from '../models/patient-care';
import { Escort } from '../models/escort';
import { ReportAttachment } from '../models/report-attachment';
import * as moment from 'moment';

// Interface genérica para padronizar as respostas de mutação do back-end (Laravel)
export interface ApiResponse {
  message: string;
  status?: string;
  [key: string]: any;
}

@Injectable({
  providedIn: 'root',
})
export class PatientService {
  // 🔒 Injeções e URLs configuradas como imutáveis
  private readonly http = inject(HttpClient);
  private readonly apiUrl = `${environment.apiTfdUrl}/patient`;
  private readonly checksUrl = `${environment.apiTfdUrl}/checks`;
  private readonly validatorUrl = `${environment.apiTfdUrl}/validator`;

  // 🧹 Os headers manuais foram removidos! O Interceptor gerencia o Token globalmente.

  // --- FLUXO DE PACIENTES ---

  getPatients(): Observable<Patient[]> {
    return this.http.get<Patient[]>(`${this.apiUrl}/get-patients`);
  }

  createPatient(data: any): Observable<ApiResponse> {
    return this.http.post<ApiResponse>(`${this.apiUrl}/create-patient`, this.mountFormData(data));
  }

  updatePatient(patientCareId: number, data: any): Observable<ApiResponse> {
    return this.http.post<ApiResponse>(`${this.apiUrl}/update-patient/${patientCareId}`, this.mountFormData(data));
  }

  archivePatient(patientCareId: number): Observable<ApiResponse> {
    return this.http.patch<ApiResponse>(`${this.apiUrl}/archive-patient/${patientCareId}`, {});
  }

  movePatientFromArchive(patientCareId: number): Observable<ApiResponse> {
    return this.http.patch<ApiResponse>(`${this.apiUrl}/move-patient-from-archive/${patientCareId}`, {});
  }

  movePatientFromOthers(patientCareId: number): Observable<ApiResponse> {
    return this.http.patch<ApiResponse>(`${this.apiUrl}/move-patient-from-others/${patientCareId}`, {});
  }

  validatePatient(patientCareId: number): Observable<ApiResponse> {
    return this.http.patch<ApiResponse>(`${this.apiUrl}/validate-patient/${patientCareId}`, {});
  }

  // --- FLUXO DE ACOMPANHANTES (ESCORTS) ---

  getPatientEscorts(patientCareId: number): Observable<Escort[]> {
    return this.http.get<Escort[]>(`${this.apiUrl}/get-patient-escorts/${patientCareId}`);
  }

  createPatientEscort(patientCareId: number, data: any): Observable<ApiResponse> {
    return this.http.post<ApiResponse>(`${this.apiUrl}/create-patient-escort/${patientCareId}`, this.mountFormData(data));
  }

  updatePatientEscort(escortId: number, data: any): Observable<ApiResponse> {
    return this.http.patch<ApiResponse>(`${this.apiUrl}/update-patient-escort/${escortId}`, this.mountFormData(data));
  }

  deletePatientEscort(escortId: number): Observable<ApiResponse> {
    return this.http.delete<ApiResponse>(`${this.apiUrl}/delete-patient-escort/${escortId}`);
  }

  // --- FLUXO DE PRONTUÁRIOS / LAUDOS (REPORTS) ---

  getPatientReports(patientCareId: number): Observable<any[]> { // Alterado para any[] temporariamente caso o model Report mude
    return this.http.get<any[]>(`${this.apiUrl}/get-patient-reports/${patientCareId}`);
  }

  createPatientReport(patientCareId: number, data: any): Observable<ApiResponse> {
    return this.http.post<ApiResponse>(`${this.apiUrl}/create-patient-report/${patientCareId}`, data);
  }

  updatePatientReport(reportId: number, data: any): Observable<ApiResponse> {
    return this.http.patch<ApiResponse>(`${this.apiUrl}/update-patient-report/${reportId}`, data);
  }

  deletePatientReport(reportId: number): Observable<ApiResponse> {
    return this.http.delete<ApiResponse>(`${this.apiUrl}/delete-patient-report/${reportId}`);
  }

  getCids(patientCareId: number): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/get-cids/${patientCareId}`);
  }

  // --- FLUXO DE ANEXOS DE LAUDO (REPORT ATTACHMENTS) ---

  getReportAttachments(reportId: number): Observable<ReportAttachment[]> {
    return this.http.get<ReportAttachment[]>(`${this.apiUrl}/get-report-attachments/${reportId}`);
  }

  createReportAttachment(reportId: number, data: any): Observable<ApiResponse> {
    return this.http.post<ApiResponse>(`${this.apiUrl}/create-report-attachment/${reportId}`, this.mountFormData(data));
  }

  updateReportAttachment(reportAttachmentId: number, data: any): Observable<ApiResponse> {
    return this.http.patch<ApiResponse>(`${this.apiUrl}/update-report-attachment/${reportAttachmentId}`, this.mountFormData(data));
  }

  deleteReportAttachment(reportAttachmentId: number): Observable<ApiResponse> {
    return this.http.delete<ApiResponse>(`${this.apiUrl}/delete-report-attachment/${reportAttachmentId}`);
  }

  // --- CONSULTAS DIRETAS (CHECKS) ---

  getPatientCns(cns: number): Observable<Patient> {
    return this.http.get<Patient>(`${this.checksUrl}/get-patient-cns/${cns}`);
  }

  getPatientDocument(document: number): Observable<Patient> {
    return this.http.get<Patient>(`${this.checksUrl}/get-patient-document/${document}`);
  }

  getEscortCns(cns: number): Observable<Escort> {
    return this.http.get<Escort>(`${this.checksUrl}/get-escort-cns/${cns}`);
  }

  getEscortDocument(document: number): Observable<Escort> {
    return this.http.get<Escort>(`${this.checksUrl}/get-escort-document/${document}`);
  }


  
  // --- VALIDATORS ASSÍNCRONOS BLINDADOS ---

  cnsPatientExistsValidator(currentCns: string | null | undefined): AsyncValidatorFn {
    return (control: AbstractControl): Observable<ValidationErrors | null> => {
      const cns = control.value;
      
      // Se o campo estiver vazio, o formulário está válido por aqui
      if (!cns) return of(null);

      // Se o CNS digitado for exatamente igual ao atual (caso de edição), não precisa consultar o banco
      if (currentCns && cns === currentCns) return of(null);

      // Tratamento para não passar a string "null" ou "undefined" na rota
      const cnsToCompare = currentCns ? currentCns : '';

      return this.http.get<{ cnsExists: boolean }>(`${this.validatorUrl}/cns-patient-exists/${cns}/${cnsToCompare}`)
        .pipe(
          map(res => {
            // Garante a verificação forçando o booleano, independente de como o backend responda
            const exists = res && (res.cnsExists === true || (res as any) === true);
            
            // Retorna o objeto de erro esperado pelo Angular, ou null para válido
            return exists ? { cnsExists: true } : null;
          }),
          catchError(() => {
            // Se a API falhar, assume que não existe para não travar o fluxo do usuário
            return of(null);
          })
        );
    };
  }

  cnsEscortExistsValidator(patientCare: PatientCare, currentCns: string | null | undefined): AsyncValidatorFn {
    return (control: AbstractControl): Observable<ValidationErrors | null> => {
      const cns = control.value;
      if (!cns) return of(null);

      // Se o CNS digitado for exatamente igual ao atual (caso de edição do acompanhante), não consulta o banco
      if (currentCns && cns === currentCns) return of(null);

      // Validação local imediata se o CNS digitado pertencer ao próprio paciente titular
      if (patientCare.patient?.cns === cns) return of({ cnsPatientExists: true });

      // Garante que não passará string textuale "null" ou "undefined" na URL
      const cnsToCompare = currentCns ? currentCns : '';

      return this.http.get<{ cnsExists: boolean }>(`${this.validatorUrl}/cns-escort-exists/${patientCare.id}/${cns}/${cnsToCompare}`)
        .pipe(
          map(res => {
            const exists = res && (res.cnsExists === true || (res as any) === true);
            return exists ? { cnsExists: true } : null;
          }),
          catchError(() => of(null))
        );
    };
  }

  documentPatientExistsValidator(currentDocument: string | null | undefined): AsyncValidatorFn {
    return (control: AbstractControl): Observable<ValidationErrors | null> => {
      const document = control.value;
      if (!document) return of(null);

      // Se o Documento digitado for idêntico ao atual do paciente, validação passa direto
      if (currentDocument && document === currentDocument) return of(null);

      // Garante que não passará string textuale "null" ou "undefined" na URL
      const documentToCompare = currentDocument ? currentDocument : '';

      return this.http.get<{ documentExists: boolean }>(`${this.validatorUrl}/document-patient-exists/${document}/${documentToCompare}`)
        .pipe(
          map(res => {
            const exists = res && (res.documentExists === true || (res as any) === true);
            return exists ? { documentExists: true } : null;
          }),
          catchError(() => of(null))
        );
    };
  }

  documentEscortExistsValidator(patientCare: PatientCare, currentDocument: string | null | undefined): AsyncValidatorFn {
    return (control: AbstractControl): Observable<ValidationErrors | null> => {
      const document = control.value;
      if (!document) return of(null);

      // Se o Documento digitado for idêntico ao atual do acompanhante, validação passa direto
      if (currentDocument && document === currentDocument) return of(null);

      // Validação local imediata se o CPF/Documento digitado pertencer ao próprio titular
      if (patientCare.patient?.document === document) return of({ documentPatientExists: true });

      // Garante que não passará string textuale "null" ou "undefined" na URL
      const documentToCompare = currentDocument ? currentDocument : '';

      return this.http.get<{ documentExists: boolean }>(`${this.validatorUrl}/document-escort-exists/${patientCare.id}/${document}/${documentToCompare}`)
        .pipe(
          map(res => {
            const exists = res && (res.documentExists === true || (res as any) === true);
            return exists ? { documentExists: true } : null;
          }),
          catchError(() => of(null))
        );
    };
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