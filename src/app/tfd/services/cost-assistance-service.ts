import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { PatientRequest } from '../models/patient-request';
import { environment } from '../../../environments/environment.development';
import { CostAssistance } from '../models/cost-assistance';
import { CostAssistanceDaily } from '../models/cost-assistance-daily';
import { DailyCost } from '../models/daily-cost';
import { Professional } from '../models/professional';

const requestOptions = {
  'Authorization': `Bearer ${window.localStorage.getItem('token')}`
}

@Injectable({
  providedIn: 'root',
})
export class CostAssistanceService {

  constructor(
    private http: HttpClient,
  ) {}

  getPatientRequests(): Observable<PatientRequest[]> {
    return this.http.get<PatientRequest[]>(`${environment.apiTfdUrl}/cost-assistance/get-patient-requests`, {headers: requestOptions})
  }

  haltedPatientRequest(patient_request: number): Observable<Array<any>> {
    return this.http.patch<Array<any>>(`${environment.apiTfdUrl}/cost-assistance/halted-patient-request/${patient_request}`, {headers: requestOptions})
  }

  getCostAssistances(patient_request: number): Observable<CostAssistance[]> {
    return this.http.get<CostAssistance[]>(`${environment.apiTfdUrl}/cost-assistance/get-cost-assistances/${patient_request}`, {headers: requestOptions})
  }

  getBalance(patient_care: number): Observable<number> {
    return this.http.get<number>(`${environment.apiTfdUrl}/cost-assistance/get-balance/${patient_care}`, {headers: requestOptions})
  }

  createCostAssistance(patient_request: number, data: any): Observable<any> {
    return this.http.post(`${environment.apiTfdUrl}/cost-assistance/create-cost-assistance/${patient_request}`, data, {headers: requestOptions})
  }

  updateCostAssistance(cost_assistance: number, data: any): Observable<any> {
    return this.http.patch(`${environment.apiTfdUrl}/cost-assistance/update-cost-assistance/${cost_assistance}`, data, {headers: requestOptions})
  }

  deleteCostAssistance(cost_assistance: number): Observable<any> {
    return this.http.delete(`${environment.apiTfdUrl}/cost-assistance/delete-cost-assistance/${cost_assistance}`, {headers: requestOptions})
  }

  getCostAssistanceDailies(cost_assistance: number): Observable<CostAssistanceDaily[]> {
    return this.http.get<CostAssistanceDaily[]>(`${environment.apiTfdUrl}/cost-assistance/get-cost-assistance-dailies/${cost_assistance}`, {headers: requestOptions})
  }

  getDailyCosts(): Observable<DailyCost[]> {
    return this.http.get<DailyCost[]>(`${environment.apiTfdUrl}/cost-assistance/get-daily-costs`, {headers: requestOptions})
  }

  createCostAssistanceDaily(cost_assistance: number, data: CostAssistanceDaily): Observable<Array<any>> {
    return this.http.post<Array<any>>(`${environment.apiTfdUrl}/cost-assistance/create-cost-assistance-daily/${cost_assistance}`, data, {headers: requestOptions})
  }

  updateCostAssistanceDaily(cost_assistance_daily: number, data: CostAssistanceDaily): Observable<Array<any>> {
    return this.http.patch<Array<any>>(`${environment.apiTfdUrl}/cost-assistance/update-cost-assistance-daily/${cost_assistance_daily}`, data, {headers: requestOptions})
  }

  deleteCostAssistanceDaily(cost_assistance_daily: number): Observable<Array<any>> {
    return this.http.delete<Array<any>>(`${environment.apiTfdUrl}/cost-assistance/delete-cost-assistance-daily/${cost_assistance_daily}`, {headers: requestOptions})
  }

  getHistoryPatientRequests(report: number, patient_request: number): Observable<PatientRequest[]> {
    return this.http.get<PatientRequest[]>(`${environment.apiTfdUrl}/cost-assistance/get-history-patient-requests/${report}/${patient_request}`, {headers: requestOptions})
  }

  movePatientRequestFromHistory(patient_request: number): Observable<Array<any>> {
    return this.http.patch<Array<any>>(`${environment.apiTfdUrl}/cost-assistance/move-patient-request-from-history/${patient_request}`, {headers: requestOptions})
  }

  movePatientRequestFromOthers(patient_request: number): Observable<Array<any>> {
    return this.http.patch<Array<any>>(`${environment.apiTfdUrl}/cost-assistance/move-patient-request-from-others/${patient_request}`, {headers: requestOptions})
  }

  movePatientRequestFromProcesses(patient_request: number): Observable<Array<any>> {
    return this.http.patch<Array<any>>(`${environment.apiTfdUrl}/cost-assistance/move-patient-request-from-processes/${patient_request}`, {headers: requestOptions})
  }

  undoPatientRequest(patient_request: number, data: PatientRequest): Observable<Array<any>> {
    return this.http.patch<Array<any>>(`${environment.apiTfdUrl}/cost-assistance/undo-patient-request/${patient_request}`, data, {headers: requestOptions})
  }

  getPaymentProfessionals(): Observable<Professional[]> {
    return this.http.get<Professional[]>(`${environment.apiTfdUrl}/cost-assistance/get-payment-professionals`, {headers: requestOptions})
  }

  processPatientRequestToPayment(patient_request: number, data: any): Observable<Array<any>> {
    return this.http.patch<Array<any>>(`${environment.apiTfdUrl}/cost-assistance/process-patient-request-to-payment/${patient_request}`, data, {headers: requestOptions})
  }

}