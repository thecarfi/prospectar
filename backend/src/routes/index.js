const { Router } = require('express');
const authRoutes = require('../modules/auth/auth.routes');
const usuariosRoutes = require('../modules/usuarios/usuarios.routes');
const clientesRoutes = require('../modules/clientes/clientes.routes');
const localizacaoRoutes = require('../modules/localizacao/localizacao.routes');
const segmentosRoutes = require('../modules/segmentos/segmentos.routes');

const router = Router();

router.get('/health', (req, res) => {
  res.json({ status: 'ok' });
});

router.use('/auth', authRoutes);
router.use('/usuarios', usuariosRoutes);
router.use('/clientes', clientesRoutes);
router.use('/localizacao', localizacaoRoutes);
router.use('/segmentos', segmentosRoutes);

module.exports = router;
