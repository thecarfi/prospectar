import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Cnae } from '../models';

export interface CnaeFiltros {
  busca?: string;
  subclasse?: string;
  descricao_subclasse?: string;
  secao?: string;
  descricao_secao?: string;
  divisao?: string;
}

@Injectable({ providedIn: 'root' })
export class CnaeService {
  constructor(private readonly http: HttpClient) {}

  listar(filtros?: CnaeFiltros): Observable<Cnae[]> {
    let params = new HttpParams();
    if (filtros?.busca) {
      params = params.set('busca', filtros.busca);
    }
    if (filtros?.subclasse) {
      params = params.set('subclasse', filtros.subclasse);
    }
    if (filtros?.descricao_subclasse) {
      params = params.set('descricao_subclasse', filtros.descricao_subclasse);
    }
    if (filtros?.secao) {
      params = params.set('secao', filtros.secao);
    }
    if (filtros?.descricao_secao) {
      params = params.set('descricao_secao', filtros.descricao_secao);
    }
    if (filtros?.divisao) {
      params = params.set('divisao', filtros.divisao);
    }
    return this.http.get<Cnae[]>('/api/cnae', { params });
  }
}
