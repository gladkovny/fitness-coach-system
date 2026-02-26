/**
 * Генерация программы FullBody для Кирилла на основе истории в Supabase (или Google Sheets).
 * Только чтение данных, без записи в БД.
 * Запуск: node scripts/generate-kirill-workout.js
 */

const path = require('path');
const fs = require('fs');
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: path.join(__dirname, '../supabase/.env') });
require('dotenv').config({ path: path.join(__dirname, '../.env') });

// ——— Конфиг ———
const ROOT = path.join(__dirname, '..');
const CONFIG_PATH = path.join(ROOT, 'supabase', 'scripts', 'config.json');
const DATA_DIR = path.join(ROOT, 'data');
const KIRILL_NAMES = ['кирилл', 'kirill'];

/** Загрузка конфига: config.json или process.env */
function loadConfig() {
  let url = process.env.SUPABASE_URL;
  let key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_KEY;
  if (fs.existsSync(CONFIG_PATH)) {
    const cfg = JSON.parse(fs.readFileSync(CONFIG_PATH, 'utf8'));
    url = url || cfg.SUPABASE_URL;
    key = key || cfg.SUPABASE_SERVICE_ROLE_KEY || cfg.SUPABASE_SERVICE_KEY;
  }
  return { url, key };
}

/** Подключение к Supabase */
function getSupabase() {
  const { url, key } = loadConfig();
  if (!url || !key)
    throw new Error('Нужны SUPABASE_URL и SUPABASE_SERVICE_ROLE_KEY (config.json или .env)');
  return createClient(url, key);
}

/** Нормализованное имя упражнения для сопоставления */
function normalizeExerciseName(name) {
  if (!name || typeof name !== 'string') return '';
  return name.toLowerCase().replace(/\s+/g, ' ').trim();
}

/** Поиск клиента Кирилл в Supabase */
async function findKirillClient(supabase) {
  const { data: clients, error } = await supabase
    .from('clients')
    .select('id, name, profile')
    .or(KIRILL_NAMES.map((n) => `name.ilike.%${n}%`).join(','));

  if (error) throw new Error('Supabase clients: ' + error.message);
  if (!clients || clients.length === 0) return null;
  return clients[0];
}

/** Загрузка сессий и подходов из Supabase */
async function loadFromSupabase(supabase, clientId) {
  const { data: sessions, error: sessErr } = await supabase
    .from('workout_sessions')
    .select('*')
    .eq('client_id', clientId)
    .order('date', { ascending: false })
    .limit(50);

  if (sessErr) throw new Error('Supabase sessions: ' + sessErr.message);
  if (!sessions || sessions.length === 0) return { sessions: [], sets: [] };

  const sessionIds = sessions.map((s) => s.id);
  const { data: sets, error: setsErr } = await supabase
    .from('workout_sets')
    .select('*, exercises(name, category, subcategory, laterality)')
    .in('session_id', sessionIds)
    .order('session_id')
    .order('set_number');

  if (setsErr) throw new Error('Supabase sets: ' + setsErr.message);
  return { sessions, sets: sets || [] };
}

/** Имя упражнения из записи подхода (join или exercise_name) */
function getSetExerciseName(set) {
  const fromJoin = set.exercises && set.exercises.name;
  const fromCol = set.exercise_name;
  return (fromCol || fromJoin || '').trim() || '—';
}

