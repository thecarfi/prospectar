-- Migration 001: estrutura inicial do sistema de gestão de clientes

-- =============================
-- Usuários
-- =============================
CREATE TABLE IF NOT EXISTS usuarios (
    id SERIAL PRIMARY KEY,
    nome VARCHAR(120) NOT NULL,
    email VARCHAR(160) NOT NULL UNIQUE,
    senha_hash VARCHAR(255) NOT NULL,
    papel VARCHAR(30) NOT NULL DEFAULT 'visualizador',
    ativo BOOLEAN NOT NULL DEFAULT TRUE,
    criado_em TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    atualizado_em TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- =============================
-- Permissões (RBAC granular)
-- =============================
CREATE TABLE IF NOT EXISTS permissoes (
    id SERIAL PRIMARY KEY,
    modulo VARCHAR(40) NOT NULL,
    acao VARCHAR(40) NOT NULL,
    UNIQUE (modulo, acao)
);

CREATE TABLE IF NOT EXISTS papel_permissoes (
    id SERIAL PRIMARY KEY,
    papel VARCHAR(30) NOT NULL,
    permissao_id INTEGER NOT NULL REFERENCES permissoes(id) ON DELETE CASCADE,
    UNIQUE (papel, permissao_id)
);

-- =============================
-- Clientes
-- =============================
CREATE TABLE IF NOT EXISTS clientes (
    id SERIAL PRIMARY KEY,
    nome VARCHAR(160) NOT NULL,
    cpf_cnpj VARCHAR(20) UNIQUE,
    segmento VARCHAR(80),
    cidade VARCHAR(80),
    estado VARCHAR(2),
    status VARCHAR(30) NOT NULL DEFAULT 'ativo',
    observacoes TEXT,
    criado_por INTEGER REFERENCES usuarios(id) ON DELETE SET NULL,
    criado_em TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    atualizado_em TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- =============================
-- Contatos
-- =============================
CREATE TABLE IF NOT EXISTS contatos (
    id SERIAL PRIMARY KEY,
    cliente_id INTEGER NOT NULL REFERENCES clientes(id) ON DELETE CASCADE,
    nome VARCHAR(120) NOT NULL,
    email VARCHAR(160),
    telefone VARCHAR(30),
    cargo VARCHAR(80),
    criado_em TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    atualizado_em TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- =============================
-- Endereços
-- =============================
CREATE TABLE IF NOT EXISTS enderecos (
    id SERIAL PRIMARY KEY,
    cliente_id INTEGER NOT NULL REFERENCES clientes(id) ON DELETE CASCADE,
    logradouro VARCHAR(160) NOT NULL,
    numero VARCHAR(20),
    complemento VARCHAR(80),
    bairro VARCHAR(80),
    cidade VARCHAR(80),
    estado VARCHAR(2),
    cep VARCHAR(10),
    principal BOOLEAN NOT NULL DEFAULT FALSE,
    criado_em TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    atualizado_em TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- =============================
-- Interações
-- =============================
CREATE TABLE IF NOT EXISTS interacoes (
    id SERIAL PRIMARY KEY,
    cliente_id INTEGER NOT NULL REFERENCES clientes(id) ON DELETE CASCADE,
    tipo VARCHAR(30) NOT NULL DEFAULT 'anotacao',
    assunto VARCHAR(160) NOT NULL,
    descricao TEXT,
    ocorreu_em TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    criado_por INTEGER REFERENCES usuarios(id) ON DELETE SET NULL,
    criado_em TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    atualizado_em TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- =============================
-- Índices para busca e filtros
-- =============================
CREATE INDEX IF NOT EXISTS idx_usuarios_email ON usuarios (email);
CREATE INDEX IF NOT EXISTS idx_clientes_nome ON clientes (nome);
CREATE INDEX IF NOT EXISTS idx_clientes_cpf_cnpj ON clientes (cpf_cnpj);
CREATE INDEX IF NOT EXISTS idx_clientes_cidade ON clientes (cidade);
CREATE INDEX IF NOT EXISTS idx_clientes_status ON clientes (status);
CREATE INDEX IF NOT EXISTS idx_contatos_cliente_id ON contatos (cliente_id);
CREATE INDEX IF NOT EXISTS idx_enderecos_cliente_id ON enderecos (cliente_id);
CREATE INDEX IF NOT EXISTS idx_interacoes_cliente_id ON interacoes (cliente_id);
CREATE INDEX IF NOT EXISTS idx_interacoes_ocorreu_em ON interacoes (ocorreu_em);
