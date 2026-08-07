const { pool } = require('../../config/db');
const ApiError = require('../../utils/api-error');

async function validarCliente(clienteId) {
  const { rows } = await pool.query(
    'SELECT id FROM clientes WHERE id = $1',
    [clienteId]
  );
  if (!rows[0]) {
    throw new ApiError(404, 'Cliente não encontrado');
  }
}

async function listar(req, res, next) {
  try {
    const { rows } = await pool.query(
      `SELECT i.id, i.tipo, i.assunto, i.descricao, i.ocorreu_em,
              i.criado_por, i.criado_em, u.nome AS criado_por_nome
         FROM interacoes i
         LEFT JOIN usuarios u ON u.id = i.criado_por
        WHERE i.cliente_id = $1
        ORDER BY i.ocorreu_em DESC`,
      [req.params.clienteId]
    );
    res.json(rows);
  } catch (err) {
    next(err);
  }
}

async function criar(req, res, next) {
  try {
    const { clienteId } = req.params;
    const { tipo = 'anotacao', assunto, descricao, ocorreu_em } = req.body;

    await validarCliente(clienteId);

    const { rows } = await pool.query(
      `INSERT INTO interacoes (cliente_id, tipo, assunto, descricao, ocorreu_em, criado_por)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING id, tipo, assunto, descricao, ocorreu_em, criado_por, criado_em`,
      [clienteId, tipo, assunto, descricao || null, ocorreu_em || new Date().toISOString(), req.user.id]
    );

    res.status(201).json(rows[0]);
  } catch (err) {
    next(err);
  }
}

async function atualizar(req, res, next) {
  try {
    const { id, clienteId } = req.params;
    const { tipo, assunto, descricao, ocorreu_em } = req.body;

    const { rows } = await pool.query(
      `UPDATE interacoes
          SET tipo = COALESCE($1, tipo),
              assunto = COALESCE($2, assunto),
              descricao = COALESCE($3, descricao),
              ocorreu_em = COALESCE($4, ocorreu_em),
              atualizado_em = NOW()
        WHERE id = $5 AND cliente_id = $6
        RETURNING id, tipo, assunto, descricao, ocorreu_em, criado_por, criado_em`,
      [tipo ?? null, assunto ?? null, descricao ?? null, ocorreu_em ?? null, id, clienteId]
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
    const { id, clienteId } = req.params;
    const { rowCount } = await pool.query(
      'DELETE FROM interacoes WHERE id = $1 AND cliente_id = $2',
      [id, clienteId]
    );

    if (rowCount === 0) {
      throw new ApiError(404, 'Interação não encontrada');
    }

    res.status(204).send();
  } catch (err) {
    next(err);
  }
}

module.exports = { listar, criar, atualizar, excluir };