/** Загрузка из Google Sheets (fallback) */
async function loadFromSheets() {
  const cfgPath = path.join(ROOT, 'supabase', 'scripts', 'config.json');
  const keyPath = path.join(
    ROOT,
    'supabase',
    'scripts',
    'helical-beaker-437403-u3-a18c3a4ed871.json'
  );
  if (!fs.existsSync(cfgPath) || !fs.existsSync(keyPath)) return null;

  const cfg = JSON.parse(fs.readFileSync(cfgPath, 'utf8'));
  const masterId = cfg.coachMasterSpreadsheetId;
  if (!masterId) return null;

  process.env.GOOGLE_APPLICATION_CREDENTIALS = keyPath;
  const { google } = require('googleapis');
  const auth = new google.auth.GoogleAuth({
    keyFile: keyPath,
    scopes: ['https://www.googleapis.com/auth/spreadsheets.readonly'],
  });
  const sheets = google.sheets({ version: 'v4', auth: await auth.getClient() });

  // Лист Clients — найти Кирилла и spreadsheetId
  let clientsRows;
  try {
    const res = await sheets.spreadsheets.values.get({
      spreadsheetId: masterId,
      range: "'Clients'",
    });
    clientsRows = res.data.values || [];
  } catch (e) {
    return null;
  }
  if (clientsRows.length < 2) return null;

  const headers = clientsRows[0].map((h) => String(h).toLowerCase().trim());
  const findCol = (names) => {
    for (const n of names) {
      const i = headers.findIndex((h) => h.includes(n));
      if (i >= 0) return i;
    }
    return -1;
  };
  const colId = findCol(['id']);
  const colName = findCol(['name', 'key']);
  const colSpreadsheet = findCol(['spreadsheetid']);
  const nameCol = colName >= 0 ? colName : colId;
  let spreadsheetId = null;
  for (let i = 1; i < clientsRows.length; i++) {
    const row = clientsRows[i];
    const id = colId >= 0 ? String(row[colId] || '').trim() : '';
    const name = nameCol >= 0 ? String(row[nameCol] || '').trim() : id;
    const normalized = (name || id).toLowerCase();
    if (KIRILL_NAMES.some((k) => normalized.includes(k))) {
      spreadsheetId = colSpreadsheet >= 0 ? String(row[colSpreadsheet] || '').trim() : '';
      break;
    }
  }
  if (!spreadsheetId) return null;

  // WorkoutSessions
  const sessionNames = ['WorkoutSessions', 'Workout Sessions', 'Тренировки', 'Sessions'];
  let wsRows = [];
  for (const sheetName of sessionNames) {
    try {
      const res = await sheets.spreadsheets.values.get({
        spreadsheetId,
        range: `'${sheetName}'`,
      });
      wsRows = res.data.values || [];
      if (wsRows.length >= 2) break;
    } catch {
      // лист может быть пустым или без доступа
    }
  }
  if (wsRows.length < 2) return null;

  const wsH = wsRows[0].map((h) => String(h).toLowerCase().trim());
  const wsColDate = wsH.findIndex((h) => h.includes('date'));
  const wsColId = wsH.findIndex((h) => h.includes('sessionid') || h.includes('id'));
  const sessions = [];
  const oldIdToSession = {};
  for (let i = 1; i < wsRows.length; i++) {
    const row = wsRows[i];
    const dateRaw = wsColDate >= 0 ? row[wsColDate] : null;
    let date = null;
    if (dateRaw) {
      if (/^\d{4}-\d{2}-\d{2}$/.test(String(dateRaw))) date = String(dateRaw);
      else {
        const d = new Date(dateRaw);
        if (!isNaN(d.getTime())) date = d.toISOString().slice(0, 10);
      }
    }
    if (!date) continue;
    const oldId = wsColId >= 0 ? String(row[wsColId] || '').trim() : `s${i}`;
    const session = { id: oldId, date, _oldId: oldId };
    sessions.push(session);
    oldIdToSession[oldId] = session;
  }
  sessions.sort((a, b) => (b.date > a.date ? 1 : -1));

  // WorkoutLog
  let wlRows = [];
  try {
    const res = await sheets.spreadsheets.values.get({
      spreadsheetId,
      range: "'WorkoutLog'",
    });
    wlRows = res.data.values || [];
  } catch (_) {
    return { sessions, sets: [] };
  }
  if (wlRows.length < 2) return { sessions, sets: [] };

  const wlH = wlRows[0].map((h) => String(h).toLowerCase().trim());
  const wlColSess = wlH.findIndex((h) => h.includes('sessionid'));
  const wlColEx = wlH.findIndex((h) => h.includes('exercisename') || h.includes('exercise'));
  const wlColSet = wlH.findIndex((h) => h.includes('setnumber') || h.includes('set'));
  const wlColReps = wlH.findIndex((h) => h.includes('reps'));
  const wlColWeight = wlH.findIndex((h) => h.includes('weight'));
  const wlColRpe = wlH.findIndex((h) => h.includes('rpe') || h.includes('rating'));

  const sets = [];
  for (let i = 1; i < wlRows.length; i++) {
    const row = wlRows[i];
    const oldSessId = wlColSess >= 0 ? String(row[wlColSess] || '').trim() : '';
    const session = oldIdToSession[oldSessId];
    if (!session) continue;
    const exerciseName = wlColEx >= 0 ? String(row[wlColEx] || '').trim() : '';
    const setNumber = wlColSet >= 0 ? parseInt(row[wlColSet], 10) || i : i;
    const reps = wlColReps >= 0 ? parseInt(row[wlColReps], 10) : null;
    const weight = wlColWeight >= 0 ? parseFloat(row[wlColWeight]) : null;
    const rpe = wlColRpe >= 0 ? parseInt(row[wlColRpe], 10) : null;
    sets.push({
      session_id: session.id,
      exercise_name: exerciseName,
      exercises: { name: exerciseName },
      set_number: setNumber,
      reps: isNaN(reps) ? null : reps,
      weight: isNaN(weight) ? null : weight,
      rpe: isNaN(rpe) ? null : rpe,
    });
  }

  return { sessions, sets };
}

