-- Обязательные задачи клиента (0–3 шт.)
-- name = конкретное действие (напр. «Выход силой через две руки»)
-- category = категория для группировки (напр. «выход», «разминка», «заминка»)
-- Дата: 2026-02-01

-- ═══════════════════════════════════════════════════════════════
-- ОБЯЗАТЕЛЬНЫЕ ЗАДАЧИ (per client)
-- ═══════════════════════════════════════════════════════════════

CREATE TABLE mandatory_tasks (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  client_id UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  category TEXT,
  sort_order INT NOT NULL DEFAULT 0,
  active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_mandatory_tasks_client ON mandatory_tasks(client_id);

-- Макс. 3 задачи на клиента (триггер)
CREATE OR REPLACE FUNCTION check_mandatory_tasks_limit()
RETURNS TRIGGER AS $$
DECLARE
  cnt INT;
BEGIN
  IF TG_OP = 'INSERT' THEN
    SELECT COUNT(*) INTO cnt FROM mandatory_tasks WHERE client_id = NEW.client_id;
  ELSE
    SELECT COUNT(*) INTO cnt FROM mandatory_tasks WHERE client_id = NEW.client_id AND id != OLD.id;
  END IF;
  IF cnt >= 3 THEN
    RAISE EXCEPTION 'У клиента не может быть более 3 обязательных задач';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_mandatory_tasks_limit
  BEFORE INSERT OR UPDATE ON mandatory_tasks
  FOR EACH ROW EXECUTE PROCEDURE check_mandatory_tasks_limit();

COMMENT ON TABLE mandatory_tasks IS 'Обязательные задачи клиента перед каждой тренировкой. Макс. 3. name = конкретное действие, category = группа.';

-- ═══════════════════════════════════════════════════════════════
-- ЛОГ ВЫПОЛНЕНИЯ (привязка к сессии)
-- ═══════════════════════════════════════════════════════════════

CREATE TABLE mandatory_task_log (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  client_id UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  session_id UUID REFERENCES workout_sessions(id) ON DELETE SET NULL,
  task_id UUID NOT NULL REFERENCES mandatory_tasks(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_mandatory_task_log_client ON mandatory_task_log(client_id);
CREATE INDEX idx_mandatory_task_log_task ON mandatory_task_log(task_id);
CREATE INDEX idx_mandatory_task_log_session ON mandatory_task_log(session_id);

COMMENT ON TABLE mandatory_task_log IS 'Факт выполнения обязательной задачи (галочка в трекере).';

-- ═══════════════════════════════════════════════════════════════
-- RLS
-- ═══════════════════════════════════════════════════════════════

ALTER TABLE mandatory_tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE mandatory_task_log ENABLE ROW LEVEL SECURITY;

-- mandatory_tasks: тренер видит/редактирует задачи своих клиентов
CREATE POLICY "mandatory_tasks_select" ON mandatory_tasks
  FOR SELECT TO authenticated
  USING (
    client_id IN (
      SELECT c.id FROM clients c
      JOIN trainers t ON t.id = c.trainer_id
      WHERE t.auth_id = auth.uid()
    )
  );

CREATE POLICY "mandatory_tasks_insert" ON mandatory_tasks
  FOR INSERT TO authenticated
  WITH CHECK (
    client_id IN (
      SELECT c.id FROM clients c
      JOIN trainers t ON t.id = c.trainer_id
      WHERE t.auth_id = auth.uid()
    )
  );

CREATE POLICY "mandatory_tasks_update" ON mandatory_tasks
  FOR UPDATE TO authenticated
  USING (
    client_id IN (
      SELECT c.id FROM clients c
      JOIN trainers t ON t.id = c.trainer_id
      WHERE t.auth_id = auth.uid()
    )
  );

CREATE POLICY "mandatory_tasks_delete" ON mandatory_tasks
  FOR DELETE TO authenticated
  USING (
    client_id IN (
      SELECT c.id FROM clients c
      JOIN trainers t ON t.id = c.trainer_id
      WHERE t.auth_id = auth.uid()
    )
  );

-- mandatory_task_log
CREATE POLICY "mandatory_task_log_select" ON mandatory_task_log
  FOR SELECT TO authenticated
  USING (
    client_id IN (
      SELECT c.id FROM clients c
      JOIN trainers t ON t.id = c.trainer_id
      WHERE t.auth_id = auth.uid()
    )
  );

CREATE POLICY "mandatory_task_log_insert" ON mandatory_task_log
  FOR INSERT TO authenticated
  WITH CHECK (
    client_id IN (
      SELECT c.id FROM clients c
      JOIN trainers t ON t.id = c.trainer_id
      WHERE t.auth_id = auth.uid()
    )
  );
