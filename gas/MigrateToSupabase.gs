/**
 * Миграция данных из Google Sheets в Supabase прямо из GAS.
 * Не требует Google Cloud Console и номера телефона.
 *
 * Важно: этот файл должен быть в одном проекте с Master API_assessment.gs
 * (используются findColumns и formatDate оттуда).
 *
 * Настройка (один раз):
 * 1. Проект → Настройки проекта → Свойства скрипта:
 *    SUPABASE_URL = https://ТВОЙ_ПРОЕКТ.supabase.co
 *    SUPABASE_SERVICE_ROLE_KEY = твой service_role ключ
 *    MIGRATION_TRAINER_EMAIL = email тренера (строка в Clients с этим email → trainers)
 * 2. Запустить функцию migrateToSupabase() (Выполнить в редакторе).
 *
 * Ограничение: выполнение GAS до ~6 минут. При большом объёме можно по шагам:
 * migrateToSupabase('trainers'), затем 'clients', затем 'exercises', затем без аргумента.
 */

function getSupabaseConfig() {
  var url = PropertiesService.getScriptProperties().getProperty('SUPABASE_URL');
  var key = PropertiesService.getScriptProperties().getProperty('SUPABASE_SERVICE_ROLE_KEY');
  if (!url || !key) throw new Error('Задай SUPABASE_URL и SUPABASE_SERVICE_ROLE_KEY в Свойствах скрипта (Файл → Настройки проекта)');
  url = String(url).trim().replace(/\/$/, '');
  while (url.indexOf('https://https://') === 0) url = url.replace('https://https://', 'https://');
  while (url.indexOf('http://http://') === 0) url = url.replace('http://http://', 'http://');
  if (url.indexOf('https://') !== 0 && url.indexOf('http://') !== 0) url = 'https://' + url;
  url = url.replace(/\.supabase\.co\.supabase\.co/g, '.supabase.co');
  return { url: url, key: key };
}

function supabasePost(table, payload) {
  const { url, key } = getSupabaseConfig();
  const res = UrlFetchApp.fetch(url + '/rest/v1/' + table, {
    method: 'post',
    contentType: 'application/json',
    headers: {
      'apikey': key,
      'Authorization': 'Bearer ' + key,
      'Prefer': 'return=representation'
    },
    payload: JSON.stringify(payload),
    muteHttpExceptions: true
  });
  if (res.getResponseCode() >= 400) throw new Error(table + ': ' + res.getContentText());
  const json = JSON.parse(res.getContentText());
  return Array.isArray(json) ? json[0] : json;
}

function supabasePostMany(table, rows) {
  if (rows.length === 0) return [];
  const { url, key } = getSupabaseConfig();
  const res = UrlFetchApp.fetch(url + '/rest/v1/' + table, {
    method: 'post',
    contentType: 'application/json',
    headers: {
      'apikey': key,
      'Authorization': 'Bearer ' + key,
      'Prefer': 'return=representation'
    },
    payload: JSON.stringify(rows),
    muteHttpExceptions: true
  });
  if (res.getResponseCode() >= 400) throw new Error(table + ': ' + res.getContentText());
  return JSON.parse(res.getContentText());
}

/**
 * Запуск миграции. Без аргументов — полный перенос.
 * С аргументом: 'trainers' | 'exercises' | 'client:ID' для пошагового запуска.
 */
