# FITNESS COACH SYSTEM - Claude Context

> Auto-generated: 2026-03-30
> Run: .\scripts\sync-claude.ps1

## Project
SaaS for fitness coaches.
- Backend: Google Apps Script (GAS)
- Frontend: Vanilla HTML/CSS/JS
- Database: Google Sheets
- Hosting: Netlify

## Structure
- data/
  - kirill-workout-2026-02-13.txt
- deploy/
  - mark/
    - dashboard/
      - index.html
    - program/
      - index.html
    - index.html
  - master/
    - cabinet/
      - css/
        - cabinet.css
      - js/
        - cabinet-api.js
        - cabinet-body.js
        - cabinet-calendar.js
        - cabinet-dashboard-ctrl.js
        - cabinet-nutrition.js
        - cabinet-overview.js
        - cabinet-workouts.js
      - client.html
      - index.html
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
  - architecture-system.excalidraw.json
  - ARCHITECTURE_DIAGRAM_README.md
  - ARCHITECTURE_V2.md
  - BODYWEIGHT_AND_INTENSITY.md
  - BUG_BODYWEIGHT_INTENSITY.md
  - CLAUDE_RULES_V2.1.md
  - CONTEXT7_SETUP.md
  - cursorrules_v2.1.md
  - DASHBOARD_UPGRADE_PLAN.md
  - DB_REPORT_CRM.md
  - DEPLOY.md
  - excalidraw-cs-fitness-migration.excalidraw.json
  - excalidraw-saas-reference-architecture.excalidraw.json
  - excalidraw-user-journey.excalidraw.json
  - EXERCISES_AND_AI_UPGRADE.md
  - EXERCISE_ALIASES.md
  - FIX_GIT_ENCODING.md
  - GIT_WORKFLOW.md
  - MANDATORY_TASKS_STRUCTURE.md
  - MIGRATION_CHECKLIST.md
  - MUSCLE_LOAD_LOGIC.md
  - PROJECT_INSTRUCTIONS_v2.md
  - PROJECT_OVERVIEW_AND_RULES.md
  - RECOGNITION_DEBUG_LEVEL3.md
  - ROADMAP_REFERENCE_ARCHITECTURE.md
  - SAAS_ARCHITECTURE_ANALYSIS_REPORT.md
  - SERVER_SETUP_TASKS.md
  - SETUP_AND_TEST_TRACKER_DASHBOARD.md
  - SUPABASE_VS_SHEETS.md
  - SYNC_STATUS.md
  - TRACKER_DEPLOY_STATUS.md
  - WHOOP_INTEGRATION.md
- gas/
  - Master API_assessment.gs
  - Master_API.gs
  - MigrateToSupabase.gs
  - Onboarding.gs
  - ONBOARDING_V2.gs
  - online_API_v4.gs
- scripts/
  - fix-git-commit-encoding.js
  - generate-kirill-workout.js
  - git-push.ps1
  - run-fix-encoding.sh
  - sync-claude.js
  - sync-claude.ps1
- src/
  - css/
    - common.css
  - dashboard/
    - index.html
  - js/
    - api.js
    - supabase-config.js
    - utils.js
  - online/
    - dashboard/
      - index.html
    - program/
      - index.html
  - tracker/
    - assessment.html
    - index.html
  - trainer/
    - program-builder.html
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
    - 00011_exercises_aliases.sql
    - 00012_mandatory_tasks.sql
    - 00013_rear_delt_alias.sql
    - 00014_lateral_raise_alias.sql
    - 00015_training_blocks_end_date_cost.sql
    - 00016_mandatory_tasks_block_id.sql
    - 00017_client_dashboard_settings.sql
    - 00018_training_blocks_exercise_template.sql
    - 00019_mini_app_integration.sql
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
- tests/
  - recognition.js
  - recognition.test.js
- CLAUDE.md
- commit_msg.txt
- netlify.toml
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

**Сложные задачи:** делить на этапы, делать постепенно (один этап за раз). Правило `.cursor/rules/low-resource-agent.mdc`. При большой задаче — предложить разбиение, спросить с чего начать.

**Обзор проекта:** `docs/PROJECT_OVERVIEW_AND_RULES.md` — сводка правил, частые задачи и ошибки.

**Два контура:** Master (Supabase) — deploy/master: login, dashboard, tracker. Mark (GAS) — deploy/mark: dashboard, program. Идёт переход на Supabase (Фаза 2).

