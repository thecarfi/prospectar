function notFound(req, res, next) {
  res.status(404).json({ message: 'Rota não encontrada' });
}

function errorHandler(err, req, res, next) {
  if (res.headersSent) {
    return next(err);
  }

  console.error(err);

  const status = err.status || 500;

  if (status === 500) {
    return res.status(500).json({ message: 'Erro interno do servidor' });
  }

  res.status(status).json({ message: err.message, ...(err.data ? { data: err.data } : {}) });
}

module.exports = { notFound, errorHandler };
