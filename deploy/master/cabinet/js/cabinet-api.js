/**
 * Кабинет тренера — все запросы к Supabase.
 * Использует глобальный window.cabinetSupabase (устанавливается на странице после createClient).
 * Функции используются глобально другими скриптами кабинета (cabinet-body, cabinet-workouts и т.д.).
 */
/* exported getSupabase, getClients, getProgramsByClientIds, getBlocksByProgramIds, getClientById, getClientBlocks, getBlockUsedCounts, ensureClientProgram, createBlock, createSession, getWorkoutSessions, getWorkoutLog, getWorkoutSetsBySessionIds, getExercises, getInBodyData, getNutritionData, getWearableData, saveDashboardSettings, getDashboardSettings */

function getSupabase() {
  if (typeof window.cabinetSupabase === 'undefined') {
    throw new Error(
      'cabinetSupabase не инициализирован. Подключите supabase-config.js и создайте клиент.'
    );
  }
  return window.cabinetSupabase;
}

/** Получить список клиентов тренера (RLS вернёт только своих) */
async function getClients() {
  const { data, error } = await getSupabase()
    .from('clients')
    .select('id, name, email, status, profile')
    .order('name');
  if (error) throw error;
  return data || [];
}

/** Программы по списку client_id (для списка карточек) */
async function getProgramsByClientIds(clientIds) {
  if (!clientIds.length) return [];
  const { data, error } = await getSupabase()
    .from('programs')
    .select('id, client_id, type, status')
    .in('client_id', clientIds);
  if (error) throw error;
  return data || [];
}

/** Блоки по списку program_id */
async function getBlocksByProgramIds(programIds) {
  if (!programIds.length) return [];
  const { data, error } = await getSupabase()
    .from('training_blocks')
    .select('id, program_id, name, total_sessions, start_date, status')
    .in('program_id', programIds)
    .order('start_date', { ascending: false });
  if (error) throw error;
  return data || [];
}

/** Получить данные клиента по ID */
async function getClientById(clientId) {
  const { data, error } = await getSupabase()
    .from('clients')
    .select('*')
    .eq('id', clientId)
    .single();
  if (error) throw error;
  return data;
}

/** Получить блоки клиента (через программы) */
async function getClientBlocks(clientId) {
  const { data: programs } = await getSupabase()
    .from('programs')
    .select('id')
    .eq('client_id', clientId);
  if (!programs?.length) return [];
  const programIds = programs.map((p) => p.id);
  const { data: blocks, error } = await getSupabase()
    .from('training_blocks')
    .select('id, program_id, name, total_sessions, start_date, end_date, cost, status')
    .in('program_id', programIds)
    .order('start_date', { ascending: false });
  if (error) throw error;
  return blocks || [];
}

/** Получить использованные сессии по блокам (для счётчиков) */
async function getBlockUsedCounts(blockIds) {
  if (!blockIds.length) return {};
  const counts = {};
  for (const bid of blockIds) {
    const { count, error } = await getSupabase()
      .from('workout_sessions')
      .select('*', { count: 'exact', head: true })
      .eq('block_id', bid)
      .eq('status', 'completed');
    if (!error) counts[bid] = count ?? 0;
  }
  return counts;
}

/** Получить первую программу клиента (для создания блока) */
async function getClientProgramId(clientId) {
  const { data, error } = await getSupabase()
    .from('programs')
    .select('id')
    .eq('client_id', clientId)
    .limit(1)
    .maybeSingle();
  if (error) throw error;
  return data?.id ?? null;
}

/** Создать программу клиента, если нет (тип offline). Требуется trainer_id из клиента. */
async function ensureClientProgram(clientId) {
  const existing = await getClientProgramId(clientId);
  if (existing) return existing;
  const client = await getClientById(clientId);
  const trainerId = client?.trainer_id;
  if (!trainerId) throw new Error('У клиента нет привязки к тренеру');
  const { data, error } = await getSupabase()
    .from('programs')
    .insert({
      trainer_id: trainerId,
      client_id: clientId,
      name: 'Программа',
      type: 'offline',
      status: 'active',
    })
    .select('id')
    .single();
  if (error) throw error;
  return data.id;
}

/** Создать блок тренировок */
async function createBlock(programId, payload) {
  const { data, error } = await getSupabase()
    .from('training_blocks')
    .insert({
      program_id: programId,
      name: payload.name || 'Новый блок',
      total_sessions: payload.total_sessions ?? 0,
      used_sessions: 0,
      start_date: payload.start_date || new Date().toISOString().slice(0, 10),
      status: payload.status || 'active',
    })
    .select('id')
    .single();
  if (error) throw error;
  return data;
}

/** Создать сессию тренировки (пустая, без подходов) */
async function createSession(clientId, payload) {
  const { data, error } = await getSupabase()
    .from('workout_sessions')
    .insert({
      client_id: clientId,
      block_id: payload.block_id || null,
      date: payload.date || new Date().toISOString().slice(0, 10),
      type: payload.type || 'Тренировка',
      status: payload.status || 'planned',
      notes: payload.notes || null,
      total_tonnage: null,
    })
    .select('id')
    .single();
  if (error) throw error;
  return data;
}

