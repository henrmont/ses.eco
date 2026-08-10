// src/app/core/guards/logged-guard.ts

import { inject } from '@angular/core';
import { CanActivateChildFn, Router } from '@angular/router';
import { map, take, catchError } from 'rxjs/operators';
import { of } from 'rxjs';
import { AuthService } from '../services/auth-service';

export const loggedGuard: CanActivateChildFn = (childRoute, state) => {
  const router = inject(Router);
  const token = window.localStorage.getItem('token');
  const authService = inject(AuthService);

  // Se NÃO tem token, ele está deslogado. Pode acessar a tela de login normalmente.
  if (!token) {
    return true;
  }

  // Se tem token, vamos checar se a sessão ainda é válida no backend
  return authService.me().pipe(
    take(1),
    map(response => {
      if (response.is_valid) {
        // Usuário já está logado e sessão está ativa -> manda direto para a interna
        router.navigate(['/principal']);
        return false;
      }
      
      // Se o token existia mas expirou ou é inválido, limpa e deixa ver o login
      window.localStorage.clear();
      return true;
    }),
    catchError(() => {
      // Em caso de erro na API (ex: token inválido derrubando a requisição)
      window.localStorage.clear();
      return of(true);
    })
  );
};