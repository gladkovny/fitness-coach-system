/**
 * FITNESS COACH SYSTEM — Tracker API via Supabase
 * Замена GAS API для офлайн-клиентов
 * [2] Backend, [3] Database
 */

(function() {
  'use strict';

  if (typeof window.supabase === 'undefined' || !window.SUPABASE_URL) {
    console.warn('tracker-supabase: Supabase не загружен');
    return;
  }

  const supabase = window.supabase.createClient(window.SUPABASE_URL, window.SUPABASE_ANON_KEY);

  /**
   * Маршрутизатор: Supabase для поддерживаемых actions, иначе null (fallback на GAS)
   */
  async function supabaseApiCall(action, params = {}) {
    const handlers = {
      parseWorkout: parseWorkoutSupabase,
      getClients: getClientsSupabase,
      getClientProfile: getClientProfileSupabase,
      getExercises: getExercisesSupabase,
      getLastDailyData: getLastDailyDataSupabase,
      getRecentSessions: getRecentSessionsSupabase,
      getTrainingBlocks: getTrainingBlocksSupabase,
      getActiveBlock: getActiveBlockSupabase,
      getSessionDetails: getSessionDetailsSupabase,
      startSession: startSessionSupabase,
      addSet: addSetSupabase,
      finishSession: finishSessionSupabase,
      deleteSession: deleteSessionSupabase,
      createTrainingBlock: createTrainingBlockSupabase,
      addExercise: addExerciseSupabase,
      saveDailyData: saveDailyDataSupabase,
      getMandatoryTasks: getMandatoryTasksSupabase,
      logMandatoryTaskCompletion: logMandatoryTaskCompletionSupabase,
      updateMandatoryTasks: updateMandatoryTasksSupabase,
      saveMandatoryTaskLog: saveMandatoryTaskLogSupabase
    };

    const handler = handlers[action];
    if (!handler) return null;
    return handler(params);
  }

  async function parseWorkoutSupabase({ text }) {
    if (!text || !text.trim()) return { success: false, error: 'Текст не передан' };
    const { data, error } = await supabase.functions.invoke('parse-workout', { body: { text } });
    if (error) return { success: false, error: error.message || 'Ошибка парсера' };
    if (!data || data.success === false) return { success: false, error: data?.error || 'Ошибка парсера' };
    return data;
  }

  async function getClientsSupabase() {
    const { data, error } = await supabase
      .from('clients')
      .select('id, name, email, status')
      .order('name');
    if (error) throw new Error(error.message);
    const clients = (data || []).map(c => ({
      id: c.id,
      name: c.name,
      clientType: c.status === 'active' ? 'offline' : 'offline'
    }));
    return { clients };
  }

  async function getClientProfileSupabase({ clientId }) {
    const { data, error } = await supabase
      .from('clients')
      .select('id, name, profile, status')
      .eq('id', clientId)
      .single();
    if (error || !data) throw new Error(error?.message || 'Клиент не найден');
    const p = data.profile || {};
    const profile = {
      ...p,
      startWeight: p.startWeight ?? p.start_weight,
      targetWeight: p.targetWeight ?? p.target_weight,
      modules_workouts: p.modules_workouts ?? true,
      modules_nutrition: p.modules_nutrition ?? false,
      modules_daily: p.modules_daily ?? false,
      modules_warmup: p.modules_warmup ?? false,
      modules_measurements: p.modules_measurements ?? false,
      modules_mandatory: p.modules_mandatory ?? true,
      clientType: 'offline'
    };
    return { profile };
  }

  async function getExercisesSupabase({ clientId, search = '', category = '' }) {
    let q = supabase.from('exercises').select('id, name, category, subcategory, equipment, muscle_coefficients, key, aliases');
    if (category) q = q.eq('category', category);
    if (search) q = q.ilike('name', '%' + search + '%');
    const { data, error } = await q.order('name').limit(200);
    if (error) throw new Error(error.message);
    const exercises = (data || []).map(e => ({
      id: e.key || e.id,
      name: e.name,
      category: e.category || 'Другое',
      subcategory: e.subcategory || '',
      equipment: e.equipment || '',
      muscleCoeffs: e.muscle_coefficients || {},
      aliases: (e.aliases && Array.isArray(e.aliases)) ? e.aliases : []
    }));
    return { exercises };
  }

  async function getLastDailyDataSupabase({ clientId }) {
    const { data, error } = await supabase
      .from('daily_logs')
      .select('weight, date')
      .eq('client_id', clientId)
      .order('date', { ascending: false })
      .limit(1)
      .maybeSingle();
    if (error) return null;
    return data ? { weight: data.weight } : null;
  }

  async function getRecentSessionsSupabase({ clientId, limit = 16 }) {
    const { data, error } = await supabase
      .from('workout_sessions')
      .select('id, date, type, total_tonnage, notes')
      .eq('client_id', clientId)
      .order('date', { ascending: false })
      .limit(limit);
    if (error) throw new Error(error.message);
    const sessions = (data || []).map(s => ({
      id: s.id,
      sessionId: s.id,
      date: s.date,
      splitType: s.type || 'Тренировка',
      totalVolume: s.total_tonnage != null ? Number(s.total_tonnage) : 0,
      rating: s.notes?.match(/RPE:\s*(\d+)/)?.[1] ? parseInt(s.notes.match(/RPE:\s*(\d+)/)[1]) : null,
      notes: s.notes
    }));
    return { sessions };
  }

  async function getTrainingBlocksSupabase({ clientId }) {
    const { data: programs } = await supabase.from('programs').select('id').eq('client_id', clientId);
    if (!programs?.length) return { blocks: [] };
    const { data, error } = await supabase
      .from('training_blocks')
      .select('id, name, total_sessions, used_sessions, start_date, status')
      .in('program_id', programs.map(p => p.id))
      .order('start_date', { ascending: false });
    if (error) throw new Error(error.message);
    const blocks = (data || []).map((b, i) => ({
      blockId: i + 1,
      id: b.id,
      name: b.name,
      totalSessions: b.total_sessions || 0,
      usedSessions: b.used_sessions || 0,
      startDate: b.start_date,
      status: b.status || 'active'
    }));
    return { blocks };
  }

  async function getActiveBlockSupabase({ clientId }) {
    const { blocks } = await getTrainingBlocksSupabase({ clientId });
    const active = blocks.find(b => b.status === 'active') || blocks[0];
    return { block: active ? { blockId: active.blockId } : null };
  }

  async function getSessionDetailsSupabase({ clientId, sessionId }) {
    const { data: session, error: sErr } = await supabase
      .from('workout_sessions')
      .select('id, date, type, total_tonnage, notes')
      .eq('id', sessionId)
      .eq('client_id', clientId)
      .single();
    if (sErr || !session) throw new Error(sErr?.message || 'Сессия не найдена');

    const { data: sets, error: setsErr } = await supabase
      .from('workout_sets')
      .select('exercise_id, reps, weight')
      .eq('session_id', sessionId)
      .order('set_number');
    if (setsErr) throw new Error(setsErr.message);

    const exIds = [...new Set((sets || []).map(s => s.exercise_id).filter(Boolean))];
    const exMap = {};
    if (exIds.length) {
      const { data: exs } = await supabase.from('exercises').select('id, name, category').in('id', exIds);
      (exs || []).forEach(e => { exMap[e.id] = e; });
    }

    const byEx = {};
    (sets || []).forEach(s => {
      const exId = s.exercise_id || 'unknown';
      if (!byEx[exId]) byEx[exId] = { exerciseId: exId, name: exMap[exId]?.name || 'Упражнение', category: exMap[exId]?.category || 'Другое', sets: [] };
      byEx[exId].sets.push({ weight: Number(s.weight) || 0, reps: Number(s.reps) || 0 });
    });

    const exercises = Object.values(byEx);

    return {
      session: {
        id: session.id,
        date: session.date,
        splitType: session.type || 'Тренировка',
        totalVolume: session.total_tonnage != null ? Number(session.total_tonnage) : 0,
        rating: session.notes?.match(/RPE:\s*(\d+)/)?.[1] ? parseInt(session.notes.match(/RPE:\s*(\d+)/)[1]) : null,
        notes: session.notes
      },
      exercises
    };
  }

  async function startSessionSupabase({ clientId, date, splitType, notes }) {
    const dateStr = (date || new Date().toISOString()).toString().split('T')[0];
    let blockId = null;
    const { data: programs } = await supabase.from('programs').select('id').eq('client_id', clientId);
    if (programs?.length) {
      const { data: block } = await supabase
        .from('training_blocks')
        .select('id')
        .in('program_id', programs.map(p => p.id))
        .eq('status', 'active')
        .limit(1)
        .maybeSingle();
      blockId = block?.id;
    }

    const { data, error } = await supabase
      .from('workout_sessions')
      .insert({
        client_id: clientId,
        block_id: blockId,
        date: dateStr,
        type: splitType || 'Тренировка',
        status: 'in_progress',
        notes: notes || null
      })
      .select('id')
      .single();
    if (error) throw new Error(error.message);
    return { sessionId: data.id };
  }

  async function findOrCreateExercise(name, category = 'Другое') {
    const { data: existing } = await supabase
      .from('exercises')
      .select('id')
      .ilike('name', name.trim())
      .limit(1)
      .maybeSingle();
    if (existing) return existing.id;

    const { data: created, error } = await supabase
      .from('exercises')
      .insert({ name: name.trim(), category })
      .select('id')
      .single();
    if (error) throw new Error(error.message);
    return created.id;
  }

  async function addSetSupabase({ clientId, sessionId, exerciseId, exerciseName, category, weight, reps }) {
    const nameToUse = (exerciseName || exerciseId || '').toString().replace(/\s*\([^)]*\)\s*$/, '').trim();
    const exId = await findOrCreateExercise(nameToUse, category || 'Другое');

    const { count } = await supabase.from('workout_sets').select('*', { count: 'exact', head: true }).eq('session_id', sessionId);
    const setNumber = (count ?? 0) + 1;

    const { error } = await supabase.from('workout_sets').insert({
      session_id: sessionId,
      exercise_id: exId,
      set_number: setNumber,
      reps: parseInt(reps) || 0,
      weight: parseFloat(weight) || 0
    });
    if (error) throw new Error(error.message);
    return { success: true };
  }

  async function finishSessionSupabase({ clientId, sessionId, rating }) {
    const { data: sets } = await supabase.from('workout_sets').select('reps, weight').eq('session_id', sessionId);
    let totalTonnage = 0;
    (sets || []).forEach(s => { totalTonnage += (Number(s.weight) || 0) * (Number(s.reps) || 0); });

    const { data: session } = await supabase.from('workout_sessions').select('notes').eq('id', sessionId).single();
    let notes = session?.notes || '';
    if (rating != null && rating > 0) {
      if (notes && !notes.includes('RPE:')) notes = notes + (notes ? '. ' : '') + 'RPE: ' + rating;
      else if (!notes) notes = 'RPE: ' + rating;
    }

    const { error } = await supabase
      .from('workout_sessions')
      .update({ status: 'completed', total_tonnage: totalTonnage, notes: notes || null })
      .eq('id', sessionId)
      .eq('client_id', clientId);
    if (error) throw new Error(error.message);

    const { data: sess } = await supabase.from('workout_sessions').select('block_id').eq('id', sessionId).single();
    if (sess?.block_id) {
      try {
        const r = supabase.rpc('increment_block_used', { block_id: sess.block_id });
        if (r && typeof r.then === 'function') await r;
      } catch (_) { /* RPC может отсутствовать — обновление блока ниже */ }
      const { data: bl } = await supabase.from('training_blocks').select('used_sessions').eq('id', sess.block_id).single();
      if (bl) {
        await supabase.from('training_blocks').update({ used_sessions: (bl.used_sessions || 0) + 1 }).eq('id', sess.block_id);
      }
    }
    return { success: true };
  }

  async function deleteSessionSupabase({ clientId, sessionId }) {
    await supabase.from('workout_sets').delete().eq('session_id', sessionId);
    const { data: sess } = await supabase.from('workout_sessions').select('block_id').eq('id', sessionId).single();
    const { error } = await supabase.from('workout_sessions').delete().eq('id', sessionId).eq('client_id', clientId);
    if (error) throw new Error(error.message);
    if (sess?.block_id) {
      const { data: bl } = await supabase.from('training_blocks').select('used_sessions').eq('id', sess.block_id).single();
      if (bl && (bl.used_sessions || 0) > 0) {
        await supabase.from('training_blocks').update({ used_sessions: bl.used_sessions - 1 }).eq('id', sess.block_id);
      }
    }
    return { success: true };
  }

  async function createTrainingBlockSupabase({ clientId, totalSessions }) {
    const { data: prog } = await supabase.from('programs').select('id').eq('client_id', clientId).limit(1).maybeSingle();
    if (!prog) throw new Error('У клиента нет программы. Создайте программу в дашборде.');
    await supabase.from('training_blocks').update({ status: 'completed' }).eq('program_id', prog.id);
    const { data, error } = await supabase
      .from('training_blocks')
      .insert({
        program_id: prog.id,
        name: 'Блок ' + new Date().toLocaleDateString('ru-RU'),
        total_sessions: parseInt(totalSessions) || 10,
        used_sessions: 0,
        start_date: new Date().toISOString().split('T')[0],
        status: 'active'
      })
      .select('id')
      .single();
    if (error) throw new Error(error.message);
    const { data: blocks } = await supabase.from('training_blocks').select('id').eq('program_id', prog.id);
    const blockId = (blocks || []).length;
    return { success: true, blockId };
  }

  async function getMandatoryTasksSupabase({ clientId }) {
    if (!clientId) return { tasks: [] };
    const { data: tasks, error: tasksErr } = await supabase
      .from('mandatory_tasks')
      .select('id, name, category, sort_order, active')
      .eq('client_id', clientId)
      .eq('active', true)
      .order('sort_order');
    if (tasksErr) throw new Error(tasksErr.message);
    const list = tasks || [];
    if (list.length === 0) return { tasks: [] };
    const taskIds = list.map(t => t.id);
    const { data: logs } = await supabase
      .from('mandatory_task_log')
      .select('task_id')
      .eq('client_id', clientId)
      .in('task_id', taskIds);
    const countByTask = {};
    (logs || []).forEach(log => {
      countByTask[log.task_id] = (countByTask[log.task_id] || 0) + 1;
    });
    const result = list.map(t => ({
      id: t.id,
      name: t.name,
      description: t.category || '',
      target: '',
      active: t.active !== false,
      completionCount: countByTask[t.id] || 0
    }));
    return { tasks: result };
  }

  async function logMandatoryTaskCompletionSupabase({ clientId, sessionId, tasks }) {
    if (!clientId || !sessionId || !tasks || tasks.length === 0) return {};
    const completed = tasks.filter(t => t.completed);
    if (completed.length === 0) return {};
    const toInsert = completed.map(t => ({
      client_id: clientId,
      session_id: sessionId,
      task_id: t.taskId
    })).filter(r => r.task_id);
    if (toInsert.length === 0) return {};
    const { error } = await supabase.from('mandatory_task_log').insert(toInsert);
    if (error) throw new Error(error.message);
    return {};
  }

  async function updateMandatoryTasksSupabase({ clientId, tasks }) {
    if (!clientId || !tasks || !Array.isArray(tasks)) return {};
    const existing = await supabase.from('mandatory_tasks').select('id').eq('client_id', clientId);
    const existingIds = (existing.data || []).map(t => t.id);
    const incoming = tasks.slice(0, 3).filter(t => t && (t.name || '').trim());
    for (let i = 0; i < incoming.length; i++) {
      const t = incoming[i];
      const payload = {
        client_id: clientId,
        name: (t.name || '').trim(),
        category: t.category || t.type || null,
        sort_order: i,
        active: t.active !== false
      };
      if (t.id && existingIds.includes(t.id)) {
        await supabase.from('mandatory_tasks').update(payload).eq('id', t.id).eq('client_id', clientId);
      } else {
        const { error } = await supabase.from('mandatory_tasks').insert(payload);
        if (error) throw new Error(error.message);
      }
    }
    const keptIds = incoming.filter(t => t.id).map(t => t.id);
    const toDelete = existingIds.filter(id => !keptIds.includes(id));
    if (toDelete.length) {
      await supabase.from('mandatory_tasks').delete().eq('client_id', clientId).in('id', toDelete);
    }
    return { success: true };
  }

  async function saveMandatoryTaskLogSupabase({ clientId, sessionId, date, tasks }) {
    if (!clientId || !tasks || tasks.length === 0) return { success: true };
    let sid = sessionId;
    if (!sid && date) {
      const { data: sess } = await supabase
        .from('workout_sessions')
        .select('id')
        .eq('client_id', clientId)
        .eq('date', date)
        .order('date', { ascending: false })
        .limit(1)
        .maybeSingle();
      sid = sess?.id;
    }
    const toInsert = tasks
      .filter(t => t.taskId)
      .map(t => ({
        client_id: clientId,
        session_id: sid || null,
        task_id: t.taskId
      }));
    if (toInsert.length === 0) return { success: true };
    const { error } = await supabase.from('mandatory_task_log').insert(toInsert);
    if (error) throw new Error(error.message);
    return { success: true, saved: toInsert.length };
  }

  async function addExerciseSupabase({ name, category, equipment }) {
    const { data, error } = await supabase
      .from('exercises')
      .insert({
        name: (name || '').trim(),
        category: category || 'Другое',
        equipment: equipment || null
      })
      .select('id')
      .single();
    if (error) throw new Error(error.message);
    return { success: true, id: data.id };
  }

  async function saveDailyDataSupabase(params) {
    const dateStr = (params?.date || new Date().toISOString().split('T')[0]);
    const { error } = await supabase.from('daily_logs').upsert({
      client_id: params.clientId,
      date: dateStr,
      weight: params?.weight,
      sleep_hours: params?.sleepHours ?? params?.sleep_hours,
      notes: params?.notes || null,
      training_done: params?.training_done
    }, { onConflict: 'client_id,date' });
    if (error) throw new Error(error.message);
    return { success: true };
  }

  window.TrackerSupabase = {
    apiCall: supabaseApiCall,
    hasHandler: (action) => {
      const handlers = ['parseWorkout', 'getClients', 'getClientProfile', 'getExercises', 'getLastDailyData', 'getRecentSessions',
        'getTrainingBlocks', 'getActiveBlock', 'getSessionDetails', 'startSession', 'addSet', 'finishSession',
        'deleteSession', 'createTrainingBlock', 'addExercise', 'saveDailyData', 'getMandatoryTasks',
        'logMandatoryTaskCompletion', 'updateMandatoryTasks', 'saveMandatoryTaskLog'];
      return handlers.includes(action);
    }
  };
})();
