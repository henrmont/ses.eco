import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { PatientRequest } from '../models/patient-request';
import { environment } from '../../../environments/environment.development';
import { DailyCost } from '../models/daily-cost';
import { Accountability } from '../models/accountability';
import { AccountabilityDaily } from '../models/accountability-daily';

const requestOptions = {
  'Authorization': `Bearer ${window.localStorage.getItem('token')}`
}

@Injectable({
  providedIn: 'root',
})
export class AccountabilityService {

  constructor(
    private http: HttpClient,
  ) {}

  getPatientRequests(): Observable<PatientRequest[]> {
    return this.http.get<PatientRequest[]>(`${environment.apiTfdUrl}/accountability/get-patient-requests`, {headers: requestOptions})
  }

  haltedPatientRequest(patient_request: number): Observable<Array<any>> {
    return this.http.patch<Array<any>>(`${environment.apiTfdUrl}/accountability/halted-patient-request/${patient_request}`, {headers: requestOptions})
  }

  getAccountabilities(patient_request: number): Observable<Accountability[]> {
    return this.http.get<Accountability[]>(`${environment.apiTfdUrl}/accountability/get-accountabilities/${patient_request}`, {headers: requestOptions})
  }

  getBalance(patient_care: number): Observable<number> {
    return this.http.get<number>(`${environment.apiTfdUrl}/accountability/get-balance/${patient_care}`, {headers: requestOptions})
  }

  createAccountability(patient_request: number, data: any): Observable<any> {
    return this.http.post(`${environment.apiTfdUrl}/accountability/create-accountability/${patient_request}`, data, {headers: requestOptions})
  }

  updateAccountability(accountability: number, data: any): Observable<any> {
    return this.http.patch(`${environment.apiTfdUrl}/accountability/update-accountability/${accountability}`, data, {headers: requestOptions})
  }

  deleteAccountability(accountability: number): Observable<any> {
    return this.http.delete(`${environment.apiTfdUrl}/accountability/delete-accountability/${accountability}`, {headers: requestOptions})
  }

  getAccountabilityDailies(accountability: number): Observable<AccountabilityDaily[]> {
    return this.http.get<AccountabilityDaily[]>(`${environment.apiTfdUrl}/accountability/get-accountability-dailies/${accountability}`, {headers: requestOptions})
  }

  getDailyCosts(): Observable<DailyCost[]> {
    return this.http.get<DailyCost[]>(`${environment.apiTfdUrl}/cost-assistance/get-daily-costs`, {headers: requestOptions})
  }

  createAccountabilityDaily(accountability: number, data: AccountabilityDaily): Observable<Array<any>> {
    return this.http.post<Array<any>>(`${environment.apiTfdUrl}/accountability/create-accountability-daily/${accountability}`, data, {headers: requestOptions})
  }

  updateAccountabilityDaily(accountability_daily: number, data: AccountabilityDaily): Observable<Array<any>> {
    return this.http.patch<Array<any>>(`${environment.apiTfdUrl}/accountability/update-accountability-daily/${accountability_daily}`, data, {headers: requestOptions})
  }

  deleteAccountabilityDaily(accountability_daily: number): Observable<Array<any>> {
    return this.http.delete<Array<any>>(`${environment.apiTfdUrl}/accountability/delete-accountability-daily/${accountability_daily}`, {headers: requestOptions})
  }

  finishPatientRequestAccountability(patient_request: number): Observable<Array<any>> {
    return this.http.patch<Array<any>>(`${environment.apiTfdUrl}/accountability/finish-patient-request-accountability/${patient_request}`, {headers: requestOptions})
  }
  
}
