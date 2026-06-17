import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class ViacepService {
  // 💡 Injeção moderna com inject()
  private readonly http = inject(HttpClient);

  // 📝 Removemos o espaço extra no final da string da URL
  getAddress(cep: string | number): Observable<any> {
    return this.http.get<any>(`https://viacep.com.br/ws/${cep}/json/`);
  }

  getNaturalness(): Observable<any> {
    return this.http.get<any>('https://servicodados.ibge.gov.br/api/v1/localidades/municipios');
  }
}