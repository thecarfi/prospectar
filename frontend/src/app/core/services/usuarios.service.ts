import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Usuario, UsuarioFiltros } from '../models';

@Injectable({ providedIn: 'root' })
export class UsuariosService {
  constructor(private readonly http: HttpClient) {}

  listar(filtros: UsuarioFiltros = {}): Observable<Usuario[]> {
    let params = new HttpParams();
    if (filtros.nome) params = params.set('nome', filtros.nome);
    if (filtros.email) params = params.set('email', filtros.email);
    if (filtros.papel) params = params.set('papel', filtros.papel);
    if (filtros.ativo !== undefined) {
      params = params.set('ativo', String(filtros.ativo));
    }
    return this.http.get<Usuario[]>('/api/usuarios', { params });
  }

  criar(usuario: Partial<Usuario> & { senha: string }): Observable<Usuario> {
    return this.http.post<Usuario>('/api/usuarios', usuario);
  }

  atualizar(
    id: number,
    usuario: Partial<Usuario> & { senha?: string }
  ): Observable<Usuario> {
    return this.http.put<Usuario>(`/api/usuarios/${id}`, usuario);
  }

  excluir(id: number): Observable<void> {
    return this.http.delete<void>(`/api/usuarios/${id}`);
  }
}
