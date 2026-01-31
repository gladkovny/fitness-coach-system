/**
 * ═══════════════════════════════════════════════════════════════
 * FITNESS COACH SYSTEM v4.4
 * ═══════════════════════════════════════════════════════════════
 * 
 * Универсальная система для фитнес-тренеров
 * 
 * ИЗМЕНЕНИЯ v4.4:
 * - ✅ Новый лист WeeklyStats: автоматическое сохранение недельной статистики
 * - ✅ Новый лист ProgressSnapshots: замеры тела и фото
 * - ✅ Новый лист ExerciseProgress: прогресс по упражнениям (1RM, объёмы)
 * - ✅ Новые endpoints: getWeeklyStats, saveWeeklyStats
 * - ✅ Новые endpoints: getProgressSnapshots, saveProgressSnapshot
 * - ✅ Новые endpoints: getExerciseProgress, saveExerciseProgress
 * - ✅ Функция calculateWeekStats: автоматический расчёт статистики недели
 * 
 * ИЗМЕНЕНИЯ v4.3:
 * - findColumns возвращает -1 для ненайденных колонок
 * - saveDaily/saveActualNutrition проверяют cols >= 0
 * 
 * ═══════════════════════════════════════════════════════════════
 */

// ════════════════════════════════════════════════════════════════
// HTTP ЗАПРОСЫ
// ════════════════════════════════════════════════════════════════

function doGet(e) {
  try {
    const action = e.parameter.action;
    const clientId = e.parameter.clientId;
    const weekNumber = e.parameter.weekNumber;
    
    let result;
    
    switch(action) {
      case 'getClients':
        result = getClients();
        break;
      case 'getGoals':
        result = getGoals(clientId);
        break;
      case 'getNutrition':
        result = getNutrition(clientId);
        break;
      case 'getQuotes':
        result = getQuotes(clientId);
        break;
      case 'getDaily':
        result = getDaily(clientId);
        break;
      case 'getSettings':
        result = getSettings(clientId);
        break;
      case 'getActualNutrition':
        result = getActualNutrition(clientId);
        break;
      case 'getWorkouts':
        result = getWorkouts(clientId);
        break;
      case 'getAllData':
        result = getAllData(clientId);
        break;
      // V4.4: Новые endpoints
      case 'getWeeklyStats':
        result = getWeeklyStats(clientId, weekNumber);
        break;
      case 'getProgressSnapshots':
        result = getProgressSnapshots(clientId);
        break;
      case 'getExerciseProgress':
        result = getExerciseProgress(clientId);
        break;
      case 'calculateWeekStats':
        result = calculateWeekStats(clientId, parseInt(weekNumber) || null);
        break;
      default:
        result = { 
          error: 'Unknown action: ' + action,
          version: '4.4',
          availableActions: [
            'getClients', 'getGoals', 'getNutrition', 'getQuotes', 'getDaily', 
            'getSettings', 'getActualNutrition', 'getWorkouts', 'getAllData',
            'getWeeklyStats', 'getProgressSnapshots', 'getExerciseProgress', 'calculateWeekStats'
          ]
        };
    }
    
    return jsonResponse(result);
    
  } catch (error) {
    return jsonResponse({ error: error.toString() });
  }
}

function doPost(e) {
  try {
    const data = JSON.parse(e.postData.contents);
    const action = data.action;
    const clientId = data.clientId;
    
    let result;
    
    switch(action) {
      case 'saveDaily':
        result = saveDaily(clientId, data);
        break;
      case 'saveActualNutrition':
        result = saveActualNutrition(clientId, data);
        break;
      case 'saveWorkout':
        result = saveWorkout(clientId, data);
        break;
      // V4.4: Новые endpoints
      case 'saveWeeklyStats':
        result = saveWeeklyStats(clientId, data);
        break;
      case 'saveProgressSnapshot':
        result = saveProgressSnapshot(clientId, data);
        break;
      case 'saveExerciseProgress':
        result = saveExerciseProgress(clientId, data);
        break;
      case 'finalizeWeek':
        result = finalizeWeek(clientId, data.weekNumber);
        break;
      default:
        result = { error: 'Unknown action: ' + action };
    }
    
    return jsonResponse(result);
    
  } catch (error) {
    return jsonResponse({ error: error.toString() });
  }
}

function jsonResponse(data) {
  return ContentService
    .createTextOutput(JSON.stringify(data))
    .setMimeType(ContentService.MimeType.JSON);
}

// ════════════════════════════════════════════════════════════════
// КЛИЕНТЫ
// ════════════════════════════════════════════════════════════════

function getClients() {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('Clients');
  
  if (!sheet) {
    return { clients: [], error: 'Лист "Clients" не найден' };
  }
  
  const data = sheet.getDataRange().getValues();
  const headers = data[0].map(h => String(h).toLowerCase().trim());
  
  const idCol = Math.max(0, headers.indexOf('id'));
  const nameCol = Math.max(1, headers.indexOf('name'));
  const ssIdCol = Math.max(2, headers.indexOf('spreadsheetid'));
  const typeCol = headers.indexOf('clienttype');
  const statusCol = headers.indexOf('status');
  
  const clients = [];
  
  for (let i = 1; i < data.length; i++) {
    const row = data[i];
    const id = row[idCol];
    const status = statusCol >= 0 ? row[statusCol] : 'active';
    
    if (id && status === 'active') {
      clients.push({
        id: String(id),
        name: row[nameCol] || '',
        spreadsheetId: row[ssIdCol] || '',
        clientType: typeCol >= 0 ? (row[typeCol] || 'online') : 'online',
        status: status
      });
    }
  }
  
  return { clients };
}

function getClientSpreadsheet(clientId) {
  if (!clientId || clientId === 'undefined' || clientId === 'null') {
    return SpreadsheetApp.getActiveSpreadsheet();
  }
  
  const { clients } = getClients();
  const client = clients.find(c => String(c.id) === String(clientId));
  
  if (!client) throw new Error('Клиент не найден: ' + clientId);
  if (!client.spreadsheetId) throw new Error('Таблица клиента не настроена: ' + clientId);
  
  return SpreadsheetApp.openById(client.spreadsheetId);
}

// ════════════════════════════════════════════════════════════════
// ПОЛУЧЕНИЕ ДАННЫХ (базовые)
// ════════════════════════════════════════════════════════════════

