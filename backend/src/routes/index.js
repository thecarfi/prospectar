const { Router } = require('express');
const authRoutes = require('../modules/auth/auth.routes');
const usuariosRoutes = require('../modules/usuarios/usuarios.routes');
const clientesRoutes = require('../modules/clientes/clientes.routes');
const localizacaoRoutes = require('../modules/localizacao/localizacao.routes');
const segmentosRoutes = require('../modules/segmentos/segmentos.routes');
const statusClientesRoutes = require('../modules/status_clientes/status_clientes.routes');
const cnaeRoutes = require('../modules/cnae/cnae.routes');
const interacoesGlobalRoutes = require('../modules/interacoes/interacoes.global.routes');
const programacoesRoutes = require('../modules/programacoes/programacoes.routes');
const papeisRoutes = require('../modules/papeis/papeis.routes');
const consultasRoutes = require('../modules/consultas/consultas.routes');
const monitoraRondoniaRoutes = require('../modules/monitora_rondonia/monitora-rondonia.routes');

const router = Router();

router.get('/health', (req, res) => {
  res.json({ status: 'ok' });
});

router.use('/auth', authRoutes);
router.use('/usuarios', usuariosRoutes);
router.use('/clientes', clientesRoutes);
router.use('/localizacao', localizacaoRoutes);
router.use('/segmentos', segmentosRoutes);
router.use('/status-clientes', statusClientesRoutes);
router.use('/cnae', cnaeRoutes);
router.use('/interacoes', interacoesGlobalRoutes);
router.use('/programacoes', programacoesRoutes);
router.use('/papeis', papeisRoutes);
router.use('/consultas', consultasRoutes);
router.use('/monitora-rondonia', monitoraRondoniaRoutes);

module.exports = router;
