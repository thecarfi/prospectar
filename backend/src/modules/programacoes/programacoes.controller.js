const { pool } = require('../../config/db');
const ApiError = require('../../utils/api-error');

const STATUS_VALIDOS = ['pendente', 'em_andamento', 'concluida', 'cancelada'];

const TRANSICOES_PERMITIDAS = {
  pendente: ['em_andamento', 'cancelada'],
  em_andamento: ['concluida', 'cancelada'],
};

async function validarProgramacao(programacaoId) {
  const { rows } = await pool.query('SELECT id, status FROM programacoes WHERE id = $1', [programacaoId]);
  if (!rows[0]) {
    throw new ApiError(404, 'Programação não encontrada');
  }
  return rows[0];
}

async function listar(req, res, next) {
  try {
    const {
      titulo,
      status,
      data_inicio,
      data_fim,
      pagina = 1,
      limite = 10,
    } = req.query;

    const condicoes = [];
    const params = [];

    if (titulo) {
      params.push(`%${titulo}%`);
      condicoes.push(`p.titulo ILIKE $${params.length}`);
    }
    if (status) {
      if (!STATUS_VALIDOS.includes(status)) {
        throw new ApiError(400, 'Status inválido');
      }
      params.push(status);
      condicoes.push(`p.status = $${params.length}`);
    }
    if (data_inicio) {
      params.push(data_inicio);
      condicoes.push(`p.data_inicio >= $${params.length}::date`);
    }
    if (data_fim) {
      params.push(data_fim);
      condicoes.push(`p.data_fim <= $${params.length}::date`);
    }

    const whereSql = condicoes.length ? `WHERE ${condicoes.join(' AND ')}` : '';
    const paginaNum = Math.max(1, Number(pagina) || 1);
    const limiteNum = Math.min(100, Math.max(1, Number(limite) || 10));
    const offset = (paginaNum - 1) * limiteNum;

    const fromSql = `FROM programacoes p
      LEFT JOIN municipios m ON m.id = p.municipio_id
      LEFT JOIN estados e ON e.id = m.estado_id
      LEFT JOIN usuarios u ON u.id = p.criado_por`;

    const { rows: totalRows } = await pool.query(
      `SELECT COUNT(*)::int AS total ${fromSql} ${whereSql}`,
      params
    );

    const { rows } = await pool.query(
      `SELECT p.id, p.titulo, p.data_inicio, p.data_fim, p.status,
              p.regiao, p.descricao, p.municipio_id,
              m.nome AS municipio_nome, e.sigla AS municipio_uf,
              p.criado_por, p.criado_em, p.atualizado_em,
              u.nome AS criado_por_nome,
              (SELECT COUNT(*)::int FROM programacao_clientes pc WHERE pc.programacao_id = p.id) AS clientes_count,
              (SELECT COUNT(*)::int FROM interacoes i WHERE i.programacao_id = p.id) AS clientes_com_interacao
        ${fromSql}
        ${whereSql}
        ORDER BY p.data_inicio DESC, p.id DESC
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

    const { rows: programacoes } = await pool.query(
      `SELECT p.*, m.nome AS municipio_nome, e.sigla AS municipio_uf,
              u.nome AS criado_por_nome
        FROM programacoes p
        LEFT JOIN municipios m ON m.id = p.municipio_id
        LEFT JOIN estados e ON e.id = m.estado_id
        LEFT JOIN usuarios u ON u.id = p.criado_por
       WHERE p.id = $1`,
      [id]
    );

    if (!programacoes[0]) {
      throw new ApiError(404, 'Programação não encontrada');
    }

    const { rows: clientes } = await pool.query(
      `SELECT pc.id, pc.cliente_id, c.nome AS cliente_nome,
              (SELECT COUNT(*)::int FROM interacoes i
                WHERE i.programacao_id = $1 AND i.cliente_id = pc.cliente_id) > 0 AS tem_interacao,
              (SELECT i.id FROM interacoes i
                WHERE i.programacao_id = $1 AND i.cliente_id = pc.cliente_id
                LIMIT 1) AS interacao_id,
              (SELECT json_build_object(
                       'id', i.id,
                       'cliente_id', i.cliente_id,
                       'tipo', i.tipo,
                       'assunto', i.assunto,
                       'descricao', i.descricao,
                       'ocorreu_em', i.ocorreu_em,
                       'criado_por', i.criado_por,
                       'criado_em', i.criado_em,
                       'programacao_id', i.programacao_id)
                FROM interacoes i
                WHERE i.programacao_id = $1 AND i.cliente_id = pc.cliente_id
                ORDER BY i.criado_em DESC
                LIMIT 1) AS interacao
        FROM programacao_clientes pc
        JOIN clientes c ON c.id = pc.cliente_id
       WHERE pc.programacao_id = $1
       ORDER BY c.nome`,
      [id]
    );

    res.json({
      ...programacoes[0],
      clientes,
    });
  } catch (err) {
    next(err);
  }
}

async function criar(req, res, next) {
  const client = await pool.connect();
  try {
    const { titulo, data_inicio, data_fim, municipio_id, regiao, descricao, cliente_ids } = req.body;

    await client.query('BEGIN');

    const { rows } = await client.query(
      `INSERT INTO programacoes (titulo, data_inicio, data_fim, municipio_id, regiao, descricao, criado_por)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING id, titulo, data_inicio, data_fim, municipio_id, regiao, status, descricao, criado_por, criado_em`,
      [titulo, data_inicio, data_fim, municipio_id || null, regiao || null, descricao || null, req.user.id]
    );

    const programacao = rows[0];

    if (Array.isArray(cliente_ids) && cliente_ids.length > 0) {
      for (const clienteId of cliente_ids) {
        await client.query(
          'INSERT INTO programacao_clientes (programacao_id, cliente_id) VALUES ($1, $2) ON CONFLICT DO NOTHING',
          [programacao.id, clienteId]
        );
      }
    }

    await client.query('COMMIT');

    res.status(201).json(programacao);
  } catch (err) {
    await client.query('ROLLBACK').catch(() => {});
    next(err);
  } finally {
    client.release();
  }
}

async function atualizar(req, res, next) {
  try {
    const { id } = req.params;
    const { titulo, data_inicio, data_fim, municipio_id, regiao, descricao } = req.body;

    const prog = await validarProgramacao(id);

    if (prog.status === 'concluida' || prog.status === 'cancelada') {
      throw new ApiError(400, 'Não é possível editar uma programação concluída ou cancelada');
    }

    const { rows } = await pool.query(
      `UPDATE programacoes
          SET titulo = COALESCE($1, titulo),
              data_inicio = COALESCE($2, data_inicio),
              data_fim = COALESCE($3, data_fim),
              municipio_id = $4,
              regiao = $5,
              descricao = $6,
              atualizado_em = NOW()
        WHERE id = $7
        RETURNING id, titulo, data_inicio, data_fim, municipio_id, regiao, status, descricao, criado_por, criado_em`,
      [
        titulo ?? null,
        data_inicio ?? null,
        data_fim ?? null,
        municipio_id !== undefined ? (municipio_id || null) : undefined,
        regiao !== undefined ? (regiao || null) : undefined,
        descricao !== undefined ? (descricao || null) : undefined,
        id,
      ]
    );

    res.json(rows[0]);
  } catch (err) {
    next(err);
  }
}

async function excluir(req, res, next) {
  try {
    const { id } = req.params;

    const prog = await validarProgramacao(id);

    if (prog.status === 'concluida') {
      throw new ApiError(400, 'Não é possível excluir uma programação concluída');
    }

    const { rowCount } = await pool.query('DELETE FROM programacoes WHERE id = $1', [id]);

    if (rowCount === 0) {
      throw new ApiError(404, 'Programação não encontrada');
    }

    res.status(204).send();
  } catch (err) {
    next(err);
  }
}

async function alterarStatus(req, res, next) {
  try {
    const { id } = req.params;
    const { status } = req.body;

    if (!STATUS_VALIDOS.includes(status)) {
      throw new ApiError(400, 'Status inválido');
    }

    const prog = await validarProgramacao(id);

    const permitidos = TRANSICOES_PERMITIDAS[prog.status];
    if (!permitidos || !permitidos.includes(status)) {
      throw new ApiError(
        400,
        `Transição de "${prog.status}" para "${status}" não é permitida`
      );
    }

    const { rows } = await pool.query(
      `UPDATE programacoes SET status = $1, atualizado_em = NOW()
       WHERE id = $2
       RETURNING id, titulo, status`,
      [status, id]
    );

    res.json(rows[0]);
  } catch (err) {
    next(err);
  }
}

async function adicionarCliente(req, res, next) {
  const client = await pool.connect();
  try {
    const { id } = req.params;
    const { cliente_id } = req.body;

    const prog = await client.query('SELECT id, status FROM programacoes WHERE id = $1', [id]);
    if (!prog.rows[0]) {
      throw new ApiError(404, 'Programação não encontrada');
    }

    if (prog.rows[0].status === 'concluida' || prog.rows[0].status === 'cancelada') {
      throw new ApiError(400, 'Não é possível adicionar clientes a uma programação concluída ou cancelada');
    }

    const cliente = await client.query('SELECT id, nome FROM clientes WHERE id = $1', [cliente_id]);
    if (!cliente.rows[0]) {
      throw new ApiError(404, 'Cliente não encontrado');
    }

    await client.query(
      'INSERT INTO programacao_clientes (programacao_id, cliente_id) VALUES ($1, $2) ON CONFLICT DO NOTHING',
      [id, cliente_id]
    );

    res.status(201).json({ ok: true, cliente_nome: cliente.rows[0].nome });
  } catch (err) {
    next(err);
  } finally {
    client.release();
  }
}

async function removerCliente(req, res, next) {
  try {
    const { id, clienteId } = req.params;

    const prog = await validarProgramacao(id);

    if (prog.status === 'concluida' || prog.status === 'cancelada') {
      throw new ApiError(400, 'Não é possível remover clientes de uma programação concluída ou cancelada');
    }

    const { rowCount } = await pool.query(
      'DELETE FROM programacao_clientes WHERE programacao_id = $1 AND cliente_id = $2',
      [id, clienteId]
    );

    if (rowCount === 0) {
      throw new ApiError(404, 'Cliente não vinculado a esta programação');
    }

    res.status(204).send();
  } catch (err) {
    next(err);
  }
}

async function concluir(req, res, next) {
  const client = await pool.connect();
  try {
    const { id } = req.params;

    const prog = await client.query('SELECT id, status FROM programacoes WHERE id = $1', [id]);
    if (!prog.rows[0]) {
      throw new ApiError(404, 'Programação não encontrada');
    }

    if (prog.rows[0].status !== 'em_andamento') {
      throw new ApiError(400, 'Só é possível concluir programações com status "em andamento"');
    }

    const { rows: clientesSemInteracao } = await client.query(
      `SELECT pc.cliente_id, c.nome AS cliente_nome
        FROM programacao_clientes pc
        JOIN clientes c ON c.id = pc.cliente_id
        WHERE pc.programacao_id = $1
          AND NOT EXISTS (
            SELECT 1 FROM interacoes i
            WHERE i.programacao_id = $1 AND i.cliente_id = pc.cliente_id
          )`,
      [id]
    );

    if (clientesSemInteracao.length > 0) {
      const err = new ApiError(409, 'Existem clientes sem interação vinculada');
      err.data = { clientes_sem_interacao: clientesSemInteracao };
      throw err;
    }

    await client.query('BEGIN');

    await client.query(
      `UPDATE programacoes SET status = 'concluida', atualizado_em = NOW() WHERE id = $1`,
      [id]
    );

    await client.query('COMMIT');

    res.json({ ok: true, mensagem: 'Programação concluída com sucesso' });
  } catch (err) {
    await client.query('ROLLBACK').catch(() => {});
    next(err);
  } finally {
    client.release();
  }
}

module.exports = {
  listar,
  obter,
  criar,
  atualizar,
  excluir,
  alterarStatus,
  adicionarCliente,
  removerCliente,
  concluir,
};
