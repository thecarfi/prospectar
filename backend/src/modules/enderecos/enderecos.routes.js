const { Router } = require('express');
const { body, param } = require('express-validator');
const enderecosController = require('./enderecos.controller');
const requirePermission = require('../../middleware/rbac');
const validate = require('../../middleware/validate');

const router = Router({ mergeParams: true });

router.get(
  '/',
  requirePermission('enderecos:ver'),
  enderecosController.listar
);

router.post(
  '/',
  requirePermission('enderecos:criar'),
  body('logradouro').trim().notEmpty().withMessage('Logradouro obrigatório'),
  validate,
  enderecosController.criar
);

router.put(
  '/:id',
  requirePermission('enderecos:editar'),
  param('id').isInt().withMessage('ID inválido'),
  validate,
  enderecosController.atualizar
);

router.delete(
  '/:id',
  requirePermission('enderecos:excluir'),
  param('id').isInt().withMessage('ID inválido'),
  validate,
  enderecosController.excluir
);

module.exports = router;
