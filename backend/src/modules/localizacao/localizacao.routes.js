const { Router } = require('express');
const localizacaoController = require('./localizacao.controller');
const authenticate = require('../../middleware/auth');

const router = Router();

router.use(authenticate);

router.get('/estados', localizacaoController.listarEstados);

router.get('/municipios', localizacaoController.listarMunicipios);

module.exports = router;
