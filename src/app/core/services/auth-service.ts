import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment.development';

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  private readonly http = inject(HttpClient);

  /**
   * Auxiliar privado para ler o token atualizado do localStorage a cada requisição
   */
  private getHeaders(): HttpHeaders {
    const token = window.localStorage.getItem('token') || '';
    return new HttpHeaders({
      'Authorization': `Bearer ${token}`
    });
  }

  login(data: any): Observable<any> {
    return this.http.post<any>(`${environment.apiAuthUrl}/auth/login`, data);
  }

  logout(): Observable<any> {
    // 🌟 CORREÇÃO: Cabeçalhos gerados dinamicamente no momento do clique/chamada
    return this.http.get<any>(`${environment.apiAuthUrl}/auth/logout`, { headers: this.getHeaders() });
  }

  me(): Observable<any> {
    return this.http.get<any>(`${environment.apiAuthUrl}/auth/me`, { headers: this.getHeaders() });
  }

  refresh(): Observable<any> {
    return this.http.get<any>(`${environment.apiAuthUrl}/auth/refresh`, { headers: this.getHeaders() });
  }
}