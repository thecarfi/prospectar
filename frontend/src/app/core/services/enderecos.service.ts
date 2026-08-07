import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Endereco } from '../models';

@Injectable({ providedIn: 'root' })
export class EnderecosService {
  constructor(private readonly http: HttpClient) {}

  listar(clienteId: number): Observable<Endereco[]> {
    return this.http.get<Endereco[]>(`/api/clientes/${clienteId}/enderecos`);
  }

  criar(clienteId: number, endereco: Partial<Endereco>): Observable<Endereco> {
    return this.http.post<Endereco>(
      `/api/clientes/${clienteId}/enderecos`,
      endereco
    );
  }

  atualizar(
    clienteId: number,
    id: number,
    endereco: Partial<Endereco>
  ): Observable<Endereco> {
    return this.http.put<Endereco>(
      `/api/clientes/${clienteId}/enderecos/${id}`,
      endereco
    );
  }

  excluir(clienteId: number, id: number): Observable<void> {
    return this.http.delete<void>(`/api/clientes/${clienteId}/enderecos/${id}`);
  }
}
