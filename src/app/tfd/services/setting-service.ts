import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment.development';
import { DailyCost } from '../models/daily-cost';

const requestOptions = {
  'Authorization': `Bearer ${window.localStorage.getItem('token')}`
}

@Injectable({
  providedIn: 'root',
})
export class SettingService {

  constructor(
    private http: HttpClient
  ) {}

  getDailiesCost(): Observable<DailyCost[]> {
    return this.http.get<DailyCost[]>(`${environment.apiTfdUrl}/setting/get-daily-costs`, {headers: requestOptions})
  }

  updateDailyCost(daily_cost: number, data: DailyCost): Observable<Array<any>> {
    return this.http.patch<Array<any>>(`${environment.apiTfdUrl}/setting/update-daily-cost/${daily_cost}`, data, {headers: requestOptions})
  }
  
}
