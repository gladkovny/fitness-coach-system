# FITNESS COACH SYSTEM - Claude Context

> Auto-generated: 2026-02-01
> Run: .\scripts\sync-claude.ps1

## Project
SaaS for fitness coaches.
- Backend: Google Apps Script (GAS)
- Frontend: Vanilla HTML/CSS/JS
- Database: Google Sheets
- Hosting: Netlify

## Structure
- deploy/
  - mark/
    - dashboard/
      - index.html
    - program/
      - index.html
    - index.html
  - master/
    - css/
      - common.css
    - dashboard/
      - index.html
    - js/
      - api.js
      - supabase-config.js
      - tracker-supabase.js
      - utils.js
    - tracker/
      - assessment.html
      - index.html
    - login.html
- docs/
  - API.md
  - ARCHITECTURE_PROMPT.md
  - ARCHITECTURE_V2.md
  - BODYWEIGHT_AND_INTENSITY.md
  - CLAUDE_RULES_V2.1.md
  - CONTEXT7_SETUP.md
  - CURRENT_STATE_v5.md
  - cursorrules_v2.1.md
  - DASHBOARD_UPGRADE_PLAN.md
  - EXERCISES_AND_AI_UPGRADE.md
  - GIT_WORKFLOW.md
  - MIGRATION_CHECKLIST.md
  - PROJECT_INSTRUCTIONS_v2.md
  - ROADMAP_NEXT_STEPS.md
  - SERVER_SETUP_TASKS.md
  - SETUP_AND_TEST_TRACKER_DASHBOARD.md
  - SUPABASE_VS_SHEETS.md
  - SYNC_STATUS.md
- gas/
  - Master API_assessment.gs
  - MigrateToSupabase.gs
  - ONBOARDING_V2.gs
  - online_API_v4.gs
- scripts/
  - git-push.ps1
  - sync-claude.js
  - sync-claude.ps1
- src/
  - css/
    - common.css
  - dashboard/
    - index.html
  - js/
    - api.js
    - utils.js
  - online/
    - dashboard/
      - index.html
    - program/
      - index.html
  - tracker/
    - assessment.html
    - index.html
- supabase/
  - functions/
    - parse-workout/
      - index.ts
  - migrations/
    - 00001_initial_schema.sql
    - 00002_rls_policies.sql
    - 00003_add_auth_id.sql
    - 00004_real_rls_policies.sql
    - 00005_seed_exercises.sql
    - 00006_exercise_muscle_coefficients.sql
    - 00007_refill_muscle_coefficients.sql
    - 00008_workout_sets_exercise_name.sql
    - 00009_exercises_bodyweight_ratio.sql
    - 00010_client_profile_weight.sql
  - scripts/
    - lib/
      - sheets.js
      - supabase.js
    - backfill-client-profile.js
    - backfill-exercise-names.js
    - backfill-session-names.js
    - config.json
    - config.sample.json
    - ensure_mark_dashboard.sql
    - fix_mark_as_client.sql
    - helical-beaker-437403-u3-a18c3a4ed871.json
    - link_trainer_auth.sql
    - migrate.js
    - package-lock.json
    - package.json
    - README.md
    - setup_auth.js
    - setup_auth.sql
  - AUTH_SETUP.md
  - config.template.env
  - DATA_RESTORE_AND_MARK.md
  - EXERCISES_SEED.md
  - FRONTEND_INTEGRATION.md
  - MIGRATION_PLAN.md
  - README.md
  - SETUP_CHECKLIST.md
  - TESTING_FIRST_TIME.md
  - ИНСТРУКЦИЯ_ПЕРВЫЙ_РАЗ.md
- CLAUDE.md
- package-lock.json
- package.json
- README.md

## .cursorrules
# FITNESS COACH SYSTEM — Cursor Rules

## О проекте
Коробочная SaaS-система для фитнес-тренеров. Владелец: Николай (не программист, работает с AI).

**Полные правила (обязательно при изменениях кода):** `docs/cursorrules_v2.1.md` — 7 разделов системы, два контура (Master/Supabase и Mark/GAS), формат ответов, риски, откат. Для Claude: `docs/CLAUDE_RULES_V2.1.md`. Текущий статус: `docs/SYNC_STATUS.md`.

