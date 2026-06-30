const { Pool } = require('pg');

const pool = new Pool({
  host: 'localhost',
  port: 5432,
  database: 'matrix_db',
  user: 'matrix',
  password: 'matrix_pass',
});

module.exports = pool;
