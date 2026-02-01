/**
 * Заполняет clients.profile (weight, mainGoals, startDate) из Google Sheets Goals.
 * Запуск: node backfill-client-profile.js (из папки supabase/scripts)
 * Требует: .env, config.json, GOOGLE_APPLICATION_CREDENTIALS.
 *
 * config.json может содержать clientSpreadsheets: { "clientId": "spreadsheetId" }
 * или скрипт читает Clients с master и берёт spreadsheetId оттуда.
 */
import { config } from 'dotenv';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';
import { readFileSync, existsSync } from 'fs';
import { getSheetData, findColumns } from './lib/sheets.js';
import { getSupabase } from './lib/supabase.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
config({ path: resolve(__dirname, '../.env') });

function loadConfig() {
  const path = resolve(__dirname, 'config.json');
  if (!existsSync(path)) throw new Error('config.json не найден');
  return JSON.parse(readFileSync(path, 'utf8'));
}

async function main() {
  const cfg = loadConfig();
  const masterId = cfg.coachMasterSpreadsheetId;
  const supabase = getSupabase();

  const { data: clients } = await supabase.from('clients').select('id, name');
  if (!clients?.length) {
    console.log('Нет клиентов в Supabase.');
    return;
  }

  const clientToSpreadsheet = {};
  if (cfg.clientSpreadsheets && typeof cfg.clientSpreadsheets === 'object') {
    Object.assign(clientToSpreadsheet, cfg.clientSpreadsheets);
  }
  if (masterId && (!cfg.clientSpreadsheets || Object.keys(cfg.clientSpreadsheets || {}).length === 0)) {
    const rows = await getSheetData(masterId, 'Clients');
    if (rows.length >= 2) {
      const headers = rows[0].map(h => String(h).toLowerCase().trim());
      const cols = findColumns(headers, { id: ['id'], name: ['name'], spreadsheetId: ['spreadsheetid'] });
      for (let i = 1; i < rows.length; i++) {
        const id = cols.id >= 0 ? String(rows[i][cols.id] || '').trim() : '';
        const name = cols.name >= 0 ? String(rows[i][cols.name] || '').trim() : '';
        const ssId = cols.spreadsheetId >= 0 ? String(rows[i][cols.spreadsheetId] || '').trim() : '';
        if (ssId) {
          if (id) clientToSpreadsheet[id] = ssId;
          if (name) clientToSpreadsheet[name] = ssId;
        }
      }
    }
  }

  let updated = 0;
  for (const client of clients) {
    const ssId = clientToSpreadsheet[client.name] || clientToSpreadsheet[client.id] || Object.entries(clientToSpreadsheet).find(([k]) => client.name.toLowerCase().includes(k.toLowerCase()))?.[1];
    if (!ssId) continue;

    try {
      const goalsRows = await getSheetData(ssId, 'Goals');
      if (goalsRows.length < 2) continue;

      const headers = goalsRows[0].map(h => String(h).toLowerCase().trim());
      const cols = findColumns(headers, {
        key: ['key'],
        value: ['value'],
        start_weight: ['start_weight', 'start weight'],
        current_weight: ['current_weight', 'current weight'],
      });

      const goalsMap = {};
      for (let i = 1; i < goalsRows.length; i++) {
        const row = goalsRows[i];
        const key = cols.key >= 0 ? String(row[cols.key] || '').toLowerCase().trim() : '';
        const val = cols.value >= 0 ? row[cols.value] : '';
        if (key) goalsMap[key] = val;
      }

      const weight = parseFloat(goalsMap.start_weight || goalsMap.current_weight || goalsMap.weight || 0) || null;
      const startDate = goalsMap.start_date || goalsMap.startdate || null;
      const mainGoals = goalsMap.main_goals || goalsMap.mainGoals || null;

      if (!weight && !startDate && !mainGoals) continue;

      const profile = {};
      if (weight) profile.weight = weight;
      if (startDate) profile.startDate = startDate;
      if (mainGoals) profile.mainGoals = mainGoals;

      const { data: existing } = await supabase.from('clients').select('profile').eq('id', client.id).single();
      const merged = { ...(existing?.profile || {}), ...profile };

      const { error } = await supabase.from('clients').update({ profile: merged }).eq('id', client.id);
      if (!error) {
        updated++;
        console.log(`OK ${client.name}: weight=${weight || '-'} startDate=${startDate || '-'}`);
      } else {
        console.warn(`ERR ${client.name}:`, error.message);
      }
    } catch (e) {
      console.warn(`Skip ${client.name} (${ssId}):`, e.message);
    }
  }

  console.log(`Обновлено: ${updated} клиентов`);
}

main().catch(console.error);
