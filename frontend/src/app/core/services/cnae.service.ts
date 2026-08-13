import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Cnae } from '../models';

export interface CnaeFiltros {
  busca?: string;
  secao?: string;
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
    if (filtros?.secao) {
      params = params.set('secao', filtros.secao);
    }
    if (filtros?.divisao) {
      params = params.set('divisao', filtros.divisao);
    }
    return this.http.get<Cnae[]>('/api/cnae', { params });
  }
}
