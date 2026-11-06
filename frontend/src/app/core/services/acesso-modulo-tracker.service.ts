import { DestroyRef, Injectable, inject } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { NavigationEnd, Router } from '@angular/router';
import { filter } from 'rxjs';
import { AuditoriaService } from './auditoria.service';
import { AuthService } from './auth.service';

const MODULO_POR_SEGMENTO: Record<string, string> = {
  dashboard: 'dashboard',
  clientes: 'clientes',
  interacoes: 'interacoes',
  programacoes: 'programacoes',
  'monitora-rondonia': 'monitora-rondonia',
  carteirizacao: 'carteirizacao',
  cotacoes: 'cotacoes',
  usuarios: 'usuarios',
  permissoes: 'permissoes',
  configuracoes: 'configuracoes',
};

@Injectable({ providedIn: 'root' })
export class AcessoModuloTrackerService {
  private readonly router = inject(Router);
  private readonly auth = inject(AuthService);
  private readonly auditoria = inject(AuditoriaService);
  private readonly destroyRef = inject(DestroyRef);

  private iniciado = false;
  private ultimoModulo: string | null = null;

  iniciar(): void {
    if (this.iniciado) {
      return;
    }
    this.iniciado = true;

    this.router.events
      .pipe(
        filter((evento): evento is NavigationEnd => evento instanceof NavigationEnd),
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe((evento) => this.registrar(evento.urlAfterRedirects));
  }

  private registrar(url: string): void {
    if (!this.auth.estaLogado()) {
      this.ultimoModulo = null;
      return;
    }

    const caminho = url.split('?')[0].split('#')[0];
    const segmento = caminho.split('/').filter(Boolean)[0] ?? '';
    const modulo = MODULO_POR_SEGMENTO[segmento] ?? null;

    if (!modulo) {
      this.ultimoModulo = null;
      return;
    }

    if (modulo === this.ultimoModulo) {
      return;
    }

    this.ultimoModulo = modulo;
    this.auditoria.registrarAcesso(modulo, caminho);
  }
}
