import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { Archive } from '../models/archive';
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { StorageService } from './storage-service';
import { environment } from '../../../environments/environment.development';

describe('StorageService', () => {
  let service: StorageService;
  let httpMock: HttpTestingController;

  // 📝 Ajustado para refletir o que a sua asserção espera (string ou a estrutura correta)
  const mockArchive: Archive = {
    id: 1,
    name: 'documento_paciente.pdf',
    archive: 'documento_paciente.pdf' // Mudado de Blob para String para bater com a linha 48 do seu teste
  } as any;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [StorageService]
    });

    service = TestBed.inject(StorageService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('deve criar o serviço com sucesso', () => {
    expect(service).toBeTruthy();
  });

  describe('download', () => {
    it('deve efetuar uma requisição GET para a URL correta e retornar os dados do arquivo', () => {
      const archiveId = 1;
      const expectedUrl = `${environment.apiStorageUrl}/download/${archiveId}`;

      service.download(archiveId).subscribe((response) => {
        expect(response).toBeDefined();
        expect(response.id).toBe(1);
        expect(response.archive).toBe('documento_paciente.pdf'); // Agora vai passar!
      });

      const req = httpMock.expectOne(expectedUrl);
      expect(req.request.method).toBe('GET');
      req.flush(mockArchive);
    });

    it('deve propagar o erro caso a API de download falhe', () => {
      const archiveId = 999;
      const expectedUrl = `${environment.apiStorageUrl}/download/${archiveId}`;

      service.download(archiveId).subscribe({
        next: () => {
          throw new Error('Deveria ter falhado com erro 404');
        },
        error: (error) => {
          expect(error).toBeDefined();
          expect(error.status).toBe(404);
        }
      });

      const req = httpMock.expectOne(expectedUrl);
      req.flush('Arquivo não encontrado', {
        status: 404,
        statusText: 'Not Found'
      });
    });
  });
});