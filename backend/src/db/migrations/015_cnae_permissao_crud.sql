-- Migration 015: permissões CRUD do módulo cnae

-- =============================
-- Permissões do módulo cnae
-- =============================
INSERT INTO permissoes (modulo, acao) VALUES
    ('cnae', 'criar'),
    ('cnae', 'editar'),
    ('cnae', 'excluir')
ON CONFLICT (modulo, acao) DO NOTHING;

-- =============================
-- Concessões padrão (papel operador, espelhando contatos/enderecos/interacoes)
-- =============================
INSERT INTO papel_permissoes (papel, permissao_id)
SELECT 'operador', p.id
  FROM permissoes p
 WHERE p.modulo = 'cnae' AND p.acao IN ('criar', 'editar')
ON CONFLICT (papel, permissao_id) DO NOTHING;