/** Последний рабочий вес по упражнению (по имени) из истории */
function getLastWeightsAndReps(sessions, sets) {
  const byDate = {};
  sessions.forEach((s) => {
    byDate[s.id] = s.date;
  });
  const exerciseHistory = {};
  sets
    .filter((s) => byDate[s.session_id])
    .sort((a, b) => {
      const dA = byDate[a.session_id];
      const dB = byDate[b.session_id];
      return dB.localeCompare(dA);
    })
    .forEach((s) => {
      const name = normalizeExerciseName(getSetExerciseName(s));
      if (!name || name === '—') return;
      if (!exerciseHistory[name]) exerciseHistory[name] = [];
      if (exerciseHistory[name].length >= 5) return;
      exerciseHistory[name].push({
        weight: s.weight,
        reps: s.reps,
        rpe: s.rpe,
        date: byDate[s.session_id],
      });
    });
  return exerciseHistory;
}

/** Подбор веса на следующий раз: консервативно для новичка */
function suggestWeight(history, defaultWeight = null) {
  if (!history || history.length === 0) return defaultWeight;
  const last = history[0];
  const weight = last.weight != null ? Number(last.weight) : null;
  const rpe = last.rpe != null ? last.rpe : null;
  if (weight == null) return defaultWeight;
  if (rpe >= 9) return weight;
  if (rpe <= 7 && weight > 0) return weight + 2.5;
  return weight;
}

/** Подбор повторений (целевой диапазон по последнему разу) */
function suggestReps(history, defaultReps = 10) {
  if (!history || history.length === 0) return defaultReps;
  const last = history[0];
  const reps = last.reps != null ? last.reps : defaultReps;
  return Math.min(12, Math.max(6, reps));
}

/** Похоже ли имя упражнения на один из вариантов */
function matchExercise(name, variants) {
  const n = normalizeExerciseName(name);
  return variants.some(
    (v) => n.includes(normalizeExerciseName(v)) || normalizeExerciseName(v).includes(n)
  );
}

/** Упражнения из последних двух тренировок (для ротации) */
function getRecentExerciseNames(sessions, sets, lastN = 2) {
  const sessionIds = sessions.slice(0, lastN).map((s) => s.id);
  const names = new Set();
  sets.forEach((s) => {
    if (sessionIds.includes(s.session_id)) names.add(normalizeExerciseName(getSetExerciseName(s)));
  });
  return Array.from(names);
}

