const { Router } = require('express');
const { body, param, query } = require('express-validator');
const cotacoesController = require('./cotacoes.controller');
const authenticate = require('../../middleware/auth');
const requirePermission = require('../../middleware/rbac');
const validate = require('../../middleware/validate');

const router = Router();

router.use(authenticate);

const validarEntradaCotacao = [
  body('rota_id').isInt({ min: 1 }).withMessage('Rota obrigatória'),
  body('cliente_texto')
    .optional({ nullable: true })
    .trim()
    .isLength({ max: 160 })
    .withMessage('Cliente deve ter no máximo 160 caracteres'),
  body('cliente_id').optional({ nullable: true }).isInt().withMessage('Cliente inválido'),
  body('largura').optional({ nullable: true }).isFloat({ min: 0 }).withMessage('Largura inválida'),
  body('altura').optional({ nullable: true }).isFloat({ min: 0 }).withMessage('Altura inválida'),
  body('comprimento')
    .optional({ nullable: true })
    .isFloat({ min: 0 })
    .withMessage('Comprimento inválido'),
  body('valor_nf').isFloat({ gt: 0 }).withMessage('Valor NF deve ser maior que zero'),
  body('peso').isFloat({ min: 0 }).withMessage('Peso inválido'),
  body('rota').optional({ nullable: true }).isObject().withMessage('Rota (override) inválida'),
  body('rota.icms')
    .optional({ nullable: true })
    .isFloat({ min: 0, max: 1 })
    .withMessage('ICMS (override) deve ser um decimal entre 0 e 1'),
  body('rota.frete_minimo')
    .optional({ nullable: true })
    .isFloat({ min: 0 })
    .withMessage('Frete mínimo (override) inválido'),
  body('parametros').optional({ nullable: true }).isObject().withMessage('Parâmetros (override) inválidos'),
  body('parametros.*')
    .optional({ nullable: true })
    .isFloat({ min: 0 })
    .withMessage('Parâmetros (override) devem ser valores maiores ou iguais a zero'),
];

// =============================
// Rotas
// =============================
router.get('/rotas', requirePermission('cotacao:ver'), cotacoesController.listarRotas);

router.post(
  '/rotas',
  requirePermission('cotacao:configurar'),
  body('nome').trim().notEmpty().withMessage('Nome da rota obrigatório')
    .isLength({ max: 120 }).withMessage('Nome da rota deve ter no máximo 120 caracteres'),
  body('icms').isFloat({ min: 0, max: 1 }).withMessage('ICMS deve ser um decimal entre 0 e 1'),
  body('frete_minimo').isFloat({ min: 0 }).withMessage('Frete mínimo inválido'),
  validate,
  cotacoesController.criarRota
);

router.put(
  '/rotas/:id',
  requirePermission('cotacao:configurar'),
  param('id').isInt().withMessage('ID inválido'),
  body('nome').optional().trim().notEmpty().withMessage('Nome da rota obrigatório')
    .isLength({ max: 120 }).withMessage('Nome da rota deve ter no máximo 120 caracteres'),
  body('icms').optional().isFloat({ min: 0, max: 1 }).withMessage('ICMS deve ser um decimal entre 0 e 1'),
  body('frete_minimo').optional().isFloat({ min: 0 }).withMessage('Frete mínimo inválido'),
  validate,
  cotacoesController.atualizarRota
);

router.delete(
  '/rotas/:id',
  requirePermission('cotacao:configurar'),
  param('id').isInt().withMessage('ID inválido'),
  validate,
  cotacoesController.excluirRota
);

// =============================
// Generalidades
// =============================
router.get(
  '/generalidades',
  requirePermission('cotacao:ver'),
  cotacoesController.listarGeneralidades
);

router.put(
  '/generalidades/:id',
  requirePermission('cotacao:configurar'),
  param('id').isInt().withMessage('ID inválido'),
  body('valor_generalidade').isFloat({ min: 0 }).withMessage('Valor inválido'),
  validate,
  cotacoesController.atualizarGeneralidade
);

// =============================
// Cotações
// =============================
router.post(
  '/calcular',
  requirePermission('cotacao:ver'),
  ...validarEntradaCotacao,
  validate,
  cotacoesController.calcular
);

router.post(
  '/',
  requirePermission('cotacao:ver'),
  ...validarEntradaCotacao,
  validate,
  cotacoesController.criar
);

router.get(
  '/',
  requirePermission('cotacao:ver'),
  query('pagina').optional().isInt({ min: 1 }).withMessage('Página inválida'),
  query('limite').optional().isInt({ min: 1, max: 100 }).withMessage('Limite inválido'),
  query('rota_id').optional().isInt({ min: 1 }).withMessage('Rota inválida'),
  validate,
  cotacoesController.listar
);

router.get(
  '/:id',
  requirePermission('cotacao:ver'),
  param('id').isInt().withMessage('ID inválido'),
  validate,
  cotacoesController.obter
);

module.exports = router;
