-- FITNESS COACH SYSTEM — Initial schema for Supabase
-- Соответствует docs/ARCHITECTURE_V2.md
-- Дата: 2026-01-29

-- Расширения
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ═══════════════════════════════════════════════════════════════
-- ПОЛЬЗОВАТЕЛИ И РОЛИ
-- ═══════════════════════════════════════════════════════════════

CREATE TABLE trainers (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email TEXT UNIQUE NOT NULL,
  name TEXT,
  subscription_plan TEXT DEFAULT 'free',
  subscription_expires TIMESTAMPTZ,
  settings JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE clients (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  trainer_id UUID NOT NULL REFERENCES trainers(id) ON DELETE CASCADE,
  email TEXT,
  name TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('lead', 'onboarding', 'active', 'paused', 'churned')),
  profile JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_clients_trainer ON clients(trainer_id);
CREATE INDEX idx_clients_status ON clients(status);

-- ═══════════════════════════════════════════════════════════════
-- ТРЕНИРОВКИ
-- ═══════════════════════════════════════════════════════════════

CREATE TABLE exercises (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  trainer_id UUID REFERENCES trainers(id) ON DELETE SET NULL,
  name TEXT NOT NULL,
  category TEXT,
  subcategory TEXT,
  muscle_coefficients JSONB DEFAULT '{}',
  equipment TEXT,
  laterality TEXT,
  video_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_exercises_trainer ON exercises(trainer_id);
CREATE INDEX idx_exercises_name ON exercises(name);

CREATE TABLE programs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  trainer_id UUID NOT NULL REFERENCES trainers(id) ON DELETE CASCADE,
  client_id UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  type TEXT NOT NULL DEFAULT 'offline' CHECK (type IN ('online', 'offline', 'hybrid')),
  status TEXT DEFAULT 'active',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_programs_client ON programs(client_id);

CREATE TABLE training_blocks (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  program_id UUID NOT NULL REFERENCES programs(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  total_sessions INT NOT NULL DEFAULT 0,
  used_sessions INT NOT NULL DEFAULT 0,
  start_date DATE,
  status TEXT DEFAULT 'active',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_blocks_program ON training_blocks(program_id);

CREATE TABLE workout_sessions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  client_id UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  block_id UUID REFERENCES training_blocks(id) ON DELETE SET NULL,
  date DATE NOT NULL,
  type TEXT,
  status TEXT DEFAULT 'completed',
  notes TEXT,
  total_tonnage NUMERIC,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_sessions_client ON workout_sessions(client_id);
CREATE INDEX idx_sessions_date ON workout_sessions(date);

CREATE TABLE workout_sets (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  session_id UUID NOT NULL REFERENCES workout_sessions(id) ON DELETE CASCADE,
  exercise_id UUID REFERENCES exercises(id) ON DELETE SET NULL,
  set_number INT NOT NULL,
  reps INT,
  weight NUMERIC,
  rpe INT,
  rest_time INT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_sets_session ON workout_sets(session_id);

-- ═══════════════════════════════════════════════════════════════
-- ЕЖЕДНЕВНЫЕ ДАННЫЕ
-- ═══════════════════════════════════════════════════════════════

CREATE TABLE daily_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  client_id UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  weight NUMERIC,
  sleep_hours NUMERIC,
  sleep_quality TEXT,
  recovery_score NUMERIC,
  strain NUMERIC,
  hrv NUMERIC,
  nutrition TEXT,
  training_done BOOLEAN,
  notes TEXT,
  source TEXT DEFAULT 'manual' CHECK (source IN ('manual', 'whoop', 'oura', 'apple', 'google_fit')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(client_id, date)
);

CREATE INDEX idx_daily_client_date ON daily_logs(client_id, date);

CREATE TABLE nutrition_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  client_id UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  meal_type TEXT,
  photo_url TEXT,
  ai_analysis JSONB,
  calories INT,
  protein NUMERIC,
  fats NUMERIC,
  carbs NUMERIC,
  confirmed BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_nutrition_client_date ON nutrition_logs(client_id, date);

CREATE TABLE body_composition (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  client_id UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  weight NUMERIC,
  body_fat NUMERIC,
  muscle_mass NUMERIC,
  water NUMERIC,
  bone_mass NUMERIC,
  bmr NUMERIC,
  source TEXT DEFAULT 'manual' CHECK (source IN ('manual', 'inbody_ocr')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_body_client_date ON body_composition(client_id, date);

-- ═══════════════════════════════════════════════════════════════
-- ИНТЕГРАЦИИ
-- ═══════════════════════════════════════════════════════════════

CREATE TABLE integrations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  client_id UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  provider TEXT NOT NULL CHECK (provider IN ('whoop', 'oura', 'apple', 'google_fit')),
  access_token TEXT,
  refresh_token TEXT,
  last_sync TIMESTAMPTZ,
  status TEXT DEFAULT 'active',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(client_id, provider)
);

CREATE INDEX idx_integrations_client ON integrations(client_id);

-- ═══════════════════════════════════════════════════════════════
-- ФИНАНСЫ
-- ═══════════════════════════════════════════════════════════════

CREATE TABLE payments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  trainer_id UUID NOT NULL REFERENCES trainers(id) ON DELETE CASCADE,
  client_id UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  amount NUMERIC NOT NULL,
  currency TEXT DEFAULT 'USD',
  package_type TEXT,
  sessions_total INT NOT NULL,
  sessions_remaining INT NOT NULL,
  payment_date DATE NOT NULL,
  status TEXT DEFAULT 'active',
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_payments_client ON payments(client_id);

-- ═══════════════════════════════════════════════════════════════
-- ГЕЙМИФИКАЦИЯ
-- ═══════════════════════════════════════════════════════════════

CREATE TABLE achievements (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  client_id UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  type TEXT NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  value NUMERIC,
  earned_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_achievements_client ON achievements(client_id);

CREATE TABLE streaks (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  client_id UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('sleep', 'workouts', 'nutrition')),
  current_count INT NOT NULL DEFAULT 0,
  best_count INT NOT NULL DEFAULT 0,
  last_date DATE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(client_id, type)
);

CREATE INDEX idx_streaks_client ON streaks(client_id);

-- ═══════════════════════════════════════════════════════════════
-- RLS (включить после настройки Supabase Auth)
-- Политики добавить в отдельной миграции после привязки auth.uid()
-- ═══════════════════════════════════════════════════════════════

ALTER TABLE trainers ENABLE ROW LEVEL SECURITY;
ALTER TABLE clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE exercises ENABLE ROW LEVEL SECURITY;
ALTER TABLE programs ENABLE ROW LEVEL SECURITY;
ALTER TABLE training_blocks ENABLE ROW LEVEL SECURITY;
ALTER TABLE workout_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE workout_sets ENABLE ROW LEVEL SECURITY;
ALTER TABLE daily_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE nutrition_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE body_composition ENABLE ROW LEVEL SECURITY;
ALTER TABLE integrations ENABLE ROW LEVEL SECURITY;
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE achievements ENABLE ROW LEVEL SECURITY;
ALTER TABLE streaks ENABLE ROW LEVEL SECURITY;

-- Временные политики: разрешить всё для сервисной роли (миграции, бэкенд)
-- После подключения Auth добавить миграцию с политиками по trainer_id / client_id

COMMENT ON TABLE trainers IS 'Тренеры. После интеграции Auth: id или auth_id = auth.uid()';
COMMENT ON TABLE clients IS 'Клиенты тренера. RLS: тренер видит своих, клиент — только себя';
