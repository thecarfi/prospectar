const { Router } = require('express');
const { query, body } = require('express-validator');
const controller = require('./carteirizacao.controller');
const authenticate = require('../../middleware/auth');
const requirePermission = require('../../middleware/rbac');
const validate = require('../../middleware/validate');

const router = Router();

router.use(authenticate);

router.get(
  '/filtros',
  requirePermission('carteirizacao:ver'),
  controller.filtros
);

router.get(
  '/clientes',
  requirePermission('carteirizacao:ver'),
  query('nome_pagador').optional().isString().trim(),
  query('cnpj_pagador').optional().isString().trim(),
  query('carteira_responsavel').optional().isString().trim(),
  query('pagina').optional().isInt({ min: 1 }).withMessage('Pagina invalida'),
  query('limite').optional().isInt({ min: 1, max: 100 }).withMessage('Limite invalido'),
  validate,
  controller.clientes
);

router.put(
  '/clientes/carteira',
  requirePermission('carteirizacao:editar'),
  body('cnpj')
    .notEmpty()
    .withMessage('CNPJ obrigatorio')
    .isString()
    .trim(),
  body('nome_carteira')
    .notEmpty()
    .withMessage('Carteira obrigatoria')
    .isString()
    .trim(),
  validate,
  controller.atribuirCarteira
);

module.exports = router;