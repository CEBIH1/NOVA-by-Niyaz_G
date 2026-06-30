// =====================================================================
// УРОВНИ КОМПЕТЕНЦИЙ (0–4)
// =====================================================================

/** Иконка Font Awesome для уровня */
export function levelIcon(level) {
  if (level === 4) return 'medal'
  if (level === 3) return 'medal'
  if (level === 2) return 'medal'
  if (level === 1) return 'seedling'
  return 'file-lines'
}

/** CSS-класс цвета текста для уровня */
export function levelColor(level) {
  if (level === 4) return 'text-yellow-500'
  if (level === 3) return 'text-gray-400'
  if (level === 2) return 'text-orange-500'
  if (level === 1) return 'text-green-500'
  return 'text-green-500'
}

/** Человекочитаемое название уровня */
export function levelText(level) {
  return ['Получен', 'Начальный', 'Базовый', 'Продвинутый', 'Эксперт'][level] || 'Не подтверждён'
}

/** Цвета заливки (rgba) — для графиков и бейджей */
export const levelColors = {
  4: 'rgba(255, 215, 0, 0.8)',   // Золотой — Эксперт
  3: 'rgba(192, 192, 192, 0.8)', // Серебряный — Продвинутый
  2: 'rgba(205, 127, 50, 0.8)',  // Бронзовый — Базовый
  1: 'rgba(76, 175, 80, 0.8)',   // Зелёный — Начальный
  0: 'rgba(76, 175, 80, 0.8)'  // Зелёный — Получен
}

// =====================================================================
// ТИПЫ НАВЫКОВ (skill / permit / training)
// =====================================================================

/** Иконка для типа навыка */
export function skillTypeIcon(type) {
  if (type === 'skill') return 'medal'
  if (type === 'permit') return 'user-shield'
  if (type === 'training') return 'book'
  return 'circle'
}

/** CSS-класс цвета для типа навыка */
export function skillTypeColor(type) {
  if (type === 'skill') return 'text-yellow-500'
  if (type === 'permit') return 'text-blue-500'
  if (type === 'training') return 'text-green-500'
  return 'text-gray-500'
}

/** Человекочитаемое название типа навыка */
export function skillTypeText(type) {
  if (type === 'skill') return 'Навык'
  if (type === 'permit') return 'Допуск'
  if (type === 'training') return 'Обучение'
  return ''
}

// =====================================================================
// ПРУФЫ (типы вложений)
// =====================================================================

/** Иконка для типа пруфа */
export function proofIcon(type) {
  if (type === 'video') return 'video'
  if (type === 'document') return 'file-lines'
  if (type === 'photo') return 'image'
  return 'file'
}