-- Migration 006: vinculo muitos-para-muitos clientes x segmentos

CREATE TABLE IF NOT EXISTS cliente_segmentos (
    cliente_id INTEGER NOT NULL REFERENCES clientes(id) ON DELETE CASCADE,
    segmento_id INTEGER NOT NULL REFERENCES segmentos(id) ON DELETE CASCADE,
    PRIMARY KEY (cliente_id, segmento_id)
);

CREATE INDEX IF NOT EXISTS idx_cliente_segmentos_cliente_id ON cliente_segmentos (cliente_id);
CREATE INDEX IF NOT EXISTS idx_cliente_segmentos_segmento_id ON cliente_segmentos (segmento_id);

-- Backfill: cria segmentos a partir do texto livre antigo (clientes.segmento)
INSERT INTO segmentos (nome)
SELECT DISTINCT TRIM(c.segmento)
FROM clientes c
WHERE c.segmento IS NOT NULL AND TRIM(c.segmento) <> ''
ON CONFLICT (nome) DO NOTHING;

-- Backfill: vincula os segmentos aos clientes
INSERT INTO cliente_segmentos (cliente_id, segmento_id)
SELECT c.id, s.id
FROM clientes c
JOIN segmentos s ON s.nome = TRIM(c.segmento)
WHERE c.segmento IS NOT NULL AND TRIM(c.segmento) <> ''
ON CONFLICT DO NOTHING;

-- Remove a coluna antiga de texto livre
ALTER TABLE clientes DROP COLUMN IF EXISTS segmento;
