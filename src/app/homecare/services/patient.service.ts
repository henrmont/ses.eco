import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { AbstractControl, AsyncValidatorFn, ValidationErrors } from '@angular/forms';
import { Observable, catchError, map, of, switchMap, timer } from 'rxjs';
import * as moment from 'moment';

import { environment } from '../../../environments/environment.development';
import { ApiResponse } from '../../core/models/api-response.model';
import { PatientCare } from '../models/patient-care.model';
import { Patient } from '../models/patient.model';

export interface CidOption {
  id: number;
  code: string;
  description: string;
}

@Injectable({
  providedIn: 'root',
})
export class PatientService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = `${environment.apiHomecareUrl}/patients`;

  // ==========================================
  // 1. FLUXO DE PACIENTES
  // ==========================================

  getPatients(): Observable<Patient[]> {
    return this.http.get<Patient[]>(`${this.apiUrl}`);
  }

  getArchivePatients(): Observable<Patient[]> {
    return this.http.get<Patient[]>(`${this.apiUrl}/archived`);
  }

  createPatient(data: Patient): Observable<ApiResponse> {
    return this.http.post<ApiResponse>(`${this.apiUrl}`, this.mountFormData(data as unknown as Record<string, unknown>));
  }

  updatePatient(patientCareId: number, data: Patient): Observable<ApiResponse> {
    return this.http.post<ApiResponse>(`${this.apiUrl}/${patientCareId}`, this.mountFormData(data as unknown as Record<string, unknown>));
  }

  archivePatient(patientCareId: number): Observable<ApiResponse> {
    return this.http.patch<ApiResponse>(`${this.apiUrl}/${patientCareId}/archive`, {});
  }

  movePatientFromArchive(patientCareId: number): Observable<ApiResponse> {
    return this.http.patch<ApiResponse>(`${this.apiUrl}/${patientCareId}/move-from-archive`, {});
  }

  movePatientFromOthers(patientCareId: number): Observable<ApiResponse> {
    return this.http.patch<ApiResponse>(`${this.apiUrl}/${patientCareId}/move-from-others`, {});
  }

  validatePatient(patientCareId: number): Observable<ApiResponse> {
    return this.http.patch<ApiResponse>(`${this.apiUrl}/${patientCareId}/validate`, {});
  }

  finishBackPatient(patientCareId: number): Observable<ApiResponse> {
    return this.http.patch<ApiResponse>(`${this.apiUrl}/${patientCareId}/finish-back`, {});
  }

  // ==========================================
  // 2. CONSULTAS DIRETAS
  // ==========================================

  getPatientCns(cns: string | number): Observable<Patient & { exists_in_tfd?: boolean }> {
    return this.http.get<Patient & { exists_in_tfd?: boolean }>(`${this.apiUrl}/cns/${cns}`);
  }

  getPatientDocument(document: string | number): Observable<Patient & { exists_in_tfd?: boolean }> {
    return this.http.get<Patient & { exists_in_tfd?: boolean }>(`${this.apiUrl}/document/${document}`);
  }

  // ==========================================
  // 3. VALIDATORS ASSÍNCRONOS REATIVOS
  // ==========================================

  cnsPatientExistsValidator(
    currentCns?: string | null,
    onFound?: (patient: Patient) => void
  ): AsyncValidatorFn {
    return (control: AbstractControl): Observable<ValidationErrors | null> => {
      const cnsClean = control.value ? String(control.value).replace(/\D/g, '') : '';
      const currentClean = currentCns ? String(currentCns).replace(/\D/g, '') : '';

      if (cnsClean.length !== 15 || (currentClean && cnsClean === currentClean) || !control.dirty) {
        return of(null);
      }

      return timer(400).pipe(
        switchMap(() => this.getPatientCns(cnsClean)),
        map((patient) => {
          if (patient) {
            if (onFound) onFound(patient);
            return patient.exists_in_tfd ? { cnsExists: true } : null;
          }
          return null;
        }),
        catchError(() => of(null))
      );
    };
  }

  documentPatientExistsValidator(
    currentDocument?: string | null,
    onFound?: (patient: Patient) => void
  ): AsyncValidatorFn {
    return (control: AbstractControl): Observable<ValidationErrors | null> => {
      const docClean = control.value ? String(control.value).replace(/\D/g, '') : '';
      const currentClean = currentDocument ? String(currentDocument).replace(/\D/g, '') : '';

      if (
        (docClean.length !== 11 && docClean.length !== 14) ||
        (currentClean && docClean === currentClean) ||
        !control.dirty
      ) {
        return of(null);
      }

      return timer(400).pipe(
        switchMap(() => this.getPatientDocument(docClean)),
        map((patient) => {
          if (patient) {
            if (onFound) onFound(patient);
            return patient.exists_in_tfd ? { documentExists: true } : null;
          }
          return null;
        }),
        catchError(() => of(null))
      );
    };
  }

  // ==========================================
  // 4. MÉTODOS AUXILIARES PRIVADOS
  // ==========================================

  private mountFormData(data: Record<string, unknown>): FormData {
    const formData = new FormData();

    if (!data) return formData;

    for (const [key, value] of Object.entries(data)) {
      if (value === null || value === undefined) {
        continue;
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
    }

    return formData;
  }
}