**Context7 (автоматически):** При ЛЮБОЙ задаче, касающейся Supabase JavaScript, Chart.js, RLS, Edge Functions или других внешних библиотек — АВТОМАТИЧЕСКИ использовать Context7 MCP для актуальной документации. Не полагаться на данные обучения — всегда подтягивать свежую документацию через Context7. Явный промпт «use context7» не требуется. См. `docs/CONTEXT7_SETUP.md`.

**При любом изменении кода указывать:** затронутые разделы [1]–[7], контур (Master или Mark), риски, чек-лист проверки.

**Два контура:** Master (Supabase) — deploy/master: login, dashboard, tracker. Mark (GAS) — deploy/mark: dashboard, program. Идёт переход на Supabase (Фаза 2).

## Структура проекта
```
src/                — Frontend (HTML/CSS/JS)
├── dashboard/        — Дашборд офлайн клиентов
├── tracker/          — Трекер тренера + Assessment
├── online/           — Модули для онлайн клиентов
│   ├── dashboard/      — Дашборд Марка (90 дней)
│   └── program/        — Программа тренировок
├── css/common.css    — Общие стили
└── js/               — Общие модули
    ├── api.js          — API функции
    └── utils.js        — Утилиты

gas/                — Google Apps Script (Backend)
├── Master API_assessment.gs  — Основной API v6.6.1
├── online_API_v4.gs          — API для онлайн (Марк)
└── ONBOARDING_V2.gs          — Онбординг

docs/               — Документация
├── API.md            — API Reference
├── CURRENT_STATE_v5.md
├── cursorrules_v2.1.md   — правила для Cursor (7 разделов, 2 контура)
├── CLAUDE_RULES_V2.1.md  — правила для Claude
└── SYNC_STATUS.md       — текущий статус
```

## Технологии
**Сейчас:** Backend GAS, DB Google Sheets, Frontend Vanilla HTML/CSS/JS, Netlify, Chart.js.
**Цель (ARCHITECTURE_V2):** Backend Supabase Edge Functions, DB Supabase (PostgreSQL), Frontend React PWA, Auth Supabase, AI OpenAI/Claude.

## Правила кода
- Комментарии: РУССКИЙ
- Переменные: английский (camelCase)
- Константы: UPPER_SNAKE_CASE
- Даты: ISO (YYYY-MM-DD)
- Mobile-first дизайн
- Кодировка: UTF-8

## Клиенты
| ID | Тип | Описание |
|----|-----|----------|
| mark | online | 90-дневная программа, свой дашборд |
| yaroslav | offline | Сплит, общий дашборд |
| kirill | offline | Фулбоди, общий дашборд |
| alena | hybrid | Тест онбординга |

## Важные паттерны
- EXPLICIT_EXERCISE_RULES перед fuzzy matching
- Muscle coefficients с subcategory
- ensureColumns для автосоздания колонок
- ISO даты (YYYY-MM-DD)

## При первом обновлении Master API (backlog)
- Добавить колонку **email** в лист Clients (Coach Master) и заполнить email тренера в строке тренера — для миграции в Supabase (MIGRATION_TRAINER_EMAIL) и будущего API. Подробно: docs/ROADMAP_NEXT_STEPS.md, блок «При первом обновлении Master API».

## Для Claude (режим Проект)
- Правила: docs/CLAUDE_RULES_V2.1.md — следовать при каждой правке (разделы [1]–[7], контур, риски, чек-лист).
- После изменений: напоминать выполнить .\scripts\sync-claude.ps1 и при необходимости обновить deploy/master или deploy/mark; при смене этапа — обновить docs/SYNC_STATUS.md.
- **Напоминание о коммите:** после завершения логичной задачи (фича, фикс, обновление доков) напоминать: «Готово. Стоит закоммитить: .\scripts\git-push.ps1». См. docs/GIT_WORKFLOW.md.


## API Endpoints
GET  ?action=getClients
GET  ?action=getOfflineDashboard&clientId=X&period=block
GET  ?action=getOnlineDay&clientId=X&weekNumber=N&dayNumber=N
POST action=startSession
POST action=addSet
POST action=finishSession
POST action=saveAssessment

## Code Rules
- Comments: RUSSIAN
- Variables: english camelCase
- Dates: ISO (YYYY-MM-DD)
- Mobile-first design

## Clients
yaroslav - offline - Split
kirill - offline - Fullbody
mark - online - 90 days
alena - hybrid

---
Copy this to Claude.ai chat
