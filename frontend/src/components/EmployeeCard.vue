<template>
  <div>
    <!-- Заголовок -->
    <div class="flex align-items-center justify-content-between mb-3">
      <h2 class="text-2xl font-bold text-color flex align-items-center mb-0">
        <font-awesome-icon icon="user-circle" class="mr-2 text-primary" />
        {{ employee.last_name }} {{ employee.first_name }}{{ employee.middle_name ? ' ' + employee.middle_name : '' }}
      </h2>
      <span class="text-color-secondary">{{ employee.position || '' }}</span>
    </div>

    <div class="grid">
      <!-- Радар -->
      <div class="col-12 lg:col-5">
        <Card class="h-full">
          <template #title>
            <font-awesome-icon icon="chart-pie" class="mr-2 text-primary" />Радар компетенций
          </template>
          <template #content>
            <div style="height: 350px;">
              <Chart type="radar" :data="radarData" :options="radarOpts" class="w-full h-full" />
            </div>
          </template>
        </Card>
      </div>

      <!-- Таблица навыков -->
      <div class="col-12 lg:col-7">
        <Card class="h-full">
          <template #title>
            <font-awesome-icon icon="table" class="mr-2 text-primary" />Навыки
          </template>
          <template #content>
            <DataTable
              :value="skills"
              class="p-datatable-sm p-datatable-striped"
              size="small"
              selectionMode="single"
              @rowSelect="onSelect"
            >
              <Column header="Тип" style="width: 60px; text-align: center; ">
                <template #body="slotProps">
                  <font-awesome-icon
                    :icon="skillTypeIcon(slotProps.data.type)"
                    :class="skillTypeColor(slotProps.data.type)"
                    v-tooltip.top="skillTypeText(slotProps.data.type)"
                    size="lg"
                  />
                </template>
              </Column>
              <Column field="skill_name" header="Навык" style="white-space: nowrap;" />
              <Column header="Уровень" style="min-width: 180px; white-space: nowrap;">
                <template #body="slotProps">
                    <font-awesome-icon
                      :icon="levelIcon(slotProps.data.level_value)"
                      :class="expiryClass(slotProps.data.expiryStatus) || levelColor(slotProps.data.level_value)"
                      size="xl"
                      class="mr-2"
                    />
                    <span class="font-bold">{{ slotProps.data.level_name }}</span>
                </template>
              </Column>
              <Column header="Подтвердил" style="white-space: nowrap;">
                <template #body="slotProps">
                  <span v-if="slotProps.data.type === 'skill' && slotProps.data.confirmed_by && slotProps.data.confirmed_by !== '—'">
                    {{ slotProps.data.confirmed_by }}
                  </span>
                  <span v-else-if="slotProps.data.type !== 'skill'" class="text-color-secondary">
                    Не требуется
                  </span>
                </template>
              </Column>

              <Column header="Истекает" style="white-space: nowrap;">
                <template #body="slotProps">
                  {{ formatExpiry(slotProps.data.expiry_date) }}
                </template>
              </Column>
            </DataTable>
          </template>
        </Card>
      </div>
    </div>

    <!-- Детали навыка -->
    <div v-if="selectedSkill" class="mt-2">
      <Card>
        <template #title>
          <font-awesome-icon icon="info-circle" class="mr-2 text-primary" />
          Детали навыка: {{ selectedSkill.skill_name }}
        </template>
        <template #content>
          <div class="grid mb-3">
            <div class="col-12 lg:col-3">
              <h5 class="mb-2"><font-awesome-icon icon="align-left" class="mr-2 text-primary" />Описание</h5>
              <p class="text-color-secondary">{{ selectedSkill.description || '—' }}</p>
            </div>
            <div class="col-12 lg:col-2">
              <h5 class="mb-2"><font-awesome-icon icon="calendar-check" class="mr-2 text-primary" />Срок действия</h5>
              <p class="text-color-secondary">{{ selectedSkill.validity_period ? selectedSkill.validity_period + ' дней' : '—' }}</p>
              <h5 class="mb-2 mt-3"><font-awesome-icon icon="calendar-xmark" class="mr-2 text-primary" />Истекает</h5>
              <p class="text-color-secondary">{{ formatExpiry(selectedSkill.expiry_date) }}</p>
              <h5 class="mb-2 mt-3"><font-awesome-icon icon="user-check" class="mr-2 text-primary" />Подтвердил</h5>
              <p class="text-color-secondary">{{ selectedSkill.confirmed_by || '—' }}</p>
              <h5 class="mb-2"><font-awesome-icon icon="calendar-plus" class="mr-2 text-primary" />Назначен</h5>
              <p class="text-color-secondary">{{ formatDate(selectedSkill.granted_date) }}</p>
            </div>
            <div class="col-12 lg:col-7">
              <h5 class="mb-2"><font-awesome-icon icon="file-lines" class="mr-2 text-primary" />Обоснование</h5>
              <p class="text-color-secondary">Загрузка файлов будет доступна позже.</p>
              <h5 class="mb-2 mt-3"><font-awesome-icon icon="clock-rotate-left" class="mr-2 text-primary" />История подтверждения</h5>
              <p class="text-color-secondary">История изменений будет доступна позже.</p>
            </div>
          </div>
        </template>
      </Card>
    </div>
    <div v-else class="mt-4 text-center text-muted">Выберите навык в таблице, чтобы увидеть детали.</div>
  </div>
