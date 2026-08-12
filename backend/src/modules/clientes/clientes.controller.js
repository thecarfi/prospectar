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

async function validarStatus(statusId) {
  const { rows } = await pool.query(
    'SELECT id FROM status_clientes WHERE id = $1',
    [statusId]
  );
  if (!rows[0]) {
    throw new ApiError(400, 'Status inválido');
  }
}

async function listar(req, res, next) {
  try {
    const {
      busca,
      cidade,
      estado,
      segmento_id,
      status_id,
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
    if (segmento_id) {
      const id = parseInt(segmento_id, 10);
      if (Number.isInteger(id)) {
        params.push(id);
        condicoes.push(
          `EXISTS (SELECT 1 FROM cliente_segmentos cs
                     WHERE cs.cliente_id = c.id AND cs.segmento_id = $${params.length})`
        );
      }
    }
    if (status_id) {
      const id = parseInt(status_id, 10);
      if (Number.isInteger(id)) {
        params.push(id);
        condicoes.push(`c.status_id = $${params.length}`);
      }
    }

    const whereSql = condicoes.length ? `WHERE ${condicoes.join(' AND ')}` : '';
    const paginaNum = Math.max(1, Number(pagina) || 1);
    const limiteNum = Math.min(100, Math.max(1, Number(limite) || 10));
    const offset = (paginaNum - 1) * limiteNum;

    const fromSql = `FROM clientes c
         LEFT JOIN municipios m ON m.id = c.municipio_id
         LEFT JOIN estados e ON e.id = m.estado_id
         LEFT JOIN status_clientes st ON st.id = c.status_id`;

    const { rows: totalRows } = await pool.query(
      `SELECT COUNT(*)::int AS total ${fromSql} ${whereSql}`,
      params
    );

    const { rows } = await pool.query(
      `SELECT c.id, c.nome, c.cpf_cnpj,
              c.status_id, st.nome AS status_nome, st.cor AS status_cor,
              c.municipio_id, m.nome AS municipio_nome, e.sigla AS municipio_uf,
              c.observacoes, c.criado_por, c.criado_em, c.atualizado_em,
              COALESCE((SELECT string_agg(s.nome, ', ' ORDER BY s.nome)
                          FROM cliente_segmentos cs
                          JOIN segmentos s ON s.id = cs.segmento_id
                         WHERE cs.cliente_id = c.id), '') AS segmentos_nomes
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
    const { rows: total } = await pool.query(
      'SELECT COUNT(*)::int AS total FROM clientes'
    );
    const { rows: porStatus } = await pool.query(
      `SELECT st.id AS status_id,
              st.nome AS status_nome,
              st.cor AS status_cor,
              COUNT(c.id)::int AS total
         FROM status_clientes st
         LEFT JOIN clientes c ON c.status_id = st.id
        GROUP BY st.id, st.nome, st.cor
        ORDER BY st.id`
    );
    res.json({ total: total[0].total, por_status: porStatus });
  } catch (err) {
    next(err);
  }
}

async function detalhar(req, res, next) {
  try {
    const { id } = req.params;

    const { rows: clientes } = await pool.query(
      `SELECT c.id, c.nome, c.cpf_cnpj,
              c.status_id, st.nome AS status_nome, st.cor AS status_cor,
              c.municipio_id, m.nome AS municipio_nome, e.sigla AS municipio_uf,
              c.observacoes, c.criado_por, c.criado_em, c.atualizado_em
         FROM clientes c
         LEFT JOIN municipios m ON m.id = c.municipio_id
         LEFT JOIN estados e ON e.id = m.estado_id
         LEFT JOIN status_clientes st ON st.id = c.status_id
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
      `SELECT i.id, i.tipo, i.assunto, i.descricao, i.ocorreu_em,
              i.criado_por, i.criado_em, u.nome AS criado_por_nome
         FROM interacoes i
         LEFT JOIN usuarios u ON u.id = i.criado_por
        WHERE i.cliente_id = $1
        ORDER BY i.ocorreu_em DESC`,
      [id]
    );
    const { rows: segmentos } = await pool.query(
      `SELECT s.id, s.nome, s.descricao
         FROM segmentos s
         JOIN cliente_segmentos cs ON cs.segmento_id = s.id
        WHERE cs.cliente_id = $1
        ORDER BY s.nome`,
      [id]
    );

    res.json({ ...cliente, contatos, enderecos, interacoes, segmentos });
  } catch (err) {
    next(err);
  }
}

async function criar(req, res, next) {
  try {
    const {
      nome,
      cpf_cnpj,
      segmento_ids,
      municipio_id,
      status_id,
      observacoes,
    } = req.body;

    if (municipio_id != null) {
      await validarMunicipio(municipio_id);
    }

    let statusFinal = status_id;
    if (statusFinal == null) {
      const { rows: primeiro } = await pool.query(
        'SELECT id FROM status_clientes ORDER BY id LIMIT 1'
      );
      if (!primeiro[0]) {
        throw new ApiError(400, 'Nenhum status cadastrado');
      }
      statusFinal = primeiro[0].id;
    } else {
      await validarStatus(statusFinal);
    }

    const { rows } = await pool.query(
      `INSERT INTO clientes (nome, cpf_cnpj, municipio_id, status_id, observacoes, criado_por)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING id, nome, cpf_cnpj, municipio_id, status_id,
                 observacoes, criado_por, criado_em, atualizado_em`,
      [nome, cpf_cnpj || null, municipio_id ?? null, statusFinal, observacoes || null, req.user.id]
    );

    if (Array.isArray(segmento_ids) && segmento_ids.length > 0) {
      await pool.query(
        `INSERT INTO cliente_segmentos (cliente_id, segmento_id)
         SELECT $1, unnest($2::int[])
         ON CONFLICT DO NOTHING`,
        [rows[0].id, segmento_ids]
      );
    }

    res.status(201).json(rows[0]);
  } catch (err) {
    if (err.code === '23505') {
      return next(new ApiError(409, 'CPF/CNPJ já cadastrado'));
    }
    next(err);
  }
}

async function atualizar(req, res, next) {
  const { id } = req.params;
  const {
    nome,
    cpf_cnpj,
    segmento_ids,
    municipio_id,
    status_id,
    observacoes,
  } = req.body;

  try {
    if (municipio_id != null) {
      await validarMunicipio(municipio_id);
    }
    if (status_id != null) {
      await validarStatus(status_id);
    }

    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      const { rows: existente } = await client.query(
        'SELECT id FROM clientes WHERE id = $1',
        [id]
      );
      if (!existente[0]) {
        throw new ApiError(404, 'Cliente não encontrado');
      }

      const { rows } = await client.query(
        `UPDATE clientes
            SET nome = COALESCE($1, nome),
                cpf_cnpj = COALESCE($2, cpf_cnpj),
                municipio_id = COALESCE($3, municipio_id),
                status_id = COALESCE($4, status_id),
                observacoes = COALESCE($5, observacoes),
                atualizado_em = NOW()
          WHERE id = $6
          RETURNING id, nome, cpf_cnpj, municipio_id, status_id,
                    observacoes, criado_por, criado_em, atualizado_em`,
        [nome ?? null, cpf_cnpj ?? null, municipio_id ?? null, status_id ?? null, observacoes ?? null, id]
      );

      if ('segmento_ids' in req.body) {
        const lista = Array.isArray(segmento_ids) ? segmento_ids : [];
        await client.query(
          'DELETE FROM cliente_segmentos WHERE cliente_id = $1',
          [id]
        );
        if (lista.length > 0) {
          await client.query(
            `INSERT INTO cliente_segmentos (cliente_id, segmento_id)
             SELECT $1, unnest($2::int[])
             ON CONFLICT DO NOTHING`,
            [id, lista]
          );
        }
      }

      await client.query('COMMIT');
      res.json(rows[0]);
    } catch (err) {
      await client.query('ROLLBACK').catch(() => {});
      throw err;
    } finally {
      client.release();
    }
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
