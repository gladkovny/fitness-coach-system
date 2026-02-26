-- Шаблон упражнений блока для Program Builder (без привязки к сессии)
-- Дата: 2026-02-19

ALTER TABLE training_blocks ADD COLUMN IF NOT EXISTS exercise_template JSONB DEFAULT '[]';
COMMENT ON COLUMN training_blocks.exercise_template IS 'Шаблон упражнений блока: [{ exercise_id, exercise_name?, sets, reps, weight, notes }, ...] для Program Builder и трекера';
