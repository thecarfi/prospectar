const { pool } = require('../../config/db');
const ApiError = require('../../utils/api-error');

async function listar(req, res, next) {
  try {
    const { busca } = req.query;
    const params = [];

    let sql = 'SELECT id, nome, descricao, cor FROM status_clientes';
    if (busca) {
      params.push(`%${busca}%`);
      sql += ' WHERE nome ILIKE $1';
    }
    sql += ' ORDER BY nome';

    const { rows } = await pool.query(sql, params);
    res.json(rows);
  } catch (err) {
    next(err);
  }
}

async function criar(req, res, next) {
  try {
    const { nome, descricao, cor } = req.body;

    const { rows } = await pool.query(
      `INSERT INTO status_clientes (nome, descricao, cor)
       VALUES ($1, $2, COALESCE($3, '#757575'))
       RETURNING id, nome, descricao, cor`,
      [nome.trim(), descricao || null, cor || null]
    );

    res.status(201).json(rows[0]);
  } catch (err) {
    if (err.code === '23505') {
      return next(new ApiError(409, 'Status já cadastrado'));
    }
    next(err);
  }
}

async function atualizar(req, res, next) {
  try {
    const { id } = req.params;
    const { nome, descricao, cor } = req.body;

    const { rows } = await pool.query(
      `UPDATE status_clientes
          SET nome = COALESCE($2, nome),
              descricao = COALESCE($3, descricao),
              cor = COALESCE($4, cor)
        WHERE id = $1
        RETURNING id, nome, descricao, cor`,
      [id, nome ? nome.trim() : null, descricao ?? null, cor ?? null]
    );

    if (!rows[0]) {
      throw new ApiError(404, 'Status não encontrado');
    }

    res.json(rows[0]);
  } catch (err) {
    if (err.code === '23505') {
      return next(new ApiError(409, 'Status já cadastrado'));
    }
    next(err);
  }
}

async function excluir(req, res, next) {
  try {
    const { id } = req.params;

    const { rows: emUso } = await pool.query(
      'SELECT 1 FROM clientes WHERE status_id = $1 LIMIT 1',
      [id]
    );
    if (emUso.length) {
      throw new ApiError(
        400,
        'O status está vinculado a clientes e não pode ser excluído'
      );
    }

    const { rowCount } = await pool.query(
      'DELETE FROM status_clientes WHERE id = $1',
      [id]
    );

    if (rowCount === 0) {
      throw new ApiError(404, 'Status não encontrado');
    }

    res.status(204).send();
  } catch (err) {
    next(err);
  }
}

module.exports = { listar, criar, atualizar, excluir };
