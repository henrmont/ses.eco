import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { AbstractControl, AsyncValidatorFn, ValidationErrors } from '@angular/forms';
import { Observable, catchError, first, map, of } from 'rxjs';
import * as moment from 'moment';

import { environment } from '../../../environments/environment.development';
import { ApiResponse } from '../../core/models/api-response.model';
import { Patient } from '../models/patient.model';
import { PatientEscort } from '../models/patient-escort.model';
import { PatientReport } from '../models/patient-report.model';
import { ReportAttachment } from '../models/report-attachment.model';
import { PatientCare } from '../models/patient-care.model';

interface CidOption {
  id: number;
  code: string;
  description: string;
}

@Injectable({
  providedIn: 'root',
})
export class PatientService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = `${environment.apiTfdUrl}/patient`;
  private readonly checksUrl = `${environment.apiTfdUrl}/checks`;
  private readonly validatorUrl = `${environment.apiTfdUrl}/validator`;

  // --- FLUXO DE PACIENTES ---

  getPatients(): Observable<Patient[]> {
    return this.http.get<Patient[]>(`${this.apiUrl}/get-patients`);
  }

  getArchivePatients(): Observable<Patient[]> {
    return this.http.get<Patient[]>(`${this.apiUrl}/get-archive-patients`);
  }

  createPatient(data: Partial<Patient>): Observable<ApiResponse> {
    return this.http.post<ApiResponse>(`${this.apiUrl}/create-patient`, this.mountFormData(data));
  }

  updatePatient(patientCareId: number, data: Partial<Patient>): Observable<ApiResponse> {
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

  finishBackPatient(patientCareId: number): Observable<ApiResponse> {
    return this.http.patch<ApiResponse>(`${this.apiUrl}/finish-back-patient/${patientCareId}`, {});
  }

  // --- FLUXO DE ACOMPANHANTES (ESCORTS) ---

  getPatientEscorts(patientCareId: number): Observable<PatientEscort[]> {
    return this.http.get<PatientEscort[]>(`${this.apiUrl}/get-patient-escorts/${patientCareId}`);
  }

  createPatientEscort(patientCareId: number, data: Partial<PatientEscort>): Observable<ApiResponse> {
    return this.http.post<ApiResponse>(`${this.apiUrl}/create-patient-escort/${patientCareId}`, this.mountFormData(data));
  }

  updatePatientEscort(escortId: number, data: Partial<PatientEscort>): Observable<ApiResponse> {
    return this.http.patch<ApiResponse>(`${this.apiUrl}/update-patient-escort/${escortId}`, this.mountFormData(data));
  }

  deletePatientEscort(escortId: number): Observable<ApiResponse> {
    return this.http.delete<ApiResponse>(`${this.apiUrl}/delete-patient-escort/${escortId}`);
  }

  // --- FLUXO DE PRONTUÁRIOS / LAUDOS (REPORTS) ---

  getPatientReports(patientCareId: number): Observable<PatientReport[]> {
    return this.http.get<PatientReport[]>(`${this.apiUrl}/get-patient-reports/${patientCareId}`);
  }

  createPatientReport(patientCareId: number, data: Partial<PatientReport>): Observable<ApiResponse> {
    return this.http.post<ApiResponse>(`${this.apiUrl}/create-patient-report/${patientCareId}`, data);
  }

  updatePatientReport(reportId: number, data: Partial<PatientReport>): Observable<ApiResponse> {
    return this.http.patch<ApiResponse>(`${this.apiUrl}/update-patient-report/${reportId}`, data);
  }

  deletePatientReport(reportId: number): Observable<ApiResponse> {
    return this.http.delete<ApiResponse>(`${this.apiUrl}/delete-patient-report/${reportId}`);
  }

  getCids(patientCareId: number): Observable<CidOption[]> {
    return this.http.get<CidOption[]>(`${this.apiUrl}/get-cids/${patientCareId}`);
  }

  // --- FLUXO DE ANEXOS DE LAUDO (REPORT ATTACHMENTS) ---

  getReportAttachments(reportId: number): Observable<ReportAttachment[]> {
    return this.http.get<ReportAttachment[]>(`${this.apiUrl}/get-report-attachments/${reportId}`);
  }

  createReportAttachment(reportId: number, data: Partial<ReportAttachment>): Observable<ApiResponse> {
    return this.http.post<ApiResponse>(`${this.apiUrl}/create-report-attachment/${reportId}`, this.mountFormData(data));
  }

  updateReportAttachment(reportAttachmentId: number, data: Partial<ReportAttachment>): Observable<ApiResponse> {
    return this.http.patch<ApiResponse>(`${this.apiUrl}/update-report-attachment/${reportAttachmentId}`, this.mountFormData(data));
  }

  deleteReportAttachment(reportAttachmentId: number): Observable<ApiResponse> {
    return this.http.delete<ApiResponse>(`${this.apiUrl}/delete-report-attachment/${reportAttachmentId}`);
  }

  // --- CONSULTAS DIRETAS (CHECKS) ---

  getPatientCns(cns: string | number): Observable<Patient> {
    return this.http.get<Patient>(`${this.checksUrl}/get-patient-cns/${cns}`);
  }

  getPatientDocument(document: string | number): Observable<Patient> {
    return this.http.get<Patient>(`${this.checksUrl}/get-patient-document/${document}`);
  }

  getEscortCns(cns: string | number): Observable<PatientEscort> {
    return this.http.get<PatientEscort>(`${this.checksUrl}/get-escort-cns/${cns}`);
  }

  getEscortDocument(document: string | number): Observable<PatientEscort> {
    return this.http.get<PatientEscort>(`${this.checksUrl}/get-escort-document/${document}`);
  }

  // --- VALIDATORS ASSÍNCRONOS BLINDADOS ---

  cnsPatientExistsValidator(currentCns: string | null | undefined): AsyncValidatorFn {
    return (control: AbstractControl): Observable<ValidationErrors | null> => {
      // 1. Limpa pontuações/espaços do valor do input e do CNS atual
      const cns = control.value ? String(control.value).replace(/\D/g, '') : '';
      const current = currentCns ? String(currentCns).replace(/\D/g, '') : '';

      if (!cns || (current && cns === current)) {
        return of(null);
      }

      return this.http
        .get<boolean | { cnsExists: boolean }>(`${this.validatorUrl}/cns-patient-exists/${cns}/${current}`)
        .pipe(
          map(res => {
            // Trata se a API retornar booleano puro (true/false) OU objeto ({ cnsExists: true })
            const exists = typeof res === 'boolean' ? res : res?.cnsExists;
            return exists ? { cnsExists: true } : null;
          }),
          catchError(() => of(null)),
          first()
        );
    };
  }

  cnsEscortExistsValidator(
    patientCare: PatientCare | null | undefined, 
    currentCns: string | null | undefined
  ): AsyncValidatorFn {
    return (control: AbstractControl): Observable<ValidationErrors | null> => {
      // 1. Limpa pontuações/espaços do valor do input
      const cns = control.value ? String(control.value).replace(/\D/g, '') : '';
      const current = currentCns ? String(currentCns).replace(/\D/g, '') : '';

      if (!cns || (current && cns === current)) {
        return of(null);
      }

      // 2. Compara com o paciente limpando caracteres
      const patientCns = patientCare?.patient?.cns ? String(patientCare.patient.cns).replace(/\D/g, '') : '';
      if (patientCns && patientCns === cns) {
        return of({ cnsPatientExists: true });
      }

      if (!patientCare?.id) {
        return of(null);
      }

      return this.http
        .get<boolean | { cnsExists: boolean }>(`${this.validatorUrl}/cns-escort-exists/${patientCare.id}/${cns}/${current}`)
        .pipe(
          map(res => {
            // Trata se o PHP retornar booleano puro (true/false) OU um objeto ({ cnsExists: true })
            const exists = typeof res === 'boolean' ? res : res?.cnsExists;
            return exists ? { cnsExists: true } : null;
          }),
          catchError(() => of(null)),
          first()
        );
    };
  }

  documentPatientExistsValidator(currentDocument: string | null | undefined): AsyncValidatorFn {
    return (control: AbstractControl): Observable<ValidationErrors | null> => {
      // 1. Limpa pontuações/máscara do CPF/documento do input e do documento atual
      const document = control.value ? String(control.value).replace(/\D/g, '') : '';
      const current = currentDocument ? String(currentDocument).replace(/\D/g, '') : '';

      if (!document || (current && document === current)) {
        return of(null);
      }

      return this.http
        .get<boolean | { documentExists: boolean }>(`${this.validatorUrl}/document-patient-exists/${document}/${current}`)
        .pipe(
          map(res => {
            // Trata se a API retornar booleano puro (true/false) OU objeto ({ documentExists: true })
            const exists = typeof res === 'boolean' ? res : res?.documentExists;
            return exists ? { documentExists: true } : null;
          }),
          catchError(() => of(null)),
          first()
        );
    };
  }

  documentEscortExistsValidator(
    patientCare: PatientCare | null | undefined, 
    currentDocument: string | null | undefined
  ): AsyncValidatorFn {
    return (control: AbstractControl): Observable<ValidationErrors | null> => {
      // Limpa pontuações da máscara do CPF
      const document = control.value ? String(control.value).replace(/\D/g, '') : '';
      const current = currentDocument ? String(currentDocument).replace(/\D/g, '') : '';

      if (!document || (current && document === current)) {
        return of(null);
      }

      // Compara com o CPF do próprio paciente (também higienizado)
      const patientDocument = patientCare?.patient?.document 
        ? String(patientCare.patient.document).replace(/\D/g, '') 
        : '';
        
      if (patientDocument && patientDocument === document) {
        return of({ documentPatientExists: true });
      }

      if (!patientCare?.id) {
        return of(null);
      }

      return this.http
        .get<boolean | { documentExists: boolean }>(`${this.validatorUrl}/document-escort-exists/${patientCare.id}/${document}/${current}`)
        .pipe(
          map(res => {
            const exists = typeof res === 'boolean' ? res : res?.documentExists;
            return exists ? { documentExists: true } : null;
          }),
          catchError(() => of(null)),
          first()
        );
    };
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