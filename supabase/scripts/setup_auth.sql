-- Автоматическая настройка Auth: создание пользователя и связывание с тренером
-- Выполнить в Supabase → SQL Editor после включения Auth и применения миграций 00003 и 00004
-- 
-- Инструкция:
-- 1. Замени 'gladkovny@gmail.com' на email тренера (или используй переменную).
-- 2. Замени 'твой_пароль' на желаемый пароль (или используй Supabase Dashboard → Authentication → Users → Add user).
-- 3. Выполни скрипт.

-- Вариант A: Создать пользователя через SQL (требует расширения pgcrypto)
-- Если не работает — используй Вариант B (через Dashboard или API)

DO $$
DECLARE
  trainer_email TEXT := 'gladkovny@gmail.com';
  trainer_password TEXT := 'твой_пароль'; -- Замени на реальный пароль
  new_user_id UUID;
  trainer_record RECORD;
BEGIN
  -- Проверка: есть ли уже пользователь с таким email
  SELECT id INTO new_user_id
  FROM auth.users
  WHERE email = trainer_email;
  
  IF new_user_id IS NULL THEN
    -- Создаём пользователя (требует расширения pgcrypto для хеширования пароля)
    -- ВАЖНО: в Supabase лучше создавать пользователя через Dashboard или Admin API
    -- Этот блок может не работать без дополнительных прав — используй Вариант B
    RAISE NOTICE 'Создание пользователя через SQL может не работать. Используй Dashboard → Authentication → Users → Add user';
  ELSE
    RAISE NOTICE 'Пользователь с email % уже существует (id: %)', trainer_email, new_user_id;
  END IF;
  
  -- Связываем тренера с пользователем (обновляем auth_id)
  FOR trainer_record IN
    SELECT id, email FROM trainers WHERE email = trainer_email
  LOOP
    UPDATE trainers
    SET auth_id = new_user_id
    WHERE id = trainer_record.id;
    
    RAISE NOTICE 'Тренер % (id: %) связан с пользователем %', trainer_record.email, trainer_record.id, new_user_id;
  END LOOP;
END $$;

-- ═══════════════════════════════════════════════════════════════
-- ВАРИАНТ B (рекомендуется): Создать пользователя вручную, затем выполнить только UPDATE
-- ═══════════════════════════════════════════════════════════════

-- 1. Создай пользователя в Supabase Dashboard:
--    Authentication → Users → Add user → Email: gladkovny@gmail.com, Password: (твой пароль)
--    Или через API: POST /auth/v1/admin/users с service_role ключом
--
-- 2. После создания выполни только этот UPDATE (замени 'gladkovny@gmail.com' на email тренера):

-- UPDATE trainers
-- SET auth_id = (
--   SELECT id FROM auth.users WHERE email = 'gladkovny@gmail.com'
-- )
-- WHERE email = 'gladkovny@gmail.com';

-- Проверка:
-- SELECT t.id, t.email, t.name, t.auth_id, u.email as auth_email
-- FROM trainers t
-- LEFT JOIN auth.users u ON t.auth_id = u.id;
