const { Router } = require('express');
const { body } = require('express-validator');
const registrosAcoesController = require('./registros-acoes.controller');
const authenticate = require('../../middleware/auth');
const validate = require('../../middleware/validate');

const router = Router();

router.use(authenticate);

router.post(
  '/acesso',
  body('modulo')
    .trim()
    .notEmpty()
    .withMessage('Módulo obrigatório')
    .isIn(registrosAcoesController.MODULOS_PERMITIDOS)
    .withMessage('Módulo inválido'),
  body('rota')
    .optional({ nullable: true })
    .trim()
    .isLength({ max: 200 })
    .withMessage('Rota deve ter no máximo 200 caracteres'),
  validate,
  registrosAcoesController.registrarAcesso
);

module.exports = router;
