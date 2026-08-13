import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface ConsultaCnpjErro {
  status: number;
  titulo: string;
  detalhes?: string;
  validacao?: unknown[];
}

export interface ConsultaCnpj {
  cnpj_raiz: string;
  razao_social: string;
  capital_social?: string;
  responsavel_federativo?: string;
  atualizado_em?: string;
  porte?: { id?: string; descricao?: string };
  natureza_juridica?: { id?: string; descricao?: string };
  qualificacao_do_responsavel?: { id?: number; descricao?: string };
  socios?: unknown[];
  simples?: Record<string, unknown>;
  estabelecimento?: {
    cnpj?: string;
    tipo?: string;
    nome_fantasia?: string;
    situacao_cadastral?: string;
    data_inicio_atividade?: string;
    tipo_logradouro?: string;
    logradouro?: string;
    numero?: string;
    complemento?: string;
    bairro?: string;
    cep?: string;
    email?: string;
    estado?: { id?: number; nome?: string; sigla?: string; ibge_id?: number };
    cidade?: { id?: number; nome?: string; ibge_id?: number; siafi_id?: string };
    atividade_principal?: { id?: string; descricao?: string };
    atividades_secundarias?: { id?: string; descricao?: string }[];
    pais?: { id?: string; iso2?: string; iso3?: string; nome?: string };
  };
}

export type ConsultaCnpjResponse = ConsultaCnpj & Partial<ConsultaCnpjErro>;

@Injectable({ providedIn: 'root' })
export class ConsultaCnpjService {
  constructor(private readonly http: HttpClient) {}

  consultar(numero: string): Observable<ConsultaCnpjResponse> {
    return this.http.get<ConsultaCnpjResponse>(
      `/api/consultas/cnpj/${numero}`
    );
  }
}
