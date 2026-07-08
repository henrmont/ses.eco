import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { catchError, map, Observable, of } from 'rxjs';
import { environment } from '../../../environments/environment.development';
import { Patient } from '../models/patient';
import { AbstractControl, AsyncValidatorFn, ValidationErrors } from '@angular/forms';
import { PatientCare } from '../models/patient-care';
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
  private readonly apiUrl = `${environment.apiTransplanteUrl}/patient`;
  private readonly checksUrl = `${environment.apiTransplanteUrl}/checks`;
  private readonly validatorUrl = `${environment.apiTransplanteUrl}/validator`;

  // 🧹 Os headers manuais foram removidos! O Interceptor gerencia o Token globalmente.

  // --- FLUXO DE PACIENTES ---

  getPatients(): Observable<Patient[]> {
    return this.http.get<Patient[]>(`${this.apiUrl}/get-patients`);
  }

  createPatient(data: any): Observable<ApiResponse> {
    return this.http.post<ApiResponse>(`${this.apiUrl}/create-patient`, this.mountFormData(data));
  }

  updatePatient(patientId: number, data: any): Observable<ApiResponse> {
    return this.http.post<ApiResponse>(`${this.apiUrl}/update-patient/${patientId}`, this.mountFormData(data));
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