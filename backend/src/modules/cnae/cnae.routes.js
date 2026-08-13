const { Router } = require('express');
const { query } = require('express-validator');
const cnaeController = require('./cnae.controller');
const authenticate = require('../../middleware/auth');
const requirePermission = require('../../middleware/rbac');
const validate = require('../../middleware/validate');

const router = Router();

router.use(authenticate);

router.get(
  '/',
  requirePermission('cnae:ver'),
  query('busca').optional().trim(),
  query('subclasse').optional().trim(),
  query('descricao_subclasse').optional().trim(),
  query('secao').optional().trim(),
  query('descricao_secao').optional().trim(),
  query('divisao').optional().trim(),
  validate,
  cnaeController.listar
);

module.exports = router;