function getGoals(clientId) {
  try {
    const ss = getClientSpreadsheet(clientId);
    const sheet = ss.getSheetByName('Goals');
    
    if (!sheet) return { error: 'Лист Goals не найден' };
    
    const data = sheet.getDataRange().getValues();
    const headers = data[0];
    
    const cols = findColumns(headers, {
      key: ['key', 'параметр', 'название', 'name'],
      value: ['value', 'значение', 'val']
    });
    
    const goals = {};
    const keyCol = cols.key >= 0 ? cols.key : 0;
    const valueCol = cols.value >= 0 ? cols.value : 1;
    
    for (let i = 0; i < data.length; i++) {
      const key = data[i][keyCol];
      const value = data[i][valueCol];
      if (key && key !== 'key' && key !== 'параметр') {
        goals[key] = value;
      }
    }
    
    // Алиасы для совместимости
    if (goals.program_goal_weight && !goals.target_weight) goals.target_weight = goals.program_goal_weight;
    if (goals.target_weight && !goals.program_goal_weight) goals.program_goal_weight = goals.target_weight;
    if (goals.program_duration && !goals.program_duration_days) goals.program_duration_days = goals.program_duration;
    if (goals.program_duration_days && !goals.program_duration) goals.program_duration = goals.program_duration_days;
    if (goals.program_goal_workouts && !goals.workouts_goal) goals.workouts_goal = goals.program_goal_workouts;
    if (goals.goal_pullups && !goals.pullups_goal) goals.pullups_goal = goals.goal_pullups;
    if (goals.goal_bench && !goals.bench_goal) goals.bench_goal = goals.goal_bench;
    
    return goals;
  } catch (error) {
    return { error: error.toString() };
  }
}

function getNutrition(clientId) {
  try {
    const goals = getGoals(clientId);
    if (goals.error) return goals;
    
    const weight = parseFloat(goals.start_weight) || parseFloat(goals.current_weight) || 100;
    const height = parseFloat(goals.height) || 175;
    const gender = goals.gender || 'male';
    const activityLevel = parseFloat(goals.activity_level) || 1.55;
    const deficitPercent = parseFloat(goals.deficit_percent) || 20;
    const proteinPerKg = parseFloat(goals.protein_per_kg) || 1.8;
    const fatPerKg = parseFloat(goals.fat_per_kg) || 0.9;
    
    let age = 30;
    if (goals.birth_date) {
      const birthDate = parseDate(goals.birth_date);
      if (birthDate) {
        const today = new Date();
        age = today.getFullYear() - birthDate.getFullYear();
        const monthDiff = today.getMonth() - birthDate.getMonth();
        if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
          age--;
        }
      }
    }
    
    let bmr;
    if (gender === 'female') {
      bmr = 10 * weight + 6.25 * height - 5 * age - 161;
    } else {
      bmr = 10 * weight + 6.25 * height - 5 * age + 5;
    }
    
    const tdee = Math.round(bmr * activityLevel);
    const targetCalories = Math.round(tdee * (1 - deficitPercent / 100));
    
    const protein = Math.round(weight * proteinPerKg);
    const fats = Math.round(weight * fatPerKg);
    const proteinCalories = protein * 4;
    const fatCalories = fats * 9;
    const carbCalories = targetCalories - proteinCalories - fatCalories;
    const carbs = Math.round(Math.max(0, carbCalories / 4));
    
    const heightM = height / 100;
    const bmi = weight / (heightM * heightM);
    
    return {
      targetCalories, protein, fat: fats, fats, carbs,
      bmr: Math.round(bmr), tdee, deficit: tdee - targetCalories,
      bmi: Math.round(bmi * 10) / 10,
      weight, height, age, gender, activityLevel, deficitPercent, proteinPerKg, fatPerKg,
      calculatedAt: new Date().toISOString(),
      source: 'calculated_from_goals'
    };
  } catch (error) {
    return { error: error.toString() };
  }
}

function getQuotes(clientId) {
  try {
    const ss = getClientSpreadsheet(clientId);
    const sheet = ss.getSheetByName('Quotes');
    
    if (!sheet) return { quotes: [] };
    
    const data = sheet.getDataRange().getValues();
    if (data.length <= 1) return { quotes: [] };
    
    const headers = data[0].map(h => String(h).toLowerCase().trim());
    
    let quoteCol = headers.indexOf('quote');
    if (quoteCol < 0) quoteCol = headers.indexOf('цитата');
    if (quoteCol < 0) quoteCol = 1;
    
    let categoryCol = headers.indexOf('category');
    if (categoryCol < 0) categoryCol = 2;
    
    const quotes = [];
    
    for (let i = 1; i < data.length; i++) {
      const row = data[i];
      const quoteText = row[quoteCol];
      if (quoteText) {
        quotes.push({
          id: row[0],
          quote: quoteText,
          category: row[categoryCol] || 'motivation'
        });
      }
    }
    
    return { quotes };
  } catch (error) {
    return { quotes: [], error: error.toString() };
  }
}

function getDaily(clientId) {
  try {
    const ss = getClientSpreadsheet(clientId);
    const sheet = ss.getSheetByName('Daily');
    
    if (!sheet) return { dailyData: {} };
    
    const data = sheet.getDataRange().getValues();
    const headers = data[0];
    const dailyData = {};
    
    const cols = findColumns(headers, {
      date: ['date', 'дата'],
      nutrition: ['nutrition', 'питание'],
      wakeTime: ['waketime', 'время пробуждения'],
      sleepTime: ['sleeptime', 'время засыпания'],
      sleepHours: ['sleephours', 'sleep', 'часы сна'],
      trainingDone: ['trainingdone', 'тренировка'],
      trainingType: ['trainingtype', 'тип тренировки'],
      weight: ['weight', 'вес'],
      pullups: ['pullups', 'подтягивания'],
      bench: ['bench', 'жим'],
      notes: ['notes', 'заметки']
    });
    
    if (cols.date < 0) return { dailyData: {}, error: 'Колонка Date не найдена' };
    
    for (let i = 1; i < data.length; i++) {
      const row = data[i];
      let dateKey = row[cols.date];
      
      if (!dateKey) continue;
      
      if (dateKey instanceof Date) {
        dateKey = Utilities.formatDate(dateKey, Session.getScriptTimeZone(), 'yyyy-MM-dd');
      }
      
      dailyData[String(dateKey)] = {
        date: String(dateKey),
        nutrition: cols.nutrition >= 0 ? (row[cols.nutrition] || '') : '',
        wakeTime: cols.wakeTime >= 0 ? (row[cols.wakeTime] || '') : '',
        sleepTime: cols.sleepTime >= 0 ? (row[cols.sleepTime] || '') : '',
        sleepHours: cols.sleepHours >= 0 ? (row[cols.sleepHours] || '') : '',
        sleep: cols.sleepHours >= 0 ? (row[cols.sleepHours] || '') : '',
        trainingDone: cols.trainingDone >= 0 ? (row[cols.trainingDone] || '') : '',
        trainingType: cols.trainingType >= 0 ? (row[cols.trainingType] || '') : '',
        weight: cols.weight >= 0 ? (row[cols.weight] || '') : '',
        pullups: cols.pullups >= 0 ? (row[cols.pullups] || '') : '',
        bench: cols.bench >= 0 ? (row[cols.bench] || '') : '',
        notes: cols.notes >= 0 ? (row[cols.notes] || '') : ''
      };
    }
    
    return { dailyData };
  } catch (error) {
    return { dailyData: {}, error: error.toString() };
  }
}

