-- Migration 003: tabelas de estados e municípios

CREATE TABLE IF NOT EXISTS estados (
    id SERIAL PRIMARY KEY,
    sigla VARCHAR(2) NOT NULL UNIQUE,
    nome VARCHAR(80) NOT NULL
);

CREATE TABLE IF NOT EXISTS municipios (
    id SERIAL PRIMARY KEY,
    estado_id INTEGER NOT NULL REFERENCES estados(id) ON DELETE CASCADE,
    nome VARCHAR(120) NOT NULL,
    UNIQUE (estado_id, nome)
);

CREATE INDEX IF NOT EXISTS idx_municipios_nome ON municipios (nome);
CREATE INDEX IF NOT EXISTS idx_municipios_estado_id ON municipios (estado_id);

ALTER TABLE clientes ADD COLUMN municipio_id INTEGER REFERENCES municipios(id);
ALTER TABLE enderecos ADD COLUMN municipio_id INTEGER REFERENCES municipios(id);

CREATE INDEX IF NOT EXISTS idx_clientes_municipio_id ON clientes (municipio_id);
CREATE INDEX IF NOT EXISTS idx_enderecos_municipio_id ON enderecos (municipio_id);
