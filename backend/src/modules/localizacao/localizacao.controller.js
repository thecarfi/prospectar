const { pool } = require('../../config/db');

async function listarEstados(req, res, next) {
  try {
    const { rows } = await pool.query(
      'SELECT id, sigla, nome FROM estados ORDER BY sigla'
    );
    res.json(rows);
  } catch (err) {
    next(err);
  }
}

async function listarMunicipios(req, res, next) {
  try {
    const { rows } = await pool.query(
      `SELECT m.id, m.estado_id, e.sigla AS uf, m.nome
         FROM municipios m
         JOIN estados e ON e.id = m.estado_id
        ORDER BY e.sigla, m.nome`
    );
    res.json(rows);
  } catch (err) {
    next(err);
  }
}

module.exports = { listarEstados, listarMunicipios };
