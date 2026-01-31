-- RLS Policies (заглушки: заменить на проверки auth.uid() после интеграции Supabase Auth)
-- Сейчас: разрешить всё для authenticated. После подключения Auth — ограничить по trainer_id / client_id.

-- Тренер: доступ только к своей записи (после Auth: id = auth.uid())
CREATE POLICY "trainers_select" ON trainers FOR SELECT TO authenticated USING (true);
CREATE POLICY "trainers_update" ON trainers FOR UPDATE TO authenticated USING (true);

-- Клиенты: тренер — свои, клиент — себя (после Auth: trainer_id = auth.uid() OR id = auth.uid())
CREATE POLICY "clients_all" ON clients FOR ALL TO authenticated USING (true);

-- Упражнения: чтение всех, запись — свои (trainer_id = auth.uid() OR trainer_id IS NULL)
CREATE POLICY "exercises_all" ON exercises FOR ALL TO authenticated USING (true);

-- Программы, блоки, сессии, подходы — по владельцу через client_id → trainer_id
CREATE POLICY "programs_all" ON programs FOR ALL TO authenticated USING (true);
CREATE POLICY "training_blocks_all" ON training_blocks FOR ALL TO authenticated USING (true);
CREATE POLICY "workout_sessions_all" ON workout_sessions FOR ALL TO authenticated USING (true);
CREATE POLICY "workout_sets_all" ON workout_sets FOR ALL TO authenticated USING (true);

-- Ежедневные данные и питание
CREATE POLICY "daily_logs_all" ON daily_logs FOR ALL TO authenticated USING (true);
CREATE POLICY "nutrition_logs_all" ON nutrition_logs FOR ALL TO authenticated USING (true);
CREATE POLICY "body_composition_all" ON body_composition FOR ALL TO authenticated USING (true);

-- Интеграции, платежи, достижения, серии
CREATE POLICY "integrations_all" ON integrations FOR ALL TO authenticated USING (true);
CREATE POLICY "payments_all" ON payments FOR ALL TO authenticated USING (true);
CREATE POLICY "achievements_all" ON achievements FOR ALL TO authenticated USING (true);
CREATE POLICY "streaks_all" ON streaks FOR ALL TO authenticated USING (true);

-- TODO: после интеграции Auth заменить USING (true) на:
-- trainers: id = auth.uid()
-- clients: trainer_id = (SELECT id FROM trainers WHERE auth_id = auth.uid()) OR id = auth.uid()
-- и т.д. по иерархии trainer → clients → sessions, daily_logs, etc.
