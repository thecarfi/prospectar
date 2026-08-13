const { Router } = require('express');
const { body, param } = require('express-validator');
const clienteCnaeController = require('./cliente-cnae.controller');
const requirePermission = require('../../middleware/rbac');
const validate = require('../../middleware/validate');

const router = Router({ mergeParams: true });

router.get(
  '/',
  requirePermission('cnae:ver'),
  clienteCnaeController.listar
);

router.post(
  '/',
  requirePermission('cnae:criar'),
  body('subclasse').trim().notEmpty().withMessage('Subclasse CNAE obrigatória'),
  body('principal').optional().isBoolean().withMessage('Indicador principal inválido'),
  validate,
  clienteCnaeController.criar
);

router.put(
  '/:subclasse',
  requirePermission('cnae:editar'),
  param('subclasse').trim().notEmpty().withMessage('Subclasse CNAE inválida'),
  body('principal').optional().isBoolean().withMessage('Indicador principal inválido'),
  validate,
  clienteCnaeController.atualizar
);

router.delete(
  '/:subclasse',
  requirePermission('cnae:excluir'),
  param('subclasse').trim().notEmpty().withMessage('Subclasse CNAE inválida'),
  validate,
  clienteCnaeController.excluir
);

module.exports = router;
