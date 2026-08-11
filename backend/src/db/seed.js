require('dotenv').config();
const fs = require('fs');
const path = require('path');
const bcrypt = require('bcryptjs');
const { pool } = require('../config/db');
const env = require('../config/env');

const PERMISSOES = {
  clientes: ['ver', 'criar', 'editar', 'excluir'],
  contatos: ['ver', 'criar', 'editar', 'excluir'],
  enderecos: ['ver', 'criar', 'editar', 'excluir'],
  interacoes: ['ver', 'criar', 'editar', 'excluir'],
  usuarios: ['ver', 'gerenciar'],
  localizacao: ['ver'],
};

const NOMES_ESTADOS = {
  AC: 'Acre',
  AL: 'Alagoas',
  AP: 'Amapá',
  AM: 'Amazonas',
  BA: 'Bahia',
  CE: 'Ceará',
  DF: 'Distrito Federal',
  ES: 'Espírito Santo',
  GO: 'Goiás',
  MA: 'Maranhão',
  MT: 'Mato Grosso',
  MS: 'Mato Grosso do Sul',
  MG: 'Minas Gerais',
  PA: 'Pará',
  PB: 'Paraíba',
  PR: 'Paraná',
  PE: 'Pernambuco',
  PI: 'Piauí',
  RJ: 'Rio de Janeiro',
  RN: 'Rio Grande do Norte',
  RS: 'Rio Grande do Sul',
  RO: 'Rondônia',
  RR: 'Roraima',
  SC: 'Santa Catarina',
  SP: 'São Paulo',
  SE: 'Sergipe',
  TO: 'Tocantins',
};

const MUNICIPIOS = JSON.parse(
  fs.readFileSync(path.join(__dirname, 'data', 'municipios.json'), 'utf8')
);

const PAPEIS = {
  admin: ['*'],
  operador: [
    'clientes:ver', 'clientes:criar', 'clientes:editar',
    'contatos:ver', 'contatos:criar', 'contatos:editar',
    'enderecos:ver', 'enderecos:criar', 'enderecos:editar',
    'interacoes:ver', 'interacoes:criar', 'interacoes:editar',
    'usuarios:ver',
    'localizacao:ver',
  ],
  visualizador: [
    'clientes:ver',
    'contatos:ver',
    'enderecos:ver',
    'interacoes:ver',
    'localizacao:ver',
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

    await seedLocalizacao(client);

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

async function seedLocalizacao(client) {
  for (const [sigla, nome] of Object.entries(NOMES_ESTADOS)) {
    await client.query(
      `INSERT INTO estados (sigla, nome) VALUES ($1, $2)
       ON CONFLICT (sigla) DO UPDATE SET nome = EXCLUDED.nome`,
      [sigla, nome]
    );
  }

  const linhas = [];
  const params = [];
  let idx = 1;
  for (const m of MUNICIPIOS) {
    params.push(m.uf, m.nome);
    linhas.push(`($${idx}, $${idx + 1})`);
    idx += 2;
  }
  await client.query(
    `INSERT INTO municipios (estado_id, nome)
     SELECT e.id, v.nome
       FROM estados e
       JOIN (VALUES ${linhas.join(',')}) AS v(uf, nome) ON v.uf = e.sigla
     ON CONFLICT (estado_id, nome) DO NOTHING`,
    params
  );

  const colunasBackfill = await client.query(
    `SELECT table_name, column_name
       FROM information_schema.columns
      WHERE table_name IN ('clientes', 'enderecos')
        AND column_name IN ('cidade', 'estado')`
  );
  const temColunaAntiga = (tabela) =>
    colunasBackfill.rows.some(
      (c) => c.table_name === tabela && c.column_name === 'cidade'
    );

  if (temColunaAntiga('clientes') || temColunaAntiga('enderecos')) {
    const normalizar = (s) =>
      (s || '')
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .toLowerCase()
        .trim();

    const { rows: municipiosDb } = await client.query(
      `SELECT m.id, e.sigla AS uf, m.nome
         FROM municipios m
         JOIN estados e ON e.id = m.estado_id`
    );
    const mapaMunicipio = new Map();
    for (const m of municipiosDb) {
      mapaMunicipio.set(`${m.uf}|${normalizar(m.nome)}`, m.id);
    }

    if (temColunaAntiga('clientes')) {
      const { rows: clientes } = await client.query(
        `SELECT id, cidade, estado FROM clientes WHERE cidade IS NOT NULL OR estado IS NOT NULL`
      );
      for (const c of clientes) {
        const id = mapaMunicipio.get(
          `${(c.estado || '').toUpperCase()}|${normalizar(c.cidade)}`
        );
        if (id) {
          await client.query(
            'UPDATE clientes SET municipio_id = $1 WHERE id = $2',
            [id, c.id]
          );
        }
      }
    }

    if (temColunaAntiga('enderecos')) {
      const { rows: enderecos } = await client.query(
        `SELECT id, cidade, estado FROM enderecos WHERE cidade IS NOT NULL OR estado IS NOT NULL`
      );
      for (const e of enderecos) {
        const id = mapaMunicipio.get(
          `${(e.estado || '').toUpperCase()}|${normalizar(e.cidade)}`
        );
        if (id) {
          await client.query(
            'UPDATE enderecos SET municipio_id = $1 WHERE id = $2',
            [id, e.id]
          );
        }
      }
    }
  }
}

seed().catch((err) => {
  console.error('Erro no seed:', err.message);
  process.exit(1);
});
