const { pool } = require('../../config/db');
const ApiError = require('../../utils/api-error');
const {
  PARAMETROS_OBRIGATORIOS,
  calcularCotacao,
  montarParametros,
  paraNumero,
} = require('./cotacoes.calc');

const COTACAO_COLUNAS = `
  id, cliente_texto, cliente_id, rota_id, rota_nome,
  icms_rota::float8 AS icms_rota,
  frete_minimo_rota::float8 AS frete_minimo_rota,
  largura::float8 AS largura,
  altura::float8 AS altura,
  comprimento::float8 AS comprimento,
  valor_nf::float8 AS valor_nf,
  peso::float8 AS peso,
  parametros,
  peso_cubado::float8 AS peso_cubado,
  peso_cubado_multiplicado::float8 AS peso_cubado_multiplicado,
  peso_definido::float8 AS peso_definido,
  frete_peso::float8 AS frete_peso,
  frete_percentual_valor::float8 AS frete_percentual_valor,
  frete_minimo_valor::float8 AS frete_minimo_valor,
  frete_escolhido,
  valor_frete::float8 AS valor_frete,
  icms_valor::float8 AS icms_valor,
  seguro_valor::float8 AS seguro_valor,
  gris_valor::float8 AS gris_valor,
  pedagio_valor::float8 AS pedagio_valor,
  sec_cat_valor::float8 AS sec_cat_valor,
  valor_generalidade::float8 AS valor_generalidade,
  valor_total::float8 AS valor_total,
  cotado_por, criado_em
`;

async function obterRotaPorId(id) {
  const { rows } = await pool.query(
    `SELECT id, nome, icms::float8 AS icms, frete_minimo::float8 AS frete_minimo
       FROM cotacao_rotas
      WHERE id = $1`,
    [id]
  );
  if (!rows[0]) {
    throw new ApiError(404, 'Rota não encontrada');
  }
  return rows[0];
}

async function obterGeneralidades() {
  const { rows } = await pool.query(
    `SELECT id, tipo_generalidade, valor_generalidade::float8 AS valor_generalidade
       FROM cotacao_generalidades
      ORDER BY id`
  );
  return rows;
}

async function obterParametros() {
  const generalidades = await obterGeneralidades();
  const parametros = montarParametros(generalidades);
  const ausentes = PARAMETROS_OBRIGATORIOS.filter(
    (chave) => !Number.isFinite(parametros[chave])
  );
  if (ausentes.length) {
    throw new ApiError(
      400,
      `Parâmetros de generalidades ausentes: ${ausentes.join(', ')}`
    );
  }
  return parametros;
}

function montarParametrosDeOverride(override) {
  const parametros = {};
  const ausentes = [];
  const invalidos = [];
  PARAMETROS_OBRIGATORIOS.forEach((chave) => {
    const bruto = override[chave];
    if (bruto === undefined || bruto === null || bruto === '') {
      ausentes.push(chave);
      return;
    }
    const valor = paraNumero(bruto);
    if (!Number.isFinite(valor) || valor < 0) {
      invalidos.push(chave);
      return;
    }
    parametros[chave] = valor;
  });
  if (ausentes.length) {
    throw new ApiError(
      400,
      `Parâmetros de generalidades ausentes: ${ausentes.join(', ')}`
    );
  }
  if (invalidos.length) {
    throw new ApiError(
      400,
      `Parâmetros de generalidades inválidos: ${invalidos.join(', ')}`
    );
  }
  return parametros;
}

function validarResultado(resultado) {
  const { frete_escolhido, ...valoresNumericos } = resultado;
  const invalido = Object.values(valoresNumericos).some(
    (valor) => typeof valor !== 'number' || !Number.isFinite(valor)
  );
  if (invalido) {
    throw new ApiError(400, 'Os valores informados são muito altos para calcular a cotação');
  }
}

async function calcularResultado(entrada) {
  const rotaBase = await obterRotaPorId(entrada.rota_id);
  const rota = { ...rotaBase };
  if (entrada.rota) {
    if (entrada.rota.icms !== undefined && entrada.rota.icms !== null && entrada.rota.icms !== '') {
      rota.icms = paraNumero(entrada.rota.icms);
    }
    if (
      entrada.rota.frete_minimo !== undefined &&
      entrada.rota.frete_minimo !== null &&
      entrada.rota.frete_minimo !== ''
    ) {
      rota.frete_minimo = paraNumero(entrada.rota.frete_minimo);
    }
  }

  const parametros = entrada.parametros
    ? montarParametrosDeOverride(entrada.parametros)
    : await obterParametros();

  const resultado = calcularCotacao(entrada, rota, parametros);
  validarResultado(resultado);
  return { rota, parametros, resultado };
}

