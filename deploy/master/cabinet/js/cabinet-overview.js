/**
 * Кабинет тренера — вкладка Обзор (4 карточки 2×2)
 */

function escapeHtml(s) {
  if (s == null) return '';
  const div = document.createElement('div');
  div.textContent = s;
  return div.innerHTML;
}

function formatDate(dateStr) {
  if (!dateStr) return '—';
  const d = new Date(dateStr);
  return d.toLocaleDateString('ru-RU', { day: '2-digit', month: '2-digit', year: 'numeric' });
}

/** Собрать топ упражнений по подходам из сетов (название + кол-во подходов) */
function topExercisesFromSets(sets, limit = 2) {
  const byName = {};
  (sets || []).forEach((st) => {
    const name = (st.exercise_name || '').trim() || '—';
    byName[name] = (byName[name] || 0) + 1;
  });
  return (
    Object.entries(byName)
      .sort((a, b) => b[1] - a[1])
      .slice(0, limit)
      .map(([name, count]) => `${name} (${count} подх.)`)
      .join(', ') || '—'
  );
}

/**
 * Отрисовать вкладку Обзор
 * @param {Object} data - { client, lastSession, lastSessionSets, blocks, usedByBlock, wearableLast7, nutritionYesterday }
 */
/* exported renderOverview */
function renderOverview(data) {
  const {
    client: _client,
    lastSession,
    lastSessionSets,
    blocks,
    usedByBlock,
    wearableLast7,
    nutritionYesterday,
  } = data || {};

  const activeBlock = (blocks || []).find((b) => b.status === 'active') || (blocks || [])[0];
  const used = activeBlock ? ((usedByBlock && usedByBlock[activeBlock.id]) ?? 0) : 0;
  const total = activeBlock ? activeBlock.total_sessions || 0 : 0;
  const pct = total > 0 ? Math.round((used / total) * 100) : 0;
  const remaining = total - used;

  const lastWorkoutHtml = lastSession
    ? `
    <div class="card-row">Дата: ${escapeHtml(formatDate(lastSession.date))}</div>
    <div class="card-row">Тип: ${escapeHtml(lastSession.type || '—')}</div>
    <div class="card-row">Тоннаж: ${lastSession.total_tonnage != null ? Number(lastSession.total_tonnage).toLocaleString('ru-RU') + ' кг' : '—'}</div>
    <div class="card-row">Топ упражнения: ${escapeHtml(topExercisesFromSets(lastSessionSets))}</div>
    <button type="button" class="btn-detail" data-switch-tab="workouts">Детали →</button>`
    : '<div class="overview-placeholder">Нет тренировок</div>';

  const blockHtml = activeBlock
    ? `
    <div class="card-row">${escapeHtml(activeBlock.name || 'Блок')} · ${used} из ${total} сессий</div>
    <div class="progress-bar"><div class="progress-bar-fill" style="width:${pct}%"></div></div>
    <div class="card-row">Старт: ${escapeHtml(formatDate(activeBlock.start_date))}</div>
    <div class="card-row">Осталось: ${remaining} тренировок</div>`
    : '<div class="overview-placeholder">Нет блоков</div>';

  const hasRecovery = wearableLast7 && wearableLast7.length > 0;
  const recoveryHtml = hasRecovery
    ? (() => {
        const avgSleep =
          wearableLast7.reduce((s, d) => s + (Number(d.sleep_hours) || 0), 0) /
          wearableLast7.length;
        const avgHrv =
          wearableLast7.reduce((s, d) => s + (Number(d.hrv) || 0), 0) /
          wearableLast7.filter((d) => d.hrv != null).length;
        const avgRec =
          wearableLast7.reduce((s, d) => s + (Number(d.recovery_score) || 0), 0) /
          wearableLast7.filter((d) => d.recovery_score != null).length;
        const sleepStr = Number.isFinite(avgSleep)
          ? `${Math.floor(avgSleep)}ч ${Math.round((avgSleep % 1) * 60)} мин`
          : '—';
        return `
    <div class="card-row">Средний сон: ${escapeHtml(sleepStr)}</div>
    <div class="card-row">HRV: ${Number.isFinite(avgHrv) ? Math.round(avgHrv) : '—'}</div>
    <div class="card-row">Восстановление: ${Number.isFinite(avgRec) ? Math.round(avgRec) + '%' : '—'}</div>`;
      })()
    : '<div class="overview-placeholder">Нет данных. Подключить интеграцию.</div>';

  const nut = nutritionYesterday;
  const hasNut = nut && (nut.calories > 0 || nut.protein > 0);
  const nutHtml = hasNut
    ? (() => {
        const goalCal = nut.goal_calories || 2200;
        const goalPro = nut.goal_protein || 180;
        const goalFat = nut.goal_fats || 80;
        const goalCarb = nut.goal_carbs || 250;
        const _calPct = goalCal > 0 ? Math.round((nut.calories / goalCal) * 100) : 0;
        const proPct = goalPro > 0 ? Math.min(100, Math.round((nut.protein / goalPro) * 100)) : 0;
        const fatPct = goalFat > 0 ? Math.min(100, Math.round((nut.fats / goalFat) * 100)) : 0;
        const carbPct = goalCarb > 0 ? Math.min(100, Math.round((nut.carbs / goalCarb) * 100)) : 0;
        return `
    <div class="card-row">Калории: ${nut.calories || 0} / ${goalCal} ккал</div>
    <div class="card-row">Белок: <span class="progress-bar" style="display:inline-block;width:80px;height:6px;vertical-align:middle;"><span class="progress-bar-fill" style="width:${proPct}%"></span></span> ${nut.protein || 0} / ${goalPro} г</div>
    <div class="card-row">Жиры: <span class="progress-bar" style="display:inline-block;width:80px;height:6px;vertical-align:middle;"><span class="progress-bar-fill" style="width:${fatPct}%"></span></span> ${nut.fats || 0} / ${goalFat} г</div>
    <div class="card-row">Углеводы: <span class="progress-bar" style="display:inline-block;width:80px;height:6px;vertical-align:middle;"><span class="progress-bar-fill" style="width:${carbPct}%"></span></span> ${nut.carbs || 0} / ${goalCarb} г</div>`;
      })()
    : '<div class="overview-placeholder">Данные не внесены</div>';

  const yesterdayLabel = (() => {
    const y = new Date();
    y.setDate(y.getDate() - 1);
    return formatDate(y.toISOString().slice(0, 10));
  })();

  return `
  <div class="overview-grid">
    <div class="overview-card">
      <h3>Последняя тренировка</h3>
      ${lastWorkoutHtml}
    </div>
    <div class="overview-card">
      <h3>Текущий блок</h3>
      ${blockHtml}
    </div>
    <div class="overview-card">
      <h3>Восстановление (последние 7 дней)</h3>
      ${recoveryHtml}
    </div>
    <div class="overview-card">
      <h3>Питание вчера (${yesterdayLabel})</h3>
      ${nutHtml}
    </div>
  </div>`;
}
