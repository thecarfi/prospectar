import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Interacao } from '../models';

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
}
