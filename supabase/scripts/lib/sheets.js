/**
 * Чтение данных из Google Sheets через API.
 * Требует GOOGLE_APPLICATION_CREDENTIALS и включённый Google Sheets API.
 */
import { google } from 'googleapis';
import { readFileSync } from 'fs';
import { resolve } from 'path';

let auth = null;

function getAuth() {
  if (auth) return auth;
  const keyPath = process.env.GOOGLE_APPLICATION_CREDENTIALS;
  if (!keyPath) throw new Error('GOOGLE_APPLICATION_CREDENTIALS не задан');
  const key = JSON.parse(readFileSync(resolve(keyPath), 'utf8'));
  auth = new google.auth.GoogleAuth({
    credentials: key,
    scopes: ['https://www.googleapis.com/auth/spreadsheets.readonly'],
  });
  return auth;
}

const SESSION_SHEET_NAMES = ['WorkoutSessions', 'Workout Sessions', 'Тренировки', 'Сессии', 'Sessions'];

/**
 * Находит имя листа сессий в таблице (поддерживает разные названия).
 * @param {string} spreadsheetId
 * @returns {Promise<string|null>} имя листа или null
 */
export async function findSessionSheetName(spreadsheetId) {
  const authClient = await getAuth().getClient();
  const sheets = google.sheets({ version: 'v4', auth: authClient });
  const meta = await sheets.spreadsheets.get({ spreadsheetId });
  const titles = (meta.data.sheets || []).map(s => (s.properties?.title || '').trim());
  for (const want of SESSION_SHEET_NAMES) {
    const found = titles.find(t => t.toLowerCase() === want.toLowerCase());
    if (found) return found;
  }
  return titles.find(t => /workout|session|тренир|сесси/i.test(t)) || null;
}

/**
 * Читает лист сессий, пробуя разные названия при ошибке.
 * @param {string} spreadsheetId
 * @returns {Promise<Array<Array>>} строки листа
 */
export async function getSessionSheetData(spreadsheetId) {
  try {
    return await getSheetData(spreadsheetId, 'WorkoutSessions');
  } catch (e) {
    const name = await findSessionSheetName(spreadsheetId);
    if (name) return await getSheetData(spreadsheetId, name);
    throw e;
  }
}

/**
 * Возвращает все строки листа (первая строка — заголовки).
 * @param {string} spreadsheetId — ID таблицы
 * @param {string} sheetName — имя листа (например 'Clients', 'exercises_master')
 * @returns {Promise<Array<Array>>} [headers, ...rows]
 */
export async function getSheetData(spreadsheetId, sheetName) {
  const authClient = await getAuth().getClient();
  const sheets = google.sheets({ version: 'v4', auth: authClient });
  const res = await sheets.spreadsheets.values.get({
    spreadsheetId,
    range: `'${sheetName}'`,
  });
  const rows = res.data.values || [];
  if (rows.length === 0) return [];
  return rows;
}

/**
 * Найти индексы колонок по возможным названиям (как findColumns в GAS).
 * @param {Array<string>} headers — строка заголовков (приведённых к нижнему регистру)
 * @param {Record<string, string[]>} map — { key: ['name1', 'name2'] }
 * @returns {Record<string, number>} { key: index или -1 }
 */
export function findColumns(headers, map) {
  const out = {};
  for (const [key, names] of Object.entries(map)) {
    let idx = -1;
    for (const n of names) {
      idx = headers.findIndex((h) => String(h).toLowerCase().trim().includes(n.toLowerCase()));
      if (idx >= 0) break;
    }
    out[key] = idx;
  }
  return out;
}

/**
 * Форматирование даты в YYYY-MM-DD.
 */
export function formatDate(val) {
  if (!val) return null;
  if (typeof val === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(val)) return val;
  const d = val instanceof Date ? val : new Date(val);
  if (isNaN(d.getTime())) return null;
  return d.toISOString().slice(0, 10);
}
