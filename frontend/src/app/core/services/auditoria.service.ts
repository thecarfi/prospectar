import { HttpClient, HttpContext } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { SILENCIAR_ERRO_HTTP } from '../interceptors/http-context.tokens';

@Injectable({ providedIn: 'root' })
export class AuditoriaService {
  private readonly http = inject(HttpClient);

  registrarAcesso(modulo: string, rota: string): void {
    this.http
      .post<void>(
        '/api/registros-acoes/acesso',
        { modulo, rota },
        {
          context: new HttpContext().set(SILENCIAR_ERRO_HTTP, true),
        }
      )
      .subscribe({ error: () => {} });
  }
}
