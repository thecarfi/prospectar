const bcrypt = require('bcryptjs');
const { pool } = require('../../config/db');
const ApiError = require('../../utils/api-error');

const CAMPOS_SAIDA = 'id, nome, email, papel, ativo, criado_em, atualizado_em';

async function listar(req, res, next) {
  try {
    const { rows } = await pool.query(
      `SELECT ${CAMPOS_SAIDA} FROM usuarios ORDER BY nome`
    );
    res.json(rows);
  } catch (err) {
    next(err);
  }
}

async function detalhar(req, res, next) {
  try {
    const { rows } = await pool.query(
      `SELECT ${CAMPOS_SAIDA} FROM usuarios WHERE id = $1`,
      [req.params.id]
    );
    if (!rows[0]) {
      throw new ApiError(404, 'Usuário não encontrado');
    }
    res.json(rows[0]);
  } catch (err) {
    next(err);
  }
}

async function criar(req, res, next) {
  try {
    const { nome, email, senha, papel = 'visualizador', ativo = true } = req.body;
    const senhaHash = await bcrypt.hash(senha, 10);

    const { rows } = await pool.query(
      `INSERT INTO usuarios (nome, email, senha_hash, papel, ativo)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING ${CAMPOS_SAIDA}`,
      [nome, email.toLowerCase(), senhaHash, papel, ativo]
    );

    res.status(201).json(rows[0]);
  } catch (err) {
    if (err.code === '23505') {
      return next(new ApiError(409, 'E-mail já cadastrado'));
    }
    next(err);
  }
}

async function atualizar(req, res, next) {
  try {
    const { id } = req.params;
    const { nome, email, papel, ativo, senha } = req.body;

    const { rows: existente } = await pool.query(
      'SELECT id FROM usuarios WHERE id = $1',
      [id]
    );
    if (!existente[0]) {
      throw new ApiError(404, 'Usuário não encontrado');
    }

    let senhaHash = null;
    if (senha) {
      senhaHash = await bcrypt.hash(senha, 10);
    }

    const { rows } = await pool.query(
      `UPDATE usuarios
          SET nome = COALESCE($1, nome),
              email = COALESCE($2, email),
              papel = COALESCE($3, papel),
              ativo = COALESCE($4, ativo),
              senha_hash = COALESCE($5, senha_hash),
              atualizado_em = NOW()
        WHERE id = $6
        RETURNING ${CAMPOS_SAIDA}`,
      [
        nome ?? null,
        email ? email.toLowerCase() : null,
        papel ?? null,
        ativo ?? null,
        senhaHash,
        id,
      ]
    );

    res.json(rows[0]);
  } catch (err) {
    if (err.code === '23505') {
      return next(new ApiError(409, 'E-mail já cadastrado'));
    }
    next(err);
  }
}

async function excluir(req, res, next) {
  try {
    const { id } = req.params;

    if (Number(id) === req.user.id) {
      throw new ApiError(400, 'Você não pode excluir o próprio usuário');
    }

    const { rowCount } = await pool.query(
      'DELETE FROM usuarios WHERE id = $1',
      [id]
    );

    if (rowCount === 0) {
      throw new ApiError(404, 'Usuário não encontrado');
    }

    res.status(204).send();
  } catch (err) {
    next(err);
  }
}

module.exports = { listar, detalhar, criar, atualizar, excluir };
