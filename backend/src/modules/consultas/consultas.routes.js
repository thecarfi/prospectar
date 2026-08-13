const { Router } = require('express');
const { param } = require('express-validator');
const consultasController = require('./consultas.controller');
const authenticate = require('../../middleware/auth');
const requirePermission = require('../../middleware/rbac');
const validate = require('../../middleware/validate');

const router = Router();

router.use(authenticate);

router.get(
  '/cnpj/:numero',
  requirePermission('clientes:ver'),
  param('numero')
    .isNumeric()
    .withMessage('CNPJ inválido')
    .isLength({ min: 14, max: 14 })
    .withMessage('CNPJ inválido'),
  validate,
  consultasController.consultarCnpj
);

module.exports = router;
