// @ts-nocheck
/**
 * ================================================================
 * ONBOARDING SYSTEM v2.0 — FITNESS COACH SYSTEM
 * ================================================================
 * 
 * ИЗМЕНЕНИЯ v2.0:
 * - Лист Form для хранения сырых данных (backup)
 * - ClientProfile заполняется реальными данными из формы
 * - Nutrition с ФОРМУЛАМИ в ячейках (авто-расчёт КБЖУ)
 * - MandatoryTasks из тренировочных целей
 * - Обновлённые поля формы (ограничения, место тренировок, цели)
 * 
 * УСТАНОВКА:
 * 1. Запусти createOnboardingFormV2() — создаст форму
 * 2. Открой созданную таблицу ответов
 * 3. Расширения → Apps Script → вставь этот код
 * 4. Создай триггер: onFormSubmit → При отправке формы
 * 
 * ================================================================
 */

// ========== КОНФИГУРАЦИЯ ==========
const CONFIG = {
  COACH_MASTER_ID: '1lxn8Tq6dZko2Cn4-YH9fXXQPqmCVJmwq1NUdWRGfdj8',
  TRAINER_EMAIL: 'gladkovny@gmail.com',
  VERSION: '2.0'
};

// ========== МАППИНГ ПОЛЕЙ ФОРМЫ ==========
const FORM_FIELD_MAPPING = {
  // Контакты
  'client_name': ['ваше имя', 'имя', 'фио', 'name'],
  'birth_date': ['дата рождения', 'birth', 'рождения'],
  'phone': ['телефон', 'whatsapp', 'phone'],
  'telegram': ['telegram', 'телеграм'],
  
  // Физические параметры
  'start_weight': ['текущий вес', 'вес (кг)', 'вес'],
  'height': ['рост (см)', 'рост'],
  'gender': ['пол'],
  
  // Цели
  'main_goal': ['основная цель', 'какая у вас', 'цель'],
  'main_goal_other': ['свой вариант цели', 'другая цель', 'укажите цель'],
  'target_weight': ['целевой вес'],
  'goal_timeframe': ['за какой срок', 'срок'],
  'goal_description': ['опишите цель', 'своими словами'],
  
  // Здоровье
  'health_heart': ['сердцем', 'давление', 'heart'],
  'health_injuries': ['боли в суставах', 'травмы', 'injuries'],
  'health_injuries_desc': ['опишите травмы', 'травмы или боли'],
  'health_chronic': ['хронические заболевания', 'chronic'],
  'health_chronic_desc': ['какие хронические', 'хронических'],
  'health_medications': ['лекарства', 'medications'],
  'health_medications_desc': ['какие лекарства'],
  'health_pregnancy': ['беременность', 'роды', 'pregnancy'],
  'health_restrictions': ['ограничения к физ', 'ограничения к нагрузкам', 'restrictions'],
  
  // Опыт
  'training_experience': ['опыт тренировок', 'experience'],
  'last_workout': ['последний раз', 'когда последний'],
  'activity_level': ['уровень активности', 'уровень повседневной', 'activity'],
  
  // Логистика
  'days_per_week': ['сколько раз в неделю', 'раз в неделю'],
  'preferred_time': ['предпочтительное время', 'время тренировок'],
  'training_location': ['где будете заниматься', 'силовыми упражнениями', 'тренироваться'],
  'client_format': ['формат взаимодействия', 'формат работы', 'формат тренировок'],
  
  // Тренировочные цели
  'training_goals': ['над чем хотели бы', 'работать дополнительно', 'training goals'],
  'training_goals_skill': ['какой именно навык', 'конкретный навык'],
  
  // Дополнительно
  'additional_notes': ['что ещё важно', 'важно учесть', 'additional'],
  'referral_source': ['как узнали', 'referral']
};

// ========== ПРЕОБРАЗОВАНИЕ ЗНАЧЕНИЙ ==========
const VALUE_TRANSFORMS = {
  // Пол
  'мужской': 'male',
  'женский': 'female',
  
  // Цели
  'похудение': 'weight_loss',
  'набор мышечной массы': 'muscle_gain',
  'общая физическая форма': 'general_fitness',
  'здоровье и самочувствие': 'health_wellness',
  'сила': 'strength',
  'выносливость': 'endurance',
  'реабилитация после травмы': 'rehab',
  'другое': 'other',
  
  // Срок
  '1 месяц': '1_month',
  '3 месяца': '3_months',
  '6 месяцев': '6_months',
  '1 год': '1_year',
  'не важно, главное результат': 'no_deadline',
  
  // Опыт
  'нет опыта (первый раз)': 'none',
  'менее 6 месяцев': 'less_6m',
  'от 6 месяцев до 2 лет': '6m_2y',
  'более 2 лет': 'over_2y',
  
  // Активность
  'сидячий образ жизни': 'sedentary',
  'лёгкая активность (прогулки)': 'light',
  'умеренная (2-3 тренировки в неделю)': 'moderate',
  'высокая (4+ тренировки в неделю)': 'active',
  'очень высокая (ежедневные нагрузки)': 'very_active',
  
  // Место тренировок (обновлено)
  'дома': 'home',
  'турники/брусья': 'outdoor',
  'тренажёрный зал': 'gym',
  'комбинированный вариант': 'mixed',
  
  // Формат взаимодействия
  'онлайн (самостоятельно по программе)': 'online',
  'офлайн (личные тренировки)': 'offline',
  'гибрид (онлайн + личные встречи)': 'hybrid',
  
  // Время
  'утро (6:00-12:00)': 'morning',
  'день (12:00-17:00)': 'afternoon',
  'вечер (17:00-22:00)': 'evening',
  'гибкий график': 'flexible',
  
  // Да/Нет
  'да': true,
  'нет': false
};

// ========== ТРЕНИРОВОЧНЫЕ ЦЕЛИ → MANDATORY TASKS ==========
const TRAINING_GOALS_MAPPING = {
  'научиться подтягиваться': { taskId: 'pullups_progress', name: 'Прогресс в подтягиваниях', category: 'strength', frequency: 'per_workout' },
  'улучшить осанку': { taskId: 'posture_work', name: 'Работа над осанкой', category: 'posture', frequency: 'daily' },
  'развить гибкость/растяжку': { taskId: 'flexibility', name: 'Растяжка', category: 'flexibility', frequency: 'daily' },
  'укрепить кор/пресс': { taskId: 'core_work', name: 'Укрепление кора', category: 'core', frequency: 'per_workout' },
  'научиться отжиматься': { taskId: 'pushups_progress', name: 'Прогресс в отжиманиях', category: 'strength', frequency: 'per_workout' },
  'работа над конкретным навыком': { taskId: 'skill_work', name: 'Работа над навыком', category: 'skill', frequency: 'per_workout' }
};


// ================================================================
// ЧАСТЬ 1: ОБРАБОТКА ФОРМЫ
// ================================================================

/**
 * Триггер при отправке формы
 */
