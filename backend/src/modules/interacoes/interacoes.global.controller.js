const { pool } = require('../../config/db');
const ApiError = require('../../utils/api-error');

const TIPOS_VALIDOS = ['ligacao', 'visita', 'anotacao', 'mensagem'];

async function listar(req, res, next) {
  try {
    const {
      cliente_nome,
      criado_por,
      tipo,
      data_inicio,
      data_fim,
      programacao_id,
      pagina = 1,
      limite = 10,
    } = req.query;

    const condicoes = [];
    const params = [];

    if (req.user.papel !== 'admin') {
      params.push(req.user.id);
      condicoes.push(`i.criado_por = $${params.length}`);
    }
    if (cliente_nome) {
      params.push(`%${cliente_nome}%`);
      condicoes.push(`c.nome ILIKE $${params.length}`);
    }
    if (criado_por) {
      const id = parseInt(criado_por, 10);
      if (Number.isInteger(id)) {
        params.push(id);
        condicoes.push(`i.criado_por = $${params.length}`);
      }
    }
    if (tipo) {
      if (!TIPOS_VALIDOS.includes(tipo)) {
        throw new ApiError(400, 'Tipo inválido');
      }
      params.push(tipo);
      condicoes.push(`i.tipo = $${params.length}`);
    }
    if (data_inicio) {
      params.push(data_inicio);
      condicoes.push(`i.ocorreu_em >= $${params.length}::timestamptz`);
    }
    if (data_fim) {
      params.push(data_fim);
      condicoes.push(`i.ocorreu_em < ($${params.length}::date + INTERVAL '1 day')`);
    }
    if (programacao_id) {
      const pgId = parseInt(programacao_id, 10);
      if (Number.isInteger(pgId)) {
        params.push(pgId);
        condicoes.push(`i.programacao_id = $${params.length}`);
      }
    }

    const whereSql = condicoes.length ? `WHERE ${condicoes.join(' AND ')}` : '';
    const paginaNum = Math.max(1, Number(pagina) || 1);
    const limiteNum = Math.min(100, Math.max(1, Number(limite) || 10));
    const offset = (paginaNum - 1) * limiteNum;

    const fromSql = `FROM interacoes i
         JOIN clientes c ON c.id = i.cliente_id
         LEFT JOIN usuarios u ON u.id = i.criado_por
         LEFT JOIN programacoes p ON p.id = i.programacao_id`;

    const { rows: totalRows } = await pool.query(
      `SELECT COUNT(*)::int AS total ${fromSql} ${whereSql}`,
      params
    );

    const { rows } = await pool.query(
      `SELECT i.id, i.cliente_id, c.nome AS cliente_nome,
              i.tipo, i.assunto, i.descricao, i.ocorreu_em,
              i.criado_em, i.criado_por, u.nome AS criado_por_nome,
              i.programacao_id, p.titulo AS programacao_titulo
         ${fromSql}
         ${whereSql}
        ORDER BY i.ocorreu_em DESC, i.id DESC
        LIMIT $${params.length + 1} OFFSET $${params.length + 2}`,
      [...params, limiteNum, offset]
    );

    res.json({
      dados: rows,
      total: totalRows[0].total,
      pagina: paginaNum,
      limite: limiteNum,
    });
  } catch (err) {
    next(err);
  }
}

async function filtros(req, res, next) {
  try {
    const { rows: tiposRows } = await pool.query(
      'SELECT DISTINCT tipo FROM interacoes ORDER BY tipo'
    );

    let usuarios;
    if (req.user.papel === 'admin') {
      ({ rows: usuarios } = await pool.query(
        `SELECT DISTINCT u.id, u.nome
           FROM usuarios u
           JOIN interacoes i ON i.criado_por = u.id
          ORDER BY u.nome`
      ));
    } else {
      ({ rows: usuarios } = await pool.query(
        'SELECT id, nome FROM usuarios WHERE id = $1',
        [req.user.id]
      ));
    }

    res.json({
      usuarios,
      tipos: tiposRows.map((r) => r.tipo),
    });
  } catch (err) {
    next(err);
  }
}