function getSettings(clientId) {
  try {
    const ss = getClientSpreadsheet(clientId);
    const sheet = ss.getSheetByName('Settings');
    
    if (!sheet) return { settings: {} };
    
    const data = sheet.getDataRange().getValues();
    const settings = {};
    
    for (let i = 1; i < data.length; i++) {
      const key = data[i][0];
      const value = data[i][1];
      if (key) settings[key] = value;
    }
    
    return { settings };
  } catch (error) {
    return { settings: {}, error: error.toString() };
  }
}

function getActualNutrition(clientId) {
  try {
    const ss = getClientSpreadsheet(clientId);
    const sheet = ss.getSheetByName('ActualNutrition');
    
    if (!sheet) return { success: false, data: null, message: 'Нет данных о питании' };
    
    const data = sheet.getDataRange().getValues();
    if (data.length <= 1) return { success: false, data: null, message: 'Нет записей' };
    
    const headers = data[0];
    const cols = findColumns(headers, {
      date: ['date', 'дата'],
      calories: ['calories', 'калории'],
      protein: ['protein', 'белок'],
      fats: ['fats', 'жиры'],
      carbs: ['carbs', 'углеводы'],
      notes: ['notes', 'заметки']
    });
    
    if (cols.date < 0 || cols.calories < 0) {
      return { success: false, data: null, message: 'Не найдены колонки Date или Calories' };
    }
    
    const dailyEntries = [];
    const allNotes = [];
    let totalCalories = 0, totalProtein = 0, totalFats = 0, totalCarbs = 0;
    let count = 0;
    let firstDate = '', lastDate = '';
    
    for (let i = 1; i < data.length; i++) {
      const row = data[i];
      const calories = parseFloat(row[cols.calories]) || 0;
      
      if (calories <= 0) continue;
      
      let dateValue = row[cols.date];
      if (dateValue instanceof Date) {
        dateValue = Utilities.formatDate(dateValue, Session.getScriptTimeZone(), 'dd.MM');
      }
      
      const noteText = cols.notes >= 0 && row[cols.notes] ? String(row[cols.notes]).trim() : '';
      
      const entry = {
        date: String(dateValue),
        calories: Math.round(calories),
        protein: cols.protein >= 0 ? Math.round(parseFloat(row[cols.protein]) || 0) : 0,
        fats: cols.fats >= 0 ? Math.round(parseFloat(row[cols.fats]) || 0) : 0,
        carbs: cols.carbs >= 0 ? Math.round(parseFloat(row[cols.carbs]) || 0) : 0,
        note: noteText
      };
      
      dailyEntries.push(entry);
      if (noteText) allNotes.push(noteText);
      
      totalCalories += entry.calories;
      totalProtein += entry.protein;
      totalFats += entry.fats;
      totalCarbs += entry.carbs;
      count++;
      
      if (!firstDate) firstDate = entry.date;
      lastDate = entry.date;
    }
    
    if (count === 0) return { success: false, data: null, message: 'Нет валидных записей' };
    
    return {
      success: true,
      data: {
        calories: Math.round(totalCalories / count),
        protein: Math.round(totalProtein / count),
        fats: Math.round(totalFats / count),
        carbs: Math.round(totalCarbs / count),
        daysCount: count,
        dateRange: firstDate === lastDate ? lastDate : `${firstDate} - ${lastDate}`,
        allNotes, dailyEntries,
        updatedBy: 'Coach', source: 'calculated', period: 'average'
      }
    };
  } catch (error) {
    return { success: false, data: null, error: error.toString() };
  }
}

function getWorkouts(clientId) {
  try {
    const ss = getClientSpreadsheet(clientId);
    const sheet = ss.getSheetByName('Workouts');
    
    if (!sheet) return { workoutHistory: [] };
    
    const data = sheet.getDataRange().getValues();
    if (data.length <= 1) return { workoutHistory: [] };
    
    const headers = data[0];
    const cols = findColumns(headers, {
      date: ['date', 'дата'],
      type: ['type', 'тип'],
      exercise: ['exercise', 'упражнение'],
      set: ['set', 'подход'],
      weight: ['weight', 'вес'],
      reps: ['reps', 'повторения'],
      tonnage: ['tonnage', 'тоннаж'],
      total: ['total', 'totaltonnage'],
      notes: ['notes'],
      comments: ['comments', 'комментарии']
    });
    
    if (cols.date < 0) return { workoutHistory: [], error: 'Колонка Date не найдена' };
    
    const workouts = {};
    
    for (let i = 1; i < data.length; i++) {
      const row = data[i];
      let dateVal = row[cols.date];
      if (!dateVal) continue;
      
      if (dateVal instanceof Date) {
        dateVal = Utilities.formatDate(dateVal, Session.getScriptTimeZone(), 'yyyy-MM-dd');
      }
      
      const type = cols.type >= 0 ? (row[cols.type] || 'A') : 'A';
      const key = `${dateVal}_${type}`;
      
      if (!workouts[key]) {
        workouts[key] = {
          date: String(dateVal),
          type,
          exercises: {},
          totalTonnage: cols.total >= 0 ? (parseFloat(row[cols.total]) || 0) : 0,
          comments: cols.comments >= 0 ? (row[cols.comments] || '') : ''
        };
      }
      
      const exName = cols.exercise >= 0 ? (row[cols.exercise] || '') : '';
      if (!exName || exName === 'Свободная') continue;
      
      if (!workouts[key].exercises[exName]) {
        workouts[key].exercises[exName] = { name: exName, sets: [], tonnage: 0 };
      }
      
      const weight = cols.weight >= 0 ? (parseFloat(row[cols.weight]) || 0) : 0;
      const reps = cols.reps >= 0 ? (parseInt(row[cols.reps]) || 0) : 0;
      const tonnage = cols.tonnage >= 0 ? (parseFloat(row[cols.tonnage]) || (weight * reps)) : (weight * reps);
      
      workouts[key].exercises[exName].sets.push({ weight, reps });
      workouts[key].exercises[exName].tonnage += tonnage;
    }
    
    const workoutHistory = Object.values(workouts).map(w => ({
      ...w,
      exercises: Object.values(w.exercises)
    }));
    
    return { workoutHistory };
  } catch (error) {
    return { workoutHistory: [], error: error.toString() };
  }
}

function getAllData(clientId) {
  const goals = getGoals(clientId);
  const nutrition = getNutrition(clientId);
  const daily = getDaily(clientId);
  const settings = getSettings(clientId);
  const actualNutrition = getActualNutrition(clientId);
  const workouts = getWorkouts(clientId);
  const quotes = getQuotes(clientId);
  const weeklyStats = getWeeklyStats(clientId);
  
  return {
    goals, nutrition, daily,
    dailyData: daily.dailyData,
    settings: settings.settings,
    actualNutrition: actualNutrition.success ? actualNutrition.data : null,
    workoutHistory: workouts.workoutHistory,
    quotes: quotes.quotes,
    weeklyStats: weeklyStats.stats || [],
    version: '4.4'
  };
}

