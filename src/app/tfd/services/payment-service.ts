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
export class PaymentService {

  constructor(
    private http: HttpClient,
  ) {}

  getPatientRequests(): Observable<PatientRequest[]> {
    return this.http.get<PatientRequest[]>(`${environment.apiTfdUrl}/payment/get-patient-requests`, {headers: requestOptions})
  }

  haltedPatientRequest(patient_request: number): Observable<Array<any>> {
    return this.http.patch<Array<any>>(`${environment.apiTfdUrl}/payment/halted-patient-request/${patient_request}`, {headers: requestOptions})
  }

  paymentInfo(patient_request: number, data: any): Observable<any> {
    return this.http.post(`${environment.apiTfdUrl}/payment/payment-info/${patient_request}`, data, {headers: requestOptions})
  }

  finishPatientRequestPayment(patient_request: number): Observable<Array<any>> {
    return this.http.patch<Array<any>>(`${environment.apiTfdUrl}/payment/finish-patient-request-payment/${patient_request}`, {headers: requestOptions})
  }

  undoPatientRequest(patient_request: number, data: PatientRequest): Observable<Array<any>> {
    return this.http.patch<Array<any>>(`${environment.apiTfdUrl}/payment/undo-patient-request/${patient_request}`, data, {headers: requestOptions})
  }
  
}
