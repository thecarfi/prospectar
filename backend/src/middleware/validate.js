const { validationResult } = require('express-validator');
const ApiError = require('../utils/api-error');

function validate(req, res, next) {
  const erros = validationResult(req);
  if (!erros.isEmpty()) {
    const mensagem = erros.array()[0].msg;
    return next(new ApiError(400, mensagem));
  }
  next();
}

module.exports = validate;