function onFormSubmit(e) {
  try {
    Logger.log('=== ONBOARDING v2.0 START ===');
    
    // Получаем данные из события
    const sheet = e.range.getSheet();
    const rowIndex = e.range.getRow();
    const headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
    const values = sheet.getRange(rowIndex, 1, 1, sheet.getLastColumn()).getValues()[0];
    
    // Парсим данные
    const clientData = parseFormData(headers, values);
    Logger.log('Parsed client: ' + clientData.client_name);
    
    // Создаём клиента
    const result = createClientFromFormData(clientData);
    
    // Отправляем уведомление
    if (CONFIG.TRAINER_EMAIL) {
      sendNotification(clientData, result);
    }
    
    Logger.log('=== ONBOARDING SUCCESS ===');
    return result;
    
  } catch (error) {
    Logger.log('ERROR: ' + error.message);
    Logger.log(error.stack);
    
    if (CONFIG.TRAINER_EMAIL) {
      MailApp.sendEmail(CONFIG.TRAINER_EMAIL, '❌ Ошибка онбординга', 
        'Ошибка при создании клиента:\n\n' + error.message + '\n\n' + error.stack);
    }
    throw error;
  }
}

/**
 * Парсинг данных формы
 */
function parseFormData(headers, values) {
  const normalizedHeaders = headers.map(h => String(h).toLowerCase().trim());
  const clientData = {};
  
  // Timestamp
  const timestampIdx = normalizedHeaders.findIndex(h => h.includes('timestamp') || h.includes('метка'));
  if (timestampIdx >= 0) {
    clientData.form_submitted = formatDateSafe(values[timestampIdx]);
  }
  
  // Парсим все поля
  for (const [fieldKey, searchTerms] of Object.entries(FORM_FIELD_MAPPING)) {
    const colIndex = findColumnByTerms(normalizedHeaders, searchTerms);
    
    if (colIndex >= 0) {
      let value = values[colIndex];
      if (value !== '' && value !== null && value !== undefined) {
        clientData[fieldKey] = transformValue(value, fieldKey);
      }
    }
  }
  
  // Если выбрано "другое" в цели — берём свой вариант
  if (clientData.main_goal === 'other' && clientData.main_goal_other) {
    clientData.main_goal_custom = clientData.main_goal_other;
  }
  
  // Определяем тип клиента (приоритет: явный выбор формата)
  clientData.client_type = determineClientType(clientData.training_location, clientData.client_format);
  
  // Генерируем ID и дату старта
  clientData.client_id = generateClientId(clientData.client_name || 'client');
  clientData.start_date = formatDateSafe(new Date());
  
  // Рассчитываем возраст
  if (clientData.birth_date) {
    clientData.age = calculateAge(clientData.birth_date);
  }
  
  return clientData;
}

/**
 * Поиск колонки по термам
 */
function findColumnByTerms(headers, searchTerms) {
  for (const term of searchTerms) {
    const normalizedTerm = term.toLowerCase().trim();
    const exactIndex = headers.findIndex(h => h === normalizedTerm);
    if (exactIndex >= 0) return exactIndex;
    const partialIndex = headers.findIndex(h => h.includes(normalizedTerm));
    if (partialIndex >= 0) return partialIndex;
  }
  return -1;
}

/**
 * Преобразование значения
 */
function transformValue(value, fieldKey) {
  // Дата
  if (fieldKey === 'birth_date' || fieldKey === 'form_submitted') {
    return formatDateSafe(value);
  }
  
  // Числа
  if (['start_weight', 'height', 'target_weight'].includes(fieldKey)) {
    const num = parseFloat(String(value).replace(',', '.'));
    return isNaN(num) ? value : num;
  }
  
  // Дней в неделю
  if (fieldKey === 'days_per_week') {
    const match = String(value).match(/\d+/);
    return match ? parseInt(match[0]) : value;
  }
  
  // Множественный выбор (тренировочные цели)
  if (fieldKey === 'training_goals' && typeof value === 'string') {
    return value.split(', ').map(item => item.trim().toLowerCase());
  }
  
  // Enum преобразования
  const strValue = String(value).toLowerCase().trim();
  if (VALUE_TRANSFORMS[strValue] !== undefined) {
    return VALUE_TRANSFORMS[strValue];
  }
  
  return value;
}

/**
 * Определение типа клиента
 * Приоритет: явный выбор формата > автоопределение по месту тренировок
 */
function determineClientType(location, clientFormat) {
  // Если клиент явно выбрал формат — используем его
  if (clientFormat) {
    if (clientFormat === 'online') return 'online';
    if (clientFormat === 'offline') return 'offline';
    if (clientFormat === 'hybrid') return 'hybrid';
  }
  
  // Иначе определяем по месту тренировок (старая логика)
  if (!location) return 'offline';
  if (location === 'gym') return 'offline';
  if (location === 'home' || location === 'outdoor') return 'online';
  if (location === 'mixed') return 'hybrid';
  return 'offline';
}


// ================================================================
// ЧАСТЬ 2: СОЗДАНИЕ КЛИЕНТА
// ================================================================

/**
 * Создание клиента из данных формы
 */
function createClientFromFormData(clientData) {
  // 1. Создаём таблицу клиента
  const clientSS = createClientSpreadsheet(clientData);
  
  // 2. Создаём лист Form (сырые данные)
  createFormSheet(clientSS, clientData);
  
  // 3. Создаём ClientProfile
  createClientProfileSheet(clientSS, clientData);
  
  // 4. Заполняем Goals
  createGoalsSheet(clientSS, clientData);
  
  // 5. Создаём Nutrition с формулами
  createNutritionSheetWithFormulas(clientSS, clientData);
  
  // 6. Создаём остальные листы
  createClientSheets(clientSS, clientData.client_type);
  
  // 7. Заполняем MandatoryTasks из тренировочных целей
  if (clientData.training_goals) {
    fillMandatoryTasksFromGoals(clientSS, clientData);
  }
  
  // 8. Добавляем в Coach Master
  addClientToMaster(clientData, clientSS.getId());
  
  // 9. Синхронизируем с Supabase (если настроен)
  const supabaseResult = syncClientToSupabase(clientData, clientSS.getId());
  
  return {
    success: true,
    clientId: clientData.client_id,
    clientName: clientData.client_name,
    spreadsheetId: clientSS.getId(),
    spreadsheetUrl: clientSS.getUrl(),
    supabaseId: supabaseResult ? supabaseResult.id : null
  };
}

/**
 * Создание таблицы клиента
 */
function createClientSpreadsheet(clientData) {
  const name = clientData.client_name || 'Новый клиент';
  const fileName = name + '_Tracker';
  const ss = SpreadsheetApp.create(fileName);
  Logger.log('Создана таблица: ' + ss.getUrl());
  return ss;
}


// ================================================================
// ЧАСТЬ 3: ЛИСТЫ КЛИЕНТА
// ================================================================

/**
 * Лист Form — сырые данные из анкеты (backup)
 */
