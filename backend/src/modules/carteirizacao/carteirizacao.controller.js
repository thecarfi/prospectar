const { bigquery } = require('../../config/bigquery');
const env = require('../../config/env');
const crypto = require('crypto');
const ApiError = require('../../utils/api-error');

const VIEW_NAME = env.bqViewCarteirizacao;
const TABLE_NAME = env.bqTableCarteirizacao;

const VALOR_CARTEIRA_VAZIA = '__vazio__';

const BQ_LOCATION = process.env.BQ_LOCATION || 'southamerica-east1';
const TTL_CARTEIRAS = 15 * 60 * 1000;
const TTL_CLIENTES = 60 * 1000;

const cacheFiltros = {
  carteiras: { dados: null, expiresAt: 0 },
};

const cacheClientes = new Map();

function expirado(entrada) {
  return !entrada.dados || Date.now() > entrada.expiresAt;
}

async function consultarCarteiras() {
  if (!bigquery) throw new ApiError(503, 'BigQuery nao configurado');
  const [rows] = await bigquery.query({
    query: `SELECT carteira_responsavel AS valor
              FROM \`${VIEW_NAME}\`
             WHERE carteira_responsavel IS NOT NULL
             GROUP BY carteira_responsavel
             ORDER BY MAX(maior_data_emissao) DESC`,
    location: BQ_LOCATION,
  });
  return rows.map((r) => r.valor);
}

async function filtros(_req, res, next) {
  try {
    if (expirado(cacheFiltros.carteiras)) {
      const dados = await consultarCarteiras();
      cacheFiltros.carteiras = { dados, expiresAt: Date.now() + TTL_CARTEIRAS };
    }

    res.json({ carteiras: cacheFiltros.carteiras.dados });
  } catch (err) {
    next(err);
  }
}

async function clientes(req, res, next) {
  try {
    if (!bigquery) throw new ApiError(503, 'BigQuery nao configurado');

    const {
      nome_pagador,
      cnpj_pagador,
      carteira_responsavel,
      pagina = 1,
      limite = 10,
    } = req.query;

    const paginaNum = Math.max(1, Number(pagina) || 1);
    const limiteNum = Math.min(100, Math.max(1, Number(limite) || 10));
    const offset = (paginaNum - 1) * limiteNum;

    const cacheKey = crypto
      .createHash('md5')
      .update(JSON.stringify({ nome_pagador, cnpj_pagador, carteira_responsavel, pagina: paginaNum, limite: limiteNum }))
      .digest('hex');

    const entradaCache = cacheClientes.get(cacheKey);
    if (entradaCache && Date.now() < entradaCache.expiresAt) {
      return res.json(entradaCache.dados);
    }

    const condicoes = [];
    const params = {};
    const parameterTypes = {};

    if (nome_pagador) {
      condicoes.push('LOWER(nome_pagador) LIKE LOWER(@nome)');
      params.nome = `%${nome_pagador}%`;
      parameterTypes.nome = { typeKind: 'STRING' };
    }
    if (cnpj_pagador) {
      condicoes.push('CAST(cnpj_pagador AS STRING) LIKE @cnpj');
      params.cnpj = `%${cnpj_pagador}%`;
      parameterTypes.cnpj = { typeKind: 'STRING' };
    }
    if (carteira_responsavel) {
      if (carteira_responsavel === VALOR_CARTEIRA_VAZIA) {
        condicoes.push('carteira_responsavel IS NULL');
      } else {
        condicoes.push('carteira_responsavel = @carteira');
        params.carteira = carteira_responsavel;
        parameterTypes.carteira = { typeKind: 'STRING' };
      }
    }

    const whereSql = condicoes.length ? `WHERE ${condicoes.join(' AND ')}` : '';

    const sql = `SELECT nome_pagador, cnpj_pagador, qtde_cte,
                        qtde_meses_faturamento, maior_data_emissao,
                        carteira_responsavel,
                        COUNT(*) OVER() AS total
                   FROM \`${VIEW_NAME}\`
                  ${whereSql}
                  ORDER BY maior_data_emissao DESC
                  LIMIT ${limiteNum} OFFSET ${offset}`;

    const [rows] = await bigquery.query({
      query: sql,
      params,
      parameterTypes,
      location: BQ_LOCATION,
    });

    const total = rows.length > 0 ? Number(rows[0].total) || 0 : 0;

    const resultado = {
      dados: rows.map((r) => ({
        nome_pagador: r.nome_pagador ?? null,
        cnpj_pagador: r.cnpj_pagador ?? null,
        qtde_cte: r.qtde_cte != null ? Number(r.qtde_cte?.value ?? r.qtde_cte) : null,
        qtde_meses_faturamento: r.qtde_meses_faturamento != null ? Number(r.qtde_meses_faturamento?.value ?? r.qtde_meses_faturamento) : null,
        maior_data_emissao: r.maior_data_emissao?.value ?? r.maior_data_emissao ?? null,
        carteira_responsavel: r.carteira_responsavel ?? null,
      })),
      total,
      pagina: paginaNum,
      limite: limiteNum,
    };

    cacheClientes.set(cacheKey, { dados: resultado, expiresAt: Date.now() + TTL_CLIENTES });

    if (cacheClientes.size > 200) {
      const primeira = cacheClientes.keys().next().value;
      cacheClientes.delete(primeira);
    }

    res.json(resultado);
  } catch (err) {
    next(err);
  }
}

async function atribuirCarteira(req, res, next) {
  try {
    if (!bigquery) throw new ApiError(503, 'BigQuery nao configurado');

    const { cnpj, nome_carteira } = req.body;

    const [existentes] = await bigquery.query({
      query: `SELECT cnpj_cliente
                FROM \`${TABLE_NAME}\`
               WHERE cnpj_cliente = @cnpj`,
      params: { cnpj },
      parameterTypes: { cnpj: { typeKind: 'STRING' } },
      location: BQ_LOCATION,
    });

    const existe = existentes.length > 0;

    let sql;
    if (existe) {
      sql = `UPDATE \`${TABLE_NAME}\`
                SET nome_carteira = @nome_carteira
              WHERE cnpj_cliente = @cnpj`;
    } else {
      sql = `INSERT INTO \`${TABLE_NAME}\` (cnpj_cliente, nome_carteira)
             VALUES (@cnpj, @nome_carteira)`;
    }

    await bigquery.query({
      query: sql,
      params: { cnpj, nome_carteira },
      parameterTypes: {
        cnpj: { typeKind: 'STRING' },
        nome_carteira: { typeKind: 'STRING' },
      },
      location: BQ_LOCATION,
    });

    cacheClientes.clear();

    res.json({ sucesso: true });
  } catch (err) {
    next(err);
  }
}

module.exports = { filtros, clientes, atribuirCarteira };