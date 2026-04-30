import { HttpClient } from '@angular/common/http';
import { Injectable, signal } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment.development';

const requestOptions = {
  'Authorization': `Bearer ${window.localStorage.getItem('token')}`
}

@Injectable({
  providedIn: 'root',
})
export class ProfileService {

  constructor(
    private http: HttpClient,
  ) {}

  changeProfileImage(data: any): Observable<any> {
    return this.http.patch<any>(`${environment.apiCoreUrl}/change/profile/image`, data, {headers: requestOptions})
  }

  changeProfileInfo(data: any): Observable<any> {
    return this.http.patch<any>(`${environment.apiCoreUrl}/change/profile/info`, data, {headers: requestOptions})
  }

  changeProfileModule(id: any): Observable<any> {
    return this.http.patch<any>(`${environment.apiCoreUrl}/change/profile/module/${id}`, {headers: requestOptions})
  }

}
