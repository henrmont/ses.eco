import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { catchError, map, Observable, of } from 'rxjs';
import { environment } from '../../../environments/environment.development';
import { User } from '../models/user';
import { Role } from '../models/role';
import { AbstractControl, AsyncValidatorFn, ValidationErrors } from '@angular/forms';

export interface ApiResponse {
  message: string;
  status?: string;
  [key: string]: any; 
}

@Injectable({
  providedIn: 'root',
})
export class UserService {
  // 🔒 Injeções e URLs configuradas como imutáveis
  private readonly http = inject(HttpClient);
  private readonly apiUrl = `${environment.apiHomecareUrl}/user`;
  private readonly validatorUrl = `${environment.apiHomecareUrl}/validator`;

  // 🧹 Os headers manuais continuam banidos! O Interceptor cuida do token com maestria.

  getUsers(): Observable<User[]> {
    return this.http.get<User[]>(`${this.apiUrl}/get-users`);
  }

  getRoles(): Observable<Role[]> {
    return this.http.get<Role[]>(`${this.apiUrl}/get-roles`);
  }

  createUser(data: User): Observable<ApiResponse> {
    return this.http.post<ApiResponse>(`${this.apiUrl}/create-user`, data);
  }

  lockUser(userId: number): Observable<ApiResponse> {
    // 🛠️ Corpo vazio {} passado corretamente como 2º parâmetro no PATCH para alternar o status
    return this.http.patch<ApiResponse>(`${this.apiUrl}/lock-user/${userId}`, {});
  }

  validateUser(userId: number): Observable<ApiResponse> {
    // 🛠️ Atende perfeitamente ao nosso componente dinâmico de alternância de validação (is_valid)
    return this.http.patch<ApiResponse>(`${this.apiUrl}/validate-user/${userId}`, {});
  }

  updateUser(userId: number, data: User): Observable<ApiResponse> {
    return this.http.patch<ApiResponse>(`${this.apiUrl}/update-user/${userId}`, data);
  }

  deleteUser(userId: number): Observable<ApiResponse> {
    return this.http.delete<ApiResponse>(`${this.apiUrl}/delete-user/${userId}`);
  }

  rolesUser(userId: number, data: Role[]): Observable<ApiResponse> {
    return this.http.patch<ApiResponse>(`${this.apiUrl}/roles-user/${userId}`, data);
  }

  // --- VALIDATORS ASSÍNCRONOS BLINDADOS ---

  emailUserExistsValidator(currentEmail: string | null | undefined): AsyncValidatorFn {
    return (control: AbstractControl): Observable<ValidationErrors | null> => {
      const email = control.value;
      if (!email) return of(null);

      // 🌟 Garante que o fallback do valor de checagem inicial não envie texto "null" literal na URL
      const emailToCompare = currentEmail || '';

      return this.http.get<boolean>(`${this.validatorUrl}/email-user-exists/${email}/${emailToCompare}`).pipe(
        map(emailExists => emailExists ? { emailExists: true } : null),
        catchError(() => of(null)) // Se a API falhar, não trava o fluxo de digitação do usuário
      );
    };
  }

  cnsUserExistsValidator(currentCns: string | null | undefined): AsyncValidatorFn {
    return (control: AbstractControl): Observable<ValidationErrors | null> => {
      const cns = control.value;
      if (!cns) return of(null);

      // 🌟 Evita envio de lixo ou strings "undefined" literais para as rotas do back-end
      const cnsToCompare = currentCns || '';

      return this.http.get<boolean>(`${this.validatorUrl}/cns-user-exists/${cns}/${cnsToCompare}`).pipe(
        map(cnsExists => cnsExists ? { cnsExists: true } : null),
        catchError(() => of(null))
      );
    };
  }
}