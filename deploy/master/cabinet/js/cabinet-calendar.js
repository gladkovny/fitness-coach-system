/**
 * Кабинет тренера — вкладка Спортивный календарь
 * Синяя точка = тренировка в зале. Зелёная = активность с гаджета.
 * TODO: добавить данные гаджета когда будет Whoop интеграция (таблица wearable_activities).
 */
/* global getWorkoutSessions */

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

  function getMonthKey(d) {
    return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0');
  }

  window.renderCalendarTab = async function () {
    const clientId = window.__cabinetClientId;
    if (!clientId) return;
    const panel = document.getElementById('tab-calendar');
    if (!panel) return;
    panel.innerHTML = '<div class="overview-placeholder">Загрузка…</div>';
    const current = window.__cabinetCalendarMonth
      ? new Date(window.__cabinetCalendarMonth + '-01')
      : new Date();
    const year = current.getFullYear();
    const month = current.getMonth();
    let sessions = [];
    try {
      sessions = await getWorkoutSessions(clientId, null);
    } catch (e) {
      panel.innerHTML =
        '<div class="overview-placeholder" style="color:var(--danger);">Ошибка: ' +
        escapeHtml(e.message) +
        '</div>';
      return;
    }
    const sessionsByDate = {};
    sessions.forEach((s) => {
      const d = (s.date || '').slice(0, 10);
      if (!sessionsByDate[d]) sessionsByDate[d] = { workout: null, gadget: null };
      sessionsByDate[d].workout = s;
    });
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const startPad = (firstDay.getDay() + 6) % 7;
    const daysInMonth = lastDay.getDate();
    const prevMonth = new Date(year, month - 1);
    const nextMonth = new Date(year, month + 1);
    const monthTitle = firstDay.toLocaleDateString('ru-RU', { month: 'long', year: 'numeric' });
    let cells = '<tr>';
    for (let i = 0; i < startPad; i++) cells += '<td class="calendar-cell calendar-empty"></td>';
    for (let d = 1; d <= daysInMonth; d++) {
      const dateStr =
        year + '-' + String(month + 1).padStart(2, '0') + '-' + String(d).padStart(2, '0');
      const info = sessionsByDate[dateStr];
      const hasWorkout = info?.workout;
      let dots = '';
      if (hasWorkout)
        dots += '<span class="calendar-dot calendar-dot-workout" title="Тренировка в зале"></span>';
      const hasGadget = info?.gadget;
      if (hasGadget)
        dots +=
          '<span class="calendar-dot calendar-dot-gadget" title="Активность с гаджета"></span>';
      const clickable = hasWorkout || hasGadget;
      const dayContent = clickable
        ? `<div class="calendar-day-num">${d}</div><div class="calendar-dots">${dots}</div>`
        : `<div class="calendar-day-num">${d}</div>`;
      cells += `<td class="calendar-cell ${clickable ? 'calendar-has-data' : ''}" data-date="${dateStr}" data-has-workout="${!!hasWorkout}" data-has-gadget="${!!hasGadget}">${dayContent}</td>`;
      if ((startPad + d) % 7 === 0 && d < daysInMonth) cells += '</tr><tr>';
    }
    const remaining = (7 - ((startPad + daysInMonth) % 7)) % 7;
    for (let i = 0; i < remaining; i++) cells += '<td class="calendar-cell calendar-empty"></td>';
    cells += '</tr>';
    panel.innerHTML = `
    <div class="calendar-nav" style="display:flex;justify-content:space-between;align-items:center;margin-bottom:16px;">
      <button type="button" class="btn-sm" id="calendar-prev">← Предыдущий месяц</button>
      <strong>${escapeHtml(monthTitle)}</strong>
      <button type="button" class="btn-sm" id="calendar-next">Следующий месяц →</button>
    </div>
    <table class="cabinet-table" style="table-layout:fixed;">
      <thead><tr><th>Пн</th><th>Вт</th><th>Ср</th><th>Чт</th><th>Пт</th><th>Сб</th><th>Вс</th></tr></thead>
      <tbody>${cells}</tbody>
    </table>
    <div id="calendar-popup" class="calendar-popup" style="display:none;"></div>`;
    document.getElementById('calendar-prev').addEventListener('click', () => {
      window.__cabinetCalendarMonth = getMonthKey(prevMonth);
      window.renderCalendarTab();
    });
    document.getElementById('calendar-next').addEventListener('click', () => {
      window.__cabinetCalendarMonth = getMonthKey(nextMonth);
      window.renderCalendarTab();
    });
    panel.querySelectorAll('.calendar-cell.calendar-has-data').forEach((td) => {
      td.addEventListener('click', () => {
        const dateStr = td.dataset.date;
        const info = sessionsByDate[dateStr];
        const parts = [];
        if (info?.workout) {
          const w = info.workout;
          parts.push(
            '<div><strong>Тренировка в зале:</strong><br>Тип: ' +
              escapeHtml(w.type || '—') +
              ', Тоннаж: ' +
              (w.total_tonnage != null
                ? Number(w.total_tonnage).toLocaleString('ru-RU') + ' кг'
                : '—') +
              '</div>'
          );
        }
        if (info?.gadget) {
          parts.push(
            '<div><strong>Активность с гаджета:</strong><br>' +
              escapeHtml(JSON.stringify(info.gadget)) +
              '</div>'
          );
        }
        const popup = document.getElementById('calendar-popup');
        if (popup) {
          popup.innerHTML =
            '<div class="calendar-popup-inner" style="background:var(--card);padding:20px;border-radius:var(--radius-md);box-shadow:var(--shadow);max-width:320px;"><strong>Дата: ' +
            formatDate(dateStr) +
            '</strong><hr style="margin:12px 0;">' +
            parts.join('<hr style="margin:12px 0;">') +
            '<div style="margin-top:16px;"><button type="button" class="btn-sm" id="calendar-popup-close">Закрыть</button></div></div>';
          popup.style.display = 'flex';
          popup.style.position = 'fixed';
          popup.style.inset = '0';
          popup.style.background = 'rgba(0,0,0,0.4)';
          popup.style.alignItems = 'center';
          popup.style.justifyContent = 'center';
          popup.style.zIndex = '1000';
          document.getElementById('calendar-popup-close').addEventListener('click', () => {
            popup.style.display = 'none';
          });
          popup.addEventListener('click', (e) => {
            if (e.target === popup) popup.style.display = 'none';
          });
        }
      });
    });
  };
})();
