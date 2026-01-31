-- Реальные RLS политики с проверкой auth.uid()
-- Заменяет временные политики из 00002_rls_policies.sql
-- Дата: 2026-01-29

-- Удаляем старые временные политики
DROP POLICY IF EXISTS "trainers_select" ON trainers;
DROP POLICY IF EXISTS "trainers_update" ON trainers;
DROP POLICY IF EXISTS "clients_all" ON clients;
DROP POLICY IF EXISTS "exercises_all" ON exercises;
DROP POLICY IF EXISTS "programs_all" ON programs;
DROP POLICY IF EXISTS "training_blocks_all" ON training_blocks;
DROP POLICY IF EXISTS "workout_sessions_all" ON workout_sessions;
DROP POLICY IF EXISTS "workout_sets_all" ON workout_sets;
DROP POLICY IF EXISTS "daily_logs_all" ON daily_logs;
DROP POLICY IF EXISTS "nutrition_logs_all" ON nutrition_logs;
DROP POLICY IF EXISTS "body_composition_all" ON body_composition;
DROP POLICY IF EXISTS "integrations_all" ON integrations;
DROP POLICY IF EXISTS "payments_all" ON payments;
DROP POLICY IF EXISTS "achievements_all" ON achievements;
DROP POLICY IF EXISTS "streaks_all" ON streaks;

-- ═══════════════════════════════════════════════════════════════
-- ТРЕНЕРЫ: доступ только к своей записи
-- ═══════════════════════════════════════════════════════════════

CREATE POLICY "trainers_select_own" ON trainers
  FOR SELECT TO authenticated
  USING (auth_id = auth.uid());

CREATE POLICY "trainers_update_own" ON trainers
  FOR UPDATE TO authenticated
  USING (auth_id = auth.uid());

-- ═══════════════════════════════════════════════════════════════
-- КЛИЕНТЫ: тренер видит своих, клиент — себя (если будет auth_id у клиентов)
-- ═══════════════════════════════════════════════════════════════

CREATE POLICY "clients_select_trainer" ON clients
  FOR SELECT TO authenticated
  USING (
    trainer_id IN (
      SELECT id FROM trainers WHERE auth_id = auth.uid()
    )
  );

CREATE POLICY "clients_insert_trainer" ON clients
  FOR INSERT TO authenticated
  WITH CHECK (
    trainer_id IN (
      SELECT id FROM trainers WHERE auth_id = auth.uid()
    )
  );

CREATE POLICY "clients_update_trainer" ON clients
  FOR UPDATE TO authenticated
  USING (
    trainer_id IN (
      SELECT id FROM trainers WHERE auth_id = auth.uid()
    )
  );

-- ═══════════════════════════════════════════════════════════════
-- УПРАЖНЕНИЯ: чтение всех (общая база + свои), запись — только свои
-- ═══════════════════════════════════════════════════════════════

CREATE POLICY "exercises_select_all" ON exercises
  FOR SELECT TO authenticated
  USING (true);

CREATE POLICY "exercises_insert_own" ON exercises
  FOR INSERT TO authenticated
  WITH CHECK (
    trainer_id IS NULL OR
    trainer_id IN (SELECT id FROM trainers WHERE auth_id = auth.uid())
  );

CREATE POLICY "exercises_update_own" ON exercises
  FOR UPDATE TO authenticated
  USING (
    trainer_id IS NULL OR
    trainer_id IN (SELECT id FROM trainers WHERE auth_id = auth.uid())
  );

-- ═══════════════════════════════════════════════════════════════
-- ПРОГРАММЫ И БЛОКИ: через trainer_id → clients → trainer
-- ═══════════════════════════════════════════════════════════════

CREATE POLICY "programs_all_trainer" ON programs
  FOR ALL TO authenticated
  USING (
    trainer_id IN (SELECT id FROM trainers WHERE auth_id = auth.uid())
  );

CREATE POLICY "training_blocks_all_trainer" ON training_blocks
  FOR ALL TO authenticated
  USING (
    program_id IN (
      SELECT id FROM programs
      WHERE trainer_id IN (SELECT id FROM trainers WHERE auth_id = auth.uid())
    )
  );

-- ═══════════════════════════════════════════════════════════════
-- СЕССИИ И ПОДХОДЫ: через client_id → trainer_id
-- ═══════════════════════════════════════════════════════════════

CREATE POLICY "workout_sessions_all_trainer" ON workout_sessions
  FOR ALL TO authenticated
  USING (
    client_id IN (
      SELECT id FROM clients
      WHERE trainer_id IN (SELECT id FROM trainers WHERE auth_id = auth.uid())
    )
  );

CREATE POLICY "workout_sets_all_trainer" ON workout_sets
  FOR ALL TO authenticated
  USING (
    session_id IN (
      SELECT id FROM workout_sessions
      WHERE client_id IN (
        SELECT id FROM clients
        WHERE trainer_id IN (SELECT id FROM trainers WHERE auth_id = auth.uid())
      )
    )
  );

-- ═══════════════════════════════════════════════════════════════
-- ЕЖЕДНЕВНЫЕ ДАННЫЕ: через client_id → trainer_id
-- ═══════════════════════════════════════════════════════════════

CREATE POLICY "daily_logs_all_trainer" ON daily_logs
  FOR ALL TO authenticated
  USING (
    client_id IN (
      SELECT id FROM clients
      WHERE trainer_id IN (SELECT id FROM trainers WHERE auth_id = auth.uid())
    )
  );

CREATE POLICY "nutrition_logs_all_trainer" ON nutrition_logs
  FOR ALL TO authenticated
  USING (
    client_id IN (
      SELECT id FROM clients
      WHERE trainer_id IN (SELECT id FROM trainers WHERE auth_id = auth.uid())
    )
  );

CREATE POLICY "body_composition_all_trainer" ON body_composition
  FOR ALL TO authenticated
  USING (
    client_id IN (
      SELECT id FROM clients
      WHERE trainer_id IN (SELECT id FROM trainers WHERE auth_id = auth.uid())
    )
  );

-- ═══════════════════════════════════════════════════════════════
-- ИНТЕГРАЦИИ, ПЛАТЕЖИ, ДОСТИЖЕНИЯ, СЕРИИ: через client_id
-- ═══════════════════════════════════════════════════════════════

CREATE POLICY "integrations_all_trainer" ON integrations
  FOR ALL TO authenticated
  USING (
    client_id IN (
      SELECT id FROM clients
      WHERE trainer_id IN (SELECT id FROM trainers WHERE auth_id = auth.uid())
    )
  );

CREATE POLICY "payments_all_trainer" ON payments
  FOR ALL TO authenticated
  USING (
    client_id IN (
      SELECT id FROM clients
      WHERE trainer_id IN (SELECT id FROM trainers WHERE auth_id = auth.uid())
    )
  );

CREATE POLICY "achievements_all_trainer" ON achievements
  FOR ALL TO authenticated
  USING (
    client_id IN (
      SELECT id FROM clients
      WHERE trainer_id IN (SELECT id FROM trainers WHERE auth_id = auth.uid())
    )
  );

CREATE POLICY "streaks_all_trainer" ON streaks
  FOR ALL TO authenticated
  USING (
    client_id IN (
      SELECT id FROM clients
      WHERE trainer_id IN (SELECT id FROM trainers WHERE auth_id = auth.uid())
    )
  );
