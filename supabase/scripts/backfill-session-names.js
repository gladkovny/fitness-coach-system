/**
 * Backfill workout_sessions.type из WorkoutSessions (splitType или type).
 * Для уже мигрированных данных, где type пустой.
 * Запуск: node backfill-session-names.js (из папки supabase/scripts)
 * Требует: .env, config.json, GOOGLE_APPLICATION_CREDENTIALS
 */
import { config } from 'dotenv';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';
import { existsSync, readFileSync } from 'fs';
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
    id: ['id'], name: ['name'], email: ['email'],
    spreadsheetId: ['spreadsheetid'], status: ['status'],
  });
  const nameCol = cols.name >= 0 ? cols.name : cols.id;

  const { data: allClients } = await supabase.from('clients').select('id, name');
  const clientsByName = (allClients || []).reduce((a, c) => {
    const k = (c.name || '').toLowerCase().trim();
    if (k) a[k] = c.id;
    return a;
  }, {});

  const clientIdToSpreadsheet = {};
  const clientIdToUuid = {};
  for (let i = 1; i < clientsRows.length; i++) {
    const row = clientsRows[i];
    const id = cols.id >= 0 ? String(row[cols.id] || '').trim() : '';
    const name = nameCol >= 0 ? String(row[nameCol] || '').trim() : id;
    const email = cols.email >= 0 ? String(row[cols.email] || '').trim() : '';
    const spreadsheetId = cols.spreadsheetId >= 0 ? String(row[cols.spreadsheetId] || '').trim() : '';
    const status = cols.status >= 0 ? String(row[cols.status] || 'active') : 'active';
    if (status === 'archived' || status === 'deleted') continue;
    if (trainerEmail && email && email.toLowerCase() === trainerEmail) continue;
    if (!spreadsheetId) continue;

    clientIdToSpreadsheet[id || name] = spreadsheetId;
    const uuid = clientsByName[name?.toLowerCase()] || clientsByName[id?.toLowerCase()];
    if (uuid) clientIdToUuid[id || name] = uuid;
  }

  let updated = 0;
  for (const [clientId, spreadsheetId] of Object.entries(clientIdToSpreadsheet)) {
    const clientUuid = clientIdToUuid[clientId];
    if (!clientUuid) continue;

    let wsRows;
    try {
      wsRows = await getSessionSheetData(spreadsheetId);
    } catch (e) {
      console.warn(`Клиент ${clientId}:`, e.message);
      continue;
    }
    if (!wsRows || wsRows.length < 2) continue;

    const wsH = wsRows[0].map(h => String(h).toLowerCase().trim());
    const wsC = findColumns(wsH, {
      sessionId: ['sessionid', 'id'],
      date: ['date'],
      type: ['type'],
      splitType: ['splittype', 'split_type'],
      name: ['name', 'название', 'workout'],
    });

    const { data: sessions } = await supabase
      .from('workout_sessions')
      .select('id, date, type')
      .eq('client_id', clientUuid);

    const sessionByDate = (sessions || []).reduce((a, s) => {
      a[s.date] = (a[s.date] || []).concat(s);
      return a;
    }, {});

    for (let i = 1; i < wsRows.length; i++) {
      const r = wsRows[i];
      const date = formatDate(wsC.date >= 0 ? r[wsC.date] : null);
      if (!date) continue;

      const typeVal = (wsC.splitType >= 0 && r[wsC.splitType]) ? String(r[wsC.splitType]).trim()
        : (wsC.type >= 0 && r[wsC.type]) ? String(r[wsC.type]).trim()
        : (wsC.name >= 0 && r[wsC.name]) ? String(r[wsC.name]).trim() : null;
      if (!typeVal) continue;

      const candidates = sessionByDate[date];
      if (!candidates || !candidates.length) continue;

      for (const sess of candidates) {
        const cur = String(sess.type || '').trim();
        const needUpdate = !cur || cur.length <= 2 || cur.toLowerCase() === 'тренировка';
        if (!needUpdate) continue;
        const { error } = await supabase
          .from('workout_sessions')
          .update({ type: typeVal })
          .eq('id', sess.id);
        if (!error) updated++;
      }
    }
  }

  console.log(`Обновлено записей type: ${updated}`);
}

main().catch(e => { console.error(e); process.exit(1); });
