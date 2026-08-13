const { pool } = require('../../config/db');

async function listar(req, res, next) {
  try {
    const { busca, subclasse, descricao_subclasse, secao, descricao_secao, divisao } =
      req.query;
    const params = [];
    const condicoes = [];

    if (busca) {
      params.push(`%${busca}%`);
      condicoes.push(
        `(subclasse ILIKE $${params.length} OR descricao_subclasse ILIKE $${params.length})`
      );
    }
    if (subclasse) {
      params.push(`%${subclasse}%`);
      condicoes.push(`subclasse ILIKE $${params.length}`);
    }
    if (descricao_subclasse) {
      params.push(`%${descricao_subclasse}%`);
      condicoes.push(`descricao_subclasse ILIKE $${params.length}`);
    }
    if (secao) {
      params.push(secao);
      condicoes.push(`secao = $${params.length}`);
    }
    if (descricao_secao) {
      params.push(`%${descricao_secao}%`);
      condicoes.push(`descricao_secao ILIKE $${params.length}`);
    }
    if (divisao) {
      params.push(divisao);
      condicoes.push(`divisao = $${params.length}`);
    }

    let sql = `SELECT secao, descricao_secao, divisao, descricao_divisao,
                      grupo, descricao_grupo, classe, descricao_classe,
                      subclasse, descricao_subclasse
                 FROM cnae`;
    if (condicoes.length > 0) {
      sql += ` WHERE ${condicoes.join(' AND ')}`;
    }
    sql += ' ORDER BY subclasse';

    const { rows } = await pool.query(sql, params);
    res.json(rows);
  } catch (err) {
    next(err);
  }
}

module.exports = { listar };
