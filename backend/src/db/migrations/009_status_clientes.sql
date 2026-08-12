-- Migration 009: status parametrizáveis para clientes

-- =============================
-- Status de clientes
-- =============================
CREATE TABLE IF NOT EXISTS status_clientes (
    id SERIAL PRIMARY KEY,
    nome VARCHAR(80) NOT NULL UNIQUE,
    descricao TEXT,
    cor VARCHAR(7) NOT NULL DEFAULT '#757575'
);

CREATE INDEX IF NOT EXISTS idx_status_clientes_nome ON status_clientes (nome);

-- Status padrão migrados do modelo antigo (cores das pills atuais)
INSERT INTO status_clientes (nome, descricao, cor) VALUES
    ('Ativo', 'Cliente com relacionamento ativo', '#2e7d32'),
    ('Inativo', 'Cliente sem relacionamento ativo', '#c62828'),
    ('Prospect', 'Cliente em fase de prospecção', '#e65100')
ON CONFLICT (nome) DO NOTHING;

-- =============================
-- Vínculo em clientes (FK por id)
-- =============================
ALTER TABLE clientes ADD COLUMN IF NOT EXISTS status_id INTEGER REFERENCES status_clientes(id);

-- Backfill: converte o status textual antigo para o id correspondente
UPDATE clientes c
   SET status_id = s.id
  FROM status_clientes s
 WHERE c.status_id IS NULL
   AND LOWER(s.nome) = LOWER(c.status);

-- Garante que nenhum cliente fique sem status
UPDATE clientes
   SET status_id = (SELECT id FROM status_clientes ORDER BY id LIMIT 1)
 WHERE status_id IS NULL;

-- Remove a coluna antiga de texto
ALTER TABLE clientes DROP COLUMN IF EXISTS status;

-- Índice para busca e filtro por status
CREATE INDEX IF NOT EXISTS idx_clientes_status_id ON clientes (status_id);

-- =============================
-- Permissões do módulo
-- =============================
INSERT INTO permissoes (modulo, acao) VALUES
    ('status_clientes', 'ver'),
    ('status_clientes', 'criar'),
    ('status_clientes', 'editar'),
    ('status_clientes', 'excluir')
ON CONFLICT (modulo, acao) DO NOTHING;

INSERT INTO papel_permissoes (papel, permissao_id)
SELECT 'operador', p.id
  FROM permissoes p
 WHERE p.modulo = 'status_clientes' AND p.acao = 'ver'
ON CONFLICT (papel, permissao_id) DO NOTHING;

INSERT INTO papel_permissoes (papel, permissao_id)
SELECT 'visualizador', p.id
  FROM permissoes p
 WHERE p.modulo = 'status_clientes' AND p.acao = 'ver'
ON CONFLICT (papel, permissao_id) DO NOTHING;
