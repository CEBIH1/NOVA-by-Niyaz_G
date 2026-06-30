<template>
  <div>
    <!-- Заголовок -->
    <div class="flex align-items-center justify-content-between mb-3">
      <h2 class="text-2xl font-bold text-color flex align-items-center mb-0">
        <font-awesome-icon icon="building" class="mr-2 text-primary" />
        {{ department.name }}
      </h2>
      <div class="flex align-items-center gap-3">
        <span class="text-color-secondary">
          <font-awesome-icon icon="user-tie" class="mr-1" />{{ department.head || 'Не назначен' }}
        </span>
        <span class="text-color-secondary p-tag p-tag-info">
          <font-awesome-icon icon="users" class="mr-1" />{{ department.employees.length }} чел.
        </span>
      </div>
    </div>

    <!-- Переключатель режимов + фильтры -->
    <div class="flex justify-content-between align-items-center mb-3">
      <div class="flex gap-2">
        <Button
          :severity="viewMode === 'matrix' ? 'primary' : 'secondary'"
          size="small"
          @click="viewMode = 'matrix'"
        >
          <font-awesome-icon icon="table" class="mr-1" />Матрица
        </Button>
        <Button
          :severity="viewMode === 'radar' ? 'primary' : 'secondary'"
          size="small"
          @click="viewMode = 'radar'"
        >
          <font-awesome-icon icon="chart-pie" class="mr-1" />Радар
        </Button>
      </div>
      <div v-if="viewMode === 'matrix'" class="flex gap-2">
        <Button
          :severity="filterMode === 'all' ? 'primary' : 'secondary'"
          size="small"
          @click="filterMode = 'all'"
        >
          Все
        </Button>
        <Button
          v-if="expiringCount > 0"
          severity="warn"
          size="small"
          @click="filterMode = 'expiring'"
          :outlined="filterMode !== 'expiring'"
        >
          <font-awesome-icon icon="clock" class="mr-1" />
          Истекает ({{ expiringCount }})
        </Button>
        <Button
          v-if="expiredCount > 0"
          severity="danger"
          size="small"
          @click="filterMode = 'expired'"
          :outlined="filterMode !== 'expired'"
        >
          <font-awesome-icon icon="triangle-exclamation" class="mr-1" />
          Просрочено ({{ expiredCount }})
        </Button>
        <Button
          v-if="expiringCount > 0 || expiredCount > 0"
          severity="secondary"
          size="small"
          @click="printMatrix"
        >
          <font-awesome-icon icon="print" class="mr-1" />Печать
        </Button>
      </div>
    </div>

    <!-- Матрица компетенций -->
    <Card v-if="viewMode === 'matrix'">
      <template #title>
        <font-awesome-icon icon="table" class="mr-2 text-primary" />Матрица компетенций
      </template>
      <template #content>
        <DataTable
          :value="filteredMatrixData"
          class="p-datatable-sm p-datatable-striped"
          size="small"
          responsiveLayout="scroll"
          scrollable
          scrollHeight="flex"
        >
          <Column header="Тип" style="width: 60px; text-align: center;">
            <template #body="slotProps">
              <font-awesome-icon
                :icon="skillTypeIcon(slotProps.data.type)"
                :class="skillTypeColor(slotProps.data.type)"
                v-tooltip.top="skillTypeText(slotProps.data.type)"
                size="lg"
              />
            </template>
          </Column>

          <Column field="skill" header="Навык" style="min-width: 200px; white-space: nowrap;" frozen />

          <Column
            v-for="emp in filteredEmployees"
            :key="emp.id"
            style="text-align: center; min-width: 120px;"
          >
            <template #header>
              <div class="text-center text-sm font-normal" style="width: 100%;">{{ emp.name }}</div>
            </template>
            <template #body="slotProps">
              <div style="display: flex; justify-content: center; align-items: center; width: 100%;">
                <span
                  v-if="getSkill(emp.id, slotProps.data.skill)"
                  v-tooltip.top="{ value: skillTooltip(emp.id, slotProps.data.skill), escape: false }"
                  class="cursor-pointer"
                  @click="onSkillClick(emp.id, slotProps.data.skill)"
                >
                  <font-awesome-icon
                    :icon="levelIcon(getSkill(emp.id, slotProps.data.skill).level)"
                    :class="skillIconClass(emp.id, slotProps.data.skill)"
                    size="xl"
                    style="display: block; margin: 0 auto;"
                  />
                </span>
                <span v-else class="text-muted">
                  <font-awesome-icon icon="circle" class="text-gray-300" style="display: block; margin: 0 auto;" />
                </span>
              </div>
            </template>
          </Column>
        </DataTable>
      </template>
    </Card>

    <!-- Радар -->
    <Card v-else>
      <template #title>
        <font-awesome-icon icon="chart-pie" class="mr-2 text-primary" />Радар компетенций
      </template>
      <template #content>
        <div style="height: 500px;">
          <Chart type="radar" :data="radarData" :options="radarOpts" class="w-full h-full" />
        </div>
      </template>
    </Card>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import Card from 'primevue/card'
