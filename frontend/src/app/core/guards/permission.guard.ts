import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';

export function permissionGuard(permissao: string): CanActivateFn {
  return () => {
    const auth = inject(AuthService);
    const router = inject(Router);

    if (auth.temPermissao(permissao)) {
      return true;
    }

    return router.createUrlTree(['/acesso-negado']);
  };
}

export function permissionAnyGuard(permissoes: string[]): CanActivateFn {
  return () => {
    const auth = inject(AuthService);
    const router = inject(Router);

    if (auth.temAlgumaPermissao(...permissoes)) {
      return true;
    }

    return router.createUrlTree(['/acesso-negado']);
  };
}
