export interface Usuario {
  id: number;
  nome: string;
  email: string;
  papel: string;
  ativo: boolean;
  permissoes?: string[];
  criado_em?: string;
  atualizado_em?: string;
}

export interface Papel {
  id: number;
  nome: string;
  descricao?: string;
  permissoes: string[];
  usuarios_count?: number;
  criado_em?: string;
}

export interface UsuarioFiltros {
  nome?: string;
  email?: string;
  papel?: string;
  ativo?: boolean;
}

export interface Permissao {
  id: number;
  modulo: string;
  acao: string;
  permissao: string;
}

export interface LoginResponse {
  token: string;
  usuario: Usuario;
}

export interface Paginacao<T> {
  dados: T[];
  total: number;
  pagina: number;
  limite: number;
}

export interface Segmento {
  id: number;
  nome: string;
  descricao?: string;
}

export interface Cnae {
  secao: string;
  descricao_secao: string;
  divisao: string;
  descricao_divisao: string;
  grupo: string;
  descricao_grupo: string;
  classe: string;
  descricao_classe: string;
  subclasse: string;
  descricao_subclasse: string;
}

export interface ClienteCnae extends Cnae {
  principal: boolean;
}

export interface StatusCliente {
  id: number;
  nome: string;
  descricao?: string;
  cor: string;
}

export interface Estado {
  id: number;
  sigla: string;
  nome: string;
}

export interface Municipio {
  id: number;
  estado_id: number;
  uf: string;
  nome: string;
}

export interface Cliente {
  id: number;
  nome: string;
  cpf_cnpj?: string;
  segmentos?: Segmento[];
  segmentos_nomes?: string;
  municipio_id?: number;
  municipio_nome?: string;
  municipio_uf?: string;
  status_id?: number;
  status_nome?: string;
  status_descricao?: string;
  status_cor?: string;
  observacoes?: string;
  json_coletado?: Record<string, unknown> | null;
  criado_por?: number;
  criado_em?: string;
  atualizado_em?: string;
}

export interface ClienteDetalhe extends Cliente {
  contatos: Contato[];
  enderecos: Endereco[];
  endereco_principal?: Endereco | null;
  interacoes: Interacao[];
  cnaes?: ClienteCnae[];
}
export interface ClienteFiltros {
  busca?: string;
  cidade?: string;
  estado?: string;
  segmento_id?: number;
  status_id?: number;
  pagina?: number;
  limite?: number;
  ordenar_por?: 'nome' | 'criado_em' | 'cidade';
  direcao?: 'asc' | 'desc';
}

export interface EstatisticasCliente {
  total: number;
  por_status: {
    status_id: number;
    status_nome: string;
    status_cor: string;
    total: number;
  }[];
}

export interface Contato {
  id?: number;
  cliente_id?: number;
  nome: string;
  email?: string;
  telefone?: string;
  cargo?: string;
}

export interface Endereco {
  id: number;
  cliente_id?: number;
  logradouro: string;
  numero?: string;
  complemento?: string;
  bairro?: string;
  municipio_id?: number;
  municipio_nome?: string;
  municipio_uf?: string;
  cep?: string;
  principal: boolean;
}

export interface Interacao {
  id: number;
  cliente_id?: number;
  cliente_nome?: string;
  tipo: 'ligacao' | 'visita' | 'anotacao' | 'mensagem';
  assunto: string;
  descricao?: string;
  ocorreu_em: string;
  criado_por?: number;
  criado_por_nome?: string;
  criado_em?: string;
}

export interface InteracaoFiltros {
  cliente_nome?: string;
  criado_por?: number;
  tipo?: string;
  data_inicio?: string;
  data_fim?: string;
  pagina?: number;
  limite?: number;
}

export interface InteracoesFiltrosMeta {
  usuarios: { id: number; nome: string }[];
  tipos: string[];
}
