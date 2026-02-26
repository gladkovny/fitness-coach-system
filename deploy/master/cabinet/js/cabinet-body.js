/**
 * Кабинет тренера — вкладка Тело и здоровье: InBody + данные гаджета
 */
/* global getInBodyData, getWearableData, getWorkoutSessions */

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

  function formatNum(v) {
    if (v == null || v === '') return '—';
    const n = Number(v);
    if (Number.isNaN(n)) return '—';
    return n % 1 === 0 ? String(n) : n.toFixed(1);
  }

  window.renderBodyTab = async function () {
    const clientId = window.__cabinetClientId;
    if (!clientId) return;
    const panel = document.getElementById('tab-body');
    if (!panel) return;
    panel.innerHTML = '<div class="overview-placeholder">Загрузка…</div>';
    const wearableDays = window.__cabinetWearableDays || 30;
    let inbody = [];
    let wearable = [];
    let sessions = [];
    try {
      [inbody, wearable, sessions] = await Promise.all([
        getInBodyData(clientId),
        getWearableData(clientId, wearableDays),
        getWorkoutSessions(clientId, 90),
      ]);
    } catch (e) {
      panel.innerHTML =
        '<div class="overview-placeholder" style="color:var(--danger);">Ошибка: ' +
        escapeHtml(e.message) +
        '</div>';
      return;
    }
    const sessionDates = new Set((sessions || []).map((s) => (s.date || '').slice(0, 10)));
    const inbodyFilter = window.__cabinetBodyInbodyFilter || 'all';
    let chartData = inbody;
    if (inbodyFilter === '3') chartData = inbody.slice(0, 3);
    else if (inbodyFilter === '6') chartData = inbody.slice(0, 6);
    const labels = chartData.map((d) => formatDate(d.date)).reverse();
    const weightData = chartData.map((d) => Number(d.weight)).reverse();
    const fatData = chartData.map((d) => Number(d.body_fat)).reverse();
    const muscleData = chartData.map((d) => Number(d.muscle_mass)).reverse();
    const lastTwo = inbody.slice(0, 2);
    const m1 = lastTwo[1];
    const m2 = lastTwo[0];
    let _chartInstance = null;
    const canvasId = 'cabinet-body-chart';
    const comparisonHtml =
      m1 && m2
        ? (() => {
            const dw = (Number(m2.weight) || 0) - (Number(m1.weight) || 0);
            const df = (Number(m2.body_fat) || 0) - (Number(m1.body_fat) || 0);
            const dm = (Number(m2.muscle_mass) || 0) - (Number(m1.muscle_mass) || 0);
            const arrow = (v) => (v > 0 ? '↑' : v < 0 ? '↓' : '');
            const deltaW = dw !== 0 ? `${dw > 0 ? '+' : ''}${formatNum(dw)} кг ${arrow(dw)}` : '—';
            const deltaF = df !== 0 ? `${df > 0 ? '+' : ''}${formatNum(df)}% ${arrow(df)}` : '—';
            const deltaM = dm !== 0 ? `${dm > 0 ? '+' : ''}${formatNum(dm)} кг ${arrow(dm)}` : '—';
            return `
      <div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:16px;margin-top:16px;">
        <div class="overview-card"><h3>Замер 1: ${formatDate(m1.date)}</h3><div class="card-row">Вес: ${formatNum(m1.weight)} кг</div><div class="card-row">% жира: ${formatNum(m1.body_fat)}%</div><div class="card-row">ММТ: ${formatNum(m1.muscle_mass)} кг</div></div>
        <div class="overview-card"><h3>Замер 2: ${formatDate(m2.date)}</h3><div class="card-row">Вес: ${formatNum(m2.weight)} кг</div><div class="card-row">% жира: ${formatNum(m2.body_fat)}%</div><div class="card-row">ММТ: ${formatNum(m2.muscle_mass)} кг</div></div>
        <div class="overview-card"><h3>Изменение</h3><div class="card-row">${deltaW}</div><div class="card-row">${deltaF}</div><div class="card-row">${deltaM}</div></div>
      </div>`;
          })()
        : '<p class="overview-placeholder">Мало замеров для сравнения</p>';
    const wearableRows =
      wearable.length > 0
        ? wearable
            .slice(0, Math.min(wearableDays, 90))
            .map(
              (d) =>
                `<tr><td>${formatDate(d.date)}</td><td>${formatNum(d.sleep_hours)} ч</td><td>${formatNum(d.hrv)}</td><td>${formatNum(d.recovery_score)}%</td><td>${formatNum(d.strain)}</td><td>${sessionDates.has((d.date || '').slice(0, 10)) ? '✓' : '—'}</td></tr>`
            )
            .join('')
        : '';
    const wearableHtml =
      wearable.length > 0
        ? `
    <div class="filter-row" style="margin-bottom:12px;">
      <label>Период:</label>
      <select id="cabinet-wearable-period">
        <option value="7">7 дней</option>
        <option value="30" selected>30 дней</option>
        <option value="90">Всё время</option>
      </select>
    </div>
    <table class="cabinet-table">
      <thead><tr><th>Дата</th><th>Сон (ч)</th><th>HRV</th><th>Восстановление %</th><th>Стресс</th><th>Тренировка</th></tr></thead>
      <tbody>${wearableRows}</tbody>
    </table>`
        : '<div class="overview-placeholder">Данные гаджета не подключены. Инструкция по подключению: [ссылка]</div>';
    panel.innerHTML = `
    <div class="cabinet-body-grid" style="display:grid;grid-template-columns:1fr 1fr;gap:24px;">
      <div>
        <h2 class="cabinet-section-title">Состав тела (InBody)</h2>
        <div class="filter-row" style="margin-bottom:12px;">
          <label>Замеры:</label>
          <select id="cabinet-inbody-filter">
            <option value="all" ${inbodyFilter === 'all' ? 'selected' : ''}>Все замеры</option>
            <option value="6" ${inbodyFilter === '6' ? 'selected' : ''}>Последние 6</option>
            <option value="3" ${inbodyFilter === '3' ? 'selected' : ''}>Последние 3</option>
          </select>
        </div>
        <div style="height:260px;"><canvas id="${canvasId}"></canvas></div>
        ${comparisonHtml}
      </div>
      <div>
        <h2 class="cabinet-section-title">Данные гаджета</h2>
        ${wearableHtml}
      </div>
    </div>`;
    if (typeof Chart !== 'undefined' && labels.length > 0) {
      const ctx = document.getElementById(canvasId)?.getContext('2d');
      if (ctx) {
        _chartInstance = new Chart(ctx, {
          type: 'line',
          data: {
            labels,
            datasets: [
              { label: 'Вес (кг)', data: weightData, borderColor: '#0071e3', tension: 0.3 },
              { label: '% жира', data: fatData, borderColor: '#ff9500', tension: 0.3 },
              { label: 'ММТ (кг)', data: muscleData, borderColor: '#34c759', tension: 0.3 },
            ],
          },
          options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: { y: { beginAtZero: false } },
          },
        });
      }
    }
    document.getElementById('cabinet-inbody-filter')?.addEventListener('change', (e) => {
      window.__cabinetBodyInbodyFilter = e.target.value;
      window.renderBodyTab();
    });
    document.getElementById('cabinet-wearable-period')?.addEventListener('change', (e) => {
      window.__cabinetWearableDays = parseInt(e.target.value, 10);
      window.renderBodyTab();
    });
  };
})();
