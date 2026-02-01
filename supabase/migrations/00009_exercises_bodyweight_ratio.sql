-- Коэффициент нагрузки для упражнений с собственным весом (bodyweight)
-- effectiveWeight = clientWeight × bodyweight_ratio
-- Индивидуально для каждого упражнения: подтягивания ~1.0, отжимания ~0.66
-- docs/BODYWEIGHT_AND_INTENSITY.md
ALTER TABLE exercises ADD COLUMN IF NOT EXISTS bodyweight_ratio NUMERIC;

-- Устанавливаем персональные коэффициенты (equipment: свой вес, своё тело, bodyweight)
-- Подтягивания: 100% веса тела
UPDATE exercises SET bodyweight_ratio = 1.0
  WHERE (equipment ILIKE '%свой вес%' OR equipment ILIKE '%своё тело%' OR equipment ILIKE '%свое тело%' OR equipment = 'bodyweight')
  AND (name ILIKE '%подтяг%' OR name ILIKE '%pull%up%' OR name ILIKE '%chin%');

-- Отжимания на брусьях: 100%
UPDATE exercises SET bodyweight_ratio = 1.0
  WHERE (equipment ILIKE '%свой вес%' OR equipment ILIKE '%своё тело%' OR equipment ILIKE '%свое тело%' OR equipment = 'bodyweight')
  AND (name ILIKE '%брусья%' OR name ILIKE '%dip%');

-- Отжимания от пола: ~66% (hands+feet, research)
UPDATE exercises SET bodyweight_ratio = 0.66
  WHERE (equipment ILIKE '%свой вес%' OR equipment ILIKE '%своё тело%' OR equipment ILIKE '%свое тело%' OR equipment = 'bodyweight')
  AND (name ILIKE '%отжимани%' AND name NOT ILIKE '%брусья%' AND name NOT ILIKE '%dip%');

-- Выходы силой, подъём переворотом: 100%
UPDATE exercises SET bodyweight_ratio = 1.0
  WHERE (equipment ILIKE '%свой вес%' OR equipment ILIKE '%своё тело%' OR equipment ILIKE '%свое тело%' OR equipment = 'bodyweight')
  AND (name ILIKE '%выход%' OR name ILIKE '%переворот%');

-- Гиперэкстензия: ~50% (частичная нагрузка)
UPDATE exercises SET bodyweight_ratio = 0.5
  WHERE (equipment ILIKE '%свой вес%' OR equipment ILIKE '%своё тело%' OR equipment ILIKE '%свое тело%' OR equipment = 'bodyweight')
  AND (name ILIKE '%гиперэкстензия%');

-- Подъём ног в висе: ~35%
UPDATE exercises SET bodyweight_ratio = 0.35
  WHERE (equipment ILIKE '%свой вес%' OR equipment ILIKE '%своё тело%' OR equipment ILIKE '%свое тело%' OR equipment = 'bodyweight')
  AND (name ILIKE '%подъём ног%' OR name ILIKE '%leg raise%');

-- Скручивания, планка, пресс: ~30–50%
UPDATE exercises SET bodyweight_ratio = 0.4
  WHERE (equipment ILIKE '%свой вес%' OR equipment ILIKE '%своё тело%' OR equipment ILIKE '%свое тело%' OR equipment = 'bodyweight')
  AND (name ILIKE '%скручиван%' OR name ILIKE '%планка%' OR name ILIKE '%подъём корпуса%' OR name ILIKE '%crunch%' OR name ILIKE '%русский твист%');

-- Для остальных bodyweight (fallback): 0.65
UPDATE exercises SET bodyweight_ratio = 0.65
  WHERE (equipment ILIKE '%свой вес%' OR equipment ILIKE '%своё тело%' OR equipment ILIKE '%свое тело%' OR equipment = 'bodyweight')
  AND bodyweight_ratio IS NULL;

COMMENT ON COLUMN exercises.bodyweight_ratio IS 'Доля веса тела для расчёта интенсивности (0–1). Подтягивания 1.0, отжимания 0.66.';
