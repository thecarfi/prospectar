const { registrarAcao } = require('./registros-acoes.service');

const MODULOS_PERMITIDOS = [
  'dashboard',
  'clientes',
  'interacoes',
  'programacoes',
  'monitora-rondonia',
  'carteirizacao',
  'cotacoes',
  'usuarios',
  'permissoes',
  'configuracoes',
];

async function registrarAcesso(req, res, next) {
  try {
    const { modulo, rota } = req.body;

    await registrarAcao({
      acao: 'acesso',
      usuarioId: req.user.id,
      dados: {
        modulo,
        rota: rota || null,
      },
    });

    res.status(204).send();
  } catch (err) {
    next(err);
  }
}

module.exports = { registrarAcesso, MODULOS_PERMITIDOS };
