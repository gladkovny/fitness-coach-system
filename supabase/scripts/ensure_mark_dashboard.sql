-- Обеспечить наличие Марка в clients и минимальных данных для дашборда в master.
-- Выполнить в Supabase → SQL Editor (один раз).

-- 1) ID тренера (у кого уже есть клиенты)
DO $$
DECLARE
  v_trainer_id UUID;
  v_mark_id    UUID;
  v_program_id UUID;
  v_block_id   UUID;
BEGIN
  SELECT id INTO v_trainer_id
  FROM trainers
  WHERE auth_id IS NOT NULL
  LIMIT 1;
  IF v_trainer_id IS NULL THEN
    SELECT id INTO v_trainer_id FROM trainers LIMIT 1;
  END IF;
  IF v_trainer_id IS NULL THEN
    RAISE EXCEPTION 'Нет ни одного тренера в таблице trainers';
  END IF;

  -- 2) Есть ли уже клиент Марк у этого тренера
  SELECT id INTO v_mark_id
  FROM clients
  WHERE trainer_id = v_trainer_id
    AND (name ILIKE '%марк%' OR name ILIKE '%mark%')
  LIMIT 1;

  IF v_mark_id IS NULL THEN
    INSERT INTO clients (trainer_id, name, status, profile)
    VALUES (v_trainer_id, 'Марк', 'active', '{"mainGoals": "Онлайн тренировки"}')
    RETURNING id INTO v_mark_id;
    RAISE NOTICE 'Добавлен клиент Марк, id = %', v_mark_id;
  ELSE
    RAISE NOTICE 'Клиент Марк уже есть, id = %', v_mark_id;
  END IF;

  -- 3) Есть ли у Марка хотя бы одна программа
  IF NOT EXISTS (SELECT 1 FROM programs WHERE client_id = v_mark_id) THEN
    INSERT INTO programs (trainer_id, client_id, name, type, status)
    VALUES (v_trainer_id, v_mark_id, 'Онлайн программа', 'online', 'active')
    RETURNING id INTO v_program_id;
    RAISE NOTICE 'Добавлена программа для Марка, id = %', v_program_id;

    -- 4) Один блок для отображения на дашборде
    INSERT INTO training_blocks (program_id, name, total_sessions, used_sessions, start_date, status)
    VALUES (v_program_id, 'Блок 1', 16, 0, CURRENT_DATE, 'active');
    RAISE NOTICE 'Добавлен блок для программы Марка';
  END IF;
END $$;
