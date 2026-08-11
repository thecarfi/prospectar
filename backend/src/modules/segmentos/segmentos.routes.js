const { Router } = require('express');
const { body, param } = require('express-validator');
const segmentosController = require('./segmentos.controller');
const authenticate = require('../../middleware/auth');
const requirePermission = require('../../middleware/rbac');
const validate = require('../../middleware/validate');

const router = Router();

router.use(authenticate);

router.get(
  '/',
  requirePermission('segmentos:ver'),
  segmentosController.listar
);

router.post(
  '/',
  requirePermission('segmentos:criar'),
  body('nome').trim().notEmpty().withMessage('Nome obrigatório'),
  body('descricao').optional({ nullable: true }).trim(),
  validate,
  segmentosController.criar
);

router.put(
  '/:id',
  requirePermission('segmentos:editar'),
  param('id').isInt().withMessage('ID inválido'),
  body('nome').optional().trim().notEmpty().withMessage('Nome obrigatório'),
  body('descricao').optional({ nullable: true }).trim(),
  validate,
  segmentosController.atualizar
);

router.delete(
  '/:id',
  requirePermission('segmentos:excluir'),
  param('id').isInt().withMessage('ID inválido'),
  validate,
  segmentosController.excluir
);

module.exports = router;
