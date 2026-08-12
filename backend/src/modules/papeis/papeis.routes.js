const { Router } = require('express');
const { body, param } = require('express-validator');
const papeisController = require('./papeis.controller');
const authenticate = require('../../middleware/auth');
const requirePermission = require('../../middleware/rbac');
const validate = require('../../middleware/validate');

const router = Router();

router.use(authenticate);

router.get(
  '/',
  requirePermission.requireAnyPermission(['permissoes:ver', 'usuarios:gerenciar']),
  papeisController.listar
);

router.get(
  '/permissoes',
  requirePermission('permissoes:ver'),
  papeisController.listarPermissoes
);

router.post(
  '/',
  requirePermission('permissoes:gerenciar'),
  body('nome')
    .trim()
    .matches(/^[a-z0-9_]{3,30}$/)
    .withMessage('Nome deve ter 3 a 30 caracteres (letras minúsculas, números ou underscore)'),
  body('descricao').optional().isString().withMessage('Descrição inválida'),
  body('permissao_ids').optional().isArray().withMessage('permissao_ids deve ser uma lista'),
  body('permissao_ids.*').isInt().withMessage('permissao_id inválido'),
  validate,
  papeisController.criar
);

router.put(
  '/:nome',
  requirePermission('permissoes:gerenciar'),
  param('nome').isString().withMessage('Nome inválido'),
  body('descricao').optional().isString().withMessage('Descrição inválida'),
  body('permissao_ids').optional().isArray().withMessage('permissao_ids deve ser uma lista'),
  body('permissao_ids.*').isInt().withMessage('permissao_id inválido'),
  validate,
  papeisController.atualizar
);

router.delete(
  '/:nome',
  requirePermission('permissoes:gerenciar'),
  param('nome').isString().withMessage('Nome inválido'),
  validate,
  papeisController.excluir
);

module.exports = router;
