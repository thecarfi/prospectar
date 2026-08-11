const { Router } = require('express');
const localizacaoController = require('./localizacao.controller');
const authenticate = require('../../middleware/auth');
const requirePermission = require('../../middleware/rbac');

const router = Router();

router.use(authenticate);

router.get(
  '/estados',
  requirePermission('localizacao:ver'),
  localizacaoController.listarEstados
);

router.get(
  '/municipios',
  requirePermission('localizacao:ver'),
  localizacaoController.listarMunicipios
);

module.exports = router;
