import { inject, isDevMode } from '@angular/core';
import { CanActivateFn, Router, ActivatedRouteSnapshot, UrlTree } from '@angular/router';
import { MessageService } from '../../core/services/message-service';

interface Permission {
  name: string;
}

interface Role {
  permissions?: Permission[];
}

interface ProfessionalType {
  type: string;
}

interface UserProfessional {
  types?: (string | ProfessionalType)[];
}

interface AuthUser {
  professional?: UserProfessional;
  roles?: Role[];
}

export const professionalGuard: CanActivateFn = (
  route: ActivatedRouteSnapshot
): boolean | UrlTree => {
  const router = inject(Router);
  const messageService = inject(MessageService);

  // 1. Extrai regras esperadas da rota
  const requiredTypes = (route.data['types'] as string[]) || [];
  const requiredPermissions = (
    route.data['permissions'] || 
    (route.data['permission'] ? [route.data['permission']] : [])
  ) as string[];

  // 2. Localiza o usuário e o módulo pai navegando na árvore de rotas (Root -> Child)
  let user: AuthUser | null = null;
  let modulePrefix: string | null = null;
  let curr: ActivatedRouteSnapshot | null = route;

  while (curr) {
    if (!user && curr.data && curr.data['user']) {
      user = curr.data['user'] as AuthUser;
    }
    // Permite definir um prefixo explícito no 'data' da rota principal do módulo
    if (!modulePrefix && curr.data && curr.data['module']) {
      modulePrefix = curr.data['module'] as string;
    }
    curr = curr.parent;
  }

  // Falha 1: Usuário não autenticado ou sem dados na rota
  if (!user) {
    if (isDevMode()) {
      console.error('[ProfessionalGuard] Usuário não encontrado no data da rota.');
    }
    messageService.showMessage('Sessão inválida ou dados do usuário não encontrados.');
    return router.parseUrl('/login');
  }

  // ==========================================
  // Validação 1: Tipos Profissionais (Types)
  // ==========================================
  const userTypes: string[] = (user.professional?.types || [])
    .map((item) => (typeof item === 'string' ? item : item?.type))
    .filter((type): type is string => Boolean(type))
    .map((type) => type.trim().toLowerCase());

  const hasValidType =
    requiredTypes.length === 0 ||
    requiredTypes.some((required) => userTypes.includes(required.trim().toLowerCase()));

  if (!hasValidType) {
    if (isDevMode()) {
      console.warn('[ProfessionalGuard] Perfil negado. Tipos do usuário:', userTypes, 'Exigidos:', requiredTypes);
    }
    messageService.showMessage('Seu perfil profissional não possui acesso a este recurso.');
    return false;
  }

  // ==========================================
  // Validação 2: Permissões de Acesso (Permissions)
  // ==========================================
  if (requiredPermissions.length > 0) {
    const roles = user.roles || [];

    const userPermissions = new Set<string>(
      roles
        .flatMap((role) => role.permissions || [])
        .map((p) => p.name?.trim().toLowerCase())
        .filter(Boolean)
    );

    // Módulo detectado automaticamente ou via data: { module: 'nomedomodulo' }
    const detectedModule = (modulePrefix || route.parent?.routeConfig?.path || '').trim().toLowerCase();

    const hasValidPermission = requiredPermissions.some((requiredPerm) => {
      const target = requiredPerm.trim().toLowerCase();
      
      return (
        userPermissions.has(target) ||
        (detectedModule && userPermissions.has(`${detectedModule}/${target}`))
      );
    });

    if (!hasValidPermission) {
      if (isDevMode()) {
        console.warn(
          '[ProfessionalGuard] Permissão negada. Permissões do usuário:',
          Array.from(userPermissions),
          'Exigidas:',
          requiredPermissions
        );
      }
      messageService.showMessage('Você não possui a permissão necessária para acessar esta página.');
      return false;
    }
  }

  return true;
};