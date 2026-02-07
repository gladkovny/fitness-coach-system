-- Дата окончания и стоимость блока для кабинета тренера
-- Дата: 2026-02-06

ALTER TABLE training_blocks ADD COLUMN IF NOT EXISTS end_date DATE;
ALTER TABLE training_blocks ADD COLUMN IF NOT EXISTS cost NUMERIC;
COMMENT ON COLUMN training_blocks.end_date IS 'Дата окончания блока';
COMMENT ON COLUMN training_blocks.cost IS 'Стоимость блока (руб или иная валюта)';
