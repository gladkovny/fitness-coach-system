# Переход на Supabase (Фаза 2)

Целевая архитектура: [../docs/ARCHITECTURE_V2.md](../docs/ARCHITECTURE_V2.md).

## Структура

```
supabase/
├── README.md           — этот файл
├── MIGRATION_PLAN.md   — план переноса данных Sheets → Supabase
├── config.template.env — шаблон переменных (не коммитить секреты)
└── migrations/         — SQL-миграции по порядку
    ├── 00001_initial_schema.sql   — таблицы, RLS, индексы
    ├── 00002_seed_exercises.sql    — база упражнений (опционально)
    └── ...
```

## Как использовать

**Первый запуск:** пошаговый чеклист → [SETUP_CHECKLIST.md](SETUP_CHECKLIST.md).

**Настройка Auth:** после переноса данных → [AUTH_SETUP.md](AUTH_SETUP.md) (автоматизированный процесс).

Кратко:
1. Создать проект на [supabase.com](https://supabase.com).
2. Применить миграции из `migrations/` (SQL Editor или `supabase db push`).
3. Скопировать `config.template.env` в `.env` и заполнить `SUPABASE_URL`, `SUPABASE_ANON_KEY`.
4. Запустить скрипты переноса данных (см. MIGRATION_PLAN.md; скрипты — в `scripts/`).
5. Настроить Auth: [AUTH_SETUP.md](AUTH_SETUP.md).

## Порядок миграций

Миграции применяются по имени файла (сортировка). Не переименовывать уже применённые.

## RLS (Row Level Security)

Включён на всех таблицах. Правила:
- **trainers** — доступ только к своей записи (по auth.uid()).
- **clients** — тренер видит своих клиентов; клиент — только себя.
- **workout_sessions, daily_logs и т.д.** — по client_id → trainer_id или client_id = свой.

Детали в комментариях внутри миграций.
