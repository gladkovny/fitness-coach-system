/**
 * FITNESS COACH SYSTEM — API Module
 * Общие функции для работы с Master API
 */

// ═══════════════════════════════════════════════════════════
// CONFIG
// ═══════════════════════════════════════════════════════════

const API_CONFIG = {
  // URL по умолчанию (можно переопределить в localStorage)
  DEFAULT_URL: 'https://script.google.com/macros/s/AKfycbzLfiQUxi5HAojhxaitEpqUxrn7E0XFEDFSNc2WGbgVrYNv14awSB7W7VigbcbmvOX9/exec',
  
  get URL() {
    return localStorage.getItem('api_url') || this.DEFAULT_URL;
  },
  
  set URL(value) {
    localStorage.setItem('api_url', value);
  },
  
  get CLIENT_ID() {
    // Приоритет: URL param > localStorage > default
    return new URLSearchParams(window.location.search).get('client') || 
           localStorage.getItem('client_id') || 
           'yaroslav';
  },
  
  set CLIENT_ID(value) {
    localStorage.setItem('client_id', value);
  }
};

// ═══════════════════════════════════════════════════════════
// API FUNCTIONS
// ═══════════════════════════════════════════════════════════

/**
 * GET запрос к API
 * @param {string} action - Название action
 * @param {Object} params - Дополнительные параметры
 * @returns {Promise<Object>} - Ответ API
 */
async function apiGet(action, params = {}) {
  const url = new URL(API_CONFIG.URL);
  url.searchParams.set('action', action);
  
  // Добавляем все параметры
  Object.entries(params).forEach(([key, value]) => {
    if (value != null) {
      url.searchParams.set(key, value);
    }
  });
  
  const response = await fetch(url.toString());
  return response.json();
}

/**
 * POST запрос к API
 * @param {string} action - Название action
 * @param {Object} data - Данные для отправки
 * @returns {Promise<Object>} - Ответ API
 */
async function apiPost(action, data = {}) {
  const response = await fetch(API_CONFIG.URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ action, ...data })
  });
  return response.json();
}

// ═══════════════════════════════════════════════════════════
// COMMON API CALLS
// ═══════════════════════════════════════════════════════════

/**
 * Проверка API
 */
async function pingAPI() {
  return apiGet('ping');
}

/**
 * Получить список клиентов
 */
async function getClients() {
  return apiGet('getClients');
}

/**
 * Получить данные клиента для дашборда
 * @param {string} clientId 
 * @param {string} period - 'block' | '3m' | 'all'
 */
async function getOfflineDashboard(clientId, period = 'block') {
  // Пробуем V2, если не работает — V1
  let result = await apiGet('getOfflineDashboardV2', { clientId, period });
  
  if (result.error && result.error.includes('Unknown action')) {
    result = await apiGet('getOfflineDashboard', { clientId });
  }
  
  return result;
}

/**
 * Получить профиль клиента
 * @param {string} clientId 
 */
async function getClientProfile(clientId) {
  return apiGet('getClientProfile', { clientId });
}

/**
 * Получить цели клиента
 * @param {string} clientId 
 */
async function getGoals(clientId) {
  return apiGet('getGoals', { clientId });
}

/**
 * Получить целевое КБЖУ
 * @param {string} clientId 
 */
async function getNutrition(clientId) {
  return apiGet('getNutrition', { clientId });
}

/**
 * Получить базу упражнений
 * @param {string} search - Поисковый запрос
 * @param {string} category - Категория
 */
async function getExercises(search = '', category = '') {
  return apiGet('getExercises', { search, category });
}

/**
 * Получить историю упражнения
 * @param {string} clientId 
 * @param {string} exerciseId 
 * @param {number} limit 
 */
async function getExerciseHistory(clientId, exerciseId, limit = 10) {
  return apiGet('getExerciseHistory', { clientId, exerciseId, limit });
}

/**
 * Получить последние тренировки
 * @param {string} clientId 
 * @param {number} limit 
 */
async function getRecentSessions(clientId, limit = 10) {
  return apiGet('getRecentSessions', { clientId, limit });
}

/**
 * Получить обязательные задачи
 * @param {string} clientId 
 */
async function getMandatoryTasks(clientId) {
  return apiGet('getMandatoryTasks', { clientId });
}

/**
 * Получить блоки тренировок
 * @param {string} clientId 
 */
async function getTrainingBlocks(clientId) {
  return apiGet('getTrainingBlocks', { clientId });
}

// ═══════════════════════════════════════════════════════════
// WRITE OPERATIONS
// ═══════════════════════════════════════════════════════════

/**
 * Начать тренировку
 * @param {string} clientId 
 * @param {Object} data - { date, type, notes }
 */
async function startSession(clientId, data) {
  return apiPost('startSession', { clientId, ...data });
}

/**
 * Добавить подход
 * @param {string} clientId 
 * @param {Object} setData 
 */
async function addSet(clientId, setData) {
  return apiPost('addSet', { clientId, ...setData });
}

/**
 * Завершить тренировку
 * @param {string} clientId 
 * @param {string} sessionId 
 * @param {Object} data - { notes, rating }
 */
async function finishSession(clientId, sessionId, data = {}) {
  return apiPost('finishSession', { clientId, sessionId, ...data });
}

/**
 * Удалить тренировку
 * @param {string} clientId 
 * @param {string} sessionId 
 */
async function deleteSession(clientId, sessionId) {
  return apiPost('deleteSession', { clientId, sessionId });
}

/**
 * Сохранить вводную оценку
 * @param {string} clientId 
 * @param {string} date 
 * @param {Object} assessments 
 */
async function saveAssessment(clientId, date, assessments) {
  return apiPost('saveAssessment', { clientId, date, assessments });
}

/**
 * Обновить профиль клиента
 * @param {string} clientId 
 * @param {Object} updates 
 */
async function updateClientProfile(clientId, updates) {
  return apiPost('updateClientProfile', { clientId, updates });
}

/**
 * Обновить статус клиента
 * @param {string} clientId 
 * @param {string} status 
 */
async function updateClientStatus(clientId, status) {
  return apiPost('updateClientStatus', { clientId, status });
}

/**
 * Создать тренировочный блок
 * @param {string} clientId 
 * @param {Object} blockData 
 */
async function createTrainingBlock(clientId, blockData) {
  return apiPost('createTrainingBlock', { clientId, ...blockData });
}

// ═══════════════════════════════════════════════════════════
// CACHE HELPERS
// ═══════════════════════════════════════════════════════════

/**
 * Кэшировать данные
 * @param {string} key 
 * @param {Object} data 
 */
function cacheData(key, data) {
  try {
    localStorage.setItem(key, JSON.stringify(data));
  } catch (e) {
    console.warn('Cache write failed:', e);
  }
}

/**
 * Получить данные из кэша
 * @param {string} key 
 * @returns {Object|null}
 */
function getCachedData(key) {
  try {
    const cached = localStorage.getItem(key);
    return cached ? JSON.parse(cached) : null;
  } catch (e) {
    return null;
  }
}

/**
 * Очистить кэш клиента
 * @param {string} clientId 
 */
function clearClientCache(clientId) {
  const keys = Object.keys(localStorage).filter(k => k.includes(clientId));
  keys.forEach(k => localStorage.removeItem(k));
}
