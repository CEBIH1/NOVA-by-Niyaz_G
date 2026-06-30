<template>
  <div class="flex h-screen overflow-hidden" style="background: transparent;">
    <div class="flex-shrink-0" style="display:flex;flex-direction:row;">
      <div id="sidebar" class="p-3 flex flex-column shadow-2 surface-section overflow-y-scroll" style="width:300px;min-width:300px;max-width:500px;height:100vh;border-right:1px solid var(--surface-border);">
        <div class="flex align-items-center ml-3 mb-1">
          <img :src="logoImage" alt="VeSkills" style="height: 80px;" />
        </div>
        <PanelMenu :model="menuItems" />
        <Divider />
        <PanelMenu :model="hierarchyItems" :multiple="false"/>
      </div>
      <div id="resizer" style="width:5px;cursor:ew-resize;background:var(--surface-border);" @mousedown="startResize"></div>
    </div>

    <div class="flex-grow-1 p-3 overflow-y-auto">
      <EmployeeCard 
        v-if="viewMode === 'employee' && selectedEmployee" 
        :employee="selectedEmployee" 
        :skills="currentSkills"
        :initialSkill="initialSkill"
        @select-skill="onSkillSelect" 
      />
      <DepartmentCard 
        v-else-if="viewMode === 'department' && selectedDepartment" 
        :department="selectedDepartment" 
        :skillsData="departmentSkillsData"
        @select-employee-skill="onDeptSkillSelect"
      />
    </div>
    <RadarTooltip />
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import PanelMenu from 'primevue/panelmenu'
import Divider from 'primevue/divider'
import EmployeeCard from '../components/EmployeeCard.vue'
import DepartmentCard from '../components/DepartmentCard.vue'
import RadarTooltip from '../components/RadarTooltip.vue'
import logoImage from '@/assets/Dev.png'

import { fetchAllEmployees, fetchEmployeeSkills } from '@/api/employees.js'
import { fetchActiveSkills, fetchMatrix } from '@/api/skills.js'
import { fetchDepartmentTree } from '@/api/departments.js'

// ==============================
// СОСТОЯНИЕ
// ==============================

const viewMode = ref('employee')
const selectedEmployee = ref(null)
const selectedDepartment = ref(null)
const initialSkill = ref(null)

const allEmployees = ref([])
const allSkills = ref([])
const currentSkills = ref([])
const departmentSkillsData = ref({})
const loading = ref(true)
const departmentTree = ref([])
const employeeMap = ref(new Map())

// ==============================
// ЗАГРУЗКА ПРИ СТАРТЕ
// ==============================

onMounted(async () => {
  try {
    const [employees, skills, tree] = await Promise.all([
      fetchAllEmployees(),
      fetchActiveSkills(),
      fetchDepartmentTree()
    ])
    allEmployees.value = employees
    employees.forEach(e => employeeMap.value.set(e.id, e))
    allSkills.value = skills
    departmentTree.value = tree

    // Открываем завод по умолчанию
    if (tree.length > 0) {
      await openDepartment(tree[0])
    }
  } catch (error) {
    console.error('Ошибка загрузки данных:', error.message)
  } finally {
    loading.value = false
  }
})

// ==============================
// ИЕРАРХИЯ ОТДЕЛОВ
// ==============================

function buildHierarchyItems(nodes) {
  return nodes.map(node => {
    const item = {
      label: node.name,
      icon: 'fa-solid fa-building',
      expanded: true,
      command: () => openDepartment(node)
    }

    const children = []

    if (node.children && node.children.length > 0) {
      children.push(...buildHierarchyItems(node.children))
    }

    if (node.employees && node.employees.length > 0) {
      if (node.children && node.children.length > 0) {
        children.push({
          label: 'Руководители',
          icon: 'fa-solid fa-user-tie',
          expanded: true,
          items: node.employees.map(emp => ({
            label: `${emp.last_name} ${emp.first_name?.charAt(0) || ''}.${emp.middle_name ? ' ' + emp.middle_name.charAt(0) + '.' : ''}`,
            icon: 'fa-solid fa-user',
            command: (event) => {
              event.originalEvent.preventDefault()
              selectEmployee(emp)
            }
          }))
        })
      } else {
        children.push(...node.employees.map(emp => ({
          label: `${emp.last_name} ${emp.first_name?.charAt(0) || ''}.${emp.middle_name ? ' ' + emp.middle_name.charAt(0) + '.' : ''}`,
          icon: 'fa-solid fa-user',
          command: (event) => {
            event.originalEvent.preventDefault()
            selectEmployee(emp)
          }
        })))
      }
    }

    if (children.length > 0) {
      item.items = children
    }

    return item
  })
}

const hierarchyItems = computed(() => {
  if (!departmentTree.value.length) return []
  return buildHierarchyItems(departmentTree.value)
})

// ==============================
// ОТКРЫТИЕ ОТДЕЛА
// ==============================

