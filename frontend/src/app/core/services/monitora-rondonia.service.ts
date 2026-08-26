import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import {
  DocumentoEmitido,
  MonitoraRondoniaFiltros,
  MonitoraRondoniaFiltrosMeta,
  SalvarDataEntregaPayload,
} from '../models';

export interface DocumentosResponse {
  dados: DocumentoEmitido[];
  total: number;
  pagina: number;
  limite: number;
}

@Injectable({ providedIn: 'root' })
export class MonitoraRondoniaService {
  private readonly baseUrl = '/api/monitora-rondonia';

  constructor(private readonly http: HttpClient) {}

  obterFiltros(): Observable<MonitoraRondoniaFiltrosMeta> {
    return this.http.get<MonitoraRondoniaFiltrosMeta>(
      `${this.baseUrl}/filtros`
    );
  }

  listar(
    filtros: MonitoraRondoniaFiltros = {},
    pagina?: number,
    limite?: number
  ): Observable<DocumentosResponse> {
    let params = new HttpParams();
    if (filtros.filial_destino) {
      params = params.set('filial_destino', filtros.filial_destino);
    }
    if (filtros.cidade_destinatario) {
      params = params.set('cidade_destinatario', filtros.cidade_destinatario);
    }
    if (filtros.documento) {
      params = params.set('documento', filtros.documento);
    }
    if (filtros.data_manifesto) {
      params = params.set('data_manifesto', filtros.data_manifesto);
    }
    if (filtros.eh_vaptlog) {
      params = params.set('eh_vaptlog', filtros.eh_vaptlog);
    }
    if (pagina) {
      params = params.set('pagina', String(pagina));
    }
    if (limite) {
      params = params.set('limite', String(limite));
    }
    return this.http.get<DocumentosResponse>(`${this.baseUrl}/documentos`, {
      params,
    });
  }

  salvarDataEntrega(
    documento: string,
    payload: SalvarDataEntregaPayload
  ): Observable<{ sucesso: boolean }> {
    return this.http.put<{ sucesso: boolean }>(
      `${this.baseUrl}/documentos/${encodeURIComponent(documento)}/data-entrega`,
      payload
    );
  }

  toggleVaptlog(
    documento: string,
    acao: 'adicionar' | 'remover'
  ): Observable<{ sucesso: boolean }> {
    return this.http.put<{ sucesso: boolean }>(
      `${this.baseUrl}/documentos/${encodeURIComponent(documento)}/vaptlog`,
      { acao }
    );
  }
}
