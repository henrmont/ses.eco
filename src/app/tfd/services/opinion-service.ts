import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment.development';
import { PatientRequest } from '../models/patient-request';
import { Professional } from '../models/professional';
import { Opinion } from '../models/opinion';

const requestOptions = {
  'Authorization': `Bearer ${window.localStorage.getItem('token')}`
}

@Injectable({
  providedIn: 'root',
})
export class OpinionService {

  constructor(
    private http: HttpClient
  ) {}

  getPatientRequests(): Observable<any> {
    return this.http.get<any>(`${environment.apiTfdUrl}/opinion/get-patient-requests`, {headers: requestOptions})
  }

  getType(): Observable<string> {
    return this.http.get<string>(`${environment.apiTfdUrl}/opinion/get-type`, {headers: requestOptions})
  }

  processPatientRequestToSocial(patient_request: number, data: PatientRequest): Observable<Array<any>> {
    return this.http.patch<Array<any>>(`${environment.apiTfdUrl}/opinion/process-patient-request-to-social/${patient_request}`, data, {headers: requestOptions})
  }

  getSocialProfessionals(): Observable<Professional[]> {
    return this.http.get<Professional[]>(`${environment.apiTfdUrl}/opinion/get-social-professionals`, {headers: requestOptions})
  }

  getOpinions(patient_request: number): Observable<Opinion[]> {
    return this.http.get<Opinion[]>(`${environment.apiTfdUrl}/opinion/get-opinions/${patient_request}`, {headers: requestOptions})
  }

  createOpinion(patient_request: number, data: Opinion): Observable<Array<any>> {
    return this.http.post<Array<any>>(`${environment.apiTfdUrl}/opinion/create-opinion/${patient_request}`, data, {headers: requestOptions})
  }

  updateOpinion(opinion: number, data: Opinion): Observable<Array<any>> {
    return this.http.patch<Array<any>>(`${environment.apiTfdUrl}/opinion/update-opinion/${opinion}`, data, {headers: requestOptions})
  }

  deleteOpinion(opinion: number): Observable<Array<any>> {
    return this.http.delete<Array<any>>(`${environment.apiTfdUrl}/opinion/delete-opinion/${opinion}`, {headers: requestOptions})
  }

  undoPatientRequest(patient_request: number, data: PatientRequest): Observable<Array<any>> {
    return this.http.patch<Array<any>>(`${environment.apiTfdUrl}/opinion/undo-patient-request/${patient_request}`, data, {headers: requestOptions})
  }

  haltedPatientRequest(type: string, patient_request: number): Observable<Array<any>> {
    return this.http.patch<Array<any>>(`${environment.apiTfdUrl}/opinion/halted-patient-request/${type}/${patient_request}`, {headers: requestOptions})
  }

  movePatientRequestFromOthers(type: string, patient_request: number): Observable<Array<any>> {
    return this.http.patch<Array<any>>(`${environment.apiTfdUrl}/opinion/move-patient-request-from-others/${type}/${patient_request}`, {headers: requestOptions})
  }

  movePatientRequestFromProcesses(type: string, patient_request: number): Observable<Array<any>> {
    return this.http.patch<Array<any>>(`${environment.apiTfdUrl}/opinion/move-patient-request-from-processes/${type}/${patient_request}`, {headers: requestOptions})
  }

  getHistoryPatientRequests(report: number, patient_request: number): Observable<PatientRequest[]> {
    return this.http.get<PatientRequest[]>(`${environment.apiTfdUrl}/opinion/get-history-patient-requests/${report}/${patient_request}`, {headers: requestOptions})
  }

  archivePatientRequest(patient_request: number): Observable<Array<any>> {
    return this.http.patch<Array<any>>(`${environment.apiTfdUrl}/opinion/archive-patient-request/${patient_request}`, {headers: requestOptions})
  }

  getCostAssistanceProfessionals(): Observable<Professional[]> {
    return this.http.get<Professional[]>(`${environment.apiTfdUrl}/opinion/get-cost-assistance-professionals`, {headers: requestOptions})
  }

  getTravelProfessionals(): Observable<Professional[]> {
    return this.http.get<Professional[]>(`${environment.apiTfdUrl}/opinion/get-travel-professionals`, {headers: requestOptions})
  }

  processPatientRequestToCostAssistanceAndTravel(patient_request: number, data: any): Observable<Array<any>> {
    return this.http.patch<Array<any>>(`${environment.apiTfdUrl}/opinion/process-patient-request-to-cost-assistance-and-travel/${patient_request}`, data, {headers: requestOptions})
  }

  // aqui

 


  
  

  

  

  

  

  downloadOpinion(opinion: number): Observable<any> {
    return this.http.get(`${environment.apiTfdUrl}/opinion/download/${opinion}`, {headers: requestOptions, responseType: 'blob'})
  }

  

  

  restorePatientRequest(patient_request: number): Observable<Array<any>> {
    return this.http.patch<Array<any>>(`${environment.apiTfdUrl}/opinion/restore/patient-request/${patient_request}`, {headers: requestOptions})
  }

  
}
