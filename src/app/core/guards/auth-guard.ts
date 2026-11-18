// src/app/core/guards/auth-guard.ts

import { inject } from '@angular/core';
import { CanActivateChildFn, Router } from '@angular/router';
import { Observable } from 'rxjs';
import { take } from 'rxjs/operators';
import { AuthService } from '../services/auth-service';
import { ProfileService } from '../services/profile-service';
import { AvaliableModules } from '../enums/avaliable-modules';
import { MessageService } from '../services/message-service';

export class authGuard {
  /**
   * FUNÇÃO 1: Valida o token geral e se o usuário tem acesso à Macrorregião do sistema (/principal)
   * Realiza a autocorreção se o usuário transitar entre sistemas com o módulo trocado.
   */
  static checkModule(allowedModules: AvaliableModules[]): CanActivateChildFn {
    return (childRoute, state) => {
      const router = inject(Router);
      const messageService = inject(MessageService);
      const profileService = inject(ProfileService);
      const authService = inject(AuthService);
      const token = window.localStorage.getItem('token');

      if (!token) {
        router.navigate(['/']);
        return false;
      }

      return new Observable<boolean>((observer) => {
        authService
          .me()
          .pipe(take(1))
          .subscribe({
            next: (response) => {
              if (!response.is_valid) {
                observer.next(false);
                observer.complete();
                window.localStorage.clear();
                router.navigate(['/']);
                return;
              }

              // Checa se o módulo que está ATIVO no usuário pertence a este sistema atual
              const isCurrentModuleValid =
                response.module &&
                allowedModules.includes(response.module.name as AvaliableModules);

              if (isCurrentModuleValid) {
                observer.next(true);
                observer.complete();
              } else {
                // Procura o primeiro módulo nos valid_modules dele que este sistema aceita
                const compatibleModule = response.valid_modules?.find((mod: any) =>
                  allowedModules.includes(mod.name as AvaliableModules)
                );

                if (compatibleModule) {
                  profileService
                    .changeProfileModule(compatibleModule.id)
                    .pipe(take(1))
                    .subscribe({
                      next: () => {
                        observer.next(true);
                        observer.complete();
                      },
                      error: () => {
                        messageService.showMessage('Erro ao inicializar o módulo do sistema.');
                        observer.next(false);
                        observer.complete();
                        router.navigate(['/']);
                      },
                    });
                } else {
                  messageService.showMessage('Você não possui acesso a este sistema.');
                  observer.next(false);
                  observer.complete();
                  window.localStorage.clear();
                  router.navigate(['/']);
                }
              }
            },
            error: () => {
              observer.next(false);
              observer.complete();
              window.localStorage.clear();
              router.navigate(['/']);
            },
          });
      });
    };
  }

  /**
   * FUNÇÃO 2: Valida o acesso ao módulo e a permissões específicas da rota filha.
   * Suporta permissões sem prefixo ('usuário listar') e prefixadas ('tfd/usuário listar').
   */
  static checkAccess(): CanActivateChildFn {
    return (childRoute, state) => {
      const router = inject(Router);
      const messageService = inject(MessageService);
      const user$ = inject(AuthService).me();
      const cleanUrl = state.url.split('?')[0];
      const fragments = cleanUrl.split('/');

      // Captura permissão singular ('permission') ou plural ('permissions')
      const rawPermissions =
        childRoute.data?.['permissions'] ??
        (childRoute.data?.['permission'] ? [childRoute.data['permission']] : []);

      const requiredPermissions: string[] = (
        Array.isArray(rawPermissions) ? rawPermissions : [rawPermissions]
      )
        .filter((p): p is string => typeof p === 'string')
        .map((p) => p.trim().toLowerCase())
        .filter(Boolean);

      return new Observable<boolean>((observer) => {
        user$.pipe(take(1)).subscribe({
          next: (response) => {
            // 1. Validação de Módulo
            const activeModuleName = response.module?.name?.trim().toLowerCase();
            const hasModuleAccess = Boolean(
              activeModuleName &&
                fragments.some((frag) => frag.toLowerCase() === activeModuleName)
            );

            if (!hasModuleAccess) {
              observer.next(false);
              observer.complete();
              router.navigate(['/principal']);
              return;
            }

            // 2. Validação de Permissão Específica (com prefixo automático do módulo)
            if (requiredPermissions.length > 0) {
              const modulePrefix = (
                (childRoute.parent?.data?.['module'] as string | undefined) ||
                activeModuleName ||
                ''
              )
                .trim()
                .toLowerCase();

              const userPermissions = new Set<string>(
                response.roles?.flatMap(
                  (role: { permissions?: { name: string }[] }) =>
                    role.permissions
                      ?.map((perm) => perm.name?.trim().toLowerCase())
                      .filter((name): name is string => Boolean(name)) || []
                ) || []
              );

              const hasPermission = requiredPermissions.some((reqPerm) => {
                if (userPermissions.has(reqPerm)) return true;
                return Boolean(modulePrefix && userPermissions.has(`${modulePrefix}/${reqPerm}`));
              });

              if (!hasPermission) {
                messageService.showMessage('Você não tem permissão para acessar esta funcionalidade.');
                observer.next(false);
                observer.complete();

                // Redireciona para a tela inicial do próprio módulo (ex: /principal/tfd)
                const moduleBaseUrl = fragments.slice(0, 3).join('/');
                router.navigate([moduleBaseUrl]);
                return;
              }
            }

            observer.next(true);
            observer.complete();
          },
          error: () => {
            observer.next(false);
            observer.complete();
            router.navigate(['/principal']);
          },
        });
      });
    };
  }
}