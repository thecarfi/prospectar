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
      'SELECT id, nome, email, telefone, cargo FROM contatos WHERE cliente_id = $1 ORDER BY nome',
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
    const { nome, email, telefone, cargo } = req.body;

    await validarCliente(clienteId);

    const { rows } = await pool.query(
      `INSERT INTO contatos (cliente_id, nome, email, telefone, cargo)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING id, nome, email, telefone, cargo`,
      [clienteId, nome, email || null, telefone || null, cargo || null]
    );

    res.status(201).json(rows[0]);
  } catch (err) {
    next(err);
  }
}

async function atualizar(req, res, next) {
  try {
    const { id } = req.params;
    const { nome, email, telefone, cargo } = req.body;

    const { rows } = await pool.query(
      `UPDATE contatos
          SET nome = COALESCE($1, nome),
              email = COALESCE($2, email),
              telefone = COALESCE($3, telefone),
              cargo = COALESCE($4, cargo),
              atualizado_em = NOW()
        WHERE id = $5 AND cliente_id = $6
        RETURNING id, nome, email, telefone, cargo`,
      [nome ?? null, email ?? null, telefone ?? null, cargo ?? null, id, req.params.clienteId]
    );

    if (!rows[0]) {
      throw new ApiError(404, 'Contato não encontrado');
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
      'DELETE FROM contatos WHERE id = $1 AND cliente_id = $2',
      [id, clienteId]
    );

    if (rowCount === 0) {
      throw new ApiError(404, 'Contato não encontrado');
    }

    res.status(204).send();
  } catch (err) {
    next(err);
  }
}

module.exports = { listar, criar, atualizar, excluir };
