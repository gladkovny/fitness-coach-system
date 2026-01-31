# Чеклист: первый запуск Supabase

Пошаговый запуск перехода на Supabase (Фаза 2). Выполнять по порядку.

**Шаги 1–4 выполнены.** Дальше — перенос данных и подключение API/Auth.

---

## Шаг 1: Создать проект на Supabase

- [ ] Зайти на [supabase.com](https://supabase.com) и войти (или зарегистрироваться).
- [ ] **New project** → указать:
  - **Name:** например `fitness-coach-system`
  - **Database password:** сохранить в надёжном месте (для доступа к БД).
  - **Region:** выбрать ближайший (например Frankfurt).
- [ ] Дождаться создания проекта (1–2 минуты).

**Результат:** в Dashboard есть URL проекта и ключи (Settings → API).

---

## Шаг 2: Применить миграции

Миграции лежат в `supabase/migrations/`. Применять **по порядку** (по имени файла).

### Вариант A: через SQL Editor в Dashboard

- [ ] В проекте Supabase открыть **SQL Editor**.
- [ ] Открыть локально файл `supabase/migrations/00001_initial_schema.sql`, скопировать **весь** текст и вставить в новый запрос → **Run**.
- [ ] Убедиться, что выполнение без ошибок.
- [ ] То же для `supabase/migrations/00002_rls_policies.sql` → **Run**.

### Вариант B: через Supabase CLI

- [ ] Установить [Supabase CLI](https://supabase.com/docs/guides/cli).
- [ ] В корне репозитория: `supabase login`, затем `supabase link --project-ref YOUR_PROJECT_REF`.
- [ ] Применить миграции: `supabase db push`.

**Результат:** в **Table Editor** видны таблицы: `trainers`, `clients`, `exercises`, `programs`, `training_blocks`, `workout_sessions`, `workout_sets`, `daily_logs` и др.

---

## Шаг 3: Настроить локальный конфиг ✅

- [x] Скопировать `supabase/config.template.env` в файл `.env` (в папку `supabase/` или в корень проекта — по тому, где будет читать фронт/скрипты).
- [x] В Supabase Dashboard: **Settings → API** скопировать:
  - **Project URL** → в `.env` как `SUPABASE_URL`
  - **anon public** → как `SUPABASE_ANON_KEY`
  - **service_role** → как `SUPABASE_SERVICE_ROLE_KEY` (только для серверных скриптов, не светить на фронте).
- [x] Убедиться, что `.env` добавлен в `.gitignore` и не коммитится.

**Результат:** приложение или скрипты могут подключаться к проекту по URL и ключам.

---

## Шаг 4: Проверить доступ ✅

- [x] В **Table Editor** открыть любую таблицу (например `trainers`).
- [x] Создать тестовую запись вручную (Insert row) или выполнить в SQL Editor:

```sql
INSERT INTO trainers (email, name) VALUES ('test@example.com', 'Test Trainer');
```

- [ ] Убедиться, что RLS не блокирует (если появятся ошибки — см. `00002_rls_policies.sql`: там временно разрешающие политики для авторизованных пользователей; пока Auth не подключён, для теста можно использовать service_role или отключить RLS только для проверки).

**Результат:** БД принимает данные, схема работает.

---

## Шаг 5: Перенос данных (автоматический)

- [ ] Настроить Google Service Account и доступ к таблицам (см. [scripts/README.md](scripts/README.md)).
- [ ] Создать `supabase/scripts/config.json` из `config.sample.json`, указать `coachMasterSpreadsheetId` и `trainerEmail`.
- [ ] Установить переменную `GOOGLE_APPLICATION_CREDENTIALS` (путь к JSON ключа).
- [ ] Выполнить из папки `supabase/scripts/`: `npm install` → `npm run migrate`.
- [ ] Проверить в Table Editor количество записей и связи (см. раздел «Дальше» ниже).

**Результат:** данные из Google Sheets перенесены в Supabase одним запуском.

---

## Шаг 6: Настройка Auth (автоматизировано) ✅

- [x] Включить Auth в Supabase Dashboard (Authentication → Providers → Email).
- [x] Применить миграции `00003_add_auth_id.sql` и `00004_real_rls_policies.sql` (SQL Editor).
- [x] Создать пользователя и связать с тренером (Dashboard + SQL или setup_auth.js).
- [x] Проверить: в `trainers` есть запись с заполненным `auth_id`.

**Результат:** Auth подключён, RLS работает, можно входить в систему.

**Подробная инструкция:** [AUTH_SETUP.md](AUTH_SETUP.md) — пошагово с автоматизацией.

---

## Дальше (после успешного шагов 1–6) — текущий фокус

Auth настроен. Следующий шаг — **новый API** и/или **подключение фронта к Supabase**.

### Вариант A: Supabase Auth (выполнено)

1. **Включить Auth** в Supabase: Authentication → Providers → Email (включить, при желании отключить «Confirm email» для теста).
2. **Связать тренера с пользователем:** добавить в таблицу `trainers` колонку `auth_id` (UUID, ссылка на `auth.users.id`) или хранить email и сопоставлять по нему после входа.
3. **Заменить RLS:** в `supabase/migrations/` новая миграция: политики вида «тренер видит только свои записи» через `auth.uid()` и связь `trainers.auth_id = auth.uid()`.

**Плюс:** сразу безопасный доступ по ролям; API и фронт потом опираются на авторизованного пользователя.

### Вариант B: Новый API первым

1. **Edge Functions** в Supabase (или небольшой Node/Express за отдельным URL): эндпоинты типа `getClients`, `getOfflineDashboard`, `startSession`, `addSet` и т.д., которые читают/пишут в Supabase (пока с `service_role` или anon + текущие RLS).
2. **Фронт:** заменить вызовы GAS на вызовы нового API (или напрямую Supabase Client с anon key, если RLS достаточно).
3. **Auth** подключить после или параллельно, затем подтянуть RLS и привязку тренера к `auth.uid()`.

**Плюс:** быстрее уйти с GAS; авторизацию можно добавить следом.

---

Рекомендация: начать с **Auth** (вариант A), потом один раз делать API и RLS с учётом `auth.uid()`. Если удобнее сначала вынести API и оставить GAS как временный бэкенд — можно начать с варианта B.

См. также: [docs/ROADMAP_NEXT_STEPS.md](../docs/ROADMAP_NEXT_STEPS.md).
