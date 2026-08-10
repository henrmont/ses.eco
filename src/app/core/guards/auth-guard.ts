// src/app/core/guards/auth-guard.ts

import { inject } from '@angular/core';
import { CanActivateChildFn, Router } from '@angular/router';
import { Observable } from 'rxjs';
import { take } from 'rxjs/operators';
import { AuthService } from '../services/auth-service'; // Ajuste o caminho se necessário
import { ProfileService } from '../services/profile-service'; // ADICIONADO: Importe o seu ProfileService
import { AvaliableModules } from '../enums/avaliable-modules'; // Ajuste o caminho se necessário
import { MessageService } from '../services/message-service'; // Ajuste o caminho se necessário

export class authGuard {

  /**
   * FUNÇÃO 1: Valida o token geral e se o usuário tem acesso à Macrorregião do sistema (/principal)
   * Realiza a autocorreção se o usuário transitar entre sistemas com o módulo trocado.
   */
  static checkModule(allowedModules: AvaliableModules[]): CanActivateChildFn {
    return (childRoute, state) => {
      const router = inject(Router);
      const messageService = inject(MessageService);
      const profileService = inject(ProfileService); // ADICIONADO: Injeção do serviço
      const token = window.localStorage.getItem('token');
      const authService = inject(AuthService);

      if (!token) {
        router.navigate(['/']);
        return false;
      }

      return new Observable<boolean>(observer => {
        authService.me().pipe(take(1)).subscribe({
          next: (response) => {
            if (!response.is_valid) {
              observer.next(false);
              observer.complete();
              window.localStorage.clear();
              router.navigate(['/']);
              return;
            }

            // Checa se o módulo que está ATIVO no usuário pertence a este sistema atual
            const isCurrentModuleValid = response.module && allowedModules.includes(response.module.name as AvaliableModules);

            if (isCurrentModuleValid) {
              // Caso 1: Módulo atual está certinho. Acesso liberado!
              observer.next(true);
              observer.complete();
            } else {
              // Caso 2: Módulo "sujo" vindo de outro sistema.
              // Procura o primeiro módulo nos valid_modules dele que este sistema aceita
              const compatibleModule = response.valid_modules?.find((mod: any) => 
                allowedModules.includes(mod.name as AvaliableModules)
              );

              if (compatibleModule) {
                // Altera o módulo ativo no backend de forma transparente
                profileService.changeProfileModule(compatibleModule.id).pipe(take(1)).subscribe({
                  next: () => {
                    // Módulo alterado com sucesso!
                    observer.next(true);
                    observer.complete();
                  },
                  error: () => {
                    // Falha ao tentar trocar o módulo
                    messageService.showMessage('Erro ao inicializar o módulo do sistema.');
                    observer.next(false);
                    observer.complete();
                    router.navigate(['/']);
                  }
                });
              } else {
                // Usuário não possui sequer um módulo ativo cadastrado para este sistema específico
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
          }
        });
      });
    };
  }

  /**
   * FUNÇÃO 2: Valida o acesso ao módulo e a permissões específicas da rota filha.
   * Analisa a estrutura de roles -> permissions -> name do usuário.
   */
  static checkAccess(): CanActivateChildFn {
    return (childRoute, state) => {
      const router = inject(Router);
      const messageService = inject(MessageService);
      const user$ = inject(AuthService).me();
      const fragments = state.url.split('/');

      // Captura a permissão exigida configurada na rota filha (se houver)
      const requiredPermission = childRoute.data?.['permission'] as string | undefined;

      return new Observable<boolean>(observer => {
        user$.pipe(take(1)).subscribe({
          next: (response) => {
            // 1. Validação de Módulo
            const hasModuleAccess = response.module && fragments.includes(response.module.name);

            if (!hasModuleAccess) {
              observer.next(false);
              observer.complete();
              router.navigate(['/principal']);
              return;
            }

            // 2. Validação de Permissão Específica extraindo apenas o 'name'
            if (requiredPermission) {
              
              // Entra em cada role, percorre o array de permissões e extrai APENAS o 'name' de cada objeto
              const userPermissions: string[] = response.roles?.flatMap(
                (role: { permissions?: { name: string }[] }) => 
                  role.permissions?.map(perm => perm.name) || []
              ) || [];

              // Agora sim: comparando String com String!
              const hasPermission = userPermissions.includes(requiredPermission);

              if (!hasPermission) {
                messageService.showMessage('Você não tem permissão para acessar esta funcionalidade.');
                observer.next(false);
                observer.complete();
                
                // Redireciona o usuário para a tela inicial do próprio módulo (ex: /principal/tfd)
                const moduleBaseUrl = fragments.slice(0, 3).join('/'); 
                router.navigate([moduleBaseUrl]);
                return;
              }
            }

            // Se passou em tudo, libera o acesso!
            observer.next(true);
            observer.complete();
          },
          error: () => {
            observer.next(false);
            observer.complete();
            router.navigate(['/principal']);
          }
        });
      });
    };
  }
}