const BASE_URL = 'https://publica.cnpj.ws/cnpj/';

async function consultarCnpj(req, res, next) {
  try {
    const numero = req.params.numero;
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 10000);

    let upstream;
    try {
      upstream = await fetch(`${BASE_URL}${numero}`, {
        signal: controller.signal,
        headers: { Accept: 'application/json' },
      });
    } catch (err) {
      if (err.name === 'AbortError') {
        return res.json({
          status: 500,
          titulo: 'Erro ao consultar CNPJ',
          detalhes: 'A consulta excedeu o tempo limite.',
          validacao: [],
        });
      }
      return res.json({
        status: 500,
        titulo: 'Erro ao consultar CNPJ',
        detalhes: 'Não foi possível acessar o serviço externo.',
        validacao: [],
      });
    } finally {
      clearTimeout(timeout);
    }

    let body;
    try {
      body = await upstream.json();
    } catch {
      body = {
        status: 500,
        titulo: 'Erro ao consultar CNPJ',
        detalhes: 'Resposta inesperada do serviço externo.',
        validacao: [],
      };
    }

    res.json(body);
  } catch (err) {
    next(err);
  }
}

module.exports = { consultarCnpj };
