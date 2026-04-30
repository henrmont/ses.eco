import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment.development';
import { Archive } from '../models/archive';

const requestOptions = {
  'Authorization': `Bearer ${window.localStorage.getItem('token')}`
}

@Injectable({
  providedIn: 'root',
})
export class StorageService {

  constructor(
    private http: HttpClient
  ) {}

  download(archive: number): Observable<Archive> {
    return this.http.get<Archive>(`${environment.apiStorageUrl}/download/${archive}`, {headers: requestOptions})
  }
  
}
