const pool = require('./db');

// =====================================================================
// СПРАВОЧНИКИ
// =====================================================================

// Получить все активные навыки (для матрицы)
async function getActiveSkills() {
  const result = await pool.query(
    `SELECT id, name, is_group, parent_id, path, validity_period, type, has_levels, description
     FROM skills
     WHERE status = 'active' AND is_group = false
     ORDER BY path`
  );
  return result.rows;
}

// =====================================================================
// МАТРИЦА КОМПЕТЕНЦИЙ
// =====================================================================

// Получить матрицу компетенций для группы сотрудников
async function getMatrix(employeeIds) {
  if (!employeeIds || employeeIds.length === 0) {
    return [];
  }
  
  const placeholders = employeeIds.map((_, i) => `$${i + 1}`).join(', ');
  
  const result = await pool.query(
    `SELECT es.employee_id, es.skill_id, s.name as skill_name, s.type,
            es.level_id, sl.name as level_name, sl.value as level_value,
            es.granted_date, es.granted_by as confirmed_by,
            es.granted_date + s.validity_period * INTERVAL '1 day' AS expiry_date
     FROM employee_skills es
     JOIN skill_levels sl ON es.level_id = sl.id
     JOIN skills s ON es.skill_id = s.id
     WHERE es.employee_id IN (${placeholders})
     ORDER BY es.employee_id, s.path`,
    employeeIds
  );
  
  return result.rows;
}

// =====================================================================
// КОМПЕТЕНЦИИ ОДНОГО СОТРУДНИКА
// =====================================================================

// Получить компетенции одного сотрудника
async function getEmployeeSkills(employeeId) {
  const result = await pool.query(
    `SELECT es.skill_id, s.name as skill_name, s.type, s.description,
            s.validity_period,
            es.level_id, sl.name as level_name, sl.value as level_value,
            es.granted_date, es.granted_by as confirmed_by,
            es.granted_date + s.validity_period * INTERVAL '1 day' AS expiry_date
     FROM employee_skills es
     JOIN skills s ON es.skill_id = s.id
     JOIN skill_levels sl ON es.level_id = sl.id
     WHERE es.employee_id = $1
     ORDER BY s.path`,
    [employeeId]
  );
  return result.rows;
}

// =====================================================================
// НАЗНАЧЕНИЕ КОМПЕТЕНЦИИ
// =====================================================================

// Назначить или обновить компетенцию сотруднику
async function assignSkill(employeeId, skillId, levelId, grantedBy) {
  const result = await pool.query(
    `INSERT INTO employee_skills (employee_id, skill_id, level_id, granted_by)
     VALUES ($1, $2, $3, $4)
     ON CONFLICT (employee_id, skill_id)
     DO UPDATE SET level_id = $3, granted_by = $4, granted_date = now()
     RETURNING *`,
    [employeeId, skillId, levelId, grantedBy]
  );
  return result.rows[0];
}

// =====================================================================
// ИСТОРИЯ ИЗМЕНЕНИЙ
// =====================================================================

// Получить историю изменений навыка сотрудника
async function getSkillHistory(employeeId, skillId) {
  const result = await pool.query(
    `SELECT 
       changed_at as date,
       old_level_id,
       new_level_id,
       changed_by,
       comment_text as comment
     FROM skill_history
     WHERE employee_id = $1 AND skill_id = $2
     ORDER BY changed_at DESC`,
    [employeeId, skillId]
  );
  return result.rows;
}

// =====================================================================
// ПРУФЫ (ФАЙЛЫ ПОДТВЕРЖДЕНИЯ)
// =====================================================================

// Получить загруженные файлы для навыка сотрудника
async function getSkillProofs(employeeId, skillId) {
  const result = await pool.query(
    `SELECT 
       id, file_name as title, file_url as url, file_type as type,
       uploaded_at as date, uploaded_by as uploadedBy
     FROM skill_proofs
     WHERE employee_id = $1 AND skill_id = $2
     ORDER BY uploaded_at DESC`,
    [employeeId, skillId]
  );
  return result.rows;
}

module.exports = { 
  getActiveSkills, 
  getMatrix, 
  assignSkill, 
  getEmployeeSkills,
  getSkillHistory,
  getSkillProofs
};