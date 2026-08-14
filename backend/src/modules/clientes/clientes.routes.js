const { Router } = require('express');
const { body, param } = require('express-validator');
const clientesController = require('./clientes.controller');
const contatosRoutes = require('../contatos/contatos.routes');
const enderecosRoutes = require('../enderecos/enderecos.routes');
const interacoesRoutes = require('../interacoes/interacoes.routes');
const clienteCnaeRoutes = require('../cnae/cliente-cnae.routes');
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
  body('logradouro').optional().trim(),
  body('numero').optional().trim(),
  body('complemento').optional().trim(),
  body('bairro').optional().trim(),
  body('cep').optional().trim(),
  body('segmento_ids').optional().isArray().withMessage('Segmentos inválidos'),
  body('segmento_ids.*').optional().isInt().withMessage('Segmento inválido'),
  body('cnaes').optional().isArray().withMessage('CNAEs inválidos'),
  body('cnaes.*.subclasse').optional().isString().withMessage('Subclasse CNAE inválida'),
  body('cnaes.*.principal').optional().isBoolean().withMessage('Indicador principal inválido'),
  body('contatos').optional().isArray().withMessage('Contatos inválidos'),
  body('contatos.*.nome').optional().trim(),
  body('contatos.*.email').optional().trim(),
  body('contatos.*.telefone').optional().trim(),
  body('contatos.*.cargo').optional().trim(),
  body('status_id').optional().isInt().withMessage('Status inválido'),
  validate,
  clientesController.criar
);

router.post(
  '/from-cnpj',
  requirePermission('clientes:criar'),
  body('cnpj')
    .trim()
    .custom((valor) => {
      const digitos = String(valor || '').replace(/\D/g, '');
      return digitos.length === 14;
    })
    .withMessage('CNPJ inválido'),
  body('status_id').optional().isInt().withMessage('Status inválido'),
  body('segmento_ids').optional().isArray().withMessage('Segmentos inválidos'),
  body('segmento_ids.*').optional().isInt().withMessage('Segmento inválido'),
  body('observacoes').optional().trim(),
  validate,
  clientesController.criarPorCnpj
);

router.put(
  '/:id',
  requirePermission('clientes:editar'),
  param('id').isInt().withMessage('ID inválido'),
  body('municipio_id').optional().isInt().withMessage('Município inválido'),
  body('logradouro').optional().trim(),
  body('numero').optional().trim(),
  body('complemento').optional().trim(),
  body('bairro').optional().trim(),
  body('cep').optional().trim(),
  body('segmento_ids').optional().isArray().withMessage('Segmentos inválidos'),
  body('segmento_ids.*').optional().isInt().withMessage('Segmento inválido'),
  body('cnaes').optional().isArray().withMessage('CNAEs inválidos'),
  body('cnaes.*.subclasse').optional().isString().withMessage('Subclasse CNAE inválida'),
  body('cnaes.*.principal').optional().isBoolean().withMessage('Indicador principal inválido'),
  body('contatos').optional().isArray().withMessage('Contatos inválidos'),
  body('contatos.*.nome').optional().trim(),
  body('contatos.*.email').optional().trim(),
  body('contatos.*.telefone').optional().trim(),
  body('contatos.*.cargo').optional().trim(),
  body('status_id').optional().isInt().withMessage('Status inválido'),
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
router.use('/:clienteId/cnaes', clienteCnaeRoutes);

module.exports = router;
