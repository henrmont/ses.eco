// core/services/auth-service.ts
import { HttpClient } from '@angular/common/http';
import { Injectable, computed, inject, signal } from '@angular/core';
import { Observable, tap } from 'rxjs';
import { environment } from '../../../environments/environment';
import { User } from '../models/user.model';

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  private readonly http = inject(HttpClient);

  // Permite guardar o User base ou qualquer extensão (ex: TfdUser)
  private readonly _currentUser = signal<User | null>(null);
  
  readonly currentUser = this._currentUser.asReadonly();
  readonly isAuthenticated = computed(() => !!this._currentUser());

  // Getter auxiliar genérico para obter o usuário já tipado no módulo periférico
  getCurrentUser<T extends User>(): T | null {
    return (this._currentUser() as T) || null;
  }

  // Aceita TfdUser ou qualquer outro subtipo de User
  setCurrentUser<T extends User>(user: T | null): void {
    this._currentUser.set(user);
  }

  clearSession(): void {
    window.localStorage.removeItem('token');
    this._currentUser.set(null);
  }

  login(data: any): Observable<any> {
    return this.http.post<any>(`${environment.apiAuthUrl}/login`, data).pipe(
      tap((response) => {
        if (response?.access_token || response?.token) {
          window.localStorage.setItem('token', response.access_token || response.token);
        }
      })
    );
  }

  logout(): Observable<any> {
    return this.http.get<any>(`${environment.apiAuthUrl}/logout`).pipe(
      tap(() => this.clearSession())
    );
  }

  me<T extends User = User>(): Observable<T> {
    return this.http.get<T>(`${environment.apiAuthUrl}/me`).pipe(
      tap((user) => this.setCurrentUser(user))
    );
  }

  refresh(): Observable<any> {
    return this.http.get<any>(`${environment.apiAuthUrl}/refresh`);
  }

  // Solicitar envio do e-mail com link
  forgotPassword(payload: { email: string }): Observable<any> {
    return this.http.post<any>(`${environment.apiAuthUrl}/forgot-password`, payload);
  }

  // Redefinir a senha com o token recebido
  resetPassword(payload: { token: string; email: string; password: string; password_confirmation: string }): Observable<any> {
    return this.http.post<any>(`${environment.apiAuthUrl}/reset-password`, payload);
  }

}