function createFormSheet(ss, clientData) {
  const sheet = ensureSheetWithHeaders(ss, 'Form', ['key', 'value', 'source', 'timestamp']);
  styleHeader(sheet, 4, '#9e9e9e');
  
  const timestamp = clientData.form_submitted || formatDateSafe(new Date());
  const rows = [];
  
  for (const [key, value] of Object.entries(clientData)) {
    if (value !== undefined && value !== null && value !== '') {
      const displayValue = Array.isArray(value) ? value.join(', ') : value;
      rows.push([key, displayValue, 'form', timestamp]);
    }
  }
  
  if (rows.length > 0) {
    sheet.getRange(2, 1, rows.length, 4).setValues(rows);
  }
  
  sheet.autoResizeColumns(1, 4);
  sheet.protect().setDescription('Сырые данные формы — не редактировать');
}

/**
 * Лист ClientProfile — персональные данные (обновляемые)
 */
function createClientProfileSheet(ss, clientData) {
  const sheet = ensureSheetWithHeaders(ss, 'ClientProfile', ['key', 'value', 'unit', 'updated', 'source']);
  styleHeader(sheet, 5, '#4caf50');
  
  const now = formatDateSafe(new Date());
  
  // Данные профиля из формы
  const profileData = [
    ['name', clientData.client_name || '', '', now, 'form'],
    ['birth_date', clientData.birth_date || '', '', now, 'form'],
    ['age', clientData.age || '', 'лет', now, 'calculated'],
    ['phone', clientData.phone || '', '', now, 'form'],
    ['telegram', clientData.telegram || '', '', now, 'form'],
    ['gender', clientData.gender || 'male', '', now, 'form'],
    ['height', clientData.height || '', 'cm', now, 'form'],
    ['weight', clientData.start_weight || '', 'kg', now, 'form'],
    ['body_fat', '', '%', '', ''],
    ['muscle_mass', '', 'kg', '', ''],
    ['fitnessLevel', determineFitnessLevel(clientData.training_experience), '', now, 'calculated'],
    ['clientType', clientData.client_type || 'offline', '', now, 'form'],
    // Здоровье
    ['health_heart', clientData.health_heart || false, '', now, 'form'],
    ['health_injuries', clientData.health_injuries_desc || '', '', now, 'form'],
    ['health_chronic', clientData.health_chronic_desc || '', '', now, 'form'],
    ['health_medications', clientData.health_medications_desc || '', '', now, 'form'],
    ['health_restrictions', clientData.health_restrictions || '', '', now, 'form'],
    // Модули
    ['modules_workouts', clientData.client_type !== 'online', '', '', 'auto'],
    ['modules_nutrition', clientData.client_type !== 'offline', '', '', 'auto'],
    ['modules_daily', true, '', '', 'auto'],
    ['modules_warmup', false, '', '', 'auto'],
    ['modules_measurements', false, '', '', 'auto'],
    ['modules_mandatory', true, '', '', 'auto']
  ];
  
  sheet.getRange(2, 1, profileData.length, 5).setValues(profileData);
  sheet.autoResizeColumns(1, 5);
}

/**
 * Лист Goals — цели программы
 */
function createGoalsSheet(ss, clientData) {
  const sheet = ensureSheetWithHeaders(ss, 'Goals', ['key', 'value']);
  styleHeader(sheet, 2, '#2196f3');
  
  const goalsData = [
    ['main_goal', clientData.main_goal || ''],
    ['main_goal_custom', clientData.main_goal_custom || ''],
    ['target_weight', clientData.target_weight || ''],
    ['goal_timeframe', clientData.goal_timeframe || ''],
    ['goal_description', clientData.goal_description || ''],
    ['start_date', clientData.start_date || ''],
    ['start_weight', clientData.start_weight || ''],
    ['training_experience', clientData.training_experience || ''],
    ['activity_level', clientData.activity_level || 'moderate'],
    ['days_per_week', clientData.days_per_week || ''],
    ['preferred_time', clientData.preferred_time || ''],
    ['training_location', clientData.training_location || '']
  ];
  
  // Убираем пустые
  const filteredData = goalsData.filter(row => row[1] !== '' && row[1] !== null);
  
  if (filteredData.length > 0) {
    sheet.getRange(2, 1, filteredData.length, 2).setValues(filteredData);
  }
  
  sheet.autoResizeColumns(1, 2);
}

/**
 * Лист Nutrition с ФОРМУЛАМИ в ячейках
 * Использует VLOOKUP для поиска значений по ключу в ClientProfile
 */
function createNutritionSheetWithFormulas(ss, clientData) {
  const sheet = ensureSheetWithHeaders(ss, 'Nutrition', ['key', 'value', 'formula_info']);
  styleHeader(sheet, 3, '#ff9800');
  
  // Получаем начальные значения
  const activityLevel = clientData.activity_level || 'moderate';
  
  // Данные с формулами - используем VLOOKUP для поиска по ключу
  // Структура: A = key, B = value
  // VLOOKUP("key", ClientProfile!A:B, 2, FALSE) ищет ключ в колонке A и возвращает значение из B
  const nutritionData = [
    // Row 2: weight
    ['weight', '=IFERROR(VLOOKUP("weight",ClientProfile!A:B,2,FALSE),70)', 'Из ClientProfile (VLOOKUP)'],
    // Row 3: height  
    ['height', '=IFERROR(VLOOKUP("height",ClientProfile!A:B,2,FALSE),170)', 'Из ClientProfile (VLOOKUP)'],
    // Row 4: birth_date
    ['birth_date', '=IFERROR(VLOOKUP("birth_date",ClientProfile!A:B,2,FALSE),"")', 'Из ClientProfile (VLOOKUP)'],
    // Row 5: age - расчёт из даты рождения
    ['age', '=IFERROR(IF(B4<>"",DATEDIF(B4,TODAY(),"Y"),30),30)', 'Авто-расчёт из даты рождения'],
    // Row 6: gender
    ['gender', '=IFERROR(VLOOKUP("gender",ClientProfile!A:B,2,FALSE),"male")', 'Из ClientProfile (VLOOKUP)'],
    
    // Row 7: activity_level
    ['activity_level', activityLevel, 'sedentary/light/moderate/active/very_active'],
    // Row 8: activity_multiplier
    ['activity_multiplier', '=IFS(B7="sedentary",1.2,B7="light",1.375,B7="moderate",1.55,B7="active",1.725,B7="very_active",1.9,TRUE,1.55)', 'Авто-расчёт из уровня активности'],
    
    // Row 9: BMR (Mifflin-St Jeor) — автоопределение пола
    // Мужчины: 10*вес + 6.25*рост - 5*возраст + 5
    // Женщины: 10*вес + 6.25*рост - 5*возраст - 161
    ['BMR', '=IFERROR(IF(B6="female",ROUND(10*B2+6.25*B3-5*B5-161),ROUND(10*B2+6.25*B3-5*B5+5)),1500)', 'Mifflin-St Jeor (М/Ж автоматически)'],
    // Row 10: inbody_bmr
    ['inbody_bmr', '', 'Из InBody замеров (ввод вручную)'],
    // Row 11: bmr_source
    ['bmr_source', '=IF(B10<>"","inbody","calculated")', 'Источник BMR'],
    // Row 12: BMR_final
    ['BMR_final', '=IF(B10<>"",B10,B9)', 'Итоговый BMR (InBody или расчёт)'],
    
    // Row 13: TDEE
    ['TDEE', '=ROUND(B12*B8)', 'BMR × коэффициент активности'],
    // Row 14: deficit_percent
    ['deficit_percent', 15, 'Процент дефицита (ввод тренера)'],
    // Row 15: target_calories
    ['target_calories', '=ROUND(B13*(1-B14/100))', 'TDEE минус дефицит'],
    
    // Row 16-17: коэффициенты макросов
    ['protein_per_kg', 1.8, 'Грамм белка на кг веса (ввод тренера)'],
    ['fat_per_kg', 1.0, 'Грамм жиров на кг веса (ввод тренера)'],
    // Row 18-20: целевые макросы
    ['target_protein', '=ROUND(B2*B16)', 'Белок = вес × коэффициент'],
    ['target_fats', '=ROUND(B2*B17)', 'Жиры = вес × коэффициент'],
    ['target_carbs', '=MAX(50,ROUND((B15-B18*4-B19*9)/4))', 'Углеводы = остаток калорий / 4']
  ];
  
  sheet.getRange(2, 1, nutritionData.length, 3).setValues(nutritionData);
  
  // Форматирование: выделяем итоговые значения
  const highlightRows = [9, 12, 15, 18, 19, 20]; // BMR, BMR_final, target_calories, macros
  highlightRows.forEach(row => {
    sheet.getRange(row, 2).setBackground('#fff3e0').setFontWeight('bold');
  });
  
  sheet.autoResizeColumns(1, 3);
  sheet.setColumnWidth(3, 250);
}

