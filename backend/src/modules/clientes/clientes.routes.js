const { Router } = require('express');
const { body, param } = require('express-validator');
const clientesController = require('./clientes.controller');
const contatosRoutes = require('../contatos/contatos.routes');
const enderecosRoutes = require('../enderecos/enderecos.routes');
const interacoesRoutes = require('../interacoes/interacoes.routes');
const authenticate = require('../../middleware/auth');
const requirePermission = require('../../middleware/rbac');
const validate = require('../../middleware/validate');

const router = Router();

router.use(authenticate);

router.get(
  '/',
  requirePermission('clientes:ver'),
  clientesController.listar
);

router.get(
  '/estatisticas',
  requirePermission('clientes:ver'),
  clientesController.estatisticas
);

router.get(
  '/:id',
  requirePermission('clientes:ver'),
  param('id').isInt().withMessage('ID inválido'),
  validate,
  clientesController.detalhar
);

router.post(
  '/',
  requirePermission('clientes:criar'),
  body('nome').trim().notEmpty().withMessage('Nome obrigatório'),
  body('cpf_cnpj').optional({ nullable: true }).trim(),
  body('municipio_id').optional().isInt().withMessage('Município inválido'),
  body('status').optional().isIn(['ativo', 'inativo', 'prospect']).withMessage('Status inválido'),
  validate,
  clientesController.criar
);

router.put(
  '/:id',
  requirePermission('clientes:editar'),
  param('id').isInt().withMessage('ID inválido'),
  body('municipio_id').optional().isInt().withMessage('Município inválido'),
  body('status').optional().isIn(['ativo', 'inativo', 'prospect']).withMessage('Status inválido'),
  validate,
  clientesController.atualizar
);

router.delete(
  '/:id',
  requirePermission('clientes:excluir'),
  param('id').isInt().withMessage('ID inválido'),
  validate,
  clientesController.excluir
);

router.use('/:clienteId/contatos', contatosRoutes);
router.use('/:clienteId/enderecos', enderecosRoutes);
router.use('/:clienteId/interacoes', interacoesRoutes);

module.exports = router;
