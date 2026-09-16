import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import {
  ClienteCarteirizacao,
  CarteirizacaoFiltros,
  CarteirizacaoFiltrosMeta,
} from '../models';

export interface ClientesCarteirizacaoResponse {
  dados: ClienteCarteirizacao[];
  total: number;
  pagina: number;
  limite: number;
}

@Injectable({ providedIn: 'root' })
export class CarteirizacaoService {
  private readonly baseUrl = '/api/carteirizacao';

  constructor(private readonly http: HttpClient) {}

  obterFiltros(): Observable<CarteirizacaoFiltrosMeta> {
    return this.http.get<CarteirizacaoFiltrosMeta>(
      `${this.baseUrl}/filtros`
    );
  }

  listar(
    filtros: CarteirizacaoFiltros = {},
    pagina?: number,
    limite?: number
  ): Observable<ClientesCarteirizacaoResponse> {
    let params = new HttpParams();
    if (filtros.nome_pagador) {
      params = params.set('nome_pagador', filtros.nome_pagador);
    }
    if (filtros.cnpj_pagador) {
      params = params.set('cnpj_pagador', filtros.cnpj_pagador);
    }
    if (filtros.carteira_responsavel) {
      params = params.set('carteira_responsavel', filtros.carteira_responsavel);
    }
    if (pagina) {
      params = params.set('pagina', String(pagina));
    }
    if (limite) {
      params = params.set('limite', String(limite));
    }
    return this.http.get<ClientesCarteirizacaoResponse>(
      `${this.baseUrl}/clientes`,
      { params }
    );
  }

  atribuirCarteira(
    cnpj: string,
    nomeCarteira: string
  ): Observable<{ sucesso: boolean }> {
    return this.http.put<{ sucesso: boolean }>(
      `${this.baseUrl}/clientes/carteira`,
      { cnpj, nome_carteira: nomeCarteira }
    );
  }
}