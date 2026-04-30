import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { catchError, map, Observable, of } from 'rxjs';
import { environment } from '../../../environments/environment.development';
import { AbstractControl, AsyncValidatorFn, ValidationErrors } from '@angular/forms';
import { PatientCare } from '../models/patient-care';
import * as moment from 'moment';
import { PatientRequest } from '../models/patient-request';
import { Patient } from '../models/patient';
import { HospitalUnity } from '../models/hospital-unity';
import { PatientRequestAttachment } from '../models/patient-request-attachment';
import { Professional } from '../models/professional';

const requestOptions = {
  'Authorization': `Bearer ${window.localStorage.getItem('token')}`
}

@Injectable({
  providedIn: 'root',
})
export class PatientRequestService {

  constructor(
    private http: HttpClient,
  ) {}

  getPatientRequests(): Observable<PatientRequest[]> {
    return this.http.get<PatientRequest[]>(`${environment.apiTfdUrl}/patient-request/get-patient-requests`, {headers: requestOptions})
  }

  getPatients(): Observable<Patient[]> {
    return this.http.get<Patient[]>(`${environment.apiTfdUrl}/patient-request/get-patients`, {headers: requestOptions})
  }

  getReports(patient_care: number): Observable<Report[]> {
    return this.http.get<Report[]>(`${environment.apiTfdUrl}/patient-request/get-patient-reports/${patient_care}`, {headers: requestOptions})
  }

  getHospitalUnities(): Observable<HospitalUnity[]> {
    return this.http.get<HospitalUnity[]>(`${environment.apiTfdUrl}/patient-request/get-hospital-unities`, {headers: requestOptions})
  }

  getMedicalProfessionals(): Observable<Professional[]> {
    return this.http.get<Professional[]>(`${environment.apiTfdUrl}/patient-request/get-medical-professionals`, {headers: requestOptions})
  }

  createPatientRequest(data: PatientRequest): Observable<Array<any>> {
    return this.http.post<Array<any>>(`${environment.apiTfdUrl}/patient-request/create-patient-request`, data, {headers: requestOptions})
  }

  haltedPatientRequest(patient_request: number): Observable<Array<any>> {
    return this.http.patch<Array<any>>(`${environment.apiTfdUrl}/patient-request/halted-patient-request/${patient_request}`, {headers: requestOptions})
  }

  updatePatientRequest(patient_request: number, data: PatientRequest): Observable<Array<any>> {
    return this.http.patch<Array<any>>(`${environment.apiTfdUrl}/patient-request/update-patient-request/${patient_request}`, data, {headers: requestOptions})
  }

  deletePatientRequest(patient_request: number): Observable<Array<any>> {
    return this.http.delete<Array<any>>(`${environment.apiTfdUrl}/patient-request/delete-patient-request/${patient_request}`, {headers: requestOptions})
  }

  getPatientRequestAttachments(patient_request: number): Observable<PatientRequestAttachment[]> {
    return this.http.get<PatientRequestAttachment[]>(`${environment.apiTfdUrl}/patient-request/get-patient-request-attachments/${patient_request}`, {headers: requestOptions})
  }

  createPatientRequestAttachment(patient_request: number, data: any): Observable<Array<any>> {
    return this.http.post<Array<any>>(`${environment.apiTfdUrl}/patient-request/create-patient-request-attachment/${patient_request}`, this.mountFormData(data), {headers: requestOptions})
  }

  updatePatientRequestAttachment(patient_request_attachment: number, data: any): Observable<Array<any>> {
    return this.http.patch<Array<any>>(`${environment.apiTfdUrl}/patient-request/update-patient-request-attachment/${patient_request_attachment}`, this.mountFormData(data), {headers: requestOptions})
  }

  deletePatientRequestAttachment(patient_request_attachment: number): Observable<Array<any>> {
    return this.http.delete<Array<any>>(`${environment.apiTfdUrl}/patient-request/delete-patient-request-attachment/${patient_request_attachment}`, {headers: requestOptions})
  }

  processPatientRequestToMedical(patient_request: number, data: any): Observable<Array<any>> {
    return this.http.patch<Array<any>>(`${environment.apiTfdUrl}/patient-request/process-patient-request-to-medical/${patient_request}`, data, {headers: requestOptions})
  }

  movePatientRequestFromProcesses(patient_request: number): Observable<Array<any>> {
    return this.http.patch<Array<any>>(`${environment.apiTfdUrl}/patient-request/move-patient-request-from-processes/${patient_request}`, {headers: requestOptions})
  }

  movePatientRequestFromOthers(patient_request: number): Observable<Array<any>> {
    return this.http.patch<Array<any>>(`${environment.apiTfdUrl}/patient-request/move-patient-request-from-others/${patient_request}`, {headers: requestOptions})
  }

  movePatientRequestFromArchive(patient_request: number): Observable<Array<any>> {
    return this.http.patch<Array<any>>(`${environment.apiTfdUrl}/patient-request/move-patient-request-from-archive/${patient_request}`, {headers: requestOptions})
  }

  // Resources
  private mountFormData(data: any): FormData
  {
    const formData = new FormData()
    for (const [key, value] of Object.entries(data)) {
      if (value instanceof File || value instanceof Blob)
        formData.append(key, value, 'file');
      else if (moment.isMoment(value))
        formData.append(key, value.format('YYYY-MM-DD'));
      else if (value !== null && value !== undefined)
        formData.append(key, value as string);
    }
    return formData
  }
  
}
