import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Papel, Permissao } from '../models';

@Injectable({ providedIn: 'root' })
export class PapeisService {
  constructor(private readonly http: HttpClient) {}

  listar(): Observable<Papel[]> {
    return this.http.get<Papel[]>('/api/papeis');
  }

  listarPermissoes(): Observable<Permissao[]> {
    return this.http.get<Permissao[]>('/api/papeis/permissoes');
  }

  criar(dados: { nome: string; descricao?: string; permissao_ids: number[] }): Observable<Papel> {
    return this.http.post<Papel>('/api/papeis', dados);
  }

  atualizar(
    nome: string,
    dados: { descricao?: string; permissao_ids: number[] }
  ): Observable<Papel> {
    return this.http.put<Papel>(`/api/papeis/${encodeURIComponent(nome)}`, dados);
  }

  excluir(nome: string): Observable<void> {
    return this.http.delete<void>(`/api/papeis/${encodeURIComponent(nome)}`);
  }
}
