// ===== VeSkills Utils =====
// Сохранить как frontend/src/utils.js

export function levelIcon(level) {
    if (level === 4) return 'medal'
    if (level === 3) return 'medal'
    if (level === 2) return 'medal'
    if (level === 1) return 'leaf'
    return 'minus'
  }
  
  export function levelColor(level) {
    if (level === 4) return 'text-yellow-500'
    if (level === 3) return 'text-gray-400'
    if (level === 2) return 'text-orange-500'
    if (level === 1) return 'text-green-500'
    return 'text-gray-500'
  }
  
  export function levelText(level) {
    return ['Не подтверждён', 'Начальный', 'Базовый', 'Продвинутый', 'Эксперт'][level] || 'Не подтверждён'
  }
  
  export const levelColors = {
    4: 'rgba(212, 175, 55, 0.8)',   // золотой
    3: 'rgba(192, 192, 192, 0.8)', // серебряный
    2: 'rgba(205, 127, 50, 0.8)',  // бронзовый
    1: 'rgba(76, 175, 80, 0.8)',   // зелёный
    0: 'rgba(158, 158, 158, 0.8)'  // серый
  }