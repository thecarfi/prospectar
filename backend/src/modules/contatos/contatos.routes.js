const { Router } = require('express');
const { body, param } = require('express-validator');
const contatosController = require('./contatos.controller');
const requirePermission = require('../../middleware/rbac');
const validate = require('../../middleware/validate');

const router = Router({ mergeParams: true });

router.get(
  '/',
  requirePermission('contatos:ver'),
  contatosController.listar
);

router.post(
  '/',
  requirePermission('contatos:criar'),
  body('nome').trim().notEmpty().withMessage('Nome obrigatório'),
  body('email').optional({ nullable: true }).isEmail().withMessage('E-mail inválido'),
  validate,
  contatosController.criar
);

router.put(
  '/:id',
  requirePermission('contatos:editar'),
  param('id').isInt().withMessage('ID inválido'),
  body('email').optional({ nullable: true }).isEmail().withMessage('E-mail inválido'),
  validate,
  contatosController.atualizar
);

router.delete(
  '/:id',
  requirePermission('contatos:excluir'),
  param('id').isInt().withMessage('ID inválido'),
  validate,
  contatosController.excluir
);

module.exports = router;
