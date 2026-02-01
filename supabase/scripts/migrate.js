/**
 * Автоматическая миграция Google Sheets → Supabase.
 * Запуск: npm run migrate (из папки supabase/scripts).
 * Требует: .env (SUPABASE_*), config.json, GOOGLE_APPLICATION_CREDENTIALS.
 */
import { config } from 'dotenv';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';
import { readFileSync, existsSync } from 'fs';
import { getSheetData, findColumns, formatDate } from './lib/sheets.js';
import { getSupabase } from './lib/supabase.js';

const __dirname = dirname(fileURLToPath(import.meta.url));

// .env из папки supabase/
config({ path: resolve(__dirname, '../.env') });

const DRY_RUN = !!process.env.DRY_RUN;

function loadConfig() {
  const path = resolve(__dirname, 'config.json');
  if (!existsSync(path)) throw new Error('Создай config.json из config.sample.json и заполни coachMasterSpreadsheetId, trainerEmail');
  return JSON.parse(readFileSync(path, 'utf8'));
}

async function main() {
  const cfg = await loadConfig();
  const masterId = cfg.coachMasterSpreadsheetId;
  const trainerEmail = (cfg.trainerEmail || '').toLowerCase().trim();
  if (!masterId) throw new Error('В config.json укажи coachMasterSpreadsheetId');

  const supabase = DRY_RUN ? null : getSupabase();

  // ——— 1. Clients → trainers + clients ———
  const clientsRows = await getSheetData(masterId, 'Clients');
  if (clientsRows.length < 2) {
    console.log('Лист Clients пуст или отсутствует.');
    return;
  }
  const headers = clientsRows[0].map((h) => String(h).toLowerCase().trim());
  const cols = findColumns(headers, {
    id: ['id'],
    name: ['name', 'key'],
    email: ['email'],
    spreadsheetId: ['spreadsheetid'],
    clientType: ['clienttype', 'type'],
    status: ['status'],
    startDate: ['startdate'],
    notes: ['notes'],
  });

  let trainerId = null;
  const clientIdToUuid = {};
  const clientIdToSpreadsheetId = {};

  // Проход 1: найти и вставить тренера (одна строка: trainerEmail или без spreadsheetId / trainerRowIndex)
  for (let i = 1; i < clientsRows.length; i++) {
    const row = clientsRows[i];
    const id = cols.id >= 0 ? String(row[cols.id] || '').trim() : '';
    const name = cols.name >= 0 ? String(row[cols.name] || '').trim() : '';
    const email = cols.email >= 0 ? String(row[cols.email] || '').trim() : '';
    const spreadsheetId = cols.spreadsheetId >= 0 ? String(row[cols.spreadsheetId] || '').trim() : '';
    const status = cols.status >= 0 ? String(row[cols.status] || 'active').toLowerCase() : 'active';
    if (status === 'archived' || status === 'deleted') continue;

    const isTrainer =
      cfg.trainerRowIndex === i - 1 ||
      (trainerEmail && email && email.toLowerCase() === trainerEmail) ||
      (!spreadsheetId && name);

    if (isTrainer) {
      const trainerRow = {
        email: email || `trainer-${id || i}@local`,
        name: name || 'Trainer',
        subscription_plan: 'free',
      };
      if (!DRY_RUN) {
        const { data, error } = await supabase.from('trainers').insert(trainerRow).select('id').single();
        if (error) throw new Error('trainers insert: ' + error.message);
        trainerId = data.id;
      } else {
        trainerId = 'dry-run-trainer-id';
      }
      console.log('Тренер:', trainerRow.email, trainerId);
      break;
    }
  }
  if (!trainerId) throw new Error('Не найдена строка тренера в Clients. Укажи trainerEmail или trainerRowIndex в config.json');

  // Проход 2: вставить клиентов (все строки кроме тренера)
  for (let i = 1; i < clientsRows.length; i++) {
    const row = clientsRows[i];
    const id = cols.id >= 0 ? String(row[cols.id] || '').trim() : '';
    const name = cols.name >= 0 ? String(row[cols.name] || '').trim() : '';
    const email = cols.email >= 0 ? String(row[cols.email] || '').trim() : '';
    const spreadsheetId = cols.spreadsheetId >= 0 ? String(row[cols.spreadsheetId] || '').trim() : '';
    const status = cols.status >= 0 ? String(row[cols.status] || 'active').toLowerCase() : 'active';
    if (status === 'archived' || status === 'deleted') continue;

    const isTrainer =
      cfg.trainerRowIndex === i - 1 ||
      (trainerEmail && email && email.toLowerCase() === trainerEmail) ||
      (!spreadsheetId && name);
    if (isTrainer) continue;

    if (!id) continue;
    clientIdToSpreadsheetId[id] = spreadsheetId;
    const clientRow = {
      trainer_id: trainerId,
      email: email || null,
      name: name || id,
      status: status === 'active' || !status ? 'active' : status === 'onboarding' ? 'onboarding' : 'active',
      profile: {},
    };
    if (!DRY_RUN) {
      const { data, error } = await supabase.from('clients').insert(clientRow).select('id').single();
      if (error) throw new Error('clients insert: ' + error.message);
      clientIdToUuid[id] = data.id;
    } else {
      clientIdToUuid[id] = `dry-client-${id}`;
    }
  }

  console.log('Клиенты:', Object.keys(clientIdToUuid).length);

  // ——— 2. exercises_master → exercises ———
  let exerciseIdToUuid = {};
  try {
    const exRows = await getSheetData(masterId, 'exercises_master');
    if (exRows.length >= 2) {
      const exHeaders = exRows[0].map((h) => String(h).toLowerCase().trim());
      const exCols = findColumns(exHeaders, {
        id: ['id'],
        name: ['name'],
        category: ['category'],
        subcategory: ['subcategory'],
        type: ['type'],
        equipment: ['equipment'],
        videoUrl: ['videourl', 'video'],
        notes: ['notes'],
        laterality: ['laterality'],
        bodyweightRatio: ['bodyweightratio', 'bwratio', 'bodyweight_ratio'],
      });
      const toInsert = [];
      for (let i = 1; i < exRows.length; i++) {
        const r = exRows[i];
        const oldId = exCols.id >= 0 ? String(r[exCols.id] || '') : '';
        const name = exCols.name >= 0 ? String(r[exCols.name] || '') : '';
        if (!name) continue;
        const bwRatioVal = exCols.bodyweightRatio >= 0 ? parseFloat(r[exCols.bodyweightRatio]) : null;
        toInsert.push({
          trainer_id: null,
          name,
          category: exCols.category >= 0 ? String(r[exCols.category] || '') : null,
          subcategory: exCols.subcategory >= 0 ? String(r[exCols.subcategory] || '') : null,
          equipment: exCols.equipment >= 0 ? String(r[exCols.equipment] || '') : null,
          video_url: exCols.videoUrl >= 0 ? String(r[exCols.videoUrl] || '') : null,
          laterality: exCols.laterality >= 0 ? String(r[exCols.laterality] || '') : null,
          bodyweight_ratio: bwRatioVal > 0 && bwRatioVal <= 1 ? bwRatioVal : null,
          _oldId: oldId,
        });
      }
      if (!DRY_RUN && toInsert.length) {
        const insertPayload = toInsert.map(({ _oldId, ...rest }) => rest);
        const { data, error } = await supabase.from('exercises').insert(insertPayload).select('id,name');
        if (error) throw new Error('exercises insert: ' + error.message);
        data.forEach((row, idx) => {
          const oldId = toInsert[idx]._oldId;
          if (oldId) exerciseIdToUuid[oldId] = row.id;
          exerciseIdToUuid[row.name] = row.id;
        });
      } else if (DRY_RUN) {
        toInsert.forEach((t, i) => {
          exerciseIdToUuid[t._oldId || t.name] = `dry-ex-${i}`;
        });
      }
      console.log('Упражнения:', toInsert.length);
    }
  } catch (e) {
    if (e.message && e.message.includes('Unable to parse range')) console.log('Лист exercises_master не найден, пропуск.');
    else throw e;
  }

  // ——— 3. По каждому клиенту: его таблица ———
  for (const [clientId, spreadsheetId] of Object.entries(clientIdToSpreadsheetId)) {
    if (!spreadsheetId) continue;
    const clientUuid = clientIdToUuid[clientId];
    if (!clientUuid) continue;

    let programId = null;
    const blockIdToUuid = {};
    const sessionIdToUuid = {};

    try {
      // Программа: одна запись на клиента (из Goals или дефолт)
      if (!DRY_RUN) {
        const { data: prog, error } = await supabase
          .from('programs')
          .insert({
            trainer_id: trainerId,
            client_id: clientUuid,
            name: `Program ${clientId}`,
            type: 'online',
            status: 'active',
          })
          .select('id')
          .single();
        if (!error) programId = prog.id;
      } else programId = `dry-program-${clientId}`;

      // TrainingBlocks
      const tbRows = await getSheetData(spreadsheetId, 'TrainingBlocks');
      if (tbRows.length >= 2 && programId) {
        const tbH = tbRows[0].map((h) => String(h).toLowerCase().trim());
        const tbC = findColumns(tbH, {
          blockId: ['blockid', 'id'],
          name: ['name'],
          totalSessions: ['totalsessions', 'total'],
          usedSessions: ['usedsessions', 'used'],
          startDate: ['startdate', 'date'],
          status: ['status'],
        });
        for (let i = 1; i < tbRows.length; i++) {
          const r = tbRows[i];
          const oldBlockId = tbC.blockId >= 0 ? String(r[tbC.blockId] || '') : '';
          const name = tbC.name >= 0 ? String(r[tbC.name] || '') : `Block ${i}`;
          const payload = {
            program_id: programId,
            name,
            total_sessions: tbC.totalSessions >= 0 ? parseInt(r[tbC.totalSessions], 10) || 0 : 0,
            used_sessions: tbC.usedSessions >= 0 ? parseInt(r[tbC.usedSessions], 10) || 0 : 0,
            start_date: tbC.startDate >= 0 ? formatDate(r[tbC.startDate]) : null,
            status: tbC.status >= 0 ? String(r[tbC.status] || 'active') : 'active',
          };
          if (!DRY_RUN) {
            const { data, error } = await supabase.from('training_blocks').insert(payload).select('id').single();
            if (!error && oldBlockId) blockIdToUuid[oldBlockId] = data.id;
          } else if (oldBlockId) blockIdToUuid[oldBlockId] = `dry-block-${clientId}-${i}`;
        }
      }

      // WorkoutSessions
      const wsRows = await getSheetData(spreadsheetId, 'WorkoutSessions');
      if (wsRows.length >= 2) {
        const wsH = wsRows[0].map((h) => String(h).toLowerCase().trim());
        const wsC = findColumns(wsH, {
          sessionId: ['sessionid', 'id'],
          date: ['date'],
          blockId: ['blockid'],
          type: ['type'],
          splitType: ['splittype', 'split_type'],
          name: ['name', 'название', 'workout'],
          notes: ['notes'],
          totalVolume: ['totalvolume', 'volume'],
        });
        for (let i = 1; i < wsRows.length; i++) {
          const r = wsRows[i];
          const oldSessId = wsC.sessionId >= 0 ? String(r[wsC.sessionId] || '') : '';
          const date = formatDate(wsC.date >= 0 ? r[wsC.date] : null);
          if (!date) continue;
          const blockId = wsC.blockId >= 0 ? blockIdToUuid[String(r[wsC.blockId] || '')] : null;
          const typeVal = (wsC.splitType >= 0 && r[wsC.splitType]) ? String(r[wsC.splitType]).trim()
            : (wsC.type >= 0 && r[wsC.type]) ? String(r[wsC.type]).trim()
            : (wsC.name >= 0 && r[wsC.name]) ? String(r[wsC.name]).trim() : null;
          const payload = {
            client_id: clientUuid,
            block_id: blockId || null,
            date,
            type: typeVal || null,
            status: 'completed',
            notes: wsC.notes >= 0 ? String(r[wsC.notes] || '') : null,
            total_tonnage: wsC.totalVolume >= 0 ? parseFloat(r[wsC.totalVolume]) || null : null,
          };
          if (!DRY_RUN) {
            const { data, error } = await supabase.from('workout_sessions').insert(payload).select('id').single();
            if (!error && oldSessId) sessionIdToUuid[oldSessId] = data.id;
          } else if (oldSessId) sessionIdToUuid[oldSessId] = `dry-sess-${clientId}-${i}`;
        }
      }

      const parseNum = (v) => {
        if (v == null || v === '') return null;
        const n = Number(v);
        if (!isNaN(n)) return n;
        const s = String(v).replace(',', '.');
        const n2 = parseFloat(s);
        return isNaN(n2) ? null : n2;
      };
      // WorkoutLog → workout_sets
      const wlRows = await getSheetData(spreadsheetId, 'WorkoutLog');
      if (wlRows.length >= 2) {
        const wlH = wlRows[0].map((h) => String(h).toLowerCase().trim());
        const wlC = findColumns(wlH, {
          sessionId: ['sessionid'],
          exerciseId: ['exerciseid'],
          exerciseName: ['exercisename', 'exercise', 'name'],
          setNumber: ['setnumber', 'set', 'number'],
          reps: ['reps'],
          weight: ['weight'],
          rpe: ['rpe', 'rating'],
        });
        for (let i = 1; i < wlRows.length; i++) {
          const r = wlRows[i];
          const sessId = wlC.sessionId >= 0 ? String(r[wlC.sessionId] || '') : '';
          const sessionUuid = sessionIdToUuid[sessId];
          if (!sessionUuid) continue;
          const exId = wlC.exerciseId >= 0 ? String(r[wlC.exerciseId] || '') : '';
          const exName = wlC.exerciseName >= 0 ? String(r[wlC.exerciseName] || '') : '';
          const exerciseUuid = exerciseIdToUuid[exId] || exerciseIdToUuid[exName] || null;
          const setNumber = wlC.setNumber >= 0 ? parseInt(r[wlC.setNumber], 10) || i : i;
          const payload = {
            session_id: sessionUuid,
            exercise_id: exerciseUuid,
            exercise_name: exName || null,
            set_number: setNumber,
            reps: wlC.reps >= 0 ? parseInt(String(r[wlC.reps]).replace(',', '.'), 10) || null : null,
            weight: wlC.weight >= 0 ? parseNum(r[wlC.weight]) : null,
            rpe: wlC.rpe >= 0 ? parseInt(r[wlC.rpe], 10) || null : null,
          };
          if (!DRY_RUN && payload.session_id) await supabase.from('workout_sets').insert(payload);
        }
      }

      // Daily → daily_logs
      const dailyRows = await getSheetData(spreadsheetId, 'Daily');
      if (dailyRows.length >= 2) {
        const dH = dailyRows[0].map((h) => String(h).toLowerCase().trim());
        const dC = findColumns(dH, {
          date: ['date'],
          weight: ['weight'],
          sleepHours: ['sleephours', 'sleep'],
          nutrition: ['nutrition'],
          notes: ['notes'],
        });
        for (let i = 1; i < dailyRows.length; i++) {
          const r = dailyRows[i];
          const date = formatDate(dC.date >= 0 ? r[dC.date] : null);
          if (!date) continue;
          const payload = {
            client_id: clientUuid,
            date,
            weight: dC.weight >= 0 ? parseFloat(r[dC.weight]) || null : null,
            sleep_hours: dC.sleepHours >= 0 ? parseFloat(r[dC.sleepHours]) || null : null,
            nutrition: dC.nutrition >= 0 ? String(r[dC.nutrition] || '') : null,
            notes: dC.notes >= 0 ? String(r[dC.notes] || '') : null,
            source: 'manual',
          };
          if (!DRY_RUN) await supabase.from('daily_logs').insert(payload);
        }
      }

      console.log('Клиент', clientId, '— программы, блоки, сессии, подходы, daily перенесены.');
    } catch (err) {
      console.warn('Клиент', clientId, '— ошибка:', err.message);
    }
  }

  console.log(DRY_RUN ? '[DRY RUN] Запись в Supabase не выполнялась.' : 'Миграция завершена.');
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
