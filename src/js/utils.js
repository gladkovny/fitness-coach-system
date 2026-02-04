/**
 * FITNESS COACH SYSTEM — Utilities Module
 * Общие утилиты и хелперы
 */

// ═══════════════════════════════════════════════════════════
// DATE FORMATTING
// ═══════════════════════════════════════════════════════════

/**
 * Форматировать дату в короткий формат (12 янв)
 * @param {string|Date} dateStr
 * @returns {string}
 */
function formatDate(dateStr) {
  if (!dateStr) return '';
  try {
    return new Date(dateStr).toLocaleDateString('ru-RU', {
      day: 'numeric',
      month: 'short',
    });
  } catch {
    return dateStr;
  }
}

/**
 * Форматировать дату в полный формат (12 января 2026)
 * @param {string|Date} dateStr
 * @returns {string}
 */
function formatDateFull(dateStr) {
  if (!dateStr) return '';
  try {
    return new Date(dateStr).toLocaleDateString('ru-RU', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });
  } catch {
    return dateStr;
  }
}

/**
 * Форматировать дату в ISO (YYYY-MM-DD)
 * @param {Date} date
 * @returns {string}
 */
function formatDateISO(date) {
  const d = date || new Date();
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * Получить сегодняшнюю дату в ISO
 * @returns {string}
 */
function getTodayISO() {
  return formatDateISO(new Date());
}

/**
 * Рассчитать возраст по дате рождения
 * @param {string} birthDate
 * @returns {number|null}
 */
function calculateAge(birthDate) {
  if (!birthDate) return null;
  try {
    const birth = new Date(birthDate);
    if (isNaN(birth.getTime())) return null;

    const today = new Date();
    let age = today.getFullYear() - birth.getFullYear();
    const m = today.getMonth() - birth.getMonth();

    if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) {
      age--;
    }
    return age;
  } catch {
    return null;
  }
}

// ═══════════════════════════════════════════════════════════
// NUMBER FORMATTING
// ═══════════════════════════════════════════════════════════

/**
 * Форматировать число (1500 → 1.5k)
 * @param {number} n
 * @returns {string}
 */
function formatNumber(n) {
  if (n >= 1000) return Math.round(n / 100) / 10 + 'k';
  return Math.round(n);
}

/**
 * Форматировать число с разделителями (1000 → 1 000)
 * @param {number} n
 * @returns {string}
 */
function formatNumberWithSpaces(n) {
  return n.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
}

/**
 * Округлить до N знаков после запятой
 * @param {number} n
 * @param {number} decimals
 * @returns {number}
 */
function round(n, decimals = 1) {
  const factor = Math.pow(10, decimals);
  return Math.round(n * factor) / factor;
}

// ═══════════════════════════════════════════════════════════
// UI HELPERS
// ═══════════════════════════════════════════════════════════

/**
 * Показать toast-уведомление
 * @param {string} message
 * @param {string} type - 'info' | 'success' | 'error'
 * @param {number} duration - мс
 */
function showToast(message, type = 'info', duration = 3000) {
  // Удаляем старый toast
  document.querySelector('.toast')?.remove();

  const toast = document.createElement('div');
  toast.className = `toast ${type}`;
  toast.textContent = message;
  document.body.appendChild(toast);

  setTimeout(() => toast.remove(), duration);
}

/**
 * Показать loading overlay
 * @param {string} text
 */
function showLoading(text = 'Загрузка...') {
  let overlay = document.getElementById('loadingOverlay');

  if (!overlay) {
    overlay = document.createElement('div');
    overlay.id = 'loadingOverlay';
    overlay.className = 'loading-overlay';
    overlay.innerHTML = `
      <div class="loading-content">
        <div class="spinner"></div>
        <div id="loadingText">${text}</div>
      </div>
    `;
    document.body.appendChild(overlay);
  } else {
    const textEl = document.getElementById('loadingText');
    if (textEl) textEl.textContent = text;
    overlay.style.display = 'flex';
  }
}

/**
 * Скрыть loading overlay
 */
function hideLoading() {
  const overlay = document.getElementById('loadingOverlay');
  if (overlay) {
    overlay.style.display = 'none';
  }
}

/**
 * Закрыть модальное окно
 * @param {string} modalId
 */
function closeModal(modalId) {
  const modal = document.getElementById(modalId);
  if (modal) {
    modal.classList.remove('active');
  }
}

