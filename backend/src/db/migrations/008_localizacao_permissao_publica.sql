-- Migration 008: localização acessível a qualquer papel autenticado
-- Remove a permissão localizacao:ver; os vínculos em papel_permissoes
-- são apagados automaticamente via ON DELETE CASCADE.

DELETE FROM permissoes WHERE modulo = 'localizacao' AND acao = 'ver';
