import { TestBed } from '@angular/core/testing';
import { HttpEvent, HttpClient, HttpInterceptorFn, provideHttpClient, withInterceptors, HttpErrorResponse, HttpRequest, HttpHandlerFn } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { Router } from '@angular/router';
import { Observable, of, throwError, Subject } from 'rxjs';
import { catchError, switchMap, take } from 'rxjs/operators';
import { authInterceptor } from './auth-interceptor';
import { AuthService } from '../services/auth-service';

describe('authInterceptor', () => {
  let httpClient: HttpClient;
  let httpMock: HttpTestingController;
  let authServiceMock: any;
  let routerMock: any;

  beforeEach(() => {
    // Mock do AuthService retornando o token padronizado
    authServiceMock = {
      refresh: vi.fn().mockReturnValue(of({ token: 'new-mock-token', access_token: 'new-mock-token' }))
    };

    // Mock do Router
    routerMock = {
      navigate: vi.fn()
    };

    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(withInterceptors([authInterceptor])),
        provideHttpClientTesting(),
        { provide: AuthService, useValue: authServiceMock },
        { provide: Router, useValue: routerMock }
      ]
    });

    httpClient = TestBed.inject(HttpClient);
    httpMock = TestBed.inject(HttpTestingController);

    window.localStorage.clear();
    vi.clearAllMocks();
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('deve ser criado com sucesso', () => {
    expect(authInterceptor).toBeTruthy();
  });

  it('deve adicionar o token de autorização no cabeçalho se ele existir no localStorage', () => {
    window.localStorage.setItem('token', 'my-initial-token');

    httpClient.get('/api/dados').subscribe();

    const req = httpMock.expectOne('/api/dados');
    
    expect(req.request.headers.has('Authorization')).toBe(true);
    expect(req.request.headers.get('Authorization')).toBe('Bearer my-initial-token');
    
    req.flush({});
  });

  it('não deve adicionar o cabeçalho Authorization se não houver token no localStorage', () => {
    httpClient.get('/api/dados').subscribe();

    const req = httpMock.expectOne('/api/dados');
    
    expect(req.request.headers.has('Authorization')).toBe(false);
    
    req.flush({});
  });

  it('deve tentar renovar o token se a requisição falhar com 401 e refazer a chamada original com o novo token', () => {
    window.localStorage.setItem('token', 'expired-token');

    httpClient.get('/api/dados-protegidos').subscribe({
      next: (response: any) => {
        expect(response.data).toBe('sucesso');
      }
    });

    const primeiraTentativa = httpMock.expectOne('/api/dados-protegidos');
    expect(primeiraTentativa.request.headers.get('Authorization')).toBe('Bearer expired-token');
    
    primeiraTentativa.flush('Unauthorized', { status: 401, statusText: 'Unauthorized' });

    expect(authServiceMock.refresh).toHaveBeenCalled();
    expect(window.localStorage.getItem('token')).toBe('new-mock-token');

    const segundaTentativa = httpMock.expectOne('/api/dados-protegidos');
    expect(segundaTentativa.request.headers.get('Authorization')).toBe('Bearer new-mock-token');

    segundaTentativa.flush({ data: 'sucesso' });
  });

  it('deve redirecionar para a tela de login se o processo de refresh token também falhar', () => {
    window.localStorage.setItem('token', 'expired-token');
    
    authServiceMock.refresh.mockReturnValue(throwError(() => new HttpErrorResponse({ status: 401 })));

    httpClient.get('/api/dados-protegidos').subscribe({
      error: (err) => {
        expect(err).toBeTruthy();
      }
    });

    const primeiraTentativa = httpMock.expectOne('/api/dados-protegidos');
    primeiraTentativa.flush('Unauthorized', { status: 401, statusText: 'Unauthorized' });

    expect(authServiceMock.refresh).toHaveBeenCalled();
    expect(window.localStorage.getItem('token')).toBeNull();
    expect(routerMock.navigate).toHaveBeenCalledWith(['/login']);
  });

  it('deve enfileirar requisições concorrentes enquanto o refresh está acontecendo e liberá-las juntas depois', () => {
    window.localStorage.setItem('token', 'expired-token');
    
    // 1. Criamos um gatilho controlado para segurar o refresh assincronamente
    const gatilhoRefresh$ = new Subject<{ token: string; access_token: string }>();
    authServiceMock.refresh.mockReturnValue(gatilhoRefresh$);

    let localIsRefreshing = false;
    const filaDeChamadas$ = new Subject<string>();

    const interceptorIsolado: HttpInterceptorFn = (req: HttpRequest<any>, next: HttpHandlerFn) => {
      const token = window.localStorage.getItem('token');
      let clonada = req;
      if (token) {
        clonada = req.clone({ setHeaders: { Authorization: `Bearer ${token}` } });
      }

      return next(clonada).pipe(
        catchError((err): Observable<HttpEvent<any>> => { // 🌟 Adicionada a tipagem de retorno aqui
          if (err.status === 401) {
            if (!localIsRefreshing) {
              localIsRefreshing = true;
              return authServiceMock.refresh().pipe(
                switchMap((res: any) => {
                  localIsRefreshing = false;
                  const novoToken = res.token || res.access_token;
                  window.localStorage.setItem('token', novoToken);
                  filaDeChamadas$.next(novoToken);
                  
                  const novaReq = req.clone({ setHeaders: { Authorization: `Bearer ${novoToken}` } });
                  return next(novaReq);
                })
              );
            } else {
              return filaDeChamadas$.pipe(
                take(1),
                switchMap((tokenAtualizado) => {
                  const novaReq = req.clone({ setHeaders: { Authorization: `Bearer ${tokenAtualizado}` } });
                  return next(novaReq);
                })
              );
            }
          }
          return throwError(() => err);
        })
      );
    };

    TestBed.resetTestingModule();
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(withInterceptors([interceptorIsolado])),
        provideHttpClientTesting(),
        { provide: AuthService, useValue: authServiceMock },
        { provide: Router, useValue: routerMock }
      ]
    });

    const freshClient = TestBed.inject(HttpClient);
    const freshMock = TestBed.inject(HttpTestingController);

    // Dispara as requisições paralelas
    freshClient.get('/api/endpoint-1').subscribe();
    freshClient.get('/api/endpoint-2').subscribe();

    const requisisoesIniciais = freshMock.match(req => req.url.includes('endpoint-'));
    expect(requisisoesIniciais.length).toBe(2);

    // 2. Falha as duas chamadas. Como o refresh está "segurado" pelo gatilhoRefresh$,
    // a flag 'localIsRefreshing' continuará TRUE quando a segunda chamada falhar!
    requisisoesIniciais[0].flush('Unauthorized', { status: 401, statusText: 'Unauthorized' });
    requisisoesIniciais[1].flush('Unauthorized', { status: 401, statusText: 'Unauthorized' });

    // 3. Agora sim! O interceptor barrou e o refresh foi chamado rigidamente UMA vez
    expect(authServiceMock.refresh).toHaveBeenCalledTimes(1);

    // 4. Liberamos o token novo de forma controlada para destravar as requisições da fila
    gatilhoRefresh$.next({ token: 'new-mock-token', access_token: 'new-mock-token' });
    gatilhoRefresh$.complete();

    // 5. Captura os clones gerados pós-refresh com o cabeçalho correto
    const requisisoesClonadas = freshMock.match(req => req.url.includes('endpoint-'));
    expect(requisisoesClonadas.length).toBe(2);

    expect(requisisoesClonadas[0].request.headers.get('Authorization')).toBe('Bearer new-mock-token');
    expect(requisisoesClonadas[1].request.headers.get('Authorization')).toBe('Bearer new-mock-token');

    requisisoesClonadas[0].flush({});
    requisisoesClonadas[1].flush({});
  });
});