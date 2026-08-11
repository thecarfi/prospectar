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
      `SELECT e.id, e.logradouro, e.numero, e.complemento, e.bairro,
              e.municipio_id, m.nome AS municipio_nome, es.sigla AS municipio_uf,
              e.cep, e.principal
         FROM enderecos e
         LEFT JOIN municipios m ON m.id = e.municipio_id
         LEFT JOIN estados es ON es.id = m.estado_id
        WHERE e.cliente_id = $1 ORDER BY e.principal DESC, e.id`,
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
      municipio_id,
      cep,
      principal = false,
    } = req.body;

    await validarCliente(clienteId);

    const { rows } = await pool.query(
      `INSERT INTO enderecos (cliente_id, logradouro, numero, complemento, bairro, municipio_id, cep, principal)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
       RETURNING id, logradouro, numero, complemento, bairro, municipio_id,
                 cep, principal`,
      [clienteId, logradouro, numero || null, complemento || null, bairro || null, municipio_id ?? null, cep || null, principal]
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
      municipio_id,
      cep,
      principal,
    } = req.body;

    const { rows } = await pool.query(
      `UPDATE enderecos
          SET logradouro = COALESCE($1, logradouro),
              numero = COALESCE($2, numero),
              complemento = COALESCE($3, complemento),
              bairro = COALESCE($4, bairro),
              municipio_id = COALESCE($5, municipio_id),
              cep = COALESCE($6, cep),
              principal = COALESCE($7, principal),
              atualizado_em = NOW()
        WHERE id = $8 AND cliente_id = $9
        RETURNING id, logradouro, numero, complemento, bairro, municipio_id,
                  cep, principal`,
      [logradouro ?? null, numero ?? null, complemento ?? null, bairro ?? null, municipio_id ?? null, cep ?? null, principal ?? null, id, clienteId]
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
