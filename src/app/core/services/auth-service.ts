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
export class AuthService {

  constructor(
    private http: HttpClient,
  ) { }

  login(data: any): Observable<any> {
    return this.http.post<any>(`${environment.apiAuthUrl}/auth/login`, data)
  }

  logout() {
    return this.http.get<any>(`${environment.apiAuthUrl}/auth/logout`, {headers: requestOptions})
  }

  me(): Observable<any> {
    return this.http.get<any>(`${environment.apiAuthUrl}/auth/me`, {headers: requestOptions})
  }

  refresh(): Observable<any> {
    return this.http.get<any>(`${environment.apiAuthUrl}/auth/refresh`, {headers: requestOptions})
  }
  
}
