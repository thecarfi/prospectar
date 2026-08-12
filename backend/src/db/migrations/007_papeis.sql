-- Migration 007: tabela de papeis para gestão de permissões

-- =============================
-- Papeis (registro canônico de papeis)
-- =============================
CREATE TABLE IF NOT EXISTS papeis (
    id SERIAL PRIMARY KEY,
    nome VARCHAR(30) NOT NULL UNIQUE,
    descricao TEXT,
    criado_em TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

INSERT INTO papeis (nome, descricao) VALUES
    ('admin', 'Acesso total ao sistema'),
    ('operador', 'Operação de clientes, contatos, endereços e interações'),
    ('visualizador', 'Somente leitura')
ON CONFLICT (nome) DO NOTHING;
