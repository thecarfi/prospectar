const jwt = require('jsonwebtoken');
const { pool } = require('../config/db');
const ApiError = require('../utils/api-error');

async function authenticate(req, res, next) {
  try {
    const header = req.headers.authorization || '';
    const token = header.startsWith('Bearer ') ? header.slice(7) : null;

    if (!token) {
      throw new ApiError(401, 'Token não fornecido');
    }

    let payload;
    try {
      payload = jwt.verify(token, process.env.JWT_SECRET);
    } catch {
      throw new ApiError(401, 'Token inválido ou expirado');
    }

    const { rows } = await pool.query(
      'SELECT id, nome, email, papel, ativo FROM usuarios WHERE id = $1',
      [payload.sub]
    );
    const usuario = rows[0];

    if (!usuario || !usuario.ativo) {
      throw new ApiError(401, 'Usuário não encontrado ou inativo');
    }

    const { rows: permissoesRows } = await pool.query(
      `SELECT p.modulo || ':' || p.acao AS permissao
         FROM papel_permissoes pp
         JOIN permissoes p ON p.id = pp.permissao_id
        WHERE pp.papel = $1`,
      [usuario.papel]
    );

    const permissoes = permissoesRows.map((r) => r.permissao);
    if (usuario.papel === 'admin') {
      permissoes.push('*');
    }

    req.user = { ...usuario, permissoes };
    next();
  } catch (err) {
    next(err);
  }
}

module.exports = authenticate;
