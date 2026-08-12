const { pool } = require('../../config/db');
const ApiError = require('../../utils/api-error');

async function listar(req, res, next) {
  try {
    const { rows: papeis } = await pool.query(
      `SELECT id, nome, descricao, criado_em
         FROM papeis
        ORDER BY nome`
    );

    const { rows: relacoes } = await pool.query(
      `SELECT pp.papel, p.modulo || ':' || p.acao AS permissao
         FROM papel_permissoes pp
         JOIN permissoes p ON p.id = pp.permissao_id
        ORDER BY p.modulo, p.acao`
    );

    const permissoesPorPapel = new Map();
    for (const r of relacoes) {
      if (!permissoesPorPapel.has(r.papel)) {
        permissoesPorPapel.set(r.papel, []);
      }
      permissoesPorPapel.get(r.papel).push(r.permissao);
    }

    const { rows: contagem } = await pool.query(
      'SELECT papel, COUNT(*)::int AS total FROM usuarios GROUP BY papel'
    );
    const usuariosPorPapel = new Map(contagem.map((c) => [c.papel, c.total]));

    res.json(
      papeis.map((p) => ({
        id: p.id,
        nome: p.nome,
        descricao: p.descricao,
        criado_em: p.criado_em,
        permissoes: permissoesPorPapel.get(p.nome) || [],
        usuarios_count: usuariosPorPapel.get(p.nome) || 0,
      }))
    );
  } catch (err) {
    next(err);
  }
}

async function listarPermissoes(req, res, next) {
  try {
    const { rows } = await pool.query(
      `SELECT id, modulo, acao, modulo || ':' || acao AS permissao
         FROM permissoes
        ORDER BY modulo, acao`
    );
    res.json(rows);
  } catch (err) {
    next(err);
  }
}

async function associarPermissoes(client, papel, permissaoIds) {
  if (!Array.isArray(permissaoIds) || permissaoIds.length === 0) {
    return;
  }
  const unicos = [...new Set(permissaoIds)];
  const { rows } = await client.query(
    'SELECT id FROM permissoes WHERE id = ANY($1::int[])',
    [unicos]
  );
  if (rows.length !== unicos.length) {
    throw new ApiError(400, 'Uma ou mais permissões são inválidas');
  }
  for (const id of unicos) {
    await client.query(
      `INSERT INTO papel_permissoes (papel, permissao_id) VALUES ($1, $2)
       ON CONFLICT (papel, permissao_id) DO NOTHING`,
      [papel, id]
    );
  }
}

async function buscarPapelComPermissoes(nome) {
  const { rows } = await pool.query(
    'SELECT id, nome, descricao, criado_em FROM papeis WHERE nome = $1',
    [nome]
  );
  const papel = rows[0];
  if (!papel) {
    return null;
  }
  const { rows: relacoes } = await pool.query(
    `SELECT p.modulo || ':' || p.acao AS permissao
       FROM papel_permissoes pp
       JOIN permissoes p ON p.id = pp.permissao_id
      WHERE pp.papel = $1
      ORDER BY p.modulo, p.acao`,
    [nome]
  );
  return { ...papel, permissoes: relacoes.map((r) => r.permissao) };
}

async function criar(req, res, next) {
  const { nome, descricao, permissao_ids } = req.body;
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    const { rows } = await client.query(
      `INSERT INTO papeis (nome, descricao)
       VALUES ($1, $2)
       RETURNING id, nome, descricao, criado_em`,
      [nome, (descricao || '').trim() || null]
    );

    await associarPermissoes(client, nome, permissao_ids);

    await client.query('COMMIT');

    res.status(201).json({
      ...rows[0],
      permissoes: await buscarPapelComPermissoes(nome).then((p) => p.permissoes),
    });
  } catch (err) {
    await client.query('ROLLBACK').catch(() => {});
    if (err.code === '23505') {
      return next(new ApiError(400, 'Já existe um papel com esse nome'));
    }
    next(err);
  } finally {
    client.release();
  }
}

async function atualizar(req, res, next) {
  const { nome } = req.params;
  const { descricao, permissao_ids } = req.body;
  const client = await pool.connect();
  try {
    if (nome === 'admin') {
      throw new ApiError(400, 'O papel admin é reservado');
    }

    await client.query('BEGIN');

    const { rows } = await client.query(
      'SELECT id FROM papeis WHERE nome = $1 FOR UPDATE',
      [nome]
    );
    if (!rows.length) {
      throw new ApiError(404, 'Papel não encontrado');
    }

    await client.query(
      'UPDATE papeis SET descricao = $1 WHERE nome = $2',
      [(descricao || '').trim() || null, nome]
    );

    if (Array.isArray(permissao_ids)) {
      await client.query('DELETE FROM papel_permissoes WHERE papel = $1', [nome]);
      await associarPermissoes(client, nome, permissao_ids);
    }

    await client.query('COMMIT');

    res.json(await buscarPapelComPermissoes(nome));
  } catch (err) {
    await client.query('ROLLBACK').catch(() => {});
    next(err);
  } finally {
    client.release();
  }
}

async function excluir(req, res, next) {
  const { nome } = req.params;
  const client = await pool.connect();
  try {
    if (nome === 'admin') {
      throw new ApiError(400, 'O papel admin é reservado');
    }

    await client.query('BEGIN');

    const { rows: emUso } = await client.query(
      'SELECT 1 FROM usuarios WHERE papel = $1 LIMIT 1',
      [nome]
    );
    if (emUso.length) {
      throw new ApiError(400, 'O papel está vinculado a usuários');
    }

    await client.query('DELETE FROM papel_permissoes WHERE papel = $1', [nome]);
    const { rowCount } = await client.query(
      'DELETE FROM papeis WHERE nome = $1',
      [nome]
    );
    if (rowCount === 0) {
      throw new ApiError(404, 'Papel não encontrado');
    }

    await client.query('COMMIT');
    res.status(204).send();
  } catch (err) {
    await client.query('ROLLBACK').catch(() => {});
    next(err);
  } finally {
    client.release();
  }
}

module.exports = { listar, listarPermissoes, criar, atualizar, excluir };
