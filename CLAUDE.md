# FITNESS COACH SYSTEM — Claude Context

> Автоматически сгенерировано: 2026-02-04
> Запуск: `node scripts/sync-claude.js`

## Проект
Коробочная SaaS-система для фитнес-тренеров.
- **Backend**: Supabase (auth, БД для master) + GAS (часть потоков, Марк)
- **Frontend**: Vanilla HTML/CSS/JS (deploy/master, deploy/mark)
- **Database**: Supabase (основные данные) + Google Sheets (исторические до полного перехода)
- **Hosting**: Netlify
- **Этап**: Миграция на Supabase. Трекер и дашборд master на Supabase.

## Структура проекта
```
├── CLAUDE.md
├── data/

├── deploy/
│   ├── mark/
│   │   ├── dashboard/
│   │   ├── index.html
│   │   ├── program/
│   ├── master/
│   │   ├── css/
│   │   ├── dashboard/
│   │   ├── js/
│   │   ├── login.html
│   │   ├── tracker/
├── docs/
│   ├── API.md
│   ├── ARCHITECTURE_PROMPT.md
│   ├── ARCHITECTURE_V2.md
│   ├── BODYWEIGHT_AND_INTENSITY.md
│   ├── CLAUDE_RULES_V2.1.md
│   ├── CONTEXT7_SETUP.md
│   ├── CURRENT_STATE.md
│   ├── CURRENT_STATE_v5.md
│   ├── cursorrules_v2.1.md
│   ├── DASHBOARD_UPGRADE_PLAN.md
│   ├── DEPLOY.md
│   ├── EXERCISES_AND_AI_UPGRADE.md
│   ├── EXERCISE_ALIASES.md
│   ├── GIT_WORKFLOW.md
│   ├── MANDATORY_TASKS_STRUCTURE.md
│   ├── MIGRATION_CHECKLIST.md
│   ├── PROJECT_INSTRUCTIONS_v2.md
│   ├── PROJECT_OVERVIEW_AND_RULES.md
│   ├── RECOGNITION_DEBUG_LEVEL3.md
│   ├── ROADMAP_NEXT_STEPS.md
│   ├── SERVER_SETUP_TASKS.md
│   ├── SETUP_AND_TEST_TRACKER_DASHBOARD.md
│   ├── SUPABASE_VS_SHEETS.md
│   ├── SYNC_STATUS.md
│   ├── TRACKER_DEPLOY_STATUS.md
├── gas/
│   ├── Master API_assessment.gs
│   ├── Master_API.gs
│   ├── MigrateToSupabase.gs
│   ├── Onboarding.gs
│   ├── ONBOARDING_V2.gs
│   ├── online_API_v4.gs
├── netlify.toml
├── package-lock.json
├── package.json
├── README.md
├── scripts/
│   ├── git-push.ps1
│   ├── sync-claude.js
│   ├── sync-claude.ps1
├── src/
│   ├── css/
│   │   ├── common.css
│   ├── dashboard/
│   │   ├── index.html
│   ├── js/
│   │   ├── api.js
│   │   ├── utils.js
│   ├── online/
│   │   ├── dashboard/
│   │   ├── program/
│   ├── tracker/
│   │   ├── assessment.html
│   │   ├── index.html
├── supabase/
│   ├── AUTH_SETUP.md
│   ├── config.template.env
│   ├── DATA_RESTORE_AND_MARK.md
│   ├── EXERCISES_SEED.md
│   ├── FRONTEND_INTEGRATION.md
│   ├── functions/
│   │   ├── parse-workout/
│   ├── migrations/
│   │   ├── 00001_initial_schema.sql
│   │   ├── 00002_rls_policies.sql
│   │   ├── 00003_add_auth_id.sql
│   │   ├── 00004_real_rls_policies.sql
│   │   ├── 00005_seed_exercises.sql
│   │   ├── 00006_exercise_muscle_coefficients.sql
│   │   ├── 00007_refill_muscle_coefficients.sql
│   │   ├── 00008_workout_sets_exercise_name.sql
│   │   ├── 00009_exercises_bodyweight_ratio.sql
│   │   ├── 00010_client_profile_weight.sql
│   │   ├── 00011_exercises_aliases.sql
│   │   ├── 00012_mandatory_tasks.sql
│   │   ├── 00013_rear_delt_alias.sql
│   │   ├── 00014_lateral_raise_alias.sql
│   ├── MIGRATION_PLAN.md
│   ├── README.md
│   ├── scripts/
│   │   ├── backfill-client-profile.js
│   │   ├── backfill-exercise-names.js
│   │   ├── backfill-session-names.js
│   │   ├── config.json
│   │   ├── config.sample.json
│   │   ├── ensure_mark_dashboard.sql
│   │   ├── fix_mark_as_client.sql
│   │   ├── helical-beaker-437403-u3-a18c3a4ed871.json
│   │   ├── lib/
│   │   ├── link_trainer_auth.sql
│   │   ├── migrate.js
│   │   ├── package-lock.json
│   │   ├── package.json
│   │   ├── README.md
│   │   ├── setup_auth.js
│   │   ├── setup_auth.sql
│   ├── SETUP_CHECKLIST.md
│   ├── TESTING_FIRST_TIME.md
│   ├── ИНСТРУКЦИЯ_ПЕРВЫЙ_РАЗ.md
├── tests/
│   ├── recognition.js
│   ├── recognition.test.js
```