// ═══════════════════════════════════════════════════════════
// VALIDATION
// ═══════════════════════════════════════════════════════════

/**
 * Проверить ИМТ и вернуть CSS класс
 * @param {number} bmi
 * @returns {string}
 */
function getBmiClass(bmi) {
  const val = parseFloat(bmi);
  if (isNaN(val)) return '';
  if (val < 18.5) return 'text-warning';
  if (val < 25) return 'text-success';
  if (val < 30) return 'text-warning';
  return 'text-danger';
}

/**
 * Проверить оценку (1-5) и вернуть CSS класс
 * @param {number} rating
 * @returns {string}
 */
function getRatingClass(rating) {
  if (!rating) return '';
  if (rating >= 4) return 'text-success';
  if (rating >= 3) return 'text-warning';
  return 'text-danger';
}

// ═══════════════════════════════════════════════════════════
// ICONS (HTML entities для избежания проблем с кодировкой)
// ═══════════════════════════════════════════════════════════

const ICONS = {
  block: '&#128230;', // 📦
  target: '&#127919;', // 🎯
  muscle: '&#128170;', // 💪
  leg: '&#129461;', // 🦵
  back: '&#128281;', // 🔙
  chest: '&#9881;', // ⚙️
  chart: '&#128202;', // 📊
  chartUp: '&#128200;', // 📈
  trophy: '&#127942;', // 🏆
  calendar: '&#128197;', // 📅
  weight: '&#127947;', // 🏋️
  rocket: '&#128640;', // 🚀
  party: '&#127881;', // 🎉
  clipboard: '&#128203;', // 📋
  gear: '&#9881;', // ⚙️
  sad: '&#128533;', // 😕
  scale: '&#9878;', // ⚖️
  fire: '&#128293;', // 🔥
  check: '&#10003;', // ✓
  cross: '&#10007;', // ✗
  arrow: '&#9660;', // ▼
};

// ═══════════════════════════════════════════════════════════
// LABELS (Перевод enum значений)
// ═══════════════════════════════════════════════════════════

const LABELS = {
  // Цели
  weight_loss: 'Похудение',
  muscle_gain: 'Набор массы',
  general_fitness: 'Общая форма',
  health_wellness: 'Здоровье',
  strength: 'Сила',
  endurance: 'Выносливость',
  rehab: 'Реабилитация',
  other: 'Другое',

  // Опыт
  none: 'Нет опыта',
  less_6m: 'Менее 6 мес',
  '6m_2y': '6 мес — 2 года',
  over_2y: 'Более 2 лет',

  // Активность (active для уровня активности и статуса клиента — один лейбл)
  sedentary: 'Сидячий',
  light: 'Лёгкая',
  moderate: 'Умеренная',
  very_active: 'Очень активная',

  // Сроки
  '1_month': '1 месяц',
  '3_months': '3 месяца',
  '6_months': '6 месяцев',
  '1_year': '1 год',
  no_deadline: 'Без срока',

  // Пол
  male: 'Мужской',
  female: 'Женский',

  // Место тренировок
  home: 'Дома',
  gym: 'Зал',
  outdoor: 'Турники/брусья',
  mixed: 'Комбинированный',

  // Статусы клиента
  pending_assessment: 'Ожидает оценку',
  active: 'Активный',
  paused: 'На паузе',
  completed: 'Завершён',
};

/**
 * Получить label для enum значения
 * @param {string} value
 * @returns {string}
 */
function getLabel(value) {
  return LABELS[value] || value || '—';
}

// ═══════════════════════════════════════════════════════════
// MISC HELPERS
// ═══════════════════════════════════════════════════════════

/**
 * Debounce функция
 * @param {Function} func
 * @param {number} wait
 * @returns {Function}
 */
function debounce(func, wait = 300) {
  let timeout;
  return function executedFunction(...args) {
    clearTimeout(timeout);
    timeout = setTimeout(() => func.apply(this, args), wait);
  };
}

/**
 * Проверить Demo/Debug режим
 */
const DEMO_MODE =
  new URLSearchParams(window.location.search).has('demo') ||
  window.location.hostname === 'localhost' ||
  window.location.hostname === '127.0.0.1' ||
  window.location.protocol === 'file:';

const DEBUG_MODE = new URLSearchParams(window.location.search).has('debug');