// =============================
// Rotas
// =============================
async function listarRotas(req, res, next) {
  try {
    const { rows } = await pool.query(
      `SELECT id, nome, icms::float8 AS icms, frete_minimo::float8 AS frete_minimo
         FROM cotacao_rotas
        ORDER BY nome`
    );
    res.json(rows);
  } catch (err) {
    next(err);
  }
}

async function criarRota(req, res, next) {
  try {
    const { nome, icms, frete_minimo } = req.body;
    const { rows } = await pool.query(
      `INSERT INTO cotacao_rotas (nome, icms, frete_minimo)
       VALUES ($1, $2, $3)
       RETURNING id, nome, icms::float8 AS icms, frete_minimo::float8 AS frete_minimo`,
      [nome.trim(), icms ?? 0, frete_minimo ?? 0]
    );
    res.status(201).json(rows[0]);
  } catch (err) {
    if (err.code === '23505') {
      return next(new ApiError(409, 'Já existe uma rota com esse nome'));
    }
    next(err);
  }
}

async function atualizarRota(req, res, next) {
  try {
    const { id } = req.params;
    const { nome, icms, frete_minimo } = req.body;
    const { rows } = await pool.query(
      `UPDATE cotacao_rotas
          SET nome = COALESCE($2, nome),
              icms = COALESCE($3, icms),
              frete_minimo = COALESCE($4, frete_minimo),
              atualizado_em = NOW()
        WHERE id = $1
        RETURNING id, nome, icms::float8 AS icms, frete_minimo::float8 AS frete_minimo`,
      [id, nome ? nome.trim() : null, icms ?? null, frete_minimo ?? null]
    );
    if (!rows[0]) {
      throw new ApiError(404, 'Rota não encontrada');
    }
    res.json(rows[0]);
  } catch (err) {
    if (err.code === '23505') {
      return next(new ApiError(409, 'Já existe uma rota com esse nome'));
    }
    next(err);
  }
}

async function excluirRota(req, res, next) {
  try {
    const { id } = req.params;
    const { rowCount } = await pool.query('DELETE FROM cotacao_rotas WHERE id = $1', [id]);
    if (rowCount === 0) {
      throw new ApiError(404, 'Rota não encontrada');
    }
    res.status(204).send();
  } catch (err) {
    next(err);
  }
}

// =============================
// Generalidades
// =============================
async function listarGeneralidades(req, res, next) {
  try {
    const generalidades = await obterGeneralidades();
    res.json(generalidades);
  } catch (err) {
    next(err);
  }
}

async function atualizarGeneralidade(req, res, next) {
  try {
    const { id } = req.params;
    const { valor_generalidade } = req.body;
    const { rows } = await pool.query(
      `UPDATE cotacao_generalidades
          SET valor_generalidade = $2
        WHERE id = $1
        RETURNING id, tipo_generalidade, valor_generalidade::float8 AS valor_generalidade`,
      [id, valor_generalidade]
    );
    if (!rows[0]) {
      throw new ApiError(404, 'Generalidade não encontrada');
    }
    res.json(rows[0]);
  } catch (err) {
    next(err);
  }
}

// =============================
// Cotações
// =============================
async function calcular(req, res, next) {
  try {
    const { rota, parametros, resultado } = await calcularResultado(req.body);
    res.json({ rota, parametros, ...resultado });
  } catch (err) {
    next(err);
  }
}

