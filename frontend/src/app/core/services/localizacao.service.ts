import { Injectable, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Estado, Municipio } from '../models';

@Injectable({ providedIn: 'root' })
export class LocalizacaoService {
  private readonly estadosSignal = signal<Estado[]>([]);
  private readonly municipiosSignal = signal<Municipio[]>([]);
  private carregados = false;

  constructor(private readonly http: HttpClient) {}

  readonly estados = this.estadosSignal.asReadonly();
  readonly municipios = this.municipiosSignal.asReadonly();

  carregar(): void {
    if (this.carregados) return;
    this.carregados = true;
    this.http.get<Estado[]>('/api/localizacao/estados').subscribe({
      next: (estados) => this.estadosSignal.set(estados),
    });
    this.http.get<Municipio[]>('/api/localizacao/municipios').subscribe({
      next: (municipios) => this.municipiosSignal.set(municipios),
    });
  }

  municipiosPorUf(uf: string): Municipio[] {
    return this.municipios()
      .filter((m) => m.uf === uf)
      .sort((a, b) => a.nome.localeCompare(b.nome, 'pt-BR'));
  }

  obterMunicipio(id: number | null | undefined): Municipio | undefined {
    if (!id) return undefined;
    return this.municipios().find((m) => m.id === id);
  }
}
