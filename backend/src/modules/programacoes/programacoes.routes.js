const { Router } = require('express');
const { body, param, query } = require('express-validator');
const programacoesController = require('./programacoes.controller');
const authenticate = require('../../middleware/auth');
const requirePermission = require('../../middleware/rbac');
const validate = require('../../middleware/validate');

const router = Router();

router.use(authenticate);

const STATUS_VALIDOS = ['pendente', 'em_andamento', 'concluida', 'cancelada'];

router.get(
  '/',
  requirePermission('programacoes:ver'),
  query('pagina').optional().isInt({ min: 1 }).withMessage('Página inválida'),
  query('limite').optional().isInt({ min: 1, max: 100 }).withMessage('Limite inválido'),
  query('status').optional().isIn(STATUS_VALIDOS).withMessage('Status inválido'),
  validate,
  programacoesController.listar
);

router.get(
  '/:id',
  requirePermission('programacoes:ver'),
  param('id').isInt().withMessage('ID inválido'),
  validate,
  programacoesController.obter
);

router.post(
  '/',
  requirePermission('programacoes:criar'),
  body('titulo').trim().notEmpty().withMessage('Título obrigatório'),
  body('data_inicio').isISO8601().withMessage('Data início obrigatória'),
  body('data_fim').isISO8601().withMessage('Data fim obrigatória'),
  body('municipio_id').optional({ nullable: true }).isInt().withMessage('Município inválido'),
  body('regiao').optional({ nullable: true }).trim().isLength({ max: 120 }).withMessage('Região deve ter no máximo 120 caracteres'),
  body('descricao').optional({ nullable: true }).trim(),
  body('cliente_ids').optional().isArray().withMessage('Lista de clientes inválida'),
  body('cliente_ids.*').optional().isInt().withMessage('ID de cliente inválido'),
  validate,
  programacoesController.criar
);

router.put(
  '/:id',
  requirePermission('programacoes:editar'),
  param('id').isInt().withMessage('ID inválido'),
  body('titulo').optional().trim().notEmpty().withMessage('Título obrigatório'),
  body('data_inicio').optional().isISO8601().withMessage('Data início inválida'),
  body('data_fim').optional().isISO8601().withMessage('Data fim inválida'),
  body('municipio_id').optional({ nullable: true }).isInt().withMessage('Município inválido'),
  body('regiao').optional({ nullable: true }).trim().isLength({ max: 120 }).withMessage('Região deve ter no máximo 120 caracteres'),
  body('descricao').optional({ nullable: true }).trim(),
  validate,
  programacoesController.atualizar
);

router.delete(
  '/:id',
  requirePermission('programacoes:excluir'),
  param('id').isInt().withMessage('ID inválido'),
  validate,
  programacoesController.excluir
);

router.patch(
  '/:id/status',
  requirePermission('programacoes:editar'),
  param('id').isInt().withMessage('ID inválido'),
  body('status').isIn(STATUS_VALIDOS).withMessage('Status inválido'),
  validate,
  programacoesController.alterarStatus
);

router.post(
  '/:id/concluir',
  requirePermission('programacoes:editar'),
  param('id').isInt().withMessage('ID inválido'),
  validate,
  programacoesController.concluir
);

router.post(
  '/:id/clientes',
  requirePermission('programacoes:criar'),
  param('id').isInt().withMessage('ID inválido'),
  body('cliente_id').isInt().withMessage('Cliente inválido'),
  validate,
  programacoesController.adicionarCliente
);

router.delete(
  '/:id/clientes/:clienteId',
  requirePermission('programacoes:editar'),
  param('id').isInt().withMessage('ID inválido'),
  param('clienteId').isInt().withMessage('Cliente inválido'),
  validate,
  programacoesController.removerCliente
);

module.exports = router;