import Button from 'primevue/button'
import Chart from 'primevue/chart'
import DataTable from 'primevue/datatable'
import Column from 'primevue/column'
import { levelIcon, levelColor, levelText, skillTypeIcon, skillTypeColor, skillTypeText } from '../utils.js'

const props = defineProps({ department: Object, skillsData: Object })
const emit = defineEmits(['select-employee-skill'])

const viewMode = ref('matrix')
const filterMode = ref('all')

const matrixData = computed(() =>
  props.department.skills.map(s => ({ skill: s.name, type: s.type }))
)

const expiringCount = computed(() => {
  let count = 0
  for (const empId in props.skillsData) {
    for (const skillName in props.skillsData[empId]) {
      if (props.skillsData[empId][skillName].expiryStatus === 'expiring') count++
    }
  }
  return count
})

const expiredCount = computed(() => {
  let count = 0
  for (const empId in props.skillsData) {
    for (const skillName in props.skillsData[empId]) {
      if (props.skillsData[empId][skillName].expiryStatus === 'expired') count++
    }
  }
  return count
})

const filteredEmployees = computed(() => {
  if (filterMode.value === 'all') return props.department.employees
  return props.department.employees.filter(emp => {
    const skills = props.skillsData[emp.id]
    if (!skills) return false
    for (const skillName in skills) {
      if (skills[skillName].expiryStatus === filterMode.value) return true
    }
    return false
  })
})

const filteredMatrixData = computed(() => {
  if (filterMode.value === 'all') return matrixData.value
  return matrixData.value.filter(skillRow => {
    for (const empId in props.skillsData) {
      const skill = props.skillsData[empId]?.[skillRow.skill]
      if (skill && skill.expiryStatus === filterMode.value) return true
    }
    return false
  })
})

const radarData = computed(() => ({
  labels: props.department.skills.map(s => s.name),
  datasets: [{
    label: props.department.name,
    data: props.department.skills.map(s => {
      const values = props.department.employees
        .map(emp => {
          const skill = getSkill(emp.id, s.name)
          if (!skill) return 0
          if (skill.expiryStatus === 'expired') return 1
          if (s.type === 'permit' || s.type === 'training') return 4
          return skill.level === 0 ? 0 : skill.level
        })
      if (values.length === 0) return 0
      const sum = values.reduce((a, b) => a + b, 0)
      return Math.round((sum / values.length) * 100) / 100
    }),
    backgroundColor: 'rgba(54,162,235,0.2)',
    borderColor: 'rgb(54,162,235)',
    borderWidth: 2,
    pointBackgroundColor: props.department.skills.map(s => {
      const hasExpired = props.department.employees.some(emp => {
        const skill = getSkill(emp.id, s.name)
        return skill && skill.expiryStatus === 'expired'
      })
      if (hasExpired) return 'rgba(239, 68, 68, 1)'
      if (s.type === 'permit' || s.type === 'training') return 'rgba(34, 197, 94, 1)'
      return 'rgb(54, 162, 235)'
    }),
    pointBorderColor: props.department.skills.map(s => {
      const hasExpired = props.department.employees.some(emp => {
        const skill = getSkill(emp.id, s.name)
        return skill && skill.expiryStatus === 'expired'
      })
      if (hasExpired) return 'rgb(239, 68, 68)'
      if (s.type === 'permit' || s.type === 'training') return 'rgb(34, 197, 94)'
      return 'rgb(54, 162, 235)'
    }),
    pointRadius: 4,
    pointHoverRadius: 9
  }]
}))

