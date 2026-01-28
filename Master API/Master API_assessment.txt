/**
 * ================================================================
 * FITNESS COACH API v6.6.1 - FIXED ENCODING
 * ================================================================
 * 
 * Unified system for ALL client types:
 * - Online (Mark): Nutrition, weight, sleep, Daily tracking
 * - Offline (Yaroslav, Kirill): Gym workouts, sessions, blocks
 * - Hybrid: All combined
 * - AI Coach: Gemini with full client context
 * 
 * VERSION HISTORY:
 * v6.6.1 - [RU text]
 * v6.6 - Muscle coefficients system, exercises_master, normalized load
 * v6.5 - getDashboardRecentSessions with exercises, fixed V2 functions
 * v6.4 - Muscle heatmap coefficients, period filtering
 * v6.2 - Offline Dashboard endpoint, Muscle Heatmap
 * v6.1 - positionOptions in exercises, AI parser with equipment/position
 * v5.9 - Unified Tracker modules (saveDailyData, saveNutrition, etc.)
 * v5.3 - AI Coach with full context (history, records, analytics)
 * 
 * ================================================================
 */

const API_VERSION = '6.6.1';

// Gemini API Configuration
const GEMINI_API_KEY = 'AIzaSyBJhoEISKdt4V5gIzQ2liO5K1p7SxtoCjs';
const GEMINI_MODEL = 'gemini-2.0-flash';
const GEMINI_URL = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${GEMINI_API_KEY}`;

//
// HTTP HANDLERS
//

function doGet(e) {
  try {
    const action = e.parameter.action;
    const clientId = e.parameter.clientId;
    const params = e.parameter;
    
    //
    if (action === 'ping') {
      return jsonResponse({ ok: true, version: API_VERSION, timestamp: new Date().toISOString() });
    }
    if (action === 'getClients') {
      return jsonResponse(getClients());
    }
    if (action === 'getClientTypes') {
      return jsonResponse(getClientTypes());
    }
    
    //  ONLINE (Dashboard, Tracker) 
    if (action === 'getGoals') {
      return jsonResponse(getGoals(clientId));
    }
    if (action === 'getNutrition') {
      return jsonResponse(getNutrition(clientId));
    }
    if (action === 'getQuotes') {
      return jsonResponse(getQuotes(clientId));
    }
    if (action === 'getDaily') {
      return jsonResponse(getDaily(clientId));
    }
    if (action === 'getSettings') {
      return jsonResponse(getSettings(clientId));
    }
    if (action === 'getActualNutrition') {
      return jsonResponse(getActualNutrition(clientId));
    }
    if (action === 'getWorkouts') {
      return jsonResponse(getWorkouts(clientId));
    }
    if (action === 'getAllData') {
      return jsonResponse(getAllData(clientId));
    }
    
    //  OFFLINE (Workout Tracker) 
    if (action === 'getOfflineClients') {
      return jsonResponse(getOfflineClients());
    }
    if (action === 'getClientData') {
      return jsonResponse(getClientData(clientId));
    }
    if (action === 'getExercises') {
      return jsonResponse(getExercises(params.search, params.category, params.type));
    }
    if (action === 'getExerciseHistory') {
      return jsonResponse(getExerciseHistory(clientId, params.exerciseId, params.limit));
    }
    if (action === 'getRecentSessions') {
      return jsonResponse(getRecentSessions(clientId, params.limit));
    }
    if (action === 'getSessionDetails') {
      return jsonResponse(getSessionDetails(clientId, params.sessionId));
    }
    if (action === 'getMuscleStats') {
      return jsonResponse(getMuscleStats(clientId, params.sessionsBack));
    }
    if (action === 'getOfflineDashboard') {
      return jsonResponse(getOfflineDashboard(clientId));
    }
    if (action === 'getOfflineDashboardV2') {
      const period = e.parameter.period || 'block';
      return jsonResponse(getOfflineDashboardV2(clientId, period));
    }
    if (action === 'getMandatoryTasks') {
      return jsonResponse(getMandatoryTasks(clientId));
    }
    if (action === 'getTrainingBlocks') {
      return jsonResponse(getTrainingBlocks(clientId));
    }
    if (action === 'getClientProfile') {
      return jsonResponse(getClientProfile(clientId));
    }
    if (action === 'updateClientProfile') {
      return jsonResponse(updateClientProfile(clientId, params));
    }
    
    //  POST-LIKE via GET (  CORS) 
    if (action === 'startSession') {
      return jsonResponse(startSession(clientId, params));
    }
    if (action === 'addSet') {
      return jsonResponse(addSet(clientId, params));
    }
    if (action === 'removeSet') {
      return jsonResponse(removeSet(clientId, params.logId));
    }
    if (action === 'finishSession') {
      return jsonResponse(finishSession(clientId, params.sessionId, params));
    }
    if (action === 'addExercise') {
      return jsonResponse(addExercise(params));
    }
    if (action === 'updateBlock') {
      return jsonResponse(updateBlock(clientId, params.blockId, params));
    }
    if (action === 'createTrainingBlock') {
      return jsonResponse(createTrainingBlock(clientId, params));
    }
    if (action === 'completeBlock') {
      return jsonResponse(completeBlock(clientId, params.blockId));
    }
    if (action === 'updateMandatoryTasks') {
      return jsonResponse(updateMandatoryTasks(clientId, params.tasks, params.blockId));
    }
    if (action === 'completeMandatoryTasks') {
      return jsonResponse(completeMandatoryTasks(clientId, params));
    }
    
    //  UNIFIED TRACKER MODULES 
    if (action === 'saveDailyData') {
      return jsonResponse(saveDailyData(clientId, params));
    }
    if (action === 'saveNutrition') {
      return jsonResponse(saveNutritionData(clientId, params));
    }
    if (action === 'saveWarmup') {
      return jsonResponse(saveWarmup(clientId, params));
    }
    if (action === 'saveMeasurements') {
      return jsonResponse(saveMeasurements(clientId, params));
    }
    if (action === 'getLastDailyData') {
      return jsonResponse(getLastDailyData(clientId));
    }
    if (action === 'saveMandatoryTaskLog') {
      return jsonResponse(saveMandatoryTaskLog(clientId, params));
    }
    if (action === 'getWorkoutHistory') {
      return jsonResponse(getRecentSessions(clientId, params.limit || 10));
    }
    if (action === 'startWorkoutSession') {
      return jsonResponse(startSession(clientId, params));
    }
    if (action === 'endWorkoutSession') {
      return jsonResponse(finishSession(clientId, params.sessionId, params));
    }
    
    //  AI PARSER 
    if (action === 'parseWorkout') {
      return jsonResponse(parseWorkoutWithAI(params.text, params.exercisesList));
    }
    if (action === 'aiCoach') {
      return jsonResponse(aiCoachProcess(clientId, params.text));
    }
    if (action === 'getClientContext') {
      return jsonResponse(buildClientContext(clientId));
    }
    

    //  MUSCLE COEFFICIENTS SYSTEM (v6.6) 
    if (action === 'getExercisesMaster') {
      return jsonResponse(getExercisesMaster());
    }
    if (action === 'saveWorkoutWithCoeffs') {
      return jsonResponse(saveWorkoutWithCoeffs(clientId, params.workout));
    }
    if (action === 'getDashboardMuscleLoadGroupedV2') {
      return jsonResponse(getDashboardMuscleLoadGroupedV2(clientId, params.period || 'block'));
    }
    if (action === 'migrateWorkoutLogData') {
      return jsonResponse(migrateWorkoutLogData(clientId));
    }
    if (action === 'clearExercisesMasterCache') {
      return jsonResponse(clearExercisesMasterCache());
    }
    // === ASSESSMENT + SYNC ===
    if (action === 'updateNutrition') {
      return jsonResponse(updateNutrition(clientId, params.key, params.value));
    }
    if (action === 'syncBlockToMaster') {
      return jsonResponse(syncBlockToMaster(clientId));
    }
    if (action === 'syncAllBlocks') {
      return jsonResponse(syncAllBlocks());
    }
    
    //  UNKNOWN 
    return jsonResponse({
      error: 'Unknown action: ' + action,
      version: API_VERSION,
      availableActions: {
        general: ['ping', 'getClients', 'getClientTypes'],
        online: ['getGoals', 'getNutrition', 'getQuotes', 'getDaily', 'getSettings', 'getActualNutrition', 'getWorkouts', 'getAllData'],
        offline: ['getOfflineClients', 'getClientData', 'getClientProfile', 'updateClientProfile', 'getExercises', 'getExerciseHistory', 'getRecentSessions', 'getSessionDetails', 'getMuscleStats', 'getMandatoryTasks', 'getTrainingBlocks', 'getOfflineDashboard'],
        write: ['startSession', 'addSet', 'removeSet', 'finishSession', 'addExercise', 'updateBlock', 'completeMandatoryTasks'],
        ai: ['parseWorkout', 'aiCoach', 'getClientContext'],
        muscleSystem: ['getExercisesMaster', 'saveWorkoutWithCoeffs', 'getDashboardMuscleLoadGroupedV2', 'migrateWorkoutLogData', 'clearExercisesMasterCache']
      }
    });
    
  } catch (error) {
    return jsonResponse({ error: error.toString(), stack: error.stack });
  }
  /*
    // ASSESSMENT
    if (action === 'getAssessment') {
      return jsonResponse(getAssessment(clientId));
    }
    if (action === 'getAssessmentHistory') {
      return jsonResponse(getAssessmentHistory(clientId));
    }
    if (action === 'getAssessmentFields') {
      return jsonResponse(getAssessmentFields());
    }
*/
}

function doPost(e) {
  try {
    const data = JSON.parse(e.postData.contents);
    const action = data.action;
    const clientId = data.clientId;
    
    //  ONLINE 
    if (action === 'saveDaily') {
      return jsonResponse(saveDaily(clientId, data));
    }
    if (action === 'saveActualNutrition') {
      return jsonResponse(saveActualNutrition(clientId, data));
    }
    if (action === 'saveWorkout') {
      return jsonResponse(saveWorkout(clientId, data));
    }
    
    //  OFFLINE 
    if (action === 'addExercise') {
      return jsonResponse(addExercise(data));
    }
    if (action === 'startSession') {
      return jsonResponse(startSession(clientId, data));
    }
    if (action === 'addSet') {
      return jsonResponse(addSet(clientId, data));
    }
    if (action === 'removeSet') {
      return jsonResponse(removeSet(clientId, data.logId));
    }
    if (action === 'finishSession') {
      return jsonResponse(finishSession(clientId, data.sessionId, data));
    }
    if (action === 'deleteSession') {
      return jsonResponse(deleteSession(clientId, data.sessionId));
    }
    if (action === 'updateBlock') {
      return jsonResponse(updateBlock(clientId, data.blockId, data));
    }
    // === ASSESSMENT + SYNC ===
    if (action === 'updateNutrition') {
      return jsonResponse(updateNutrition(clientId, data.key, data.value));
    }
    if (action === 'updateClientStatus') {
      return jsonResponse(updateClientStatus(clientId, data.status));
    }
    if (action === 'updateSession') {
      return jsonResponse(updateSession(clientId, data.sessionId, data));
    }
    if (action === 'updateClientProfile') {
      return jsonResponse(updateClientProfile(clientId, data.updates));
    }
    
    return jsonResponse({ error: 'Unknown action: ' + action });
    
  } catch (error) {
    return jsonResponse({ error: error.toString(), stack: error.stack });
  }
  /*
    // ASSESSMENT
    if (action === 'saveAssessment') {
      return jsonResponse(saveAssessment(clientId, data));
    }
    if (action === 'updateClientStatus') {
      return jsonResponse(updateClientStatus(clientId, data.status));
    }
*/
}

function jsonResponse(data) {
  return ContentService
    .createTextOutput(JSON.stringify(data))
    .setMimeType(ContentService.MimeType.JSON);
}

//
//
//

/**
 *   
 */
function getClients() {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('Clients');
  if (!sheet) return { clients: [], error: ' Clients  ' };
  
  const data = sheet.getDataRange().getValues();
  const headers = data[0].map(h => String(h).toLowerCase().trim());
  
  const cols = findColumns(headers, {
    id: ['id'],
    name: ['name', 'key'],
    spreadsheetId: ['spreadsheetid'],
    clientType: ['clienttype', 'type'],
    status: ['status'],
    startDate: ['startdate'],
    notes: ['notes']
  });
  
  const clients = [];
  
  for (let i = 1; i < data.length; i++) {
    const row = data[i];
    const id = cols.id >= 0 ? row[cols.id] : row[0];
    const status = cols.status >= 0 ? row[cols.status] : 'active';
    
    if (id && status !== 'archived' && status !== 'deleted') {
      clients.push({
        id: String(id),
        name: cols.name >= 0 ? row[cols.name] : '',
        spreadsheetId: cols.spreadsheetId >= 0 ? row[cols.spreadsheetId] : '',
        clientType: cols.clientType >= 0 ? (row[cols.clientType] || 'online') : 'online',
        status: status,
        startDate: cols.startDate >= 0 ? formatDate(row[cols.startDate]) : '',
        notes: cols.notes >= 0 ? row[cols.notes] : ''
      });
    }
  }
  
  return { clients };
}

/**
 *   offline/hybrid 
 */
function getOfflineClients() {
  const { clients } = getClients();
  const offlineClients = clients.filter(c => c.clientType === 'offline' || c.clientType === 'hybrid');
  return { clients: offlineClients };
}

/**
 *  
 */
function getClientTypes() {
  return {
    types: [
      { id: 'online', name: 'Online', description: ' : , , ' },
      { id: 'offline', name: '', description: '  : , ' },
      { id: 'hybrid', name: '', description: 'Online + ' }
    ]
  };
}

/**
 *     ID
 */
function getClientSpreadsheet(clientId) {
  // Direct :  
  if (!clientId || clientId === 'undefined' || clientId === 'null') {
    return SpreadsheetApp.getActiveSpreadsheet();
  }
  
  // Master API :   
  const { clients } = getClients();
  const client = clients.find(c => String(c.id) === String(clientId));
  
  if (!client) throw new Error('  : ' + clientId);
  if (!client.spreadsheetId) throw new Error('   : ' + clientId);
  
  return SpreadsheetApp.openById(client.spreadsheetId);
}

//
// ONLINE:  
//

function getGoals(clientId) {
  try {
    const ss = getClientSpreadsheet(clientId);
    const sheet = ss.getSheetByName('Goals');
    
    if (!sheet) return { error: 'key' };
    
    const data = sheet.getDataRange().getValues();
    const headers = data[0];
    
    const cols = findColumns(headers, {
      key: ['key', 'key', 'name', 'key'],
      value: ['value', 'key', 'val']
    });
    
    const goals = {};
    const keyCol = cols.key >= 0 ? cols.key : 0;
    const valueCol = cols.value >= 0 ? cols.value : 1;
    
    // [comment]
    for (let i = 1; i < data.length; i++) {
      const key = data[i][keyCol];
      const value = data[i][valueCol];
      // [comment]
      if (key && !String(key).startsWith('key') && key !== 'key' && key !== 'key') {
        goals[key] = value;
      }
    }
    
    //
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

/**
 *    Goals ( Mifflin-St Jeor)
 */
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
        if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) age--;
      }
    }
    
    let bmr = gender === 'female'
      ? 10 * weight + 6.25 * height - 5 * age - 161
      : 10 * weight + 6.25 * height - 5 * age + 5;
    
    const tdee = Math.round(bmr * activityLevel);
    const targetCalories = Math.round(tdee * (1 - deficitPercent / 100));
    
    const protein = Math.round(weight * proteinPerKg);
    const fats = Math.round(weight * fatPerKg);
    const carbCalories = targetCalories - protein * 4 - fats * 9;
    const carbs = Math.round(Math.max(0, carbCalories / 4));
    
    return {
      targetCalories, protein, fat: fats, fats, carbs,
      bmr: Math.round(bmr), tdee, deficit: tdee - targetCalories,
      weight, height, age, gender, activityLevel, deficitPercent,
      calculatedAt: new Date().toISOString(), source: 'calculated_from_goals'
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
    if (quoteCol < 0) quoteCol = headers.indexOf('');
    if (quoteCol < 0) quoteCol = 1;
    
    let categoryCol = headers.indexOf('category');
    if (categoryCol < 0) categoryCol = 2;
    
    const quotes = [];
    
    for (let i = 1; i < data.length; i++) {
      const quoteText = data[i][quoteCol];
      if (quoteText) {
        quotes.push({
          id: data[i][0],
          quote: quoteText,
          category: data[i][categoryCol] || 'motivation'
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
    
    const cols = findColumns(headers, {
      date: ['date', 'key'],
      nutrition: ['nutrition', 'key'],
      wakeTime: ['waketime', 'key'],
      sleepTime: ['sleeptime', 'key'],
      sleepHours: ['sleephours', 'sleep', 'key', 'key'],
      trainingDone: ['trainingdone', 'key'],
      trainingType: ['trainingtype', 'key'],
      weight: ['weight', 'key'],
      pullups: ['pullups', 'key'],
      bench: ['bench', 'key'],
      notes: ['notes', 'key']
    });
    
    if (cols.date < 0) return { dailyData: {}, error: 'key' };
    
    const dailyData = {};
    
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
        wakeTime: cols.wakeTime >= 0 ? formatTime(row[cols.wakeTime]) : '',
        sleepTime: cols.sleepTime >= 0 ? formatTime(row[cols.sleepTime]) : '',
        sleepHours: cols.sleepHours >= 0 ? (row[cols.sleepHours] || '') : '',
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
    
    if (!sheet) return { success: false, data: null, message: 'key' };
    
    const data = sheet.getDataRange().getValues();
    if (data.length <= 1) return { success: false, data: null, message: 'key' };
    
    const headers = data[0];
    const cols = findColumns(headers, {
      date: ['date', 'key'],
      calories: ['calories', 'key'],
      protein: ['protein', 'key'],
      fats: ['fats', 'key'],
      carbs: ['carbs', 'key'],
      notes: ['notes', 'key']
    });
    
    if (cols.date < 0 || cols.calories < 0) {
      return { success: false, data: null, message: 'key' };
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
        dateValue = Utilities.formatDate(dateValue, Session.getScriptTimeZone(), 'yyyy-MM-dd');
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
    
    if (count === 0) return { success: false, data: null, message: 'key' };
    
    return {
      success: true,
      data: {
        calories: Math.round(totalCalories / count),
        protein: Math.round(totalProtein / count),
        fats: Math.round(totalFats / count),
        carbs: Math.round(totalCarbs / count),
        daysCount: count,
        dateRange: firstDate === lastDate ? lastDate : `${firstDate} - ${lastDate}`,
        allNotes, dailyEntries
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
      date: ['date', 'key'],
      type: ['type', 'key'],
      exercise: ['exercise', 'key'],
      set: ['set', 'key'],
      weight: ['weight', 'key'],
      reps: ['reps', 'key'],
      tonnage: ['tonnage', 'key'],
      total: ['total', 'totaltonnage'],
      notes: ['notes', 'key'],
      comments: ['comments', 'key']
    });
    
    if (cols.date < 0) return { workoutHistory: [], error: 'key' };
    
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
      if (!exName || exName === 'key') continue;
      
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
  return {
    goals: getGoals(clientId),
    nutrition: getNutrition(clientId),
    daily: getDaily(clientId),
    dailyData: getDaily(clientId).dailyData,
    settings: getSettings(clientId).settings,
    actualNutrition: getActualNutrition(clientId).data,
    workoutHistory: getWorkouts(clientId).workoutHistory,
    quotes: getQuotes(clientId).quotes,
    version: API_VERSION
  };
}

//
// ONLINE:  
//

function saveDaily(clientId, data) {
  try {
    const ss = getClientSpreadsheet(clientId);
    let sheet = ss.getSheetByName('Daily');
    
    if (!sheet) {
      sheet = ss.insertSheet('Daily');
      sheet.appendRow(['Date', 'Nutrition', 'WakeTime', 'SleepTime', 'SleepHours', 'Weight', 'Pullups', 'Bench', 'Notes']);
      sheet.getRange(1, 1, 1, 9).setFontWeight('bold').setBackground('#4a86e8').setFontColor('#ffffff');
    }
    
    const headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
    const cols = findColumns(headers, {
      date: ['date', 'key'],
      nutrition: ['nutrition', 'key'],
      wakeTime: ['waketime', 'key'],
      sleepTime: ['sleeptime', 'key'],
      sleepHours: ['sleephours', 'sleep', 'key'],
      weight: ['weight', 'key'],
      pullups: ['pullups', 'key'],
      bench: ['bench', 'key'],
      notes: ['notes', 'key']
    });
    
    if (cols.date < 0) return { success: false, error: 'key' };
    
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
        if (rowData[i] === '' && existingRow[i] !== '') rowData[i] = existingRow[i];
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
      return { success: false, error: ' Date  Calories  ' };
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
      total: ['total', 'totaltonnage'],
      notes: ['notes'],
      comments: ['comments']
    });
    
    function createRow(values) {
      const row = new Array(headers.length).fill('');
      for (const [key, val] of Object.entries(values)) {
        if (cols[key] !== undefined && cols[key] >= 0) row[cols[key]] = val;
      }
      return row;
    }
    
    const workout = data.workout || data;
    const date = workout.date ? formatDate(new Date(workout.date)) : formatDate(new Date());
    const comments = workout.comments || '';
    
    if (workout.type === 'FREE' && workout.notes) {
      sheet.appendRow(createRow({
        date, type: 'FREE', exercise: '', notes: workout.notes, comments
      }));
    } else if (workout.exercises) {
      let first = true;
      workout.exercises.forEach(ex => {
        ex.sets.forEach((set, i) => {
          sheet.appendRow(createRow({
            date,
            type: workout.type,
            exercise: ex.name,
            set: i + 1,
            weight: set.weight,
            reps: set.reps,
            tonnage: set.weight * set.reps,
            total: workout.totalTonnage || 0,
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

//
// OFFLINE:  
//

/**
 *     
 */
function getClientData(clientId) {
  const ss = getClientSpreadsheet(clientId);
  
  return {
    goals: readGoalsOffline(ss),
    mandatoryTasks: readMandatoryTasks(ss),
    trainingBlocks: readTrainingBlocks(ss),
    activeBlock: getActiveBlock(ss),
    profile: readClientProfile(ss)
  };
}

/**
 *    (, ,   ..)
 */
function getClientProfile(clientId) {
  const ss = getClientSpreadsheet(clientId);
  return { profile: readClientProfile(ss) };
}

function readClientProfile(ss) {
  let sheet = ss.getSheetByName('ClientProfile');
  let needsModules = false;
  
  if (!sheet) {
    //
    const hasGoalsWithKBJU = checkIfOnlineClient(ss);
    const clientType = hasGoalsWithKBJU ? 'online' : 'offline';
    
    //
    sheet = ss.insertSheet('ClientProfile');
    sheet.appendRow(['key', 'value', 'unit', 'updated', 'notes']);
    sheet.appendRow(['weight', '80', 'kg', formatDate(new Date()), ' ']);
    sheet.appendRow(['height', '175', 'cm', '', '']);
    sheet.appendRow(['gender', 'male', '', '', '']);
    sheet.appendRow(['fitnessLevel', 'intermediate', '', '', '']);
    sheet.appendRow(['clientType', clientType, '', '', 'online/offline/hybrid']);
    
    //
    if (clientType === 'online') {
      sheet.appendRow(['modules_workouts', 'false', '', '', ' ']);
      sheet.appendRow(['modules_nutrition', 'true', '', '', ' ()']);
      sheet.appendRow(['modules_daily', 'true', '', '', ' ']);
    } else {
      sheet.appendRow(['modules_workouts', 'true', '', '', ' ']);
      sheet.appendRow(['modules_nutrition', 'false', '', '', ' ()']);
      sheet.appendRow(['modules_daily', 'true', '', '', ' ']);
    }
    sheet.appendRow(['modules_warmup', 'false', '', '', ' ']);
    sheet.appendRow(['modules_measurements', 'false', '', '', ' ']);
    sheet.appendRow(['modules_mandatory', 'true', '', '', ' ']);
    
    sheet.getRange(1, 1, 1, 5).setFontWeight('bold').setBackground('#4caf50').setFontColor('#ffffff');
  }
  
  const data = sheet.getDataRange().getValues();
  const profile = {};
  
  for (let i = 1; i < data.length; i++) {
    const key = String(data[i][0] || '').trim();
    const value = data[i][1];
    const unit = data[i][2] || '';
    const updated = data[i][3] || '';
    
    if (key && key !== 'key') {
      //
      if (key === 'weight' || key === 'height' || key === 'bodyFatPercent' || key === 'trainingExperience') {
        profile[key] = parseFloat(value) || 0;
      } else if (key.startsWith('modules_')) {
        // Boolean  
        profile[key] = value === true || value === 'true' || value === 'TRUE';
      } else {
        profile[key] = value;
      }
      profile[key + '_unit'] = unit;
      profile[key + '_updated'] = updated;
    }
  }
  
  //    ,   -  
  if (profile.modules_workouts === undefined) {
    needsModules = true;
    const clientType = profile.clientType || detectClientType(ss);
    
    if (clientType === 'online') {
      profile.modules_workouts = false;
      profile.modules_nutrition = true;
      profile.modules_daily = true;
    } else if (clientType === 'offline') {
      profile.modules_workouts = true;
      profile.modules_nutrition = false;
      profile.modules_daily = true;
    } else { // hybrid
      profile.modules_workouts = true;
      profile.modules_nutrition = true;
      profile.modules_daily = true;
    }
    profile.modules_warmup = false;
    profile.modules_measurements = false;
    profile.modules_mandatory = true;
    
    //
    addModulesToProfile(sheet, profile);
  }
  
  //
  if (!profile.weight) profile.weight = 80;
  if (!profile.gender) profile.gender = 'male';
  
  //    Goals ( online )
  enrichProfileFromGoals(ss, profile);
  
  return profile;
}

/**
 * ,     (    Goals)
 */
function checkIfOnlineClient(ss) {
  const goalsSheet = ss.getSheetByName('Goals');
  if (!goalsSheet) return false;
  
  const data = goalsSheet.getDataRange().getValues();
  const onlineKeys = ['protein_per_kg', 'deficit_percent', 'bmr_formula', 'activity_level'];
  
  for (let i = 0; i < data.length; i++) {
    const key = String(data[i][0] || '').toLowerCase().trim();
    if (onlineKeys.some(k => key.includes(k))) {
      return true;
    }
  }
  return false;
}

/**
 *      
 */
function detectClientType(ss) {
  const hasWorkoutSessions = ss.getSheetByName('WorkoutSessions') !== null;
  const hasActualNutrition = ss.getSheetByName('ActualNutrition') !== null;
  const isOnline = checkIfOnlineClient(ss);
  
  if (hasWorkoutSessions && hasActualNutrition) return 'hybrid';
  if (isOnline || hasActualNutrition) return 'online';
  if (hasWorkoutSessions) return 'offline';
  
  return 'offline'; // default
}

/**
 *     ClientProfile
 */
function addModulesToProfile(sheet, profile) {
  const modulesToAdd = [
    ['clientType', profile.clientType || 'offline', '', '', 'online/offline/hybrid'],
    ['modules_workouts', profile.modules_workouts ? 'true' : 'false', '', '', ' '],
    ['modules_nutrition', profile.modules_nutrition ? 'true' : 'false', '', '', ' ()'],
    ['modules_daily', profile.modules_daily ? 'true' : 'false', '', '', ' '],
    ['modules_warmup', profile.modules_warmup ? 'true' : 'false', '', '', ' '],
    ['modules_measurements', profile.modules_measurements ? 'true' : 'false', '', '', ' '],
    ['modules_mandatory', profile.modules_mandatory ? 'true' : 'false', '', '', ' ']
  ];
  
  const existingData = sheet.getDataRange().getValues();
  const existingKeys = existingData.map(row => String(row[0]).trim());
  
  for (const row of modulesToAdd) {
    if (!existingKeys.includes(row[0])) {
      sheet.appendRow(row);
    }
  }
}

/**
 *     Goals ( online )
 */
function enrichProfileFromGoals(ss, profile) {
  const goalsSheet = ss.getSheetByName('Goals');
  if (!goalsSheet) return profile;
  
  const data = goalsSheet.getDataRange().getValues();
  const goalsMap = {};
  
  //  Goals  map
  for (let i = 0; i < data.length; i++) {
    const key = String(data[i][0] || '').trim();
    const value = data[i][1];
    if (key && !key.includes('')) {
      goalsMap[key] = value;
    }
  }
  
  //  profile   
  if (!profile.name && goalsMap.client_name) profile.name = goalsMap.client_name;
  if (!profile.weight && goalsMap.start_weight) profile.weight = parseFloat(goalsMap.start_weight) || 80;
  if (!profile.height && goalsMap.height) profile.height = parseFloat(goalsMap.height) || 175;
  if (!profile.gender && goalsMap.gender) profile.gender = goalsMap.gender;
  if (!profile.birthDate && goalsMap.birth_date) profile.birthDate = goalsMap.birth_date;
  
  //   Goals
  profile.targetWeight = goalsMap.program_goal_weight ? parseFloat(goalsMap.program_goal_weight) : null;
  profile.startWeight = goalsMap.start_weight ? parseFloat(goalsMap.start_weight) : null;
  profile.startDate = goalsMap.start_date || null;
  profile.programDuration = goalsMap.program_duration ? parseInt(goalsMap.program_duration) : null;
  
  //    (   )
  profile.goal_pullups = goalsMap.goal_pullups ? parseInt(goalsMap.goal_pullups) : 
                         goalsMap.pullups_goal ? parseInt(goalsMap.pullups_goal) : null;
  profile.pullups_current = goalsMap.pullups_current ? parseInt(goalsMap.pullups_current) : null;
  profile.goal_bench = goalsMap.goal_bench ? parseFloat(goalsMap.goal_bench) : null;
  profile.bench_current = goalsMap.bench_current ? parseFloat(goalsMap.bench_current) : null;
  
  //
  profile.proteinPerKg = goalsMap.protein_per_kg ? parseFloat(goalsMap.protein_per_kg) : null;
  profile.fatPerKg = goalsMap.fat_per_kg ? parseFloat(goalsMap.fat_per_kg) : null;
  profile.deficitPercent = goalsMap.deficit_percent ? parseFloat(goalsMap.deficit_percent) : null;
  profile.activityLevel = goalsMap.activity_level ? parseFloat(goalsMap.activity_level) : null;
  
  //
  if (!profile.clientType && goalsMap.client_type) profile.clientType = goalsMap.client_type;
  profile.trainingSystem = goalsMap.training_system || null;
  profile.mainGoals = goalsMap.main_goals || null;
  
  return profile;
}

/**
 *   
 */
function updateClientProfile(clientId, data) {
  const ss = getClientSpreadsheet(clientId);
  let sheet = ss.getSheetByName('ClientProfile');
  
  if (!sheet) {
    //
    sheet = ss.insertSheet('ClientProfile');
    sheet.appendRow(['key', 'value', 'unit', 'updated', 'notes']);
    sheet.getRange(1, 1, 1, 5).setFontWeight('bold').setBackground('#4caf50').setFontColor('#ffffff');
  }
  
  const updates = data.updates || data;
  const allData = sheet.getDataRange().getValues();
  const keyCol = 0;
  const valueCol = 1;
  const updatedCol = 3;
  
  for (const [key, value] of Object.entries(updates)) {
    if (key.endsWith('_unit') || key.endsWith('_updated')) continue;
    
    let found = false;
    for (let i = 1; i < allData.length; i++) {
      if (String(allData[i][keyCol]).trim() === key) {
        sheet.getRange(i + 1, valueCol + 1).setValue(value);
        sheet.getRange(i + 1, updatedCol + 1).setValue(formatDate(new Date()));
        found = true;
        break;
      }
    }
    
    if (!found) {
      const unit = key === 'weight' ? 'kg' : key === 'height' ? 'cm' : '';
      sheet.appendRow([key, value, unit, formatDate(new Date()), '']);
    }
  }
  
  return { success: true };
}

function readGoalsOffline(ss) {
  const sheet = ss.getSheetByName('Goals');
  if (!sheet) return {};
  
  const data = sheet.getDataRange().getValues();
  const goals = {};
  
  for (let i = 0; i < data.length; i++) {
    const key = data[i][0];
    const value = data[i][1];
    if (key && key !== 'key') goals[key] = value;
  }
  
  return goals;
}

function getMandatoryTasks(clientId) {
  const ss = getClientSpreadsheet(clientId);
  const tasks = readMandatoryTasks(ss);
  
  //
  const logSheet = ss.getSheetByName('MandatoryTaskLog');
  if (logSheet && logSheet.getLastRow() > 1) {
    const logData = logSheet.getDataRange().getValues();
    const logHeaders = logData[0].map(h => String(h).toLowerCase().trim());
    const taskIdIdx = logHeaders.indexOf('taskid') >= 0 ? logHeaders.indexOf('taskid') : 0;
    
    //
    const counts = {};
    for (let i = 1; i < logData.length; i++) {
      const taskId = String(logData[i][taskIdIdx]);
      counts[taskId] = (counts[taskId] || 0) + 1;
    }
    
    //  counts  
    tasks.forEach(t => {
      t.completionCount = counts[String(t.id)] || 0;
    });
  } else {
    tasks.forEach(t => {
      t.completionCount = 0;
    });
  }
  
  return { tasks };
}

function completeMandatoryTasks(clientId, data) {
  const ss = getClientSpreadsheet(clientId);
  let sheet = ss.getSheetByName('MandatoryTaskLog');
  
  //
  if (!sheet) {
    sheet = ss.insertSheet('MandatoryTaskLog');
    sheet.appendRow(['date', 'sessionId', 'taskId', 'taskName']);
    sheet.getRange(1, 1, 1, 4).setFontWeight('bold').setBackground('#9c27b0').setFontColor('#ffffff');
  }
  
  const taskIds = String(data.taskIds || '').split(',').filter(id => id.trim());
  const sessionId = data.sessionId || '';
  const date = data.date || formatDate(new Date());
  
  //
  const allTasks = readMandatoryTasks(ss);
  const taskMap = {};
  allTasks.forEach(t => { taskMap[String(t.id)] = t.name; });
  
  //
  for (const taskId of taskIds) {
    const taskName = taskMap[taskId] || taskId;
    sheet.appendRow([date, sessionId, taskId, taskName]);
  }
  
  return { success: true, saved: taskIds.length };
}

function readMandatoryTasks(ss) {
  const sheet = ss.getSheetByName('MandatoryTasks');
  if (!sheet) return [];
  
  const data = sheet.getDataRange().getValues();
  if (data.length < 2) return [];
  
  const headers = data[0].map(h => String(h).toLowerCase().trim());
  const cols = findColumns(headers, {
    id: ['id'],
    name: ['name', 'name', 'task'],
    type: ['type'],
    description: ['description'],
    target: ['target'],
    frequency: ['frequency'],
    priority: ['priority'],
    active: ['active']
  });
  
  const tasks = [];
  
  for (let i = 1; i < data.length; i++) {
    const row = data[i];
    const active = cols.active >= 0 ? row[cols.active] : true;
    
    if (active === true || active === 'TRUE' || active === 'true' || active === 1) {
      tasks.push({
        id: cols.id >= 0 ? row[cols.id] : i,
        name: cols.name >= 0 ? row[cols.name] : '',
        type: cols.type >= 0 ? row[cols.type] : '',
        description: cols.description >= 0 ? row[cols.description] : '',
        target: cols.target >= 0 ? row[cols.target] : '',
        frequency: cols.frequency >= 0 ? row[cols.frequency] : 'every',
        priority: cols.priority >= 0 ? row[cols.priority] : 1
      });
    }
  }
  
  return tasks.sort((a, b) => a.priority - b.priority);
}

function getTrainingBlocks(clientId) {
  const ss = getClientSpreadsheet(clientId);
  return { blocks: readTrainingBlocks(ss), activeBlock: getActiveBlock(ss) };
}

function readTrainingBlocks(ss) {
  const sheet = ss.getSheetByName('TrainingBlocks');
  if (!sheet) return [];
  
  const data = sheet.getDataRange().getValues();
  if (data.length < 2) return [];
  
  const headers = data[0].map(h => String(h).toLowerCase().trim());
  const cols = findColumns(headers, {
    blockId: ['blockid', 'id'],
    startDate: ['startdate'],
    endDate: ['enddate'],
    totalSessions: ['totalsessions', 'total'],
    usedSessions: ['usedsessions', 'used'],
    pricePerSession: ['pricepersession'],
    totalPrice: ['totalprice'],
    status: ['status'],
    notes: ['notes']
  });
  
  const blocks = [];
  
  for (let i = 1; i < data.length; i++) {
    const row = data[i];
    blocks.push({
      blockId: cols.blockId >= 0 ? row[cols.blockId] : i,
      startDate: cols.startDate >= 0 ? formatDate(row[cols.startDate]) : '',
      endDate: cols.endDate >= 0 ? formatDate(row[cols.endDate]) : '',
      totalSessions: cols.totalSessions >= 0 ? Number(row[cols.totalSessions]) || 0 : 0,
      usedSessions: cols.usedSessions >= 0 ? Number(row[cols.usedSessions]) || 0 : 0,
      status: cols.status >= 0 ? row[cols.status] : 'active',
      notes: cols.notes >= 0 ? row[cols.notes] : ''
    });
  }
  
  return blocks;
}

function getActiveBlock(ss) {
  const blocks = readTrainingBlocks(ss);
  return blocks.find(b => b.status === 'active') || null;
}

//
// OFFLINE:  
//

/**
 *    
 */
function getExercises(search, category, type) {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('exercises_master');
  if (!sheet) return { exercises: [], error: ' exercises_master  ' };
  
  const data = sheet.getDataRange().getValues();
  if (data.length < 2) return { exercises: [] };
  
  const headers = data[0].map(h => String(h).toLowerCase().trim());
  const cols = findColumns(headers, {
    id: ['id'],
    name: ['name', 'name'],
    category: ['category'],
    subcategory: ['subcategory'],
    type: ['type'],
    equipment: ['equipment'],
    videoUrl: ['videourl', 'video'],
    notes: ['notes'],
    laterality: ['laterality'],
    bodyweightRatio: ['bodyweightratio', 'bwratio'],
    equipmentOptions: ['equipmentoptions', 'equipoptions'],
    positionOptions: ['positionoptions', 'posoptions'],
    dumbbellMode: ['dumbbellmode', 'dbmode']
  });
  
  const exercises = [];
  const searchLower = search ? search.toLowerCase() : '';
  const categoryLower = category ? category.toLowerCase() : '';
  const typeLower = type ? type.toLowerCase() : '';
  
  for (let i = 1; i < data.length; i++) {
    const row = data[i];
    const id = cols.id >= 0 ? row[cols.id] : '';
    const name = cols.name >= 0 ? row[cols.name] : '';
    const cat = cols.category >= 0 ? row[cols.category] : '';
    const exType = cols.type >= 0 ? row[cols.type] : '';
    
    if (!id && !name) continue;
    
    if (searchLower && !String(name).toLowerCase().includes(searchLower)) continue;
    if (categoryLower && String(cat).toLowerCase() !== categoryLower) continue;
    if (typeLower && String(exType).toLowerCase() !== typeLower) continue;
    
    // Laterality: bilateral (default), canBeUnilateral, alwaysUnilateral
    const laterality = cols.laterality >= 0 ? String(row[cols.laterality] || 'bilateral') : 'bilateral';
    
    // Bodyweight ratio (0-1)
    let bwRatio = 0;
    if (cols.bodyweightRatio >= 0 && row[cols.bodyweightRatio]) {
      bwRatio = parseFloat(row[cols.bodyweightRatio]) || 0;
    }
    
    // Equipment options (pipe-separated)
    let equipOptions = [];
    if (cols.equipmentOptions >= 0 && row[cols.equipmentOptions]) {
      equipOptions = String(row[cols.equipmentOptions]).split('|').map(s => s.trim()).filter(Boolean);
    }
    
    // Position options (pipe-separated) - V6.1
    let posOptions = [];
    if (cols.positionOptions >= 0 && row[cols.positionOptions]) {
      posOptions = String(row[cols.positionOptions]).split('|').map(s => s.trim()).filter(Boolean);
    }
    
    // Dumbbell mode: single, pair, or empty
    let dumbbellMode = '';
    if (cols.dumbbellMode >= 0 && row[cols.dumbbellMode]) {
      dumbbellMode = String(row[cols.dumbbellMode]).toLowerCase().trim();
    }
    
    exercises.push({
      id: String(id),
      name: String(name),
      category: String(cat),
      subcategory: cols.subcategory >= 0 ? String(row[cols.subcategory]) : '',
      type: String(exType),
      equipment: cols.equipment >= 0 ? String(row[cols.equipment]) : '',
      videoUrl: cols.videoUrl >= 0 ? String(row[cols.videoUrl]) : '',
      notes: cols.notes >= 0 ? String(row[cols.notes]) : '',
      laterality: laterality,
      bodyweightRatio: bwRatio,
      equipmentOptions: equipOptions,
      positionOptions: posOptions,
      dumbbellMode: dumbbellMode
    });
  }
  
  const categories = [...new Set(exercises.map(e => e.category).filter(Boolean))];
  const types = [...new Set(exercises.map(e => e.type).filter(Boolean))];
  
  return { exercises, total: exercises.length, categories, types };
}

/**
 *    (: name + category)
 */
function addExercise(data) {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('exercises_master');
  if (!sheet) return { success: false, error: ' exercises_master  ' };
  
  const name = data.name;
  if (!name) return { success: false, error: 'key' };
  
  const id = data.id || generateExerciseId(name);
  
  //
  const existing = sheet.getDataRange().getValues();
  const headers = existing[0].map(h => String(h).toLowerCase().trim());
  const idCol = Math.max(0, headers.indexOf('id'));
  const nameCol = headers.indexOf('name');
  
  for (let i = 1; i < existing.length; i++) {
    if (String(existing[i][idCol]) === id) {
      return { success: false, error: '   ID  ', existingId: id };
    }
    if (nameCol >= 0 && String(existing[i][nameCol]).toLowerCase() === name.toLowerCase()) {
      return { success: false, error: '  ', existingId: existing[i][idCol] };
    }
  }
  
  const cols = findColumns(headers, {
    id: ['id'],
    name: ['name'],
    category: ['category'],
    subcategory: ['subcategory'],
    type: ['type'],
    equipment: ['equipment'],
    videoUrl: ['videourl'],
    notes: ['notes']
  });
  
  const newRow = new Array(headers.length).fill('');
  
  if (cols.id >= 0) newRow[cols.id] = id;
  if (cols.name >= 0) newRow[cols.name] = name;
  if (cols.category >= 0) newRow[cols.category] = data.category || '';
  if (cols.subcategory >= 0) newRow[cols.subcategory] = data.subcategory || '';
  if (cols.type >= 0) newRow[cols.type] = data.type || '';
  if (cols.equipment >= 0) newRow[cols.equipment] = data.equipment || '';
  if (cols.videoUrl >= 0) newRow[cols.videoUrl] = data.videoUrl || '';
  if (cols.notes >= 0) newRow[cols.notes] = data.notes || '';
  
  sheet.appendRow(newRow);
  
  return { success: true, exerciseId: id, message: 'key' };
}

function generateExerciseId(name) {
  const translit = {
    '': 'a', '': 'b', '': 'v', '': 'g', '': 'd', '': 'e', '': 'e',
    '': 'zh', '': 'z', '': 'i', '': 'y', '': 'k', '': 'l', '': 'm',
    '': 'n', '': 'o', '': 'p', '': 'r', '': 's', '': 't', '': 'u',
    '': 'f', '': 'h', '': 'ts', '': 'ch', '': 'sh', '': 'sch',
    '': '', '': 'y', '': '', '': 'e', '': 'yu', '': 'ya'
  };
  
  let result = name.toLowerCase();
  
  for (const [ru, en] of Object.entries(translit)) {
    result = result.replace(new RegExp(ru, 'g'), en);
  }
  
  result = result.replace(/[^a-z0-9\s]/g, '').replace(/\s+/g, '_').substring(0, 30);
  
  return result || 'exercise_' + Date.now();
}

//
// OFFLINE:  
//

function getExerciseHistory(clientId, exerciseId, limit) {
  const ss = getClientSpreadsheet(clientId);
  const sheet = ss.getSheetByName('WorkoutLog');
  if (!sheet) return { history: [] };
  
  const data = sheet.getDataRange().getValues();
  if (data.length < 2) return { history: [] };
  
  const headers = data[0].map(h => String(h).toLowerCase().trim());
  const cols = findColumns(headers, {
    sessionId: ['sessionid'],
    date: ['date'],
    exerciseId: ['exerciseid'],
    exerciseName: ['exercisename'],
    setNumber: ['setnumber', 'set'],
    weight: ['weight'],
    reps: ['reps'],
    rpe: ['rpe']
  });
  
  const history = [];
  const maxResults = parseInt(limit) || 20;
  
  for (let i = data.length - 1; i >= 1; i--) {
    const row = data[i];
    const rowExId = cols.exerciseId >= 0 ? String(row[cols.exerciseId]) : '';
    const rowExName = cols.exerciseName >= 0 ? String(row[cols.exerciseName]).toLowerCase() : '';
    
    if (rowExId === exerciseId || rowExName.includes(exerciseId.toLowerCase())) {
      history.push({
        date: cols.date >= 0 ? formatDate(row[cols.date]) : '',
        sessionId: cols.sessionId >= 0 ? row[cols.sessionId] : '',
        set: cols.setNumber >= 0 ? row[cols.setNumber] : '',
        weight: cols.weight >= 0 ? Number(row[cols.weight]) || 0 : 0,
        reps: cols.reps >= 0 ? Number(row[cols.reps]) || 0 : 0,
        rpe: cols.rpe >= 0 ? Number(row[cols.rpe]) || 0 : 0
      });
      
      if (history.length >= maxResults) break;
    }
  }
  
  //
  const byDate = {};
  history.forEach(h => {
    if (!byDate[h.date]) byDate[h.date] = { date: h.date, sets: [] };
    byDate[h.date].sets.push({ set: h.set, weight: h.weight, reps: h.reps, rpe: h.rpe });
  });
  
  //
  let bestWeight = 0, bestReps = 0, bestDate = '';
  history.forEach(h => {
    if (h.weight > bestWeight || (h.weight === bestWeight && h.reps > bestReps)) {
      bestWeight = h.weight;
      bestReps = h.reps;
      bestDate = h.date;
    }
  });
  
  return {
    exerciseId,
    history: Object.values(byDate).slice(0, 10),
    best: { weight: bestWeight, reps: bestReps, date: bestDate },
    totalSets: history.length
  };
}

//
// OFFLINE:  (SESSIONS)
//

function getRecentSessions(clientId, limit) {
  const ss = getClientSpreadsheet(clientId);
  const sheet = ss.getSheetByName('WorkoutSessions');
  if (!sheet) return { sessions: [] };
  
  const data = sheet.getDataRange().getValues();
  if (data.length < 2) return { sessions: [] };
  
  const headers = data[0].map(h => String(h).toLowerCase().trim());
  const cols = findColumns(headers, {
    sessionId: ['sessionid', 'id'],
    date: ['date'],
    blockId: ['blockid'],
    type: ['type'],
    splitType: ['splittype'],
    startTime: ['starttime'],
    endTime: ['endtime'],
    duration: ['duration'],
    exerciseCount: ['exercisecount'],
    totalSets: ['totalsets'],
    totalVolume: ['totalvolume', 'volume'],
    mandatoryDone: ['mandatorydone'],
    notes: ['notes'],
    rating: ['rating']
  });
  
  const sessions = [];
  const maxResults = parseInt(limit) || 10;
  
  for (let i = data.length - 1; i >= 1 && sessions.length < maxResults; i--) {
    const row = data[i];
    const sessionId = cols.sessionId >= 0 ? row[cols.sessionId] : null;
    
    if (sessionId) {
      sessions.push({
        sessionId,
        date: cols.date >= 0 ? formatDate(row[cols.date]) : '',
        blockId: cols.blockId >= 0 ? row[cols.blockId] : '',
        type: cols.type >= 0 ? row[cols.type] : '',
        splitType: cols.splitType >= 0 ? row[cols.splitType] : '',
        startTime: cols.startTime >= 0 ? formatTime(row[cols.startTime]) : '',
        endTime: cols.endTime >= 0 ? formatTime(row[cols.endTime]) : '',
        duration: cols.duration >= 0 ? Number(row[cols.duration]) || 0 : 0,
        exerciseCount: cols.exerciseCount >= 0 ? Number(row[cols.exerciseCount]) || 0 : 0,
        totalSets: cols.totalSets >= 0 ? Number(row[cols.totalSets]) || 0 : 0,
        totalVolume: cols.totalVolume >= 0 ? Number(row[cols.totalVolume]) || 0 : 0,
        notes: cols.notes >= 0 ? row[cols.notes] : '',
        rating: cols.rating >= 0 ? row[cols.rating] : ''
      });
    }
  }
  
  //     % 
  const volumes = sessions.map(s => s.totalVolume).filter(v => v > 0);
  const avgVolume = volumes.length > 0 ? Math.round(volumes.reduce((a, b) => a + b, 0) / volumes.length) : 0;
  
  //  % 
  sessions.forEach(s => {
    if (avgVolume > 0 && s.totalVolume > 0) {
      const diff = Math.round((s.totalVolume - avgVolume) / avgVolume * 100);
      s.volumeDiff = diff >= 0 ? `+${diff}%` : `${diff}%`;
    } else {
      s.volumeDiff = null;
    }
  });
  
  return { sessions, avgVolume };
}

function getSessionDetails(clientId, sessionId) {
  const ss = getClientSpreadsheet(clientId);
  
  //
  const sessionsSheet = ss.getSheetByName('WorkoutSessions');
  let session = null;
  
  if (sessionsSheet) {
    const sessData = sessionsSheet.getDataRange().getValues();
    const sessHeaders = sessData[0].map(h => String(h).toLowerCase().trim());
    const sessCols = findColumns(sessHeaders, {
      sessionId: ['sessionid', 'id'],
      date: ['date'],
      type: ['type'],
      splitType: ['splittype'],
      duration: ['duration'],
      totalVolume: ['totalvolume'],
      effectiveVolume: ['effectivevolume'],
      rating: ['rating'],
      notes: ['notes']
    });
    
    for (let i = 1; i < sessData.length; i++) {
      if (sessCols.sessionId >= 0 && String(sessData[i][sessCols.sessionId]) === String(sessionId)) {
        session = {
          sessionId,
          date: sessCols.date >= 0 ? formatDate(sessData[i][sessCols.date]) : '',
          type: sessCols.type >= 0 ? sessData[i][sessCols.type] : '',
          splitType: sessCols.splitType >= 0 ? sessData[i][sessCols.splitType] : '',
          duration: sessCols.duration >= 0 ? sessData[i][sessCols.duration] : '',
          totalVolume: sessCols.totalVolume >= 0 ? Number(sessData[i][sessCols.totalVolume]) || 0 : 0,
          effectiveVolume: sessCols.effectiveVolume >= 0 ? Number(sessData[i][sessCols.effectiveVolume]) || 0 : 0,
          rating: sessCols.rating >= 0 ? sessData[i][sessCols.rating] : '',
          notes: sessCols.notes >= 0 ? sessData[i][sessCols.notes] : ''
        };
        break;
      }
    }
  }
  
  //
  const logSheet = ss.getSheetByName('WorkoutLog');
  const exercises = {};
  
  if (logSheet) {
    const logData = logSheet.getDataRange().getValues();
    const logHeaders = logData[0].map(h => String(h).toLowerCase().trim());
    const logCols = findColumns(logHeaders, {
      sessionId: ['sessionid'],
      order: ['order'],
      exerciseId: ['exerciseid'],
      exerciseName: ['exercisename'],
      category: ['category'],
      setNumber: ['setnumber', 'set'],
      setType: ['settype'],
      weight: ['weight'],
      reps: ['reps'],
      rpe: ['rpe'],
      notes: ['notes']
    });
    
    for (let i = 1; i < logData.length; i++) {
      const row = logData[i];
      if (logCols.sessionId >= 0 && String(row[logCols.sessionId]) === String(sessionId)) {
        const exId = logCols.exerciseId >= 0 ? row[logCols.exerciseId] : '';
        const exName = logCols.exerciseName >= 0 ? row[logCols.exerciseName] : exId;
        
        if (!exercises[exId]) {
          exercises[exId] = {
            exerciseId: exId,
            name: exName,
            category: logCols.category >= 0 ? row[logCols.category] : '',
            order: logCols.order >= 0 ? row[logCols.order] : Object.keys(exercises).length + 1,
            sets: []
          };
        }
        
        exercises[exId].sets.push({
          setNumber: logCols.setNumber >= 0 ? row[logCols.setNumber] : exercises[exId].sets.length + 1,
          setType: logCols.setType >= 0 ? row[logCols.setType] : 'work',
          weight: logCols.weight >= 0 ? Number(row[logCols.weight]) || 0 : 0,
          reps: logCols.reps >= 0 ? Number(row[logCols.reps]) || 0 : 0,
          rpe: logCols.rpe >= 0 ? Number(row[logCols.rpe]) || 0 : 0,
          notes: logCols.notes >= 0 ? row[logCols.notes] : ''
        });
      }
    }
  }
  
  return { session, exercises: Object.values(exercises).sort((a, b) => a.order - b.order) };
}

//
// OFFLINE:   
//

function getMuscleStats(clientId, sessionsBack) {
  const ss = getClientSpreadsheet(clientId);
  const logSheet = ss.getSheetByName('WorkoutLog');
  if (!logSheet) return { stats: {} };
  
  const data = logSheet.getDataRange().getValues();
  if (data.length < 2) return { stats: {} };
  
  const headers = data[0].map(h => String(h).toLowerCase().trim());
  const cols = findColumns(headers, {
    sessionId: ['sessionid'],
    date: ['date'],
    category: ['category'],
    exerciseName: ['exercisename']
  });
  
  const muscleLastUsed = {};
  let sessionCount = 0;
  let lastSessionId = null;
  const maxSessions = parseInt(sessionsBack) || 20;
  
  for (let i = data.length - 1; i >= 1; i--) {
    const row = data[i];
    const sessionId = cols.sessionId >= 0 ? row[cols.sessionId] : null;
    const category = cols.category >= 0 ? String(row[cols.category]) : '';
    const date = cols.date >= 0 ? formatDate(row[cols.date]) : '';
    const exercise = cols.exerciseName >= 0 ? row[cols.exerciseName] : '';
    
    if (sessionId && sessionId !== lastSessionId) {
      sessionCount++;
      lastSessionId = sessionId;
      if (sessionCount > maxSessions) break;
    }
    
    if (category && !muscleLastUsed[category]) {
      muscleLastUsed[category] = {
        category,
        lastDate: date,
        sessionsAgo: sessionCount,
        lastExercise: exercise
      };
    }
  }
  
  const allCategories = ['', '', '', '', '', ''];
  allCategories.forEach(cat => {
    if (!muscleLastUsed[cat]) {
      muscleLastUsed[cat] = { category: cat, lastDate: '', sessionsAgo: 999, lastExercise: '' };
    }
  });
  
  const sorted = Object.values(muscleLastUsed).sort((a, b) => b.sessionsAgo - a.sessionsAgo);
  
  const recommendations = sorted
    .filter(s => s.sessionsAgo >= 2)
    .slice(0, 3)
    .map(s => ({
      category: s.category,
      sessionsAgo: s.sessionsAgo === 999 ? '' : s.sessionsAgo + ' . ',
      suggestion: s.lastExercise || ' '
    }));
  
  return { stats: muscleLastUsed, sorted, recommendations, totalSessionsAnalyzed: sessionCount };
}

//
// OFFLINE:  
//

function startSession(clientId, data) {
  const ss = getClientSpreadsheet(clientId);
  let sheet = ss.getSheetByName('WorkoutSessions');
  
  if (!sheet) {
    sheet = ss.insertSheet('WorkoutSessions');
    sheet.appendRow([
      'sessionId', 'date', 'blockId', 'type', 'splitType', 'startTime', 'endTime',
      'duration', 'exerciseCount', 'totalSets', 'totalVolume', 'effectiveVolume',
      'clientWeight', 'mandatoryDone', 'notes', 'rating'
    ]);
    sheet.getRange(1, 1, 1, 16).setFontWeight('bold').setBackground('#4a86e8').setFontColor('#ffffff');
  }
  
  // /     
  const existingHeaders = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
  const existingHeadersLower = existingHeaders.map(h => String(h).toLowerCase().trim());
  
  const requiredCols = ['splittype', 'clientweight', 'effectivevolume'];
  for (const col of requiredCols) {
    if (!existingHeadersLower.includes(col)) {
      const lastCol = sheet.getLastColumn();
      const colName = col === 'clientweight' ? 'clientWeight' : col === 'effectivevolume' ? 'effectiveVolume' : col;
      sheet.getRange(1, lastCol + 1).setValue(colName);
      existingHeadersLower.push(col);
    }
  }
  
  //
  const profile = readClientProfile(ss);
  const clientWeight = profile.weight || 80;
  const weightUpdated = profile.weight_updated || '';
  
  //     ( 14 )
  let weightWarning = null;
  if (weightUpdated) {
    const lastUpdate = new Date(weightUpdated);
    const daysSinceUpdate = Math.floor((new Date() - lastUpdate) / (1000 * 60 * 60 * 24));
    if (daysSinceUpdate > 14) {
      weightWarning = `   ${daysSinceUpdate} `;
    }
  } else {
    weightWarning = '     ';
  }
  
  const sessionId = generateSessionId();
  const now = new Date();
  const dateStr = formatDate(now);
  const timeStr = formatTime(now);
  
  const activeBlock = getActiveBlock(ss);
  const blockId = activeBlock ? activeBlock.blockId : '';
  
  const headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
  const cols = findColumns(headers.map(h => String(h).toLowerCase()), {
    sessionId: ['sessionid', 'id'],
    date: ['date'],
    blockId: ['blockid'],
    type: ['type'],
    splitType: ['splittype'],
    startTime: ['starttime'],
    clientWeight: ['clientweight'],
    notes: ['notes']
  });
  
  const newRow = new Array(headers.length).fill('');
  
  if (cols.sessionId >= 0) newRow[cols.sessionId] = sessionId;
  if (cols.date >= 0) newRow[cols.date] = dateStr;
  if (cols.blockId >= 0) newRow[cols.blockId] = blockId;
  if (cols.type >= 0) newRow[cols.type] = data.type || '';
  if (cols.splitType >= 0) newRow[cols.splitType] = data.splitType || '';
  if (cols.startTime >= 0) newRow[cols.startTime] = timeStr;
  if (cols.clientWeight >= 0) newRow[cols.clientWeight] = clientWeight;
  if (cols.notes >= 0) newRow[cols.notes] = data.notes || '';
  
  sheet.appendRow(newRow);
  
  return { 
    success: true, 
    sessionId, 
    date: dateStr, 
    startTime: timeStr, 
    blockId, 
    splitType: data.splitType || '',
    clientWeight,
    weightWarning
  };
}

function addSet(clientId, data) {
  const ss = getClientSpreadsheet(clientId);
  let sheet = ss.getSheetByName('WorkoutLog');
  
  if (!sheet) {
    sheet = ss.insertSheet('WorkoutLog');
    sheet.appendRow([
      'sessionId', 'date', 'order', 'exerciseId', 'exerciseName',
      'category', 'setNumber', 'setType', 'weight', 'reps',
      'rpe', 'duration', 'notes', 'unilateral', 'equipment', 'effectiveVolume'
    ]);
    sheet.getRange(1, 1, 1, 16).setFontWeight('bold').setBackground('#6aa84f').setFontColor('#ffffff');
  }
  
  //     ,   - 
  const headerRange = sheet.getRange(1, 1, 1, sheet.getLastColumn());
  let currentHeaders = headerRange.getValues()[0].map(h => String(h).toLowerCase());
  
  const requiredCols = ['unilateral', 'equipment', 'effectivevolume'];
  for (const col of requiredCols) {
    if (!currentHeaders.includes(col)) {
      const lastCol = sheet.getLastColumn() + 1;
      sheet.getRange(1, lastCol).setValue(col === 'effectivevolume' ? 'effectiveVolume' : col)
        .setFontWeight('bold').setBackground('#6aa84f').setFontColor('#ffffff');
      currentHeaders.push(col);
    }
  }
  
  const sessionId = data.sessionId;
  if (!sessionId) return { success: false, error: 'sessionId ' };
  
  const allData = sheet.getDataRange().getValues();
  const headers = allData[0].map(h => String(h).toLowerCase());
  const cols = findColumns(headers, {
    sessionId: ['sessionid'],
    order: ['order'],
    exerciseId: ['exerciseid'],
    setNumber: ['setnumber', 'set']
  });
  
  let maxOrder = 0;
  let setNumber = 1;
  
  for (let i = 1; i < allData.length; i++) {
    if (cols.sessionId >= 0 && String(allData[i][cols.sessionId]) === String(sessionId)) {
      const order = cols.order >= 0 ? Number(allData[i][cols.order]) || 0 : 0;
      if (order > maxOrder) maxOrder = order;
      
      if (cols.exerciseId >= 0 && String(allData[i][cols.exerciseId]) === String(data.exerciseId)) {
        const sn = cols.setNumber >= 0 ? Number(allData[i][cols.setNumber]) || 0 : 0;
        if (sn >= setNumber) setNumber = sn + 1;
      }
    }
  }
  
  const isNewExercise = setNumber === 1;
  const order = isNewExercise ? maxOrder + 1 : maxOrder;
  
  //
  let exerciseName = data.exerciseName || '';
  let category = data.category || '';
  
  if (data.exerciseId && (!exerciseName || !category)) {
    const { exercises } = getExercises(null, null, null);
    const ex = exercises.find(e => e.id === data.exerciseId);
    if (ex) {
      exerciseName = exerciseName || ex.name;
      category = category || ex.category;
    }
  }
  
  //  effectiveVolume
  const weight = Number(data.weight) || 0;
  const reps = Number(data.reps) || 0;
  const isUnilateral = data.unilateral === 'true' || data.unilateral === true;
  const bwRatio = Number(data.bodyweightRatio) || 0;
  const clientWeight = Number(data.clientWeight) || 80;
  
  // Dumbbell multiplier:  pair   2
  const dumbbellMode = data.dumbbellMode || '';
  const dumbbellMultiplier = dumbbellMode === 'pair' ? 2 : 1;
  
  // : (bodyweight  ratio + weight  dumbbellMultiplier)  reps  (isUnilateral ? 2 : 1)
  let actualWeight = weight * dumbbellMultiplier; //   
  let effectiveVolume = actualWeight * reps;
  
  if (bwRatio > 0) {
    effectiveVolume = (clientWeight * bwRatio + actualWeight) * reps;
  }
  if (isUnilateral) {
    effectiveVolume *= 2;
  }
  
  const writeCols = findColumns(headers, {
    sessionId: ['sessionid'],
    date: ['date'],
    order: ['order'],
    exerciseId: ['exerciseid'],
    exerciseName: ['exercisename'],
    category: ['category'],
    setNumber: ['setnumber', 'set'],
    setType: ['settype'],
    weight: ['weight'],
    reps: ['reps'],
    rpe: ['rpe'],
    duration: ['duration'],
    notes: ['notes'],
    unilateral: ['unilateral'],
    equipment: ['equipment'],
    dumbbellMode: ['dumbbellmode'],
    effectiveVolume: ['effectivevolume']
  });
  
  const newRow = new Array(headers.length).fill('');
  
  if (writeCols.sessionId >= 0) newRow[writeCols.sessionId] = sessionId;
  if (writeCols.date >= 0) newRow[writeCols.date] = data.date || formatDate(new Date());
  if (writeCols.order >= 0) newRow[writeCols.order] = order;
  if (writeCols.exerciseId >= 0) newRow[writeCols.exerciseId] = data.exerciseId || '';
  if (writeCols.exerciseName >= 0) newRow[writeCols.exerciseName] = exerciseName;
  if (writeCols.category >= 0) newRow[writeCols.category] = category;
  if (writeCols.setNumber >= 0) newRow[writeCols.setNumber] = setNumber;
  if (writeCols.setType >= 0) newRow[writeCols.setType] = data.setType || 'work';
  if (writeCols.weight >= 0) newRow[writeCols.weight] = weight; //    ( )
  if (writeCols.reps >= 0) newRow[writeCols.reps] = reps;
  if (writeCols.rpe >= 0) newRow[writeCols.rpe] = Number(data.rpe) || 0;
  if (writeCols.duration >= 0) newRow[writeCols.duration] = Number(data.duration) || 0;
  if (writeCols.notes >= 0) newRow[writeCols.notes] = data.notes || '';
  if (writeCols.unilateral >= 0) newRow[writeCols.unilateral] = isUnilateral ? 'TRUE' : 'FALSE';
  if (writeCols.equipment >= 0) newRow[writeCols.equipment] = data.equipment || '';
  if (writeCols.dumbbellMode >= 0) newRow[writeCols.dumbbellMode] = dumbbellMode;
  if (writeCols.effectiveVolume >= 0) newRow[writeCols.effectiveVolume] = Math.round(effectiveVolume);
  
  sheet.appendRow(newRow);
  
  const rowIndex = sheet.getLastRow();
  
  return {
    success: true,
    logId: rowIndex,
    exerciseId: data.exerciseId,
    exerciseName,
    order,
    setNumber,
    weight,
    reps,
    unilateral: isUnilateral,
    equipment: data.equipment || '',
    effectiveVolume: Math.round(effectiveVolume)
  };
}

function removeSet(clientId, logId) {
  const ss = getClientSpreadsheet(clientId);
  const sheet = ss.getSheetByName('WorkoutLog');
  if (!sheet) return { success: false, error: 'WorkoutLog  ' };
  
  const rowNum = parseInt(logId);
  if (!rowNum || rowNum < 2) return { success: false, error: ' logId' };
  if (rowNum > sheet.getLastRow()) return { success: false, error: '  ' };
  
  sheet.deleteRow(rowNum);
  
  return { success: true, removed: logId };
}

function finishSession(clientId, sessionId, data) {
  const ss = getClientSpreadsheet(clientId);
  const sessionsSheet = ss.getSheetByName('WorkoutSessions');
  const logSheet = ss.getSheetByName('WorkoutLog');
  
  if (!sessionsSheet) return { success: false, error: 'WorkoutSessions  ' };
  
  //   WorkoutLog
  let exerciseCount = 0;
  let totalSets = 0;
  let totalVolume = 0;
  let effectiveVolume = 0;
  const exercises = new Set();
  
  if (logSheet) {
    const logData = logSheet.getDataRange().getValues();
    const logHeaders = logData[0].map(h => String(h).toLowerCase());
    const logCols = findColumns(logHeaders, {
      sessionId: ['sessionid'],
      exerciseId: ['exerciseid'],
      weight: ['weight'],
      reps: ['reps'],
      effectiveVolume: ['effectivevolume']
    });
    
    for (let i = 1; i < logData.length; i++) {
      if (logCols.sessionId >= 0 && String(logData[i][logCols.sessionId]) === String(sessionId)) {
        totalSets++;
        if (logCols.exerciseId >= 0) exercises.add(logData[i][logCols.exerciseId]);
        
        const weight = logCols.weight >= 0 ? Number(logData[i][logCols.weight]) || 0 : 0;
        const reps = logCols.reps >= 0 ? Number(logData[i][logCols.reps]) || 0 : 0;
        totalVolume += weight * reps;
        
        //  effectiveVolume
        if (logCols.effectiveVolume >= 0) {
          effectiveVolume += Number(logData[i][logCols.effectiveVolume]) || 0;
        }
      }
    }
    exerciseCount = exercises.size;
    
    //  effectiveVolume  ,  totalVolume
    if (effectiveVolume === 0) effectiveVolume = totalVolume;
  }
  
  //
  const sessData = sessionsSheet.getDataRange().getValues();
  const sessHeaders = sessData[0].map(h => String(h).toLowerCase());
  const sessCols = findColumns(sessHeaders, {
    sessionId: ['sessionid'],
    blockId: ['blockid'],
    endTime: ['endtime'],
    duration: ['duration'],
    exerciseCount: ['exercisecount'],
    totalSets: ['totalsets'],
    totalVolume: ['totalvolume'],
    effectiveVolume: ['effectivevolume'],
    mandatoryDone: ['mandatorydone'],
    rating: ['rating'],
    notes: ['notes']
  });
  
  let rowIndex = -1;
  let blockId = null;
  
  for (let i = 1; i < sessData.length; i++) {
    if (sessCols.sessionId >= 0 && String(sessData[i][sessCols.sessionId]) === String(sessionId)) {
      rowIndex = i + 1;
      blockId = sessCols.blockId >= 0 ? sessData[i][sessCols.blockId] : null;
      break;
    }
  }
  
  if (rowIndex < 0) return { success: false, error: '  ' };
  
  const now = new Date();
  
  if (sessCols.endTime >= 0) sessionsSheet.getRange(rowIndex, sessCols.endTime + 1).setValue(formatTime(now));
  if (sessCols.duration >= 0) sessionsSheet.getRange(rowIndex, sessCols.duration + 1).setValue(data.duration || 0);
  if (sessCols.exerciseCount >= 0) sessionsSheet.getRange(rowIndex, sessCols.exerciseCount + 1).setValue(exerciseCount);
  if (sessCols.totalSets >= 0) sessionsSheet.getRange(rowIndex, sessCols.totalSets + 1).setValue(totalSets);
  if (sessCols.totalVolume >= 0) sessionsSheet.getRange(rowIndex, sessCols.totalVolume + 1).setValue(totalVolume);
  if (sessCols.effectiveVolume >= 0) sessionsSheet.getRange(rowIndex, sessCols.effectiveVolume + 1).setValue(effectiveVolume);
  if (sessCols.mandatoryDone >= 0 && data.mandatoryDone !== undefined) {
    sessionsSheet.getRange(rowIndex, sessCols.mandatoryDone + 1).setValue(data.mandatoryDone);
  }
  if (sessCols.rating >= 0 && data.rating !== undefined) {
    sessionsSheet.getRange(rowIndex, sessCols.rating + 1).setValue(data.rating);
  }
  if (sessCols.notes >= 0 && data.notes) {
    sessionsSheet.getRange(rowIndex, sessCols.notes + 1).setValue(data.notes);
  }
  
  //
  if (blockId) {
    updateBlockUsed(ss, blockId);
  }
  
  return { success: true, sessionId, exerciseCount, totalSets, totalVolume };
}

/**
 * Delete workout session (for editing)
 * Removes session from WorkoutSessions and all related records from WorkoutLog
 */
function deleteSession(clientId, sessionId) {
  const ss = getClientSpreadsheet(clientId);
  
  // 1. Delete records from WorkoutLog
  const logSheet = ss.getSheetByName('WorkoutLog');
  if (logSheet) {
    const logData = logSheet.getDataRange().getValues();
    const logHeaders = logData[0].map(h => String(h).toLowerCase());
    const sessionIdCol = logHeaders.indexOf('sessionid');
    
    if (sessionIdCol >= 0) {
      // Collect rows to delete (from last to first)
      const rowsToDelete = [];
      for (let i = logData.length - 1; i >= 1; i--) {
        if (String(logData[i][sessionIdCol]) === String(sessionId)) {
          rowsToDelete.push(i + 1);
        }
      }
      
      // Delete rows
      rowsToDelete.forEach(row => {
        try {
          logSheet.deleteRow(row);
        } catch (e) {
          console.log('Error deleting row ' + row + ': ' + e);
        }
      });
    }
  }
  
  // 2. Delete session from WorkoutSessions
  const sessionsSheet = ss.getSheetByName('WorkoutSessions');
  if (sessionsSheet) {
    const sessData = sessionsSheet.getDataRange().getValues();
    const sessHeaders = sessData[0].map(h => String(h).toLowerCase());
    const sessionIdCol = sessHeaders.indexOf('sessionid');
    
    if (sessionIdCol >= 0) {
      for (let i = sessData.length - 1; i >= 1; i--) {
        if (String(sessData[i][sessionIdCol]) === String(sessionId)) {
          sessionsSheet.deleteRow(i + 1);
          break;
        }
      }
    }
  }
  
  return { success: true, deleted: sessionId };
}

function updateBlockUsed(ss, blockId) {
  const sheet = ss.getSheetByName('TrainingBlocks');
  if (!sheet) return;
  
  const data = sheet.getDataRange().getValues();
  const headers = data[0].map(h => String(h).toLowerCase());
  const cols = findColumns(headers, {
    blockId: ['blockid', 'id'],
    usedSessions: ['usedsessions', 'used'],
    totalSessions: ['totalsessions', 'total'],
    status: ['status']
  });
  
  for (let i = 1; i < data.length; i++) {
    if (cols.blockId >= 0 && String(data[i][cols.blockId]) === String(blockId)) {
      const rowIndex = i + 1;
      const used = cols.usedSessions >= 0 ? Number(data[i][cols.usedSessions]) || 0 : 0;
      const total = cols.totalSessions >= 0 ? Number(data[i][cols.totalSessions]) || 0 : 0;
      
      if (cols.usedSessions >= 0) sheet.getRange(rowIndex, cols.usedSessions + 1).setValue(used + 1);
      if (cols.status >= 0 && used + 1 >= total && total > 0) {
        sheet.getRange(rowIndex, cols.status + 1).setValue('completed');
      }
      
      break;
    }
  }
}

function updateBlock(clientId, blockId, data) {
  const ss = getClientSpreadsheet(clientId);
  const sheet = ss.getSheetByName('TrainingBlocks');
  if (!sheet) return { success: false, error: 'TrainingBlocks  ' };
  
  const allData = sheet.getDataRange().getValues();
  const headers = allData[0].map(h => String(h).toLowerCase());
  const cols = findColumns(headers, {
    blockId: ['blockid', 'id'],
    usedSessions: ['usedsessions'],
    totalSessions: ['totalsessions'],
    status: ['status'],
    notes: ['notes']
  });
  
  for (let i = 1; i < allData.length; i++) {
    if (cols.blockId >= 0 && String(allData[i][cols.blockId]) === String(blockId)) {
      const rowIndex = i + 1;
      
      if (data.usedSessions !== undefined && cols.usedSessions >= 0) {
        sheet.getRange(rowIndex, cols.usedSessions + 1).setValue(data.usedSessions);
      }
      if (data.totalSessions !== undefined && cols.totalSessions >= 0) {
        sheet.getRange(rowIndex, cols.totalSessions + 1).setValue(data.totalSessions);
      }
      if (data.status && cols.status >= 0) {
        sheet.getRange(rowIndex, cols.status + 1).setValue(data.status);
      }
      if (data.notes && cols.notes >= 0) {
        sheet.getRange(rowIndex, cols.notes + 1).setValue(data.notes);
      }
      
      return { success: true, blockId };
    }
  }
  
  return { success: false, error: '  ' };
}

//
//
//

function createTrainingBlock(clientId, data) {
  const ss = getClientSpreadsheet(clientId);
  const sheet = ss.getSheetByName('TrainingBlocks');
  if (!sheet) return { success: false, error: 'TrainingBlocks  ' };
  
  //
  const requiredCols = ['blockId', 'startDate', 'endDate', 'totalSessions', 'usedSessions', 
                        'pricePerSession', 'totalPrice', 'currency', 'status', 'notes',
                        'completedVolume', 'avgSessionVolume', 'avgRPE', 'mandatoryRate'];
  const colIdx = ensureColumns(sheet, requiredCols);
  
  const allData = sheet.getDataRange().getValues();
  const headers = allData[0].map(h => String(h).toLowerCase());
  
  //   blockId    
  let maxBlockId = 0;
  let oldBlockId = null;
  let oldBlockRow = -1;
  
  for (let i = 1; i < allData.length; i++) {
    const id = Number(allData[i][colIdx['blockid']]) || 0;
    if (id > maxBlockId) maxBlockId = id;
    
    //
    if (allData[i][colIdx['status']] === 'active') {
      oldBlockId = id;
      oldBlockRow = i + 1;
      sheet.getRange(oldBlockRow, colIdx['status'] + 1).setValue('completed');
      sheet.getRange(oldBlockRow, colIdx['enddate'] + 1).setValue(formatDate(new Date()));
    }
  }
  
  //
  if (oldBlockId && oldBlockRow > 0) {
    const analytics = calculateBlockAnalytics(ss, oldBlockId);
    sheet.getRange(oldBlockRow, colIdx['completedvolume'] + 1).setValue(analytics.totalVolume);
    if (analytics.sessionCount > 0) {
      sheet.getRange(oldBlockRow, colIdx['avgsessionvolume'] + 1).setValue(Math.round(analytics.totalVolume / analytics.sessionCount));
    }
    sheet.getRange(oldBlockRow, colIdx['avgrpe'] + 1).setValue(analytics.avgRPE);
    sheet.getRange(oldBlockRow, colIdx['mandatoryrate'] + 1).setValue(analytics.mandatoryRate);
  }
  
  const newBlockId = maxBlockId + 1;
  const today = formatDate(new Date());
  
  //    (   ensureColumns)
  const updatedHeaders = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
  const newRow = updatedHeaders.map(h => {
    const hLower = String(h).toLowerCase();
    if (hLower === 'blockid') return newBlockId;
    if (hLower === 'startdate') return today;
    if (hLower === 'totalsessions') return data.totalSessions || 10;
    if (hLower === 'usedsessions') return 0;
    if (hLower === 'pricepersession') return data.pricePerSession || 0;
    if (hLower === 'totalprice') return data.totalPrice || 0;
    if (hLower === 'currency') return data.currency || 'USD';
    if (hLower === 'status') return 'active';
    if (hLower === 'notes') return data.notes || '';
    return '';
  });
  
  sheet.appendRow(newRow);
  
  //      Coach Master
  updateClientBlockInfo(clientId, {
    blockId: newBlockId,
    totalSessions: data.totalSessions || 10,
    totalPrice: data.totalPrice || 0,
    currency: data.currency || 'USD',
    startDate: today
  });
  
  return { 
    success: true, 
    blockId: newBlockId,
    oldBlockId: oldBlockId,
    message: ' #' + newBlockId + ' '
  };
}

//
//      COACH MASTER
//

function updateClientBlockInfo(clientId, blockInfo) {
  try {
    const masterSheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('Clients');
    if (!masterSheet) return { success: false, error: 'Clients   ' };
    
    //
    const requiredCols = ['id', 'name', 'spreadsheetId', 'clientType', 'status', 'startDate', 'notes',
                          'currentBlockId', 'blockSessions', 'blockPrice', 'blockCurrency', 'blockStartDate'];
    const colIdx = ensureColumns(masterSheet, requiredCols);
    
    const allData = masterSheet.getDataRange().getValues();
    
    //    id
    for (let i = 1; i < allData.length; i++) {
      if (String(allData[i][colIdx['id']]) === String(clientId)) {
        const rowIndex = i + 1;
        
        //
        masterSheet.getRange(rowIndex, colIdx['currentblockid'] + 1).setValue(blockInfo.blockId);
        masterSheet.getRange(rowIndex, colIdx['blocksessions'] + 1).setValue(blockInfo.totalSessions);
        masterSheet.getRange(rowIndex, colIdx['blockprice'] + 1).setValue(blockInfo.totalPrice);
        masterSheet.getRange(rowIndex, colIdx['blockcurrency'] + 1).setValue(blockInfo.currency || 'USD');
        masterSheet.getRange(rowIndex, colIdx['blockstartdate'] + 1).setValue(blockInfo.startDate);
        
        return { success: true };
      }
    }
    
    return { success: false, error: '  ' };
  } catch (error) {
    return { success: false, error: error.toString() };
  }
}

//
function saveBlockAnalytics(ss, blockId, headers, sheet, allData) {
  const analytics = calculateBlockAnalytics(ss, blockId);
  
  const cols = findColumns(headers, {
    blockId: ['blockid', 'id'],
    completedVolume: ['completedvolume', 'totalvolume'],
    avgSessionVolume: ['avgsessionvolume'],
    avgRPE: ['avgrpe'],
    mandatoryRate: ['mandatoryrate']
  });
  
  for (let i = 1; i < allData.length; i++) {
    if (String(allData[i][cols.blockId]) === String(blockId)) {
      const rowIndex = i + 1;
      if (cols.completedVolume >= 0) sheet.getRange(rowIndex, cols.completedVolume + 1).setValue(analytics.totalVolume);
      if (cols.avgSessionVolume >= 0 && analytics.sessionCount > 0) {
        sheet.getRange(rowIndex, cols.avgSessionVolume + 1).setValue(Math.round(analytics.totalVolume / analytics.sessionCount));
      }
      if (cols.avgRPE >= 0) sheet.getRange(rowIndex, cols.avgRPE + 1).setValue(analytics.avgRPE);
      if (cols.mandatoryRate >= 0) sheet.getRange(rowIndex, cols.mandatoryRate + 1).setValue(analytics.mandatoryRate);
      break;
    }
  }
}

//
function calculateBlockAnalytics(ss, blockId) {
  const sessionsSheet = ss.getSheetByName('WorkoutSessions');
  if (!sessionsSheet) return { totalVolume: 0, avgRPE: 0, mandatoryRate: 0, sessionCount: 0 };
  
  const sessData = sessionsSheet.getDataRange().getValues();
  const sessHeaders = sessData[0].map(h => String(h).toLowerCase());
  const sessCols = findColumns(sessHeaders, {
    blockId: ['blockid'],
    totalVolume: ['totalvolume'],
    rating: ['rating', 'rpe'],
    mandatoryDone: ['mandatorydone']
  });
  
  let totalVolume = 0, rpeSum = 0, rpeCount = 0, mandatoryDone = 0, sessionCount = 0;
  
  for (let i = 1; i < sessData.length; i++) {
    if (String(sessData[i][sessCols.blockId]) === String(blockId)) {
      sessionCount++;
      totalVolume += Number(sessData[i][sessCols.totalVolume]) || 0;
      
      const rpe = Number(sessData[i][sessCols.rating]);
      if (rpe > 0) { rpeSum += rpe; rpeCount++; }
      
      if (sessData[i][sessCols.mandatoryDone] === true || sessData[i][sessCols.mandatoryDone] === 'TRUE') {
        mandatoryDone++;
      }
    }
  }
  
  //    MandatoryTasksLog  
  const logSheet = ss.getSheetByName('MandatoryTasksLog');
  if (logSheet) {
    const logData = logSheet.getDataRange().getValues();
    const logHeaders = logData[0].map(h => String(h).toLowerCase());
    const logCols = findColumns(logHeaders, {
      blockId: ['blockid'],
      completed: ['completed']
    });
    
    let logTotal = 0, logCompleted = 0;
    for (let i = 1; i < logData.length; i++) {
      if (String(logData[i][logCols.blockId]) === String(blockId)) {
        logTotal++;
        if (logData[i][logCols.completed] === true || logData[i][logCols.completed] === 'TRUE') {
          logCompleted++;
        }
      }
    }
    
    if (logTotal > 0) {
      return {
        totalVolume: Math.round(totalVolume),
        avgRPE: rpeCount > 0 ? Math.round((rpeSum / rpeCount) * 10) / 10 : 0,
        mandatoryRate: Math.round((logCompleted / logTotal) * 100),
        sessionCount
      };
    }
  }
  
  return {
    totalVolume: Math.round(totalVolume),
    avgRPE: rpeCount > 0 ? Math.round((rpeSum / rpeCount) * 10) / 10 : 0,
    mandatoryRate: sessionCount > 0 ? Math.round((mandatoryDone / sessionCount) * 100) : 0,
    sessionCount
  };
}

//
//
//

function updateMandatoryTasks(clientId, tasks, blockId) {
  const ss = getClientSpreadsheet(clientId);
  const sheet = ss.getSheetByName('MandatoryTasks');
  if (!sheet) return { success: false, error: 'MandatoryTasks  ' };
  
  //      ( blockId)
  const requiredCols = ['id', 'name', 'type', 'description', 'target', 'frequency', 'priority', 'active', 'blockId'];
  const colIdx = ensureColumns(sheet, requiredCols);
  
  const allData = sheet.getDataRange().getValues();
  
  //
  for (let i = 1; i < allData.length; i++) {
    const activeVal = allData[i][colIdx['active']];
    if (activeVal === true || activeVal === 'TRUE' || activeVal === true) {
      sheet.getRange(i + 1, colIdx['active'] + 1).setValue(false);
    }
  }
  
  //   id
  let maxId = 0;
  for (let i = 1; i < allData.length; i++) {
    const id = Number(allData[i][colIdx['id']]) || 0;
    if (id > maxId) maxId = id;
  }
  
  //
  const addedIds = [];
  const updatedHeaders = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
  
  for (const task of tasks) {
    if (!task.name || task.name.trim() === '') continue;
    
    maxId++;
    addedIds.push(maxId);
    
    const newRow = updatedHeaders.map(h => {
      const hLower = String(h).toLowerCase();
      if (hLower === 'id') return maxId;
      if (hLower === 'name') return task.name.trim();
      if (hLower === 'type') return task.type || '';
      if (hLower === 'description') return task.description || '';
      if (hLower === 'target') return task.target || '';
      if (hLower === 'frequency') return task.frequency || 'every';
      if (hLower === 'priority') return task.priority || 1;
      if (hLower === 'active') return true;
      if (hLower === 'blockid') return blockId;
      return '';
    });
    sheet.appendRow(newRow);
  }
  
  return { 
    success: true, 
    addedTasks: addedIds.length,
    taskIds: addedIds,
    message: ' : ' + addedIds.length
  };
}

//
//
//

function logMandatoryTaskCompletion(clientId, sessionId, blockId, tasks) {
  const ss = getClientSpreadsheet(clientId);
  
  //     (  )
  const sheet = ensureSheet(ss, 'MandatoryTasksLog', ['date', 'sessionId', 'blockId', 'taskId', 'taskName', 'completed']);
  
  const today = formatDate(new Date());
  
  for (const task of tasks) {
    sheet.appendRow([
      today,
      sessionId,
      blockId,
      task.id,
      task.name,
      task.completed ? true : false
    ]);
  }
  
  return { success: true, logged: tasks.length };
}


//
//
//


/**
 *     
 * @param {Sheet} sheet -  Google Sheets
 * @param {string[]} requiredColumns -      
 * @returns {Object} -   ->  
 */
function ensureColumns(sheet, requiredColumns) {
  const lastCol = sheet.getLastColumn() || 1;
  const headers = sheet.getRange(1, 1, 1, lastCol).getValues()[0];
  const headersLower = headers.map(h => String(h).toLowerCase().trim());
  const result = {};
  
  for (const colName of requiredColumns) {
    const colNameLower = colName.toLowerCase();
    let idx = headersLower.findIndex(h => h === colNameLower);
    
    if (idx === -1) {
      //   -   
      const newColIdx = headers.length;
      sheet.getRange(1, newColIdx + 1).setValue(colName);
      headers.push(colName);
      headersLower.push(colNameLower);
      idx = newColIdx;
    }
    
    result[colNameLower] = idx;
  }
  
  return result;
}

/**
 *     
 * @param {Spreadsheet} ss - 
 * @param {string} sheetName -  
 * @param {string[]} headers -  
 * @returns {Sheet}
 */
function ensureSheet(ss, sheetName, headers) {
  let sheet = ss.getSheetByName(sheetName);
  if (!sheet) {
    sheet = ss.insertSheet(sheetName);
    if (headers && headers.length > 0) {
      sheet.appendRow(headers);
    }
  }
  return sheet;
}

/**
 * :  -1    ( 0!)
 */
function findColumns(headers, mapping) {
  const cols = {};
  const normalizedHeaders = headers.map(h => String(h).trim().toLowerCase());
  
  for (const [key, names] of Object.entries(mapping)) {
    cols[key] = -1;
    
    for (const name of names) {
      // [comment]
      if (!name || name === '') continue;
      
      const normalizedName = String(name).trim().toLowerCase();
      
      // [comment]
      const exactIdx = normalizedHeaders.indexOf(normalizedName);
      if (exactIdx >= 0) {
        cols[key] = exactIdx;
        break;
      }
      
      // [comment]
      if (normalizedName.length > 2) {
        for (let i = 0; i < normalizedHeaders.length; i++) {
          if (normalizedHeaders[i].includes(normalizedName)) {
            cols[key] = i;
            break;
          }
        }
        if (cols[key] >= 0) break;
      }
    }
  }
  
  return cols;
}

/**
 *  : YYYY-MM-DD
 */
function formatDate(value) {
  if (!value) return '';
  
  let date;
  
  if (value instanceof Date) {
    date = value;
  } else {
    const str = String(value).trim();
    
    if (str.includes('.')) {
      const parts = str.split('.');
      if (parts.length === 3) {
        date = new Date(parts[2], parts[1] - 1, parts[0]);
      }
    } else {
      date = new Date(str);
    }
  }
  
  if (!date || isNaN(date.getTime())) return String(value);
  
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  
  return `${year}-${month}-${day}`;
}

/**
 *  : HH:MM
 */
function formatTime(value) {
  if (!value) return '';
  
  if (typeof value === 'string') {
    const match = value.match(/^(\d{1,2}):(\d{2})$/);
    if (match) return value;
  }
  
  if (value instanceof Date) {
    const hours = value.getHours();
    const mins = value.getMinutes();
    return `${String(hours).padStart(2, '0')}:${String(mins).padStart(2, '0')}`;
  }
  
  const num = parseFloat(value);
  if (!isNaN(num) && num >= 0 && num < 1) {
    const totalMins = Math.round(num * 24 * 60);
    const hours = Math.floor(totalMins / 60);
    const mins = totalMins % 60;
    return `${String(hours).padStart(2, '0')}:${String(mins).padStart(2, '0')}`;
  }
  
  return String(value);
}

/**
 *  
 */
function parseDate(dateStr) {
  if (!dateStr) return null;
  
  const str = String(dateStr).trim();
  
  if (str.includes('.')) {
    const parts = str.split('.');
    if (parts.length === 3) {
      return new Date(parts[2], parts[1] - 1, parts[0]);
    }
  }
  
  if (str.includes('-')) {
    return new Date(str);
  }
  
  return new Date(str);
}

/**
 *  sessionId
 */
function generateSessionId() {
  const now = new Date();
  const dateStr = formatDate(now).replace(/-/g, '');
  const timeStr = String(now.getHours()).padStart(2, '0') + String(now.getMinutes()).padStart(2, '0');
  const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
  
  return `S${dateStr}_${timeStr}_${random}`;
}

//
// SETUP
//

function setupSystem() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  
  // Clients
  let clientsSheet = ss.getSheetByName('Clients');
  if (!clientsSheet) {
    clientsSheet = ss.insertSheet('Clients');
    clientsSheet.appendRow(['id', 'name', 'spreadsheetId', 'clientType', 'status', 'startDate', 'notes']);
    clientsSheet.getRange(1, 1, 1, 7).setFontWeight('bold').setBackground('#4a86e8').setFontColor('#ffffff');
    clientsSheet.appendRow(['test', '', '', 'online', 'active', '', '']);
  }
  
  // exercises_master
  let exSheet = ss.getSheetByName('exercises_master');
  if (!exSheet) {
    exSheet = ss.insertSheet('exercises_master');
    exSheet.appendRow(['id', 'name', 'category', 'subcategory', 'type', 'equipment', 'videoUrl', 'notes']);
    exSheet.getRange(1, 1, 1, 8).setFontWeight('bold').setBackground('#6aa84f').setFontColor('#ffffff');
  }
  
  // Settings
  let settingsSheet = ss.getSheetByName('Settings');
  if (!settingsSheet) {
    settingsSheet = ss.insertSheet('Settings');
    settingsSheet.appendRow(['key', 'value']);
    settingsSheet.getRange(1, 1, 1, 2).setFontWeight('bold').setBackground('#f1c232');
    settingsSheet.appendRow(['coachName', ' ']);
    settingsSheet.appendRow(['systemVersion', API_VERSION]);
  }
  
  Logger.log('');
  Logger.log(' FITNESS COACH API v' + API_VERSION + '  UNIFIED');
  Logger.log('');
  Logger.log('');
  Logger.log('ONLINE endpoints:');
  Logger.log('  getGoals, getNutrition, getDaily, saveDaily, ...');
  Logger.log('');
  Logger.log('OFFLINE endpoints:');
  Logger.log('  getExercises, startSession, addSet, finishSession, ...');
  Logger.log('');
  Logger.log('AI endpoints:');
  Logger.log('  parseWorkout  Gemini AI  ');
  Logger.log('');
  Logger.log('  Deploy  New deployment  Web app');
}

//
// AI COACH ASSISTANT (Gemini)  FULL CONTEXT
//

/**
 *      AI
 * @param {string} clientId - ID 
 * @returns {Object} -  
 */
function buildClientContext(clientId) {
  const context = {
    profile: {},
    goals: {},
    currentBlock: null,
    workoutHistory: [],
    exerciseRecords: {},
    weeklyStats: [],
    streaks: {}
  };
  
  try {
    const clientSheet = getClientSpreadsheet(clientId);
    if (!clientSheet) {
      return { error: '  ' };
    }
    
    //
    const goalsSheet = clientSheet.getSheetByName('Goals');
    if (goalsSheet) {
      const goalsData = goalsSheet.getDataRange().getValues();
      for (let i = 1; i < goalsData.length; i++) {
        const key = goalsData[i][0];
        const value = goalsData[i][1];
        if (key) {
          context.goals[key] = value;
        }
      }
      
      context.profile = {
        name: context.goals.client_name || clientId,
        system: context.goals.training_system || 'unknown',
        phase: context.goals.current_phase || '',
        daysPerWeek: context.goals.days_per_week || 3,
        focus: context.goals.training_focus || '',
        startDate: context.goals.start_date || ''
      };
    }
    
    //
    const blocksSheet = clientSheet.getSheetByName('TrainingBlocks');
    if (blocksSheet && blocksSheet.getLastRow() > 1) {
      const blocksData = blocksSheet.getDataRange().getValues();
      const headers = blocksData[0];
      
      //
      for (let i = blocksData.length - 1; i >= 1; i--) {
        const row = blocksData[i];
        const status = row[headers.indexOf('status')] || row[5];
        if (status === 'active') {
          context.currentBlock = {
            id: row[0],
            name: row[headers.indexOf('name')] || row[1] || ' ',
            totalSessions: parseInt(row[headers.indexOf('totalSessions')] || row[2]) || 0,
            usedSessions: parseInt(row[headers.indexOf('usedSessions')] || row[3]) || 0,
            startDate: row[headers.indexOf('startDate')] || row[4] || ''
          };
          context.currentBlock.remaining = context.currentBlock.totalSessions - context.currentBlock.usedSessions;
          break;
        }
      }
    }
    
    //
    const sessionsSheet = clientSheet.getSheetByName('WorkoutSessions');
    const logSheet = clientSheet.getSheetByName('WorkoutLog');
    
    if (sessionsSheet && sessionsSheet.getLastRow() > 1) {
      const sessionsData = sessionsSheet.getDataRange().getValues();
      const sessionsHeaders = sessionsData[0];
      
      //   20 
      const sessions = [];
      const splitTypeIdx = sessionsHeaders.indexOf('splitType');
      
      for (let i = Math.max(1, sessionsData.length - 20); i < sessionsData.length; i++) {
        const row = sessionsData[i];
        if (row[0]) {
          sessions.push({
            sessionId: row[0],
            date: formatDate(row[sessionsHeaders.indexOf('date')] || row[1]),
            type: row[sessionsHeaders.indexOf('type')] || row[2] || '',
            splitType: splitTypeIdx >= 0 ? row[splitTypeIdx] : '',
            duration: row[sessionsHeaders.indexOf('duration')] || row[3] || 0,
            rating: row[sessionsHeaders.indexOf('rating')] || row[4] || '',
            totalVolume: row[sessionsHeaders.indexOf('totalVolume')] || row[6] || 0,
            exercises: []
          });
        }
      }
      
      //
      if (logSheet && logSheet.getLastRow() > 1) {
        const logData = logSheet.getDataRange().getValues();
        const logHeaders = logData[0];
        
        for (let i = 1; i < logData.length; i++) {
          const row = logData[i];
          const sessionId = row[logHeaders.indexOf('sessionId')] || row[1];
          const session = sessions.find(s => s.sessionId === sessionId);
          
          if (session) {
            session.exercises.push({
              name: row[logHeaders.indexOf('exerciseName')] || row[3] || '',
              category: row[logHeaders.indexOf('category')] || row[4] || '',
              weight: parseFloat(row[logHeaders.indexOf('weight')] || row[5]) || 0,
              reps: parseInt(row[logHeaders.indexOf('reps')] || row[6]) || 0
            });
          }
          
          //
          const exerciseName = row[logHeaders.indexOf('exerciseName')] || row[3];
          const weight = parseFloat(row[logHeaders.indexOf('weight')] || row[5]) || 0;
          
          if (exerciseName && weight > 0) {
            if (!context.exerciseRecords[exerciseName] || weight > context.exerciseRecords[exerciseName].weight) {
              context.exerciseRecords[exerciseName] = {
                weight: weight,
                date: formatDate(row[logHeaders.indexOf('date')] || row[7])
              };
            }
          }
        }
      }
      
      //
      sessions.forEach(session => {
        const grouped = {};
        session.exercises.forEach(ex => {
          if (!grouped[ex.name]) {
            grouped[ex.name] = { name: ex.name, category: ex.category, sets: [] };
          }
          grouped[ex.name].sets.push({ weight: ex.weight, reps: ex.reps });
        });
        session.exercisesSummary = Object.values(grouped);
        delete session.exercises;
      });
      
      context.workoutHistory = sessions.reverse(); //  
    }
    
    //
    const weeklyVolume = {};
    context.workoutHistory.forEach(session => {
      const date = new Date(session.date);
      const weekStart = getWeekStart(date);
      const weekKey = formatDate(weekStart);
      
      if (!weeklyVolume[weekKey]) {
        weeklyVolume[weekKey] = { volume: 0, sessions: 0 };
      }
      weeklyVolume[weekKey].volume += parseInt(session.totalVolume) || 0;
      weeklyVolume[weekKey].sessions += 1;
    });
    
    context.weeklyStats = Object.entries(weeklyVolume)
      .map(([week, data]) => ({ week, ...data }))
      .sort((a, b) => b.week.localeCompare(a.week))
      .slice(0, 8); //  8 
    
    //  STREAKS 
    let currentStreak = 0;
    let lastWorkoutDate = null;
    
    for (const session of context.workoutHistory) {
      const sessionDate = new Date(session.date);
      if (!lastWorkoutDate) {
        lastWorkoutDate = sessionDate;
        currentStreak = 1;
      } else {
        const daysDiff = Math.floor((lastWorkoutDate - sessionDate) / (1000 * 60 * 60 * 24));
        if (daysDiff <= 3) { //  streak   <= 3 
          currentStreak++;
          lastWorkoutDate = sessionDate;
        } else {
          break;
        }
      }
    }
    
    context.streaks = {
      current: currentStreak,
      totalWorkouts: context.workoutHistory.length
    };
    
    return context;
    
  } catch (error) {
    Logger.log('buildClientContext error: ' + error.toString());
    return { error: error.toString() };
  }
}

function getWeekStart(date) {
  const d = new Date(date);
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1);
  return new Date(d.setDate(diff));
}

/**
 * AI Coach    +  
 * @param {string} clientId - ID 
 * @param {string} text -  
 * @returns {Object} -  +  + 
 */
function aiCoachProcess(clientId, text) {
  if (!text || text.trim() === '') {
    return { success: false, error: 'Empty input' };
  }
  
  try {
    // Build client context
    const context = buildClientContext(clientId);
    if (context.error) {
      return { success: false, error: context.error };
    }
    
    // Get exercises database
    const exercisesData = getExercises();
    const exercisesList = exercisesData.exercises?.map(e => e.name).join(', ') || '';
    
    // Build AI prompt
    const systemPrompt = `You are a PRECISE fitness workout parser AI.

