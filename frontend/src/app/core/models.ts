export interface Usuario {
  id: number;
  nome: string;
  email: string;
  papel: 'admin' | 'operador' | 'visualizador';
  ativo: boolean;
  permissoes?: string[];
  criado_em?: string;
  atualizado_em?: string;
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
  segmento?: string;
  municipio_id?: number;
  municipio_nome?: string;
  municipio_uf?: string;
  status: 'ativo' | 'inativo' | 'prospect';
  observacoes?: string;
  criado_por?: number;
  criado_em?: string;
  atualizado_em?: string;
}

export interface ClienteDetalhe extends Cliente {
  contatos: Contato[];
  enderecos: Endereco[];
  interacoes: Interacao[];
}

export interface ClienteFiltros {
  busca?: string;
  cidade?: string;
  estado?: string;
  segmento?: string;
  status?: string;
  pagina?: number;
  limite?: number;
  ordenar_por?: 'nome' | 'criado_em' | 'cidade';
  direcao?: 'asc' | 'desc';
}

export interface Contato {
  id: number;
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
  tipo: 'ligacao' | 'visita' | 'anotacao' | 'mensagem';
  assunto: string;
  descricao?: string;
  ocorreu_em: string;
  criado_por?: number;
  criado_por_nome?: string;
  criado_em?: string;
}
