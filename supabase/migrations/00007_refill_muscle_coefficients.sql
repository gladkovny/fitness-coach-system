-- Повторно заполняем muscle_coefficients для упражнений с пустыми коэффициентами
-- Помогает после создания упражнений через findOrCreateExercise (трекер)
-- Дата: 2026-01-31

UPDATE exercises e
SET muscle_coefficients = COALESCE(
  CASE 
    WHEN e.category ILIKE '%рудь%' OR e.subcategory ILIKE '%грудь%' OR e.name ILIKE '%жим%лёжа%' OR e.name ILIKE '%bench%' THEN '{"chest": 0.8, "front_delt": 0.15, "triceps": 0.05}'::jsonb
    WHEN e.category ILIKE '%спина%' AND (e.subcategory ILIKE '%широч%' OR e.name ILIKE '%подтяг%' OR e.name ILIKE '%блок%' OR e.name ILIKE '%вертикальн%') THEN '{"lats": 0.7, "biceps": 0.2, "traps": 0.1}'::jsonb
    WHEN e.category ILIKE '%спина%' AND (e.subcategory ILIKE '%поясниц%' OR e.name ILIKE '%гипер%' OR e.name ILIKE '%румын%' OR e.name ILIKE '%рдл%') THEN '{"low_back": 0.5, "hamstrings": 0.4, "glutes": 0.1}'::jsonb
    WHEN e.category ILIKE '%спина%' AND e.name ILIKE '%становая%' THEN '{"low_back": 0.4, "hamstrings": 0.3, "glutes": 0.2, "traps": 0.1}'::jsonb
    WHEN e.category ILIKE '%спина%' THEN '{"lats": 0.6, "traps": 0.2, "biceps": 0.2}'::jsonb
    WHEN e.category ILIKE '%ноги%' AND (e.subcategory ILIKE '%квадри%' OR e.name ILIKE '%присед%' OR e.name ILIKE '%жим ног%' OR e.name ILIKE '%разгибан%') THEN '{"quads": 0.6, "glutes": 0.25, "hamstrings": 0.15}'::jsonb
    WHEN e.category ILIKE '%ноги%' AND (e.subcategory ILIKE '%бицепс бедра%' OR e.name ILIKE '%сгибан%') THEN '{"hamstrings": 0.8, "glutes": 0.2}'::jsonb
    WHEN e.category ILIKE '%ноги%' AND (e.subcategory ILIKE '%икр%' OR e.name ILIKE '%носк%') THEN '{"calves": 1.0}'::jsonb
    WHEN e.category ILIKE '%ноги%' THEN '{"quads": 0.5, "hamstrings": 0.3, "glutes": 0.2}'::jsonb
    WHEN e.category ILIKE '%плеч%' AND (e.subcategory ILIKE '%средн%' OR e.name ILIKE '%махи%') THEN '{"mid_delt": 0.8, "rear_delt": 0.2}'::jsonb
    WHEN e.category ILIKE '%плеч%' AND (e.subcategory ILIKE '%задн%' OR e.name ILIKE '%наклон%') THEN '{"rear_delt": 0.8, "mid_delt": 0.2}'::jsonb
    WHEN e.category ILIKE '%плеч%' OR e.name ILIKE '%арнольд%' THEN '{"front_delt": 0.5, "mid_delt": 0.3, "triceps": 0.2}'::jsonb
    WHEN e.category ILIKE '%руки%' AND (e.subcategory ILIKE '%бицепс%' OR e.name ILIKE '%сгибан%' OR e.name ILIKE '%молот%') THEN '{"biceps": 1.0}'::jsonb
    WHEN e.category ILIKE '%руки%' AND (e.subcategory ILIKE '%трицепс%' OR e.name ILIKE '%разгибан%' OR e.name ILIKE '%француз%') THEN '{"triceps": 1.0}'::jsonb
    WHEN e.category ILIKE '%кор%' OR e.category ILIKE '%пресс%' THEN '{"core": 1.0}'::jsonb
    WHEN e.name ILIKE '%присед%' OR e.name ILIKE '%жим ног%' OR e.name ILIKE '%squat%' THEN '{"quads": 0.5, "hamstrings": 0.3, "glutes": 0.2}'::jsonb
    WHEN e.name ILIKE '%тяга%' OR e.name ILIKE '%подтяг%' OR e.name ILIKE '%блок%' OR e.name ILIKE '%pull%' THEN '{"lats": 0.6, "traps": 0.2, "biceps": 0.2}'::jsonb
    WHEN e.name ILIKE '%жим%лёжа%' OR e.name ILIKE '%bench%' THEN '{"chest": 0.8, "front_delt": 0.15, "triceps": 0.05}'::jsonb
    WHEN e.name ILIKE '%планка%' OR e.name ILIKE '%скручиван%' OR e.name ILIKE '%пресс%' THEN '{"core": 1.0}'::jsonb
    ELSE '{}'::jsonb
  END,
  '{}'::jsonb
)
WHERE e.muscle_coefficients IS NULL OR e.muscle_coefficients = '{}'::jsonb;
