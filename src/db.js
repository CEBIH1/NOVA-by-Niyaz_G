const { Pool } = require('pg');

const pool = new Pool({
  host: 'db.ztflwtlpzwnurgvqbzrh.supabase.co',
  port: 5432,
  database: 'postgres',
  user: 'postgres',
  password: process.env.DB_PASSWORD,
  ssl: { rejectUnauthorized: false },
  family: 4
});

module.exports = pool;