## .cursorrules
```
# FITNESS COACH SYSTEM — Cursor Rules

## О проекте
Коробочная SaaS-система для фитнес-тренеров. Владелец: Николай (не программист, работает с AI).

**Полные правила (обязательно при изменениях кода):** `docs/cursorrules_v2.1.md` — 7 разделов системы, два контура (Master/Supabase и Mark/GAS), формат ответов, риски, откат. Для Claude: `docs/CLAUDE_RULES_V2.1.md`. Текущий статус: `docs/SYNC_STATUS.md`.

**Context7 (автоматически):** При ЛЮБОЙ задаче, касающейся Supabase JavaScript, Chart.js, RLS, Edge Functions или других внешних библиотек — АВТОМАТИЧЕСКИ использовать Context7 MCP для актуальной документации. Не полагаться на данные обучения — всегда подтягивать свежую документацию через Context7. Явный промпт «use context7» не требуется. См. `docs/CONTEXT7_SETUP.md`.

**При любом изменении кода указывать:** затронутые разделы [1]–[7], контур (Master или Mark), риски, чек-лист проверки.

**Сложные задачи:** делить на этапы, делать постепенно (один этап за раз). Правило `.cursor/rules/low-resource-agent.mdc`. При большой задаче — предложить разбиение, спросить с чего начать.

**Обзор проекта:** `docs/PROJECT_OVERVIEW_AND_RULES.md` — сводка правил, частые задачи и ошибки.

**Два контура:** Master (Supabase) — deploy/master: login, dashboard, tracker. Mark (GAS) — deploy/mark: dashboard, program. Идёт переход на Supabase (Фаза 2).

## Pre-commit и тесты
- **Husky + lint-staged:** при `git commit` запускаются `npx lint-staged` (ESLint --fix и Prettier для staged *
```

## API Endpoints (краткий список)
```
GET  ?action=getClients
GET  ?action=getOfflineDashboard&clientId=X&period=block
GET  ?action=getOnlineDay&clientId=X&weekNumber=N&dayNumber=N
POST action=startSession
POST action=addSet
POST action=finishSession
POST action=saveAssessment
```

## Правила
- Комментарии: РУССКИЙ
- Переменные: английский camelCase  
- Даты: ISO (YYYY-MM-DD)
- Mobile-first дизайн

## Клиенты
| ID | Тип | Описание |
|----|-----|----------|
| yaroslav | offline | Сплит |
| kirill | offline | Фулбоди |
| mark | online | 90 дней |
| alena | hybrid | — |

## Текущие задачи
- [ ] Тестирование Unified Tracker v4.4 (2 недели)
- [ ] Фикс багов по фидбеку Ярослава и Кирилла
- [ ] Марк: День 24/90
- [ ] Тестирование на Алене — завершить цикл
- [ ] Автозаполнение Goals из формы
- [ ] Список 5-7 потенциальных партнёров
- [ ] Презентация/оффер для бета-тренеров
- [ ] Одна и та же ошибка после 2+ попыток
- [ ] Код работает "иногда" (нестабильно)
- [ ] Не понимаю ПОЧЕМУ не работает (только КАК)

## Важные документы
- **Текущий статус:** docs/SYNC_STATUS.md
- **Правила для AI:** docs/CLAUDE_RULES_V2.1.md, docs/cursorrules_v2.1.md
- **Задачи на будущее:** docs/ROADMAP_NEXT_STEPS.md (раздел «Задачи на будущее»)

---
*Скопируй это в начало диалога с Claude.ai*
