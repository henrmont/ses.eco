import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { AbstractControl, AsyncValidatorFn, ValidationErrors } from '@angular/forms';
import { Observable, catchError, map, of } from 'rxjs';
import * as moment from 'moment';

import { environment } from '../../../environments/environment.development';
import { PatientRequest } from '../models/patient-request';

// Interface de apoio para o validador assíncrono de passageiros
export interface UnifiedPassengerOption {
  id: number;
  name: string;
  isPatient: boolean;
  typeLabel: string;
}

// Interface genérica para padronizar as respostas de mutação do back-end (Laravel)
export interface ApiResponse {
  message: string;
  status?: string;
  [key: string]: any;
}

@Injectable({
  providedIn: 'root',
})
export class TravelService {
  // 🔒 Injeções e URLs configuradas como imutáveis
  private readonly http = inject(HttpClient);
  private readonly apiUrl = `${environment.apiTfdUrl}/travel`;
  private readonly validatorUrl = `${environment.apiTfdUrl}/validator`;

  // --- FLUXO DE SOLICITAÇÕES DE VIAGEM (PATIENT REQUESTS) ---

  getPatientRequests(): Observable<PatientRequest[]> {
    return this.http.get<PatientRequest[]>(`${this.apiUrl}/get-patient-requests`);
  }

  getArchivePatientRequests(): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/get-archive-patient-requests`);
  }

  getPatientEscorts(patientCareId: number): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/get-patient-escorts/${patientCareId}`);
  }

  patientRequestEscorts(patientRequestId: number, data: any): Observable<ApiResponse> {
    return this.http.patch<ApiResponse>(`${this.apiUrl}/patient-request-escorts/${patientRequestId}`, data);
  }

  haltedPatientRequest(patientRequestId: number): Observable<ApiResponse> {
    return this.http.patch<ApiResponse>(`${this.apiUrl}/halted-patient-request/${patientRequestId}`, {});
  }

  undoPatientRequest(patientRequestId: number, data: PatientRequest): Observable<ApiResponse> {
    return this.http.patch<ApiResponse>(`${this.apiUrl}/undo-patient-request/${patientRequestId}`, data);
  }

  finishPatientRequestTravel(patientRequestId: number): Observable<ApiResponse> {
    return this.http.patch<ApiResponse>(`${this.apiUrl}/finish-patient-request-travel/${patientRequestId}`, {});
  }

  movePatientRequestFromArchive(patient_request: number): Observable<ApiResponse> {
    return this.http.patch<ApiResponse>(`${this.apiUrl}/move-patient-request-from-archive/${patient_request}`, {});
  }

  movePatientRequestFromFinished(patientRequestId: number): Observable<ApiResponse> {
    return this.http.patch<ApiResponse>(`${this.apiUrl}/move-patient-request-from-finished/${patientRequestId}`, {});
  }

  movePatientRequestFromOthers(patientRequestId: number): Observable<ApiResponse> {
    return this.http.patch<ApiResponse>(`${this.apiUrl}/move-patient-request-from-others/${patientRequestId}`, {});
  }

  importTravels(data: any): Observable<ApiResponse> {
    return this.http.post<ApiResponse>(`${this.apiUrl}/import-travels`, data);
  }

  // --- FLUXO DE VIAGENS (TRAVELS) ---

  getTravels(patientRequestId: number): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/get-travels/${patientRequestId}`);
  }

  createTravel(patientRequestId: number, data: any): Observable<ApiResponse> {
    return this.http.post<ApiResponse>(`${this.apiUrl}/create-travel/${patientRequestId}`, data);
  }

  updateTravel(travelId: number, data: any): Observable<ApiResponse> {
    return this.http.patch<ApiResponse>(`${this.apiUrl}/update-travel/${travelId}`, data);
  }

  deleteTravel(travelId: number): Observable<ApiResponse> {
    return this.http.delete<ApiResponse>(`${this.apiUrl}/delete-travel/${travelId}`);
  }

  // --- FLUXO DE PASSAGEIROS (PASSENGERS) ---

  getPassengers(travelId: number): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/get-passengers/${travelId}`);
  }

  createPassenger(travelId: number, data: any): Observable<ApiResponse> {
    return this.http.post<ApiResponse>(`${this.apiUrl}/create-passenger/${travelId}`, data);
  }

  updatePassenger(passengerId: number, data: any): Observable<ApiResponse> {
    return this.http.patch<ApiResponse>(`${this.apiUrl}/update-passenger/${passengerId}`, data);
  }

  deletePassenger(passengerId: number): Observable<ApiResponse> {
    return this.http.delete<ApiResponse>(`${this.apiUrl}/delete-passenger/${passengerId}`);
  }

  // --- FLUXO DE ROTAS (ROUTES) ---

  getRoutes(travelId: number): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/get-travel-routes/${travelId}`);
  }

  createRoute(travelId: number, data: any): Observable<ApiResponse> {
    return this.http.post<ApiResponse>(`${this.apiUrl}/create-travel-route/${travelId}`, this.mountFormData(data));
  }

  updateRoute(routeId: number, data: any): Observable<ApiResponse> {
    return this.http.patch<ApiResponse>(`${this.apiUrl}/update-travel-route/${routeId}`, this.mountFormData(data));
  }

  deleteRoute(routeId: number): Observable<ApiResponse> {
    return this.http.delete<ApiResponse>(`${this.apiUrl}/delete-travel-route/${routeId}`);
  }

  archivePatientRequest(patient_request: number): Observable<ApiResponse> {
    return this.http.patch<ApiResponse>(`${this.apiUrl}/archive-patient-request/${patient_request}`, {});
  }

  finishBackPatientRequest(patientRequestId: number): Observable<ApiResponse> {
    return this.http.patch<ApiResponse>(`${this.apiUrl}/finish-back-patient-request/${patientRequestId}`, {});
  }

  // --- VALIDATORS ASSÍNCRONOS BLINDADOS ---

  /**
   * Validador assíncrono para verificar se o passageiro selecionado já está cadastrado na viagem.
   * @param travelId ID da viagem atual.
   */
  passengerExistsValidator(travelId: number | null | undefined): AsyncValidatorFn {
    return (control: AbstractControl): Observable<ValidationErrors | null> => {
      const selectedOption = control.value as UnifiedPassengerOption | null;

      if (!selectedOption || !travelId) {
        return of(null);
      }

      const params = new HttpParams()
        .set('passenger_id', selectedOption.id.toString())
        .set('is_patient', selectedOption.isPatient.toString());

      return this.http
        .get<{ passengerExists: boolean }>(`${this.validatorUrl}/passenger-exists/${travelId}`, { params })
        .pipe(
          map(res => {
            const exists = res && (res.passengerExists === true || (res as any) === true);
            return exists ? { passengerExists: true } : null;
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