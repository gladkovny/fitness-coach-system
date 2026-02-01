# Чеклист миграций и backfill — Supabase

**Назначение:** Быстро видеть, что уже применено, что — нет. Обновляй статус после каждого шага.

---

## SQL-миграции (Supabase → SQL Editor)

Выполнять **по порядку**. После Run — обновить статус.

| # | Файл | Статус | Дата | Как проверить |
|---|------|--------|------|---------------|
| 00001 | initial_schema | ☐ / ✅ | | Таблицы clients, exercises, workout_sessions существуют |
| 00002 | rls_policies | ☐ / ✅ | | RLS включён |
| 00003 | add_auth_id | ☐ / ✅ | | Колонка trainers.auth_id есть |
| 00004 | real_rls_policies | ☐ / ✅ | | Политики активны |
| 00005 | seed_exercises | ☐ / ✅ | | `SELECT COUNT(*) FROM exercises` > 0 |
| 00006 | exercise_muscle_coefficients | ☐ / ✅ | | У упражнений заполнен muscle_coefficients |
| 00007 | refill_muscle_coefficients | ☐ / ✅ | | Дозаполнение коэффициентов |
| 00008 | workout_sets_exercise_name | ☐ / ✅ | | Колонка workout_sets.exercise_name есть |
| 00009 | exercises_bodyweight_ratio | ✅ | 31.01.2026 | Колонка exercises.bodyweight_ratio есть, у «Своё тело» — значения |
| 00010 | client_profile_weight | ✅ | 31.01.2026 | Комментарий на clients.profile (документация) |

---

## Backfill-скрипты (Node.js, из supabase/scripts)

Требуют: .env, config.json, GOOGLE_APPLICATION_CREDENTIALS.

| Скрипт | Статус | Дата | Что делает |
|--------|--------|------|------------|
| backfill-exercise-names.js | ☐ / ✅ | | Заполняет workout_sets.exercise_name из WorkoutLog |
| backfill-session-names.js | ☐ / ✅ | | Заполняет workout_sessions.type из WorkoutSessions |
| backfill-client-profile.js | ☐ / ✅ | | Заполняет clients.profile (weight, mainGoals) из Goals |

---

## Быстрая проверка (SQL Editor)

```sql
-- Миграции 00005–00009
SELECT 'exercises' AS tbl, COUNT(*) FROM exercises
UNION ALL
SELECT 'bodyweight_ratio', COUNT(*) FROM exercises WHERE bodyweight_ratio IS NOT NULL
UNION ALL
SELECT 'exercise_name', COUNT(*) FROM workout_sets WHERE exercise_name IS NOT NULL;
```

---

## Шаблон для обновления (копируй при отчёте)

```
Миграции: 00009 ✅, 00010 ✅
Backfill: backfill-client-profile — не запускал / ✅ выполнено
```
