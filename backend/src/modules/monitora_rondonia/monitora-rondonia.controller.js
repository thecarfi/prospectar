const { bigquery } = require('../../config/bigquery');
const env = require('../../config/env');
const crypto = require('crypto');
const ApiError = require('../../utils/api-error');

const VIEW_NAME = env.bqViewDocumentos;
const TABLE_NAME = env.bqTableEntradas;

const BQ_LOCATION = process.env.BQ_LOCATION || 'southamerica-east1';
const TTL_FILTROS = 15 * 60 * 1000;
const TTL_DOCUMENTOS = 60 * 1000;

const cacheFiltros = {
  filiais: { dados: null, expiresAt: 0 },
  cidades: { dados: null, expiresAt: 0 },
};

const cacheDocumentos = new Map();

function expirado(entrada) {
  return !entrada.dados || Date.now() > entrada.expiresAt;
}

async function consultarDistinct(coluna) {
  if (!bigquery) throw new ApiError(503, 'BigQuery nao configurado');
  const [rows] = await bigquery.query({
    query: `SELECT DISTINCT ${coluna} AS valor
              FROM \`${VIEW_NAME}\`
             WHERE ${coluna} IS NOT NULL
             ORDER BY valor`,
    location: BQ_LOCATION,
  });
  return rows.map((r) => r.valor);
}

async function filtros(_req, res, next) {
  try {
    const promessas = [];

    if (expirado(cacheFiltros.filiais)) {
      promessas.push(
        consultarDistinct('filial_destino').then((dados) => {
          cacheFiltros.filiais = { dados, expiresAt: Date.now() + TTL_FILTROS };
        })
      );
    }
    if (expirado(cacheFiltros.cidades)) {
      promessas.push(
        consultarDistinct('cidade_destinatario').then((dados) => {
          cacheFiltros.cidades = { dados, expiresAt: Date.now() + TTL_FILTROS };
        })
      );
    }

    await Promise.all(promessas);

    res.json({
      filiais: cacheFiltros.filiais.dados,
      cidades: cacheFiltros.cidades.dados,
    });
  } catch (err) {
    next(err);
  }
}

