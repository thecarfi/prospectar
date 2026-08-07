const { Router } = require('express');
const { body } = require('express-validator');
const authController = require('./auth.controller');
const authenticate = require('../../middleware/auth');
const validate = require('../../middleware/validate');

const router = Router();

router.post(
  '/login',
  body('email').isEmail().withMessage('E-mail inválido').normalizeEmail(),
  body('senha').notEmpty().withMessage('Senha obrigatória'),
  validate,
  authController.login
);

router.get('/me', authenticate, authController.me);

module.exports = router;
