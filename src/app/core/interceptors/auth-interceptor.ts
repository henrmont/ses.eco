import { HttpInterceptorFn, HttpErrorResponse } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { catchError, switchMap, throwError, BehaviorSubject, filter, take } from 'rxjs';
import { AuthService } from '../services/auth-service';

// Variáveis de controle fora da função para persistirem entre as requisições concorrentes
let isRefreshing = false;
const refreshTokenSubject = new BehaviorSubject<string | null>(null);

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const authService = inject(AuthService);
  const router = inject(Router);
  
  const accessToken = window.localStorage.getItem('token');
  
  // 1. Só anexa o cabeçalho se o token realmente existir
  let authReq = req;
  if (accessToken) {
    authReq = req.clone({
      setHeaders: { Authorization: `Bearer ${accessToken}` }
    });
  }

  return next(authReq).pipe(
    catchError((error: HttpErrorResponse) => {
      // Verifica se o erro é de autenticação e se temos um token para tentar renovar
      if ([401, 403].includes(error.status) && window.localStorage.getItem('token')) {
        
        // Cenario A: Se já existe um refresh em andamento, aguarda o novo token
        if (isRefreshing) {
          return refreshTokenSubject.pipe(
            filter(token => token !== null), // Bloqueia o fluxo até o token chegar
            take(1),                         // Pega apenas o primeiro valor válido emitido
            switchMap(token => {
              return next(req.clone({
                setHeaders: { Authorization: `Bearer ${token}` }
              }));
            })
          );
        }

        // Cenario B: É a primeira requisição a falhar, inicia o processo de Refresh
        isRefreshing = true;
        refreshTokenSubject.next(null); // Limpa o subject para novas requisições aguardarem

        return authService.refresh().pipe(
          switchMap((response: any) => {
            const newToken = response.access_token;
            
            isRefreshing = false;
            window.localStorage.setItem('token', newToken);
            refreshTokenSubject.next(newToken); // Avisa todas as outras requisições que aguardavam

            return next(req.clone({
              setHeaders: { Authorization: `Bearer ${newToken}` }
            }));
          }),
          catchError((refreshError) => {
            // Se o próprio refresh falhar, o token do Laravel é inválido de vez.
            isRefreshing = false;
            window.localStorage.removeItem('token'); // Limpa o lixo
            
            // Redireciona o usuário para o login
            router.navigate(['/login']); 
            
            return throwError(() => refreshError);
          })
        );
      }

      // Se for qualquer outro erro (500, 404, etc), apenas repassa para o componente tratar
      return throwError(() => error);
    })
  );
};
