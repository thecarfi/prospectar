import { Injectable, computed, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { Observable, tap } from 'rxjs';
import { LoginResponse, Usuario } from '../models';

const TOKEN_KEY = 'gc_token';
const USUARIO_KEY = 'gc_usuario';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly tokenSignal = signal<string | null>(
    localStorage.getItem(TOKEN_KEY)
  );
  private readonly usuarioSignal = signal<Usuario | null>(
    this.carregarUsuarioLocal()
  );

  readonly token = this.tokenSignal.asReadonly();
  readonly usuario = this.usuarioSignal.asReadonly();
  readonly estaLogado = computed(() => !!this.tokenSignal());

  constructor(
    private readonly http: HttpClient,
    private readonly router: Router
  ) {}

  login(email: string, senha: string): Observable<LoginResponse> {
    return this.http
      .post<LoginResponse>('/api/auth/login', { email, senha })
      .pipe(
        tap((resposta) => {
          localStorage.setItem(TOKEN_KEY, resposta.token);
          this.tokenSignal.set(resposta.token);
          this.usuarioSignal.set(resposta.usuario);
        })
      );
  }

  carregarUsuario(): Observable<{ usuario: Usuario }> {
    return this.http.get<{ usuario: Usuario }>('/api/auth/me').pipe(
      tap(({ usuario }) => {
        localStorage.setItem(USUARIO_KEY, JSON.stringify(usuario));
        this.usuarioSignal.set(usuario);
      })
    );
  }

  temPermissao(permissao: string): boolean {
    const usuario = this.usuarioSignal();
    if (!usuario) {
      return false;
    }
    if (usuario.papel === 'admin') {
      return true;
    }
    return !!usuario.permissoes?.includes(permissao);
  }

  logout(): void {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USUARIO_KEY);
    this.tokenSignal.set(null);
    this.usuarioSignal.set(null);
    this.router.navigate(['/login']);
  }

  private carregarUsuarioLocal(): Usuario | null {
    const raw = localStorage.getItem(USUARIO_KEY);
    if (!raw) {
      return null;
    }
    try {
      return JSON.parse(raw);
    } catch {
      return null;
    }
  }
}
