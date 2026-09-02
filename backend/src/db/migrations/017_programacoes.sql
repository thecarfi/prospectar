-- Migration 017: programações de visita

-- =============================
-- Programações de visita
-- =============================
CREATE TABLE IF NOT EXISTS programacoes (
    id SERIAL PRIMARY KEY,
    titulo VARCHAR(160) NOT NULL,
    data_inicio DATE NOT NULL,
    data_fim DATE NOT NULL,
    municipio_id INTEGER REFERENCES municipios(id),
    regiao VARCHAR(120),
    status VARCHAR(30) NOT NULL DEFAULT 'pendente',
    descricao TEXT,
    criado_por INTEGER REFERENCES usuarios(id) ON DELETE SET NULL,
    criado_em TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    atualizado_em TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CHECK (data_fim >= data_inicio)
);

-- =============================
-- Vínculo programação ↔ clientes
-- =============================
CREATE TABLE IF NOT EXISTS programacao_clientes (
    id SERIAL PRIMARY KEY,
    programacao_id INTEGER NOT NULL REFERENCES programacoes(id) ON DELETE CASCADE,
    cliente_id INTEGER NOT NULL REFERENCES clientes(id) ON DELETE CASCADE,
    criado_em TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE (programacao_id, cliente_id)
);

-- Coluna para vincular interações a programações (nullable)
ALTER TABLE interacoes ADD COLUMN IF NOT EXISTS programacao_id INTEGER
    REFERENCES programacoes(id) ON DELETE SET NULL;

-- =============================
-- Índices
-- =============================
CREATE INDEX IF NOT EXISTS idx_programacoes_status ON programacoes (status);
CREATE INDEX IF NOT EXISTS idx_programacoes_data_inicio ON programacoes (data_inicio);
CREATE INDEX IF NOT EXISTS idx_programacao_clientes_programacao ON programacao_clientes (programacao_id);
CREATE INDEX IF NOT EXISTS idx_programacao_clientes_cliente ON programacao_clientes (cliente_id);
CREATE INDEX IF NOT EXISTS idx_interacoes_programacao ON interacoes (programacao_id);

-- =============================
-- Permissões RBAC
-- =============================
INSERT INTO permissoes (modulo, acao) VALUES
    ('programacoes', 'ver'),
    ('programacoes', 'criar'),
    ('programacoes', 'editar'),
    ('programacoes', 'excluir')
ON CONFLICT (modulo, acao) DO NOTHING;

INSERT INTO papel_permissoes (papel, permissao_id)
SELECT 'operador', p.id FROM permissoes p
WHERE p.modulo = 'programacoes' AND p.acao IN ('ver', 'criar', 'editar')
ON CONFLICT (papel, permissao_id) DO NOTHING;

INSERT INTO papel_permissoes (papel, permissao_id)
SELECT 'visualizador', p.id FROM permissoes p
WHERE p.modulo = 'programacoes' AND p.acao = 'ver'
ON CONFLICT (papel, permissao_id) DO NOTHING;
