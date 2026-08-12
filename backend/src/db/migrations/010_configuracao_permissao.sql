-- Migration 010: permissão de acesso ao módulo Configurações

INSERT INTO permissoes (modulo, acao) VALUES ('configuracao', 'ver')
ON CONFLICT (modulo, acao) DO NOTHING;

INSERT INTO papel_permissoes (papel, permissao_id)
SELECT 'operador', p.id
  FROM permissoes p
 WHERE p.modulo = 'configuracao' AND p.acao = 'ver'
ON CONFLICT (papel, permissao_id) DO NOTHING;

INSERT INTO papel_permissoes (papel, permissao_id)
SELECT 'visualizador', p.id
  FROM permissoes p
 WHERE p.modulo = 'configuracao' AND p.acao = 'ver'
ON CONFLICT (papel, permissao_id) DO NOTHING;