async function criar(req, res, next) {
  try {
    const { cliente_texto, cliente_id } = req.body;
    const { rota, parametros, resultado } = await calcularResultado(req.body);

    const { rows } = await pool.query(
      `INSERT INTO cotacoes (
         cliente_texto, cliente_id, rota_id, rota_nome, icms_rota, frete_minimo_rota,
         largura, altura, comprimento, valor_nf, peso, parametros,
         peso_cubado, peso_cubado_multiplicado, peso_definido,
         frete_peso, frete_percentual_valor, frete_minimo_valor, frete_escolhido,
         valor_frete, icms_valor, seguro_valor, gris_valor, pedagio_valor,
         sec_cat_valor, valor_generalidade, valor_total, cotado_por
       ) VALUES (
         $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16,
         $17, $18, $19, $20, $21, $22, $23, $24, $25, $26, $27, $28
       )
       RETURNING ${COTACAO_COLUNAS}`,
      [
        cliente_texto ? cliente_texto.trim() : null,
        cliente_id || null,
        rota.id,
        rota.nome,
        rota.icms,
        rota.frete_minimo,
        paraNumero(req.body.largura),
        paraNumero(req.body.altura),
        paraNumero(req.body.comprimento),
        paraNumero(req.body.valor_nf),
        paraNumero(req.body.peso),
        JSON.stringify(parametros),
        resultado.peso_cubado,
        resultado.peso_cubado_multiplicado,
        resultado.peso_definido,
        resultado.frete_peso,
        resultado.frete_percentual_valor,
        resultado.frete_minimo_valor,
        resultado.frete_escolhido,
        resultado.valor_frete,
        resultado.icms_valor,
        resultado.seguro_valor,
        resultado.gris_valor,
        resultado.pedagio_valor,
        resultado.sec_cat_valor,
        resultado.valor_generalidade,
        resultado.valor_total,
        req.user.id,
      ]
    );

    res.status(201).json(rows[0]);
  } catch (err) {
    next(err);
  }
}

async function listar(req, res, next) {
  try {
    const { cliente, rota_id, pagina = 1, limite = 10 } = req.query;
    const condicoes = [];
    const params = [];

    if (cliente) {
      params.push(`%${cliente}%`);
      condicoes.push(`c.cliente_texto ILIKE $${params.length}`);
    }
    if (rota_id) {
      params.push(rota_id);
      condicoes.push(`c.rota_id = $${params.length}`);
    }

    const whereSql = condicoes.length ? `WHERE ${condicoes.join(' AND ')}` : '';
    const paginaNum = Math.max(1, Number(pagina) || 1);
    const limiteNum = Math.min(100, Math.max(1, Number(limite) || 10));
    const offset = (paginaNum - 1) * limiteNum;

    const { rows: totalRows } = await pool.query(
      `SELECT COUNT(*)::int AS total FROM cotacoes c ${whereSql}`,
      params
    );

    const { rows } = await pool.query(
      `SELECT c.id, c.cliente_texto, c.cliente_id, c.rota_id, c.rota_nome,
              c.valor_nf::float8 AS valor_nf,
              c.peso_definido::float8 AS peso_definido,
              c.frete_escolhido,
              c.valor_total::float8 AS valor_total,
              c.cotado_por, u.nome AS cotado_por_nome, c.criado_em
         FROM cotacoes c
         LEFT JOIN usuarios u ON u.id = c.cotado_por
         ${whereSql}
        ORDER BY c.criado_em DESC, c.id DESC
        LIMIT $${params.length + 1} OFFSET $${params.length + 2}`,
      [...params, limiteNum, offset]
    );

    res.json({
      dados: rows,
      total: totalRows[0].total,
      pagina: paginaNum,
      limite: limiteNum,
    });
  } catch (err) {
    next(err);
  }
}

async function obter(req, res, next) {
  try {
    const { id } = req.params;
    const { rows } = await pool.query(
      `SELECT ${COTACAO_COLUNAS} FROM cotacoes WHERE id = $1`,
      [id]
    );
    if (!rows[0]) {
      throw new ApiError(404, 'Cotação não encontrada');
    }
    const cotacao = rows[0];
    if (cotacao.cotado_por) {
      const { rows: usuarios } = await pool.query(
        'SELECT nome FROM usuarios WHERE id = $1',
        [cotacao.cotado_por]
      );
      cotacao.cotado_por_nome = usuarios[0]?.nome || null;
    } else {
      cotacao.cotado_por_nome = null;
    }
    res.json(cotacao);
  } catch (err) {
    next(err);
  }
}

module.exports = {
  listarRotas,
  criarRota,
  atualizarRota,
  excluirRota,
  listarGeneralidades,
  atualizarGeneralidade,
  calcular,
  criar,
  listar,
  obter,
};
