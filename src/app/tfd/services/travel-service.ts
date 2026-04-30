import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment.development';
import { PatientRequest } from '../models/patient-request';

const requestOptions = {
  'Authorization': `Bearer ${window.localStorage.getItem('token')}`
}

@Injectable({
  providedIn: 'root',
})
export class TravelService {

  constructor(
    private http: HttpClient,
  ) {}

  getPatientRequests(): Observable<PatientRequest[]> {
    return this.http.get<PatientRequest[]>(`${environment.apiTfdUrl}/travel/get-patient-requests`, {headers: requestOptions})
  }

  haltedPatientRequest(patient_request: number): Observable<Array<any>> {
    return this.http.patch<Array<any>>(`${environment.apiTfdUrl}/travel/halted-patient-request/${patient_request}`, {headers: requestOptions})
  }

  getPatientEscorts(patient_care: number): Observable<any> {
    return this.http.get<any>(`${environment.apiTfdUrl}/travel/get-patient-escorts/${patient_care}`, {headers: requestOptions})
  }

  patientRequestEscorts(patient_request: number, data: any): Observable<any> {
    return this.http.patch<any>(`${environment.apiTfdUrl}/travel/patient-request-escorts/${patient_request}`, data, {headers: requestOptions})
  }

  undoPatientRequest(patient_request: number, data: PatientRequest): Observable<Array<any>> {
    return this.http.patch<Array<any>>(`${environment.apiTfdUrl}/travel/undo-patient-request/${patient_request}`, data, {headers: requestOptions})
  }

  finishPatientRequestTravel(patient_request: number): Observable<Array<any>> {
    return this.http.patch<Array<any>>(`${environment.apiTfdUrl}/travel/finish-patient-request-travel/${patient_request}`, {headers: requestOptions})
  }

  movePatientRequestFromFinished(patient_request: number): Observable<Array<any>> {
    return this.http.patch<Array<any>>(`${environment.apiTfdUrl}/travel/move-patient-request-from-finished/${patient_request}`, {headers: requestOptions})
  }

  movePatientRequestFromOthers(patient_request: number): Observable<Array<any>> {
    return this.http.patch<Array<any>>(`${environment.apiTfdUrl}/travel/move-patient-request-from-others/${patient_request}`, {headers: requestOptions})
  }

  importTravels(data: any): Observable<any> {
    return this.http.post<any>(`${environment.apiTfdUrl}/travel/import-travels`, data, {headers: requestOptions})
  }

  getTravels(patient_request: number): Observable<any> {
    return this.http.get<any>(`${environment.apiTfdUrl}/travel/get-travels/${patient_request}`, {headers: requestOptions})
  }

  createTravel(patient_request: number, data: any): Observable<any> {
    return this.http.post<any>(`${environment.apiTfdUrl}/travel/create-travel/${patient_request}`, data, {headers: requestOptions})
  }

  updateTravel(travel: number, data: any): Observable<any> {
    return this.http.patch<any>(`${environment.apiTfdUrl}/travel/update-travel/${travel}`, data, {headers: requestOptions})
  }

  deleteTravel(travel: number): Observable<any> {
    return this.http.delete<any>(`${environment.apiTfdUrl}/travel/delete-travel/${travel}`, {headers: requestOptions})
  }

  getPassengers(travel: number): Observable<any> {
    return this.http.get<any>(`${environment.apiTfdUrl}/travel/get-passengers/${travel}`, {headers: requestOptions})
  }

  createPassenger(travel: number, data: any): Observable<any> {
    return this.http.post<any>(`${environment.apiTfdUrl}/travel/create-passenger/${travel}`, data, {headers: requestOptions})
  }

  updatePassenger(passenger: number, data: any): Observable<any> {
    return this.http.patch<any>(`${environment.apiTfdUrl}/travel/update-passenger/${passenger}`, data, {headers: requestOptions})
  }

  deletePassenger(passenger: number): Observable<any> {
    return this.http.delete<any>(`${environment.apiTfdUrl}/travel/delete-passenger/${passenger}`, {headers: requestOptions})
  }

  getRoutes(travel: number): Observable<any> {
    return this.http.get<any>(`${environment.apiTfdUrl}/travel/get-travel-routes/${travel}`, {headers: requestOptions})
  }

  createRoute(travel: number, data: any): Observable<any> {
    return this.http.post<any>(`${environment.apiTfdUrl}/travel/create-travel-route/${travel}`, data, {headers: requestOptions})
  }

  updateRoute(route: number, data: any): Observable<any> {
    return this.http.patch<any>(`${environment.apiTfdUrl}/travel/update-travel-route/${route}`, data, {headers: requestOptions})
  }

  deleteRoute(route: number): Observable<any> {
    return this.http.delete<any>(`${environment.apiTfdUrl}/travel/delete-travel-route/${route}`, {headers: requestOptions})
  }
  
}
