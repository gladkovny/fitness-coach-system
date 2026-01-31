# FITNESS COACH SYSTEM - Claude Context

> Auto-generated: 2026-01-29
> Run: .\scripts\sync-claude.ps1

## Project
SaaS for fitness coaches.
- **Backend:** Supabase (auth, БД для master-дашборда) + Google Apps Script (GAS) для части потоков и программы Марка.
- Frontend: Vanilla HTML/CSS/JS (deploy/master, deploy/mark).
- Database: Supabase (основные данные) + Google Sheets (исторические/параллельные данные до полного перехода).
- Hosting: Netlify (целевой).

**Текущий этап:** миграция на Supabase. Вход и дашборд master уже на Supabase. Застряли на запуске локального сервера (npx не найден → использовать Python). Контекст: **docs/SYNC_STATUS.md**, **supabase/ИНСТРУКЦИЯ_ПЕРВЫЙ_РАЗ.md**. Правила для AI (7 разделов, 2 контура, формат ответов): **docs/CLAUDE_RULES_V2.1.md**, **docs/cursorrules_v2.1.md**.

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
      - utils.js
    - tracker/
      - assessment.html
      - index.html
- docs/
  - API.md
  - ARCHITECTURE_PROMPT.md
  - CURRENT_STATE_v5.md
  - PROJECT_INSTRUCTIONS_v2.md
  - SYNC_STATUS.md
  - cursorrules_v2.1.md
  - CLAUDE_RULES_V2.1.md
- gas/
  - Master API_assessment.gs
  - ONBOARDING_V2.gs
  - online_API_v4.gs
- scripts/
  - sync-claude.js
  - sync-claude.ps1
- supabase/
  - migrations/
  - scripts/
  - ИНСТРУКЦИЯ_ПЕРВЫЙ_РАЗ.md
  - TESTING_FIRST_TIME.md
  - DATA_RESTORE_AND_MARK.md
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
- CLAUDE.md
- package.json
- README.md

## .cursorrules
# FITNESS COACH SYSTEM — Cursor Rules

## О проекте
Коробочная SaaS-система для фитнес-тренеров. Владелец: Николай (Бали).

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
└── CURRENT_STATE_v5.md
```

## Технологии
- Backend: Google Apps Script
- Frontend: Vanilla HTML/CSS/JS
- Database: Google Sheets
- Hosting: Netlify
- Charts: Chart.js

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

## Rules for Claude (add docs/CLAUDE_RULES.md to project)
- When making changes: update README/.cursorrules/docs/API.md as needed
- After each change: remind to run .\scripts\sync-claude.ps1 and update deploy/ if frontend changed
- **Перед планированием:** прочитать docs/SYNC_STATUS.md для актуального этапа и следующих шагов.
- **При изменениях кода:** следовать docs/CLAUDE_RULES_V2.1.md (разделы [1]–[7], контур, риски, чек-лист).

---
Copy this to Claude.ai chat. Для синхронизации: приложи docs/SYNC_STATUS.md и docs/CLAUDE_RULES_V2.1.md.
