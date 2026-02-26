/**
 * Кабинет тренера — вкладка Питание: таблица по дням с цветовой индикацией
 */
/* global getNutritionData, getClientById */

(function () {
  function escapeHtml(s) {
    if (s == null) return '';
    const div = document.createElement('div');
    div.textContent = s;
    return div.innerHTML;
  }

  function formatDate(dateStr) {
    if (!dateStr) return '—';
    return new Date(dateStr + 'T12:00:00').toLocaleDateString('ru-RU', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });
  }

  window.renderNutritionTab = async function () {
    const clientId = window.__cabinetClientId;
    if (!clientId) return;
    const panel = document.getElementById('tab-nutrition');
    if (!panel) return;
    panel.innerHTML = '<div class="overview-placeholder">Загрузка…</div>';
    const days = window.__cabinetNutritionDays || 30;
    let list = [];
    let client = null;
    try {
      [list, client] = await Promise.all([
        getNutritionData(clientId, days),
        getClientById(clientId),
      ]);
    } catch (e) {
      panel.innerHTML =
        '<div class="overview-placeholder" style="color:var(--danger);">Ошибка: ' +
        escapeHtml(e.message) +
        '</div>';
      return;
    }
    const goalCal = client?.profile?.goal_calories || 2200;
    const rows = (list || [])
      .map((row) => {
        const cal = Number(row.calories) || 0;
        const pct = goalCal > 0 ? (cal / goalCal) * 100 : 0;
        let rowClass = '';
        if (pct > 0 && pct < 80) rowClass = 'nutrition-row-low';
        else if (pct > 105) rowClass = 'nutrition-row-high';
        return `<tr class="${rowClass}"><td>${formatDate(row.date)}</td><td>${cal}</td><td>${goalCal}</td><td>${row.protein ?? '—'}</td><td>${row.fats ?? '—'}</td><td>${row.carbs ?? '—'}</td></tr>`;
      })
      .join('');
    panel.innerHTML = `
    <div class="filter-row" style="margin-bottom:16px;">
      <label>Период:</label>
      <select id="cabinet-nutrition-days">
        <option value="7" ${days === 7 ? 'selected' : ''}>7 дней</option>
        <option value="30" ${days === 30 ? 'selected' : ''}>30 дней</option>
        <option value="90" ${days === 90 ? 'selected' : ''}>90 дней</option>
      </select>
    </div>
    <table class="cabinet-table">
      <thead><tr><th>Дата</th><th>Калории факт</th><th>Калории цель</th><th>Белок г</th><th>Жиры г</th><th>Углеводы г</th></tr></thead>
      <tbody>${rows || '<tr><td colspan="6">Нет данных</td></tr>'}</tbody>
    </table>`;
    document.getElementById('cabinet-nutrition-days')?.addEventListener('change', (e) => {
      window.__cabinetNutritionDays = parseInt(e.target.value, 10);
      window.renderNutritionTab();
    });
  };
})();
