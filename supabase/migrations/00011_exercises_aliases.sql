-- exercises.aliases: разговорные и социальные варианты названий
-- name = академическое (каноническое) название, aliases = варианты для распознавания
-- Дата: 2026-02-01

ALTER TABLE exercises ADD COLUMN IF NOT EXISTS aliases JSONB DEFAULT '[]'::jsonb;
COMMENT ON COLUMN exercises.aliases IS 'Разговорные варианты названия для распознавания. name = каноническое (академическое)';

-- Заполняем алиасы (разговорные формы → каноническое имя)
-- Грудь
UPDATE exercises SET aliases = '["жим лежа", "жим лёжа", "бенч", "bench press"]'::jsonb
  WHERE name = 'Жим лёжа';
UPDATE exercises SET aliases = '["жим в тренажере", "жим груди в тренажере"]'::jsonb
  WHERE name = 'Жим в тренажёре';
UPDATE exercises SET aliases = '["разводка", "разводка гантелей лежа"]'::jsonb
  WHERE name = 'Разводка гантелей';
UPDATE exercises SET aliases = '["отжимания от пола", "отжим"]'::jsonb
  WHERE name = 'Отжимания';

-- Спина
UPDATE exercises SET aliases = '["подтяг", "подтягивания на перекладине", "подтягивания"]'::jsonb
  WHERE name = 'Подтягивания';
UPDATE exercises SET aliases = '["тяга верхнего блока", "вертикальная тяга", "подтягивания в гравитроне"]'::jsonb
  WHERE key = 'lat_pulldown';
UPDATE exercises SET aliases = '["тяга нижнего блока", "горизонтальная тяга", "тяга к поясу"]'::jsonb
  WHERE key = 'cable_row';
UPDATE exercises SET aliases = '["становая", "deadlift"]'::jsonb
  WHERE key = 'deadlift';
UPDATE exercises SET aliases = '["рдл", "румынка", "мертвая тяга"]'::jsonb
  WHERE key = 'rdl_barbell';
UPDATE exercises SET aliases = '["гиперэкстензия", "разгибание спины"]'::jsonb
  WHERE name = 'Гиперэкстензия';

-- Ноги
UPDATE exercises SET aliases = '["присед", "приседания со штангой", "базовый присед"]'::jsonb
  WHERE name = 'Приседания со штангой';
UPDATE exercises SET aliases = '["присед в смите", "приседания смит"]'::jsonb
  WHERE key = 'squat_smith';
UPDATE exercises SET aliases = '["жим платформы", "жим ногами в тренажере", "leg press"]'::jsonb
  WHERE key = 'leg_press';
UPDATE exercises SET aliases = '["разгибания ног", "экстензия ног", "квадрицепс в тренажере"]'::jsonb
  WHERE key = 'leg_extension';
UPDATE exercises SET aliases = '["сгибания ног лежа", "бицепс бедра лежа"]'::jsonb
  WHERE key = 'leg_curl_lying';
UPDATE exercises SET aliases = '["сгибания ног сидя", "бицепс бедра сидя"]'::jsonb
  WHERE key = 'leg_curl_seated';
UPDATE exercises SET aliases = '["носки стоя", "подъем на носки"]'::jsonb
  WHERE name = 'Подъём на носки стоя';

-- Плечи (академические: Махи гантелей в стороны, Махи в наклоне)
UPDATE exercises SET aliases = '["махи с гантелями", "отведение плеча с гантелями", "махи в стороны", "отведение руки в сторону", "lateral raise", "махи в тренажере", "отведение плеча в тренажере"]'::jsonb
  WHERE name = 'Махи гантелей в стороны';
UPDATE exercises SET aliases = '["махи в наклоне", "разведение в наклоне", "задняя дельта", "rear delt fly"]'::jsonb
  WHERE name = 'Махи в наклоне';
UPDATE exercises SET aliases = '["жим плеч", "армейский жим", "жим над головой", "shoulder press"]'::jsonb
  WHERE key = 'shoulder_press';
UPDATE exercises SET aliases = '["тяга к подбородку", "протяжка"]'::jsonb
  WHERE name = 'Тяга к подбородку';

-- Руки: бицепс
UPDATE exercises SET aliases = '["сгибание на бицепс", "бицепс со штангой", "подъем на бицепс", "bicep curl"]'::jsonb
  WHERE key = 'bicep_curl';
UPDATE exercises SET aliases = '["сгибание на бицепс с гантелями", "бицепс с гантелями"]'::jsonb
  WHERE name = 'Сгибание рук с гантелями';
UPDATE exercises SET aliases = '["молот", "молотки на бицепс"]'::jsonb
  WHERE name = 'Молотки';

-- Руки: трицепс
UPDATE exercises SET aliases = '["разгибания на блоке", "трицепс на блоке", "разгибание рук на блоке", "tricep pushdown"]'::jsonb
  WHERE key = 'tricep_pushdown';
UPDATE exercises SET aliases = '["французский жим", "разгибание из-за головы"]'::jsonb
  WHERE key = 'tricep_overhead';
UPDATE exercises SET aliases = '["брусья", "отжимания на брусьях", "дипы", "dips"]'::jsonb
  WHERE name = 'Отжимания на брусьях';

-- Кор
UPDATE exercises SET aliases = '["планка"]'::jsonb
  WHERE name = 'Планка';
UPDATE exercises SET aliases = '["подъем ног", "подъем ног в висе", "висячие подъемы ног"]'::jsonb
  WHERE name = 'Подъём ног в висе';
UPDATE exercises SET aliases = '["скручивания", "кранч"]'::jsonb
  WHERE name = 'Скручивания';

-- GIN index для быстрого поиска по aliases (опционально)
CREATE INDEX IF NOT EXISTS idx_exercises_aliases_gin ON exercises USING GIN (aliases jsonb_path_ops);
