import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { MatSnackBar } from '@angular/material/snack-bar';
import { catchError, throwError } from 'rxjs';
import { AuthService } from '../services/auth.service';
import { SILENCIAR_ERRO_HTTP } from './http-context.tokens';

export const errorInterceptor: HttpInterceptorFn = (req, next) => {
  const snackBar = inject(MatSnackBar);
  const auth = inject(AuthService);

  return next(req).pipe(
    catchError((erro: HttpErrorResponse) => {
      if (erro.status === 401 && !req.url.includes('/auth/login')) {
        auth.logout();
      }
      if (req.context.get(SILENCIAR_ERRO_HTTP)) {
        return throwError(() => erro);
      }
      const mensagem =
        erro.error?.message || 'Erro inesperado. Tente novamente.';
      snackBar.open(mensagem, 'Fechar', { duration: 5000 });
      return throwError(() => erro);
    })
  );
};
