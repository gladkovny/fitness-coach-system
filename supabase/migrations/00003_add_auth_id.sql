-- Добавление auth_id в trainers для связи с Supabase Auth
-- Дата: 2026-01-29

ALTER TABLE trainers
ADD COLUMN IF NOT EXISTS auth_id UUID REFERENCES auth.users(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_trainers_auth_id ON trainers(auth_id);

COMMENT ON COLUMN trainers.auth_id IS 'Связь с auth.users.id — после регистрации/входа тренера через Supabase Auth';
