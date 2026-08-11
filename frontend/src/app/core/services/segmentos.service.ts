import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Segmento } from '../models';

@Injectable({ providedIn: 'root' })
export class SegmentosService {
  constructor(private readonly http: HttpClient) {}

  listar(busca?: string): Observable<Segmento[]> {
    let params = new HttpParams();
    if (busca) {
      params = params.set('busca', busca);
    }
    return this.http.get<Segmento[]>('/api/segmentos', { params });
  }

  criar(segmento: Partial<Segmento>): Observable<Segmento> {
    return this.http.post<Segmento>('/api/segmentos', segmento);
  }

  atualizar(id: number, segmento: Partial<Segmento>): Observable<Segmento> {
    return this.http.put<Segmento>(`/api/segmentos/${id}`, segmento);
  }

  excluir(id: number): Observable<void> {
    return this.http.delete<void>(`/api/segmentos/${id}`);
  }
}
