import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment.development';
import { Patient } from '../models/patient';
import { PatientRequest } from '../models/patient-request';

const requestOptions = {
  'Authorization': `Bearer ${window.localStorage.getItem('token')}`
}

@Injectable({
  providedIn: 'root',
})
export class SearchService {

  constructor(
    private http: HttpClient,
  ) {}

  getPatients(): Observable<Patient[]> {
    return this.http.get<Patient[]>(`${environment.apiTfdUrl}/search/get-patients`, {headers: requestOptions})
  }

  getArchivedPatients(): Observable<Patient[]> {
    return this.http.get<Patient[]>(`${environment.apiTfdUrl}/search/get-archived-patients`, {headers: requestOptions})
  }

  getArchivedPatientsRequests(): Observable<PatientRequest[]> {
    return this.http.get<PatientRequest[]>(`${environment.apiTfdUrl}/search/get-archived-patient-requests`, {headers: requestOptions})
  }
  
}
