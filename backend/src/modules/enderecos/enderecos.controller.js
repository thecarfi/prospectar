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
      `SELECT id, logradouro, numero, complemento, bairro, cidade, estado,
              cep, principal
         FROM enderecos WHERE cliente_id = $1 ORDER BY principal DESC, id`,
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
    const {
      logradouro,
      numero,
      complemento,
      bairro,
      cidade,
      estado,
      cep,
      principal = false,
    } = req.body;

    await validarCliente(clienteId);

    const { rows } = await pool.query(
      `INSERT INTO enderecos (cliente_id, logradouro, numero, complemento, bairro, cidade, estado, cep, principal)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
       RETURNING id, logradouro, numero, complemento, bairro, cidade, estado,
                 cep, principal`,
      [clienteId, logradouro, numero || null, complemento || null, bairro || null, cidade || null, estado || null, cep || null, principal]
    );

    res.status(201).json(rows[0]);
  } catch (err) {
    next(err);
  }
}

async function atualizar(req, res, next) {
  try {
    const { id, clienteId } = req.params;
    const {
      logradouro,
      numero,
      complemento,
      bairro,
      cidade,
      estado,
      cep,
      principal,
    } = req.body;

    const { rows } = await pool.query(
      `UPDATE enderecos
          SET logradouro = COALESCE($1, logradouro),
              numero = COALESCE($2, numero),
              complemento = COALESCE($3, complemento),
              bairro = COALESCE($4, bairro),
              cidade = COALESCE($5, cidade),
              estado = COALESCE($6, estado),
              cep = COALESCE($7, cep),
              principal = COALESCE($8, principal),
              atualizado_em = NOW()
        WHERE id = $9 AND cliente_id = $10
        RETURNING id, logradouro, numero, complemento, bairro, cidade, estado,
                  cep, principal`,
      [logradouro ?? null, numero ?? null, complemento ?? null, bairro ?? null, cidade ?? null, estado ?? null, cep ?? null, principal ?? null, id, clienteId]
    );

    if (!rows[0]) {
      throw new ApiError(404, 'Endereço não encontrado');
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
      'DELETE FROM enderecos WHERE id = $1 AND cliente_id = $2',
      [id, clienteId]
    );

    if (rowCount === 0) {
      throw new ApiError(404, 'Endereço não encontrado');
    }

    res.status(204).send();
  } catch (err) {
    next(err);
  }
}

module.exports = { listar, criar, atualizar, excluir };