function migrateToSupabase(step) {
  const masterSS = SpreadsheetApp.getActiveSpreadsheet();
  const clientsSheet = masterSS.getSheetByName('Clients');
  if (!clientsSheet) throw new Error('Лист Clients не найден');

  const trainerEmail = (PropertiesService.getScriptProperties().getProperty('MIGRATION_TRAINER_EMAIL') || '').toLowerCase().trim();
  const data = clientsSheet.getDataRange().getValues();
  const headers = data[0].map(function(h) { return String(h).toLowerCase().trim(); });
  const cols = findColumns(headers, {
    id: ['id'],
    name: ['name', 'key'],
    email: ['email'],
    spreadsheetId: ['spreadsheetid'],
    clientType: ['clienttype', 'type'],
    status: ['status'],
    startDate: ['startdate'],
    notes: ['notes']
  });

  if (!step || step === 'trainers') {
    // 1) Тренер: по email, по пустому spreadsheetId или первая строка (запасной вариант)
    var trainerId = null;
    for (var i = 1; i < data.length; i++) {
      var row = data[i];
      var id = cols.id >= 0 ? String(row[cols.id] || '').trim() : '';
      var name = cols.name >= 0 ? String(row[cols.name] || '').trim() : '';
      var email = cols.email >= 0 ? String(row[cols.email] || '').trim() : '';
      var spreadsheetId = cols.spreadsheetId >= 0 ? String(row[cols.spreadsheetId] || '').trim() : '';
      var status = cols.status >= 0 ? String(row[cols.status] || 'active').toLowerCase() : 'active';
      if (status === 'archived' || status === 'deleted') continue;
      var isTrainer = (trainerEmail && email && email.toLowerCase() === trainerEmail) || (!spreadsheetId && name);
      if (isTrainer) {
        var tr = supabasePost('trainers', {
          email: email || (trainerEmail || ('trainer-' + (id || i) + '@local')),
          name: name || 'Trainer',
          subscription_plan: 'free'
        });
        trainerId = tr.id;
        CacheService.getScriptCache().put('migration_trainer_row_index', String(i), 3600);
        Logger.log('Тренер: ' + tr.email + ' -> ' + trainerId);
        break;
      }
    }
    // Запасной вариант: только строка БЕЗ spreadsheetId может быть тренером (у клиентов всегда есть своя таблица)
    if (!trainerId && data.length >= 2) {
      var row = data[1];
      var spreadsheetIdFirst = cols.spreadsheetId >= 0 ? String(row[cols.spreadsheetId] || '').trim() : '';
      if (spreadsheetIdFirst) {
        Logger.log('Запасной вариант: первая строка имеет spreadsheetId — это клиент. Добавь в Clients строку тренера без spreadsheetId или колонку email с MIGRATION_TRAINER_EMAIL.');
      } else {
        var id = cols.id >= 0 ? String(row[cols.id] || '').trim() : '';
        var name = cols.name >= 0 ? String(row[cols.name] || '').trim() : '';
        var status = cols.status >= 0 ? String(row[cols.status] || 'active').toLowerCase() : 'active';
        if (status !== 'archived' && status !== 'deleted') {
          var tr = supabasePost('trainers', {
            email: trainerEmail || ('trainer-' + (id || 1) + '@local'),
            name: name || 'Trainer',
            subscription_plan: 'free'
          });
          trainerId = tr.id;
          CacheService.getScriptCache().put('migration_trainer_row_index', '1', 3600);
          Logger.log('Тренер (первая строка без spreadsheetId): ' + tr.email + ' -> ' + trainerId);
        }
      }
    }
    if (!trainerId) throw new Error('Не найдена строка тренера. Укажи MIGRATION_TRAINER_EMAIL в свойствах скрипта и проверь лист Clients (хотя бы одна строка данных).');
  }

  if (!step || step === 'clients') {
    var trainerId = getFirstTrainerId();
    var trainerRowIndex = parseInt(CacheService.getScriptCache().get('migration_trainer_row_index') || '-1', 10);
    var clientIdToUuid = {};
    for (var i = 1; i < data.length; i++) {
      if (i === trainerRowIndex) continue;
      var row = data[i];
      var id = cols.id >= 0 ? String(row[cols.id] || '').trim() : '';
      var name = cols.name >= 0 ? String(row[cols.name] || '').trim() : '';
      var email = cols.email >= 0 ? String(row[cols.email] || '').trim() : '';
      var spreadsheetId = cols.spreadsheetId >= 0 ? String(row[cols.spreadsheetId] || '').trim() : '';
      var status = cols.status >= 0 ? String(row[cols.status] || 'active').toLowerCase() : 'active';
      if (status === 'archived' || status === 'deleted') continue;
      var isTrainer = (trainerEmail && email && email.toLowerCase() === trainerEmail) || (!spreadsheetId && name);
      if (isTrainer || !id) continue;
      var cr = supabasePost('clients', {
        trainer_id: trainerId,
        email: email || null,
        name: name || id,
        status: status === 'onboarding' ? 'onboarding' : 'active',
        profile: {}
      });
      clientIdToUuid[id] = cr.id;
    }
    CacheService.getScriptCache().put('migration_client_ids', JSON.stringify(clientIdToUuid), 3600);
    Logger.log('Клиенты: ' + Object.keys(clientIdToUuid).length);
    if (step === 'clients') return;
  }

  if (!step || step === 'exercises') {
    var exSheet = masterSS.getSheetByName('exercises_master');
    if (exSheet) {
      var exData = exSheet.getDataRange().getValues();
      if (exData.length >= 2) {
        var exH = exData[0].map(function(h) { return String(h).toLowerCase().trim(); });
        var exC = findColumns(exH, { id: ['id'], name: ['name'], category: ['category'], subcategory: ['subcategory'], equipment: ['equipment'], videoUrl: ['videourl', 'video'], laterality: ['laterality'] });
        var batch = [];
        for (var i = 1; i < exData.length; i++) {
          var r = exData[i];
          var name = exC.name >= 0 ? String(r[exC.name] || '') : '';
          if (!name) continue;
          batch.push({
            trainer_id: null,
            name: name,
            category: exC.category >= 0 ? String(r[exC.category] || '') : null,
            subcategory: exC.subcategory >= 0 ? String(r[exC.subcategory] || '') : null,
            equipment: exC.equipment >= 0 ? String(r[exC.equipment] || '') : null,
            video_url: exC.videoUrl >= 0 ? String(r[exC.videoUrl] || '') : null,
            laterality: exC.laterality >= 0 ? String(r[exC.laterality] || '') : null
          });
        }
        if (batch.length > 0) supabasePostMany('exercises', batch);
        Logger.log('Упражнения: ' + batch.length);
      }
    }
    if (step === 'exercises') return;
  }

  // По каждому клиенту: программы, блоки, сессии, подходы, daily
  var trainerId = getFirstTrainerId();
  var { clients } = getClients();
  for (var c = 0; c < clients.length; c++) {
    var client = clients[c];
    if (!client.spreadsheetId) continue;
    var clientUuid = getClientUuidByOldId(client.id);
    if (!clientUuid) continue;
    try {
      var ss = SpreadsheetApp.openById(client.spreadsheetId);
      var prog = supabasePost('programs', { trainer_id: trainerId, client_id: clientUuid, name: 'Program ' + client.id, type: 'online', status: 'active' });
      var programId = prog.id;
      var blockIdMap = {};
      var sheet = ss.getSheetByName('TrainingBlocks');
      if (sheet) {
        var tbData = sheet.getDataRange().getValues();
        if (tbData.length >= 2) {
          var tbH = tbData[0].map(function(h) { return String(h).toLowerCase().trim(); });
          var tbC = findColumns(tbH, { blockId: ['blockid', 'id'], name: ['name'], totalSessions: ['totalsessions', 'total'], usedSessions: ['usedsessions', 'used'], startDate: ['startdate', 'date'], status: ['status'] });
          for (var i = 1; i < tbData.length; i++) {
            var r = tbData[i];
            var oldBlockId = tbC.blockId >= 0 ? String(r[tbC.blockId] || '') : '';
            var bl = supabasePost('training_blocks', {
              program_id: programId,
              name: tbC.name >= 0 ? String(r[tbC.name] || '') : 'Block ' + i,
              total_sessions: tbC.totalSessions >= 0 ? (parseInt(r[tbC.totalSessions], 10) || 0) : 0,
              used_sessions: tbC.usedSessions >= 0 ? (parseInt(r[tbC.usedSessions], 10) || 0) : 0,
              start_date: tbC.startDate >= 0 ? formatDate(r[tbC.startDate]) : null,
              status: tbC.status >= 0 ? String(r[tbC.status] || 'active') : 'active'
            });
            if (oldBlockId) blockIdMap[oldBlockId] = bl.id;
          }
        }
      }
      sheet = ss.getSheetByName('WorkoutSessions');
      var sessionIdMap = {};
      if (sheet) {
        var wsData = sheet.getDataRange().getValues();
        if (wsData.length >= 2) {
          var wsH = wsData[0].map(function(h) { return String(h).toLowerCase().trim(); });
          var wsC = findColumns(wsH, { sessionId: ['sessionid', 'id'], date: ['date'], blockId: ['blockid'], type: ['type'], notes: ['notes'], totalVolume: ['totalvolume', 'volume'] });
          for (var i = 1; i < wsData.length; i++) {
            var r = wsData[i];
            var oldSessId = wsC.sessionId >= 0 ? String(r[wsC.sessionId] || '') : '';
            var date = formatDate(wsC.date >= 0 ? r[wsC.date] : null);
            if (!date) continue;
            var blockId = wsC.blockId >= 0 ? blockIdMap[String(r[wsC.blockId] || '')] : null;
            var sess = supabasePost('workout_sessions', {
              client_id: clientUuid,
              block_id: blockId || null,
              date: date,
              type: wsC.type >= 0 ? String(r[wsC.type] || '') : null,
              status: 'completed',
              notes: wsC.notes >= 0 ? String(r[wsC.notes] || '') : null,
              total_tonnage: wsC.totalVolume >= 0 ? (parseFloat(r[wsC.totalVolume]) || null) : null
            });
            if (oldSessId) sessionIdMap[oldSessId] = sess.id;
          }
        }
      }
      sheet = ss.getSheetByName('WorkoutLog');
      if (sheet) {
        var wlData = sheet.getDataRange().getValues();
        if (wlData.length >= 2) {
          var wlH = wlData[0].map(function(h) { return String(h).toLowerCase().trim(); });
          var wlC = findColumns(wlH, { sessionId: ['sessionid'], exerciseId: ['exerciseid'], exerciseName: ['exercisename', 'exercise', 'name'], setNumber: ['setnumber', 'set'], reps: ['reps'], weight: ['weight'], rpe: ['rpe', 'rating'] });
          for (var i = 1; i < wlData.length; i++) {
            var r = wlData[i];
            var sessionUuid = sessionIdMap[wlC.sessionId >= 0 ? String(r[wlC.sessionId] || '') : ''];
            if (!sessionUuid) continue;
            supabasePost('workout_sets', {
              session_id: sessionUuid,
              exercise_id: null,
              set_number: wlC.setNumber >= 0 ? (parseInt(r[wlC.setNumber], 10) || i) : i,
              reps: wlC.reps >= 0 ? (parseInt(r[wlC.reps], 10) || null) : null,
              weight: wlC.weight >= 0 ? (parseFloat(r[wlC.weight]) || null) : null,
              rpe: wlC.rpe >= 0 ? (parseInt(r[wlC.rpe], 10) || null) : null
            });
          }
        }
      }
      sheet = ss.getSheetByName('Daily');
      if (sheet) {
        var dData = sheet.getDataRange().getValues();
        if (dData.length >= 2) {
          var dH = dData[0].map(function(h) { return String(h).toLowerCase().trim(); });
          var dC = findColumns(dH, { date: ['date'], weight: ['weight'], sleepHours: ['sleephours', 'sleep'], nutrition: ['nutrition'], notes: ['notes'] });
          for (var i = 1; i < dData.length; i++) {
            var r = dData[i];
            var date = formatDate(dC.date >= 0 ? r[dC.date] : null);
            if (!date) continue;
            supabasePost('daily_logs', {
              client_id: clientUuid,
              date: date,
              weight: dC.weight >= 0 ? (parseFloat(r[dC.weight]) || null) : null,
              sleep_hours: dC.sleepHours >= 0 ? (parseFloat(r[dC.sleepHours]) || null) : null,
              nutrition: dC.nutrition >= 0 ? String(r[dC.nutrition] || '') : null,
              notes: dC.notes >= 0 ? String(r[dC.notes] || '') : null,
              source: 'manual'
            });
          }
        }
      }
      Logger.log('Клиент ' + client.id + ' перенесён.');
    } catch (e) {
      Logger.log('Клиент ' + client.id + ' ошибка: ' + e.message);
    }
  }
  Logger.log('Миграция завершена.');
}

function getFirstTrainerId() {
  var res = UrlFetchApp.fetch(getSupabaseConfig().url + '/rest/v1/trainers?select=id&limit=1', {
    headers: { 'apikey': getSupabaseConfig().key, 'Authorization': 'Bearer ' + getSupabaseConfig().key }
  });
  var arr = JSON.parse(res.getContentText());
  if (!arr || arr.length === 0) throw new Error('В Supabase нет тренера. Сначала запусти migrateToSupabase("trainers").');
  return arr[0].id;
}

function getClientUuidByOldId(oldId) {
  var cached = CacheService.getScriptCache().get('migration_client_ids');
  if (cached) {
    var map = JSON.parse(cached);
    return map[String(oldId)] || null;
  }
  return null;
}