// ——— Категории для FullBody ———
// Простой вариант для мессенджера: фиксированные упражнения в тренажёрах
const LEG_EXTENSION_ALIASES = [
  'разгибание голени',
  'leg extension',
  'присед',
  'squat',
  'жим ногами',
  'рычажном тренаж',
];
const HORIZONTAL_PULL = [
  'тяга к поясу',
  'тяга т-грифа',
  'тяга нижнего блока',
  'тяга горизонтальная',
  'row',
  'гребля',
];
const PRESS_SEATED_ALIASES = [
  'жим сидя',
  'жим гантелей',
  'жим лёжа',
  'жим в блочном',
  'bench',
  'press',
];
const CRUNCH_ALIASES = ['скручивания', 'crunch'];
const SHOULDER_ABDUCTION_ALIASES = [
  'отведение плеча',
  'y-разгибания',
  'face pull',
  'задняя дельта',
];

/** Выбор упражнения из истории по категории, с ротацией */
function pickExerciseForCategory(categoryKeywords, historyNames, recentUsed, preferName) {
  const candidates = Object.keys(historyNames).filter((name) =>
    categoryKeywords.some((kw) => name.includes(kw) || kw.includes(name))
  );
  if (candidates.length === 0) return preferName || null;
  const notRecent = candidates.filter((c) => !recentUsed.has(c));
  const pool = notRecent.length > 0 ? notRecent : candidates;
  return pool[0] || preferName;
}

/** Взять историю по первому совпадению из списка алиасов (для веса/повторений) */
function getHistoryByAliases(exerciseHistory, aliases) {
  for (const alias of aliases) {
    const key = Object.keys(exerciseHistory).find((k) => matchExercise(k, [alias]));
    if (key && exerciseHistory[key].length) return exerciseHistory[key];
  }
  return [];
}

