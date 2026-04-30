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
    return this.http.get<User[]>(`${environment.apiTfdUrl}/user/get-users`, {headers: requestOptions})
  }

  getRoles(): Observable<Role[]> {
    return this.http.get<Role[]>(`${environment.apiTfdUrl}/user/get-roles`, {headers: requestOptions})
  }

  createUser(data: User): Observable<Array<any>> {
    return this.http.post<Array<any>>(`${environment.apiTfdUrl}/user/create-user`, data, {headers: requestOptions})
  }

  lockUser(user: number): Observable<Array<any>> {
    return this.http.patch<Array<any>>(`${environment.apiTfdUrl}/user/lock-user/${user}`, {headers: requestOptions})
  }

  validateUser(user: number): Observable<Array<any>> {
    return this.http.patch<Array<any>>(`${environment.apiTfdUrl}/user/validate-user/${user}`, {headers: requestOptions})
  }

  updateUser(user: number, data: User): Observable<Array<any>> {
    return this.http.patch<Array<any>>(`${environment.apiTfdUrl}/user/update-user/${user}`, data, {headers: requestOptions})
  }

  deleteUser(user: number): Observable<Array<any>> {
    return this.http.delete<Array<any>>(`${environment.apiTfdUrl}/user/delete-user/${user}`, {headers: requestOptions})
  }

  rolesUser(user: number, data: Role[]): Observable<Array<any>> {
    return this.http.patch<Array<any>>(`${environment.apiTfdUrl}/user/roles-user/${user}`, data, {headers: requestOptions})
  }

  // Validators
  emailUserExistsValidator(data: string | null | undefined): AsyncValidatorFn {
    return (control: AbstractControl): Observable<ValidationErrors | null> => {
      const email = control.value;

      if (!email) return of(null);

      return this.http.get<{ emailExists: boolean }>(`${environment.apiTfdUrl}/validator/email-user-exists/${email}/${data}`, { headers: requestOptions }).pipe(
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

      return this.http.get<{ cnsExists: boolean }>(`${environment.apiTfdUrl}/validator/cns-user-exists/${cns}/${data}`, { headers: requestOptions }).pipe(
        map(res => {
          return res ? { cnsExists: true } : null;
        }),
        catchError(() => of(null))
      );
    };
  }
  
}
