import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { FormControl } from '@angular/forms';
import { beforeEach, describe, expect, it } from 'vitest';
import { UserService } from './user-service';
import { environment } from '../../../environments/environment.development';
import { User } from '../models/user';

describe('UserService Homecare (Vitest)', () => {
  let service: UserService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [UserService]
    });

    service = TestBed.inject(UserService);
    httpMock = TestBed.inject(HttpTestingController);
    window.localStorage.clear();
    window.localStorage.setItem('token', 'token-homecare');
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('deve criar o serviço com sucesso', () => {
    expect(service).toBeTruthy();
  });

  it('deve buscar a lista de usuários (getUsers) com os headers corretos', () => {
    const mockUsers: User[] = [{ id: 1, email: 'teste@homecare.com' } as User];

    service.getUsers().subscribe(users => {
      expect(users).toEqual(mockUsers);
    });

    const req = httpMock.expectOne(`${environment.apiHomecareUrl}/user/get-users`);
    expect(req.request.method).toBe('GET');
    expect(req.request.headers.get('Authorization')).toBe('Bearer token-homecare');
    req.flush(mockUsers);
  });

  it('deve cadastrar um usuário (createUser) enviando dados via POST', () => {
    const mockUser = { email: 'novo@homecare.com' } as User;
    const mockResponse = [{ success: true }];

    service.createUser(mockUser).subscribe(res => {
      expect(res).toEqual(mockResponse);
    });

    const req = httpMock.expectOne(`${environment.apiHomecareUrl}/user/create-user`);
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual(mockUser);
    req.flush(mockResponse);
  });

  describe('Validadores Assíncronos', () => {
    
    // --- Testes do validador de Email ---
    it('deve retornar null no emailValidator se o controle estiver vazio', () => {
      const control = new FormControl('');
      service.emailUserExistsValidator('excluir-id')(control).subscribe(res => {
        expect(res).toBeNull();
      });
    });

    it('deve retornar { emailExists: true } quando a API confirmar que o email existe', () => {
      const control = new FormControl('existe@email.com');
      
      service.emailUserExistsValidator('10')(control).subscribe(res => {
        expect(res).toEqual({ emailExists: true });
      });

      const req = httpMock.expectOne(`${environment.apiHomecareUrl}/validator/email-user-exists/existe@email.com/10`);
      req.flush(true); // API retorna true (existe)
    });

    it('deve retornar null quando a API confirmar que o email NÃO existe', () => {
      const control = new FormControl('naoexiste@email.com');
      
      service.emailUserExistsValidator('10')(control).subscribe(res => {
        expect(res).toBeNull();
      });

      const req = httpMock.expectOne(`${environment.apiHomecareUrl}/validator/email-user-exists/naoexiste@email.com/10`);
      req.flush(false); // API retorna false
    });

    it('deve retornar null (catchError) se a API de email falhar', () => {
      const control = new FormControl('erro@email.com');
      
      service.emailUserExistsValidator('10')(control).subscribe(res => {
        expect(res).toBeNull();
      });

      const req = httpMock.expectOne(`${environment.apiHomecareUrl}/validator/email-user-exists/erro@email.com/10`);
      req.error(new ErrorEvent('Network error'));
    });

    // --- Testes do validador de CNS ---
    it('deve retornar null no cnsValidator se o controle estiver vazio', () => {
      const control = new FormControl('');
      service.cnsUserExistsValidator('excluir-id')(control).subscribe(res => {
        expect(res).toBeNull();
      });
    });

    it('deve retornar { cnsExists: true } quando a API confirmar que o CNS existe', () => {
      const control = new FormControl('123456789');
      
      service.cnsUserExistsValidator('20')(control).subscribe(res => {
        expect(res).toEqual({ cnsExists: true });
      });

      const req = httpMock.expectOne(`${environment.apiHomecareUrl}/validator/cns-user-exists/123456789/20`);
      req.flush(true);
    });

    it('deve retornar null quando a API confirmar que o CNS NÃO existe', () => {
      const control = new FormControl('987654321');
      
      service.cnsUserExistsValidator('20')(control).subscribe(res => {
        expect(res).toBeNull();
      });

      const req = httpMock.expectOne(`${environment.apiHomecareUrl}/validator/cns-user-exists/987654321/20`);
      req.flush(false);
    });

    it('deve retornar null (catchError) se a API de CNS falhar', () => {
      const control = new FormControl('000000000');
      
      service.cnsUserExistsValidator('20')(control).subscribe(res => {
        expect(res).toBeNull();
      });

      const req = httpMock.expectOne(`${environment.apiHomecareUrl}/validator/cns-user-exists/000000000/20`);
      req.error(new ErrorEvent('Network error'));
    });
  });
});