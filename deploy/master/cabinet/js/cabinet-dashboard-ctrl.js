/**
 * Кабинет тренера — вкладка «Дашборд клиента»: управление видимостью блоков у клиента
 */
/* global getDashboardSettings, saveDashboardSettings */

(function () {
  function escapeHtml(s) {
    if (s == null) return '';
    const div = document.createElement('div');
    div.textContent = s;
    return div.innerHTML;
  }

  function showToast(msg) {
    const existing = document.getElementById('cabinet-toast');
    if (existing) existing.remove();
    const el = document.createElement('div');
    el.id = 'cabinet-toast';
    el.style.cssText =
      'position:fixed;bottom:24px;left:50%;transform:translateX(-50%);background:var(--text);color:var(--card);padding:12px 24px;border-radius:var(--radius-md);font-size:14px;z-index:2000;box-shadow:var(--shadow);';
    el.textContent = msg;
    document.body.appendChild(el);
    setTimeout(() => el.remove(), 3000);
  }

  window.renderDashboardCtrlTab = async function () {
    const clientId = window.__cabinetClientId;
    if (!clientId) return;
    const panel = document.getElementById('tab-dashboard-ctrl');
    if (!panel) return;
    panel.innerHTML = '<div class="overview-placeholder">Загрузка…</div>';
    let settings = null;
    try {
      settings = await getDashboardSettings(clientId);
    } catch (e) {
      panel.innerHTML =
        '<div class="overview-placeholder" style="color:var(--danger);">Ошибка загрузки настроек. Возможно, таблица client_dashboard_settings ещё не создана — выполните миграцию 00017 в Supabase.</div>';
      return;
    }
    const def = {
      show_body_progress: true,
      show_workouts: true,
      show_nutrition: false,
      show_calendar: true,
      show_recovery: false,
    };
    const s = settings || def;
    const toggles = [
      {
        key: 'show_body_progress',
        label: 'Прогресс тела (InBody динамика)',
        desc: 'График веса, % жира, ММТ',
      },
      { key: 'show_workouts', label: 'Тренировки', desc: 'История, рекорды, нагрузка' },
      { key: 'show_nutrition', label: 'Питание', desc: 'КБЖУ цель vs факт' },
      { key: 'show_calendar', label: 'Спортивный календарь', desc: 'Тренировки по дням' },
      { key: 'show_recovery', label: 'Данные восстановления', desc: 'Сон, HRV' },
    ];
    const togglesHtml = toggles
      .map(
        (t) =>
          `<div class="dashboard-ctrl-row" style="display:flex;align-items:center;gap:16px;margin-bottom:16px;padding:12px;background:var(--bg);border-radius:var(--radius-sm);">
        <label style="flex:1;cursor:pointer;">
          <input type="checkbox" class="dashboard-ctrl-cb" data-key="${t.key}" ${s[t.key] ? 'checked' : ''}> ${escapeHtml(t.label)}
        </label>
        <span style="font-size:13px;color:var(--text-secondary);">${escapeHtml(t.desc)}</span>
      </div>`
      )
      .join('');
    panel.innerHTML = `
    <h2 class="cabinet-section-title">Управление дашбордом клиента</h2>
    <p class="overview-placeholder" style="margin-bottom:20px;">Что видит клиент на своём дашборде:</p>
    <div style="max-width:560px;">${togglesHtml}</div>
    <button type="button" class="btn-sm primary" id="cabinet-dashboard-save" style="margin-top:16px;">Сохранить настройки</button>`;
    document.getElementById('cabinet-dashboard-save').addEventListener('click', async () => {
      const payload = {};
      panel.querySelectorAll('.dashboard-ctrl-cb').forEach((cb) => {
        payload[cb.dataset.key] = cb.checked;
      });
      try {
        await saveDashboardSettings(clientId, payload);
        showToast('Настройки сохранены');
      } catch (err) {
        showToast('Ошибка: ' + (err.message || String(err)));
      }
    });
  };
})();
