import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { ViacepService } from './viacep-service';

describe('ViacepService', () => {
  let service: ViacepService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [ViacepService]
    });

    service = TestBed.inject(ViacepService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    // Garante que nenhuma requisição HTTP ficou pendente ou esquecida
    httpMock.verify();
  });

  it('deve criar o serviço com sucesso', () => {
    expect(service).toBeTruthy();
  });

  describe('getAddress', () => {
    it('deve buscar o endereço correspondente ao CEP informado com sucesso', () => {
      const mockCep = '78000000';
      const mockResponse = {
        cep: '78000-000',
        logradouro: 'Av. Historiador Rubens de Mendonça',
        bairro: 'Alvorada',
        localidade: 'Cuiabá',
        uf: 'MT'
      };

      service.getAddress(mockCep).subscribe((response) => {
        expect(response).toBeDefined();
        expect(response.localidade).toBe('Cuiabá');
        expect(response.uf).toBe('MT');
      });

      const req = httpMock.expectOne(`https://viacep.com.br/ws/${mockCep}/json/`);
      expect(req.request.method).toBe('GET');
      req.flush(mockResponse);
    });

    it('deve propagar o erro caso a API do ViaCEP falhe', () => {
      const mockCep = '00000000';

      service.getAddress(mockCep).subscribe({
        next: () => {
          throw new Error('Deveria ter falhado');
        },
        error: (error) => {
          expect(error).toBeDefined();
          expect(error.status).toBe(500);
        }
      });

      const req = httpMock.expectOne(`https://viacep.com.br/ws/${mockCep}/json/`);
      req.flush('Erro interno no servidor', { status: 500, statusText: 'Internal Server Error' });
    });
  });

  describe('getNaturalness', () => {
    it('deve buscar a lista de municípios do IBGE com sucesso', () => {
      const mockMunicipios = [
        { id: 5103403, nome: 'Cuiabá' },
        { id: 5108402, nome: 'Várzea Grande' }
      ];

      service.getNaturalness().subscribe((response) => {
        expect(response).toBeDefined();
        expect(response.length).toBe(2);
        expect(response[0].nome).toBe('Cuiabá');
      });

      const req = httpMock.expectOne('https://servicodados.ibge.gov.br/api/v1/localidades/municipios');
      expect(req.request.method).toBe('GET');
      req.flush(mockMunicipios);
    });

    it('deve propagar o erro caso a API do IBGE falhe', () => {
      service.getNaturalness().subscribe({
        next: () => {
          throw new Error('Deveria ter falhado');
        },
        error: (error) => {
          expect(error).toBeDefined();
          expect(error.status).toBe(502);
        }
      });

      const req = httpMock.expectOne('https://servicodados.ibge.gov.br/api/v1/localidades/municipios');
      req.flush('Bad Gateway', { status: 502, statusText: 'Bad Gateway' });
    });
  });
});