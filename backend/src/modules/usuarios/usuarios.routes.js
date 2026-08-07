const { Router } = require('express');
const { body, param } = require('express-validator');
const usuariosController = require('./usuarios.controller');
const authenticate = require('../../middleware/auth');
const requirePermission = require('../../middleware/rbac');
const validate = require('../../middleware/validate');

const router = Router();

router.use(authenticate);

router.get(
  '/',
  requirePermission('usuarios:ver'),
  usuariosController.listar
);

router.get(
  '/:id',
  requirePermission('usuarios:ver'),
  param('id').isInt().withMessage('ID inválido'),
  validate,
  usuariosController.detalhar
);

router.post(
  '/',
  requirePermission('usuarios:gerenciar'),
  body('nome').trim().notEmpty().withMessage('Nome obrigatório'),
  body('email').isEmail().withMessage('E-mail inválido'),
  body('senha').isLength({ min: 6 }).withMessage('Senha deve ter no mínimo 6 caracteres'),
  body('papel').optional().isIn(['admin', 'operador', 'visualizador']).withMessage('Papel inválido'),
  validate,
  usuariosController.criar
);

router.put(
  '/:id',
  requirePermission('usuarios:gerenciar'),
  param('id').isInt().withMessage('ID inválido'),
  body('email').optional().isEmail().withMessage('E-mail inválido'),
  body('papel').optional().isIn(['admin', 'operador', 'visualizador']).withMessage('Papel inválido'),
  body('senha').optional().isLength({ min: 6 }).withMessage('Senha deve ter no mínimo 6 caracteres'),
  validate,
  usuariosController.atualizar
);

router.delete(
  '/:id',
  requirePermission('usuarios:gerenciar'),
  param('id').isInt().withMessage('ID inválido'),
  validate,
  usuariosController.excluir
);

module.exports = router;
