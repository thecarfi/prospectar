-- Migration 004: remove colunas antigas de cidade/estado (após backfill no seed)

ALTER TABLE clientes DROP COLUMN IF EXISTS cidade;
ALTER TABLE clientes DROP COLUMN IF EXISTS estado;

ALTER TABLE enderecos DROP COLUMN IF EXISTS cidade;
ALTER TABLE enderecos DROP COLUMN IF EXISTS estado;
