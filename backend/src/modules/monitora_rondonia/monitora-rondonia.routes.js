const { Router } = require('express');
const { query, param, body } = require('express-validator');
const controller = require('./monitora-rondonia.controller');
const authenticate = require('../../middleware/auth');
const requirePermission = require('../../middleware/rbac');
const validate = require('../../middleware/validate');

const router = Router();

router.use(authenticate);

router.get(
  '/filtros',
  requirePermission('monitora-rondonia:ver'),
  controller.filtros
);

router.get(
  '/documentos',
  requirePermission('monitora-rondonia:ver'),
  query('filial_destino').optional().isString().trim(),
  query('cidade_destinatario').optional().isString().trim(),
  query('documento').optional().isString().trim(),
  query('data_manifesto')
    .optional()
    .matches(/^\d{4}-\d{2}-\d{2}$/)
    .withMessage('Data deve estar no formato AAAA-MM-DD'),
  query('eh_vaptlog').optional().isIn(['S', 'N']).withMessage('Valor invalido'),
  query('pagina').optional().isInt({ min: 1 }).withMessage('Pagina invalida'),
  query('limite').optional().isInt({ min: 1, max: 100 }).withMessage('Limite invalido'),
  validate,
  controller.documentos
);

router.put(
  '/documentos/:documento/data-entrega',
  requirePermission('monitora-rondonia:editar'),
  param('documento').notEmpty().withMessage('Documento obrigatorio'),
  body('data_entrega')
    .matches(/^\d{4}-\d{2}-\d{2}$/)
    .withMessage('Data deve estar no formato AAAA-MM-DD'),
  body('eh_data_entrega_editada')
    .isIn(['S', 'N'])
    .withMessage('Valor invalido'),
  validate,
  controller.salvarDataEntrega
);

router.put(
  '/documentos/:documento/vaptlog',
  requirePermission('monitora-rondonia:editar'),
  param('documento').notEmpty().withMessage('Documento obrigatorio'),
  body('acao').isIn(['adicionar', 'remover']).withMessage('Acao invalida'),
  validate,
  controller.toggleVaptlog
);

module.exports = router;
