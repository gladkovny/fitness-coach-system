# План миграции данных: Google Sheets → Supabase

Соответствие листов и таблиц по [ARCHITECTURE_V2.md](../docs/ARCHITECTURE_V2.md).

---

## 1. Coach Master → общие и тренерские данные

| Источник (Google Sheets) | Целевая таблица Supabase | Действия |
|--------------------------|---------------------------|----------|
| **Coach_Master / Clients** | `trainers` + `clients` | Разделить: одна строка «тренер» → trainers; остальные клиенты → clients с trainer_id. |
| **Coach_Master / Exercises** | `exercises` | Прямой перенос. trainer_id = NULL для общей базы. muscle_coefficients → JSONB. |
| **Coach_Master / ClientBlocks** | `training_blocks` | Связать с programs по client_id; при необходимости сначала создать programs из целей/блоков. |
| **Coach_Master / Settings** | Настройки тренера в `trainers.settings` (JSONB) или отдельная таблица | Решить формат и перенести. |

---

## 2. Client Sheet (каждый клиент) → таблицы по клиенту

| Источник (лист в таблице клиента) | Целевая таблица | Примечания |
|-----------------------------------|-----------------|------------|
| **Goals** | `clients.profile` (JSONB) + при необходимости `programs` | Цели, срок программы, старт — в profile или в programs. |
| **ClientProfile** | `clients.profile` | Возраст, рост, вес, ограничения — в JSONB profile. |
| **Nutrition** (целевое КБЖУ) | `clients.profile` или отдельная таблица nutrition_goals | Пока можно в profile. |
| **Daily** | `daily_logs` | Одна строка = одна дата + client_id. Колонки: weight, sleep_hours, nutrition (Идеально/Норма/Срыв), source = 'manual'. |
| **WorkoutSessions** | `workout_sessions` | date, type, status, notes. Связь с training_blocks по block_id (если есть). |
| **WorkoutLog** | `workout_sets` | По session_id, exercise_id (по имени через exercises), set_number, reps, weight, rpe. |
| **TrainingBlocks** | `training_blocks` | name, total_sessions, used_sessions, start_date, status. program_id — из programs. |
| **Assessment** | Отдельная таблица `assessments` или JSON в profile | При необходимости добавить миграцию assessments. |

---

## 3. Порядок переноса

1. **Создать проект Supabase**, применить миграции из `supabase/migrations/`.
2. **Тренеры:** выгрузить Coach_Master/Clients → определить тренера → вставить в `trainers` (пока без auth_id).
3. **Клиенты:** из того же Clients + Client Sheets → вставить в `clients` с trainer_id.
4. **Упражнения:** Coach_Master/Exercises → `exercises`.
5. **Программы и блоки:** из Goals + TrainingBlocks + ClientBlocks → `programs`, `training_blocks`.
6. **Сессии и подходы:** WorkoutSessions → `workout_sessions`, WorkoutLog → `workout_sets`.
7. **Ежедневные данные:** Daily → `daily_logs`.
8. **Питание (факт):** если есть лист с фактическим КБЖУ по дням → `nutrition_logs`.

---

## 4. Скрипты переноса (автоматизировано)

В папке **supabase/scripts/** реализован полностью автоматический перенос:

1. **Настройка (один раз):**
   - Google Cloud: Service Account, включённый Google Sheets API, ключ JSON.
   - Поделиться каждой таблицей (Coach Master + таблицы клиентов) с email сервисного аккаунта (Читатель).
   - `config.json` из `config.sample.json`: `coachMasterSpreadsheetId`, `trainerEmail`.
   - `.env` в `supabase/` с `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`.
   - Переменная `GOOGLE_APPLICATION_CREDENTIALS` — путь к JSON ключа.

2. **Запуск:** из папки `supabase/scripts/` выполнить `npm install` и `npm run migrate`.

Скрипт по порядку: тренер и клиенты из Coach Master/Clients → упражнения из exercises_master → для каждого клиента (по spreadsheetId): программы, блоки, сессии, подходы, daily_logs. Подробно — в [supabase/scripts/README.md](scripts/README.md).

---

## 5. Проверка после миграции

- Количество записей: Clients, Exercises, Sessions, Daily — совпадает с Supabase.
- Связи: client_id, trainer_id, program_id, block_id, session_id — без «висячих» ссылок.
- Даты в формате ISO, числа без лишних строк.