/**
 * Заполнение MandatoryTasks из тренировочных целей
 */
function fillMandatoryTasksFromGoals(ss, clientData) {
  const sheet = ss.getSheetByName('MandatoryTasks');
  if (!sheet) return;
  
  const goals = clientData.training_goals;
  if (!Array.isArray(goals)) return;
  
  const rows = [];
  let taskNum = 1;
  
  for (const goal of goals) {
    const goalLower = goal.toLowerCase();
    
    // Ищем в маппинге
    for (const [key, task] of Object.entries(TRAINING_GOALS_MAPPING)) {
      if (goalLower.includes(key) || key.includes(goalLower)) {
        const description = task.taskId === 'skill_work' && clientData.training_goals_skill
          ? clientData.training_goals_skill
          : '';
        
        rows.push([
          task.taskId + '_' + taskNum,
          task.name,
          description,
          task.frequency,
          '',
          task.category,
          true,
          ''
        ]);
        taskNum++;
        break;
      }
    }
  }
  
  if (rows.length > 0) {
    sheet.getRange(2, 1, rows.length, 8).setValues(rows);
  }
}

/**
 * Создание остальных листов
 */
function createClientSheets(ss, clientType) {
  // Удаляем дефолтный лист
  const defaultSheet = ss.getSheetByName('Sheet1') || ss.getSheetByName('Лист1');
  
  // Общие листы
  createAssessmentSheet(ss);
  createQuotesSheet(ss);
  createDailySheet(ss);
  
  // Online листы
  if (clientType === 'online' || clientType === 'hybrid') {
    createActualNutritionSheet(ss);
  }
  
  // Offline/Hybrid листы
  if (clientType === 'offline' || clientType === 'hybrid') {
    createWorkoutSessionsSheet(ss);
    createWorkoutLogSheet(ss);
    createMandatoryTasksSheet(ss);
    createTrainingBlocksSheet(ss);
  }
  
  // Удаляем дефолтный лист после создания остальных
  if (defaultSheet && ss.getNumSheets() > 1) {
    ss.deleteSheet(defaultSheet);
  }
}

// --- Создание отдельных листов ---

function createDailySheet(ss) {
  const headers = ['Date', 'Weight', 'WakeTime', 'SleepTime', 'SleepHours', 'Pullups', 'Notes'];
  const sheet = ensureSheetWithHeaders(ss, 'Daily', headers);
  styleHeader(sheet, headers.length, '#2196f3');
  sheet.setFrozenRows(1);
}

function createActualNutritionSheet(ss) {
  const headers = ['Date', 'Calories', 'Protein', 'Fats', 'Carbs', 'Notes'];
  const sheet = ensureSheetWithHeaders(ss, 'ActualNutrition', headers);
  styleHeader(sheet, headers.length, '#e91e63');
  sheet.setFrozenRows(1);
}

function createWorkoutSessionsSheet(ss) {
  const headers = ['sessionId', 'date', 'type', 'blockId', 'startTime', 'endTime', 
                   'duration', 'exerciseCount', 'totalSets', 'totalVolume', 'notes', 'rating', 'status'];
  const sheet = ensureSheetWithHeaders(ss, 'WorkoutSessions', headers);
  styleHeader(sheet, headers.length, '#9c27b0');
  sheet.setFrozenRows(1);
}

function createWorkoutLogSheet(ss) {
  // Добавлена колонка technique_score для assessment
  const headers = ['sessionId', 'order', 'exerciseId', 'exerciseName', 'category', 
                   'equipment', 'position', 'setNumber', 'setType', 'weight', 'reps', 
                   'rpe', 'technique_score', 'notes', 'timestamp'];
  const sheet = ensureSheetWithHeaders(ss, 'WorkoutLog', headers);
  styleHeader(sheet, headers.length, '#673ab7');
  sheet.setFrozenRows(1);
}

function createMandatoryTasksSheet(ss) {
  const headers = ['taskId', 'name', 'description', 'frequency', 'duration', 
                   'category', 'active', 'notes'];
  const sheet = ensureSheetWithHeaders(ss, 'MandatoryTasks', headers);
  styleHeader(sheet, headers.length, '#00bcd4');
  sheet.setFrozenRows(1);
}

function createTrainingBlocksSheet(ss) {
  const headers = ['blockId', 'name', 'totalSessions', 'usedSessions', 'remainingSessions',
                   'startDate', 'endDate', 'status', 'priceUSD', 'notes'];
  const sheet = ensureSheetWithHeaders(ss, 'TrainingBlocks', headers);
  styleHeader(sheet, headers.length, '#009688');
  sheet.setFrozenRows(1);
}

function createAssessmentSheet(ss) {
  // История оценок с assessment_id
  const headers = ['assessment_id', 'date', 'key', 'value', 'unit', 'category', 'notes'];
  const sheet = ensureSheetWithHeaders(ss, 'Assessment', headers);
  styleHeader(sheet, headers.length, '#ff5722');
  sheet.setFrozenRows(1);
}

function createQuotesSheet(ss) {
  const sheet = ensureSheetWithHeaders(ss, 'Quotes', ['quote', 'category']);
  styleHeader(sheet, 2, '#607d8b');
  
  const quotes = [
    ['Каждая тренировка — инвестиция в себя', 'motivation'],
    ['Прогресс требует постоянства', 'motivation'],
    ['Дисциплина побеждает мотивацию', 'motivation']
  ];
  sheet.getRange(2, 1, quotes.length, 2).setValues(quotes);
}


