import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Cliente, ClienteDetalhe, ClienteFiltros, Paginacao } from '../models';

@Injectable({ providedIn: 'root' })
export class ClientesService {
  constructor(private readonly http: HttpClient) {}

  listar(filtros: ClienteFiltros = {}): Observable<Paginacao<Cliente>> {
    let params = new HttpParams();
    if (filtros.busca) params = params.set('busca', filtros.busca);
    if (filtros.cidade) params = params.set('cidade', filtros.cidade);
    if (filtros.estado) params = params.set('estado', filtros.estado);
    if (filtros.segmento) params = params.set('segmento', filtros.segmento);
    if (filtros.status) params = params.set('status', filtros.status);
    if (filtros.ordenar_por) params = params.set('ordenar_por', filtros.ordenar_por);
    if (filtros.direcao) params = params.set('direcao', filtros.direcao);
    params = params.set('pagina', filtros.pagina ?? 1);
    params = params.set('limite', filtros.limite ?? 10);
    return this.http.get<Paginacao<Cliente>>('/api/clientes', { params });
  }

  estatisticas(): Observable<{
    total: number;
    ativos: number;
    inativos: number;
    prospects: number;
  }> {
    return this.http.get<{
      total: number;
      ativos: number;
      inativos: number;
      prospects: number;
    }>('/api/clientes/estatisticas');
  }

  detalhar(id: number): Observable<ClienteDetalhe> {
    return this.http.get<ClienteDetalhe>(`/api/clientes/${id}`);
  }

  criar(cliente: Partial<Cliente>): Observable<Cliente> {
    return this.http.post<Cliente>('/api/clientes', cliente);
  }

  atualizar(id: number, cliente: Partial<Cliente>): Observable<Cliente> {
    return this.http.put<Cliente>(`/api/clientes/${id}`, cliente);
  }

  excluir(id: number): Observable<void> {
    return this.http.delete<void>(`/api/clientes/${id}`);
  }
}