/** Генерация текста программы */
function generateProgramText(sessions, sets, _dateForFilename) {
  const exerciseHistory = getLastWeightsAndReps(sessions, sets);
  const recentUsed = new Set(getRecentExerciseNames(sessions, sets, 2));

  const sessionIdsByDate = {};
  sessions.forEach((s) => {
    sessionIdsByDate[s.date] = s.id;
  });
  const sortedDates = Object.keys(sessionIdsByDate).sort((a, b) => b.localeCompare(a));
  const lastSessionId = sortedDates.length > 0 ? sessionIdsByDate[sortedDates[0]] : null;

  // Подтягивания — последние повторения по подходам
  let pullupsLastReps = [];
  if (lastSessionId) {
    const pullupSets = sets.filter(
      (s) =>
        s.session_id === lastSessionId &&
        matchExercise(getSetExerciseName(s), ['подтягивания', 'pull'])
    );
    pullupsLastReps = pullupSets
      .sort((a, b) => a.set_number - b.set_number)
      .map((s) => (s.reps != null ? s.reps : '?'));
  }
  const pullupsRepsStr =
    pullupsLastReps.length > 0 ? pullupsLastReps.join(', ') + ' повторений' : '—';

  // Простой вариант для мессенджера: фиксированные названия и порядок
  const crunchHistory = getHistoryByAliases(exerciseHistory, CRUNCH_ALIASES);
  const crunchWeight = suggestWeight(crunchHistory, 12);
  const crunchReps = suggestReps(crunchHistory, 12);

  const legHistory = getHistoryByAliases(exerciseHistory, LEG_EXTENSION_ALIASES);
  const legWeight = suggestWeight(legHistory, 40);
  const legReps = suggestReps(legHistory, 10);

  const rowName =
    pickExerciseForCategory(
      HORIZONTAL_PULL,
      exerciseHistory,
      recentUsed,
      'Тяга горизонтального блока к поясу'
    ) || 'Тяга горизонтального блока к поясу';
  const rowHistory = exerciseHistory[rowName] || [];
  const rowWeight = suggestWeight(rowHistory, 40);
  const rowReps = suggestReps(rowHistory, 10);

  const pressHistory = getHistoryByAliases(exerciseHistory, PRESS_SEATED_ALIASES);
  const pressWeight = suggestWeight(pressHistory, 12);
  const pressReps = suggestReps(pressHistory, 10);

  const shoulderHistory = getHistoryByAliases(exerciseHistory, SHOULDER_ABDUCTION_ALIASES);
  const shoulderWeight = suggestWeight(shoulderHistory, 2);
  const shoulderReps = suggestReps(shoulderHistory, 12);

  const formatSet = (w, r) => {
    if (w != null && r != null) return `${w} кг × ${r}`;
    if (w != null) return `${w} кг × 8–10`;
    return '8–10 повторений (подбери вес по ощущениям)';
  };

  let text = `🏋️ ТРЕНИРОВКА НА ЗАВТРА — FullBody

⚡ ПЕРЕД ТРЕНИРОВКОЙ (обязательно!):
1. Дыхательные упражнения — 5 мин
   (дыхание 360, диафрагмальное дыхание)
2. ЛФК осанка — 5–7 мин
   (wall angels, cat-cow, коррекция кифоза)

📋 ПРОГРАММА:

1. Скручивания в тренажёре
   Подход 1: ${formatSet(crunchWeight, crunchReps)}
   Подход 2: ${formatSet(crunchWeight, crunchReps)}
   Подход 3: ${formatSet(crunchWeight, crunchReps)}
   Отдых: 1–2 мин

2. Подтягивания
   5 подходов на МАКСИМУМ (отдых 2–3 мин)
   В прошлый раз: ${pullupsRepsStr}

3. Разгибание голени
   Подход 1: ${formatSet(legWeight, legReps)}
   Подход 2: ${formatSet(legWeight, legReps)}
   Подход 3: ${formatSet(legWeight, legReps)}
   Отдых: 2 мин

4. ${rowName}
   Подход 1: ${formatSet(rowWeight, rowReps)}
   Подход 2: ${formatSet(rowWeight, rowReps)}
   Подход 3: ${formatSet(rowWeight, rowReps)}
   Отдых: 2 мин

5. Жим сидя в тренажёре
   Подход 1: ${formatSet(pressWeight, pressReps)}
   Подход 2: ${formatSet(pressWeight, pressReps)}
   Подход 3: ${formatSet(pressWeight, pressReps)}
   Отдых: 2 мин

6. Отведение плеча в тренажёре
   Подход 1: ${formatSet(shoulderWeight, shoulderReps)}
   Подход 2: ${formatSet(shoulderWeight, shoulderReps)}
   Подход 3: ${formatSet(shoulderWeight, shoulderReps)}
   Отдых: 1 мин

💡 ЗАМЕТКИ:
- Общее время: ~60 мин
- Между упражнениями отдых 2–3 минуты
- Если вес кажется тяжёлым — убавь на 5 кг, не геройствуй
- RPE должен быть 7–8 (оставляй 2–3 повторения в запасе)
- Запиши веса и повторения — я потом внесу в систему
`;

  return text;
}

async function main() {
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const dateStr = tomorrow.toISOString().slice(0, 10);

  let sessions = [];
  let sets = [];
  let source = '';

  try {
    const supabase = getSupabase();
    const client = await findKirillClient(supabase);
    if (client) {
      const data = await loadFromSupabase(supabase, client.id);
      sessions = data.sessions;
      sets = data.sets;
      source = 'Supabase';
    }
  } catch (e) {
    console.warn('Supabase:', e.message);
  }

  if (sessions.length === 0 && sets.length === 0) {
    try {
      const data = await loadFromSheets();
      if (data) {
        sessions = data.sessions;
        sets = data.sets;
        source = 'Google Sheets';
      }
    } catch (e) {
      console.warn('Sheets:', e.message);
    }
  }

  if (sessions.length === 0) {
    console.error('Не найдены тренировки Кирилла ни в Supabase, ни в Google Sheets.');
    process.exit(1);
  }

  console.log(
    `Данные загружены из ${source}: ${sessions.length} сессий, ${sets.length} подходов.\n`
  );

  const programText = generateProgramText(sessions, sets, dateStr);

  console.log(programText);

  if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
  const outPath = path.join(DATA_DIR, `kirill-workout-${dateStr}.txt`);
  fs.writeFileSync(outPath, programText, 'utf8');
  console.log(`\nПрограмма сохранена: ${outPath}`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