const radarOpts = {
  responsive: true,
  maintainAspectRatio: false,
  scales: {
    r: {
      min: 0,
      max: 4,
      ticks: { stepSize: 1, display: false },
      pointLabels: { font: { size: 11 }, padding: 11 }
    }
  },
  plugins: {
    legend: { display: false },
    tooltip: {
      callbacks: {
        title: () => '',
        label: (context) => `Среднее значение по подразделению: ${context.raw}`
      }
    }
  }
}

function getSkill(empId, skillName) {
  return props.skillsData[empId]?.[skillName] || null
}

function skillIconClass(empId, skillName) {
  const s = getSkill(empId, skillName)
  if (!s) return ''
  if (s.expiryStatus === 'expired') return 'text-red-500 fa-shake'
  if (s.expiryStatus === 'expiring') return 'text-red-500 fa-beat-fade'
  return levelColor(s.level)
}

function skillTooltip(empId, skillName) {
  const s = getSkill(empId, skillName)
  if (!s) return ''
  const icon = levelIcon(s.level), cls = levelColor(s.level), lvl = levelText(s.level)
  let status = ''
  if (s.expiryStatus === 'expired') status = ` (ПРОСРОЧЕН с ${s.expiryDate || 'неизвестно'})`
  else if (s.expiryStatus === 'expiring') status = ` (Истекает ${s.expiryDate || 'скоро'})`
  else status = ` (Активен до ${s.expiryDate || '—'})`
  return `<i class="fa-solid fa-${icon} ${cls}"></i> ${lvl}${status}`
}

function onSkillClick(empId, skillName) {
  emit('select-employee-skill', { empId, skillName })
}

// Печатная форма на проблемы
function printMatrix() {
  const now = new Date().toLocaleDateString('ru-RU')
  const headName = props.department.head || 'Не назначен'
  let html = `
    <html>
    <head><title>Матрица компетенций (риски)</title>
    <style>
      body { font-family: Arial, sans-serif; margin: 20px; font-size: 12px; }
      h2 { text-align: center; margin-bottom: 5px; }
      h3 { text-align: center; color: #666; margin-top: 0; }
      table { width: 100%; border-collapse: collapse; margin-top: 10px; }
      th, td { border: 1px solid #ccc; padding: 6px; text-align: center; }
      th { background: #f5f5f5; }
      .skill-name { text-align: left; min-width: 200px; }
      .expiring { color: #f59e0b; }
      .expired { color: #ef4444; }
      @media print { button { display: none; } }
    </style></head>
    <body>
      <h2>Матрица компетенций (риски) — ${props.department.name}</h2>
      <h3>Руководитель: ${headName}. Сформировано: ${now}. Просрочено: ${expiredCount.value}, Истекает: ${expiringCount.value}</h3>
      <table>
        <tr><th>Сотрудник</th><th>Навык</th><th>Статус</th><th>Истекает</th></tr>`

  // Собираем строки в массив
const rows = []

props.department.employees.forEach(emp => {
  if (!emp || !emp.id) return
  const empSkills = props.skillsData[emp.id] || {}
  
  for (const skillName in empSkills) {
    const skill = empSkills[skillName]
    if (skill.expiryStatus === 'expired' || skill.expiryStatus === 'expiring') {
      const icon = skill.expiryStatus === 'expired' ? '🔴' : '🟠'
      const cls = skill.expiryStatus === 'expired' ? 'expired' : 'expiring'
      const status = skill.expiryStatus === 'expired' ? 'ПРОСРОЧЕН' : 'Истекает'
      const date = skill.expiryDate || '—'
      
      rows.push({
        empName: emp.name,
        skillName,
        icon,
        cls,
        status,
        date
      })
    }
  }
})
// Сортируем по дате (меньшая = раньше истекает)
// Перед сортировкой
rows.sort((a, b) => {
  if (a.date === '—') return 1
  if (b.date === '—') return -1
  return b.date.localeCompare(a.date)
})
// Вставляем отсортированные строки
rows.forEach(row => {
  html += `<tr>
    <td>${row.empName}</td>
    <td class="skill-name">${row.icon} ${row.skillName}</td>
    <td class="${row.cls}">${row.status}</td>
    <td>${row.date}</td>
  </tr>`
})

  html += '</table></body></html>'
  
  const win = window.open('', '_blank', 'width=1000,height=700')
  win.document.write(html)
  win.document.close()
  win.print()
}

</script>