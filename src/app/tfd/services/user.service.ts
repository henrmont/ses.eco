import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { AbstractControl, AsyncValidatorFn, ValidationErrors } from '@angular/forms';
import { Observable, catchError, map, of } from 'rxjs';

import { environment } from '../../../environments/environment.development';
import { User } from '../models/user.model';
import { Role } from '../models/role.model';
import { ApiResponse } from '../../core/models/api-response.model';

@Injectable({
  providedIn: 'root',
})
export class UserService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = `${environment.apiTfdUrl}/user`;
  private readonly validatorUrl = `${environment.apiTfdUrl}/validator`;

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
    return this.http.patch<ApiResponse>(`${this.apiUrl}/lock-user/${userId}`, {});
  }

  validateUser(userId: number): Observable<ApiResponse> {
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

  emailUserExistsValidator(currentEmail: string | null | undefined): AsyncValidatorFn {
    return (control: AbstractControl): Observable<ValidationErrors | null> => {
      const email = control.value;
      if (!email) return of(null);

      const emailToCompare = currentEmail || '';
      const encodedEmail = encodeURIComponent(email);
      const encodedCompare = encodeURIComponent(emailToCompare);

      return this.http
        .get<boolean>(`${this.validatorUrl}/email-user-exists/${encodedEmail}/${encodedCompare}`)
        .pipe(
          map(emailExists => (emailExists ? { emailExists: true } : null)),
          catchError(() => of(null)) // Em caso de falha de rede/API, não bloqueia a digitação
        );
    };
  }

  cnsUserExistsValidator(currentCns: string | null | undefined): AsyncValidatorFn {
    return (control: AbstractControl): Observable<ValidationErrors | null> => {
      const cns = control.value;
      if (!cns) return of(null);

      const cnsToCompare = currentCns || '';
      const encodedCns = encodeURIComponent(cns);
      const encodedCompare = encodeURIComponent(cnsToCompare);

      return this.http
        .get<boolean>(`${this.validatorUrl}/cns-user-exists/${encodedCns}/${encodedCompare}`)
        .pipe(
          map(cnsExists => (cnsExists ? { cnsExists: true } : null)),
          catchError(() => of(null))
        );
    };
  }
}