const ApiError = require('../utils/api-error');

function requirePermission(permissao) {
  return (req, res, next) => {
    const usuario = req.user;

    if (!usuario) {
      return next(new ApiError(401, 'Não autenticado'));
    }

    if (
      usuario.papel === 'admin' ||
      usuario.permissoes.includes('*') ||
      usuario.permissoes.includes(permissao)
    ) {
      return next();
    }

    return next(new ApiError(403, `Permissão necessária: ${permissao}`));
  };
}

module.exports = requirePermission;
