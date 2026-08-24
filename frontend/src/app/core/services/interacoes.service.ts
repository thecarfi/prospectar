import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import {
  Interacao,
  InteracaoFiltros,
  InteracoesFiltrosMeta,
  Paginacao,
} from '../models';

@Injectable({ providedIn: 'root' })
export class InteracoesService {
  constructor(private readonly http: HttpClient) {}

  listar(clienteId: number): Observable<Interacao[]> {
    return this.http.get<Interacao[]>(
      `/api/clientes/${clienteId}/interacoes`
    );
  }

  criar(clienteId: number, interacao: Partial<Interacao>): Observable<Interacao> {
    return this.http.post<Interacao>(
      `/api/clientes/${clienteId}/interacoes`,
      interacao
    );
  }

  atualizar(
    clienteId: number,
    id: number,
    interacao: Partial<Interacao>
  ): Observable<Interacao> {
    return this.http.put<Interacao>(
      `/api/clientes/${clienteId}/interacoes/${id}`,
      interacao
    );
  }

  excluir(clienteId: number, id: number): Observable<void> {
    return this.http.delete<void>(
      `/api/clientes/${clienteId}/interacoes/${id}`
    );
  }

  listarGlobal(filtros: InteracaoFiltros = {}): Observable<Paginacao<Interacao>> {
    let params = new HttpParams();
    if (filtros.cliente_nome) {
      params = params.set('cliente_nome', filtros.cliente_nome);
    }
    if (filtros.criado_por) {
      params = params.set('criado_por', filtros.criado_por);
    }
    if (filtros.tipo) {
      params = params.set('tipo', filtros.tipo);
    }
    if (filtros.data_inicio) {
      params = params.set('data_inicio', filtros.data_inicio);
    }
    if (filtros.data_fim) {
      params = params.set('data_fim', filtros.data_fim);
    }
    params = params.set('pagina', filtros.pagina ?? 1);
    params = params.set('limite', filtros.limite ?? 10);
    return this.http.get<Paginacao<Interacao>>('/api/interacoes', { params });
  }

  obterFiltros(): Observable<InteracoesFiltrosMeta> {
    return this.http.get<InteracoesFiltrosMeta>('/api/interacoes/filtros');
  }

  criarGlobal(
    interacao: Partial<Interacao> & { cliente_id: number }
  ): Observable<Interacao> {
    return this.http.post<Interacao>('/api/interacoes', interacao);
  }

  atualizarGlobal(id: number, interacao: Partial<Interacao>): Observable<Interacao> {
    return this.http.put<Interacao>(`/api/interacoes/${id}`, interacao);
  }

  excluirGlobal(id: number): Observable<void> {
    return this.http.delete<void>(`/api/interacoes/${id}`);
  }
}
