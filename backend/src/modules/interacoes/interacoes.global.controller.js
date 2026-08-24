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
      condicoes.push(`i.criado_em >= $${params.length}::timestamptz`);
    }
    if (data_fim) {
      params.push(data_fim);
      condicoes.push(`i.criado_em < ($${params.length}::date + INTERVAL '1 day')`);
    }

    const whereSql = condicoes.length ? `WHERE ${condicoes.join(' AND ')}` : '';
    const paginaNum = Math.max(1, Number(pagina) || 1);
    const limiteNum = Math.min(100, Math.max(1, Number(limite) || 10));
    const offset = (paginaNum - 1) * limiteNum;

    const fromSql = `FROM interacoes i
         JOIN clientes c ON c.id = i.cliente_id
         LEFT JOIN usuarios u ON u.id = i.criado_por`;

    const { rows: totalRows } = await pool.query(
      `SELECT COUNT(*)::int AS total ${fromSql} ${whereSql}`,
      params
    );

    const { rows } = await pool.query(
      `SELECT i.id, i.cliente_id, c.nome AS cliente_nome,
              i.tipo, i.assunto, i.descricao, i.ocorreu_em,
              i.criado_em, i.criado_por, u.nome AS criado_por_nome
         ${fromSql}
         ${whereSql}
        ORDER BY i.criado_em DESC, i.id DESC
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

async function criar(req, res, next) {
  try {
    const { cliente_id, tipo = 'anotacao', assunto, descricao, ocorreu_em } =
      req.body;

    await validarCliente(cliente_id);

    const { rows } = await pool.query(
      `INSERT INTO interacoes (cliente_id, tipo, assunto, descricao, ocorreu_em, criado_por)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING id, cliente_id, tipo, assunto, descricao, ocorreu_em, criado_por, criado_em`,
      [
        cliente_id,
        tipo,
        assunto,
        descricao || null,
        ocorreu_em || new Date().toISOString(),
        req.user.id,
      ]
    );

    res.status(201).json(rows[0]);
  } catch (err) {
    next(err);
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
