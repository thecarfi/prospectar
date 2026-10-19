import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import {
  CotacaoCalculo,
  CotacaoEntrada,
  CotacaoFiltros,
  CotacaoHistoricoItem,
  CotacaoSalva,
  GeneralidadeCotacao,
  Paginacao,
  RotaCotacao,
} from '../models';

@Injectable({ providedIn: 'root' })
export class CotacaoService {
  constructor(private readonly http: HttpClient) {}

  listarRotas(): Observable<RotaCotacao[]> {
    return this.http.get<RotaCotacao[]>('/api/cotacoes/rotas');
  }

  criarRota(dados: Omit<RotaCotacao, 'id'>): Observable<RotaCotacao> {
    return this.http.post<RotaCotacao>('/api/cotacoes/rotas', dados);
  }

  atualizarRota(id: number, dados: Partial<Omit<RotaCotacao, 'id'>>): Observable<RotaCotacao> {
    return this.http.put<RotaCotacao>(`/api/cotacoes/rotas/${id}`, dados);
  }

  excluirRota(id: number): Observable<void> {
    return this.http.delete<void>(`/api/cotacoes/rotas/${id}`);
  }

  listarGeneralidades(): Observable<GeneralidadeCotacao[]> {
    return this.http.get<GeneralidadeCotacao[]>('/api/cotacoes/generalidades');
  }

  atualizarGeneralidade(id: number, valor: number): Observable<GeneralidadeCotacao> {
    return this.http.put<GeneralidadeCotacao>(`/api/cotacoes/generalidades/${id}`, {
      valor_generalidade: valor,
    });
  }

  calcular(entrada: CotacaoEntrada): Observable<CotacaoCalculo> {
    return this.http.post<CotacaoCalculo>('/api/cotacoes/calcular', entrada);
  }

  salvar(entrada: CotacaoEntrada): Observable<CotacaoSalva> {
    return this.http.post<CotacaoSalva>('/api/cotacoes', entrada);
  }

  listarHistorico(filtros: CotacaoFiltros = {}): Observable<Paginacao<CotacaoHistoricoItem>> {
    let params = new HttpParams();
    if (filtros.cliente) params = params.set('cliente', filtros.cliente);
    if (filtros.rota_id) params = params.set('rota_id', filtros.rota_id);
    params = params.set('pagina', filtros.pagina ?? 1);
    params = params.set('limite', filtros.limite ?? 10);
    return this.http.get<Paginacao<CotacaoHistoricoItem>>('/api/cotacoes', { params });
  }

  obter(id: number): Observable<CotacaoSalva> {
    return this.http.get<CotacaoSalva>(`/api/cotacoes/${id}`);
  }
}
