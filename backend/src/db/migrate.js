require('dotenv').config();
const fs = require('fs');
const path = require('path');
const { pool } = require('../config/db');

async function migrate() {
  const dir = path.join(__dirname, 'migrations');
  const arquivos = fs
    .readdirSync(dir)
    .filter((f) => f.endsWith('.sql'))
    .sort();

  const client = await pool.connect();
  try {
    await client.query(
      `CREATE TABLE IF NOT EXISTS schema_migrations (
         version VARCHAR(255) PRIMARY KEY,
         aplicada_em TIMESTAMPTZ NOT NULL DEFAULT NOW()
       )`
    );

    for (const arquivo of arquivos) {
      const jaAplicada = await client.query(
        'SELECT 1 FROM schema_migrations WHERE version = $1',
        [arquivo]
      );
      if (jaAplicada.rowCount > 0) {
        console.log(`[skip] ${arquivo}`);
        continue;
      }

      const sql = fs.readFileSync(path.join(dir, arquivo), 'utf8');
      await client.query('BEGIN');
      try {
        await client.query(sql);
        await client.query(
          'INSERT INTO schema_migrations (version) VALUES ($1)',
          [arquivo]
        );
        await client.query('COMMIT');
        console.log(`[ok]   ${arquivo}`);
      } catch (err) {
        await client.query('ROLLBACK');
        throw err;
      }
    }
    console.log('Migrações concluídas.');
  } finally {
    client.release();
    await pool.end();
  }
}

migrate().catch((err) => {
  console.error('Erro na migração:', err.message);
  process.exit(1);
});
