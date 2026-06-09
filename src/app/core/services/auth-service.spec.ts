import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { AuthService } from './auth-service';
import { environment } from '../../../environments/environment.development';

describe('AuthService (Vitest)', () => {
  let service: AuthService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [AuthService]
    });

    service = TestBed.inject(AuthService);
    httpMock = TestBed.inject(HttpTestingController);

    // Limpa o localStorage antes de cada teste para isolamento total
    window.localStorage.clear();
  });

  afterEach(() => {
    // Garante que nenhuma requisição HTTP ficou pendente ou sem resposta
    httpMock.verify();
  });

  it('deve criar o serviço de autenticação com sucesso', () => {
    expect(service).toBeTruthy();
  });

  it('deve realizar login enviando dados via POST e retornar dados do usuário', () => {
    const mockLoginData = { email: 'user@test.com', password: '123' };
    const mockResponse = { token: 'token-fake-123', user: { id: 1, email: 'user@test.com' } };

    service.login(mockLoginData).subscribe(response => {
      expect(response).toEqual(mockResponse);
    });

    const req = httpMock.expectOne(`${environment.apiAuthUrl}/auth/login`);
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual(mockLoginData);

    req.flush(mockResponse); // Simula retorno da API
  });

  it('deve realizar logout enviando o Bearer Token correto nos headers', () => {
    window.localStorage.setItem('token', 'meu-token-secreto');

    service.logout().subscribe();

    const req = httpMock.expectOne(`${environment.apiAuthUrl}/auth/logout`);
    expect(req.request.method).toBe('GET');
    expect(req.request.headers.get('Authorization')).toBe('Bearer meu-token-secreto');

    req.flush({ message: 'Logout efetuado' });
  });

  it('deve buscar dados do perfil (me) enviando o Bearer Token atualizado nos headers', () => {
    window.localStorage.setItem('token', 'token-perfil');

    service.me().subscribe();

    const req = httpMock.expectOne(`${environment.apiAuthUrl}/auth/me`);
    expect(req.request.method).toBe('GET');
    expect(req.request.headers.get('Authorization')).toBe('Bearer token-perfil');

    req.flush({ id: 1, name: 'Usuario Autenticado' });
  });

  it('deve solicitar renovação de token (refresh) com cabeçalho de autorização correto', () => {
    window.localStorage.setItem('token', 'token-expirado');

    service.refresh().subscribe();

    const req = httpMock.expectOne(`${environment.apiAuthUrl}/auth/refresh`);
    expect(req.request.method).toBe('GET');
    expect(req.request.headers.get('Authorization')).toBe('Bearer token-expirado');

    req.flush({ token: 'novo-token-valido' });
  });
});