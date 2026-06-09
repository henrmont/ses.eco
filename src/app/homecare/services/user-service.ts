import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { AbstractControl, AsyncValidatorFn, ValidationErrors } from '@angular/forms';
import { catchError, map, Observable, of } from 'rxjs';
import { environment } from '../../../environments/environment.development';
import { User } from '../models/user';

@Injectable({
  providedIn: 'root',
})
export class UserService {
  private readonly http = inject(HttpClient);

  /**
   * Auxiliar privado para gerar os headers dinamicamente a cada requisição
   */
  private getHeaders(): HttpHeaders {
    const token = window.localStorage.getItem('token') || '';
    return new HttpHeaders({
      'Authorization': `Bearer ${token}`
    });
  }

  getUsers(): Observable<User[]> {
    return this.http.get<User[]>(`${environment.apiHomecareUrl}/user/get-users`, { headers: this.getHeaders() });
  }

  createUser(data: User): Observable<Array<any>> {
    return this.http.post<Array<any>>(`${environment.apiHomecareUrl}/user/create-user`, data, { headers: this.getHeaders() });
  }

  // Validators
  emailUserExistsValidator(data: string | null | undefined): AsyncValidatorFn {
    return (control: AbstractControl): Observable<ValidationErrors | null> => {
      const email = control.value;

      if (!email) return of(null);

      return this.http.get<boolean>(`${environment.apiHomecareUrl}/validator/email-user-exists/${email}/${data}`, { headers: this.getHeaders() }).pipe(
        map(res => {
          return res ? { emailExists: true } : null;
        }),
        catchError(() => of(null))
      );
    };
  }

  cnsUserExistsValidator(data: string | null | undefined): AsyncValidatorFn {
    return (control: AbstractControl): Observable<ValidationErrors | null> => {
      const cns = control.value;

      if (!cns) return of(null);

      return this.http.get<boolean>(`${environment.apiHomecareUrl}/validator/cns-user-exists/${cns}/${data}`, { headers: this.getHeaders() }).pipe(
        map(res => {
          return res ? { cnsExists: true } : null;
        }),
        catchError(() => of(null))
      );
    };
  }
}