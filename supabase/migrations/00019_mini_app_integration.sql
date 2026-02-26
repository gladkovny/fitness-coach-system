-- Mini App / Telegram bot integration: users, exercises/programs extensions, reports
-- Следующая после 00018_training_blocks_exercise_template. Дата: 2026-02-26

-- 1. Таблица пользователей для Telegram бота (тренеры + клиенты)
CREATE TABLE IF NOT EXISTS users (
  id BIGINT PRIMARY KEY,
  username TEXT,
  full_name TEXT,
  role TEXT CHECK (role IN ('trainer', 'client')),
  trainer_id BIGINT REFERENCES users(id),
  settings JSONB DEFAULT '{"hints_enabled": true, "notifications_enabled": true, "menu_state": "auto"}',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Расширение таблицы exercises для GIF и Telegram-привязки
ALTER TABLE exercises
  ADD COLUMN IF NOT EXISTS gif_url TEXT,
  ADD COLUMN IF NOT EXISTS source_type TEXT DEFAULT 'gif' CHECK (source_type IN ('gif', 'link')),
  ADD COLUMN IF NOT EXISTS ext_url TEXT,
  ADD COLUMN IF NOT EXISTS telegram_trainer_id BIGINT REFERENCES users(id),
  ADD COLUMN IF NOT EXISTS telegram_client_id BIGINT REFERENCES users(id);

CREATE INDEX IF NOT EXISTS idx_exercises_telegram_trainer
  ON exercises(telegram_trainer_id, telegram_client_id);

-- 3. Расширение таблицы programs для Mini App
ALTER TABLE programs
  ADD COLUMN IF NOT EXISTS telegram_trainer_id BIGINT REFERENCES users(id),
  ADD COLUMN IF NOT EXISTS telegram_client_id BIGINT REFERENCES users(id),
  ADD COLUMN IF NOT EXISTS exercises JSONB DEFAULT '[]',
  ADD COLUMN IF NOT EXISTS mode TEXT DEFAULT 'with_trainer' CHECK (mode IN ('with_trainer', 'independent')),
  ADD COLUMN IF NOT EXISTS mandatory_tasks JSONB DEFAULT '[]';

CREATE INDEX IF NOT EXISTS idx_programs_telegram_client
  ON programs(telegram_client_id);

-- 4. Таблица отчётов из Mini App
CREATE TABLE IF NOT EXISTS reports (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  program_id UUID REFERENCES programs(id) ON DELETE CASCADE,
  client_id BIGINT NOT NULL REFERENCES users(id),
  trainer_id BIGINT NOT NULL REFERENCES users(id),
  data JSONB NOT NULL DEFAULT '[]',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_reports_client ON reports(client_id);
CREATE INDEX IF NOT EXISTS idx_reports_trainer ON reports(trainer_id);
