import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class ViacepService {

  constructor(
    private http: HttpClient,
  ) {}

  getAddress(cep: any): Observable<any> {
    return this.http.get<any>(`https://viacep.com.br/ws/${cep}/json/ `)
  }

  getNaturalness(): Observable<any> {
    return this.http.get<any>(`https://servicodados.ibge.gov.br/api/v1/localidades/municipios`)
  }
  
}