// ================================================================
// ЧАСТЬ 4: COACH MASTER
// ================================================================

/**
 * Добавление клиента в Coach Master
 */
function addClientToMaster(clientData, spreadsheetId) {
  const masterSS = SpreadsheetApp.openById(CONFIG.COACH_MASTER_ID);
  
  const headers = ['id', 'name', 'spreadsheetId', 'clientType', 'status', 
                   'startDate', 'phone', 'notes'];
  const sheet = ensureSheetWithHeaders(masterSS, 'Clients', headers);
  const cols = ensureColumnsExist(sheet, headers);
  
  const newRow = new Array(sheet.getLastColumn()).fill('');
  newRow[cols.id] = clientData.client_id;
  newRow[cols.name] = clientData.client_name || '';
  newRow[cols.spreadsheetid] = spreadsheetId;
  newRow[cols.clienttype] = clientData.client_type || 'offline';
  newRow[cols.status] = 'pending_assessment'; // Ожидает вводную
  newRow[cols.startdate] = clientData.start_date || '';
  newRow[cols.phone] = clientData.phone || clientData.telegram || '';
  newRow[cols.notes] = 'Онбординг v2.0 — ' + (clientData.form_submitted || '');
  
  sheet.appendRow(newRow);
  Logger.log('Клиент добавлен в Coach Master: ' + clientData.client_id);
}


// ================================================================
// ЧАСТЬ 5: ВСПОМОГАТЕЛЬНЫЕ ФУНКЦИИ
// ================================================================

function ensureSheetWithHeaders(ss, sheetName, headers) {
  let sheet = ss.getSheetByName(sheetName);
  if (!sheet) {
    sheet = ss.insertSheet(sheetName);
    if (headers && headers.length > 0) {
      sheet.appendRow(headers);
    }
  }
  return sheet;
}