</template>

<script setup>
import { ref, watch, computed } from 'vue'
import Card from 'primevue/card'
import Chart from 'primevue/chart'
import DataTable from 'primevue/datatable'
import Column from 'primevue/column'
import { levelIcon, levelColor, levelText, skillTypeIcon, skillTypeColor, skillTypeText } from '../utils.js'

const props = defineProps({ employee: Object, skills: Array, initialSkill: String })
const emit = defineEmits(['select-skill'])

const selectedSkill = ref(null)

watch(() => props.initialSkill, (newVal) => {
  if (newVal) {
    selectedSkill.value = props.skills.find(s => s.skill_name === newVal) || null
  }
}, { immediate: true })

function onSelect(e) { selectedSkill.value = e.data; emit('select-skill', e.data) }

// Радар
const radarData = computed(() => ({
  labels: props.skills.map(s => s.skill_name),
  datasets: [{
    label: `${props.employee.last_name} ${props.employee.first_name}`,
    data: props.skills.map(s => {
      const isExpired = s.expiryStatus === 'expired'
      if (s.type === 'skill') {
        if (isExpired) return 1
        return s.level_value === 0 ? 0.2 : s.level_value
      }
      if (isExpired) return 1
      if (s.level_value === 0) return 4
      return 4
    }),
    backgroundColor: 'rgba(54, 162, 235, 0.2)',
    borderColor: 'rgb(54, 162, 235)',
    borderWidth: 2,
    pointBackgroundColor: props.skills.map(s => {
      if (s.expiryStatus === 'expired') return 'rgba(239, 68, 68, 1)'
      if (s.type === 'permit' || s.type === 'training') return 'rgba(34, 197, 94, 1)'
      return 'rgb(54, 162, 235)'
    }),
    pointBorderColor: props.skills.map(s => {
      if (s.expiryStatus === 'expired') return 'rgba(239, 68, 68, 1)'
      if (s.type === 'permit' || s.type === 'training') return 'rgba(34, 197, 94, 1)'
      return 'rgb(54, 162, 235)'
    }),
    pointRadius: props.skills.map(s => s.expiryStatus === 'expired' ? 4 : 4),
    pointHoverRadius: props.skills.map(s => s.expiryStatus === 'expired' ? 9 : 9)
  }]
}))

const radarOpts = {
  responsive: true, maintainAspectRatio: false,
  scales: { r: { min: 0, max: 4, ticks: { stepSize: 1, display: false }, pointLabels: { font: { size: 11 }, padding: 11 } } },
  plugins: {
    legend: { display: false },
    tooltip: {
      enabled: false,
      external: function(context) {
        const tooltip = context.tooltip
        const el = document.getElementById('radar-tooltip')
        if (!el) return
        if (tooltip.opacity === 0) { el.style.opacity = '0'; return }
        const idx = tooltip.dataPoints[0].dataIndex
        const skill = props.skills[idx]
        const icon = levelIcon(skill.level_value)
        const cls = levelColor(skill.level_value)
        const lvl = levelText(skill.level_value)
        const expired = skill.expiryStatus === 'expired' ? ' (ПРОСРОЧЕН)' : ''
        el.innerHTML = `<i class="fa-solid fa-${icon} ${cls}"></i> ${skill.skill_name}: ${lvl}${expired}`
        el.style.opacity = '1'
        el.style.left = (context.chart.canvas.offsetParent.offsetLeft + tooltip.caretX) + 'px'
        el.style.top = (context.chart.canvas.offsetParent.offsetTop + tooltip.caretY - 30) + 'px'
      }
    }
  }
}

function expiryClass(status) {
  if (status === 'expired') return 'fa-shake text-red-500'
  if (status === 'expiring') return 'fa-beat-fade text-red-500'
  return ''
}

function formatExpiry(isoDate) {
  if (!isoDate) return '—'
  return new Date(isoDate).toLocaleDateString('ru-RU')
}

function formatDate(isoDate) {
  if (!isoDate) return '—'
  return new Date(isoDate).toLocaleDateString('ru-RU')
}

</script>