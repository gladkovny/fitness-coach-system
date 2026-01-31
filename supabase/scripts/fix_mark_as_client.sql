-- Исправление: Марк должен быть клиентом, а не тренером.
-- Выполнить в Supabase → SQL Editor (один раз).
-- (Уже выполнено, если Марк есть в clients.)

-- 1) Добавить Марка как клиента (trainer_id = тот же, что у остальных)
-- INSERT INTO clients (trainer_id, name, email, status, profile)
-- SELECT trainer_id, 'Марк', NULL, 'active', '{}' FROM clients LIMIT 1;

-- 2) Удалить ошибочную запись тренера "Марк"
-- DELETE FROM trainers WHERE name = 'Марк' AND email = 'gladkovny@gmail.com';

-- ═══════════════════════════════════════════════════════════════
-- Переименовать "Test Trainer" в реального тренера (Николай)
-- Выполнить в Supabase → SQL Editor, если хочешь, чтобы в trainers был ты, а не Test Trainer.
-- ═══════════════════════════════════════════════════════════════
-- UPDATE trainers
-- SET email = 'gladkovny@gmail.com', name = 'Николай'
-- WHERE email = 'test@example.com' AND name = 'Test Trainer';
