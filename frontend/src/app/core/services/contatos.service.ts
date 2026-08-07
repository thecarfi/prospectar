import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Contato } from '../models';

@Injectable({ providedIn: 'root' })
export class ContatosService {
  constructor(private readonly http: HttpClient) {}

  listar(clienteId: number): Observable<Contato[]> {
    return this.http.get<Contato[]>(`/api/clientes/${clienteId}/contatos`);
  }

  criar(clienteId: number, contato: Partial<Contato>): Observable<Contato> {
    return this.http.post<Contato>(
      `/api/clientes/${clienteId}/contatos`,
      contato
    );
  }

  atualizar(
    clienteId: number,
    id: number,
    contato: Partial<Contato>
  ): Observable<Contato> {
    return this.http.put<Contato>(
      `/api/clientes/${clienteId}/contatos/${id}`,
      contato
    );
  }

  excluir(clienteId: number, id: number): Observable<void> {
    return this.http.delete<void>(
      `/api/clientes/${clienteId}/contatos/${id}`
    );
  }
}
