import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Usuario } from '../models';

@Injectable({ providedIn: 'root' })
export class UsuariosService {
  constructor(private readonly http: HttpClient) {}

  listar(): Observable<Usuario[]> {
    return this.http.get<Usuario[]>('/api/usuarios');
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
