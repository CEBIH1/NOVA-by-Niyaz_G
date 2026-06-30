const pool = require('./db');

// Получить все отделы (плоским списком)
async function getAllDepartments() {
  const result = await pool.query(
    `SELECT id, parent_id, path, name, head_id
     FROM departments
     ORDER BY path`
  );
  return result.rows;
}

// Получить сотрудников, привязанных к отделам
async function getDepartmentEmployees(departmentId) {
  const result = await pool.query(
    `SELECT e.id, e.last_name, e.first_name, e.middle_name, e.position, e.email
     FROM employees e
     WHERE e.department_id = $1
     ORDER BY e.last_name, e.first_name`,
    [departmentId]
  );
  return result.rows;
}

// Получить всех сотрудников с их department_id (для построения дерева)
async function getAllEmployeesWithDept() {
  const result = await pool.query(
    `SELECT id, last_name, first_name, middle_name, position, email, department_id
     FROM employees
     WHERE status = 'active'
     ORDER BY last_name, first_name`
  );
  return result.rows;
}

module.exports = { getAllDepartments, getDepartmentEmployees, getAllEmployeesWithDept };