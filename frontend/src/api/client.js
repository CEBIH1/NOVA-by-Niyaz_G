// src/api/client.js
// Базовый модуль для всех запросов к бэкенду

// Адрес сервера. Когда проект будет на другом сервере, поменять здесь.
const BASE_URL = 'http://193.233.245.75/api'

/**
 * Универсальная функция для GET-запросов к API.
 * Все остальные функции в api/ будут использовать её.
 *
 * @param {string} path - путь эндпоинта, например '/employees'
 * @param {object} params - объект с query-параметрами, например { ids: '1,2,3' }
 * @returns {Promise<any>} - данные, которые вернул сервер (уже распарсенный JSON)
 */
export async function apiGet(path, params = {}) {
  // 1. Собираем полный URL
  const url = new URL(`${BASE_URL}${path}`)

  // 2. Добавляем query-параметры к URL
  //    Object.entries(params) превращает { ids: '1,2,3' } в [['ids', '1,2,3']]
  //    forEach перебирает эти пары и добавляет их к url
  Object.entries(params).forEach(([key, value]) => {
    url.searchParams.append(key, value)
  })

  // 3. Делаем запрос
  //    fetch — встроенная в браузер функция для HTTP-запросов
  //    await — ждём ответа от сервера, но не блокируем весь JavaScript
  const response = await fetch(url.toString())

  // 4. Проверяем, успешно ли выполнен запрос
  //    response.ok — true, если статус 200-299
  if (!response.ok) {
    // Пытаемся прочитать сообщение об ошибке из ответа сервера
    const error = await response.json().catch(() => ({ error: response.statusText }))
    // Бросаем исключение — его поймает тот, кто вызвал apiGet
    throw new Error(error.error || `Ошибка ${response.status}`)
  }

  // 5. Парсим JSON из ответа и возвращаем
  //    response.json() — тоже асинхронный метод, поэтому await
  return response.json()
}
