const { pool } = require('../../config/db');
const ApiError = require('../../utils/api-error');

async function listar(req, res, next) {
  try {
    const { busca } = req.query;
    const params = [];

    let sql = 'SELECT id, nome, descricao FROM segmentos';
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
    const { nome, descricao } = req.body;

    const { rows } = await pool.query(
      `INSERT INTO segmentos (nome, descricao)
       VALUES ($1, $2)
       RETURNING id, nome, descricao`,
      [nome.trim(), descricao || null]
    );

    res.status(201).json(rows[0]);
  } catch (err) {
    if (err.code === '23505') {
      return next(new ApiError(409, 'Segmento já cadastrado'));
    }
    next(err);
  }
}

async function atualizar(req, res, next) {
  try {
    const { id } = req.params;
    const { nome, descricao } = req.body;

    const { rows } = await pool.query(
      `UPDATE segmentos
          SET nome = COALESCE($2, nome),
              descricao = COALESCE($3, descricao)
        WHERE id = $1
        RETURNING id, nome, descricao`,
      [id, nome ? nome.trim() : null, descricao ?? null]
    );

    if (!rows[0]) {
      throw new ApiError(404, 'Segmento não encontrado');
    }

    res.json(rows[0]);
  } catch (err) {
    if (err.code === '23505') {
      return next(new ApiError(409, 'Segmento já cadastrado'));
    }
    next(err);
  }
}

async function excluir(req, res, next) {
  try {
    const { id } = req.params;

    const { rowCount } = await pool.query(
      'DELETE FROM segmentos WHERE id = $1',
      [id]
    );

    if (rowCount === 0) {
      throw new ApiError(404, 'Segmento não encontrado');
    }

    res.status(204).send();
  } catch (err) {
    next(err);
  }
}

module.exports = { listar, criar, atualizar, excluir };
