// src/api/skills.js
// Функции для работы с API навыков и матрицы

import { apiGet } from './client.js'

/**
 * Получить все активные навыки (без групп).
 * Вызывает GET /api/skills
 * @returns {Promise<Array>} массив объектов навыков
 */
export function fetchActiveSkills() {
  return apiGet('/skills')
}

/**
 * Получить матрицу компетенций для списка сотрудников.
 * Вызывает GET /api/matrix?ids=1,2,3
 * @param {number[]} employeeIds - массив ID сотрудников
 * @returns {Promise<Array>} матрица: employee_id, skill_id, level_name, level_value, expiry_date
 */
export function fetchMatrix(employeeIds) {
  if (!employeeIds || employeeIds.length === 0) {
    return Promise.resolve([]) // пустой массив, без запроса к серверу
  }
  return apiGet('/matrix', { ids: employeeIds.join(',') })
}