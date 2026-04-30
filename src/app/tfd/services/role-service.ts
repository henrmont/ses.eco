import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment.development';
import { Role } from '../models/role';
import { Permission } from '../models/permission';

const requestOptions = {
  'Authorization': `Bearer ${window.localStorage.getItem('token')}`
}


@Injectable({
  providedIn: 'root',
})
export class RoleService {

  constructor(
    private http: HttpClient,
  ) {}

  getRoles(): Observable<Role[]> {
    return this.http.get<Role[]>(`${environment.apiTfdUrl}/role/get-roles`, {headers: requestOptions})
  }

  getPermissions(): Observable<Permission[]> {
    return this.http.get<Permission[]>(`${environment.apiTfdUrl}/role/get-permissions`, {headers: requestOptions})
  }

  createRole(data: Role): Observable<Array<any>> {
    return this.http.post<Array<any>>(`${environment.apiTfdUrl}/role/create-role`, data, {headers: requestOptions})
  }

  updateRole(role: number, data: Role): Observable<Array<any>> {
    return this.http.patch<Array<any>>(`${environment.apiTfdUrl}/role/update-role/${role}`, data, {headers: requestOptions})
  }

  deleteRole(role: number): Observable<Array<any>> {
    return this.http.delete<Array<any>>(`${environment.apiTfdUrl}/role/delete-role/${role}`, {headers: requestOptions})
  }
  
}
