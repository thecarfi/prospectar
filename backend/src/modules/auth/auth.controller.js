const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { pool } = require('../../config/db');
const ApiError = require('../../utils/api-error');

async function login(req, res, next) {
  try {
    const { email, senha } = req.body;

    const { rows } = await pool.query(
      'SELECT * FROM usuarios WHERE email = $1',
      [email.toLowerCase()]
    );
    const usuario = rows[0];

    if (!usuario || !usuario.ativo) {
      throw new ApiError(401, 'Credenciais inválidas');
    }

    const senhaOk = await bcrypt.compare(senha, usuario.senha_hash);
    if (!senhaOk) {
      throw new ApiError(401, 'Credenciais inválidas');
    }

    const token = jwt.sign(
      { sub: usuario.id, papel: usuario.papel },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN || '8h' }
    );

    res.json({
      token,
      usuario: {
        id: usuario.id,
        nome: usuario.nome,
        email: usuario.email,
        papel: usuario.papel,
      },
    });
  } catch (err) {
    next(err);
  }
}

async function me(req, res) {
  res.json({ usuario: req.user });
}

module.exports = { login, me };
