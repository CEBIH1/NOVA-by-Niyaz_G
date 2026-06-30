const pool = require('./db');

async function getAllEmployees() {
  const result = await pool.query('SELECT * FROM employees ORDER BY last_name, first_name');
  return result.rows;
}

module.exports = { getAllEmployees };
