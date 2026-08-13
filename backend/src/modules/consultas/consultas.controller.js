const { consultarCnpjWs } = require('../../utils/consulta-cnpj');

async function consultarCnpj(req, res, next) {
  try {
    const numero = req.params.numero;
    const body = await consultarCnpjWs(numero);
    res.json(body);
  } catch (err) {
    next(err);
  }
}

module.exports = { consultarCnpj };
