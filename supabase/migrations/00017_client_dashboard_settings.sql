-- Настройки видимости блоков на дашборде клиента (управляет тренер)
-- Кабинет тренера, вкладка «Дашборд клиента»
-- Дата: 2026-02-18

CREATE TABLE IF NOT EXISTS client_dashboard_settings (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  client_id UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  show_body_progress BOOLEAN DEFAULT true,
  show_workouts BOOLEAN DEFAULT true,
  show_nutrition BOOLEAN DEFAULT false,
  show_calendar BOOLEAN DEFAULT true,
  show_recovery BOOLEAN DEFAULT false,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(client_id)
);

CREATE INDEX IF NOT EXISTS idx_client_dashboard_settings_client ON client_dashboard_settings(client_id);

ALTER TABLE client_dashboard_settings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "trainer_access" ON client_dashboard_settings;
CREATE POLICY "trainer_access" ON client_dashboard_settings
  FOR ALL
  USING (
    client_id IN (
      SELECT id FROM clients WHERE trainer_id IN (SELECT id FROM trainers WHERE auth_id = auth.uid())
    )
  )
  WITH CHECK (
    client_id IN (
      SELECT id FROM clients WHERE trainer_id IN (SELECT id FROM trainers WHERE auth_id = auth.uid())
    )
  );

COMMENT ON TABLE client_dashboard_settings IS 'Что видит клиент на своём дашборде — настраивает тренер в кабинете';
