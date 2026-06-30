// src/api/employees.js
// Функции для работы с API сотрудников

import { apiGet } from './client.js'

/**
 * Получить список всех сотрудников.
 * Вызывает GET /api/employees
 * @returns {Promise<Array>} массив объектов сотрудников из БД
 */
export function fetchAllEmployees() {
  return apiGet('/employees')
}

/**
 * Получить компетенции одного сотрудника.
 * Вызывает GET /api/employees/:id/skills
 * @param {number|string} id - ID сотрудника в базе
 * @returns {Promise<Array>} массив навыков сотрудника
 */
export function fetchEmployeeSkills(id) {
  return apiGet(`/employees/${id}/skills`)
}