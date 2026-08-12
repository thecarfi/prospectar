import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { StatusCliente } from '../models';

@Injectable({ providedIn: 'root' })
export class StatusClientesService {
  constructor(private readonly http: HttpClient) {}

  listar(busca?: string): Observable<StatusCliente[]> {
    let params = new HttpParams();
    if (busca) {
      params = params.set('busca', busca);
    }
    return this.http.get<StatusCliente[]>('/api/status-clientes', { params });
  }

  criar(status: Partial<StatusCliente>): Observable<StatusCliente> {
    return this.http.post<StatusCliente>('/api/status-clientes', status);
  }

  atualizar(id: number, status: Partial<StatusCliente>): Observable<StatusCliente> {
    return this.http.put<StatusCliente>(`/api/status-clientes/${id}`, status);
  }

  excluir(id: number): Observable<void> {
    return this.http.delete<void>(`/api/status-clientes/${id}`);
  }
}
