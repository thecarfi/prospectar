const { pool } = require('../../config/db');
const ApiError = require('../../utils/api-error');

async function validarMunicipio(municipioId) {
  const { rows } = await pool.query(
    'SELECT id FROM municipios WHERE id = $1',
    [municipioId]
  );
  if (!rows[0]) {
    throw new ApiError(400, 'Município inválido');
  }
}

async function listar(req, res, next) {
  try {
    const {
      busca,
      cidade,
      estado,
      segmento,
      status,
      pagina = 1,
      limite = 10,
    } = req.query;

    const condicoes = [];
    const params = [];

    const colunasOrdenacao = ['nome', 'criado_em', 'cidade'];
    const colunaSelecionada = colunasOrdenacao.includes(req.query.ordenar_por)
      ? req.query.ordenar_por
      : 'nome';
    const ordenarPor = colunaSelecionada === 'cidade' ? 'm.nome' : `c.${colunaSelecionada}`;
    const direcao = ['asc', 'desc'].includes(req.query.direcao)
      ? req.query.direcao
      : 'asc';

    if (busca) {
      params.push(`%${busca}%`);
      condicoes.push(`(c.nome ILIKE $${params.length} OR c.cpf_cnpj ILIKE $${params.length})`);
    }
    if (cidade) {
      params.push(`%${cidade}%`);
      condicoes.push(`m.nome ILIKE $${params.length}`);
    }
    if (estado) {
      params.push(estado);
      condicoes.push(`e.sigla = $${params.length}`);
    }
    if (segmento) {
      params.push(segmento);
      condicoes.push(`c.segmento ILIKE $${params.length}`);
    }
    if (status) {
      params.push(status);
      condicoes.push(`c.status = $${params.length}`);
    }

    const whereSql = condicoes.length ? `WHERE ${condicoes.join(' AND ')}` : '';
    const paginaNum = Math.max(1, Number(pagina) || 1);
    const limiteNum = Math.min(100, Math.max(1, Number(limite) || 10));
    const offset = (paginaNum - 1) * limiteNum;

    const fromSql = `FROM clientes c
         LEFT JOIN municipios m ON m.id = c.municipio_id
         LEFT JOIN estados e ON e.id = m.estado_id`;

    const { rows: totalRows } = await pool.query(
      `SELECT COUNT(*)::int AS total ${fromSql} ${whereSql}`,
      params
    );

    const { rows } = await pool.query(
      `SELECT c.id, c.nome, c.cpf_cnpj, c.segmento, c.status,
              c.municipio_id, m.nome AS municipio_nome, e.sigla AS municipio_uf,
              c.observacoes, c.criado_por, c.criado_em, c.atualizado_em
         ${fromSql}
         ${whereSql}
        ORDER BY ${ordenarPor} ${direcao}, c.id
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

async function estatisticas(req, res, next) {
  try {
    const { rows } = await pool.query(
      `SELECT COUNT(*)::int AS total,
              COUNT(*) FILTER (WHERE status = 'ativo')::int AS ativos,
              COUNT(*) FILTER (WHERE status = 'inativo')::int AS inativos,
              COUNT(*) FILTER (WHERE status = 'prospect')::int AS prospects
         FROM clientes`
    );
    res.json(rows[0]);
  } catch (err) {
    next(err);
  }
}

async function detalhar(req, res, next) {
  try {
    const { id } = req.params;

    const { rows: clientes } = await pool.query(
      `SELECT c.id, c.nome, c.cpf_cnpj, c.segmento, c.status,
              c.municipio_id, m.nome AS municipio_nome, e.sigla AS municipio_uf,
              c.observacoes, c.criado_por, c.criado_em, c.atualizado_em
         FROM clientes c
         LEFT JOIN municipios m ON m.id = c.municipio_id
         LEFT JOIN estados e ON e.id = m.estado_id
        WHERE c.id = $1`,
      [id]
    );

    if (!clientes[0]) {
      throw new ApiError(404, 'Cliente não encontrado');
    }

    const cliente = clientes[0];

    const { rows: contatos } = await pool.query(
      'SELECT id, nome, email, telefone, cargo FROM contatos WHERE cliente_id = $1 ORDER BY nome',
      [id]
    );
    const { rows: enderecos } = await pool.query(
      `SELECT e.id, e.logradouro, e.numero, e.complemento, e.bairro,
              e.municipio_id, m.nome AS municipio_nome, es.sigla AS municipio_uf,
              e.cep, e.principal
         FROM enderecos e
         LEFT JOIN municipios m ON m.id = e.municipio_id
         LEFT JOIN estados es ON es.id = m.estado_id
        WHERE e.cliente_id = $1 ORDER BY e.principal DESC, e.id`,
      [id]
    );
    const { rows: interacoes } = await pool.query(
      `SELECT id, tipo, assunto, descricao, ocorreu_em, criado_por, criado_em
         FROM interacoes WHERE cliente_id = $1 ORDER BY ocorreu_em DESC`,
      [id]
    );

    res.json({ ...cliente, contatos, enderecos, interacoes });
  } catch (err) {
    next(err);
  }
}

async function criar(req, res, next) {
  try {
    const {
      nome,
      cpf_cnpj,
      segmento,
      municipio_id,
      status = 'ativo',
      observacoes,
    } = req.body;

    if (municipio_id != null) {
      await validarMunicipio(municipio_id);
    }

    const { rows } = await pool.query(
      `INSERT INTO clientes (nome, cpf_cnpj, segmento, municipio_id, status, observacoes, criado_por)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING id, nome, cpf_cnpj, segmento, municipio_id, status,
                 observacoes, criado_por, criado_em, atualizado_em`,
      [nome, cpf_cnpj || null, segmento || null, municipio_id ?? null, status, observacoes || null, req.user.id]
    );

    res.status(201).json(rows[0]);
  } catch (err) {
    if (err.code === '23505') {
      return next(new ApiError(409, 'CPF/CNPJ já cadastrado'));
    }
    next(err);
  }
}

async function atualizar(req, res, next) {
  try {
    const { id } = req.params;
    const {
      nome,
      cpf_cnpj,
      segmento,
      municipio_id,
      status,
      observacoes,
    } = req.body;

    const { rows: existente } = await pool.query(
      'SELECT id FROM clientes WHERE id = $1',
      [id]
    );
    if (!existente[0]) {
      throw new ApiError(404, 'Cliente não encontrado');
    }

    if (municipio_id != null) {
      await validarMunicipio(municipio_id);
    }

    const { rows } = await pool.query(
      `UPDATE clientes
          SET nome = COALESCE($1, nome),
              cpf_cnpj = COALESCE($2, cpf_cnpj),
              segmento = COALESCE($3, segmento),
              municipio_id = COALESCE($4, municipio_id),
              status = COALESCE($5, status),
              observacoes = COALESCE($6, observacoes),
              atualizado_em = NOW()
        WHERE id = $7
        RETURNING id, nome, cpf_cnpj, segmento, municipio_id, status,
                  observacoes, criado_por, criado_em, atualizado_em`,
      [nome ?? null, cpf_cnpj ?? null, segmento ?? null, municipio_id ?? null, status ?? null, observacoes ?? null, id]
    );

    res.json(rows[0]);
  } catch (err) {
    if (err.code === '23505') {
      return next(new ApiError(409, 'CPF/CNPJ já cadastrado'));
    }
    next(err);
  }
}

async function excluir(req, res, next) {
  try {
    const { id } = req.params;
    const { rowCount } = await pool.query(
      'DELETE FROM clientes WHERE id = $1',
      [id]
    );

    if (rowCount === 0) {
      throw new ApiError(404, 'Cliente não encontrado');
    }

    res.status(204).send();
  } catch (err) {
    next(err);
  }
}

module.exports = { listar, estatisticas, detalhar, criar, atualizar, excluir };