async function documentos(req, res, next) {
  try {
    if (!bigquery) throw new ApiError(503, 'BigQuery nao configurado');

    const {
      filial_destino,
      cidade_destinatario,
      documento,
      data_manifesto,
      eh_vaptlog,
      pagina = 1,
      limite = 10,
    } = req.query;

    const paginaNum = Math.max(1, Number(pagina) || 1);
    const limiteNum = Math.min(100, Math.max(1, Number(limite) || 10));
    const offset = (paginaNum - 1) * limiteNum;

    const cacheKey = crypto
      .createHash('md5')
      .update(JSON.stringify({ filial_destino, cidade_destinatario, documento, data_manifesto, eh_vaptlog, pagina: paginaNum, limite: limiteNum }))
      .digest('hex');

    const entradaCache = cacheDocumentos.get(cacheKey);
    if (entradaCache && Date.now() < entradaCache.expiresAt) {
      return res.json(entradaCache.dados);
    }

    const condicoes = [];
    const params = {};
    const parameterTypes = {};

    if (filial_destino) {
      condicoes.push('filial_destino = @filial');
      params.filial = filial_destino;
      parameterTypes.filial = { typeKind: 'STRING' };
    }
    if (cidade_destinatario) {
      condicoes.push('cidade_destinatario = @cidade');
      params.cidade = cidade_destinatario;
      parameterTypes.cidade = { typeKind: 'STRING' };
    }
    if (documento) {
      condicoes.push('documento = @documento');
      params.documento = documento;
      parameterTypes.documento = { typeKind: 'STRING' };
    }
    if (data_manifesto) {
      condicoes.push('DATE(emissao_ultimo_manifesto) = @data');
      params.data = data_manifesto;
      parameterTypes.data = { typeKind: 'STRING' };
    }
    if (eh_vaptlog) {
      condicoes.push('eh_vaptlog = @vaptlog');
      params.vaptlog = eh_vaptlog;
      parameterTypes.vaptlog = { typeKind: 'STRING' };
    }

    const whereSql = condicoes.length ? `WHERE ${condicoes.join(' AND ')}` : '';

    const sql = `SELECT filial_destino, cidade_destinatario, documento,
                        emissao_ultimo_manifesto, eh_vaptlog,
                        data_entrega, eh_data_entrega_editada,
                        vaptlog_entrega,
                        COUNT(*) OVER() AS total
                   FROM \`${VIEW_NAME}\`
                  ${whereSql}
                  ORDER BY documento, emissao_ultimo_manifesto
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
        filial_destino: r.filial_destino ?? null,
        cidade_destinatario: r.cidade_destinatario ?? null,
        documento: r.documento ?? null,
        emissao_ultimo_manifesto: r.emissao_ultimo_manifesto?.value ?? r.emissao_ultimo_manifesto ?? null,
        eh_vaptlog: r.eh_vaptlog != null ? String(r.eh_vaptlog) : null,
        data_entrega: r.data_entrega?.value ?? r.data_entrega ?? null,
        eh_data_entrega_editada: r.eh_data_entrega_editada ?? null,
        vaptlog_entrega: r.vaptlog_entrega ?? null,
      })),
      total,
      pagina: paginaNum,
      limite: limiteNum,
    };

    cacheDocumentos.set(cacheKey, { dados: resultado, expiresAt: Date.now() + TTL_DOCUMENTOS });

    if (cacheDocumentos.size > 200) {
      const primeira = cacheDocumentos.keys().next().value;
      cacheDocumentos.delete(primeira);
    }

    res.json(resultado);
  } catch (err) {
    next(err);
  }
}

async function salvarDataEntrega(req, res, next) {
  try {
    if (!bigquery) throw new ApiError(503, 'BigQuery nao configurado');

    const { documento } = req.params;
    const { data_entrega, eh_data_entrega_editada } = req.body;

    let sql;
    if (eh_data_entrega_editada === 'S') {
      sql = `UPDATE \`${TABLE_NAME}\`
                SET dado = @dado
              WHERE documento = @documento`;
    } else {
      sql = `INSERT INTO \`${TABLE_NAME}\` (documento, tipo_dado, dado)
             VALUES (@documento, @tipo_dado, @dado)`;
    }

    await bigquery.query({
      query: sql,
      params: {
        documento: Number(documento),
        tipo_dado: 'data_entrega',
        dado: data_entrega,
      },
      parameterTypes: {
        documento: { typeKind: 'INT64' },
        tipo_dado: { typeKind: 'STRING' },
        dado: { typeKind: 'STRING' },
      },
      location: BQ_LOCATION,
    });

    cacheDocumentos.clear();

    res.json({ sucesso: true });
  } catch (err) {
    next(err);
  }
}

async function toggleVaptlog(req, res, next) {
  try {
    if (!bigquery) throw new ApiError(503, 'BigQuery nao configurado');

    const { documento } = req.params;
    const { acao } = req.body;

    let sql;
    if (acao === 'adicionar') {
      sql = `DELETE FROM \`${TABLE_NAME}\`
              WHERE documento = @documento AND tipo_dado = @tipo_dado`;
    } else {
      sql = `INSERT INTO \`${TABLE_NAME}\` (documento, tipo_dado, dado)
             VALUES (@documento, @tipo_dado, @dado)`;
    }

    await bigquery.query({
      query: sql,
      params: {
        documento: Number(documento),
        tipo_dado: 'vaptlog',
        dado: 'vaptlog',
      },
      parameterTypes: {
        documento: { typeKind: 'INT64' },
        tipo_dado: { typeKind: 'STRING' },
        dado: { typeKind: 'STRING' },
      },
      location: BQ_LOCATION,
    });

    cacheDocumentos.clear();

    res.json({ sucesso: true });
  } catch (err) {
    next(err);
  }
}

module.exports = { filtros, documentos, salvarDataEntrega, toggleVaptlog };