// ════════════════════════════════════════════════════════════════
// V4.4: WEEKLY STATS — Недельная статистика
// ════════════════════════════════════════════════════════════════

/**
 * Получить недельную статистику
 * @param {string} clientId - ID клиента
 * @param {number} weekNumber - Номер недели (опционально, если не указан - все)
 */
function getWeeklyStats(clientId, weekNumber) {
  try {
    const ss = getClientSpreadsheet(clientId);
    let sheet = ss.getSheetByName('WeeklyStats');
    
    if (!sheet) {
      return { stats: [], message: 'Лист WeeklyStats не найден' };
    }
    
    const data = sheet.getDataRange().getValues();
    if (data.length <= 1) return { stats: [] };
    
    const headers = data[0];
    const cols = findColumns(headers, {
      weekNumber: ['week_number', 'weeknumber', 'week'],
      startDate: ['start_date', 'startdate'],
      endDate: ['end_date', 'enddate'],
      status: ['status'],
      daysTotal: ['days_total', 'daystotal'],
      daysLogged: ['days_logged', 'dayslogged'],
      complianceRate: ['compliance_rate', 'compliancerate'],
      nutritionIdeal: ['nutrition_ideal', 'nutritionideal'],
      nutritionNormal: ['nutrition_normal', 'nutritionnormal'],
      nutritionFail: ['nutrition_fail', 'nutritionfail'],
      nutritionQuality: ['nutrition_quality', 'nutritionquality'],
      workoutsCount: ['workouts_count', 'workoutscount'],
      tonnageTotal: ['tonnage_total', 'tonnagetotal'],
      tonnageAvg: ['tonnage_avg', 'tonnageavg'],
      weightStart: ['weight_start', 'weightstart'],
      weightEnd: ['weight_end', 'weightend'],
      weightChange: ['weight_change', 'weightchange'],
      sleepAvg: ['sleep_avg', 'sleepavg'],
      pullupsMax: ['pullups_max', 'pullupsmax'],
      benchMax: ['bench_max', 'benchmax'],
      notes: ['notes']
    });
    
    const stats = [];
    
    for (let i = 1; i < data.length; i++) {
      const row = data[i];
      const wn = cols.weekNumber >= 0 ? parseInt(row[cols.weekNumber]) : i;
      
      if (weekNumber && wn !== parseInt(weekNumber)) continue;
      
      stats.push({
        weekNumber: wn,
        startDate: cols.startDate >= 0 ? formatDateValue(row[cols.startDate]) : '',
        endDate: cols.endDate >= 0 ? formatDateValue(row[cols.endDate]) : '',
        status: cols.status >= 0 ? row[cols.status] : 'active',
        daysTotal: cols.daysTotal >= 0 ? parseInt(row[cols.daysTotal]) || 7 : 7,
        daysLogged: cols.daysLogged >= 0 ? parseInt(row[cols.daysLogged]) || 0 : 0,
        complianceRate: cols.complianceRate >= 0 ? parseFloat(row[cols.complianceRate]) || 0 : 0,
        nutrition: {
          ideal: cols.nutritionIdeal >= 0 ? parseInt(row[cols.nutritionIdeal]) || 0 : 0,
          normal: cols.nutritionNormal >= 0 ? parseInt(row[cols.nutritionNormal]) || 0 : 0,
          fail: cols.nutritionFail >= 0 ? parseInt(row[cols.nutritionFail]) || 0 : 0,
          quality: cols.nutritionQuality >= 0 ? parseFloat(row[cols.nutritionQuality]) || 0 : 0
        },
        workouts: {
          count: cols.workoutsCount >= 0 ? parseInt(row[cols.workoutsCount]) || 0 : 0,
          tonnageTotal: cols.tonnageTotal >= 0 ? parseFloat(row[cols.tonnageTotal]) || 0 : 0,
          tonnageAvg: cols.tonnageAvg >= 0 ? parseFloat(row[cols.tonnageAvg]) || 0 : 0
        },
        weight: {
          start: cols.weightStart >= 0 ? parseFloat(row[cols.weightStart]) || null : null,
          end: cols.weightEnd >= 0 ? parseFloat(row[cols.weightEnd]) || null : null,
          change: cols.weightChange >= 0 ? parseFloat(row[cols.weightChange]) || 0 : 0
        },
        sleepAvg: cols.sleepAvg >= 0 ? parseFloat(row[cols.sleepAvg]) || 0 : 0,
        pullupsMax: cols.pullupsMax >= 0 ? parseInt(row[cols.pullupsMax]) || 0 : 0,
        benchMax: cols.benchMax >= 0 ? parseFloat(row[cols.benchMax]) || 0 : 0,
        notes: cols.notes >= 0 ? row[cols.notes] || '' : ''
      });
    }
    
    return { stats };
  } catch (error) {
    return { stats: [], error: error.toString() };
  }
}

/**
 * Сохранить недельную статистику
 */
