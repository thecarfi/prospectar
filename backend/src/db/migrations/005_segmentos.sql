-- Migration 005: tabela de segmentos

CREATE TABLE IF NOT EXISTS segmentos (
    id SERIAL PRIMARY KEY,
    nome VARCHAR(80) NOT NULL UNIQUE,
    descricao TEXT
);

CREATE INDEX IF NOT EXISTS idx_segmentos_nome ON segmentos (nome);
