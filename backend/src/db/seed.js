require('dotenv').config();
const bcrypt = require('bcryptjs');
const { pool } = require('../config/db');
const env = require('../config/env');

const PERMISSOES = {
  clientes: ['ver', 'criar', 'editar', 'excluir'],
  contatos: ['ver', 'criar', 'editar', 'excluir'],
  enderecos: ['ver', 'criar', 'editar', 'excluir'],
  interacoes: ['ver', 'criar', 'editar', 'excluir'],
  usuarios: ['ver', 'gerenciar'],
};

const PAPEIS = {
  admin: ['*'],
  operador: [
    'clientes:ver', 'clientes:criar', 'clientes:editar',
    'contatos:ver', 'contatos:criar', 'contatos:editar',
    'enderecos:ver', 'enderecos:criar', 'enderecos:editar',
    'interacoes:ver', 'interacoes:criar', 'interacoes:editar',
    'usuarios:ver',
  ],
  visualizador: [
    'clientes:ver',
    'contatos:ver',
    'enderecos:ver',
    'interacoes:ver',
  ],
};

async function seed() {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    const mapaPermissaoId = {};

    for (const [modulo, acoes] of Object.entries(PERMISSOES)) {
      for (const acao of acoes) {
        const { rows } = await client.query(
          `INSERT INTO permissoes (modulo, acao)
           VALUES ($1, $2)
           ON CONFLICT (modulo, acao) DO UPDATE SET modulo = EXCLUDED.modulo
           RETURNING id`,
          [modulo, acao]
        );
        mapaPermissaoId[`${modulo}:${acao}`] = rows[0].id;
      }
    }

    for (const [papel, permissaoLista] of Object.entries(PAPEIS)) {
      for (const permissao of permissaoLista) {
        if (permissao === '*') continue;
        const permissaoId = mapaPermissaoId[permissao];
        if (!permissaoId) {
          console.warn(`Permissão desconhecida: ${permissao}`);
          continue;
        }
        await client.query(
          `INSERT INTO papel_permissoes (papel, permissao_id)
           VALUES ($1, $2)
           ON CONFLICT (papel, permissao_id) DO NOTHING`,
          [papel, permissaoId]
        );
      }
    }

    const senhaHash = await bcrypt.hash(env.admin.senha, 10);
    await client.query(
      `INSERT INTO usuarios (nome, email, senha_hash, papel)
       VALUES ($1, $2, $3, 'admin')
       ON CONFLICT (email) DO NOTHING`,
      [env.admin.nome, env.admin.email.toLowerCase(), senhaHash]
    );

    await client.query('COMMIT');

    console.log('Seed concluído.');
    console.log(`Admin padrão -> email: ${env.admin.email} | senha: ${env.admin.senha}`);
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
    await pool.end();
  }
}

seed().catch((err) => {
  console.error('Erro no seed:', err.message);
  process.exit(1);
});