## Pre-commit и тесты
- **Husky + lint-staged:** при `git commit` запускаются `npx lint-staged` (ESLint --fix и Prettier для staged *.js; Prettier для *.html) и `npm test`.
- **Тесты распознавания:** `tests/recognition.test.js` — кейсы ввод → id упражнения (без фреймворка, Node assert). Запуск: `npm test`. Логика в `tests/recognition.js` (normalizeText, recognizeExercise, фикстура упражнений).
- При изменении логики распознавания — обновить тесты и фикстуру в `tests/recognition.js` при необходимости.

## Структура проекта
```
tests/              — Тесты (recognition.test.js, recognition.js)
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
- **Сообщения коммитов:** на английском (избегаем проблем с кодировкой на GitHub). Примеры: `[fix] Fix dashboard loading`, `[docs] Update status`.

---

## 🧠 Протокол решения проблем (Problem Solving Protocol)

### Уровень 1 — Простая задача
Сразу решение + код

### Уровень 2 — Средняя задача
1. Уточни требования
2. Предложи решение
3. Реализуй

### Уровень 3 — Сложная задача
**Триггеры для Уровня 3:**
- Задача не решена за 2 попытки
- AI/ML/распознавание
- Оптимизация производительности
- Интеграция с внешним API
- Пользователь повторно говорит "не работает"

**Алгоритм:**
1. **СТОП** — не писать код сразу
2. **Анализ** — объясни проблему своими словами
3. **Примеры** — покажи конкретный input → expected → actual
4. **История** — что уже пробовали, почему не сработало
5. **Исследование** — Context7, веб-поиск для best practices
6. **3 варианта** — разные подходы с плюсами/минусами
7. **Выбор** — спроси пользователя какой подход
8. **Прототип** — минимальный тест для проверки
9. **Реализация** — только после успешного теста

---

## 🔍 Отладка (Debugging Protocol)

При баге который не решается за 2 попытки:

1. **Объясни проблему** — как для 5-летнего ребёнка
2. **Покажи пример** — конкретный input/output
3. **История попыток** — что пробовали, результат
4. **Другой подход** — предложи принципиально иное решение
5. **Внешняя помощь** — если нужно, предложи спросить Claude.ai

**Формула:** ПРОБЛЕМА → ПРИМЕР → ИСТОРИЯ → НОВЫЙ ПОДХОД

---

## 📚 Внешние источники знаний

При сложных задачах — СНАЧАЛА ищи решения:

1. **Context7** — документация библиотек (ОБЯЗАТЕЛЬНО для Supabase, Chart.js)
2. **Веб-поиск** — паттерны и best practices 2024-2025
3. **GitHub** — примеры реализации

**Шаблон поиска:** "[технология] [проблема] best practice 2024"

---

## 🏋️ Распознавание упражнений — специальные правила

### Приоритет методов (строго по порядку):
1. **EXACT MATCH** — точное совпадение (100%)
2. **EXPLICIT RULES** — regex паттерны (95%)
3. **SYNONYM MAP** — словарь синонимов (90%)
4. **FUZZY MATCH** — только если similarity >80%
5. **FALLBACK** — спросить пользователя

### Обязательное логирование:
```javascript
console.log('RECOGNITION:', {
  input: userInput,
  method: 'exact|explicit|synonym|fuzzy',
  matched: exerciseId,
  confidence: 0.95,
  alternatives: ['alt1', 'alt2']
});
```

### При изменении логики распознавания:
1. Показать тестовые кейсы ДО изменений
2. Внести изменения
3. Прогнать те же кейсы ПОСЛЕ
4. Сравнить результаты

---

## ⚠️ Красные флаги — когда ОСТАНОВИТЬСЯ

Если происходит что-то из списка — СТОП, переключиться на Уровень 3:

- [ ] Одна и та же ошибка после 2+ попыток
- [ ] Код работает "иногда" (нестабильно)
- [ ] Не понимаю ПОЧЕМУ не работает (только КАК)
- [ ] Решение требует "магических чисел" или хардкода
- [ ] Пользователь фрустрирован

**Действие:** Остановиться → Проанализировать → Предложить альтернативу → Спросить

---

## 💬 Шаблоны ответов

### При неудачной попытке:
❌ Предыдущее решение не сработало.
Что пошло не так: [объяснение]
Альтернативные подходы:

[Подход A] — плюсы/минусы
[Подход B] — плюсы/минусы
[Подход C] — плюсы/минусы

Какой попробуем?

### При сложной задаче:
🔍 Это сложная задача (Уровень 3).
Моё понимание проблемы: [описание]
Нужна информация:

Пример input: ?
Ожидаемый output: ?
Что сейчас получается: ?

Предварительные варианты решения:

...
...
...

Прежде чем писать код — подтверди понимание или уточни.


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
