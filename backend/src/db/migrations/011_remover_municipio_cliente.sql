-- Migration 011: remove clientes.municipio_id
-- A fonte de cidade/estado passa a ser o endereco principal (enderecos.principal = true)

DROP INDEX IF EXISTS idx_clientes_municipio_id;
ALTER TABLE clientes DROP COLUMN IF EXISTS municipio_id;