async function openDepartment(node) {
  viewMode.value = 'department'

  const employeesWithName = node.employees.map(emp => ({
    ...emp,
    name: `${emp.last_name} ${emp.first_name}${emp.middle_name ? ' ' + emp.middle_name : ''}`
  }))

  const headEmployee = allEmployees.value?.find(e => e.id === node.headId)
  const headName = headEmployee 
    ? `${headEmployee.last_name} ${headEmployee.first_name?.charAt(0) || ''}.${headEmployee.middle_name ? ' ' + headEmployee.middle_name.charAt(0) + '.' : ''}`
    : 'Не назначен'

  const ids = node.employees.map(e => e.id)
  if (ids.length > 0) {
    try {
      const matrix = await fetchMatrix(ids)
      const result = {}
      for (const row of matrix) {
        if (!result[row.employee_id]) result[row.employee_id] = {}
        result[row.employee_id][row.skill_name] = {
          level: row.level_value,
          expiryStatus: computeExpiryStatus(row.expiry_date),
          expiryDate: row.expiry_date ? formatDate(row.expiry_date) : '—'
        }
      }
      departmentSkillsData.value = result

      const usedSkillNames = new Set()
      for (const empId in result) {
        for (const skillName in result[empId]) {
          usedSkillNames.add(skillName)
        }
      }
      const relevantSkills = allSkills.value.filter(s => usedSkillNames.has(s.name))

      selectedDepartment.value = {
        name: node.name,
        head: headName,
        employees: employeesWithName,
        skills: relevantSkills
      }
    } catch (error) {
      console.error('Ошибка загрузки матрицы:', error.message)
      departmentSkillsData.value = {}
      selectedDepartment.value = {
        name: node.name,
        head: headName,
        employees: employeesWithName,
        skills: []
      }
    }
  } else {
    selectedDepartment.value = {
      name: node.name,
      head: headName,
      employees: [],
      skills: []
    }
  }
}

function computeExpiryStatus(expiryDate) {
  if (!expiryDate) return 'active'
  const now = new Date()
  const exp = new Date(expiryDate)
  if (exp < now) return 'expired'
  const threeMonths = new Date()
  threeMonths.setMonth(threeMonths.getMonth() + 3)
  if (exp < threeMonths) return 'expiring'
  return 'active'
}

function formatDate(isoDate) {
  if (!isoDate) return '—'
  const d = new Date(isoDate)
  return d.toLocaleDateString('ru-RU')
}

// ==============================
// МЕНЮ
// ==============================

const menuItems = [
  {
    label: 'Меню',
    icon: 'fa-solid fa-bars',
    expanded: true,
    items: [
      { label: 'Матрица компетенций', icon: 'fa-solid fa-table' },
      { label: 'Навыки', icon: 'fa-solid fa-star',
        items: [
          { label: 'Все навыки', icon: 'fa-solid fa-list' },
          { label: 'Допуски', icon: 'fa-solid fa-shield' },
          { label: 'Обучения', icon: 'fa-solid fa-book' }
        ]
      },
      { label: 'Верификация', icon: 'fa-solid fa-circle-check' },
      { label: 'Администрирование', icon: 'fa-solid fa-gear' }
    ]
  }
]

// ==============================
// ВСПОМОГАТЕЛЬНЫЕ ФУНКЦИИ
// ==============================

function getEmployeeName(uuid) {
  if (!uuid) return '—'
  const emp = employeeMap.value.get(uuid)
  return emp ? `${emp.last_name} ${emp.first_name?.charAt(0) || ''}.` : uuid
}

// ==============================
// ДЕЙСТВИЯ
// ==============================

async function selectEmployee(emp) {
  selectedEmployee.value = emp
  viewMode.value = 'employee'
  initialSkill.value = null
  try {
    const skills = await fetchEmployeeSkills(emp.id)
    currentSkills.value = skills.map(s => ({
      ...s,
      expiryStatus: computeExpiryStatus(s.expiry_date),
      confirmed_by: getEmployeeName(s.confirmed_by)
    }))
  } catch (error) {
    console.error('Ошибка загрузки навыков сотрудника:', error.message)
    currentSkills.value = []
  }
}

function onSkillSelect(skill) {}

function onDeptSkillSelect({ empId, skillName }) {
  const emp = allEmployees.value.find(e => e.id === empId)
  if (emp) {
    selectEmployee(emp)
    initialSkill.value = skillName
  }
}

// ==============================
// РЕСАЙЗ САЙДБАРА
// ==============================

function startResize(e) {
  const sb = document.getElementById('sidebar')
  const sx = e.clientX, sw = sb.offsetWidth
  function mm(ev) { const nw = sw + ev.clientX - sx; if (nw >= 220 && nw <= 500) sb.style.width = nw + 'px' }
  function mu() { document.removeEventListener('mousemove', mm); document.removeEventListener('mouseup', mu) }
  document.addEventListener('mousemove', mm); document.addEventListener('mouseup', mu)
}
</script>

<style scoped>
:deep(.p-panelmenu-item-icon.fa-building),
:deep(.p-panelmenu-header-icon.fa-building){
  color: var(--primary-color) !important;
}
:deep(.p-panelmenu-item-icon.fa-user-tie) {
  color: #10b981 !important;
}
:deep(.p-panelmenu-item-icon.fa-user) {
  color: #3b82f6 !important;
}
</style>