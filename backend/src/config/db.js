require('dotenv').config();
const dns = require('dns');
const { Pool } = require('pg');

dns.setDefaultResultOrder('ipv4first');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  max: 10,
  ssl:
    process.env.DB_SSL === 'true'
      ? { rejectUnauthorized: false }
      : false,
});

module.exports = { pool };
