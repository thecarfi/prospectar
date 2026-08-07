import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { catchError, map, of } from 'rxjs';
import { AuthService } from '../services/auth.service';

export const authGuard: CanActivateFn = () => {
  const auth = inject(AuthService);
  const router = inject(Router);

  if (!auth.estaLogado()) {
    return router.createUrlTree(['/login']);
  }

  return auth.carregarUsuario().pipe(
    map(() => true),
    catchError(() => of(router.createUrlTree(['/login'])))
  );
};