=== EXAMPLES ===
Input: "bench press 3x10"
Output: {"exercises": [{"name": "bench press", "category": "Chest", "sets": [{"weight": 0, "reps": 10}, {"weight": 0, "reps": 10}, {"weight": 0, "reps": 10}]}]}

Input: "squat 40kg 2x10"  
Output: {"exercises": [{"name": "squat", "category": "Legs", "sets": [{"weight": 40, "reps": 10}, {"weight": 40, "reps": 10}]}]}

Input: "deadlift 60x12, 70x10, 80x6"
Output: {"exercises": [{"name": "deadlift", "category": "Back", "sets": [{"weight": 60, "reps": 12}, {"weight": 70, "reps": 10}, {"weight": 80, "reps": 6}]}]}

=== RULES ===
1. Keep exercise names exactly as written
2. "XxY" or "X*Y" = weight X kg, Y reps  
3. "NxM" without weight = N sets of M reps
4. Bodyweight exercises (pullups, dips): weight = 0
5. Categories: Back, Chest, Legs, Shoulders, Arms, Core

=== CLIENT CONTEXT ===
Name: ${context.profile.name}
Training system: ${context.profile.system || 'not specified'}
Current streak: ${context.streaks.current} workouts

=== AVAILABLE EXERCISES ===
${exercisesList.substring(0, 2000)}

