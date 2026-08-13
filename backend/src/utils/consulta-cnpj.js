const env = require('../config/env');

const BASE_URL = 'https://publica.cnpj.ws/cnpj/';

const TENTATIVAS = Math.max(1, env.cnpjWsTentativas);
const TIMEOUT_MS = Math.max(1000, env.cnpjWsTimeoutMs);
const BACKOFF_MS = 1000;

function respostaErro(status, detalhes) {
  return {
    status,
    titulo: 'Erro ao consultar CNPJ',
    detalhes,
    validacao: [],
  };
}

async function buscar(numero, signal) {
  return fetch(`${BASE_URL}${numero}`, {
    signal,
    headers: { Accept: 'application/json' },
  });
}

async function consultarCnpjWs(numero) {
  for (let tentativa = 1; tentativa <= TENTATIVAS; tentativa++) {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), TIMEOUT_MS);

    let upstream;
    try {
      upstream = await buscar(numero, controller.signal);
    } catch (err) {
      clearTimeout(timeout);
      const ehTimeout = err.name === 'AbortError';
      const mensagem = ehTimeout
        ? 'A consulta excedeu o tempo limite.'
        : 'Não foi possível acessar o serviço externo.';
      if (tentativa < TENTATIVAS) {
        await new Promise((r) => setTimeout(r, BACKOFF_MS));
        continue;
      }
      return respostaErro(500, mensagem);
    } finally {
      clearTimeout(timeout);
    }

    let body;
    try {
      body = await upstream.json();
    } catch {
      return respostaErro(500, 'Resposta inesperada do serviço externo.');
    }

    return body;
  }
}

module.exports = { consultarCnpjWs };