function ensureColumnsExist(sheet, requiredColumns) {
  const lastCol = Math.max(sheet.getLastColumn(), 1);
  const headers = sheet.getRange(1, 1, 1, lastCol).getValues()[0];
  const headersLower = headers.map(h => String(h).toLowerCase().trim());
  const result = {};
  
  for (const colName of requiredColumns) {
    const colNameLower = colName.toLowerCase();
    let idx = headersLower.findIndex(h => h === colNameLower);
    
    if (idx === -1) {
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

function styleHeader(sheet, colCount, bgColor) {
  sheet.getRange(1, 1, 1, colCount)
    .setFontWeight('bold')
    .setBackground(bgColor)
    .setFontColor('#ffffff');
}

function generateClientId(name) {
  const translit = transliterate(name);
  const shortName = translit.toLowerCase().replace(/[^a-z]/g, '').substring(0, 10);
  const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
  return (shortName || 'client') + '_' + random;
}

function transliterate(text) {
  const map = {
    'а':'a','б':'b','в':'v','г':'g','д':'d','е':'e','ё':'yo','ж':'zh',
    'з':'z','и':'i','й':'y','к':'k','л':'l','м':'m','н':'n','о':'o',
    'п':'p','р':'r','с':'s','т':'t','у':'u','ф':'f','х':'h','ц':'ts',
    'ч':'ch','ш':'sh','щ':'sch','ъ':'','ы':'y','ь':'','э':'e','ю':'yu','я':'ya'
  };
  return String(text).toLowerCase().split('').map(char => map[char] || char).join('');
}

function formatDateSafe(value) {
  if (!value) return '';
  try {
    const date = new Date(value);
    if (isNaN(date.getTime())) return String(value);
    return Utilities.formatDate(date, Session.getScriptTimeZone(), 'yyyy-MM-dd');
  } catch (e) {
    return String(value);
  }
}

function calculateAge(birthDate) {
  if (!birthDate) return null;
  try {
    const birth = new Date(birthDate);
    if (isNaN(birth.getTime())) return null;
    const today = new Date();
    let age = today.getFullYear() - birth.getFullYear();
    const m = today.getMonth() - birth.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) age--;
    return age;
  } catch (e) {
    return null;
  }
}

function determineFitnessLevel(experience) {
  if (!experience) return 'beginner';
  if (experience === 'none' || experience === 'less_6m') return 'beginner';
  if (experience === '6m_2y') return 'intermediate';
  if (experience === 'over_2y') return 'advanced';
  return 'beginner';
}


// ================================================================
// ЧАСТЬ 6: УВЕДОМЛЕНИЯ
// ================================================================

function sendNotification(clientData, result) {
  const subject = '🎉 Новая заявка: ' + (clientData.client_name || 'Клиент');
  
  const body = `
НОВАЯ ЗАЯВКА НА ТРЕНИРОВКИ

👤 Клиент: ${clientData.client_name || '—'}
📱 Контакт: ${clientData.phone || clientData.telegram || '—'}

📊 Данные:
• Возраст: ${clientData.age || '—'} лет
• Рост: ${clientData.height || '—'} см
• Вес: ${clientData.start_weight || '—'} кг
• Пол: ${clientData.gender === 'female' ? 'Женский' : 'Мужской'}

🎯 Цель: ${clientData.main_goal || clientData.main_goal_custom || '—'}
📅 Срок: ${clientData.goal_timeframe || '—'}

🏋️ Опыт: ${clientData.training_experience || '—'}
📍 Место: ${clientData.training_location || '—'}
📆 Дней/неделю: ${clientData.days_per_week || '—'}

${clientData.health_injuries_desc || clientData.health_chronic_desc || clientData.health_restrictions ? 
  '⚠️ ЗДОРОВЬЕ:\n' + 
  (clientData.health_injuries_desc ? '• Травмы: ' + clientData.health_injuries_desc + '\n' : '') +
  (clientData.health_chronic_desc ? '• Хронические: ' + clientData.health_chronic_desc + '\n' : '') +
  (clientData.health_restrictions ? '• Ограничения: ' + clientData.health_restrictions + '\n' : '')
: ''}

📝 Доп. информация: ${clientData.additional_notes || '—'}

═══════════════════════════════════════

🔗 Таблица клиента:
${result.spreadsheetUrl}

📋 Вводная оценка:
https://trakerofflain.netlify.app/assessment.html?client=${result.clientId}

Статус: pending_assessment
  `;
  
  MailApp.sendEmail(CONFIG.TRAINER_EMAIL, subject, body);
  Logger.log('Уведомление отправлено: ' + CONFIG.TRAINER_EMAIL);
}


// ================================================================
// ЧАСТЬ 7: СОЗДАНИЕ ФОРМЫ (запускать вручную один раз)
// ================================================================

/**
 * Создание Google Form v2 с обновлёнными вопросами
 */
function createOnboardingFormV2() {
  const form = FormApp.create('Заявка на персональные тренировки v2');
  form.setDescription('Заполните анкету для начала персональных тренировок с Николаем');
  form.setConfirmationMessage('Спасибо! Я свяжусь с вами в ближайшее время для назначения вводной тренировки.');
  
  // === КОНТАКТЫ ===
  form.addSectionHeaderItem().setTitle('📋 Контактная информация');
  
  form.addTextItem()
    .setTitle('Ваше имя')
    .setRequired(true);
  
  form.addDateItem()
    .setTitle('Дата рождения')
    .setRequired(true);
  
  form.addTextItem()
    .setTitle('Телефон / WhatsApp')
    .setRequired(true);
  
  form.addTextItem()
    .setTitle('Telegram (если есть)')
    .setRequired(false);
  
  // === ФИЗИЧЕСКИЕ ДАННЫЕ ===
  form.addSectionHeaderItem().setTitle('📏 Физические данные');
  
  form.addMultipleChoiceItem()
    .setTitle('Пол')
    .setChoiceValues(['Мужской', 'Женский'])
    .setRequired(true);
  
  form.addTextItem()
    .setTitle('Рост (см)')
    .setRequired(true);
  
  form.addTextItem()
    .setTitle('Текущий вес (кг)')
    .setRequired(true);
  
  // === ЦЕЛИ ===
  form.addSectionHeaderItem().setTitle('🎯 Ваши цели');
  
  form.addMultipleChoiceItem()
    .setTitle('Основная цель тренировок')
    .setChoiceValues([
      'Похудение',
      'Набор мышечной массы',
      'Общая физическая форма',
      'Здоровье и самочувствие',
      'Сила',
      'Выносливость',
      'Реабилитация после травмы',
      'Другое'
    ])
    .setRequired(true);
  
  form.addTextItem()
    .setTitle('Если выбрали "Другое" — укажите свой вариант цели')
    .setRequired(false);
  
  form.addTextItem()
    .setTitle('Целевой вес (кг) — если хотите изменить вес')
    .setRequired(false);
  
  form.addMultipleChoiceItem()
    .setTitle('За какой срок хотите достичь цели?')
    .setChoiceValues([
      '1 месяц',
      '3 месяца',
      '6 месяцев',
      '1 год',
      'Не важно, главное результат'
    ])
    .setRequired(true);
  
  form.addParagraphTextItem()
    .setTitle('Опишите свою цель своими словами')
    .setHelpText('Что для вас значит достичь этой цели? Как изменится ваша жизнь?')
    .setRequired(false);
  
  // === ЗДОРОВЬЕ ===
  form.addSectionHeaderItem().setTitle('❤️ Здоровье');
  
  form.addMultipleChoiceItem()
    .setTitle('Есть ли проблемы с сердцем или давлением?')
    .setChoiceValues(['Нет', 'Да'])
    .setRequired(true);
  
  form.addMultipleChoiceItem()
    .setTitle('Есть ли боли в суставах, спине или травмы?')
    .setChoiceValues(['Нет', 'Да'])
    .setRequired(true);
  
  form.addParagraphTextItem()
    .setTitle('Опишите травмы или боли (если есть)')
    .setRequired(false);
  
  form.addMultipleChoiceItem()
    .setTitle('Есть ли хронические заболевания?')
    .setChoiceValues(['Нет', 'Да'])
    .setRequired(true);
  
  form.addParagraphTextItem()
    .setTitle('Какие хронические заболевания? (если есть)')
    .setRequired(false);
  
  form.addMultipleChoiceItem()
    .setTitle('Принимаете ли лекарства на постоянной основе?')
    .setChoiceValues(['Нет', 'Да'])
    .setRequired(true);
  
  form.addTextItem()
    .setTitle('Какие лекарства? (если есть)')
    .setRequired(false);
  
  form.addParagraphTextItem()
    .setTitle('Какие ещё есть ограничения к физическим нагрузкам?')
    .setHelpText('Например: недавние операции, беременность, особенности здоровья')
    .setRequired(false);
  
  // === ОПЫТ ===
  form.addSectionHeaderItem().setTitle('🏋️ Опыт и активность');
  
  form.addMultipleChoiceItem()
    .setTitle('Опыт тренировок')
    .setChoiceValues([
      'Нет опыта (первый раз)',
      'Менее 6 месяцев',
      'От 6 месяцев до 2 лет',
      'Более 2 лет'
    ])
    .setRequired(true);
  
  form.addMultipleChoiceItem()
    .setTitle('Когда последний раз занимались регулярно?')
    .setChoiceValues([
      'Тренируюсь сейчас регулярно',
      '1-2 недели назад',
      '1-3 месяца назад',
      'Более 3 месяцев назад',
      'Никогда'
    ])
    .setRequired(true);
  
  form.addMultipleChoiceItem()
    .setTitle('Уровень повседневной активности')
    .setChoiceValues([
      'Сидячий образ жизни',
      'Лёгкая активность (прогулки)',
      'Умеренная (2-3 тренировки в неделю)',
      'Высокая (4+ тренировки в неделю)',
      'Очень высокая (ежедневные нагрузки)'
    ])
    .setRequired(true);
  
  // === ЛОГИСТИКА ===
  form.addSectionHeaderItem().setTitle('📅 Логистика');
  
  form.addMultipleChoiceItem()
    .setTitle('Сколько раз в неделю готовы заниматься?')
    .setChoiceValues(['2 раза', '3 раза', '4 раза', '5+ раз'])
    .setRequired(true);
  
  form.addMultipleChoiceItem()
    .setTitle('Предпочтительное время тренировок')
    .setChoiceValues([
      'Утро (6:00-12:00)',
      'День (12:00-17:00)',
      'Вечер (17:00-22:00)',
      'Гибкий график'
    ])
    .setRequired(true);
  
  form.addMultipleChoiceItem()
    .setTitle('Где будете заниматься силовыми упражнениями?')
    .setChoiceValues([
      'Дома',
      'Турники/брусья',
      'Тренажёрный зал',
      'Комбинированный вариант'
    ])
    .setRequired(true);
  
  form.addMultipleChoiceItem()
    .setTitle('Формат взаимодействия')
    .setHelpText('Онлайн — получаете программу и занимаетесь самостоятельно. Офлайн — личные тренировки. Гибрид — комбинация.')
    .setChoiceValues([
      'Онлайн (самостоятельно по программе)',
      'Офлайн (личные тренировки)',
      'Гибрид (онлайн + личные встречи)'
    ])
    .setRequired(true);
  
  // === ТРЕНИРОВОЧНЫЕ ЦЕЛИ ===
  form.addSectionHeaderItem().setTitle('🎯 Тренировочные цели');
  
  form.addCheckboxItem()
    .setTitle('Над чем хотели бы работать дополнительно?')
    .setChoiceValues([
      'Научиться подтягиваться',
      'Улучшить осанку',
      'Развить гибкость/растяжку',
      'Укрепить кор/пресс',
      'Научиться отжиматься',
      'Работа над конкретным навыком'
    ])
    .setRequired(false);
  
  form.addTextItem()
    .setTitle('Если выбрали "навык" — какой именно?')
    .setRequired(false);
  
  // === ДОПОЛНИТЕЛЬНО ===
  form.addSectionHeaderItem().setTitle('📝 Дополнительно');
  
  form.addParagraphTextItem()
    .setTitle('Что ещё важно учесть?')
    .setRequired(false);
  
  form.addMultipleChoiceItem()
    .setTitle('Как узнали обо мне?')
    .setChoiceValues([
      'Рекомендация друга',
      'Instagram',
      'Поиск в интернете',
      'Другое'
    ])
    .setRequired(false);
  
  // Создаём таблицу ответов
  const ss = SpreadsheetApp.create('Ответы: Заявка на тренировки v2');
  form.setDestination(FormApp.DestinationType.SPREADSHEET, ss.getId());
  
  Logger.log('✅ Форма создана: ' + form.getEditUrl());
  Logger.log('✅ Таблица ответов: ' + ss.getUrl());
  Logger.log('');
  Logger.log('СЛЕДУЮЩИЕ ШАГИ:');
  Logger.log('1. Открой таблицу ответов: ' + ss.getUrl());
  Logger.log('2. Расширения → Apps Script');
  Logger.log('3. Вставь этот же код (ONBOARDING_V2.gs)');
  Logger.log('4. Создай триггер: onFormSubmit → При отправке формы');
  
  return {
    formUrl: form.getEditUrl(),
    formPublicUrl: form.getPublishedUrl(),
    spreadsheetUrl: ss.getUrl()
  };
}


// ================================================================
// ЧАСТЬ 8: ТЕСТИРОВАНИЕ
// ================================================================

/**
 * Тест с моковыми данными
 */
function testOnboardingV2() {
  const testData = {
    client_name: 'Тест Клиент',
    birth_date: '1990-05-15',
    phone: '+628123456789',
    telegram: '@testclient',
    gender: 'male',
    height: 180,
    start_weight: 85,
    main_goal: 'weight_loss',
    target_weight: 75,
    goal_timeframe: '3_months',
    goal_description: 'Хочу сбросить 10 кг к лету',
    training_experience: '6m_2y',
    activity_level: 'moderate',
    days_per_week: 3,
    preferred_time: 'evening',
    training_location: 'gym',
    training_goals: ['научиться подтягиваться', 'улучшить осанку'],
    health_injuries_desc: 'Иногда болит поясница',
    additional_notes: 'Тестовый клиент',
    client_type: 'offline',
    client_id: 'test_' + Date.now(),
    start_date: formatDateSafe(new Date()),
    form_submitted: formatDateSafe(new Date()),
    age: 34
  };
  
  Logger.log('=== ТЕСТ ONBOARDING V2 ===');
  
  try {
    const result = createClientFromFormData(testData);
    Logger.log('✅ Успех!');
    Logger.log('Таблица: ' + result.spreadsheetUrl);
    return result;
  } catch (e) {
    Logger.log('❌ Ошибка: ' + e.message);
    Logger.log(e.stack);
    throw e;
  }
}


// ================================================================
// ЧАСТЬ 9: СИНХРОНИЗАЦИЯ С SUPABASE
// ================================================================

/**
 * Синхронизация клиента с Supabase
 * Вызывается автоматически при создании клиента из формы
 * 
 * @param {Object} clientData - Данные клиента из формы
 * @param {string} spreadsheetId - ID таблицы клиента в Google Sheets
 * @returns {Object|null} - Результат из Supabase или null если не настроен
 */
function syncClientToSupabase(clientData, spreadsheetId) {
  try {
    // Получаем конфигурацию Supabase
    const config = getSupabaseConfigSafe();
    if (!config) {
      Logger.log('SUPABASE: Не настроен (пропускаем синхронизацию)');
      return null;
    }
    
    // Получаем или создаём тренера
    const trainerId = getOrCreateTrainer(config);
    
    // Формируем профиль клиента (JSONB для Supabase)
    const profile = {
      birth_date: clientData.birth_date || null,
      age: clientData.age || null,
      gender: clientData.gender || 'male',
      height: clientData.height || null,
      weight: clientData.start_weight || null,
      phone: clientData.phone || null,
      telegram: clientData.telegram || null,
      training_location: clientData.training_location || null,
      training_experience: clientData.training_experience || null,
      activity_level: clientData.activity_level || 'moderate',
      days_per_week: clientData.days_per_week || null,
      preferred_time: clientData.preferred_time || null,
      main_goal: clientData.main_goal || null,
      main_goal_custom: clientData.main_goal_custom || null,
      target_weight: clientData.target_weight || null,
      goal_timeframe: clientData.goal_timeframe || null,
      goal_description: clientData.goal_description || null,
      training_goals: clientData.training_goals || [],
      health: {
        heart: clientData.health_heart || false,
        injuries: clientData.health_injuries_desc || null,
        chronic: clientData.health_chronic_desc || null,
        medications: clientData.health_medications_desc || null,
        restrictions: clientData.health_restrictions || null
      },
      additional_notes: clientData.additional_notes || null,
      referral_source: clientData.referral_source || null,
      client_type: clientData.client_type || 'offline',
      client_format: clientData.client_format || null,
      google_sheets_id: spreadsheetId,
      gas_client_id: clientData.client_id || null,
      onboarded_at: new Date().toISOString(),
      form_submitted: clientData.form_submitted || null
    };
    
    // Создаём клиента в Supabase
    const result = supabasePostSafe(config, 'clients', {
      trainer_id: trainerId,
      email: null,
      name: clientData.client_name || 'Новый клиент',
      status: 'onboarding',
      profile: profile
    });
    
    Logger.log('SUPABASE: ✅ Клиент синхронизирован: ' + result.id);
    return result;
    
  } catch (error) {
    Logger.log('SUPABASE ERROR: ' + error.message);
    // Не прерываем основной процесс — форма всё равно обработается
    return null;
  }
}

/**
 * Безопасное получение конфигурации Supabase из свойств скрипта
 */
function getSupabaseConfigSafe() {
  try {
    const props = PropertiesService.getScriptProperties();
    const url = props.getProperty('SUPABASE_URL');
    const key = props.getProperty('SUPABASE_SERVICE_ROLE_KEY');
    
    if (!url || !key) {
      return null;
    }
    
    // Нормализация URL
    let normalizedUrl = String(url).trim().replace(/\/$/, '');
    if (!normalizedUrl.startsWith('https://') && !normalizedUrl.startsWith('http://')) {
      normalizedUrl = 'https://' + normalizedUrl;
    }
    
    return { url: normalizedUrl, key: key };
  } catch (e) {
    Logger.log('getSupabaseConfigSafe error: ' + e.message);
    return null;
  }
}

/**
 * POST запрос к Supabase REST API
 */
function supabasePostSafe(config, table, payload) {
  const res = UrlFetchApp.fetch(config.url + '/rest/v1/' + table, {
    method: 'post',
    contentType: 'application/json',
    headers: {
      'apikey': config.key,
      'Authorization': 'Bearer ' + config.key,
      'Prefer': 'return=representation'
    },
    payload: JSON.stringify(payload),
    muteHttpExceptions: true
  });
  
  if (res.getResponseCode() >= 400) {
    throw new Error(table + ' POST error: ' + res.getContentText());
  }
  
  const json = JSON.parse(res.getContentText());
  return Array.isArray(json) ? json[0] : json;
}

/**
 * GET запрос к Supabase REST API
 */
function supabaseGet(config, table, query) {
  const res = UrlFetchApp.fetch(config.url + '/rest/v1/' + table + '?' + query, {
    method: 'get',
    headers: {
      'apikey': config.key,
      'Authorization': 'Bearer ' + config.key
    },
    muteHttpExceptions: true
  });
  
  if (res.getResponseCode() >= 400) {
    throw new Error(table + ' GET error: ' + res.getContentText());
  }
  
  return JSON.parse(res.getContentText());
}

/**
 * Получение или создание тренера в Supabase
 */
function getOrCreateTrainer(config) {
  // Проверяем кэш
  const cached = CacheService.getScriptCache().get('supabase_trainer_id');
  if (cached) return cached;
  
  // Ищем существующего тренера по email
  const trainers = supabaseGet(config, 'trainers', 
    'email=eq.' + encodeURIComponent(CONFIG.TRAINER_EMAIL) + '&select=id'
  );
  
  if (trainers && trainers.length > 0) {
    CacheService.getScriptCache().put('supabase_trainer_id', trainers[0].id, 3600);
    return trainers[0].id;
  }
  
  // Создаём нового тренера
  const newTrainer = supabasePostSafe(config, 'trainers', {
    email: CONFIG.TRAINER_EMAIL,
    name: 'Николай',
    subscription_plan: 'free'
  });
  
  CacheService.getScriptCache().put('supabase_trainer_id', newTrainer.id, 3600);
  Logger.log('SUPABASE: Создан тренер: ' + newTrainer.id);
  return newTrainer.id;
}

/**
 * Ручная синхронизация существующего клиента с Supabase
 * Использовать если клиент был создан до интеграции (например, Саша)
 * 
 * Как использовать:
 * 1. Открыть редактор GAS
 * 2. Запустить функцию syncExistingClientToSupabase('имя_клиента')
 * 
 * @param {string} clientName - Имя клиента для поиска в Coach Master
 */
function syncExistingClientToSupabase(clientName) {
  const config = getSupabaseConfigSafe();
  if (!config) {
    Logger.log('❌ Supabase не настроен! Добавь SUPABASE_URL и SUPABASE_SERVICE_ROLE_KEY в свойства скрипта.');
    return null;
  }
  
  // Открываем Coach Master
  const masterSS = SpreadsheetApp.openById(CONFIG.COACH_MASTER_ID);
  const clientsSheet = masterSS.getSheetByName('Clients');
  if (!clientsSheet) {
    Logger.log('❌ Лист Clients не найден в Coach Master');
    return null;
  }
  
  // Ищем клиента по имени
  const data = clientsSheet.getDataRange().getValues();
  const headers = data[0].map(h => String(h).toLowerCase().trim());
  const nameCol = headers.indexOf('name');
  const idCol = headers.indexOf('id');
  const spreadsheetIdCol = headers.indexOf('spreadsheetid');
  
  let clientRow = null;
  for (let i = 1; i < data.length; i++) {
    const name = String(data[i][nameCol] || '').trim();
    if (name.toLowerCase().includes(clientName.toLowerCase())) {
      clientRow = data[i];
      Logger.log('Найден клиент: ' + name);
      break;
    }
  }
  
  if (!clientRow) {
    Logger.log('❌ Клиент "' + clientName + '" не найден в Coach Master');
    return null;
  }
  
  const clientId = clientRow[idCol];
  const spreadsheetId = clientRow[spreadsheetIdCol];
  
  if (!spreadsheetId) {
    Logger.log('❌ У клиента нет spreadsheetId');
    return null;
  }
  
  // Открываем таблицу клиента и читаем данные
  try {
    const clientSS = SpreadsheetApp.openById(spreadsheetId);
    const clientData = readClientDataFromSpreadsheet(clientSS, clientId);
    
    // Синхронизируем с Supabase
    const result = syncClientToSupabase(clientData, spreadsheetId);
    
    if (result) {
      Logger.log('✅ Клиент "' + clientData.client_name + '" синхронизирован!');
      Logger.log('   Supabase ID: ' + result.id);
    }
    
    return result;
  } catch (e) {
    Logger.log('❌ Ошибка открытия таблицы клиента: ' + e.message);
    return null;
  }
}

/**
 * Чтение данных клиента из его таблицы (для ручной синхронизации)
 */
function readClientDataFromSpreadsheet(ss, clientId) {
  const clientData = { client_id: clientId };
  
  // Читаем ClientProfile
  const profileSheet = ss.getSheetByName('ClientProfile');
  if (profileSheet) {
    const profileData = profileSheet.getDataRange().getValues();
    for (let i = 1; i < profileData.length; i++) {
      const key = String(profileData[i][0] || '').trim();
      const value = profileData[i][1];
      if (key && value !== '' && value !== null) {
        clientData[key] = value;
      }
    }
    // Маппинг полей
    clientData.client_name = clientData.name || clientData.client_name;
    clientData.start_weight = clientData.weight || clientData.start_weight;
  }
  
  // Читаем Goals
  const goalsSheet = ss.getSheetByName('Goals');
  if (goalsSheet) {
    const goalsData = goalsSheet.getDataRange().getValues();
    for (let i = 1; i < goalsData.length; i++) {
      const key = String(goalsData[i][0] || '').trim();
      const value = goalsData[i][1];
      if (key && value !== '' && value !== null && !clientData[key]) {
        clientData[key] = value;
      }
    }
  }
  
  // Читаем Form (сырые данные)
  const formSheet = ss.getSheetByName('Form');
  if (formSheet) {
    const formData = formSheet.getDataRange().getValues();
    for (let i = 1; i < formData.length; i++) {
      const key = String(formData[i][0] || '').trim();
      const value = formData[i][1];
      if (key && value !== '' && value !== null && !clientData[key]) {
        clientData[key] = value;
      }
    }
  }
  
  // Определяем тип клиента если не указан
  if (!clientData.client_type) {
    clientData.client_type = determineClientType(clientData.training_location);
  }
  
  return clientData;
}

/**
 * Тест Supabase подключения
 */
function testSupabaseConnection() {
  const config = getSupabaseConfigSafe();
  
  if (!config) {
    Logger.log('❌ Supabase НЕ НАСТРОЕН!');
    Logger.log('');
    Logger.log('Инструкция:');
    Logger.log('1. Файл → Настройки проекта → Свойства скрипта');
    Logger.log('2. Добавь свойства:');
    Logger.log('   SUPABASE_URL = https://aobnfwvjmnbwdytagqyl.supabase.co');
    Logger.log('   SUPABASE_SERVICE_ROLE_KEY = eyJhbG...(твой ключ)');
    return false;
  }
  
  Logger.log('✅ Supabase настроен: ' + config.url);
  
  try {
    const trainerId = getOrCreateTrainer(config);
    Logger.log('✅ Тренер найден/создан: ' + trainerId);
    
    // Проверяем клиентов
    const clients = supabaseGet(config, 'clients', 'select=id,name&limit=5');
    Logger.log('✅ Клиентов в базе: ' + clients.length);
    
    return true;
  } catch (e) {
    Logger.log('❌ Ошибка подключения: ' + e.message);
    return false;
  }
}
