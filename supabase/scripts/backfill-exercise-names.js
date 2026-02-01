/**
 * Backfill exercise_name в workout_sets для записей с exercise_id = null.
 * Читает WorkoutLog из Google Sheets, матчит по client+date+set_number, обновляет Supabase.
 * Запуск: node backfill-exercise-names.js (из папки supabase/scripts)
 * Требует: .env, config.json, GOOGLE_APPLICATION_CREDENTIALS
 */
import { config } from 'dotenv';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';
import { existsSync } from 'fs';
import { readFileSync } from 'fs';
import { getSheetData, getSessionSheetData, findColumns, formatDate } from './lib/sheets.js';
import { getSupabase } from './lib/supabase.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
config({ path: resolve(__dirname, '../.env') });

function loadConfig() {
  const path = resolve(__dirname, 'config.json');
  if (!existsSync(path)) throw new Error('Создай config.json из config.sample.json');
  return JSON.parse(readFileSync(path, 'utf8'));
}

async function main() {
  const cfg = loadConfig();
  const masterId = cfg.coachMasterSpreadsheetId;
  const trainerEmail = (cfg.trainerEmail || '').toLowerCase().trim();
  const supabase = getSupabase();

  const clientsRows = await getSheetData(masterId, 'Clients');
  const headers = clientsRows[0].map(h => String(h).toLowerCase().trim());
  const cols = findColumns(headers, {
    id: ['id'],
    name: ['name'],
    email: ['email'],
    spreadsheetId: ['spreadsheetid'],
    status: ['status'],
  });

  const nameCol = cols.name >= 0 ? cols.name : cols.id;
  let trainerId = null;
  const clientIdToUuid = {};
  const clientIdToSpreadsheet = {};

  const { data: allClients } = await supabase.from('clients').select('id, name');
  const clientsByName = (allClients || []).reduce((a, c) => {
    const k = (c.name || '').toLowerCase().trim();
    if (k) a[k] = c.id;
    return a;
  }, {});

  for (let i = 1; i < clientsRows.length; i++) {
    const row = clientsRows[i];
    const id = cols.id >= 0 ? String(row[cols.id] || '').trim() : '';
    const name = nameCol >= 0 ? String(row[nameCol] || '').trim() : id;
    const email = cols.email >= 0 ? String(row[cols.email] || '').trim() : '';
    const spreadsheetId = cols.spreadsheetId >= 0 ? String(row[cols.spreadsheetId] || '').trim() : '';
    const status = cols.status >= 0 ? String(row[cols.status] || 'active') : 'active';
    if (status === 'archived' || status === 'deleted') continue;

    const isTrainer = (trainerEmail && email && email.toLowerCase() === trainerEmail) || (!spreadsheetId && !name);
    if (isTrainer) continue;
    if (!id && !spreadsheetId) continue;

    clientIdToSpreadsheet[id || name] = spreadsheetId;
    const uuid = clientsByName[name?.toLowerCase()] || clientsByName[id?.toLowerCase()] || (allClients || []).find(c => c.name === name || c.name === id)?.id;
    if (uuid) clientIdToUuid[id || name] = uuid;
  }

  const { data: t } = await supabase.from('trainers').select('id').limit(1).maybeSingle();
  trainerId = t?.id;

  let updated = 0;
  for (const [clientId, spreadsheetId] of Object.entries(clientIdToSpreadsheet)) {
    if (!spreadsheetId) continue;
    const clientUuid = clientIdToUuid[clientId];
    if (!clientUuid) continue;

    let wsRows;
    let wlRows;
    try {
      wsRows = await getSessionSheetData(spreadsheetId);
      wlRows = await getSheetData(spreadsheetId, 'WorkoutLog');
    } catch (e) {
      console.warn('Клиент', clientId, ':', e.message);
      continue;
    }
    if (wsRows.length < 2 || wlRows.length < 2) continue;

    const wsH = wsRows[0].map(h => String(h).toLowerCase().trim());
    const wsC = findColumns(wsH, { sessionId: ['sessionid', 'id'], date: ['date'] });
    const oldSessionIdToDate = {};
    for (let i = 1; i < wsRows.length; i++) {
      const oldSessId = wsC.sessionId >= 0 ? String(wsRows[i][wsC.sessionId] || '') : '';
      const date = formatDate(wsC.date >= 0 ? wsRows[i][wsC.date] : null);
      if (oldSessId && date) oldSessionIdToDate[oldSessId] = date;
    }

    const { data: sessions } = await supabase
      .from('workout_sessions')
      .select('id, date')
      .eq('client_id', clientUuid);
    const dateToSessionUuid = (sessions || []).reduce((a, s) => {
      a[s.date] = s.id;
      return a;
    }, {});

    const wlH = wlRows[0].map(h => String(h).toLowerCase().trim());
    const wlC = findColumns(wlH, {
      sessionId: ['sessionid'],
      exerciseName: ['exercisename', 'exercise', 'name'],
    });
    if (wlC.sessionId < 0 || wlC.exerciseName < 0) continue;

    const wlBySession = {};
    for (let i = 1; i < wlRows.length; i++) {
      const r = wlRows[i];
      const oldSessId = String(r[wlC.sessionId] || '').trim();
      const exName = String(r[wlC.exerciseName] || '').trim();
      if (!oldSessId || !exName) continue;
      if (!wlBySession[oldSessId]) wlBySession[oldSessId] = [];
      wlBySession[oldSessId].push(exName);
    }

    for (const [oldSessId, exNames] of Object.entries(wlBySession)) {
      const date = oldSessionIdToDate[oldSessId];
      if (!date) continue;
      const sessionUuid = dateToSessionUuid[date];
      if (!sessionUuid) continue;

      const { data: sets } = await supabase
        .from('workout_sets')
        .select('id')
        .eq('session_id', sessionUuid)
        .is('exercise_id', null)
        .order('set_number');

      if (!sets?.length || sets.length !== exNames.length) continue;

      for (let j = 0; j < Math.min(sets.length, exNames.length); j++) {
        const { error } = await supabase
          .from('workout_sets')
          .update({ exercise_name: exNames[j] })
          .eq('id', sets[j].id);
        if (!error) updated++;
      }
    }
  }

  console.log('Обновлено записей exercise_name:', updated);
}

main().catch(e => {
  console.error(e);
  process.exit(1);
});
