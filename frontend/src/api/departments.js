import { apiGet } from './client.js'

export function fetchDepartmentTree() {
  return apiGet('/departments/tree')
}