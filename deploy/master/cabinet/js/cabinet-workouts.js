/**
 * Кабинет тренера — вкладка Тренировки: блоки, сессии, нагрузка по мышцам
 * Коэффициенты по subcategory (приоритет) и muscle_coefficients из БД
 */
/* global getWorkoutSessions, getClientBlocks, getWorkoutSetsBySessionIds, getExercises, getBlockUsedCounts, ensureClientProgram, createBlock, createSession */

(function () {
  function escapeHtml(s) {
    if (s == null) return '';
    const div = document.createElement('div');
    div.textContent = s;
    return div.innerHTML;
  }

  function formatDate(dateStr) {
    if (!dateStr) return '—';
    return (dateStr + '').slice(0, 10);
  }

  /** ISO неделя (год + номер недели) для группировки */
  function getWeekKey(dateStr) {
    if (!dateStr) return '';
    const d = new Date(dateStr + 'T12:00:00');
    const start = new Date(d);
    start.setDate(d.getDate() - d.getDay() + 1);
    const y = start.getFullYear();
    const first = new Date(y, 0, 1);
    const w = Math.ceil(((start - first) / 86400000 + first.getDay() + 1) / 7);
    return y + '-W' + String(w).padStart(2, '0');
  }

  /** Дефолтные коэффициенты по категории/подкатегории/имени (как в миграции 00006). В конце — только по названию, чтобы «Другое» не уходило в Кор. */
  function getDefaultCoeffsByCategory(category, subcategory, name) {
    const cat = (category || '').toLowerCase();
    const sub = (subcategory || '').toLowerCase();
    const n = (name || '').toLowerCase();
    const combined = cat + ' ' + sub + ' ' + n;

    if (
      /рудь|грудь/.test(cat) ||
      /грудь/.test(sub) ||
      /жим.*лёжа|жим.*лежа|бенч|разводка|отжиман/.test(n)
    )
      return { chest: 0.8, front_delt: 0.15, triceps: 0.05 };
    if (/спина/.test(cat) && (/широч|подтяг|блок|тяг/.test(sub) || /подтяг|блок|тяга|тягу/.test(n)))
      return { lats: 0.7, biceps: 0.2, traps: 0.1 };
    if (/спина/.test(cat) && (/поясниц|гипер|румын|рдл/.test(sub) || /гипер|румын|рдл/.test(n)))
      return { low_back: 0.5, hamstrings: 0.4, glutes: 0.1 };
    if (/спина/.test(cat) && /становая/.test(n))
      return { low_back: 0.4, hamstrings: 0.3, glutes: 0.2, traps: 0.1 };
    if (/спина/.test(cat) || /тяга|подтяг|блок.*вертик|горизонтальн.*тяг/.test(n))
      return { lats: 0.6, traps: 0.2, biceps: 0.2 };
    if (
      /ноги/.test(cat) &&
      (/квадри|присед|жим ног|разгибан/.test(sub) ||
        /присед|жим ног|гакк|разгибан.*ног|квадри/.test(n))
    )
      return { quads: 0.6, glutes: 0.25, hamstrings: 0.15 };
    if (/ноги/.test(cat) && (/бицепс бедра|сгибан/.test(sub) || /сгибан.*ног/.test(n)))
      return { hamstrings: 0.8, glutes: 0.2 };
    if (/ноги/.test(cat) && (/икр|носк/.test(sub) || /носк|икр/.test(n))) return { calves: 1.0 };
    if (/ноги/.test(cat) || /присед|жим ног|выпад|гакк/.test(n))
      return { quads: 0.5, hamstrings: 0.3, glutes: 0.2 };
    if (
      /плеч/.test(cat) &&
      (/средн|махи.*сторон/.test(sub) || /махи.*сторон|отведен.*плеч/.test(n))
    )
      return { mid_delt: 0.8, rear_delt: 0.2 };
    if (/плеч/.test(cat) && (/задн|наклон/.test(sub) || /наклон|задн.*дельт/.test(n)))
      return { rear_delt: 0.8, mid_delt: 0.2 };
    if (/плеч/.test(cat) || /жим.*плеч|арнольд|махи/.test(n))
      return { front_delt: 0.5, mid_delt: 0.3, triceps: 0.2 };
    if (
      /руки/.test(cat) &&
      (/бицепс|сгибан.*рук|молот/.test(sub) || /сгибан.*бицепс|молот|бицепс/.test(n))
    )
      return { biceps: 1.0 };
    if (
      /руки/.test(cat) &&
      (/трицепс|разгибан|француз/.test(sub) || /трицепс|разгибан.*блок|француз/.test(n))
    )
      return { triceps: 1.0 };
    if (/кор|пресс/.test(cat) || /планка|скручиван|пресс|кор\./.test(n)) return { core: 1.0 };
    // Только по названию: когда категория «Другое» или пустая — не отправлять в Кор
    if (/сгибан.*рук|бицепс|молот|подъём на бицепс/.test(combined)) return { biceps: 1.0 };
    if (/разгибан.*трицепс|трицепс|француз|брусья|отжиман.*брусь/.test(combined))
      return { triceps: 1.0 };
    if (/жим|лёжа|лежа|грудь|бенч|разводка/.test(combined))
      return { chest: 0.8, front_delt: 0.15, triceps: 0.05 };
    if (/тяга|подтяг|блок|гребл|широч/.test(combined))
      return { lats: 0.6, traps: 0.2, biceps: 0.2 };
    if (/присед|жим ног|гакк|квадри|выпад/.test(combined))
      return { quads: 0.5, hamstrings: 0.3, glutes: 0.2 };
    if (/сгибан.*ног|бицепс бедра/.test(combined)) return { hamstrings: 0.8, glutes: 0.2 };
    if (/махи|плеч|дельт|протяжка/.test(combined))
      return { front_delt: 0.4, mid_delt: 0.4, rear_delt: 0.2 };
    return null;
  }

  /** Коэффициенты по мышцам: muscle_coefficients → дефолт по категории/имени → только Кор в крайнем случае */
  function getLoadCoeffs(ex) {
    const c = ex?.muscle_coefficients;
    if (c && typeof c === 'object' && Object.keys(c).length > 0) return normalizeCoeffsKeys(c);
    const byCategory = getDefaultCoeffsByCategory(ex?.category, ex?.subcategory, ex?.name);
    if (byCategory) return byCategory;
    const sub = (ex?.subcategory || '').trim().toLowerCase();
    if (sub) {
      const key = sub.replace(/\s+/g, '_').slice(0, 30);
      if (MUSCLE_LABELS[key]) return { [key]: 1 };
      const bySubAndName = getDefaultCoeffsByCategory(null, ex?.subcategory, ex?.name);
      if (bySubAndName) return bySubAndName;
    }
    return { core: 1 };
  }

  const MUSCLE_LABELS = {
    chest: 'Грудь',
    lats: 'Спина (широч.)',
    low_back: 'Поясница',
    traps: 'Трапеции',
    quads: 'Квадрицепс',
    hamstrings: 'Бицепс бедра',
    glutes: 'Ягодицы',
    calves: 'Икры',
    biceps: 'Бицепс',
    triceps: 'Трицепс',
    front_delt: 'Передняя дельта',
    mid_delt: 'Средняя дельта',
    rear_delt: 'Задняя дельта',
    core: 'Кор',
  };

  /** Русские ключи из БД → английские, чтобы не дублировать строки (Кор vs core) */
  const RUS_TO_ENG_MUSCLE = {
    грудь: 'chest',
    'спина (широч.)': 'lats',
    широчайшие: 'lats',
    поясница: 'low_back',
    трапеции: 'traps',
    трапеция: 'traps',
    квадрицепс: 'quads',
    'бицепс бедра': 'hamstrings',
    ягодицы: 'glutes',
    икры: 'calves',
    бицепс: 'biceps',
    трицепс: 'triceps',
    'передняя дельта': 'front_delt',
    'средняя дельта': 'mid_delt',
    'задняя дельта': 'rear_delt',
    кор: 'core',
  };

  function normalizeCoeffsKeys(coeffs) {
    if (!coeffs || typeof coeffs !== 'object') return coeffs;
    const out = {};
    Object.entries(coeffs).forEach(([k, v]) => {
      const keyNorm = (k || '').toLowerCase().trim();
      const eng = RUS_TO_ENG_MUSCLE[keyNorm] || (MUSCLE_LABELS[k] ? k : keyNorm);
      out[eng] = (out[eng] || 0) + Number(v);
    });
    return out;
  }

  function muscleLabel(key) {
    return MUSCLE_LABELS[key] || key;
  }

  async function loadWorkoutsData(clientId, periodFilter, activeBlockId) {
    const sessions = await getWorkoutSessions(clientId, null);
    let filtered = sessions;
    if (periodFilter === '7') {
      const from = new Date();
      from.setDate(from.getDate() - 7);
      const fromStr = from.toISOString().slice(0, 10);
      filtered = sessions.filter((s) => (s.date || '') >= fromStr);
    } else if (periodFilter === '30') {
      const from = new Date();
      from.setDate(from.getDate() - 30);
      const fromStr = from.toISOString().slice(0, 10);
      filtered = sessions.filter((s) => (s.date || '') >= fromStr);
    } else if (periodFilter === 'block' && activeBlockId) {
      filtered = sessions.filter((s) => s.block_id === activeBlockId);
    }
    const sessionIds = filtered.map((s) => s.id);
    const sixWeeksAgo = new Date();
    sixWeeksAgo.setDate(sixWeeksAgo.getDate() - 42);
    const fromStr6w = sixWeeksAgo.toISOString().slice(0, 10);
    const sessionIds6w = sessions.filter((s) => (s.date || '') >= fromStr6w).map((s) => s.id);
    const sessionIdsUnion = [...new Set([...sessionIds, ...sessionIds6w])];
    const [blocks, sets, exercises] = await Promise.all([
      getClientBlocks(clientId),
      sessionIdsUnion.length ? getWorkoutSetsBySessionIds(sessionIdsUnion) : Promise.resolve([]),
      getExercises(),
    ]);
    const usedByBlock = blocks.length ? await getBlockUsedCounts(blocks.map((b) => b.id)) : {};
    const sessionById = {};
    filtered.forEach((s) => {
      sessionById[s.id] = s;
    });
    const setsBySession = {};
    sets.forEach((st) => {
      if (!setsBySession[st.session_id]) setsBySession[st.session_id] = [];
      setsBySession[st.session_id].push(st);
    });
    const exerciseById = {};
    exercises.forEach((e) => {
      exerciseById[e.id] = e;
    });
    return {
      blocks,
      usedByBlock,
      sessions: filtered,
      setsBySession,
      sessionById,
      exerciseById,
      exercises,
      sets,
      sessionsAll: sessions,
    };
  }

  function renderBlocksTable(blocks, usedByBlock, _clientId) {
    const tableRows = !blocks.length
      ? '<tr><td colspan="8" class="overview-placeholder">Нет блоков</td></tr>'
      : blocks
          .map((b) => {
            const used = usedByBlock[b.id] ?? 0;
            const nameSafe = escapeHtml((b.name || '').replace(/"/g, '&quot;'));
            return `
      <tr data-block-id="${b.id}">
        <td><input type="text" class="cabinet-inline-input block-name" value="${nameSafe}" data-block-id="${b.id}"></td>
        <td>${b.total_sessions ?? '—'}</td>
        <td>${used}</td>
        <td>${formatDate(b.start_date)}</td>
        <td><input type="date" class="cabinet-inline-input block-end" value="${formatDate(b.end_date)}" data-block-id="${b.id}"></td>
        <td><input type="number" class="cabinet-inline-input block-cost" value="${b.cost ?? ''}" step="0.01" style="width:80px;" data-block-id="${b.id}"></td>
        <td>${escapeHtml(b.status || '—')}</td>
        <td><button type="button" class="btn-sm save-block-btn" data-block-id="${b.id}">Сохранить</button></td>
      </tr>`;
          })
          .join('');
    return `
    <div class="blocks-table-wrap" style="margin-bottom:16px;">
      <table class="cabinet-table">
        <thead><tr><th>Блок</th><th>Всего</th><th>Выполнено</th><th>Дата старта</th><th>Дата окончания</th><th>Стоимость</th><th>Статус</th><th></th></tr></thead>
        <tbody>${tableRows}</tbody>
      </table>
      <button type="button" class="btn-sm" id="cabinet-add-block-btn" style="margin-top:8px;">+ Добавить блок</button>
    </div>`;
  }

  function renderSessionsTable(sessions, setsBySession, sessionById, blockByName, exerciseById) {
    if (!sessions.length) return '<div class="overview-placeholder">Нет сессий за период</div>';
    const rows = sessions
      .map((s) => {
        const blockName = s.block_id ? blockByName[s.block_id] || '—' : '—';
        const source = s.source === 'gadget' ? 'Гаджет' : 'Зал';
        const sets = setsBySession[s.id] || [];
        const setRows = sets
          .map((st) => {
            const ex = exerciseById[st.exercise_id] || null;
            const name = (st.exercise_name || (ex && ex.name) || '—').trim();
            const weight = st.weight != null ? Number(st.weight) : '—';
            return `<tr><td>${escapeHtml(name)}</td><td>${st.set_number}×</td><td>${st.reps ?? '—'}</td><td>${weight}</td><td>${st.rpe ?? '—'}</td></tr>`;
          })
          .join('');
        return `
      <tr class="session-row" data-session-id="${s.id}">
        <td>${formatDate(s.date)}</td>
        <td>${escapeHtml(s.type || '—')}</td>
        <td>${s.total_tonnage != null ? Number(s.total_tonnage).toLocaleString('ru-RU') : '—'}</td>
        <td>${escapeHtml(blockName)}</td>
        <td>${escapeHtml(source)}</td>
      </tr>
      <tr class="accordion-detail"><td colspan="5"><table class="cabinet-table" style="margin:0;"><thead><tr><th>Упражнение</th><th>Подходы</th><th>Повторения</th><th>Вес (кг)</th><th>RPE</th></tr></thead><tbody>${setRows || '<tr><td colspan="5">Нет подходов</td></tr>'}</tbody></table></td></tr>`;
      })
      .join('');
    return `
    <table class="cabinet-table">
      <thead><tr><th>Дата</th><th>Тип</th><th>Тоннаж (кг)</th><th>Блок</th><th>Источник</th></tr></thead>
      <tbody>${rows}</tbody>
    </table>`;
  }

  function drawSparkline(canvasId, values) {
    const canvas = document.getElementById(canvasId);
    if (!canvas || typeof Chart === 'undefined') return;
    const ctx = canvas.getContext('2d');
    const max = Math.max(...values, 1);
    const normalized = values.map((v) => (max > 0 ? (v / max) * 40 : 0));
    new Chart(ctx, {
      type: 'line',
      data: {
        labels: values.map((_, i) => i),
        datasets: [
          {
            data: normalized,
            borderColor: 'var(--accent)',
            backgroundColor: 'transparent',
            fill: false,
            tension: 0.3,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: { legend: { display: false }, tooltip: { enabled: false } },
        scales: {
          x: { display: false },
          y: { display: false, min: 0, max: 45 },
        },
      },
    });
  }

  function renderMuscleLoad(
    sessionsAll,
    setsBySession,
    sessionById,
    exerciseById,
    exercisesList,
    _container
  ) {
    const sixWeeksAgo = new Date();
    sixWeeksAgo.setDate(sixWeeksAgo.getDate() - 42);
    const fromStr = sixWeeksAgo.toISOString().slice(0, 10);
    const sessions6w = (sessionsAll || []).filter((s) => (s.date || '') >= fromStr);
    const sessionIds6w = sessions6w.map((s) => s.id);
    const allSets = [];
    sessionIds6w.forEach((sid) => {
      (setsBySession[sid] || []).forEach((st) =>
        allSets.push({ ...st, date: sessionById[sid]?.date })
      );
    });
    const muscleTotal = {};
    const muscleByWeek = {};
    const nameNorm = (s) =>
      (s || '')
        .trim()
        .toLowerCase()
        .replace(/\s*\([^)]*\)\s*$/, '');
    allSets.forEach((st) => {
      let ex = exerciseById[st.exercise_id];
      if (!ex && st.exercise_name && exercisesList?.length) {
        const n = nameNorm(st.exercise_name);
        ex =
          exercisesList.find((e) => e.name && nameNorm(e.name) === n) ||
          exercisesList.find((e) => e.name && nameNorm(e.name).indexOf(n) >= 0);
      }
      if (!ex && st.exercise_name)
        ex = {
          name: st.exercise_name,
          category: null,
          subcategory: null,
          muscle_coefficients: null,
        };
      const coeffs = getLoadCoeffs(ex);
      const weekKey = getWeekKey(st.date);
      Object.entries(coeffs).forEach(([muscle, val]) => {
        muscleTotal[muscle] = (muscleTotal[muscle] || 0) + val;
        if (weekKey) {
          if (!muscleByWeek[muscle]) muscleByWeek[muscle] = {};
          muscleByWeek[muscle][weekKey] = (muscleByWeek[muscle][weekKey] || 0) + val;
        }
      });
    });
    const weeks = Object.keys(
      sessions6w.reduce((acc, s) => {
        acc[getWeekKey(s.date)] = true;
        return acc;
      }, {})
    ).sort();
    const rows = Object.entries(muscleTotal)
      .sort((a, b) => b[1] - a[1])
      .map(([muscle, total], i) => {
        const canvasId = 'sparkline-' + i;
        const weekValues = weeks.map((w) => muscleByWeek[muscle]?.[w] || 0);
        setTimeout(() => drawSparkline(canvasId, weekValues.length ? weekValues : [0]), 50);
        return `
      <tr>
        <td>${escapeHtml(muscleLabel(muscle))}</td>
        <td>${(Math.round(total * 10) / 10).toFixed(1)}</td>
        <td><canvas id="${canvasId}" class="sparkline-canvas" width="120" height="40"></canvas></td>
      </tr>`;
      })
      .join('');
    return `
    <table class="cabinet-table">
      <thead><tr><th>Группа мышц</th><th>Подходов всего</th><th>Тренд (6 нед.)</th></tr></thead>
      <tbody>${rows || '<tr><td colspan="3">Нет данных</td></tr>'}</tbody>
    </table>`;
  }

  window.renderWorkoutsTab = async function () {
    const clientId = window.__cabinetClientId;
    if (!clientId) return;
    const panel = document.getElementById('tab-workouts');
    if (!panel) return;
    panel.innerHTML = '<div class="overview-placeholder">Загрузка…</div>';
    const period = window.__cabinetWorkoutsPeriod || 'all';
    const activeBlockId = window.__cabinetActiveBlockId || null;
    let data;
    try {
      data = await loadWorkoutsData(clientId, period, activeBlockId);
    } catch (e) {
      panel.innerHTML =
        '<div class="overview-placeholder" style="color:var(--danger);">Ошибка: ' +
        escapeHtml(e.message) +
        '</div>';
      return;
    }
    const blockByName = {};
    data.blocks.forEach((b) => {
      blockByName[b.id] = b.name;
    });
    const blocksHtml = renderBlocksTable(data.blocks, data.usedByBlock, clientId);
    const sessionsHtml = renderSessionsTable(
      data.sessions,
      data.setsBySession,
      data.sessionById,
      blockByName,
      data.exerciseById
    );
    const periodOptions = [
      { value: 'all', label: 'Всё' },
      { value: 'block', label: 'Этот блок' },
      { value: '30', label: '30 дней' },
      { value: '7', label: '7 дней' },
    ];
    const periodSelectHtml = `
    <div class="filter-row" style="display:flex;gap:12px;align-items:center;margin-bottom:16px;flex-wrap:wrap;">
      <label>Период:</label>
      <select id="cabinet-period-select">
        ${periodOptions.map((o) => `<option value="${o.value}" ${o.value === period ? 'selected' : ''}>${o.label}</option>`).join('')}
      </select>
      <button type="button" class="btn-sm" id="cabinet-add-session-btn">+ Добавить сессию</button>
    </div>`;
    const muscleHtml = renderMuscleLoad(
      data.sessionsAll,
      data.setsBySession,
      data.sessionById,
      data.exerciseById,
      data.exercises,
      panel
    );
    panel.innerHTML = `
    <h2 class="cabinet-section-title">Блоки</h2>
    ${blocksHtml}
    <h2 class="cabinet-section-title">Сессии</h2>
    ${periodSelectHtml}
    ${sessionsHtml}
    <h2 class="cabinet-section-title">Нагрузка по мышцам</h2>
    ${muscleHtml}
    `;
    const periodSelectEl = document.getElementById('cabinet-period-select');
    if (periodSelectEl) {
      periodSelectEl.addEventListener('change', () => {
        window.__cabinetWorkoutsPeriod = periodSelectEl.value;
        window.renderWorkoutsTab();
      });
    }
    window.__cabinetWorkoutsPeriod = period;
    document.querySelectorAll('.save-block-btn').forEach((btn) => {
      btn.addEventListener('click', async () => {
        const blockId = btn.dataset.blockId;
        const row = panel.querySelector(`tr[data-block-id="${blockId}"]`);
        if (!row) return;
        const name = row.querySelector('.block-name')?.value?.trim();
        const endDate = row.querySelector('.block-end')?.value || null;
        const costRaw = row.querySelector('.block-cost')?.value;
        const cost = costRaw === '' || costRaw === null ? null : parseFloat(costRaw);
        try {
          await window.cabinetSupabase
            .from('training_blocks')
            .update({ name: name || null, end_date: endDate || null, cost })
            .eq('id', blockId);
          window.renderWorkoutsTab();
        } catch (err) {
          alert('Ошибка: ' + (err.message || String(err)));
        }
      });
    });
    document.querySelectorAll('.session-row').forEach((row) => {
      row.addEventListener('click', () => {
        row.classList.toggle('expanded');
      });
    });
    const addBlockBtn = document.getElementById('cabinet-add-block-btn');
    if (addBlockBtn) {
      addBlockBtn.addEventListener('click', async () => {
        try {
          const programId = await ensureClientProgram(clientId);
          await createBlock(programId, {
            name: 'Новый блок',
            start_date: new Date().toISOString().slice(0, 10),
          });
          window.renderWorkoutsTab();
        } catch (err) {
          alert('Ошибка при создании блока: ' + (err.message || String(err)));
        }
      });
    }
    const addSessionBtn = document.getElementById('cabinet-add-session-btn');
    if (addSessionBtn) {
      addSessionBtn.addEventListener('click', async () => {
        try {
          await createSession(clientId, {
            date: new Date().toISOString().slice(0, 10),
            type: 'Тренировка',
            status: 'planned',
          });
          window.renderWorkoutsTab();
        } catch (err) {
          alert('Ошибка при создании сессии: ' + (err.message || String(err)));
        }
      });
    }
  };
})();
