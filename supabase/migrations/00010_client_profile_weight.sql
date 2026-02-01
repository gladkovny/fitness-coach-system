-- Персональные данные клиента для расчёта интенсивности bodyweight-упражнений
-- effectiveWeight = clientWeight × exercises.bodyweight_ratio
-- docs/BODYWEIGHT_AND_INTENSITY.md

-- clients.profile (JSONB) — хранит:
--   weight, start_weight — вес клиента (кг) для расчёта effectiveWeight
--   mainGoals, startDate — цели и дата старта
-- Источники веса (приоритет): profile.weight → daily_logs (последний) → body_composition (последний)

COMMENT ON COLUMN clients.profile IS 'JSONB: weight (кг), startWeight, mainGoals, startDate. Вес для bodyweight-упражнений.';