function saveWeeklyStats(clientId, data) {
  try {
    const ss = getClientSpreadsheet(clientId);
    let sheet = ss.getSheetByName('WeeklyStats');
    
    // Создаём лист если не существует
    if (!sheet) {
      sheet = ss.insertSheet('WeeklyStats');
      const headers = [
        'week_number', 'start_date', 'end_date', 'status',
        'days_total', 'days_logged', 'compliance_rate',
        'nutrition_ideal', 'nutrition_normal', 'nutrition_fail', 'nutrition_quality',
        'workouts_count', 'tonnage_total', 'tonnage_avg',
        'weight_start', 'weight_end', 'weight_change',
        'sleep_avg', 'pullups_max', 'bench_max', 'notes'
      ];
      sheet.appendRow(headers);
      sheet.getRange(1, 1, 1, headers.length).setFontWeight('bold').setBackground('#4a86e8').setFontColor('#ffffff');
      sheet.setFrozenRows(1);
    }
    
    const headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
    const cols = findColumns(headers, {
      weekNumber: ['week_number'],
      startDate: ['start_date'],
      endDate: ['end_date'],
      status: ['status'],
      daysTotal: ['days_total'],
      daysLogged: ['days_logged'],
      complianceRate: ['compliance_rate'],
      nutritionIdeal: ['nutrition_ideal'],
      nutritionNormal: ['nutrition_normal'],
      nutritionFail: ['nutrition_fail'],
      nutritionQuality: ['nutrition_quality'],
      workoutsCount: ['workouts_count'],
      tonnageTotal: ['tonnage_total'],
      tonnageAvg: ['tonnage_avg'],
      weightStart: ['weight_start'],
      weightEnd: ['weight_end'],
      weightChange: ['weight_change'],
      sleepAvg: ['sleep_avg'],
      pullupsMax: ['pullups_max'],
      benchMax: ['bench_max'],
      notes: ['notes']
    });
    
    // Ищем существующую строку для этой недели
    const allData = sheet.getDataRange().getValues();
    let rowIndex = -1;
    
    for (let i = 1; i < allData.length; i++) {
      if (parseInt(allData[i][cols.weekNumber]) === parseInt(data.weekNumber)) {
        rowIndex = i + 1;
        break;
      }
    }
    
    // Подготавливаем данные
    const rowData = new Array(headers.length).fill('');
    
    if (cols.weekNumber >= 0) rowData[cols.weekNumber] = data.weekNumber;
    if (cols.startDate >= 0) rowData[cols.startDate] = data.startDate || '';
    if (cols.endDate >= 0) rowData[cols.endDate] = data.endDate || '';
    if (cols.status >= 0) rowData[cols.status] = data.status || 'active';
    if (cols.daysTotal >= 0) rowData[cols.daysTotal] = data.daysTotal || 7;
    if (cols.daysLogged >= 0) rowData[cols.daysLogged] = data.daysLogged || 0;
    if (cols.complianceRate >= 0) rowData[cols.complianceRate] = data.complianceRate || 0;
    if (cols.nutritionIdeal >= 0) rowData[cols.nutritionIdeal] = data.nutrition?.ideal || 0;
    if (cols.nutritionNormal >= 0) rowData[cols.nutritionNormal] = data.nutrition?.normal || 0;
    if (cols.nutritionFail >= 0) rowData[cols.nutritionFail] = data.nutrition?.fail || 0;
    if (cols.nutritionQuality >= 0) rowData[cols.nutritionQuality] = data.nutrition?.quality || 0;
    if (cols.workoutsCount >= 0) rowData[cols.workoutsCount] = data.workouts?.count || 0;
    if (cols.tonnageTotal >= 0) rowData[cols.tonnageTotal] = data.workouts?.tonnageTotal || 0;
    if (cols.tonnageAvg >= 0) rowData[cols.tonnageAvg] = data.workouts?.tonnageAvg || 0;
    if (cols.weightStart >= 0) rowData[cols.weightStart] = data.weight?.start || '';
    if (cols.weightEnd >= 0) rowData[cols.weightEnd] = data.weight?.end || '';
    if (cols.weightChange >= 0) rowData[cols.weightChange] = data.weight?.change || 0;
    if (cols.sleepAvg >= 0) rowData[cols.sleepAvg] = data.sleepAvg || 0;
    if (cols.pullupsMax >= 0) rowData[cols.pullupsMax] = data.pullupsMax || 0;
    if (cols.benchMax >= 0) rowData[cols.benchMax] = data.benchMax || 0;
    if (cols.notes >= 0) rowData[cols.notes] = data.notes || '';
    
    if (rowIndex > 0) {
      sheet.getRange(rowIndex, 1, 1, headers.length).setValues([rowData]);
    } else {
      sheet.appendRow(rowData);
    }
    
    return { success: true, weekNumber: data.weekNumber };
  } catch (error) {
    return { success: false, error: error.toString() };
  }
}

/**
 * Автоматический расчёт статистики недели из Daily и Workouts
 */
function calculateWeekStats(clientId, weekNumber) {
  try {
    const goals = getGoals(clientId);
    const { dailyData } = getDaily(clientId);
    const { workoutHistory } = getWorkouts(clientId);
    
    // Получаем дату старта программы
    const startDateStr = goals.start_date || goals.program_start_date;
    let programStart;
    if (startDateStr) {
      programStart = parseDate(startDateStr);
    } else {
      const dates = Object.keys(dailyData || {}).map(d => parseDate(d)).filter(d => d);
      programStart = dates.length > 0 ? new Date(Math.min(...dates)) : new Date();
    }
    
    // Определяем какую неделю считать
    const today = new Date();
    const daysSinceStart = Math.floor((today - programStart) / (1000 * 60 * 60 * 24));
    const currentWeek = Math.floor(daysSinceStart / 7) + 1;
    const targetWeek = weekNumber || currentWeek;
    
    // Границы недели
    const weekStart = new Date(programStart);
    weekStart.setDate(weekStart.getDate() + (targetWeek - 1) * 7);
    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekEnd.getDate() + 6);
    
    // Собираем данные за неделю
    const weekData = {
      nutrition: { ideal: 0, normal: 0, fail: 0 },
      weights: [],
      sleepHours: [],
      pullups: [],
      bench: [],
      daysLogged: 0
    };
    
    // Данные из Daily
    Object.entries(dailyData || {}).forEach(([dateStr, data]) => {
      const date = parseDate(dateStr);
      if (!date || date < weekStart || date > weekEnd) return;
      
      weekData.daysLogged++;
      
      const nutr = String(data.nutrition || '').trim().toLowerCase();
      if (nutr === 'идеально') weekData.nutrition.ideal++;
      else if (nutr === 'норма') weekData.nutrition.normal++;
      else if (nutr === 'срыв') weekData.nutrition.fail++;
      
      if (data.weight && parseFloat(data.weight) > 0) {
        weekData.weights.push({ date, value: parseFloat(data.weight) });
      }
      
      const sleep = parseFloat(data.sleepHours || data.sleep);
      if (!isNaN(sleep) && sleep > 0) weekData.sleepHours.push(sleep);
      
      const pullups = parseInt(data.pullups);
      if (!isNaN(pullups) && pullups > 0) weekData.pullups.push(pullups);
      
      const bench = parseFloat(data.bench);
      if (!isNaN(bench) && bench > 0) weekData.bench.push(bench);
    });
    
    // Данные из Workouts
    let workoutsCount = 0;
    let tonnageTotal = 0;
    
    (workoutHistory || []).forEach(workout => {
      const date = parseDate(workout.date);
      if (!date || date < weekStart || date > weekEnd) return;
      
      workoutsCount++;
      
      if (workout.exercises) {
        workout.exercises.forEach(ex => {
          if (ex.tonnage) {
            tonnageTotal += parseFloat(ex.tonnage) || 0;
          } else if (ex.sets) {
            ex.sets.forEach(s => {
              tonnageTotal += (parseFloat(s.weight) || 0) * (parseInt(s.reps) || 0);
            });
          }
        });
      }
      if (tonnageTotal === 0 && workout.totalTonnage) {
        tonnageTotal += parseFloat(workout.totalTonnage) || 0;
      }
    });
    
    // Рассчитываем статистику
    const totalNutrDays = weekData.nutrition.ideal + weekData.nutrition.normal + weekData.nutrition.fail;
    const nutritionQuality = totalNutrDays > 0 
      ? Math.round(((weekData.nutrition.ideal + weekData.nutrition.normal) / totalNutrDays) * 100)
      : 0;
    
    // Сортируем веса по дате
    weekData.weights.sort((a, b) => a.date - b.date);
    const weightStart = weekData.weights.length > 0 ? weekData.weights[0].value : null;
    const weightEnd = weekData.weights.length > 0 ? weekData.weights[weekData.weights.length - 1].value : null;
    const weightChange = (weightStart && weightEnd) ? Math.round((weightEnd - weightStart) * 10) / 10 : 0;
    
    const sleepAvg = weekData.sleepHours.length > 0
      ? Math.round((weekData.sleepHours.reduce((a, b) => a + b, 0) / weekData.sleepHours.length) * 10) / 10
      : 0;
    
    const pullupsMax = weekData.pullups.length > 0 ? Math.max(...weekData.pullups) : 0;
    const benchMax = weekData.bench.length > 0 ? Math.max(...weekData.bench) : 0;
    
    const isCompleted = today > weekEnd;
    
    const stats = {
      weekNumber: targetWeek,
      startDate: formatDateISO(weekStart),
      endDate: formatDateISO(weekEnd),
      status: isCompleted ? 'completed' : 'active',
      daysTotal: 7,
      daysLogged: weekData.daysLogged,
      complianceRate: Math.round((weekData.daysLogged / 7) * 100),
      nutrition: {
        ideal: weekData.nutrition.ideal,
        normal: weekData.nutrition.normal,
        fail: weekData.nutrition.fail,
        quality: nutritionQuality
      },
      workouts: {
        count: workoutsCount,
        tonnageTotal: Math.round(tonnageTotal),
        tonnageAvg: workoutsCount > 0 ? Math.round(tonnageTotal / workoutsCount) : 0
      },
      weight: {
        start: weightStart,
        end: weightEnd,
        change: weightChange
      },
      sleepAvg,
      pullupsMax,
      benchMax,
      notes: ''
    };
    
    return { success: true, stats };
  } catch (error) {
    return { success: false, error: error.toString() };
  }
}

