-- Migration 018: módulo de cotação de frete

-- =============================
-- Rotas de cotação
-- =============================
CREATE TABLE IF NOT EXISTS cotacao_rotas (
    id SERIAL PRIMARY KEY,
    nome VARCHAR(120) NOT NULL,
    icms NUMERIC(6,4) NOT NULL DEFAULT 0,
    frete_minimo NUMERIC(12,2) NOT NULL DEFAULT 0,
    criado_em TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    atualizado_em TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT cotacao_rotas_nome_key UNIQUE (nome),
    CONSTRAINT cotacao_rotas_icms_check CHECK (icms >= 0 AND icms <= 1),
    CONSTRAINT cotacao_rotas_frete_minimo_check CHECK (frete_minimo >= 0)
);

-- =============================
-- Generalidades (um registro por parâmetro)
-- =============================
CREATE TABLE IF NOT EXISTS cotacao_generalidades (
    id SERIAL PRIMARY KEY,
    tipo_generalidade VARCHAR(60) NOT NULL,
    valor_generalidade NUMERIC(14,6) NOT NULL DEFAULT 0,
    CONSTRAINT cotacao_generalidades_tipo_key UNIQUE (tipo_generalidade),
    CONSTRAINT cotacao_generalidades_valor_check CHECK (valor_generalidade >= 0)
);

-- =============================
-- Histórico de cotações
-- =============================
CREATE TABLE IF NOT EXISTS cotacoes (
    id SERIAL PRIMARY KEY,
    cliente_texto VARCHAR(160),
    cliente_id INTEGER REFERENCES clientes(id) ON DELETE SET NULL,
    rota_id INTEGER REFERENCES cotacao_rotas(id) ON DELETE SET NULL,
    rota_nome VARCHAR(120) NOT NULL,
    icms_rota NUMERIC(6,4) NOT NULL,
    frete_minimo_rota NUMERIC(12,2) NOT NULL,
    largura NUMERIC(12,4) NOT NULL DEFAULT 0,
    altura NUMERIC(12,4) NOT NULL DEFAULT 0,
    comprimento NUMERIC(12,4) NOT NULL DEFAULT 0,
    valor_nf NUMERIC(14,2) NOT NULL,
    peso NUMERIC(12,3) NOT NULL,
    parametros JSONB NOT NULL DEFAULT '{}'::jsonb,
    peso_cubado NUMERIC(16,4) NOT NULL,
    peso_cubado_multiplicado NUMERIC(16,4) NOT NULL,
    peso_definido NUMERIC(16,4) NOT NULL,
    frete_peso NUMERIC(14,2) NOT NULL,
    frete_percentual_valor NUMERIC(14,2) NOT NULL,
    frete_minimo_valor NUMERIC(14,2) NOT NULL,
    frete_escolhido VARCHAR(40) NOT NULL,
    valor_frete NUMERIC(14,2) NOT NULL,
    icms_valor NUMERIC(14,2) NOT NULL,
    seguro_valor NUMERIC(14,2) NOT NULL,
    gris_valor NUMERIC(14,2) NOT NULL,
    pedagio_valor NUMERIC(14,2) NOT NULL,
    sec_cat_valor NUMERIC(14,2) NOT NULL,
    valor_generalidade NUMERIC(14,2) NOT NULL,
    valor_total NUMERIC(14,2) NOT NULL,
    cotado_por INTEGER REFERENCES usuarios(id) ON DELETE SET NULL,
    criado_em TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- =============================
-- Índices
-- =============================
CREATE INDEX IF NOT EXISTS idx_cotacoes_criado_em ON cotacoes (criado_em DESC);
CREATE INDEX IF NOT EXISTS idx_cotacoes_cliente ON cotacoes (cliente_id);
CREATE INDEX IF NOT EXISTS idx_cotacoes_rota ON cotacoes (rota_id);

-- =============================
-- Valores padrão: rotas
-- =============================
INSERT INTO cotacao_rotas (nome, icms, frete_minimo) VALUES
    ('GRU-CBA', 0.07, 120),
    ('CWB-CBA', 0.07, 120),
    ('GYN-CBA', 0.12, 120),
    ('CBA-RO', 0.12, 120),
    ('CBA-CBA (interior)', 0.17, 120)
ON CONFLICT (nome) DO NOTHING;

-- =============================
-- Valores padrão: generalidades
-- =============================
INSERT INTO cotacao_generalidades (tipo_generalidade, valor_generalidade) VALUES
    ('seguro', 0.005),
    ('gris', 0.002),
    ('pedagio', 0.066),
    ('sec_cat', 32),
    ('valor_quilo', 0.8),
    ('frete_percentual', 0.02)
ON CONFLICT (tipo_generalidade) DO NOTHING;

-- =============================
-- Permissões RBAC
-- =============================
INSERT INTO permissoes (modulo, acao) VALUES
    ('cotacao', 'ver'),
    ('cotacao', 'configurar')
ON CONFLICT (modulo, acao) DO NOTHING;

INSERT INTO papel_permissoes (papel, permissao_id)
SELECT 'operador', p.id FROM permissoes p
WHERE p.modulo = 'cotacao' AND p.acao = 'ver'
ON CONFLICT (papel, permissao_id) DO NOTHING;

INSERT INTO papel_permissoes (papel, permissao_id)
SELECT 'visualizador', p.id FROM permissoes p
WHERE p.modulo = 'cotacao' AND p.acao = 'ver'
ON CONFLICT (papel, permissao_id) DO NOTHING;