Parse the input and return ONLY valid JSON with this structure:
{
  "exercises": [{"name": "...", "category": "...", "sets": [{"weight": N, "reps": N}]}],
  "analytics": {"totalVolume": N, "insights": "..."},
  "motivation": "short encouraging message"
}`;

    const userPrompt = 'Parse this workout:\n' + text;
    
    // Call Gemini API
    const payload = {
      contents: [{
        parts: [{
          text: systemPrompt + '\n\n' + userPrompt
        }]
      }],
      generationConfig: {
        temperature: 0.3,
        maxOutputTokens: 2048
      }
    };
    
    const options = {
      method: 'post',
      contentType: 'application/json',
      payload: JSON.stringify(payload),
      muteHttpExceptions: true
    };
    
    const response = UrlFetchApp.fetch(GEMINI_URL, options);
    const responseCode = response.getResponseCode();
    const responseText = response.getContentText();
    
    if (responseCode !== 200) {
      Logger.log('Gemini API error: ' + responseCode + ' - ' + responseText);
      return { 
        success: false, 
        error: 'Gemini API error: ' + responseCode
      };
    }
    
    const geminiResponse = JSON.parse(responseText);
    const aiText = geminiResponse.candidates?.[0]?.content?.parts?.[0]?.text || '';
    
    if (!aiText) {
      return { success: false, error: 'Empty AI response' };
    }
    
    Logger.log('Gemini response length: ' + aiText.length);
    
    // Parse JSON from response
    let parsed;
    try {
      let cleanJson = aiText.trim()
        .replace(/^```json\s*/i, '')
        .replace(/```\s*$/i, '')
        .trim();
      
      const jsonMatch = cleanJson.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        parsed = JSON.parse(jsonMatch[0]);
      } else {
        throw new Error('JSON not found');
      }
    } catch (parseError) {
      Logger.log('JSON parse error: ' + parseError.message);
      return { 
        success: false, 
        error: 'Failed to parse AI response',
        rawResponse: aiText.substring(0, 500)
      };
    }
    
    // Success!
    return {
      success: true,
      exercises: parsed.exercises || [],
      rpe: parsed.rpe,
      duration: parsed.duration,
      analytics: parsed.analytics || {},
      achievements: parsed.achievements || [],
      motivation: parsed.motivation || '',
      context: {
        clientName: context.profile.name,
        currentStreak: context.streaks.current + 1,
        blockProgress: context.currentBlock ? 
          (context.currentBlock.usedSessions + 1) + '/' + context.currentBlock.totalSessions : null
      },
      aiModel: GEMINI_MODEL
    };
    
  } catch (error) {
    Logger.log('aiCoachProcess error: ' + error.toString());
    return { success: false, error: error.toString() };
  }
}

/**
 * AI workout parser with equipment and position support
 * V6.1: Extended with position options
 */
function parseWorkoutWithAI(text, exercisesList) {
  if (!text || text.trim() === '') {
    return { success: false, error: ' ' };
  }
  
  try {
    //      - V6.1
    const exercises = exercisesList || getExercises().exercises?.map(e => {
      let desc = `${e.name} (${e.category})`;
      if (e.equipmentOptions?.length) desc += ` [${e.equipmentOptions.join('/')}]`;
      if (e.positionOptions?.length) desc += ` {${e.positionOptions.join('/')}}`;
      return desc;
    }).join(', ') || '';
    
    const prompt = `   JSON.    ,    .

 : ${exercises}

  -  " N   X , M ":
- " 8   40 , 3 " = 3   8    40
- " 12   10 , 2 " = 2   12    10

  -  :
- "      "  name: " ", equipment: "", position: ""
- "   "  name: "", equipment: "", position: ""
- "    "  name: "  ", equipment: "", position: ""
- "   "  name: "  ", equipment: "", position: ""

 :
- "", " ", ""  equipment: ""
- "", "", " "  equipment: ""
- " ", "", ""  equipment: ""
- "", " "  equipment: ""
- "", " "  equipment: ""

 :
- " ", " "  position: ""
- " "  position: " "
- ""  position: ""
- ""  position: ""
- ""  position: ""

 :
- " 12/10/8   10/10/7,5" = 3 : {weight:10,reps:12}, {weight:10,reps:10}, {weight:7.5,reps:8}

  JSON:
{"exercises":[{"name":"_","category":"...","equipment":"...","position":"...","sets":[{"weight":,"reps":}],"unilateral":false}],"rpe":null,"duration":null}

 markdown,  ,  JSON!

: ${text}`;

    const payload = {
      contents: [{ parts: [{ text: prompt }] }],
      generationConfig: { temperature: 0.1, maxOutputTokens: 1024 }
    };
    
    const response = UrlFetchApp.fetch(GEMINI_URL, {
      method: 'post',
      contentType: 'application/json',
      payload: JSON.stringify(payload),
      muteHttpExceptions: true
    });
    
    if (response.getResponseCode() !== 200) {
      Logger.log('AI Parser API error: ' + response.getResponseCode());
      return { success: false, error: 'API error: ' + response.getResponseCode() };
    }
    
    const aiText = JSON.parse(response.getContentText()).candidates?.[0]?.content?.parts?.[0]?.text || '';
    
    //    JSON
    let cleanJson = aiText.trim()
      .replace(/^```json\s*/i, '')
      .replace(/```\s*$/i, '')
      .trim();
    
    const jsonMatch = cleanJson.match(/\{[\s\S]*\}/);
    
    if (jsonMatch) {
      const parsed = JSON.parse(jsonMatch[0]);
      
      //   - V6.1
      if (parsed.exercises) {
        parsed.exercises = parsed.exercises.map(ex => ({
          name: ex.name || '',
          category: ex.category || '',
          equipment: ex.equipment || '',
          position: ex.position || '',
          sets: ex.sets || [],
          unilateral: ex.unilateral || false
        }));
      }
      
      return { 
        success: true, 
        ...parsed, 
        aiModel: GEMINI_MODEL,
        version: API_VERSION
      };
    }
    
    return { success: false, error: 'JSON     AI' };
    
  } catch (error) {
    Logger.log('parseWorkoutWithAI error: ' + error.toString());
    return { success: false, error: error.toString() };
  }
}

/**
 *  AI Coach
 */
function testAICoach() {
  const testText = '  60  12, 70  10, 80  6.  100  8  .  50 , RPE 8';
  
  Logger.log('');
  Logger.log('Testing AI Coach with client: yaroslav');
  Logger.log('Input: ' + testText);
  Logger.log('');
  
  const result = aiCoachProcess('yaroslav', testText);
  Logger.log('Result: ' + JSON.stringify(result, null, 2));
}

//
// UNIFIED TRACKER MODULES
//

/**
 *    (, ,   .)
 */
function saveDailyData(clientId, params) {
  try {
    const ss = getClientSpreadsheet(clientId);
    let sheet = ss.getSheetByName('Daily');
    
    if (!sheet) {
      sheet = ss.insertSheet('Daily');
      sheet.appendRow(['Date', 'Weight', 'Sleep', 'WakeTime', 'Nutrition', 'Pullups', 'Bench', 'Notes']);
      sheet.getRange(1, 1, 1, 8).setFontWeight('bold').setBackground('#4caf50').setFontColor('#fff');
    }
    
    const date = params.date || formatDate(new Date());
    const data = sheet.getDataRange().getValues();
    const headers = data[0].map(h => String(h).toLowerCase().trim());
    
    // Find column indices (flexible naming)
    const findCol = (names) => {
      for (const name of names) {
        const idx = headers.findIndex(h => h.includes(name));
        if (idx >= 0) return idx;
      }
      return -1;
    };
    
    const dateCol = findCol(['date']);
    const weightCol = findCol(['weight', '']);
    const sleepCol = findCol(['sleep', '']);
    const wakeCol = findCol(['waketime', 'wake', '']);
    const sleepTimeCol = findCol(['sleeptime']); //     
    const nutritionCol = findCol(['nutrition', '']);
    const pullupsCol = findCol(['pullup', '']);
    const benchCol = findCol(['bench', '']);
    const notesCol = findCol(['notes', '']);
    
    // Check if row for this date exists
    let rowIndex = -1;
    for (let i = 1; i < data.length; i++) {
      const rowDate = formatDate(data[i][dateCol]);
      if (rowDate === date) {
        rowIndex = i + 1;
        break;
      }
    }
    
    if (rowIndex > 0) {
      // Update existing row
      if (params.weight && weightCol >= 0) sheet.getRange(rowIndex, weightCol + 1).setValue(parseFloat(params.weight));
      if (params.sleepHours && sleepCol >= 0) sheet.getRange(rowIndex, sleepCol + 1).setValue(parseFloat(params.sleepHours));
      if (params.wakeTime && wakeCol >= 0) sheet.getRange(rowIndex, wakeCol + 1).setValue(params.wakeTime);
      if (params.sleepTime && sleepTimeCol >= 0) sheet.getRange(rowIndex, sleepTimeCol + 1).setValue(params.sleepTime);
      if (params.nutrition && nutritionCol >= 0) sheet.getRange(rowIndex, nutritionCol + 1).setValue(params.nutrition);
      if (params.pullups && pullupsCol >= 0) sheet.getRange(rowIndex, pullupsCol + 1).setValue(parseInt(params.pullups));
      if (params.bench && benchCol >= 0) sheet.getRange(rowIndex, benchCol + 1).setValue(parseFloat(params.bench));
      if (params.notes && notesCol >= 0) sheet.getRange(rowIndex, notesCol + 1).setValue(params.notes);
    } else {
      // Add new row - build dynamically based on headers
      const newRow = [];
      for (let i = 0; i < headers.length; i++) {
        if (i === dateCol) newRow.push(date);
        else if (i === weightCol) newRow.push(params.weight ? parseFloat(params.weight) : '');
        else if (i === sleepCol) newRow.push(params.sleepHours ? parseFloat(params.sleepHours) : '');
        else if (i === wakeCol) newRow.push(params.wakeTime || '');
        else if (i === sleepTimeCol) newRow.push(params.sleepTime || '');
        else if (i === nutritionCol) newRow.push(params.nutrition || '');
        else if (i === pullupsCol) newRow.push(params.pullups ? parseInt(params.pullups) : '');
        else if (i === benchCol) newRow.push(params.bench ? parseFloat(params.bench) : '');
        else if (i === notesCol) newRow.push(params.notes || '');
        else newRow.push('');
      }
      sheet.appendRow(newRow);
    }
    
    // Update weight in profile if provided
    if (params.weight) {
      updateClientProfile(clientId, { weight: parseFloat(params.weight) });
    }
    
    return { success: true, date };
    
  } catch (error) {
    return { error: error.toString() };
  }
}

/**
 *     (, , )
 */
function getLastDailyData(clientId) {
  try {
    const ss = getClientSpreadsheet(clientId);
    
    // Auto-create Daily sheet with InBody fields
    const dailyHeaders = ['date', 'weight', 'bodyFat', 'leanMass', 'wakeTime', 'sleepTime', 'sleepHours', 'pullups', 'bench', 'notes'];
    const sheet = ensureSheet(ss, 'Daily', dailyHeaders);
    
    const data = sheet.getDataRange().getValues();
    const headers = data[0].map(h => String(h).toLowerCase().trim());
    
    const findCol = (names) => {
      for (const name of names) {
        if (!name) continue;
        const idx = headers.findIndex(h => h.includes(name));
        if (idx >= 0) return idx;
      }
      return -1;
    };
    
    const weightCol = findCol(['weight']);
    const bodyFatCol = findCol(['bodyfat', 'fat']);
    const leanMassCol = findCol(['leanmass', 'lean']);
    const pullupsCol = findCol(['pullup']);
    const benchCol = findCol(['bench']);
    
    // Find last values (they may be in different rows)
    let lastWeight = null;
    let lastBodyFat = null;
    let lastLeanMass = null;
    let lastPullups = null;
    let lastBench = null;
    
    for (let i = data.length - 1; i >= 1; i--) {
      const row = data[i];
      
      if (lastWeight === null && weightCol >= 0 && row[weightCol]) {
        lastWeight = parseFloat(row[weightCol]);
      }
      if (lastBodyFat === null && bodyFatCol >= 0 && row[bodyFatCol]) {
        lastBodyFat = parseFloat(row[bodyFatCol]);
      }
      if (lastLeanMass === null && leanMassCol >= 0 && row[leanMassCol]) {
        lastLeanMass = parseFloat(row[leanMassCol]);
      }
      if (lastPullups === null && pullupsCol >= 0 && row[pullupsCol]) {
        lastPullups = parseInt(row[pullupsCol]);
      }
      if (lastBench === null && benchCol >= 0 && row[benchCol]) {
        lastBench = parseFloat(row[benchCol]);
      }
      
      // If found all - exit
      if (lastWeight !== null && lastBodyFat !== null && lastLeanMass !== null) {
        break;
      }
    }
    
    // If weight not found in Daily - get from ClientProfile
    if (lastWeight === null) {
      const profileSheet = ss.getSheetByName('ClientProfile');
      if (profileSheet) {
        const profileData = profileSheet.getDataRange().getValues();
        for (let i = 0; i < profileData.length; i++) {
          const key = String(profileData[i][0]).toLowerCase().trim();
          if (key === 'weight') {
            const val = profileData[i][1];
            if (val) lastWeight = parseFloat(val);
            break;
          }
        }
      }
    }
    
    return {
      weight: lastWeight,
      bodyFat: lastBodyFat,
      leanMass: lastLeanMass,
      pullups: lastPullups,
      bench: lastBench
    };
    
  } catch (error) {
    return { error: error.toString() };
  }
}

/**
 * Save mandatory task log
 */
function saveMandatoryTaskLog(clientId, params) {
  try {
    const ss = getClientSpreadsheet(clientId);
    let sheet = ss.getSheetByName('MandatoryTaskLog');
    
    if (!sheet) {
      sheet = ss.insertSheet('MandatoryTaskLog');
      sheet.appendRow(['Date', 'TaskId', 'TaskName', 'Completed', 'Notes']);
      sheet.getRange(1, 1, 1, 5).setFontWeight('bold').setBackground('#4caf50').setFontColor('#fff');
    }
    
    const date = params.date || formatDate(new Date());
    const tasks = params.tasks || [];
    
    //   JSON string
    let taskList = tasks;
    if (typeof tasks === 'string') {
      try {
        taskList = JSON.parse(tasks);
      } catch (e) {
        taskList = [];
      }
    }
    
    //
    for (const task of taskList) {
      sheet.appendRow([
        date,
        task.taskId || '',
        task.taskName || '',
        true,
        ''
      ]);
    }
    
    return { success: true, date, count: taskList.length };
    
  } catch (error) {
    return { error: error.toString() };
  }
}

/**
 *    
 */
function saveNutritionData(clientId, params) {
  try {
    const ss = getClientSpreadsheet(clientId);
    let sheet = ss.getSheetByName('ActualNutrition');
    
    if (!sheet) {
      sheet = ss.insertSheet('ActualNutrition');
      sheet.appendRow(['Date', 'Calories', 'Protein', 'Fats', 'Carbs', 'Notes']);
      sheet.getRange(1, 1, 1, 6).setFontWeight('bold').setBackground('#ff9800').setFontColor('#fff');
    }
    
    const date = params.date || formatDate(new Date());
    const data = sheet.getDataRange().getValues();
    const headers = data[0];
    
    // Find column indices
    const dateCol = headers.findIndex(h => h.toLowerCase().includes('date'));
    const calCol = headers.findIndex(h => h.toLowerCase().includes('calor'));
    const protCol = headers.findIndex(h => h.toLowerCase().includes('protein'));
    const fatCol = headers.findIndex(h => h.toLowerCase().includes('fat'));
    const carbCol = headers.findIndex(h => h.toLowerCase().includes('carb'));
    
    // Check if row for this date exists
    let rowIndex = -1;
    let existingCal = 0, existingProt = 0, existingFat = 0, existingCarb = 0;
    
    for (let i = 1; i < data.length; i++) {
      const rowDate = formatDate(data[i][dateCol]);
      if (rowDate === date) {
        rowIndex = i + 1;
        existingCal = parseFloat(data[i][calCol]) || 0;
        existingProt = parseFloat(data[i][protCol]) || 0;
        existingFat = parseFloat(data[i][fatCol]) || 0;
        existingCarb = parseFloat(data[i][carbCol]) || 0;
        break;
      }
    }
    
    // Add to existing or create new
    const newCal = existingCal + (parseFloat(params.calories) || 0);
    const newProt = existingProt + (parseFloat(params.protein) || 0);
    const newFat = existingFat + (parseFloat(params.fats) || 0);
    const newCarb = existingCarb + (parseFloat(params.carbs) || 0);
    
    if (rowIndex > 0) {
      // Update existing row
      if (calCol >= 0) sheet.getRange(rowIndex, calCol + 1).setValue(newCal);
      if (protCol >= 0) sheet.getRange(rowIndex, protCol + 1).setValue(newProt);
      if (fatCol >= 0) sheet.getRange(rowIndex, fatCol + 1).setValue(newFat);
      if (carbCol >= 0) sheet.getRange(rowIndex, carbCol + 1).setValue(newCarb);
    } else {
      // Add new row
      sheet.appendRow([date, newCal, newProt, newFat, newCarb, params.notes || '']);
    }
    
    return { 
      success: true, 
      date,
      totals: { calories: newCal, protein: newProt, fats: newFat, carbs: newCarb }
    };
    
  } catch (error) {
    return { error: error.toString() };
  }
}

/**
 *  
 */
function saveWarmup(clientId, params) {
  try {
    const ss = getClientSpreadsheet(clientId);
    let sheet = ss.getSheetByName('WarmupLog');
    
    if (!sheet) {
      sheet = ss.insertSheet('WarmupLog');
      sheet.appendRow(['Date', 'Completed', 'Exercises', 'Duration', 'Notes']);
      sheet.getRange(1, 1, 1, 5).setFontWeight('bold').setBackground('#9c27b0').setFontColor('#fff');
    }
    
    const date = params.date || formatDate(new Date());
    const data = sheet.getDataRange().getValues();
    
    // Check if already logged today
    for (let i = 1; i < data.length; i++) {
      if (formatDate(data[i][0]) === date) {
        // Update existing
        sheet.getRange(i + 1, 2).setValue(params.completed ? 'TRUE' : 'FALSE');
        sheet.getRange(i + 1, 3).setValue(params.exercises || '');
        sheet.getRange(i + 1, 4).setValue(params.duration || '');
        sheet.getRange(i + 1, 5).setValue(params.notes || '');
        return { success: true, date, updated: true };
      }
    }
    
    // Add new row
    sheet.appendRow([
      date,
      params.completed ? 'TRUE' : 'FALSE',
      params.exercises || '',
      params.duration || '',
      params.notes || ''
    ]);
    
    return { success: true, date };
    
  } catch (error) {
    return { error: error.toString() };
  }
}

/**
 *   
 */
function saveMeasurements(clientId, params) {
  try {
    const ss = getClientSpreadsheet(clientId);
    let sheet = ss.getSheetByName('Measurements');
    
    if (!sheet) {
      sheet = ss.insertSheet('Measurements');
      sheet.appendRow(['Date', 'Chest', 'Waist', 'Hips', 'Bicep', 'Thigh', 'Calf', 'Notes']);
      sheet.getRange(1, 1, 1, 8).setFontWeight('bold').setBackground('#2196f3').setFontColor('#fff');
    }
    
    const date = params.date || formatDate(new Date());
    
    // Add new measurement row
    sheet.appendRow([
      date,
      params.chest || '',
      params.waist || '',
      params.hips || '',
      params.bicep || '',
      params.thigh || '',
      params.calf || '',
      params.notes || ''
    ]);
    
    return { success: true, date };
    
  } catch (error) {
    return { error: error.toString() };
  }
}

/**
 *     
 */
function getWarmupExercises(clientId) {
  try {
    const ss = getClientSpreadsheet(clientId);
    const sheet = ss.getSheetByName('WarmupExercises');
    
    if (!sheet) {
      // Return default exercises
      return {
        exercises: [
          { id: 1, name: '', duration: 60, unit: '' },
          { id: 2, name: '', reps: 20, unit: '' },
          { id: 3, name: '', reps: 15, unit: '' },
          { id: 4, name: '', duration: 30, unit: '' },
          { id: 5, name: '', reps: 10, unit: ' ' }
        ]
      };
    }
    
    const data = sheet.getDataRange().getValues();
    const exercises = [];
    
    for (let i = 1; i < data.length; i++) {
      if (data[i][0]) {
        exercises.push({
          id: i,
          name: data[i][0],
          duration: data[i][1] || null,
          reps: data[i][2] || null,
          unit: data[i][3] || '',
          description: data[i][4] || ''
        });
      }
    }
    
    return { exercises };
    
  } catch (error) {
    return { error: error.toString() };
  }
}

/**
 *   
 */
function getMeasurementsHistory(clientId, limit = 10) {
  try {
    const ss = getClientSpreadsheet(clientId);
    const sheet = ss.getSheetByName('Measurements');
    
    if (!sheet) {
      return { measurements: [] };
    }
    
    const data = sheet.getDataRange().getValues();
    const measurements = [];
    
    for (let i = Math.max(1, data.length - limit); i < data.length; i++) {
      measurements.push({
        date: formatDate(data[i][0]),
        chest: data[i][1] || null,
        waist: data[i][2] || null,
        hips: data[i][3] || null,
        bicep: data[i][4] || null,
        thigh: data[i][5] || null,
        calf: data[i][6] || null
      });
    }
    
    return { measurements: measurements.reverse() };
    
  } catch (error) {
    return { error: error.toString() };
  }
}


//
// OFFLINE DASHBOARD  v6.2
//

/**
 *  endpoint    
 *      
 */
function getOfflineDashboard(clientId) {
  const ss = getClientSpreadsheet(clientId);
  if (!ss) {
    return { error: 'Client not found', clientId };
  }
  
  // 1.  
  const profile = getDashboardProfile(ss);
  
  // 2.  
  const goals = getDashboardGoals(ss);
  
  // 3.   
  const currentBlock = getDashboardCurrentBlock(ss);
  
  // 4.   
  const mandatoryStats = getDashboardMandatoryStats(ss, currentBlock.blockId);
  
  // 5.   (5)
  const recentSessions = getDashboardRecentSessions(ss, 5);
  
  // 6.    
  const exerciseProgress = getDashboardExerciseProgress(ss, currentBlock.blockId);
  
  // 7.     (Heatmap)
  const muscleHeatmap = getDashboardMuscleHeatmap(ss, currentBlock.blockId);
  
  // 8.  
  const personalRecords = getDashboardPersonalRecords(ss);
  
  return {
    success: true,
    clientId,
    generatedAt: new Date().toISOString(),
    profile,
    goals,
    currentBlock,
    mandatoryStats,
    recentSessions,
    exerciseProgress,
    muscleHeatmap,
    personalRecords
  };
}

function getDashboardProfile(ss) {
  //   ClientProfile
  const profileSheet = ss.getSheetByName('ClientProfile');
  const profile = {};
  
  if (profileSheet) {
    const data = profileSheet.getDataRange().getValues();
    for (let i = 1; i < data.length; i++) {
      const key = String(data[i][0]).trim();
      const value = data[i][1];
      if (key) profile[key] = value;
    }
  }
  
  //      ClientProfile,  Goals
  let clientName = profile.name || profile.client_name || '';
  
  if (!clientName) {
    const goalsSheet = ss.getSheetByName('Goals');
    if (goalsSheet) {
      const goalsData = goalsSheet.getDataRange().getValues();
      for (let i = 1; i < goalsData.length; i++) {
        const key = String(goalsData[i][0]).trim();
        if (key === 'client_name' || key === 'clientName') {
          clientName = goalsData[i][1];
          break;
        }
      }
    }
  }
  
  return {
    name: clientName || '',
    weight: parseFloat(profile.weight) || null,
    height: parseFloat(profile.height) || null,
    gender: profile.gender || 'male',
    fitnessLevel: profile.fitnessLevel || profile.fitness_level || 'intermediate',
    clientType: profile.clientType || profile.client_type || 'offline'
  };
}

function getDashboardGoals(ss) {
  const sheet = ss.getSheetByName('Goals');
  if (!sheet) return {};
  
  const data = sheet.getDataRange().getValues();
  const goals = {};
  
  for (let i = 1; i < data.length; i++) {
    const key = String(data[i][0]).trim();
    const value = data[i][1];
    if (key) goals[key] = value;
  }
  
  return {
    clientName: goals.client_name || goals.clientName || '',
    mainGoals: goals.main_goals || goals.mainGoals || '',
    trainingSystem: goals.training_system || goals.trainingSystem || 'fullbody',
    daysPerWeek: parseInt(goals.days_per_week) || 3,
    specialConditions: goals.special_conditions || '',
    startDate: goals.start_date || '',
    splitSchedule: goals.split_schedule || ''
  };
}

function getDashboardCurrentBlock(ss) {
  const sheet = ss.getSheetByName('TrainingBlocks');
  if (!sheet) return { blockId: null, status: 'none' };
  
  const data = sheet.getDataRange().getValues();
  if (data.length < 2) return { blockId: null, status: 'none' };
  
  const headers = data[0].map(h => String(h).toLowerCase().trim());
  const cols = {
    blockId: headers.indexOf('blockid'),
    totalSessions: headers.indexOf('totalsessions'),
    usedSessions: headers.indexOf('usedsessions'),
    status: headers.indexOf('status'),
    startDate: headers.indexOf('startdate'),
    notes: headers.indexOf('notes')
  };
  
  //
  for (let i = data.length - 1; i >= 1; i--) {
    const row = data[i];
    const status = cols.status >= 0 ? String(row[cols.status]).toLowerCase() : '';
    
    if (status === 'active') {
      const total = cols.totalSessions >= 0 ? parseInt(row[cols.totalSessions]) || 0 : 0;
      const used = cols.usedSessions >= 0 ? parseInt(row[cols.usedSessions]) || 0 : 0;
      
      return {
        blockId: cols.blockId >= 0 ? row[cols.blockId] : i,
        totalSessions: total,
        usedSessions: used,
        remaining: total - used,
        progress: total > 0 ? Math.round((used / total) * 100) : 0,
        status: 'active',
        startDate: cols.startDate >= 0 ? formatDateSafe(row[cols.startDate]) : '',
        notes: cols.notes >= 0 ? row[cols.notes] : ''
      };
    }
  }
  
  return { blockId: null, status: 'none', remaining: 0 };
}

function getDashboardMandatoryStats(ss, blockId) {
  const tasksSheet = ss.getSheetByName('MandatoryTasks');
  const logSheet = ss.getSheetByName('MandatoryTaskLog');
  
  if (!tasksSheet) return { tasks: [], completionRate: 0 };
  
  const tasksData = tasksSheet.getDataRange().getValues();
  const tasks = [];
  
  //
  const taskHeaders = tasksData[0].map(h => String(h).toLowerCase().trim());
  const taskCols = {
    id: taskHeaders.indexOf('id'),
    name: taskHeaders.indexOf('name'),
    type: taskHeaders.indexOf('type'),
    target: taskHeaders.indexOf('target'),
    active: taskHeaders.indexOf('active')
  };
  
  for (let i = 1; i < tasksData.length; i++) {
    const row = tasksData[i];
    const isActive = taskCols.active >= 0 ? row[taskCols.active] : true;
    
    if (isActive === true || isActive === 'TRUE' || isActive === 1 || String(isActive).toLowerCase() === 'true') {
      tasks.push({
        id: taskCols.id >= 0 ? row[taskCols.id] : i,
        name: taskCols.name >= 0 ? row[taskCols.name] : '',
        type: taskCols.type >= 0 ? row[taskCols.type] : '',
        target: taskCols.target >= 0 ? row[taskCols.target] : '',
        completed: 0,
        total: 0
      });
    }
  }
  
  //     ( )
  if (logSheet && blockId) {
    const logData = logSheet.getDataRange().getValues();
    if (logData.length > 1) {
      const logHeaders = logData[0].map(h => String(h).toLowerCase().trim());
      const logCols = {
        taskId: logHeaders.indexOf('taskid'),
        blockId: logHeaders.indexOf('blockid'),
        completed: logHeaders.indexOf('completed')
      };
      
      for (let i = 1; i < logData.length; i++) {
        const row = logData[i];
        const rowBlockId = logCols.blockId >= 0 ? row[logCols.blockId] : null;
        const taskId = logCols.taskId >= 0 ? row[logCols.taskId] : null;
        const completed = logCols.completed >= 0 ? row[logCols.completed] : false;
        
        if (String(rowBlockId) === String(blockId)) {
          const task = tasks.find(t => String(t.id) === String(taskId));
          if (task) {
            task.total++;
            if (completed === true || completed === 'TRUE' || completed === 1 || String(completed).toLowerCase() === 'true') {
              task.completed++;
            }
          }
        }
      }
    }
  }
  
  //
  const totalCompleted = tasks.reduce((sum, t) => sum + t.completed, 0);
  const totalExpected = tasks.reduce((sum, t) => sum + t.total, 0);
  const completionRate = totalExpected > 0 ? Math.round((totalCompleted / totalExpected) * 100) : 0;
  
  return {
    tasks,
    completionRate,
    totalCompleted,
    totalExpected
  };
}

function getDashboardRecentSessions(ss, limit) {
  const sessionsSheet = ss.getSheetByName('WorkoutSessions');
  const logSheet = ss.getSheetByName('WorkoutLog');
  
  if (!sessionsSheet) return [];
  
  const sessData = sessionsSheet.getDataRange().getValues();
  if (sessData.length < 2) return [];
  
  // Parse session headers
  const sessHeaders = sessData[0].map(h => String(h).toLowerCase().trim());
  const sessCols = {
    sessionId: sessHeaders.indexOf('sessionid'),
    date: sessHeaders.indexOf('date'),
    type: sessHeaders.indexOf('type'),
    splitType: sessHeaders.indexOf('splittype'),
    duration: sessHeaders.indexOf('duration'),
    exerciseCount: sessHeaders.indexOf('exercisecount'),
    totalSets: sessHeaders.indexOf('totalsets'),
    totalVolume: sessHeaders.indexOf('totalvolume'),
    effectiveVolume: sessHeaders.indexOf('effectivevolume'),
    rating: sessHeaders.indexOf('rating'),
    notes: sessHeaders.indexOf('notes')
  };
  
  // Collect sessions (newest first)
  const sessions = [];
  const sessionIds = new Set();
  
  for (let i = sessData.length - 1; i >= 1 && sessions.length < limit; i--) {
    const row = sessData[i];
    const sessionId = sessCols.sessionId >= 0 ? row[sessCols.sessionId] : '';
    
    if (!sessionId) continue;
    
    sessionIds.add(String(sessionId));
    
    sessions.push({
      sessionId: sessionId,
      date: sessCols.date >= 0 ? formatDateSafe(row[sessCols.date]) : '',
      type: sessCols.type >= 0 ? row[sessCols.type] : '',
      splitType: sessCols.splitType >= 0 ? row[sessCols.splitType] : '',
      duration: sessCols.duration >= 0 ? parseInt(row[sessCols.duration]) || 0 : 0,
      exerciseCount: sessCols.exerciseCount >= 0 ? parseInt(row[sessCols.exerciseCount]) || 0 : 0,
      totalSets: sessCols.totalSets >= 0 ? parseInt(row[sessCols.totalSets]) || 0 : 0,
      totalVolume: sessCols.totalVolume >= 0 ? parseFloat(row[sessCols.totalVolume]) || 0 : 0,
      effectiveVolume: sessCols.effectiveVolume >= 0 ? parseFloat(row[sessCols.effectiveVolume]) || 0 : 0,
      rating: sessCols.rating >= 0 ? parseFloat(row[sessCols.rating]) || 0 : 0,
      notes: sessCols.notes >= 0 ? row[sessCols.notes] : '',
      exercises: []
    });
  }
  
  //   WorkoutLog     
  if (!logSheet || sessions.length === 0) {
    return sessions;
  }
  
  // Load exercises from WorkoutLog
  const logData = logSheet.getDataRange().getValues();
  if (logData.length < 2) return sessions;
  
  const logHeaders = logData[0].map(h => String(h).toLowerCase().trim());
  const logCols = {
    sessionId: logHeaders.indexOf('sessionid'),
    order: logHeaders.indexOf('order'),
    exerciseId: logHeaders.indexOf('exerciseid'),
    exerciseName: logHeaders.indexOf('exercisename'),
    setType: logHeaders.indexOf('settype'),
    weight: logHeaders.indexOf('weight'),
    reps: logHeaders.indexOf('reps')
  };
  
  // Group sets: { sessionId: { exerciseId: { name, order, sets[] } } }
  const sessionExercises = {};
  
  for (let i = 1; i < logData.length; i++) {
    const row = logData[i];
    const sessId = logCols.sessionId >= 0 ? String(row[logCols.sessionId]) : '';
    
    if (!sessionIds.has(sessId)) continue;
    
    const exerciseId = logCols.exerciseId >= 0 ? String(row[logCols.exerciseId]) : '';
    const exerciseName = logCols.exerciseName >= 0 ? row[logCols.exerciseName] : exerciseId;
    const order = logCols.order >= 0 ? parseInt(row[logCols.order]) || 999 : 999;
    const weight = logCols.weight >= 0 ? parseFloat(row[logCols.weight]) || 0 : 0;
    const reps = logCols.reps >= 0 ? parseInt(row[logCols.reps]) || 0 : 0;
    const setType = logCols.setType >= 0 ? String(row[logCols.setType]).toLowerCase() : 'work';
    
    if (!exerciseId) continue;
    
    if (!sessionExercises[sessId]) sessionExercises[sessId] = {};
    
    if (!sessionExercises[sessId][exerciseId]) {
      sessionExercises[sessId][exerciseId] = { id: exerciseId, name: exerciseName, order: order, sets: [] };
    }
    
    sessionExercises[sessId][exerciseId].sets.push({ weight, reps, setType });
  }
  
  // Build exercises for each session
  sessions.forEach(session => {
    const sessId = String(session.sessionId);
    const exercisesMap = sessionExercises[sessId] || {};
    
    session.exercises = Object.values(exercisesMap)
      .sort((a, b) => a.order - b.order)
      .map(ex => {
        const workSets = ex.sets.filter(s => !s.setType || s.setType === 'work' || s.setType === 'working');
        const setsCount = workSets.length || ex.sets.length;
        const maxWeight = Math.max(...(workSets.length ? workSets : ex.sets).map(s => s.weight), 0);
        const typicalReps = (workSets.length ? workSets : ex.sets)[0]?.reps || 0;
        
        return { name: ex.name, sets: setsCount, reps: typicalReps, weight: maxWeight };
      });
    
    if (!session.exerciseCount && session.exercises.length > 0) {
      session.exerciseCount = session.exercises.length;
    }
  });
  
  return sessions;
}

function getDashboardExerciseProgress(ss, blockId) {
  const logSheet = ss.getSheetByName('WorkoutLog');
  const sessionsSheet = ss.getSheetByName('WorkoutSessions');
  
  if (!logSheet) return { topExercises: [] };
  
  //
  const blockSessions = new Set();
  if (sessionsSheet && blockId) {
    const sessionsData = sessionsSheet.getDataRange().getValues();
    const sessHeaders = sessionsData[0].map(h => String(h).toLowerCase().trim());
    const blockIdCol = sessHeaders.indexOf('blockid');
    const sessionIdCol = sessHeaders.indexOf('sessionid');
    
    if (blockIdCol >= 0 && sessionIdCol >= 0) {
      for (let i = 1; i < sessionsData.length; i++) {
        if (String(sessionsData[i][blockIdCol]) === String(blockId)) {
          blockSessions.add(String(sessionsData[i][sessionIdCol]));
        }
      }
    }
  }
  
  const logData = logSheet.getDataRange().getValues();
  if (logData.length < 2) return { topExercises: [] };
  
  const headers = logData[0].map(h => String(h).toLowerCase().trim());
  const cols = {
    sessionId: headers.indexOf('sessionid'),
    exerciseId: headers.indexOf('exerciseid'),
    exerciseName: headers.indexOf('exercisename'),
    weight: headers.indexOf('weight'),
    reps: headers.indexOf('reps'),
    setType: headers.indexOf('settype'),
    date: headers.indexOf('date')
  };
  
  //
  const exerciseStats = {};
  
  for (let i = 1; i < logData.length; i++) {
    const row = logData[i];
    const sessionId = cols.sessionId >= 0 ? String(row[cols.sessionId]) : '';
    const setType = cols.setType >= 0 ? String(row[cols.setType]).toLowerCase() : 'work';
    
    //
    if (setType === 'warmup') continue;
    
    //   ,    
    if (blockId && blockSessions.size > 0 && !blockSessions.has(sessionId)) continue;
    
    const exerciseId = cols.exerciseId >= 0 ? row[cols.exerciseId] : '';
    const exerciseName = cols.exerciseName >= 0 ? row[cols.exerciseName] : exerciseId;
    const weight = cols.weight >= 0 ? parseFloat(row[cols.weight]) || 0 : 0;
    const date = cols.date >= 0 ? formatDateSafe(row[cols.date]) : '';
    
    if (!exerciseId || weight === 0) continue;
    
    if (!exerciseStats[exerciseId]) {
      exerciseStats[exerciseId] = {
        id: exerciseId,
        name: exerciseName,
        firstWeight: weight,
        firstDate: date,
        lastWeight: weight,
        lastDate: date,
        maxWeight: weight,
        sets: 0
      };
    }
    
    const stat = exerciseStats[exerciseId];
    stat.sets++;
    stat.lastWeight = weight;
    stat.lastDate = date;
    if (weight > stat.maxWeight) stat.maxWeight = weight;
  }
  
  //     ( )
  const sorted = Object.values(exerciseStats)
    .filter(ex => ex.sets >= 3)  //  3 
    .sort((a, b) => b.sets - a.sets)
    .slice(0, 5)
    .map(ex => ({
      ...ex,
      progress: ex.firstWeight > 0 
        ? Math.round(((ex.lastWeight - ex.firstWeight) / ex.firstWeight) * 100) 
        : 0,
      progressKg: Math.round((ex.lastWeight - ex.firstWeight) * 10) / 10
    }));
  
  return { topExercises: sorted };
}

function getDashboardMuscleHeatmap(ss, blockId) {
  const logSheet = ss.getSheetByName('WorkoutLog');
  const sessionsSheet = ss.getSheetByName('WorkoutSessions');
  
  if (!logSheet) return { muscles: {} };
  
  //
  const exercisesMap = getExerciseMuscleCoefficients();
  
  //
  const blockSessions = new Set();
  if (sessionsSheet && blockId) {
    const sessionsData = sessionsSheet.getDataRange().getValues();
    const sessHeaders = sessionsData[0].map(h => String(h).toLowerCase().trim());
    const blockIdCol = sessHeaders.indexOf('blockid');
    const sessionIdCol = sessHeaders.indexOf('sessionid');
    
    if (blockIdCol >= 0 && sessionIdCol >= 0) {
      for (let i = 1; i < sessionsData.length; i++) {
        if (String(sessionsData[i][blockIdCol]) === String(blockId)) {
          blockSessions.add(String(sessionsData[i][sessionIdCol]));
        }
      }
    }
  }
  
  const logData = logSheet.getDataRange().getValues();
  if (logData.length < 2) return { muscles: {} };
  
  const headers = logData[0].map(h => String(h).toLowerCase().trim());
  const cols = {
    sessionId: headers.indexOf('sessionid'),
    exerciseId: headers.indexOf('exerciseid'),
    setType: headers.indexOf('settype'),
    weight: headers.indexOf('weight'),
    reps: headers.indexOf('reps')
  };
  
  // Muscle names mapping
  const muscleNames = {
    chest: 'Chest',
    lats: 'Lats',
    traps: 'Traps',
    low_back: 'Lower back',
    front_delt: 'Front delt',
    mid_delt: 'Mid delt',
    rear_delt: 'Rear delt',
    biceps: 'Biceps',
    triceps: 'Triceps',
    quads: 'Quads',
    hamstrings: 'Hamstrings',
    glutes: 'Glutes',
    calves: 'Calves',
    core: 'Core'
  };
  
  const muscles = {};
  for (const [key, name] of Object.entries(muscleNames)) {
    muscles[key] = { name: name, sets: 0, volume: 0 };
  }
  
  //
  for (let i = 1; i < logData.length; i++) {
    const row = logData[i];
    const sessionId = cols.sessionId >= 0 ? String(row[cols.sessionId]) : '';
    const setType = cols.setType >= 0 ? String(row[cols.setType]).toLowerCase() : 'work';
    
    //
    if (setType === 'warmup') continue;
    
    //
    if (blockId && blockSessions.size > 0 && !blockSessions.has(sessionId)) continue;
    
    const exerciseId = cols.exerciseId >= 0 ? String(row[cols.exerciseId]) : '';
    const weight = cols.weight >= 0 ? parseFloat(row[cols.weight]) || 0 : 0;
    const reps = cols.reps >= 0 ? parseInt(row[cols.reps]) || 0 : 0;
    const volume = weight * reps;
    
    //
    const coefficients = exercisesMap[exerciseId] || {};
    
    //
    for (const [muscleKey, coef] of Object.entries(coefficients)) {
      if (coef > 0 && muscles[muscleKey]) {
        muscles[muscleKey].sets += coef;  //  
        muscles[muscleKey].volume += volume * coef;
      }
    }
  }
  
  //
  for (const muscle of Object.values(muscles)) {
    muscle.sets = Math.round(muscle.sets * 10) / 10;
    muscle.volume = Math.round(muscle.volume);
  }
  
  //
  const maxSets = Math.max(...Object.values(muscles).map(m => m.sets), 1);
  
  return { 
    muscles: muscles, 
    maxSets: maxSets,
    blockId: blockId || 'all'
  };
}

/**
 *     exercises_master
 */
function getExerciseMuscleCoefficients() {
  try {
    const masterSS = SpreadsheetApp.getActiveSpreadsheet();
    const sheet = masterSS.getSheetByName('exercises_master');
    
    if (!sheet) return {};
    
    const data = sheet.getDataRange().getValues();
    const headers = data[0].map(h => String(h).toLowerCase().trim());
    
    // Muscle column name mappings (try both English and Russian)
    const muscleMapping = {
      'chest': 'chest',
      'lats': 'lats',
      'traps': 'traps',
      'low_back': 'low_back',
      'lower back': 'low_back',
      'front_delt': 'front_delt',
      'front delt': 'front_delt',
      'mid_delt': 'mid_delt',
      'mid delt': 'mid_delt',
      'rear_delt': 'rear_delt',
      'rear delt': 'rear_delt',
      'biceps': 'biceps',
      'triceps': 'triceps',
      'quads': 'quads',
      'hamstrings': 'hamstrings',
      'glutes': 'glutes',
      'calves': 'calves',
      'core': 'core'
    };
    
    //
    const muscleCols = {};
    for (const [ruName, enKey] of Object.entries(muscleMapping)) {
      const idx = headers.indexOf(ruName);
      if (idx >= 0) muscleCols[enKey] = idx;
    }
    
    const idCol = headers.indexOf('id');
    const exercisesMap = {};
    
    for (let i = 1; i < data.length; i++) {
      const row = data[i];
      const id = idCol >= 0 ? String(row[idCol]) : '';
      
      if (!id) continue;
      
      const coefficients = {};
      for (const [enKey, colIdx] of Object.entries(muscleCols)) {
        const val = parseFloat(row[colIdx]) || 0;
        if (val > 0) coefficients[enKey] = val;
      }
      
      if (Object.keys(coefficients).length > 0) {
        exercisesMap[id] = coefficients;
      }
    }
    
    return exercisesMap;
  } catch (e) {
    Logger.log('Error loading muscle coefficients: ' + e.toString());
    return {};
  }
}

function getDashboardPersonalRecords(ss) {
  const logSheet = ss.getSheetByName('WorkoutLog');
  if (!logSheet) return { records: [] };
  
  const data = logSheet.getDataRange().getValues();
  if (data.length < 2) return { records: [] };
  
  const headers = data[0].map(h => String(h).toLowerCase().trim());
  const cols = {
    exerciseId: headers.indexOf('exerciseid'),
    exerciseName: headers.indexOf('exercisename'),
    weight: headers.indexOf('weight'),
    reps: headers.indexOf('reps'),
    date: headers.indexOf('date')
  };
  
  const records = {};
  
  for (let i = 1; i < data.length; i++) {
    const row = data[i];
    const exerciseId = cols.exerciseId >= 0 ? String(row[cols.exerciseId]) : '';
    const exerciseName = cols.exerciseName >= 0 ? row[cols.exerciseName] : exerciseId;
    const weight = cols.weight >= 0 ? parseFloat(row[cols.weight]) || 0 : 0;
    const reps = cols.reps >= 0 ? parseInt(row[cols.reps]) || 0 : 0;
    const date = cols.date >= 0 ? formatDateSafe(row[cols.date]) : '';
    
    if (!exerciseId || weight === 0) continue;
    
    // Estimated 1RM = weight  (1 + reps/30)
    const estimated1RM = weight * (1 + reps / 30);
    
    if (!records[exerciseId] || estimated1RM > records[exerciseId].estimated1RM) {
      records[exerciseId] = {
        id: exerciseId,
        name: exerciseName,
        weight: weight,
        reps: reps,
        estimated1RM: Math.round(estimated1RM * 10) / 10,
        date: date
      };
    }
  }
  
  // -5   estimated 1RM
  const sorted = Object.values(records)
    .sort((a, b) => b.estimated1RM - a.estimated1RM)
    .slice(0, 5);
  
  return { records: sorted };
}

/**
 *   
 */
function formatDateSafe(date) {
  if (!date) return '';
  try {
    if (date instanceof Date) {
      return Utilities.formatDate(date, Session.getScriptTimeZone(), 'yyyy-MM-dd');
    }
    const str = String(date);
    if (str.includes('T')) {
      return str.split('T')[0];
    }
    return str;
  } catch (e) {
    return String(date);
  }
}

//
// OFFLINE DASHBOARD V2 FUNCTIONS  Period-based analytics
//

/**
 * Updated endpoint    
 * Supports parameter period: 'block', '3m', 'all'
 */
function getOfflineDashboardV2(clientId, period) {
  const ss = getClientSpreadsheet(clientId);
  if (!ss) {
    return { error: 'Client not found', clientId };
  }
  
  period = period || 'block';
  
  // 1. Client profile
  const profile = getDashboardProfile(ss);
  
  // 2. Client goals
  const goals = getDashboardGoals(ss);
  
  // 3. Current block 
  const currentBlock = getDashboardCurrentBlock(ss);
  
  // 4. Mandatory tasks stats
  const mandatoryStats = getDashboardMandatoryStats(ss, currentBlock.blockId);
  
  // 5. ALL workouts (for history and charts)
  const allSessions = getDashboardAllSessions(ss);
  
  // 6. Recent workouts WITH EXERCISES (using getDashboardRecentSessions)
  const recentSessions = getDashboardRecentSessions(ss, 5);
  
  // 7. Exercise progress with dates (only improvements)
  const exerciseProgress = getDashboardExerciseProgressV2(ss, period, currentBlock.blockId);
  
  // 8. Load distribution by muscle groups
  const muscleLoad = getDashboardMuscleLoadGrouped(ss, period, currentBlock.blockId);
  
  // 9. Week comparison
  const weeklyComparison = getDashboardWeeklyComparison(allSessions);
  
  // 10. All records (  )
  const allRecords = getDashboardAllRecords(ss);
  
  return {
    success: true,
    clientId,
    period,
    generatedAt: new Date().toISOString(),
    profile,
    goals,
    currentBlock,
    mandatoryStats,
    recentSessions,
    allSessions,
    exerciseProgress,
    muscleLoad,
    weeklyComparison,
    allRecords
  };
}

/**
 *  ALL workouts    
 */
function getDashboardAllSessions(ss) {
  const sheet = ss.getSheetByName('WorkoutSessions');
  if (!sheet) return [];
  
  const data = sheet.getDataRange().getValues();
  if (data.length < 2) return [];
  
  const headers = data[0].map(h => String(h).toLowerCase().trim());
  const cols = {
    sessionId: headers.indexOf('sessionid'),
    date: headers.indexOf('date'),
    blockId: headers.indexOf('blockid'),
    type: headers.indexOf('type'),
    splitType: headers.indexOf('splittype'),
    duration: headers.indexOf('duration'),
    exerciseCount: headers.indexOf('exercisecount'),
    totalSets: headers.indexOf('totalsets'),
    totalVolume: headers.indexOf('totalvolume'),
    effectiveVolume: headers.indexOf('effectivevolume'),
    rating: headers.indexOf('rating'),
    notes: headers.indexOf('notes')
  };
  
  const sessions = [];
  
  for (let i = data.length - 1; i >= 1; i--) {
    const row = data[i];
    const sessionId = cols.sessionId >= 0 ? row[cols.sessionId] : '';
    if (!sessionId) continue;
    
    sessions.push({
      sessionId: sessionId,
      date: cols.date >= 0 ? formatDateSafe(row[cols.date]) : '',
      blockId: cols.blockId >= 0 ? row[cols.blockId] : '',
      type: cols.type >= 0 ? row[cols.type] : '',
      splitType: cols.splitType >= 0 ? row[cols.splitType] : '',
      duration: cols.duration >= 0 ? parseInt(row[cols.duration]) || 0 : 0,
      exerciseCount: cols.exerciseCount >= 0 ? parseInt(row[cols.exerciseCount]) || 0 : 0,
      totalSets: cols.totalSets >= 0 ? parseInt(row[cols.totalSets]) || 0 : 0,
      totalVolume: cols.totalVolume >= 0 ? parseFloat(row[cols.totalVolume]) || 0 : 0,
      effectiveVolume: cols.effectiveVolume >= 0 ? parseFloat(row[cols.effectiveVolume]) || 0 : 0,
      rating: cols.rating >= 0 ? parseFloat(row[cols.rating]) || 0 : 0,
      notes: cols.notes >= 0 ? row[cols.notes] : ''
    });
  }
  
  return sessions;
}

/**
 * Exercise progress   ( )
 */
function getDashboardExerciseProgressV2(ss, period, currentBlockId) {
  const logSheet = ss.getSheetByName('WorkoutLog');
  const sessionsSheet = ss.getSheetByName('WorkoutSessions');
  
  if (!logSheet) return { improvements: [] };
  
  // Determine date range
  const periodDates = getPeriodDateRange(period, currentBlockId, sessionsSheet);
  
  // Get sessions in range
  const validSessions = getSessionsInPeriod(sessionsSheet, periodDates, currentBlockId, period);
  
  // Collect exercise data
  const logData = logSheet.getDataRange().getValues();
  const logHeaders = logData[0].map(h => String(h).toLowerCase().trim());
  const logCols = {
    sessionId: logHeaders.indexOf('sessionid'),
    exerciseId: logHeaders.indexOf('exerciseid'),
    exerciseName: logHeaders.indexOf('exercisename'),
    weight: logHeaders.indexOf('weight'),
    reps: logHeaders.indexOf('reps'),
    setType: logHeaders.indexOf('settype')
  };
  
  // Group by exercises: {name: [{date, weight, reps}, ...]}
  const exerciseData = {};
  
  for (let i = 1; i < logData.length; i++) {
    const row = logData[i];
    const sessionId = logCols.sessionId >= 0 ? String(row[logCols.sessionId]) : '';
    const setType = logCols.setType >= 0 ? String(row[logCols.setType]).toLowerCase() : '';
    
    // Only work sets from valid sessions
    if (!validSessions[sessionId] || setType === 'warmup') continue;
    
    const name = logCols.exerciseName >= 0 ? row[logCols.exerciseName] : '';
    const weight = logCols.weight >= 0 ? parseFloat(row[logCols.weight]) || 0 : 0;
    const reps = logCols.reps >= 0 ? parseInt(row[logCols.reps]) || 0 : 0;
    
    if (!name || weight <= 0) continue;
    
    if (!exerciseData[name]) {
      exerciseData[name] = [];
    }
    
    exerciseData[name].push({
      date: validSessions[sessionId],
      weight,
      reps
    });
  }
  
  // Find improvements (   > )
  const improvements = [];
  
  for (const [name, records] of Object.entries(exerciseData)) {
    if (records.length < 2) continue;
    
    // Sort by date
    records.sort((a, b) => new Date(a.date) - new Date(b.date));
    
    const firstWeight = records[0].weight;
    
    // Find max weight   
    let maxWeight = firstWeight;
    let maxDate = records[0].date;
    
    for (const r of records) {
      if (r.weight > maxWeight) {
        maxWeight = r.weight;
        maxDate = r.date;
      }
    }
    
    // Current (last) weight
    const currentWeight = records[records.length - 1].weight;
    const currentDate = records[records.length - 1].date;
    
    // Add only if  >=  (  )
    if (currentWeight >= maxWeight && currentWeight > firstWeight) {
      const progressKg = Math.round((currentWeight - firstWeight) * 10) / 10;
      const progressPercent = Math.round(((currentWeight - firstWeight) / firstWeight) * 100);
      
      improvements.push({
        name,
        firstWeight,
        currentWeight,
        maxWeight,
        progressKg,
        progressPercent,
        recordDate: maxDate,
        lastDate: currentDate
      });
    }
  }
  
  // Sort by percent 
  improvements.sort((a, b) => b.progressPercent - a.progressPercent);
  
  return {
    period,
    improvements: improvements.slice(0, 10)
  };
}

/**
 * Load distribution    
 */
function getDashboardMuscleLoadGrouped(ss, period, currentBlockId) {
  const logSheet = ss.getSheetByName('WorkoutLog');
  const sessionsSheet = ss.getSheetByName('WorkoutSessions');
  
  if (!logSheet) return { groups: {}, details: {} };
  
  // Determine range
  const periodDates = getPeriodDateRange(period, currentBlockId, sessionsSheet);
  const validSessions = getSessionsInPeriod(sessionsSheet, periodDates, currentBlockId, period);
  
  // Get muscle coefficients from exercises_master (if exists)
  const muscleCoeffs = getExerciseMuscleCoefficients();
  
  // Fallback mapping category -> muscles (English and Russian)
  const categoryToMuscles = {
    // English
    'back': { lats: 0.7, traps: 0.3 },
    'legs': { quads: 0.5, hamstrings: 0.3, glutes: 0.2 },
    'arms': { biceps: 0.5, triceps: 0.5 },
    'chest': { chest: 0.8, front_delt: 0.2 },
    'shoulders': { front_delt: 0.3, mid_delt: 0.5, rear_delt: 0.2 },
    'core': { core: 1.0 },
    'abs': { core: 1.0 },
    // Russian
    'key': { lats: 0.7, traps: 0.3 },
    'key': { quads: 0.5, hamstrings: 0.3, glutes: 0.2 },
    'key': { biceps: 0.5, triceps: 0.5 },
    'key': { chest: 0.8, front_delt: 0.2 },
    'key': { front_delt: 0.3, mid_delt: 0.5, rear_delt: 0.2 },
    'key': { core: 1.0 },
    'key': { core: 1.0 }
  };
  
  // Fallback by exercise name keywords
  function getCoeffsByName(name) {
    const n = name.toLowerCase();
    
    // Chest exercises
    if (n.includes('key') && (n.includes('key') || n.includes('key') || n.includes('key') || n.includes('key'))) {
      return { chest: 0.7, front_delt: 0.2, triceps: 0.1 };
    }
    if (n.includes('key') && n.includes('key')) {
      return { chest: 0.6, front_delt: 0.2, triceps: 0.2 };
    }
    if (n.includes('key')) {
      return { chest: 0.6, front_delt: 0.2, triceps: 0.2 };
    }
    if (n.includes('key') || n.includes('key')) {
      return { chest: 1.0 };
    }
    
    // Back exercises
    if (n.includes('key') && (n.includes('key') || n.includes('key'))) {
      return { lats: 0.8, biceps: 0.2 };
    }
    if (n.includes('key') && (n.includes('key') || n.includes('key') || n.includes('key'))) {
      return { lats: 0.6, traps: 0.2, biceps: 0.2 };
    }
    if (n.includes('key') && n.includes('key')) {
      return { lats: 0.7, traps: 0.1, biceps: 0.2 };
    }
    if (n.includes('key')) {
      return { lats: 0.7, biceps: 0.3 };
    }
    if (n.includes('key') || n.includes('key')) {
      return { low_back: 0.7, glutes: 0.3 };
    }
    
    // Shoulder exercises
    if (n.includes('key') && (n.includes('key') || n.includes('key') || n.includes('key'))) {
      return { front_delt: 0.5, mid_delt: 0.3, triceps: 0.2 };
    }
    if (n.includes('key') || n.includes('key') || n.includes('key') && n.includes('key')) {
      return { mid_delt: 0.8, rear_delt: 0.2 };
    }
    if (n.includes('key') && n.includes('key')) {
      return { rear_delt: 1.0 };
    }
    if (n.includes('key') && n.includes('key')) {
      return { rear_delt: 0.7, mid_delt: 0.3 };
    }
    
    // Leg exercises
    if (n.includes('key') || n.includes('key')) {
      return { quads: 0.5, glutes: 0.3, hamstrings: 0.2 };
    }
    if (n.includes('key') || n.includes('key')) {
      return { quads: 0.7, glutes: 0.3 };
    }
    if (n.includes('key') && n.includes('key')) {
      return { quads: 1.0 };
    }
    if (n.includes('key') && n.includes('key')) {
      return { hamstrings: 1.0 };
    }
    if (n.includes('key')) {
      return { quads: 0.4, glutes: 0.4, hamstrings: 0.2 };
    }
    if (n.includes('key') || n.includes('key') || n.includes('key')) {
      return { hamstrings: 0.6, glutes: 0.3, low_back: 0.1 };
    }
    if (n.includes('key') || n.includes('key') || n.includes('key')) {
      return { calves: 1.0 };
    }
    
    // Arm exercises
    if (n.includes('key') || n.includes('key') && n.includes('key')) {
      return { biceps: 1.0 };
    }
    if (n.includes('key') || n.includes('key') && n.includes('key')) {
      return { triceps: 1.0 };
    }
    if (n.includes('key')) {
      return { triceps: 1.0 };
    }
    
    // Core exercises
    if (n.includes('key') || n.includes('key') || n.includes('key')) {
      return { core: 1.0 };
    }
    
    // Generic fallback
    if (n.includes('key')) return { lats: 0.5, traps: 0.3, biceps: 0.2 };
    if (n.includes('key')) return { chest: 0.5, front_delt: 0.3, triceps: 0.2 };
    
    return {};
  }
  
  // Muscle groups definition
  const muscleGroups = {
    legs: {
      name: 'Legs',
      icon: 'leg',
      muscles: ['quads', 'hamstrings', 'glutes', 'calves'],
      labels: { quads: 'Quads', hamstrings: 'Hamstrings', glutes: 'Glutes', calves: 'Calves' }
    },
    back: {
      name: 'Back',
      icon: 'back',
      muscles: ['lats', 'traps', 'low_back'],
      labels: { lats: 'Lats', traps: 'Traps', low_back: 'Lower back' }
    },
    chest: {
      name: 'Chest',
      icon: 'chest',
      muscles: ['chest'],
      labels: { chest: 'Chest' }
    },
    arms: {
      name: 'Arms & Shoulders',
      icon: 'arms',
      muscles: ['biceps', 'triceps', 'front_delt', 'mid_delt', 'rear_delt'],
      labels: { biceps: 'Biceps', triceps: 'Triceps', front_delt: 'Front delt', mid_delt: 'Mid delt', rear_delt: 'Rear delt' }
    }
  };
  
  // Initialize counters
  const muscleSets = {};
  const muscleVolume = {};
  for (const group of Object.values(muscleGroups)) {
    for (const m of group.muscles) {
      muscleSets[m] = 0;
      muscleVolume[m] = 0;
    }
  }
  
  // Calculate load
  const logData = logSheet.getDataRange().getValues();
  const logHeaders = logData[0].map(h => String(h).toLowerCase().trim());
  const logCols = {
    sessionId: logHeaders.indexOf('sessionid'),
    exerciseId: logHeaders.indexOf('exerciseid'),
    exerciseName: logHeaders.indexOf('exercisename'),
    category: logHeaders.indexOf('category'),
    weight: logHeaders.indexOf('weight'),
    reps: logHeaders.indexOf('reps'),
    setType: logHeaders.indexOf('settype')
  };
  
  for (let i = 1; i < logData.length; i++) {
    const row = logData[i];
    const sessionId = logCols.sessionId >= 0 ? String(row[logCols.sessionId]) : '';
    const setType = logCols.setType >= 0 ? String(row[logCols.setType]).toLowerCase() : '';
    
    if (!validSessions[sessionId] || setType === 'warmup') continue;
    
    const exerciseId = logCols.exerciseId >= 0 ? String(row[logCols.exerciseId]).toLowerCase() : '';
    const exerciseName = logCols.exerciseName >= 0 ? String(row[logCols.exerciseName]) : '';
    const category = logCols.category >= 0 ? String(row[logCols.category]).toLowerCase().trim() : '';
    const weight = logCols.weight >= 0 ? parseFloat(row[logCols.weight]) || 0 : 0;
    const reps = logCols.reps >= 0 ? parseInt(row[logCols.reps]) || 0 : 0;
    
    // Find coefficients: 1) exercises_master, 2) category, 3) exercise name
    let coeffs = muscleCoeffs[exerciseId] || muscleCoeffs[exerciseName.toLowerCase()] || {};
    
    if (Object.keys(coeffs).length === 0) {
      coeffs = categoryToMuscles[category] || {};
    }
    
    if (Object.keys(coeffs).length === 0) {
      coeffs = getCoeffsByName(exerciseName);
    }
    
    // Distribute load
    for (const [muscle, coeff] of Object.entries(coeffs)) {
      if (coeff > 0 && muscleSets.hasOwnProperty(muscle)) {
        muscleSets[muscle] += coeff;
        muscleVolume[muscle] += weight * reps * coeff;
      }
    }
  }
  
  // Build result by groups
  const groups = {};
  let maxGroupSets = 0;
  
  for (const [groupKey, group] of Object.entries(muscleGroups)) {
    const totalSets = group.muscles.reduce((sum, m) => sum + muscleSets[m], 0);
    const totalVolume = group.muscles.reduce((sum, m) => sum + muscleVolume[m], 0);
    
    groups[groupKey] = {
      name: group.name,
      icon: group.icon,
      totalSets: Math.round(totalSets * 10) / 10,
      totalVolume: Math.round(totalVolume),
      muscles: {}
    };
    
    for (const m of group.muscles) {
      groups[groupKey].muscles[m] = {
        name: group.labels[m],
        sets: Math.round(muscleSets[m] * 10) / 10,
        volume: Math.round(muscleVolume[m])
      };
    }
    
    maxGroupSets = Math.max(maxGroupSets, totalSets);
  }
  
  return {
    period,
    groups,
    maxGroupSets: Math.round(maxGroupSets * 10) / 10
  };
}

/**
 *     
 */
function getDashboardWeeklyComparison(allSessions) {
  const now = new Date();
  const dayOfWeek = now.getDay();
  
  // Start of this week ()
  const thisWeekStart = new Date(now);
  thisWeekStart.setDate(now.getDate() - (dayOfWeek === 0 ? 6 : dayOfWeek - 1));
  thisWeekStart.setHours(0, 0, 0, 0);
  
  // Start of last week
  const lastWeekStart = new Date(thisWeekStart);
  lastWeekStart.setDate(lastWeekStart.getDate() - 7);
  
  // End of last week
  const lastWeekEnd = new Date(thisWeekStart);
  lastWeekEnd.setSeconds(lastWeekEnd.getSeconds() - 1);
  
  let thisWeek = { count: 0, volume: 0, sets: 0 };
  let lastWeek = { count: 0, volume: 0, sets: 0 };
  
  for (const s of allSessions) {
    const date = new Date(s.date);
    const volume = s.totalVolume || 0;
    const sets = s.totalSets || 0;
    
    if (date >= thisWeekStart) {
      thisWeek.count++;
      thisWeek.volume += volume;
      thisWeek.sets += sets;
    } else if (date >= lastWeekStart && date <= lastWeekEnd) {
      lastWeek.count++;
      lastWeek.volume += volume;
      lastWeek.sets += sets;
    }
  }
  
  const countChange = thisWeek.count - lastWeek.count;
  const volumeChange = lastWeek.volume > 0 
    ? Math.round(((thisWeek.volume - lastWeek.volume) / lastWeek.volume) * 100) 
    : (thisWeek.volume > 0 ? 100 : 0);
  
  return {
    thisWeek,
    lastWeek,
    changes: {
      count: countChange,
      volumePercent: volumeChange
    }
  };
}

/**
 * All records (  )
 */
function getDashboardAllRecords(ss) {
  const logSheet = ss.getSheetByName('WorkoutLog');
  const sessionsSheet = ss.getSheetByName('WorkoutSessions');
  
  if (!logSheet) return { weightRecords: [], repsRecords: [] };
  
  // Collect session data  
  const sessionDates = {};
  if (sessionsSheet) {
    const sessData = sessionsSheet.getDataRange().getValues();
    const sessHeaders = sessData[0].map(h => String(h).toLowerCase().trim());
    const sessionIdCol = sessHeaders.indexOf('sessionid');
    const dateCol = sessHeaders.indexOf('date');
    
    if (sessionIdCol >= 0 && dateCol >= 0) {
      for (let i = 1; i < sessData.length; i++) {
        sessionDates[String(sessData[i][sessionIdCol])] = formatDateSafe(sessData[i][dateCol]);
      }
    }
  }
  
  const logData = logSheet.getDataRange().getValues();
  const logHeaders = logData[0].map(h => String(h).toLowerCase().trim());
  const logCols = {
    sessionId: logHeaders.indexOf('sessionid'),
    exerciseName: logHeaders.indexOf('exercisename'),
    weight: logHeaders.indexOf('weight'),
    reps: logHeaders.indexOf('reps'),
    setType: logHeaders.indexOf('settype')
  };
  
  // Weight records: {name: {maxWeight, date, reps}}
  const weightRecords = {};
  // Reps records: {name: {maxReps, date, weight}}
  const repsRecords = {};
  
  for (let i = 1; i < logData.length; i++) {
    const row = logData[i];
    const sessionId = logCols.sessionId >= 0 ? String(row[logCols.sessionId]) : '';
    const setType = logCols.setType >= 0 ? String(row[logCols.setType]).toLowerCase() : '';
    
    if (setType === 'warmup') continue;
    
    const name = logCols.exerciseName >= 0 ? row[logCols.exerciseName] : '';
    const weight = logCols.weight >= 0 ? parseFloat(row[logCols.weight]) || 0 : 0;
    const reps = logCols.reps >= 0 ? parseInt(row[logCols.reps]) || 0 : 0;
    const date = sessionDates[sessionId] || '';
    
    if (!name || weight <= 0) continue;
    
    // Weight record
    if (!weightRecords[name] || weight > weightRecords[name].maxWeight) {
      weightRecords[name] = { name, maxWeight: weight, reps, date };
    }
    
    //    (   )
    if (!repsRecords[name] || reps > repsRecords[name].maxReps) {
      repsRecords[name] = { name, maxReps: reps, weight, date };
    }
  }
  
  // Convert to arrays  
  const weightList = Object.values(weightRecords)
    .sort((a, b) => b.maxWeight - a.maxWeight);
  
  const repsList = Object.values(repsRecords)
    .filter(r => r.maxReps >= 8) // Only significant records
    .sort((a, b) => b.maxReps - a.maxReps);
  
  return {
    weightRecords: weightList,
    repsRecords: repsList
  };
}

/**
 * Helper function: get date range  
 */
function getPeriodDateRange(period, currentBlockId, sessionsSheet) {
  const now = new Date();
  let startDate = null;
  
  switch (period) {
    case '3m':
      startDate = new Date(now);
      startDate.setMonth(startDate.getMonth() - 3);
      break;
    case 'all':
      startDate = new Date('2000-01-01');
      break;
    case 'block':
    default:
      // For block dates are determined   
      return { period, blockId: currentBlockId };
  }
  
  return {
    period,
    startDate: startDate ? startDate.toISOString().split('T')[0] : null
  };
}

/**
 * Helper function: get sessions in period
 * Returns {sessionId: date, ...}
 */
function getSessionsInPeriod(sessionsSheet, periodDates, currentBlockId, period) {
  const validSessions = {};
  const allSessions = {};
  
  if (!sessionsSheet) return validSessions;
  
  const data = sessionsSheet.getDataRange().getValues();
  const headers = data[0].map(h => String(h).toLowerCase().trim());
  const sessionIdCol = headers.indexOf('sessionid');
  const dateCol = headers.indexOf('date');
  const blockIdCol = headers.indexOf('blockid');
  
  if (sessionIdCol < 0 || dateCol < 0) return validSessions;
  
  for (let i = 1; i < data.length; i++) {
    const sessionId = String(data[i][sessionIdCol]);
    const dateVal = data[i][dateCol];
    const blockId = blockIdCol >= 0 ? String(data[i][blockIdCol]).trim() : '';
    
    if (!sessionId) continue;
    
    const date = formatDateSafe(dateVal);
    
    // Save all sessions for fallback
    allSessions[sessionId] = date;
    
    // Filter by period
    let include = false;
    
    if (period === 'block') {
      // Include if blockId matches OR if blockId is empty (not filled)
      include = blockId === String(currentBlockId) || blockId === '' || blockId === 'undefined' || blockId === 'null';
    } else if (period === '3m' || period === 'all') {
      if (periodDates.startDate) {
        include = date >= periodDates.startDate;
      } else {
        include = true;
      }
    }
    
    if (include) {
      validSessions[sessionId] = date;
    }
  }
  
  // Fallback: if no sessions found for 'block', return all sessions
  if (period === 'block' && Object.keys(validSessions).length === 0) {
    return allSessions;
  }
  
  return validSessions;
}


// [RU comment removed]
// MUSCLE COEFFICIENTS SYSTEM v6.6
// [RU comment removed]

/**
 * [RU text]
 */
const MUSCLE_COLUMNS = [
  'key', 'key', 'key', 'key',
  'key', 'key', 'key',
  'key', 'key',
  'key', 'key', 'key', 'key',
  'key'
];

/**
 * [RU text]
 * @returns {Object} [RU text]
 */
function getExercisesMaster() {
  try {
    // [comment]
    const cache = CacheService.getScriptCache();
    const cached = cache.get('exercises_master');
    
    if (cached) {
      return { success: true, exercises: JSON.parse(cached), fromCache: true };
    }
    
    // [comment]
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const sheet = ss.getSheetByName('exercises_master');
    
    if (!sheet) {
      return { success: false, error: 'key' };
    }
    
    const data = sheet.getDataRange().getValues();
    if (data.length < 2) {
      return { success: true, exercises: {} };
    }
    
    const headers = data[0].map(h => String(h).trim());
    const exercises = {};
    
    // [comment]
    const colIndex = {};
    headers.forEach((h, i) => {
      colIndex[h] = i;
      colIndex[h.toLowerCase()] = i;
    });
    
    // [comment]
    for (let i = 1; i < data.length; i++) {
      const row = data[i];
      const id = String(row[colIndex['id']] || '').trim();
      
      if (!id) continue;
      
      // [comment]
      const coeffs = {};
      for (const muscle of MUSCLE_COLUMNS) {
        const idx = colIndex[muscle];
        if (idx !== undefined) {
          const val = parseFloat(row[idx]) || 0;
          if (val > 0) {
            coeffs[muscle] = val;
          }
        }
      }
      
      // [comment]
      const position = row[colIndex['position']] || '';
      const uniqueKey = position ? `${id}_${position}`.replace(/\s+/g, '_') : id;
      
      exercises[uniqueKey] = {
        id: id,
        name: row[colIndex['name']] || id,
        baseExercise: row[colIndex['baseExercise']] || id,
        position: position,
        category: row[colIndex['category']] || '',
        subcategory: row[colIndex['subcategory']] || '',
        exerciseType: row[colIndex['exerciseType']] || '',
        type: row[colIndex['type']] || '',
        laterality: row[colIndex['laterality']] || 'bilateral',
        equipment: row[colIndex['equipment']] || '',
        aliases: row[colIndex['aliases']] || '',
        coeffs: coeffs
      };
    }
    
    // [comment]
    cache.put('exercises_master', JSON.stringify(exercises), 21600);
    
    return {
      success: true,
      exercises: exercises,
      count: Object.keys(exercises).length
    };
    
  } catch (error) {
    return { success: false, error: error.toString() };
  }
}

/**
 * [RU text]
 * @param {string} clientId - ID [RU text]
 * @param {string|Object} workoutJson - [RU text]
 */
function saveWorkoutWithCoeffs(clientId, workoutJson) {
  try {
    const workout = typeof workoutJson === 'string' ? JSON.parse(workoutJson) : workoutJson;
    
    // [comment]
    const clientSS = getClientSpreadsheet(clientId);
    if (!clientSS) {
      return { success: false, error: 'key' };
    }
    
    // [comment]
    const logHeaders = [
      'logId', 'sessionId', 'order', 'exerciseId', 'exerciseName',
      'category', 'weight', 'reps', 'setType',
      'muscleCoeffs', 'muscleLoad', 'totalLoad',
      'equipment', 'notes', 'createdAt'
    ];
    const logSheet = ensureSheet(clientSS, 'WorkoutLog', logHeaders);
    
    // [comment]
    ensureColumnsInSheet(logSheet, logHeaders);
    
    // [comment]
    const sessionsHeaders = [
      'sessionId', 'date', 'blockId', 'workoutName', 'duration',
      'totalVolume', 'totalSets', 'workSets', 'rpe', 'notes', 'status', 'createdAt'
    ];
    const sessionsSheet = ensureSheet(clientSS, 'WorkoutSessions', sessionsHeaders);
    
    const sessionId = workout.sessionId;
    const date = workout.date || new Date().toISOString().split('T')[0];
    
    let totalVolume = 0;
    let totalSets = 0;
    let workSets = 0;
    let order = 1;
    
    // [comment]
    for (const exercise of workout.exercises) {
      for (const set of exercise.sets) {
        const muscleCoeffs = typeof set.muscleCoeffs === 'string' 
          ? set.muscleCoeffs 
          : JSON.stringify(set.muscleCoeffs || {});
        
        const muscleLoad = typeof set.muscleLoad === 'string'
          ? set.muscleLoad
          : JSON.stringify(set.muscleLoad || {});
        
        const weight = parseFloat(set.weight) || 0;
        const reps = parseInt(set.reps) || 0;
        const setTotalLoad = weight * reps;
        
        const row = [
          logSheet.getLastRow(), // logId
          sessionId,
          order++,
          exercise.exerciseId || '',
          exercise.exerciseName || '',
          exercise.category || '',
          weight,
          reps,
          set.setType || 'work',
          muscleCoeffs,
          muscleLoad,
          setTotalLoad,
          set.equipment || '',
          set.notes || '',
          new Date().toISOString()
        ];
        
        logSheet.appendRow(row);
        
        totalVolume += setTotalLoad;
        totalSets++;
        if (set.setType !== 'warmup') {
          workSets++;
        }
      }
    }
    
    // [comment]
    const currentBlockId = getCurrentBlockIdFromClient(clientSS);
    
    // [comment]
    const sessionRow = [
      sessionId,
      date,
      currentBlockId || '',
      workout.workoutName || '',
      workout.duration || '',
      totalVolume,
      totalSets,
      workSets,
      workout.rpe || '',
      workout.notes || '',
      'completed',
      new Date().toISOString()
    ];
    
    sessionsSheet.appendRow(sessionRow);
    
    return {
      success: true,
      sessionId: sessionId,
      totalVolume: totalVolume,
      totalSets: totalSets,
      workSets: workSets
    };
    
  } catch (error) {
    return { success: false, error: error.toString() };
  }
}

/**
 * [RU text]
 */
function ensureColumnsInSheet(sheet, requiredHeaders) {
  const existingHeaders = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
  const existingLower = existingHeaders.map(h => String(h).toLowerCase().trim());
  
  for (const header of requiredHeaders) {
    if (!existingLower.includes(header.toLowerCase())) {
      const newCol = sheet.getLastColumn() + 1;
      sheet.getRange(1, newCol).setValue(header);
    }
  }
}

/**
 * [RU text]
 */
function getCurrentBlockIdFromClient(ss) {
  const blocksSheet = ss.getSheetByName('TrainingBlocks');
  if (!blocksSheet) return null;
  
  const data = blocksSheet.getDataRange().getValues();
  const headers = data[0].map(h => String(h).toLowerCase());
  const statusCol = headers.indexOf('status');
  const idCol = headers.indexOf('blockid') >= 0 ? headers.indexOf('blockid') : headers.indexOf('id');
  
  for (let i = 1; i < data.length; i++) {
    if (data[i][statusCol] === 'active') {
      return data[i][idCol];
    }
  }
  
  return null;
}

/**
 * [RU text]
 * @param {string} clientId - ID [RU text]
 * @param {string} period - [RU text]
 */
function getDashboardMuscleLoadGroupedV2(clientId, period) {
  try {
    const ss = getClientSpreadsheet(clientId);
    if (!ss) return { groups: {}, maxGroupSets: 0, error: 'key' };
    
    const logSheet = ss.getSheetByName('WorkoutLog');
    const sessionsSheet = ss.getSheetByName('WorkoutSessions');
    
    if (!logSheet) return { groups: {}, maxGroupSets: 0 };
    
    // [comment]
    const currentBlockId = getCurrentBlockIdFromClient(ss);
    const validSessions = getValidSessionsForMuscleLoad(sessionsSheet, period, currentBlockId);
    
    // [comment]
    const muscleGroups = {
      legs: { 
        name: 'key', 
        icon: 'key',
        muscles: ['key', 'key', 'key', 'key']
      },
      back: { 
        name: 'key', 
        icon: 'key',
        muscles: ['key', 'key', 'key']
      },
      chest: { 
        name: 'key', 
        icon: 'key',
        muscles: ['key']
      },
      arms: { 
        name: 'key', 
        icon: 'key',
        muscles: ['key', 'key', 'key', 'key', 'key']
      },
      core: {
        name: 'key',
        icon: 'key',
        muscles: ['key']
      }
    };
    
    // [comment]
    const muscleTotals = {};
    const muscleVolumes = {};
    for (const group of Object.values(muscleGroups)) {
      for (const m of group.muscles) {
        muscleTotals[m] = 0;
        muscleVolumes[m] = 0;
      }
    }
    
    // [comment]
    const data = logSheet.getDataRange().getValues();
    const headers = data[0].map(h => String(h).toLowerCase().trim());
    
    const cols = {
      sessionId: headers.indexOf('sessionid'),
      setType: headers.indexOf('settype'),
      muscleLoad: headers.indexOf('muscleload'),
      muscleCoeffs: headers.indexOf('musclecoeffs'),
      exerciseName: headers.indexOf('exercisename'),
      category: headers.indexOf('category'),
      weight: headers.indexOf('weight'),
      reps: headers.indexOf('reps')
    };
    
    // [comment]
    for (let i = 1; i < data.length; i++) {
      const row = data[i];
      const sessionId = String(row[cols.sessionId] || '');
      const setType = String(row[cols.setType] || '').toLowerCase();
      
      // [comment]
      if (!validSessions[sessionId] || setType === 'warmup') continue;
      
      // [comment]
      let muscleLoad = {};
      let muscleCoeffs = {};
      
      try {
        const loadStr = row[cols.muscleLoad];
        const coeffsStr = row[cols.muscleCoeffs];
        
        if (loadStr && typeof loadStr === 'string' && loadStr.startsWith('{')) {
          muscleLoad = JSON.parse(loadStr);
        }
        if (coeffsStr && typeof coeffsStr === 'string' && coeffsStr.startsWith('{')) {
          muscleCoeffs = JSON.parse(coeffsStr);
        }
      } catch (e) {
        // [comment]
        const exerciseName = String(row[cols.exerciseName] || '');
        const weight = parseFloat(row[cols.weight]) || 0;
        const reps = parseInt(row[cols.reps]) || 0;
        
        if (exerciseName && reps > 0) {
          const aiResult = aiDetermineExerciseForMuscle(exerciseName);
          muscleCoeffs = aiResult.coeffs;
          
          const volume = weight * reps;
          for (const [muscle, coeff] of Object.entries(muscleCoeffs)) {
            muscleLoad[muscle] = volume * coeff;
          }
        }
      }
      
      // [comment]
      for (const [muscle, load] of Object.entries(muscleLoad)) {
        if (muscleVolumes.hasOwnProperty(muscle)) {
          muscleVolumes[muscle] += load;
        }
      }
      
      // [comment]
      for (const [muscle, coeff] of Object.entries(muscleCoeffs)) {
        if (muscleTotals.hasOwnProperty(muscle)) {
          muscleTotals[muscle] += coeff;
        }
      }
    }
    
    // [comment]
    const groups = {};
    let maxGroupSets = 0;
    
    for (const [groupKey, groupInfo] of Object.entries(muscleGroups)) {
      const totalSets = groupInfo.muscles.reduce((sum, m) => sum + muscleTotals[m], 0);
      const totalVolume = groupInfo.muscles.reduce((sum, m) => sum + muscleVolumes[m], 0);
      
      groups[groupKey] = {
        name: groupInfo.name,
        icon: groupInfo.icon,
        totalSets: Math.round(totalSets * 10) / 10,
        totalVolume: Math.round(totalVolume),
        muscles: {}
      };
      
      for (const m of groupInfo.muscles) {
        groups[groupKey].muscles[m] = {
          sets: Math.round(muscleTotals[m] * 10) / 10,
          volume: Math.round(muscleVolumes[m])
        };
      }
      
      maxGroupSets = Math.max(maxGroupSets, totalSets);
    }
    
    return {
      success: true,
      period: period,
      groups: groups,
      maxGroupSets: Math.round(maxGroupSets * 10) / 10
    };
    
  } catch (error) {
    return { success: false, error: error.toString(), groups: {}, maxGroupSets: 0 };
  }
}

/**
 * [RU text]
 */
function getValidSessionsForMuscleLoad(sessionsSheet, period, currentBlockId) {
  const validSessions = {};
  
  if (!sessionsSheet) return validSessions;
  
  const data = sessionsSheet.getDataRange().getValues();
  if (data.length < 2) return validSessions;
  
  const headers = data[0].map(h => String(h).toLowerCase().trim());
  
  const cols = {
    sessionId: headers.indexOf('sessionid'),
    date: headers.indexOf('date'),
    blockId: headers.indexOf('blockid')
  };
  
  const now = new Date();
  const threeMonthsAgo = new Date(now);
  threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3);
  
  for (let i = 1; i < data.length; i++) {
    const row = data[i];
    const sessionId = String(row[cols.sessionId] || '');
    const blockId = String(row[cols.blockId] || '');
    const dateVal = row[cols.date];
    
    if (!sessionId) continue;
    
    let include = false;
    
    if (period === 'all') {
      include = true;
    } else if (period === '3m') {
      const sessionDate = dateVal instanceof Date ? dateVal : new Date(dateVal);
      include = !isNaN(sessionDate.getTime()) && sessionDate >= threeMonthsAgo;
    } else if (period === 'block') {
      include = blockId === String(currentBlockId) || blockId === '' || blockId === 'undefined';
    }
    
    if (include) {
      validSessions[sessionId] = true;
    }
  }
  
  // [RU comment removed]
  if (period === 'block' && Object.keys(validSessions).length === 0) {
    for (let i = 1; i < data.length; i++) {
      const sessionId = String(data[i][cols.sessionId] || '');
      if (sessionId) validSessions[sessionId] = true;
    }
  }
  
  return validSessions;
}

/**
 * AI [RU text]
 */
function aiDetermineExerciseForMuscle(name) {
  const n = String(name).toLowerCase();
  
  const patterns = {
    'key': {
      keywords: ['key', 'key', 'key', 'key', 'key', 'key', 'key', 'key', 'key'],
      defaultCoeffs: { 'key': 0.4, 'key': 0.3, 'key': 0.3 }
    },
    'key': {
      keywords: ['key', 'key', 'key', 'key', 'key', 'key'],
      defaultCoeffs: { 'key': 0.6, 'key': 0.2, 'key': 0.2 }
    },
    'key': {
      keywords: ['key', 'key', 'key', 'key', 'key', 'key', 'key', 'key'],
      defaultCoeffs: { 'key': 0.6, 'key': 0.2, 'key': 0.2 }
    },
    'key': {
      keywords: ['key', 'key', 'key', 'key', 'key', 'key', 'key'],
      defaultCoeffs: { 'key': 0.35, 'key': 0.35, 'key': 0.3 }
    },
    'key': {
      keywords: ['key', 'key', 'key', 'key', 'key', 'key', 'key', 'key'],
      defaultCoeffs: { 'key': 0.5, 'key': 0.5 }
    },
    'key': {
      keywords: ['key', 'key', 'key', 'key', 'key'],
      defaultCoeffs: { 'key': 1.0 }
    }
  };
  
  for (const [category, data] of Object.entries(patterns)) {
    if (data.keywords.some(kw => n.includes(kw))) {
      // [comment]
      let coeffs = Object.assign({}, data.defaultCoeffs);
      
      if (category === 'key') {
        if (n.includes('key')) coeffs = { 'key': 1.0 };
        else if (n.includes('key')) coeffs = { 'key': 1.0 };
        else if (n.includes('key') || n.includes('key')) coeffs = { 'key': 1.0 };
        else if (n.includes('key') || n.includes('key')) coeffs = { 'key': 0.7, 'key': 0.3 };
      }
      
      if (category === 'key') {
        if (n.includes('key')) coeffs = { 'key': 0.7, 'key': 0.3 };
        else if (n.includes('key')) coeffs = { 'key': 0.6, 'key': 0.4 };
        else if (n.includes('key')) coeffs = { 'key': 1.0 };
      }
      
      if (category === 'key') {
        if (n.includes('key') || n.includes('key') || n.includes('key')) {
          if (!n.includes('key')) coeffs = { 'key': 1.0 };
        }
        else if (n.includes('key') || n.includes('key')) coeffs = { 'key': 1.0 };
      }
      
      return { category: category, coeffs: coeffs };
    }
  }
  
  // [comment]
  if (n.includes('key') && !n.includes('key')) {
    if (n.includes('key') || n.includes('key') || n.includes('key')) {
      return { category: 'key', coeffs: { 'key': 0.6, 'key': 0.2, 'key': 0.2 } };
    }
  }
  
  return { 
    category: 'key', 
    coeffs: { 'key': 0.34, 'key': 0.33, 'key': 0.33 } 
  };
}

/**
 * [RU text]
 * [RU text]
 * @param {string} clientId - ID [RU text]
 */
function migrateWorkoutLogData(clientId) {
  try {
    const ss = getClientSpreadsheet(clientId);
    if (!ss) return { success: false, error: 'key' };
    
    const sheet = ss.getSheetByName('WorkoutLog');
    if (!sheet) return { success: false, error: 'Error' };
    
    // [comment]
    const masterResult = getExercisesMaster();
    const exercisesMaster = masterResult.success ? masterResult.exercises : {};
    
    // [comment]
    const data = sheet.getDataRange().getValues();
    const headers = data[0].map(h => String(h).toLowerCase().trim());
    
    // [comment]
    const requiredCols = ['category', 'musclecoeffs', 'muscleload', 'totalload'];
    
    for (const col of requiredCols) {
      if (!headers.includes(col)) {
        sheet.getRange(1, sheet.getLastColumn() + 1).setValue(col);
      }
    }
    
    // [comment]
    const newHeaders = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
    const cols = {};
    newHeaders.forEach((h, i) => {
      cols[String(h).toLowerCase().trim()] = i;
    });
    
    let updated = 0;
    let skipped = 0;
    
    // [comment]
    for (let i = 1; i < data.length; i++) {
      const row = data[i];
      
      // [comment]
      const existingCoeffs = row[cols['musclecoeffs']];
      if (existingCoeffs && String(existingCoeffs).startsWith('{')) {
        skipped++;
        continue;
      }
      
      const exerciseName = String(row[cols['exercisename']] || '').toLowerCase();
      const weight = parseFloat(row[cols['weight']]) || 0;
      const reps = parseInt(row[cols['reps']]) || 0;
      
      if (!exerciseName) {
        skipped++;
        continue;
      }
      
      // [comment]
      let coeffs = {};
      let category = 'key';
      
      for (const [id, ex] of Object.entries(exercisesMaster)) {
        const name = (ex.name || '').toLowerCase();
        const aliases = (ex.aliases || '').toLowerCase();
        
        if (name === exerciseName || name.includes(exerciseName) || 
            exerciseName.includes(name) || aliases.includes(exerciseName)) {
          coeffs = ex.coeffs || {};
          category = ex.category || 'key';
          break;
        }
      }
      
      // [comment]
      if (Object.keys(coeffs).length === 0) {
        const aiResult = aiDetermineExerciseForMuscle(exerciseName);
        coeffs = aiResult.coeffs;
        category = aiResult.category;
      }
      
      // [comment]
      const muscleLoad = {};
      const volume = weight * reps;
      
      for (const [muscle, coeff] of Object.entries(coeffs)) {
        muscleLoad[muscle] = Math.round(volume * coeff * 100) / 100;
      }
      
      // [comment]
      const rowIndex = i + 1;
      sheet.getRange(rowIndex, cols['category'] + 1).setValue(category);
      sheet.getRange(rowIndex, cols['musclecoeffs'] + 1).setValue(JSON.stringify(coeffs));
      sheet.getRange(rowIndex, cols['muscleload'] + 1).setValue(JSON.stringify(muscleLoad));
      sheet.getRange(rowIndex, cols['totalload'] + 1).setValue(volume);
      
      updated++;
      
      // [comment]
      if (updated % 50 === 0) {
        SpreadsheetApp.flush();
      }
    }
    
    return {
      success: true,
      updated: updated,
      skipped: skipped,
      total: data.length - 1
    };
    
  } catch (error) {
    return { success: false, error: error.toString() };
  }
}

/**
 * [RU text]
 */
function clearExercisesMasterCache() {
  try {
    const cache = CacheService.getScriptCache();
    cache.remove('exercises_master');
    return { success: true, message: 'key' };
  } catch (error) {
    return { success: false, error: error.toString() };
  }
}

/**
 * Получить последний Assessment клиента
 */
function getAssessment(clientId) {
  const ss = getClientSpreadsheet(clientId);
  if (!ss) return { error: 'Client not found' };
  
  const sheet = ss.getSheetByName('Assessment');
  if (!sheet || sheet.getLastRow() < 2) {
    return { assessments: {}, lastDate: null };
  }
  
  const data = sheet.getDataRange().getValues();
  const headers = data[0].map(h => String(h).toLowerCase().trim());
  
  const cols = findColumns(headers, {
    key: ['key'],
    value: ['value'],
    unit: ['unit'],
    date: ['date'],
    notes: ['notes'],
    category: ['category']
  });
  
  // Группируем по дате, берём последнюю
  const byDate = {};
  
  for (let i = 1; i < data.length; i++) {
    const row = data[i];
    const date = formatDate(row[cols.date]) || 'unknown';
    
    if (!byDate[date]) byDate[date] = {};
    
    const key = row[cols.key];
    if (key) {
      byDate[date][key] = {
        value: row[cols.value],
        unit: cols.unit >= 0 ? row[cols.unit] : '',
        notes: cols.notes >= 0 ? row[cols.notes] : '',
        category: cols.category >= 0 ? row[cols.category] : ''
      };
    }
  }
  
  const dates = Object.keys(byDate).sort().reverse();
  const lastDate = dates[0] || null;
  
  return {
    assessments: lastDate ? byDate[lastDate] : {},
    lastDate: lastDate,
    allDates: dates
  };
}

/**
 * Получить историю всех Assessment
 */
function getAssessmentHistory(clientId) {
  const ss = getClientSpreadsheet(clientId);
  if (!ss) return { error: 'Client not found' };
  
  const sheet = ss.getSheetByName('Assessment');
  if (!sheet || sheet.getLastRow() < 2) {
    return { history: [] };
  }
  
  const data = sheet.getDataRange().getValues();
  const headers = data[0].map(h => String(h).toLowerCase().trim());
  
  const cols = findColumns(headers, {
    key: ['key'],
    value: ['value'],
    unit: ['unit'],
    date: ['date'],
    notes: ['notes'],
    category: ['category']
  });
  
  // Группируем по дате
  const byDate = {};
  
  for (let i = 1; i < data.length; i++) {
    const row = data[i];
    const date = formatDate(row[cols.date]) || 'unknown';
    
    if (!byDate[date]) byDate[date] = { date: date, data: {} };
    
    const key = row[cols.key];
    if (key) {
      byDate[date].data[key] = {
        value: row[cols.value],
        unit: cols.unit >= 0 ? row[cols.unit] : '',
        notes: cols.notes >= 0 ? row[cols.notes] : '',
        category: cols.category >= 0 ? row[cols.category] : ''
      };
    }
  }
  
  // Сортируем по дате (новые первые)
  const history = Object.values(byDate).sort((a, b) => b.date.localeCompare(a.date));
  
  return { history };
}

/**
 * Сохранить Assessment
 */
function saveAssessment(clientId, data) {
  const ss = getClientSpreadsheet(clientId);
  if (!ss) return { error: 'Client not found' };
  
  // Создаём лист если нет
  const headers = ['key', 'value', 'unit', 'date', 'notes', 'category'];
  const sheet = ensureSheet(ss, 'Assessment', headers);
  
  const cols = ensureColumns(sheet, headers);
  const date = data.date || new Date().toISOString().split('T')[0];
  const assessments = data.assessments || {};
  
  // Удаляем старые записи за эту дату
  const existingData = sheet.getDataRange().getValues();
  const rowsToDelete = [];
  
  for (let i = existingData.length - 1; i >= 1; i--) {
    if (formatDate(existingData[i][cols.date]) === date) {
      rowsToDelete.push(i + 1);
    }
  }
  
  // Удаляем с конца чтобы не сбивались индексы
  rowsToDelete.forEach(rowNum => sheet.deleteRow(rowNum));
  
  // Записываем новые данные
  let count = 0;
  for (const [key, item] of Object.entries(assessments)) {
    if (item.value !== undefined && item.value !== '' && item.value !== null) {
      const newRow = new Array(headers.length).fill('');
      newRow[cols.key] = key;
      newRow[cols.value] = item.value;
      newRow[cols.unit] = item.unit || '';
      newRow[cols.date] = date;
      newRow[cols.notes] = item.notes || '';
      newRow[cols.category] = item.category || '';
      
      sheet.appendRow(newRow);
      count++;
    }
  }
  
  // Обновляем статус клиента если это первый assessment
  if (count > 0) {
    updateClientStatusIfPending(clientId);
  }
  
  return { 
    success: true, 
    saved: count,
    date: date
  };
}

/**
 * Обновить статус клиента
 */
function updateClientStatus(clientId, newStatus) {
  const masterSS = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = masterSS.getSheetByName('Clients');
  
  if (!sheet) return { error: 'Clients sheet not found' };
  
  const data = sheet.getDataRange().getValues();
  const headers = data[0].map(h => String(h).toLowerCase().trim());
  
  const cols = findColumns(headers, {
    id: ['id'],
    status: ['status']
  });
  
  for (let i = 1; i < data.length; i++) {
    if (String(data[i][cols.id]) === String(clientId)) {
      sheet.getRange(i + 1, cols.status + 1).setValue(newStatus);
      return { success: true, clientId: clientId, status: newStatus };
    }
  }
  
  return { error: 'Client not found' };
}

/**
 * Автоматически обновить статус если pending_assessment
 */
function updateClientStatusIfPending(clientId) {
  const masterSS = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = masterSS.getSheetByName('Clients');
  
  if (!sheet) return;
  
  const data = sheet.getDataRange().getValues();
  const headers = data[0].map(h => String(h).toLowerCase().trim());
  
  const cols = findColumns(headers, {
    id: ['id'],
    status: ['status']
  });
  
  for (let i = 1; i < data.length; i++) {
    if (String(data[i][cols.id]) === String(clientId)) {
      const currentStatus = data[i][cols.status];
      if (currentStatus === 'pending_assessment') {
        sheet.getRange(i + 1, cols.status + 1).setValue('active');
      }
      return;
    }
  }
}

/**
 * Получить структуру полей Assessment (для фронтенда)
 */
function getAssessmentFields() {
  return {
    categories: [
      {
        id: 'measurements',
        name: 'Замеры тела',
        icon: '📏',
        color: '#3b82f6',
        fields: [
          { key: 'weight', label: 'Вес', unit: 'кг', type: 'number', step: 0.1 },
          { key: 'body_fat', label: 'Жир', unit: '%', type: 'number', step: 0.1 },
          { key: 'chest', label: 'Грудь', unit: 'см', type: 'number' },
          { key: 'waist', label: 'Талия', unit: 'см', type: 'number' },
          { key: 'hips', label: 'Бёдра', unit: 'см', type: 'number' },
          { key: 'arm_l', label: 'Рука Л', unit: 'см', type: 'number' },
          { key: 'arm_r', label: 'Рука П', unit: 'см', type: 'number' },
          { key: 'thigh_l', label: 'Бедро Л', unit: 'см', type: 'number' },
          { key: 'thigh_r', label: 'Бедро П', unit: 'см', type: 'number' }
        ]
      },
      {
        id: 'strength',
        name: 'Сила',
        icon: '💪',
        color: '#8b5cf6',
        fields: [
          { key: 'squat_max', label: 'Присед макс', unit: 'кг', type: 'number' },
          { key: 'bench_max', label: 'Жим макс', unit: 'кг', type: 'number' },
          { key: 'deadlift_max', label: 'Тяга макс', unit: 'кг', type: 'number' },
          { key: 'pullups', label: 'Подтягивания', unit: 'раз', type: 'number' },
          { key: 'pushups', label: 'Отжимания', unit: 'раз', type: 'number' },
          { key: 'plank', label: 'Планка', unit: 'сек', type: 'number' },
          { key: 'squat_tech', label: 'Техника присед', unit: '1-5', type: 'rating' },
          { key: 'hinge_tech', label: 'Техника тяга', unit: '1-5', type: 'rating' },
          { key: 'push_tech', label: 'Техника жим', unit: '1-5', type: 'rating' },
          { key: 'pull_tech', label: 'Техника тяга верх', unit: '1-5', type: 'rating' }
        ]
      },
      {
        id: 'mobility',
        name: 'Мобильность',
        icon: '🧘',
        color: '#f59e0b',
        fields: [
          { key: 'shoulders', label: 'Плечи', unit: '1-5', type: 'rating' },
          { key: 'thoracic', label: 'Грудной отдел', unit: '1-5', type: 'rating' },
          { key: 'hips_mob', label: 'Таз', unit: '1-5', type: 'rating' },
          { key: 'ankles', label: 'Голеностоп', unit: '1-5', type: 'rating' },
          { key: 'squat_depth', label: 'Глубина присед', unit: '1-5', type: 'rating' }
        ]
      },
      {
        id: 'cardio',
        name: 'Кардио',
        icon: '❤️',
        color: '#ef4444',
        fields: [
          { key: 'resting_hr', label: 'Пульс покоя', unit: 'уд/мин', type: 'number' },
          { key: 'single_leg_l', label: 'На одной ноге Л', unit: 'сек', type: 'number' },
          { key: 'single_leg_r', label: 'На одной ноге П', unit: 'сек', type: 'number' }
        ]
      },
      {
        id: 'notes',
        name: 'Заметки',
        icon: '📝',
        color: '#64748b',
        fields: [
          { key: 'muscle_imbalance', label: 'Дисбаланс мышц', unit: '', type: 'text' },
          { key: 'posture_notes', label: 'Осанка', unit: '', type: 'text' },
          { key: 'limitations', label: 'Ограничения', unit: '', type: 'text' },
          { key: 'goals_notes', label: 'Заметки по целям', unit: '', type: 'text' },
          { key: 'general_notes', label: 'Общие заметки', unit: '', type: 'textarea' }
        ]
      }
    ]
  };
}
function updateNutrition(clientId, key, value) {
  const ss = getClientSpreadsheet(clientId);
  if (!ss) return { error: 'Client not found' };
  
  const sheet = ss.getSheetByName('Nutrition');
  if (!sheet) return { error: 'Nutrition sheet not found' };
  
  const data = sheet.getDataRange().getValues();
  const headers = data[0].map(h => String(h).toLowerCase().trim());
  
  const keyCol = headers.indexOf('key');
  const valueCol = headers.indexOf('value');
  
  if (keyCol === -1 || valueCol === -1) {
    return { error: 'Invalid Nutrition sheet structure' };
  }
  
  // Ищем строку с нужным ключом
  for (let i = 1; i < data.length; i++) {
    if (String(data[i][keyCol]).toLowerCase().trim() === key.toLowerCase()) {
      sheet.getRange(i + 1, valueCol + 1).setValue(value);
      return { success: true, key: key, value: value };
    }
  }
  
  // Если не нашли — добавляем новую строку
  sheet.appendRow([key, value]);
  return { success: true, key: key, value: value, added: true };
}


/**
 * Обновление статуса клиента в Coach Master
 * @param {string} clientId - ID клиента
 * @param {string} newStatus - Новый статус (active, paused, archived, pending_assessment)
 */
function updateClientStatus(clientId, newStatus) {
  const masterSS = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = masterSS.getSheetByName('Clients');
  
  if (!sheet) return { error: 'Clients sheet not found' };
  
  const data = sheet.getDataRange().getValues();
  const headers = data[0].map(h => String(h).toLowerCase().trim());
  
  const idCol = headers.indexOf('id');
  const statusCol = headers.indexOf('status');
  
  if (idCol === -1 || statusCol === -1) {
    return { error: 'Invalid Clients sheet structure' };
  }
  
  for (let i = 1; i < data.length; i++) {
    if (String(data[i][idCol]) === String(clientId)) {
      sheet.getRange(i + 1, statusCol + 1).setValue(newStatus);
      return { success: true, clientId: clientId, status: newStatus };
    }
  }
  
  return { error: 'Client not found: ' + clientId };
}


/**
 * Обновление сессии (например, привязка к блоку)
 * @param {string} clientId - ID клиента
 * @param {string} sessionId - ID сессии
 * @param {object} updates - Поля для обновления
 */
function updateSession(clientId, sessionId, updates) {
  const ss = getClientSpreadsheet(clientId);
  if (!ss) return { error: 'Client not found' };
  
  const sheet = ss.getSheetByName('WorkoutSessions');
  if (!sheet) return { error: 'WorkoutSessions sheet not found' };
  
  const data = sheet.getDataRange().getValues();
  const headers = data[0].map(h => String(h).toLowerCase().trim());
  
  const sessionIdCol = headers.indexOf('sessionid');
  if (sessionIdCol === -1) return { error: 'sessionId column not found' };
  
  // Ищем сессию
  for (let i = 1; i < data.length; i++) {
    if (String(data[i][sessionIdCol]) === String(sessionId)) {
      // Обновляем указанные поля
      for (const [key, value] of Object.entries(updates)) {
        const col = headers.indexOf(key.toLowerCase());
        if (col >= 0 && key !== 'sessionId' && key !== 'clientId') {
          sheet.getRange(i + 1, col + 1).setValue(value);
        }
      }
      return { success: true, sessionId: sessionId };
    }
  }
  
  return { error: 'Session not found: ' + sessionId };
}


/**
 * Обновление профиля клиента
 * @param {string} clientId - ID клиента
 * @param {object} updates - Поля для обновления {key: value}
 */
function updateClientProfile(clientId, updates) {
  const ss = getClientSpreadsheet(clientId);
  if (!ss) return { error: 'Client not found' };
  
  const sheet = ss.getSheetByName('ClientProfile');
  if (!sheet) return { error: 'ClientProfile sheet not found' };
  
  const data = sheet.getDataRange().getValues();
  const headers = data[0].map(h => String(h).toLowerCase().trim());
  
  const keyCol = headers.indexOf('key');
  const valueCol = headers.indexOf('value');
  const updatedCol = headers.indexOf('updated');
  
  if (keyCol === -1 || valueCol === -1) {
    return { error: 'Invalid ClientProfile structure' };
  }
  
  const now = new Date().toISOString().split('T')[0];
  let updated = 0;
  
  for (const [key, value] of Object.entries(updates)) {
    // Ищем строку с ключом
    let found = false;
    for (let i = 1; i < data.length; i++) {
      if (String(data[i][keyCol]).toLowerCase() === key.toLowerCase()) {
        sheet.getRange(i + 1, valueCol + 1).setValue(value);
        if (updatedCol >= 0) {
          sheet.getRange(i + 1, updatedCol + 1).setValue(now);
        }
        found = true;
        updated++;
        break;
      }
    }
    
    // Если не нашли — добавляем
    if (!found) {
      const newRow = new Array(headers.length).fill('');
      newRow[keyCol] = key;
      newRow[valueCol] = value;
      if (updatedCol >= 0) newRow[updatedCol] = now;
      sheet.appendRow(newRow);
      updated++;
    }
  }
  
  return { success: true, updated: updated };
}


// ================================================================
// ЧАСТЬ 3: СИНХРОНИЗАЦИЯ БЛОКОВ
// ================================================================

/**
 * Синхронизация данных активного блока клиента в Coach Master → Clients
 * Вызывается при создании/обновлении блока
 * @param {string} clientId - ID клиента
 */
function syncBlockToMaster(clientId) {
  const ss = getClientSpreadsheet(clientId);
  if (!ss) return { error: 'Client not found' };
  
  // Получаем активный блок из TrainingBlocks
  const blocksSheet = ss.getSheetByName('TrainingBlocks');
  if (!blocksSheet) return { error: 'TrainingBlocks sheet not found' };
  
  const blocksData = blocksSheet.getDataRange().getValues();
  if (blocksData.length < 2) {
    return { success: true, message: 'No blocks found' };
  }
  
  const bHeaders = blocksData[0].map(h => String(h).toLowerCase().trim());
  const bCols = {
    blockId: findColIndex(bHeaders, ['blockid', 'block_id', 'id']),
    status: findColIndex(bHeaders, ['status']),
    totalSessions: findColIndex(bHeaders, ['totalsessions', 'total_sessions']),
    usedSessions: findColIndex(bHeaders, ['usedsessions', 'used_sessions']),
    startDate: findColIndex(bHeaders, ['startdate', 'start_date']),
    pricePerSession: findColIndex(bHeaders, ['pricepersession', 'price_per_session', 'pricepersessio']),
    totalPrice: findColIndex(bHeaders, ['totalprice', 'total_price', 'priceusd', 'price']),
    currency: findColIndex(bHeaders, ['currency', 'blockcurrency'])
  };
  
  // Ищем активный блок
  let activeBlock = null;
  for (let i = blocksData.length - 1; i >= 1; i--) {
    const status = bCols.status >= 0 ? String(blocksData[i][bCols.status]).toLowerCase() : '';
    if (status === 'active' || status === '') {
      activeBlock = {
        blockId: bCols.blockId >= 0 ? blocksData[i][bCols.blockId] : i,
        totalSessions: bCols.totalSessions >= 0 ? blocksData[i][bCols.totalSessions] : 0,
        usedSessions: bCols.usedSessions >= 0 ? blocksData[i][bCols.usedSessions] : 0,
        startDate: bCols.startDate >= 0 ? formatDateValue(blocksData[i][bCols.startDate]) : '',
        price: bCols.totalPrice >= 0 ? blocksData[i][bCols.totalPrice] : 
               (bCols.pricePerSession >= 0 ? blocksData[i][bCols.pricePerSession] * blocksData[i][bCols.totalSessions] : 0),
        currency: bCols.currency >= 0 ? blocksData[i][bCols.currency] : 'USD'
      };
      break;
    }
  }
  
  if (!activeBlock) {
    return { success: true, message: 'No active block found' };
  }
  
  // Обновляем Coach Master → Clients
  const masterSS = SpreadsheetApp.getActiveSpreadsheet();
  const clientsSheet = masterSS.getSheetByName('Clients');
  if (!clientsSheet) return { error: 'Clients sheet not found in Master' };
  
  const clientsData = clientsSheet.getDataRange().getValues();
  const cHeaders = clientsData[0].map(h => String(h).toLowerCase().trim());
  
  const cCols = {
    id: findColIndex(cHeaders, ['id']),
    currentBlockId: findColIndex(cHeaders, ['currentblockid', 'current_block_id', 'blockid']),
    blockSessions: findColIndex(cHeaders, ['blocksessions', 'block_sessions']),
    blockPrice: findColIndex(cHeaders, ['blockprice', 'block_price']),
    blockCurrency: findColIndex(cHeaders, ['blockcurrency', 'block_currency', 'currency']),
    blockStartDate: findColIndex(cHeaders, ['blockstartdate', 'block_start_date'])
  };
  
  // Добавляем колонки если их нет
  const requiredCols = ['currentBlockId', 'blockSessions', 'blockPrice', 'blockCurrency', 'blockStartDate'];
  for (const colName of requiredCols) {
    if (cCols[colName] === -1) {
      const newColIdx = clientsSheet.getLastColumn() + 1;
      clientsSheet.getRange(1, newColIdx).setValue(colName);
      cCols[colName] = newColIdx - 1;
    }
  }
  
  // Ищем клиента и обновляем
  for (let i = 1; i < clientsData.length; i++) {
    if (String(clientsData[i][cCols.id]) === String(clientId)) {
      if (cCols.currentBlockId >= 0) clientsSheet.getRange(i + 1, cCols.currentBlockId + 1).setValue(activeBlock.blockId);
      if (cCols.blockSessions >= 0) clientsSheet.getRange(i + 1, cCols.blockSessions + 1).setValue(activeBlock.totalSessions);
      if (cCols.blockPrice >= 0) clientsSheet.getRange(i + 1, cCols.blockPrice + 1).setValue(activeBlock.price);
      if (cCols.blockCurrency >= 0) clientsSheet.getRange(i + 1, cCols.blockCurrency + 1).setValue(activeBlock.currency || 'USD');
      if (cCols.blockStartDate >= 0) clientsSheet.getRange(i + 1, cCols.blockStartDate + 1).setValue(activeBlock.startDate);
      
      return { 
        success: true, 
        clientId: clientId,
        block: activeBlock
      };
    }
  }
  
  return { error: 'Client not found in Master: ' + clientId };
}
/**
 * Синхронизация блоков ВСЕХ клиентов
 * Запускать вручную или по расписанию
 */
function syncAllBlocks() {
  const masterSS = SpreadsheetApp.getActiveSpreadsheet();
  const clientsSheet = masterSS.getSheetByName('Clients');
  if (!clientsSheet) return { error: 'Clients sheet not found' };
  
  const data = clientsSheet.getDataRange().getValues();
  const headers = data[0].map(h => String(h).toLowerCase().trim());
  const idCol = headers.indexOf('id');
  
  if (idCol === -1) return { error: 'id column not found' };
  
  const results = [];
  for (let i = 1; i < data.length; i++) {
    const clientId = data[i][idCol];
    if (clientId) {
      try {
        const res = syncBlockToMaster(clientId);
        results.push({ clientId, ...res });
      } catch (e) {
        results.push({ clientId, error: e.message });
      }
    }
  }
  
  return { success: true, synced: results.length, results };
}

/**
 * Вспомогательная функция: поиск индекса колонки по нескольким именам
 */
function findColIndex(headers, names) {
  for (const name of names) {
    const idx = headers.indexOf(name.toLowerCase());
    if (idx >= 0) return idx;
  }
  return -1;
}

/**
 * Форматирование даты
 */
function formatDateValue(value) {
  if (!value) return '';
  if (value instanceof Date) {
    return Utilities.formatDate(value, Session.getScriptTimeZone(), 'yyyy-MM-dd');
  }
  return String(value);
}

/**
 * Тест синхронизации для конкретного клиента
 */
function testSyncKirill() {
  const result = syncBlockToMaster('kirill');
  Logger.log(JSON.stringify(result, null, 2));
  return result;
}

/**
 * Тест синхронизации всех клиентов
 */
function testSyncAll() {
  const result = syncAllBlocks();
  Logger.log(JSON.stringify(result, null, 2));
  return result;
}