/**
 * Финализировать неделю: рассчитать и сохранить статистику
 */
function finalizeWeek(clientId, weekNumber) {
  try {
    // Рассчитываем статистику
    const { success, stats, error } = calculateWeekStats(clientId, weekNumber);
    
    if (!success) {
      return { success: false, error };
    }
    
    // Помечаем как завершённую
    stats.status = 'completed';
    
    // Сохраняем
    const saveResult = saveWeeklyStats(clientId, stats);
    
    return { 
      success: saveResult.success, 
      weekNumber: stats.weekNumber,
      stats,
      error: saveResult.error 
    };
  } catch (error) {
    return { success: false, error: error.toString() };
  }
}

// ════════════════════════════════════════════════════════════════
// V4.4: PROGRESS SNAPSHOTS — Замеры тела
// ════════════════════════════════════════════════════════════════

function getProgressSnapshots(clientId) {
  try {
    const ss = getClientSpreadsheet(clientId);
    const sheet = ss.getSheetByName('ProgressSnapshots');
    
    if (!sheet) return { snapshots: [] };
    
    const data = sheet.getDataRange().getValues();
    if (data.length <= 1) return { snapshots: [] };
    
    const headers = data[0];
    const cols = findColumns(headers, {
      date: ['date', 'дата'],
      weight: ['weight', 'вес'],
      bodyFat: ['body_fat', 'bodyfat', 'жир'],
      chest: ['chest', 'грудь'],
      waist: ['waist', 'талия'],
      hips: ['hips', 'бёдра', 'бедра'],
      arm: ['arm', 'рука', 'бицепс'],
      thigh: ['thigh', 'бедро'],
      photoFront: ['photo_front', 'фото_спереди'],
      photoSide: ['photo_side', 'фото_сбоку'],
      photoBack: ['photo_back', 'фото_сзади'],
      notes: ['notes', 'заметки']
    });
    
    const snapshots = [];
    
    for (let i = 1; i < data.length; i++) {
      const row = data[i];
      const dateVal = cols.date >= 0 ? row[cols.date] : null;
      if (!dateVal) continue;
      
      snapshots.push({
        date: formatDateValue(dateVal),
        weight: cols.weight >= 0 ? parseFloat(row[cols.weight]) || null : null,
        bodyFat: cols.bodyFat >= 0 ? parseFloat(row[cols.bodyFat]) || null : null,
        measurements: {
          chest: cols.chest >= 0 ? parseFloat(row[cols.chest]) || null : null,
          waist: cols.waist >= 0 ? parseFloat(row[cols.waist]) || null : null,
          hips: cols.hips >= 0 ? parseFloat(row[cols.hips]) || null : null,
          arm: cols.arm >= 0 ? parseFloat(row[cols.arm]) || null : null,
          thigh: cols.thigh >= 0 ? parseFloat(row[cols.thigh]) || null : null
        },
        photos: {
          front: cols.photoFront >= 0 ? row[cols.photoFront] || '' : '',
          side: cols.photoSide >= 0 ? row[cols.photoSide] || '' : '',
          back: cols.photoBack >= 0 ? row[cols.photoBack] || '' : ''
        },
        notes: cols.notes >= 0 ? row[cols.notes] || '' : ''
      });
    }
    
    return { snapshots };
  } catch (error) {
    return { snapshots: [], error: error.toString() };
  }
}

function saveProgressSnapshot(clientId, data) {
  try {
    const ss = getClientSpreadsheet(clientId);
    let sheet = ss.getSheetByName('ProgressSnapshots');
    
    if (!sheet) {
      sheet = ss.insertSheet('ProgressSnapshots');
      const headers = [
        'date', 'weight', 'body_fat',
        'chest', 'waist', 'hips', 'arm', 'thigh',
        'photo_front', 'photo_side', 'photo_back', 'notes'
      ];
      sheet.appendRow(headers);
      sheet.getRange(1, 1, 1, headers.length).setFontWeight('bold').setBackground('#9b59b6').setFontColor('#ffffff');
      sheet.setFrozenRows(1);
    }
    
    const rowData = [
      data.date || formatDateISO(new Date()),
      data.weight || '',
      data.bodyFat || '',
      data.measurements?.chest || '',
      data.measurements?.waist || '',
      data.measurements?.hips || '',
      data.measurements?.arm || '',
      data.measurements?.thigh || '',
      data.photos?.front || '',
      data.photos?.side || '',
      data.photos?.back || '',
      data.notes || ''
    ];
    
    sheet.appendRow(rowData);
    
    return { success: true };
  } catch (error) {
    return { success: false, error: error.toString() };
  }
}

// ════════════════════════════════════════════════════════════════
// V4.4: EXERCISE PROGRESS — Прогресс по упражнениям
// ════════════════════════════════════════════════════════════════

function getExerciseProgress(clientId) {
  try {
    const ss = getClientSpreadsheet(clientId);
    const sheet = ss.getSheetByName('ExerciseProgress');
    
    if (!sheet) return { progress: [] };
    
    const data = sheet.getDataRange().getValues();
    if (data.length <= 1) return { progress: [] };
    
    const headers = data[0];
    const cols = findColumns(headers, {
      date: ['date', 'дата'],
      exercise: ['exercise', 'упражнение'],
      weight1rm: ['weight_1rm', '1rm', 'максимум'],
      bestSet: ['best_set', 'лучший_подход'],
      totalVolume: ['total_volume', 'объём', 'volume'],
      notes: ['notes', 'заметки']
    });
    
    const progress = [];
    
    for (let i = 1; i < data.length; i++) {
      const row = data[i];
      const dateVal = cols.date >= 0 ? row[cols.date] : null;
      if (!dateVal) continue;
      
      progress.push({
        date: formatDateValue(dateVal),
        exercise: cols.exercise >= 0 ? row[cols.exercise] || '' : '',
        weight1rm: cols.weight1rm >= 0 ? parseFloat(row[cols.weight1rm]) || null : null,
        bestSet: cols.bestSet >= 0 ? row[cols.bestSet] || '' : '',
        totalVolume: cols.totalVolume >= 0 ? parseFloat(row[cols.totalVolume]) || null : null,
        notes: cols.notes >= 0 ? row[cols.notes] || '' : ''
      });
    }
    
    return { progress };
  } catch (error) {
    return { progress: [], error: error.toString() };
  }
}