/** Получить сессии клиента с фильтром по периоду (periodDays = null — всё) */
async function getWorkoutSessions(clientId, periodDays = null) {
  let q = getSupabase()
    .from('workout_sessions')
    .select('id, client_id, block_id, date, type, status, notes, total_tonnage, created_at')
    .eq('client_id', clientId)
    .order('date', { ascending: false });
  if (periodDays != null && periodDays > 0) {
    const fromDate = new Date();
    fromDate.setDate(fromDate.getDate() - periodDays);
    q = q.gte('date', fromDate.toISOString().slice(0, 10));
  }
  const { data, error } = await q.limit(500);
  if (error) throw error;
  return data || [];
}

/** Получить детали сессии (подходы/упражнения) */
async function getWorkoutLog(sessionId) {
  const { data, error } = await getSupabase()
    .from('workout_sets')
    .select('id, session_id, exercise_id, exercise_name, set_number, reps, weight, rpe')
    .eq('session_id', sessionId)
    .order('set_number');
  if (error) throw error;
  return data || [];
}

/** Получить подходы по списку session_id (для вкладки Тренировки) */
async function getWorkoutSetsBySessionIds(sessionIds) {
  if (!sessionIds.length) return [];
  const { data, error } = await getSupabase()
    .from('workout_sets')
    .select('id, session_id, exercise_id, exercise_name, set_number, reps, weight, rpe')
    .in('session_id', sessionIds)
    .order('session_id')
    .order('set_number');
  if (error) throw error;
  return data || [];
}

/** Список упражнений (id, name, category, subcategory, muscle_coefficients) для агрегации нагрузки */
async function getExercises(limit = 500) {
  const { data, error } = await getSupabase()
    .from('exercises')
    .select('id, name, category, subcategory, muscle_coefficients')
    .limit(limit);
  if (error) throw error;
  return data || [];
}

/** Получить данные InBody (body_composition) клиента */
async function getInBodyData(clientId) {
  const { data, error } = await getSupabase()
    .from('body_composition')
    .select('id, date, weight, body_fat, muscle_mass, water, bone_mass, bmr, source')
    .eq('client_id', clientId)
    .order('date', { ascending: false })
    .limit(100);
  if (error) throw error;
  return data || [];
}

/** Получить данные питания: агрегат по дням из nutrition_logs (калории, БЖУ за день) */
async function getNutritionData(clientId, days = 30) {
  const fromDate = new Date();
  fromDate.setDate(fromDate.getDate() - days);
  const fromStr = fromDate.toISOString().slice(0, 10);
  const { data: rows, error } = await getSupabase()
    .from('nutrition_logs')
    .select('date, calories, protein, fats, carbs')
    .eq('client_id', clientId)
    .gte('date', fromStr)
    .order('date', { ascending: false });
  if (error) throw error;
  const byDate = {};
  (rows || []).forEach((r) => {
    const d = (r.date || '').slice(0, 10);
    if (!byDate[d]) byDate[d] = { date: d, calories: 0, protein: 0, fats: 0, carbs: 0 };
    byDate[d].calories += Number(r.calories) || 0;
    byDate[d].protein += Number(r.protein) || 0;
    byDate[d].fats += Number(r.fats) || 0;
    byDate[d].carbs += Number(r.carbs) || 0;
  });
  return Object.values(byDate).sort((a, b) => b.date.localeCompare(a.date));
}

/** Данные гаджета (восстановление): из daily_logs — сон, HRV, recovery_score */
async function getWearableData(clientId, days = 30) {
  const fromDate = new Date();
  fromDate.setDate(fromDate.getDate() - days);
  const fromStr = fromDate.toISOString().slice(0, 10);
  const { data, error } = await getSupabase()
    .from('daily_logs')
    .select('date, sleep_hours, hrv, recovery_score, strain, training_done')
    .eq('client_id', clientId)
    .gte('date', fromStr)
    .order('date', { ascending: false });
  if (error) throw error;
  return data || [];
}

/** Сохранить настройки видимости дашборда клиента (upsert) */
async function saveDashboardSettings(clientId, settings) {
  const row = {
    client_id: clientId,
    show_body_progress: settings.show_body_progress !== false,
    show_workouts: settings.show_workouts !== false,
    show_nutrition: settings.show_nutrition === true,
    show_calendar: settings.show_calendar !== false,
    show_recovery: settings.show_recovery === true,
    updated_at: new Date().toISOString(),
  };
  const { error } = await getSupabase()
    .from('client_dashboard_settings')
    .upsert(row, { onConflict: 'client_id' });
  if (error) throw error;
}

/** Получить настройки видимости дашборда клиента */
async function getDashboardSettings(clientId) {
  const { data, error } = await getSupabase()
    .from('client_dashboard_settings')
    .select('*')
    .eq('client_id', clientId)
    .maybeSingle();
  if (error) throw error;
  return data;
}
