-- Migration 019: registros de ações e acessos a módulos

CREATE TABLE IF NOT EXISTS registros_acoes (
    id BIGSERIAL PRIMARY KEY,
    acao VARCHAR(20) NOT NULL,
    usuario_id INTEGER REFERENCES usuarios(id) ON DELETE SET NULL,
    data TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    dados JSONB,
    CONSTRAINT registros_acoes_acao_check
        CHECK (acao IN ('acesso', 'insert', 'update', 'delete', 'select'))
);

CREATE INDEX IF NOT EXISTS idx_registros_acoes_usuario_data
    ON registros_acoes (usuario_id, data DESC);

CREATE INDEX IF NOT EXISTS idx_registros_acoes_acao_data
    ON registros_acoes (acao, data DESC);
