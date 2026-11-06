const { pool } = require('../../config/db');
const ApiError = require('../../utils/api-error');

const ACOES_VALIDAS = ['acesso', 'insert', 'update', 'delete', 'select'];

async function registrarAcao({ acao, usuarioId, dados = null }) {
  if (!ACOES_VALIDAS.includes(acao)) {
    throw new ApiError(400, 'Ação de registro inválida');
  }

  await pool.query(
    `INSERT INTO registros_acoes (acao, usuario_id, dados)
     VALUES ($1, $2, $3)`,
    [acao, usuarioId, dados === null ? null : JSON.stringify(dados)]
  );
}

module.exports = { registrarAcao, ACOES_VALIDAS };
