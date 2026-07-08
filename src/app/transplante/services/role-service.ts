import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment.development';
import { Role } from '../models/role';
import { Permission } from '../models/permission';

export interface ApiResponse {
  message: string;
  status?: string;
  [key: string]: any; 
}

@Injectable({
  providedIn: 'root',
})
export class RoleService {
  // 🔒 Injeções e URLs configuradas como imutáveis e limpas (sem lixo de headers manuais)
  private readonly http = inject(HttpClient);
  private readonly apiUrl = `${environment.apiTransplanteUrl}/role`;

  getRoles(): Observable<Role[]> {
    return this.http.get<Role[]>(`${this.apiUrl}/get-roles`);
  }

  getPermissions(): Observable<Permission[]> {
    return this.http.get<Permission[]>(`${this.apiUrl}/get-permissions`);
  }

  createRole(data: Role): Observable<ApiResponse> {
    return this.http.post<ApiResponse>(`${this.apiUrl}/create-role`, data);
  }

  updateRole(roleId: number, data: Role): Observable<ApiResponse> {
    return this.http.patch<ApiResponse>(`${this.apiUrl}/update-role/${roleId}`, data);
  }

  deleteRole(roleId: number): Observable<ApiResponse> {
    return this.http.delete<ApiResponse>(`${this.apiUrl}/delete-role/${roleId}`);
  }
}