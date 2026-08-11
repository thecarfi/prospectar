-- Migration 002: renomeia o tipo de interação 'chamado' para 'ligacao'

UPDATE interacoes SET tipo = 'ligacao' WHERE tipo = 'chamado';
