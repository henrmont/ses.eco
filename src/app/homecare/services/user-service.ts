import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { catchError, map, Observable, of } from 'rxjs';
import { environment } from '../../../environments/environment.development';
import { User } from '../models/user';
import { Role } from '../models/role';
import { AbstractControl, AsyncValidatorFn, ValidationErrors } from '@angular/forms';

const requestOptions = {
  'Authorization': `Bearer ${window.localStorage.getItem('token')}`
}

@Injectable({
  providedIn: 'root',
})
export class UserService {

  constructor(
    private http: HttpClient
  ) {}

  getUsers(): Observable<User[]> {
    return this.http.get<User[]>(`${environment.apiHomecareUrl}/user/get-users`, {headers: requestOptions})
  }

  createUser(data: User): Observable<Array<any>> {
    return this.http.post<Array<any>>(`${environment.apiHomecareUrl}/user/create-user`, data, {headers: requestOptions})
  }

  // Validators
  emailUserExistsValidator(data: string | null | undefined): AsyncValidatorFn {
    return (control: AbstractControl): Observable<ValidationErrors | null> => {
      const email = control.value;

      if (!email) return of(null);

      return this.http.get<{ emailExists: boolean }>(`${environment.apiHomecareUrl}/validator/email-user-exists/${email}/${data}`, { headers: requestOptions }).pipe(
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

      return this.http.get<{ cnsExists: boolean }>(`${environment.apiHomecareUrl}/validator/cns-user-exists/${cns}/${data}`, { headers: requestOptions }).pipe(
        map(res => {
          return res ? { cnsExists: true } : null;
        }),
        catchError(() => of(null))
      );
    };
  }
  
}
