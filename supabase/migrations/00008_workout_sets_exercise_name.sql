-- Добавляем exercise_name для случаев, когда exercise_id = null (миграция из Sheets)
-- Позволяет отображать название и считать нагрузку по имени
-- Дата: 2026-01-31

ALTER TABLE workout_sets ADD COLUMN IF NOT EXISTS exercise_name TEXT;
