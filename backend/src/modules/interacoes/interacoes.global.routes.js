const { Router } = require('express');
const { body, param, query } = require('express-validator');
const interacoesGlobalController = require('./interacoes.global.controller');
const authenticate = require('../../middleware/auth');
const requirePermission = require('../../middleware/rbac');
const validate = require('../../middleware/validate');

const router = Router();

router.use(authenticate);

const TIPOS_VALIDOS = ['ligacao', 'visita', 'anotacao', 'mensagem'];

router.get(
  '/',
  requirePermission('interacoes:ver'),
  query('pagina').optional().isInt({ min: 1 }).withMessage('Página inválida'),
  query('limite').optional().isInt({ min: 1, max: 100 }).withMessage('Limite inválido'),
  query('tipo').optional().isIn(TIPOS_VALIDOS).withMessage('Tipo inválido'),
  validate,
  interacoesGlobalController.listar
);

router.get(
  '/filtros',
  requirePermission('interacoes:ver'),
  interacoesGlobalController.filtros
);

router.post(
  '/',
  requirePermission('interacoes:criar'),
  body('cliente_id').optional({ nullable: true }).isInt().withMessage('Cliente inválido'),
  body('cliente_nome')
    .optional({ nullable: true })
    .trim()
    .isLength({ min: 2, max: 160 })
    .withMessage('Nome do cliente deve ter entre 2 e 160 caracteres'),
  body().custom((valor) => {
    const temId = valor.cliente_id != null;
    const temNome = !!(valor.cliente_nome && String(valor.cliente_nome).trim());
    if (temId === temNome) {
      throw new Error('Informe o cliente existente ou o nome de um novo cliente');
    }
    return true;
  }),
  body('assunto').trim().notEmpty().withMessage('Assunto obrigatório'),
  body('tipo').optional().isIn(TIPOS_VALIDOS).withMessage('Tipo inválido'),
  validate,
  interacoesGlobalController.criar
);

router.put(
  '/:id',
  requirePermission('interacoes:editar'),
  param('id').isInt().withMessage('ID inválido'),
  body('tipo').optional().isIn(TIPOS_VALIDOS).withMessage('Tipo inválido'),
  validate,
  interacoesGlobalController.atualizar
);

router.delete(
  '/:id',
  requirePermission('interacoes:excluir'),
  param('id').isInt().withMessage('ID inválido'),
  validate,
  interacoesGlobalController.excluir
);

module.exports = router;
