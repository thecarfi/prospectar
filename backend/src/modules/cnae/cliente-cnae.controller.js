const { pool } = require('../../config/db');
const ApiError = require('../../utils/api-error');

const SELECT_CNAE = `
  SELECT cn.secao, cn.descricao_secao,
         cn.divisao, cn.descricao_divisao,
         cn.grupo, cn.descricao_grupo,
         cn.classe, cn.descricao_classe,
         cn.subclasse, cn.descricao_subclasse,
         cc.principal
    FROM cnae cn
    JOIN cliente_cnae cc ON cc.subclasse = cn.subclasse
   WHERE cc.cliente_id = $1
   ORDER BY cn.subclasse`;

async function validarCliente(clienteId) {
  const { rows } = await pool.query(
    'SELECT id FROM clientes WHERE id = $1',
    [clienteId]
  );
  if (!rows[0]) {
    throw new ApiError(404, 'Cliente não encontrado');
  }
}

async function validarSubclasse(subclasse) {
  const { rows } = await pool.query(
    'SELECT subclasse FROM cnae WHERE subclasse = $1',
    [subclasse]
  );
  if (!rows[0]) {
    throw new ApiError(400, `Subclasse CNAE não encontrada: ${subclasse}`);
  }
}

async function listar(req, res, next) {
  try {
    const { rows } = await pool.query(SELECT_CNAE, [req.params.clienteId]);
    res.json(rows);
  } catch (err) {
    next(err);
  }
}

async function criar(req, res, next) {
  try {
    const { clienteId } = req.params;
    const { subclasse, principal } = req.body;

    await validarCliente(clienteId);
    await validarSubclasse(subclasse);

    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      const { rows: existente } = await client.query(
        'SELECT 1 FROM cliente_cnae WHERE cliente_id = $1 AND subclasse = $2',
        [clienteId, subclasse]
      );
      if (existente[0]) {
        throw new ApiError(409, 'CNAE já vinculado a este cliente');
      }

      const { rows: jaPrincipal } = await client.query(
        'SELECT 1 FROM cliente_cnae WHERE cliente_id = $1 AND principal = TRUE',
        [clienteId]
      );
      const marcadoPrincipal = principal === true || jaPrincipal.length === 0;

      if (marcadoPrincipal) {
        await client.query(
          'UPDATE cliente_cnae SET principal = FALSE WHERE cliente_id = $1',
          [clienteId]
        );
      }

      await client.query(
        'INSERT INTO cliente_cnae (cliente_id, subclasse, principal) VALUES ($1, $2, $3)',
        [clienteId, subclasse, marcadoPrincipal]
      );

      await client.query('COMMIT');
    } catch (err) {
      await client.query('ROLLBACK').catch(() => {});
      throw err;
    } finally {
      client.release();
    }

    const { rows } = await pool.query(
      `SELECT cn.secao, cn.descricao_secao,
              cn.divisao, cn.descricao_divisao,
              cn.grupo, cn.descricao_grupo,
              cn.classe, cn.descricao_classe,
              cn.subclasse, cn.descricao_subclasse,
              cc.principal
         FROM cnae cn
         JOIN cliente_cnae cc ON cc.subclasse = cn.subclasse
        WHERE cc.cliente_id = $1 AND cc.subclasse = $2`,
      [clienteId, subclasse]
    );
    res.status(201).json(rows[0]);
  } catch (err) {
    next(err);
  }
}

async function atualizar(req, res, next) {
  try {
    const { clienteId, subclasse } = req.params;
    const { principal } = req.body;

    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      const { rows: existente } = await client.query(
        'SELECT 1 FROM cliente_cnae WHERE cliente_id = $1 AND subclasse = $2',
        [clienteId, subclasse]
      );
      if (!existente[0]) {
        throw new ApiError(404, 'CNAE não vinculado a este cliente');
      }

      if (principal === true) {
        await client.query(
          'UPDATE cliente_cnae SET principal = FALSE WHERE cliente_id = $1',
          [clienteId]
        );
        await client.query(
          'UPDATE cliente_cnae SET principal = TRUE WHERE cliente_id = $1 AND subclasse = $2',
          [clienteId, subclasse]
        );
      } else if (principal === false) {
        const { rows: principais } = await client.query(
          'SELECT subclasse FROM cliente_cnae WHERE cliente_id = $1 AND principal = TRUE',
          [clienteId]
        );
        await client.query(
          'UPDATE cliente_cnae SET principal = FALSE WHERE cliente_id = $1 AND subclasse = $2',
          [clienteId, subclasse]
        );
        if (principais[0] && principais[0].subclasse === subclasse) {
          const { rows: restantes } = await client.query(
            `SELECT subclasse FROM cliente_cnae
              WHERE cliente_id = $1 AND subclasse <> $2
              ORDER BY subclasse
              LIMIT 1`,
            [clienteId, subclasse]
          );
          if (restantes[0]) {
            await client.query(
              'UPDATE cliente_cnae SET principal = TRUE WHERE cliente_id = $1 AND subclasse = $2',
              [clienteId, restantes[0].subclasse]
            );
          }
        }
      }

      await client.query('COMMIT');
    } catch (err) {
      await client.query('ROLLBACK').catch(() => {});
      throw err;
    } finally {
      client.release();
    }

    const { rows } = await pool.query(
      `SELECT cn.secao, cn.descricao_secao,
              cn.divisao, cn.descricao_divisao,
              cn.grupo, cn.descricao_grupo,
              cn.classe, cn.descricao_classe,
              cn.subclasse, cn.descricao_subclasse,
              cc.principal
         FROM cnae cn
         JOIN cliente_cnae cc ON cc.subclasse = cn.subclasse
        WHERE cc.cliente_id = $1 AND cc.subclasse = $2`,
      [clienteId, subclasse]
    );
    res.json(rows[0]);
  } catch (err) {
    next(err);
  }
}

async function excluir(req, res, next) {
  try {
    const { clienteId, subclasse } = req.params;

    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      const { rows: vinculado } = await client.query(
        'SELECT principal FROM cliente_cnae WHERE cliente_id = $1 AND subclasse = $2',
        [clienteId, subclasse]
      );
      if (!vinculado[0]) {
        throw new ApiError(404, 'CNAE não vinculado a este cliente');
      }

      await client.query(
        'DELETE FROM cliente_cnae WHERE cliente_id = $1 AND subclasse = $2',
        [clienteId, subclasse]
      );

      if (vinculado[0].principal) {
        const { rows: restantes } = await client.query(
          `SELECT subclasse FROM cliente_cnae
            WHERE cliente_id = $1
            ORDER BY subclasse
            LIMIT 1`,
          [clienteId]
        );
        if (restantes[0]) {
          await client.query(
            'UPDATE cliente_cnae SET principal = TRUE WHERE cliente_id = $1 AND subclasse = $2',
            [clienteId, restantes[0].subclasse]
          );
        }
      }

      await client.query('COMMIT');
      res.status(204).send();
    } catch (err) {
      await client.query('ROLLBACK').catch(() => {});
      throw err;
    } finally {
      client.release();
    }
  } catch (err) {
    next(err);
  }
}

module.exports = { listar, criar, atualizar, excluir };
