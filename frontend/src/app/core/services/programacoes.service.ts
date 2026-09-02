import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import {
  ConcluirProgramacaoResultado,
  Paginacao,
  Programacao,
  ProgramacaoFiltros,
} from '../models';

@Injectable({ providedIn: 'root' })
export class ProgramacoesService {
  constructor(private readonly http: HttpClient) {}

  listar(filtros: ProgramacaoFiltros = {}): Observable<Paginacao<Programacao>> {
    let params = new HttpParams();
    if (filtros.titulo) {
      params = params.set('titulo', filtros.titulo);
    }
    if (filtros.status) {
      params = params.set('status', filtros.status);
    }
    if (filtros.data_inicio) {
      params = params.set('data_inicio', filtros.data_inicio);
    }
    if (filtros.data_fim) {
      params = params.set('data_fim', filtros.data_fim);
    }
    params = params.set('pagina', filtros.pagina ?? 1);
    params = params.set('limite', filtros.limite ?? 10);
    return this.http.get<Paginacao<Programacao>>('/api/programacoes', { params });
  }

  obter(id: number): Observable<Programacao> {
    return this.http.get<Programacao>(`/api/programacoes/${id}`);
  }

  criar(dados: Partial<Programacao> & { cliente_ids?: number[] }): Observable<Programacao> {
    return this.http.post<Programacao>('/api/programacoes', dados);
  }

  atualizar(id: number, dados: Partial<Programacao>): Observable<Programacao> {
    return this.http.put<Programacao>(`/api/programacoes/${id}`, dados);
  }

  excluir(id: number): Observable<void> {
    return this.http.delete<void>(`/api/programacoes/${id}`);
  }

  alterarStatus(id: number, status: string): Observable<Programacao> {
    return this.http.patch<Programacao>(`/api/programacoes/${id}/status`, { status });
  }

  concluir(id: number): Observable<ConcluirProgramacaoResultado> {
    return this.http.post<ConcluirProgramacaoResultado>(`/api/programacoes/${id}/concluir`, {});
  }

  adicionarCliente(programacaoId: number, clienteId: number): Observable<{ ok: boolean; cliente_nome: string }> {
    return this.http.post<{ ok: boolean; cliente_nome: string }>(
      `/api/programacoes/${programacaoId}/clientes`,
      { cliente_id: clienteId }
    );
  }

  removerCliente(programacaoId: number, clienteId: number): Observable<void> {
    return this.http.delete<void>(
      `/api/programacoes/${programacaoId}/clientes/${clienteId}`
    );
  }
}
