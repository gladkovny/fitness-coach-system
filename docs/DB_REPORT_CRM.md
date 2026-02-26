# Отчёт по схеме БД (CRM) — Supabase migrations

Сформировано по миграциям в `supabase/migrations/`. Дата: 2026-02-26.

---

## 1. Таблица `exercises` — полная схема

Итоговая схема после всех миграций (00001, 00005, 00009, 00011):

| Колонка | Тип | Ограничения / по умолчанию |
|---------|-----|---------------------------|
| `id` | UUID | PRIMARY KEY, DEFAULT uuid_generate_v4() |
| `trainer_id` | UUID | REFERENCES trainers(id) ON DELETE SET NULL |
| `name` | TEXT | NOT NULL |
| `category` | TEXT | — |
| `subcategory` | TEXT | — |
| `muscle_coefficients` | JSONB | DEFAULT '{}' |
| `equipment` | TEXT | — |
| `laterality` | TEXT | — |
| `video_url` | TEXT | — |
| `created_at` | TIMESTAMPTZ | DEFAULT NOW() |
| `key` | TEXT | UNIQUE (добавлено в 00005) |
| `bodyweight_ratio` | NUMERIC | — (00009) |
| `aliases` | JSONB | DEFAULT '[]' (00011) |

**Индексы:**  
`idx_exercises_trainer` (trainer_id), `idx_exercises_name` (name), `idx_exercises_aliases_gin` (GIN по aliases).

**Источники:**  
- 00001_initial_schema.sql — создание таблицы и базовые колонки  
- 00005_seed_exercises.sql — колонка `key`  
- 00009_exercises_bodyweight_ratio.sql — колонка `bodyweight_ratio`  
- 00011_exercises_aliases.sql — колонка `aliases` и GIN-индекс  

---

## 2. Таблицы `users`, `programs`, `reports`

### `users`

**В миграциях CRM таблицы `users` нет.**

Есть:
- **auth.users** — встроенная таблица Supabase Auth (ссылка из `trainers.auth_id`).
- **trainers** — тренеры (id, email, name, subscription_plan, subscription_expires, settings, created_at, updated_at, auth_id).
- **clients** — клиенты (id, trainer_id, email, name, status, profile, created_at, updated_at).

В экосистеме (CLAUDE.md) «users» объединяет тренеров и клиентов из бота; в этом репозитории сущности — `trainers` и `clients`.

### `programs`

**Есть.** Создаётся в 00001_initial_schema.sql.

| Колонка | Тип | Ограничения / по умолчанию |
|---------|-----|---------------------------|
| `id` | UUID | PRIMARY KEY, DEFAULT uuid_generate_v4() |
| `trainer_id` | UUID | NOT NULL, REFERENCES trainers(id) ON DELETE CASCADE |
| `client_id` | UUID | NOT NULL, REFERENCES clients(id) ON DELETE CASCADE |
| `name` | TEXT | NOT NULL |
| `type` | TEXT | NOT NULL, DEFAULT 'offline', CHECK (type IN ('online', 'offline', 'hybrid')) |
| `status` | TEXT | DEFAULT 'active' |
| `created_at` | TIMESTAMPTZ | DEFAULT NOW() |

**Индекс:** `idx_programs_client` (client_id).

### `reports`

**В миграциях CRM таблицы `reports` нет.**

По документации отчёты из Mini App (@fitprogabot) пишутся в таблицу `reports` — она может быть в общей Supabase для экосистемы, но в папке `supabase/migrations/` этого репозитория не создаётся и не изменяется.

---

## 3. SUPABASE_URL

- Файлы **.env** и **.env.example** в репозитории отсутствуют (не коммитятся, в .gitignore).
- В репо есть только шаблон: **supabase/config.template.env**.

**Значение из шаблона (без ключей):**

```env
SUPABASE_URL=https://YOUR_PROJECT_REF.supabase.co
```

Реальный URL проекта подставляется при копировании шаблона в `.env` (например, `https://<project_ref>.supabase.co`). Конкретное значение хранится только в локальном `.env` и не попадает в репозиторий.

---

*Сгенерировано по файлам: 00001–00018 в supabase/migrations/.*