function saveExerciseProgress(clientId, data) {
  try {
    const ss = getClientSpreadsheet(clientId);
    let sheet = ss.getSheetByName('ExerciseProgress');
    
    if (!sheet) {
      sheet = ss.insertSheet('ExerciseProgress');
      const headers = ['date', 'exercise', 'weight_1rm', 'best_set', 'total_volume', 'notes'];
      sheet.appendRow(headers);
      sheet.getRange(1, 1, 1, headers.length).setFontWeight('bold').setBackground('#e67e22').setFontColor('#ffffff');
      sheet.setFrozenRows(1);
    }
    
    const rowData = [
      data.date || formatDateISO(new Date()),
      data.exercise || '',
      data.weight1rm || '',
      data.bestSet || '',
      data.totalVolume || '',
      data.notes || ''
    ];
    
    sheet.appendRow(rowData);
    
    return { success: true };
  } catch (error) {
    return { success: false, error: error.toString() };
  }
}

// ════════════════════════════════════════════════════════════════
// СОХРАНЕНИЕ ДАННЫХ (базовые)
// ════════════════════════════════════════════════════════════════

function saveDaily(clientId, data) {
  try {
    const ss = getClientSpreadsheet(clientId);
    let sheet = ss.getSheetByName('Daily');
    
    if (!sheet) {
      sheet = ss.insertSheet('Daily');
      sheet.appendRow(['Date', 'Nutrition', 'WakeTime', 'SleepTime', 'Sleep', 'Weight', 'Pullups', 'Bench', 'Notes']);
      sheet.getRange(1, 1, 1, 9).setFontWeight('bold').setBackground('#4a86e8').setFontColor('#ffffff');
    }
    
    const headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
    const cols = findColumns(headers, {
      date: ['date', 'дата'],
      nutrition: ['nutrition', 'питание'],
      wakeTime: ['waketime'],
      sleepTime: ['sleeptime'],
      sleepHours: ['sleephours', 'sleep'],
      weight: ['weight', 'вес'],
      pullups: ['pullups'],
      bench: ['bench'],
      notes: ['notes']
    });
    
    if (cols.date < 0) {
      return { success: false, error: 'Колонка Date не найдена' };
    }
    
    const allData = sheet.getDataRange().getValues();
    let rowIndex = -1;
    
    for (let i = 1; i < allData.length; i++) {
      let existingDate = allData[i][cols.date];
      if (existingDate instanceof Date) {
        existingDate = Utilities.formatDate(existingDate, Session.getScriptTimeZone(), 'yyyy-MM-dd');
      }
      if (String(existingDate) === String(data.date)) {
        rowIndex = i + 1;
        break;
      }
    }
    
    const rowData = new Array(headers.length).fill('');
    rowData[cols.date] = data.date;
    
    if (data.nutrition && cols.nutrition >= 0) rowData[cols.nutrition] = data.nutrition;
    if (data.wakeTime && cols.wakeTime >= 0) rowData[cols.wakeTime] = data.wakeTime;
    if (data.sleepTime && cols.sleepTime >= 0) rowData[cols.sleepTime] = data.sleepTime;
    if ((data.sleepHours || data.sleep) && cols.sleepHours >= 0) rowData[cols.sleepHours] = data.sleepHours || data.sleep;
    if (data.weight && cols.weight >= 0) rowData[cols.weight] = data.weight;
    if (data.pullups && cols.pullups >= 0) rowData[cols.pullups] = data.pullups;
    if (data.bench && cols.bench >= 0) rowData[cols.bench] = data.bench;
    if (data.notes && cols.notes >= 0) rowData[cols.notes] = data.notes;
    
    if (rowIndex > 0) {
      const existingRow = sheet.getRange(rowIndex, 1, 1, headers.length).getValues()[0];
      for (let i = 0; i < rowData.length; i++) {
        if (rowData[i] === '' && existingRow[i] !== '') {
          rowData[i] = existingRow[i];
        }
      }
      sheet.getRange(rowIndex, 1, 1, headers.length).setValues([rowData]);
    } else {
      sheet.appendRow(rowData);
    }
    
    return { success: true };
  } catch (error) {
    return { success: false, error: error.toString() };
  }
}

function saveActualNutrition(clientId, data) {
  try {
    const ss = getClientSpreadsheet(clientId);
    let sheet = ss.getSheetByName('ActualNutrition');
    
    if (!sheet) {
      sheet = ss.insertSheet('ActualNutrition');
      sheet.appendRow(['Date', 'Calories', 'Protein', 'Fats', 'Carbs', 'Notes']);
      sheet.getRange(1, 1, 1, 6).setFontWeight('bold').setBackground('#6aa84f').setFontColor('#ffffff');
    }
    
    const headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
    const cols = findColumns(headers, {
      date: ['date'],
      calories: ['calories'],
      protein: ['protein'],
      fats: ['fats'],
      carbs: ['carbs'],
      notes: ['notes']
    });
    
    if (cols.date < 0 || cols.calories < 0) {
      return { success: false, error: 'Колонки Date/Calories не найдены' };
    }
    
    const allData = sheet.getDataRange().getValues();
    let rowIndex = -1;
    
    for (let i = 1; i < allData.length; i++) {
      let existingDate = allData[i][cols.date];
      if (existingDate instanceof Date) {
        existingDate = Utilities.formatDate(existingDate, Session.getScriptTimeZone(), 'yyyy-MM-dd');
      }
      if (String(existingDate) === String(data.date)) {
        rowIndex = i + 1;
        break;
      }
    }
    
    const rowData = new Array(headers.length).fill('');
    rowData[cols.date] = data.date;
    rowData[cols.calories] = data.calories || 0;
    if (cols.protein >= 0) rowData[cols.protein] = data.protein || 0;
    if (cols.fats >= 0) rowData[cols.fats] = data.fats || 0;
    if (cols.carbs >= 0) rowData[cols.carbs] = data.carbs || 0;
    if (cols.notes >= 0) rowData[cols.notes] = data.notes || '';
    
    if (rowIndex > 0) {
      sheet.getRange(rowIndex, 1, 1, headers.length).setValues([rowData]);
    } else {
      sheet.appendRow(rowData);
    }
    
    return { success: true };
  } catch (error) {
    return { success: false, error: error.toString() };
  }
}

