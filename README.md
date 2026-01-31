# Fitness Coach System

Коробочная SaaS-система для персональных фитнес-тренеров. Единый центр данных о клиенте + CRM + интеграции (Whoop, Apple Health) + AI-помощник.

**Архитектура (источник правды):** [docs/ARCHITECTURE_V2.md](docs/ARCHITECTURE_V2.md) — целевой стек Supabase + React PWA, дизайн Olympus, API, roadmap. Идёт переход с GAS/Sheets на Supabase (Фаза 2).

## Быстрый старт

```
src/           — Frontend (HTML/CSS/JS)
├── dashboard/   — Дашборд клиента
├── tracker/     — Трекер тренировок + Assessment
├── css/         — Общие стили
└── js/          — Общие модули

gas/           — Google Apps Script (Backend)
├── Master API_assessment.gs   — Основной API (6500+ строк)
└── ONBOARDING_V2.gs           — Система онбординга

docs/          — Документация
├── CURRENT_STATE_v5.md        — Текущий статус
├── PROJECT_INSTRUCTIONS_v2.md — Инструкции проекта
└── API.md                     — API Reference

archive/       — Архив (старые клиенты, бэкапы)
```

## Технологии

| Слой | Технология |
|------|------------|
| Backend | Google Apps Script |
| Database | Google Sheets |
| Frontend | Vanilla HTML/CSS/JS |
| Charts | Chart.js |
| Hosting | Netlify |

## Компоненты

| Компонент | Версия | Описание |
|-----------|--------|----------|
| Dashboard | v10.9 | Клиентский дашборд (прогресс, КБЖУ) |
| Offline Dashboard | v4 | Дашборд для офлайн-клиентов |
| Unified Tracker | v4.4 | Трекер тренировок тренера |
| Master API | v7.0 | Backend endpoints |
| Exercises DB | 126 шт | База упражнений + muscle coefficients |

## Типы клиентов

| Тип | Описание | Модули |
|-----|----------|--------|
| `online` | Удалённое ведение | КБЖУ, Daily, вес |
| `offline` | Тренировки в зале | Sessions, WorkoutLog, Blocks |
| `hybrid` | Комбинированный | Все модули |

## Активные клиенты

- **Mark** (hybrid) — 90-дневная программа
- **Yaroslav** (offline) — Split
- **Kirill** (offline) — FullBody
- **Alena** (hybrid) — Тест онбординга

## Структура данных

### Coach Master (центральная таблица)
```
Clients        — Список клиентов + spreadsheetId
Exercises      — 126 упражнений с коэффициентами мышц
ClientBlocks   — Синхронизация блоков тренировок
Settings       — Настройки системы
```

### Client Sheet (для каждого клиента)
```
ClientProfile  — Профиль (вес, рост, возраст)
Goals          — Цели программы
Nutrition      — Целевое КБЖУ (формулы)
Daily          — Ежедневные данные
WorkoutSessions — История тренировок
WorkoutLog     — Детали упражнений
TrainingBlocks — Блоки тренировок
MandatoryTasks — Обязательные задачи
Assessment     — История оценок
```

## Правила кода

```javascript
// Комментарии: русский
const variableName = '';  // camelCase
const CONSTANT_NAME = ''; // UPPER_SNAKE_CASE
```

- Mobile-first дизайн
- Кодировка: UTF-8
- Минимум зависимостей

## Деплой

### Frontend (Netlify)
1. Загрузить `src/` на Netlify
2. Настроить домен

### Backend (Google Apps Script)
1. Открыть Coach Master таблицу
2. Расширения → Apps Script
3. Вставить код из `gas/`
4. Deploy → New deployment → Web app

## Архитектура и roadmap

| Документ | Описание |
|----------|----------|
| [ARCHITECTURE_V2.md](docs/ARCHITECTURE_V2.md) | Целевая архитектура, стек, БД, API, интеграции, монетизация |
| [ROADMAP_NEXT_STEPS.md](docs/ROADMAP_NEXT_STEPS.md) | Следующие шаги по фазам (от стабилизации до Supabase) |

**Текущая фаза:** 1 (стабилизация) → 2 (миграция на Supabase). Код в `supabase/` — схема БД и миграции.

## Ссылки

- **GitHub:** https://github.com/gladkovny/fitness-coach-system
- **Docs:** [PROJECT_INSTRUCTIONS_v2.md](docs/PROJECT_INSTRUCTIONS_v2.md)
- **API:** [docs/API.md](docs/API.md)

## Владелец

**Николай** — фитнес-тренер, Бали
