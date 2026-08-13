-- Migration 014: vínculo CNAE x Clientes (muitos para muitos) com principal

-- =============================
-- Backfill: migrations 012/013 aplicadas manualmente no Supabase
-- =============================
INSERT INTO schema_migrations (version) VALUES
    ('012_cnae.sql'),
    ('013_cnae_insert.sql')
ON CONFLICT (version) DO NOTHING;

-- =============================
-- Tabela de relacionamento
-- =============================
CREATE TABLE IF NOT EXISTS cliente_cnae (
    cliente_id INTEGER NOT NULL REFERENCES clientes(id) ON DELETE CASCADE,
    subclasse  VARCHAR(7) NOT NULL REFERENCES cnae(subclasse) ON DELETE CASCADE,
    principal  BOOLEAN NOT NULL DEFAULT FALSE,
    criado_em  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    PRIMARY KEY (cliente_id, subclasse)
);

CREATE INDEX IF NOT EXISTS idx_cliente_cnae_cliente_id ON cliente_cnae (cliente_id);
CREATE INDEX IF NOT EXISTS idx_cliente_cnae_subclasse  ON cliente_cnae (subclasse);

-- Garante no máximo um relacionamento principal por cliente
CREATE UNIQUE INDEX IF NOT EXISTS uq_cliente_cnae_um_principal
    ON cliente_cnae (cliente_id) WHERE principal;

-- =============================
-- Permissões do módulo cnae
-- =============================
INSERT INTO permissoes (modulo, acao) VALUES ('cnae', 'ver')
ON CONFLICT (modulo, acao) DO NOTHING;

INSERT INTO papel_permissoes (papel, permissao_id)
SELECT 'operador', p.id
  FROM permissoes p
 WHERE p.modulo = 'cnae' AND p.acao = 'ver'
ON CONFLICT (papel, permissao_id) DO NOTHING;

INSERT INTO papel_permissoes (papel, permissao_id)
SELECT 'visualizador', p.id
  FROM permissoes p
 WHERE p.modulo = 'cnae' AND p.acao = 'ver'
ON CONFLICT (papel, permissao_id) DO NOTHING;