function podeCriarClientes(usuario) {
  return (
    usuario.papel === 'admin' ||
    usuario.permissoes.includes('*') ||
    usuario.permissoes.includes('clientes:criar')
  );
}

async function criarClientePorNome(client, nome, usuarioId) {
  const { rows: status } = await client.query(
    'SELECT id FROM status_clientes ORDER BY id LIMIT 1'
  );
  const { rows } = await client.query(
    `INSERT INTO clientes (nome, status_id, criado_por)
     VALUES ($1, $2, $3)
     RETURNING id`,
    [nome, status[0] ? status[0].id : null, usuarioId]
  );
  return rows[0].id;
}

async function criar(req, res, next) {
  const client = await pool.connect();
  try {
    const { tipo = 'anotacao', assunto, descricao, ocorreu_em, programacao_id } = req.body;
    let { cliente_id, cliente_nome } = req.body;

    if (cliente_nome != null && String(cliente_nome).trim()) {
      if (!podeCriarClientes(req.user)) {
        throw new ApiError(403, 'Permissão necessária: clientes:criar');
      }
      cliente_id = null;
    } else {
      cliente_nome = null;
      await validarCliente(cliente_id);
    }

    if (programacao_id) {
      const { rows: prog } = await client.query(
        'SELECT id, status FROM programacoes WHERE id = $1',
        [programacao_id]
      );
      if (!prog[0]) {
        throw new ApiError(404, 'Programação não encontrada');
      }
      if (prog[0].status !== 'pendente' && prog[0].status !== 'em_andamento') {
        throw new ApiError(400, 'Não é possível adicionar interações a uma programação concluída ou cancelada');
      }
    }

    await client.query('BEGIN');

    if (!cliente_id) {
      cliente_id = await criarClientePorNome(
        client,
        String(cliente_nome).trim(),
        req.user.id
      );
    }

    const { rows } = await client.query(
      `INSERT INTO interacoes (cliente_id, tipo, assunto, descricao, ocorreu_em, criado_por, programacao_id)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING id, cliente_id, tipo, assunto, descricao, ocorreu_em, criado_por, criado_em, programacao_id`,
      [
        cliente_id,
        tipo,
        assunto,
        descricao || null,
        ocorreu_em || new Date().toISOString(),
        req.user.id,
        programacao_id || null,
      ]
    );

    await client.query('COMMIT');

    res.status(201).json(rows[0]);
  } catch (err) {
    await client.query('ROLLBACK').catch(() => {});
    next(err);
  } finally {
    client.release();
  }
}

async function atualizar(req, res, next) {
  try {
    const { id } = req.params;
    const { tipo, assunto, descricao, ocorreu_em } = req.body;

    const { rows } = await pool.query(
      `UPDATE interacoes
          SET tipo = COALESCE($1, tipo),
              assunto = COALESCE($2, assunto),
              descricao = COALESCE($3, descricao),
              ocorreu_em = COALESCE($4, ocorreu_em),
              atualizado_em = NOW()
        WHERE id = $5
        RETURNING id, cliente_id, tipo, assunto, descricao, ocorreu_em, criado_por, criado_em`,
      [tipo ?? null, assunto ?? null, descricao ?? null, ocorreu_em ?? null, id]
    );

    if (!rows[0]) {
      throw new ApiError(404, 'Interação não encontrada');
    }

    res.json(rows[0]);
  } catch (err) {
    next(err);
  }
}

async function excluir(req, res, next) {
  try {
    const { id } = req.params;
    const { rowCount } = await pool.query(
      'DELETE FROM interacoes WHERE id = $1',
      [id]
    );

    if (rowCount === 0) {
      throw new ApiError(404, 'Interação não encontrada');
    }

    res.status(204).send();
  } catch (err) {
    next(err);
  }
}

async function validarCliente(clienteId) {
  const { rows } = await pool.query('SELECT id FROM clientes WHERE id = $1', [
    clienteId,
  ]);
  if (!rows[0]) {
    throw new ApiError(404, 'Cliente não encontrado');
  }
}

module.exports = { listar, filtros, criar, atualizar, excluir };
