const { Router } = require('express');
const { body, param } = require('express-validator');
const statusClientesController = require('./status_clientes.controller');
const authenticate = require('../../middleware/auth');
const requirePermission = require('../../middleware/rbac');
const validate = require('../../middleware/validate');

const router = Router();

router.use(authenticate);

router.get(
  '/',
  requirePermission('status_clientes:ver'),
  statusClientesController.listar
);

router.post(
  '/',
  requirePermission('status_clientes:criar'),
  body('nome').trim().notEmpty().withMessage('Nome obrigatório'),
  body('descricao').optional({ nullable: true }).trim(),
  body('cor')
    .optional({ nullable: true })
    .matches(/^#[0-9a-fA-F]{6}$/)
    .withMessage('Cor inválida'),
  validate,
  statusClientesController.criar
);

router.put(
  '/:id',
  requirePermission('status_clientes:editar'),
  param('id').isInt().withMessage('ID inválido'),
  body('nome').optional().trim().notEmpty().withMessage('Nome obrigatório'),
  body('descricao').optional({ nullable: true }).trim(),
  body('cor')
    .optional({ nullable: true })
    .matches(/^#[0-9a-fA-F]{6}$/)
    .withMessage('Cor inválida'),
  validate,
  statusClientesController.atualizar
);

router.delete(
  '/:id',
  requirePermission('status_clientes:excluir'),
  param('id').isInt().withMessage('ID inválido'),
  validate,
  statusClientesController.excluir
);

module.exports = router;
