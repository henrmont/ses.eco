import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
// 🌍 Importação corrigida para o environment geral (sem o .development)
import { Archive } from '../models/archive';
import { environment } from '../../../environments/environment.development';

@Injectable({
  providedIn: 'root',
})
export class StorageService {
  // 🔒 Injeção moderna com inject() e URL imutável baseada no environment geral
  private readonly http = inject(HttpClient);
  private readonly apiUrl = `${environment.apiStorageUrl}/download`;

  /**
   * Realiza o download de um arquivo específico pelo ID.
   * O HttpInterceptor injeta o token automaticamente em background.
   * @param archiveId ID do arquivo armazenado
   */
  download(archiveId: number): Observable<Archive> {
    return this.http.get<Archive>(`${this.apiUrl}/${archiveId}`);
  }
}