function saveWorkout(clientId, data) {
  try {
    const ss = getClientSpreadsheet(clientId);
    let sheet = ss.getSheetByName('Workouts');
    
    if (!sheet) {
      sheet = ss.insertSheet('Workouts');
      sheet.appendRow(['Date', 'Type', 'Exercise', 'Set', 'Weight', 'Reps', 'Tonnage', 'Total', 'Notes', 'Comments']);
      sheet.getRange(1, 1, 1, 10).setFontWeight('bold').setBackground('#e69138').setFontColor('#ffffff');
    }
    
    const headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
    const cols = findColumns(headers, {
      date: ['date'],
      type: ['type'],
      exercise: ['exercise'],
      set: ['set'],
      weight: ['weight'],
      reps: ['reps'],
      tonnage: ['tonnage'],
      total: ['total'],
      notes: ['notes'],
      comments: ['comments']
    });
    
    function createRow(values) {
      const row = new Array(headers.length).fill('');
      for (const [key, val] of Object.entries(values)) {
        if (cols[key] !== undefined && cols[key] >= 0) {
          row[cols[key]] = val;
        }
      }
      return row;
    }
    
    const workout = data.workout || data;
    const date = workout.date || formatDateISO(new Date());
    const comments = workout.comments || '';
    
    if (workout.type === 'FREE' && workout.notes) {
      sheet.appendRow(createRow({
        date, type: 'FREE', exercise: 'Свободная',
        tonnage: 0, total: 0, notes: workout.notes, comments
      }));
    } else if (workout.exercises) {
      let first = true;
      workout.exercises.forEach(ex => {
        ex.sets.forEach((set, i) => {
          sheet.appendRow(createRow({
            date, type: workout.type, exercise: ex.name,
            set: i + 1, weight: set.weight, reps: set.reps,
            tonnage: set.weight * set.reps, total: workout.totalTonnage || 0,
            comments: first ? comments : ''
          }));
          first = false;
        });
      });
    }
    
    return { success: true };
  } catch (error) {
    return { success: false, error: error.toString() };
  }
}

// ════════════════════════════════════════════════════════════════
// УТИЛИТЫ
// ════════════════════════════════════════════════════════════════

function findColumns(headers, mapping) {
  const cols = {};
  
  for (const [key, names] of Object.entries(mapping)) {
    cols[key] = -1;
    
    for (let i = 0; i < headers.length; i++) {
      const header = String(headers[i]).toLowerCase().trim();
      if (names.some(n => header === n || header.includes(n))) {
        cols[key] = i;
        break;
      }
    }
  }
  
  return cols;
}

function parseDate(dateStr) {
  if (!dateStr) return null;
  if (dateStr instanceof Date) return dateStr;
  
  const str = String(dateStr).trim();
  
  // DD.MM.YYYY
  if (str.includes('.')) {
    const parts = str.split('.');
    if (parts.length === 3) {
      return new Date(parts[2], parts[1] - 1, parts[0]);
    }
  }
  
  // YYYY-MM-DD
  if (str.includes('-')) {
    const parts = str.split('-');
    if (parts.length === 3) {
      return new Date(parts[0], parts[1] - 1, parts[2]);
    }
  }
  
  return new Date(str);
}

function formatDateISO(date) {
  if (!date) return '';
  if (!(date instanceof Date)) date = new Date(date);
  
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  
  return `${year}-${month}-${day}`;
}

function formatDateValue(value) {
  if (!value) return '';
  if (value instanceof Date) {
    return formatDateISO(value);
  }
  return String(value);
}

// ════════════════════════════════════════════════════════════════
// НАСТРОЙКА (запустить один раз)
// ════════════════════════════════════════════════════════════════

function setupSystem() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  
  // Лист Clients
  let clientsSheet = ss.getSheetByName('Clients');
  if (!clientsSheet) {
    clientsSheet = ss.insertSheet('Clients');
    clientsSheet.appendRow(['id', 'name', 'spreadsheetId', 'clientType', 'status', 'startDate', 'notes']);
    clientsSheet.getRange(1, 1, 1, 7).setFontWeight('bold').setBackground('#4a86e8').setFontColor('#ffffff');
  }
  
  // Лист Settings
  let settingsSheet = ss.getSheetByName('Settings');
  if (!settingsSheet) {
    settingsSheet = ss.insertSheet('Settings');
    settingsSheet.appendRow(['key', 'value']);
    settingsSheet.getRange(1, 1, 1, 2).setFontWeight('bold').setBackground('#f1c232');
    settingsSheet.appendRow(['coachName', 'Ваше имя']);
    settingsSheet.appendRow(['systemVersion', '4.4']);
  }
  
  Logger.log('✅ Система настроена! Версия 4.4');
  Logger.log('');
  Logger.log('Новые листы: WeeklyStats, ProgressSnapshots, ExerciseProgress');
  Logger.log('Листы создаются автоматически при первом использовании');
}

/**
 * Настроить листы аналитики для клиента
 */
function setupAnalyticsSheets(clientId) {
  const ss = getClientSpreadsheet(clientId);
  
  // WeeklyStats
  if (!ss.getSheetByName('WeeklyStats')) {
    const sheet = ss.insertSheet('WeeklyStats');
    const headers = [
      'week_number', 'start_date', 'end_date', 'status',
      'days_total', 'days_logged', 'compliance_rate',
      'nutrition_ideal', 'nutrition_normal', 'nutrition_fail', 'nutrition_quality',
      'workouts_count', 'tonnage_total', 'tonnage_avg',
      'weight_start', 'weight_end', 'weight_change',
      'sleep_avg', 'pullups_max', 'bench_max', 'notes'
    ];
    sheet.appendRow(headers);
    sheet.getRange(1, 1, 1, headers.length).setFontWeight('bold').setBackground('#4a86e8').setFontColor('#ffffff');
    sheet.setFrozenRows(1);
  }
  
  // ProgressSnapshots
  if (!ss.getSheetByName('ProgressSnapshots')) {
    const sheet = ss.insertSheet('ProgressSnapshots');
    const headers = ['date', 'weight', 'body_fat', 'chest', 'waist', 'hips', 'arm', 'thigh', 'photo_front', 'photo_side', 'photo_back', 'notes'];
    sheet.appendRow(headers);
    sheet.getRange(1, 1, 1, headers.length).setFontWeight('bold').setBackground('#9b59b6').setFontColor('#ffffff');
    sheet.setFrozenRows(1);
  }
  
  // ExerciseProgress
  if (!ss.getSheetByName('ExerciseProgress')) {
    const sheet = ss.insertSheet('ExerciseProgress');
    const headers = ['date', 'exercise', 'weight_1rm', 'best_set', 'total_volume', 'notes'];
    sheet.appendRow(headers);
    sheet.getRange(1, 1, 1, headers.length).setFontWeight('bold').setBackground('#e67e22').setFontColor('#ffffff');
    sheet.setFrozenRows(1);
  }
  
  return { success: true, message: 'Листы аналитики созданы' };
}