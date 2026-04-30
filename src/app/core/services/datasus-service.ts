import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment.development';

const requestOptions = {
  'Authorization': `Bearer ${window.localStorage.getItem('token')}`
}

@Injectable({
  providedIn: 'root',
})
export class DatasusService {

  constructor(
    private http: HttpClient,
  ) {}

  process(data: any): Observable<any> {
    const formData = new FormData()
    formData.append('file', data)
    return this.http.post<any>(`${environment.apiDatasusUrl}/process`, formData, {headers: requestOptions})
  }

  getCompetences(): Observable<any> {
    return this.http.get<any>(`${environment.apiDatasusUrl}/get-competences`, {headers: requestOptions})
  }
  
}
