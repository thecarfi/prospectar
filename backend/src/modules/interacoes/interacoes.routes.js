const { Router } = require('express');
const { body, param } = require('express-validator');
const interacoesController = require('./interacoes.controller');
const requirePermission = require('../../middleware/rbac');
const validate = require('../../middleware/validate');

const router = Router({ mergeParams: true });

router.get(
  '/',
  requirePermission('interacoes:ver'),
  interacoesController.listar
);

router.post(
  '/',
  requirePermission('interacoes:criar'),
  body('assunto').trim().notEmpty().withMessage('Assunto obrigatório'),
  body('tipo').optional().isIn(['ligacao', 'visita', 'anotacao', 'mensagem']).withMessage('Tipo inválido'),
  validate,
  interacoesController.criar
);

router.put(
  '/:id',
  requirePermission('interacoes:editar'),
  param('id').isInt().withMessage('ID inválido'),
  body('tipo').optional().isIn(['ligacao', 'visita', 'anotacao', 'mensagem']).withMessage('Tipo inválido'),
  validate,
  interacoesController.atualizar
);

router.delete(
  '/:id',
  requirePermission('interacoes:excluir'),
  param('id').isInt().withMessage('ID inválido'),
  validate,
  interacoesController.excluir
);

module.exports = router;
