# Синхронизация с Claude — текущий статус проекта

**Дата обновления:** 16 марта 2026  
**Назначение:** при открытии проекта в Claude.ai или Cursor скопировать этот файл в контекст, чтобы понимать, на каком этапе проект и как двигаться дальше.

**Правила для AI:** при любом изменении кода указывать разделы [1]–[7] и контур (Master/Supabase или Mark/GAS). Полные правила: **docs/cursorrules_v2.1.md** (Cursor), **docs/CLAUDE_RULES_V2.1.md** (Claude).

---

## Текущий этап: Миграция на Supabase — проверка и интеграция трекера

| Этап | Статус | Описание |
|------|--------|----------|
| Подготовка Supabase | ✅ | Проект, схема, RLS, auth, миграция данных |
| Вход + дашборд master | ✅ | login.html, dashboard — Supabase |
| Локальная проверка | ✅ | Live Server, вход и дашборд работают |
| Трекер тренера | ✅ | Подключён к Supabase (tracker-supabase.js) |
| Доработка дашборда | ✅ | muscleLoad, exerciseProgress, allRecords — реализованы |
| Context7 MCP | ✅ | Настроен (.cursor/mcp.json), нужен API ключ |
| Дашборд/программа Марка | 📋 | Пока GAS |

---

## 7 разделов системы (при изменениях — указывать затронутые)

| Раздел | Описание |
|--------|----------|
| [1] FRONTEND | Интерфейс (HTML, CSS, JS) |
| [2] BACKEND | Supabase / GAS |
| [3] DATABASE | Supabase PostgreSQL / Google Sheets |
| [4] AUTHENTICATION | Supabase Auth |
| [5] PAYMENTS | Не реализовано |
| [6] SECURITY | RLS, шифрование |
| [7] INFRASTRUCTURE | Netlify, Supabase, GitHub |

**Два контура:** **Master (Supabase)** — login, dashboard, tracker (миграция). **Mark (GAS)** — дашборд Марка, программа тренировок.

---

## Где мы сейчас (одним абзацем)

Миграция Master на Supabase завершена: вход, дашборд, трекер и кабинет тренера подключены к Supabase. Кабинет тренера реализован (список клиентов, карточка с 6 вкладками, управление видимостью дашборда клиента). Edge Function parse-workout задеплоена. Текущий фокус: стабилизация (тестирование Unified Tracker v4.4, фикс багов по фидбеку Ярослава и Кирилла), онбординг (тест на Алене), партнёрская программа. Дашборд и программа Марка пока на GAS. Для локальной проверки: `npx serve deploy/master -l 3000` или Live Server — см. раздел «Как запустить сервер».

---

## Что уже сделано

| Область | Статус | Детали |
|--------|--------|--------|
| Supabase проект | ✅ | Создан, миграции применены (схема, RLS, auth_id у trainers) |
| Данные в Supabase | ✅ | Тренер, клиенты, упражнения, programs, training_blocks, workout_sessions, daily_logs (миграция через GAS MigrateToSupabase.gs) |
| Авторизация | ✅ | Supabase Auth (email/password), тренер привязан к auth.users через auth_id |
| Master: вход | ✅ | deploy/master/login.html — вход по Supabase, редирект на дашборд |
| Master: дашборд | ✅ | deploy/master/dashboard — после входа список клиентов из Supabase, выбор клиента → данные (блок, тренировки, неделя) из Supabase |
| Марк в списке клиентов | ✅ | Скрипт ensure_mark_dashboard.sql выполнен — Марк в clients с программой и блоком |
| Master: трекер | ✅ | tracker-supabase.js — все actions (startSession, addSet, finishSession и т.д.) ходят в Supabase |
| Кабинет тренера | ✅ | deploy/master/cabinet/ — список клиентов (index.html), карточка клиента (client.html) с 6 вкладками: Обзор, Тренировки, Тело и здоровье, Питание, Календарь, Дашборд клиента; управление видимостью блоков дашборда (client_dashboard_settings) |
| Edge Function parse-workout | ✅ | Деплой выполнен, AI-парсинг текста тренировки |
| Документация первого запуска | ✅ | supabase/ИНСТРУКЦИЯ_ПЕРВЫЙ_РАЗ.md, supabase/TESTING_FIRST_TIME.md, DATA_RESTORE_AND_MARK.md |
| Pre-commit и тесты | ✅ | Husky + lint-staged (ESLint, Prettier для staged файлов), npm test в .husky/pre-commit; tests/recognition.test.js — тесты распознавания упражнений |
| Документация по мышечной нагрузке | ✅ | docs/MUSCLE_LOAD_LOGIC.md — зафиксирована текущая логика категорий упражнений, muscle_coefficients и распределения нагрузки без изменений кода |

---

## Где застряли

- Ожидают внимания: баги по фидбеку Ярослава и Кирилла; тестирование онбординга на Алене.
- Если `npx`/`python` не найден — см. раздел «Как запустить сервер» (Live Server, Node.js или Python).

---

## Как запустить сервер

### Вариант 1: Live Server (рекомендуется, без установки)

Если используешь **Cursor** или **VS Code**:

1. Установи расширение **Live Server** (поиск: "Live Server" от Ritwick Dey).
2. В проводнике (Explorer) правый клик по `deploy/master/login.html` → **Open with Live Server**.
3. Браузер откроется на `http://127.0.0.1:5500/deploy/master/login.html` (порт может отличаться). Если корень — другая папка, открой `login.html` из `deploy/master/` через Live Server — важно, чтобы корень раздачи был `deploy/master` или выше.

### Вариант 2: Установить Node.js (навсегда)

1. Скачай LTS с https://nodejs.org, установи.
2. Перезапусти терминал (или Cursor).
3. Из корня проекта:
   ```powershell
   npx serve deploy/master -l 3000
   ```
4. Открой **http://localhost:3000/login.html**.

### Вариант 3: Установить Python

1. Скачай с https://python.org, при установке отметь **Add Python to PATH**.
2. Перезапусти терминал.
3. ```powershell
   cd deploy\master
   python -m http.server 3000
   ```
4. Открой **http://localhost:3000/login.html**.

### Вариант 4: PHP (если уже установлен)

```powershell
cd deploy\master
php -S localhost:3000
```

---

## Следующие шаги (приоритет)

**Роадмап:** приоритет «единая система для текущих клиентов» (без масштабирования до полного внедрения у себя) — [docs/ROADMAP_REFERENCE_ARCHITECTURE.md](ROADMAP_REFERENCE_ARCHITECTURE.md).

### Ближайшие (сейчас)

| # | Задача | Действие |
|---|--------|----------|
| 1 | **Стабилизация трекера** | Тестирование Unified Tracker v4.4 (2 недели), фикс багов по фидбеку Ярослава и Кирилла. |
| 2 | **Онбординг** | Завершить тест на Алене (Google Form → Assessment), автозаполнение Goals из формы. |
| 3 | **Марк** | Продолжить тестирование (День 41/90). |

### Средний срок (единый контур)

| # | Задача | Детали |
|---|--------|--------|
| 4 | **Дашборд Марка** | deploy/mark/dashboard — перевести на Supabase (единый контур с остальными клиентами). |
| 5 | **Программа Марка** | deploy/mark/program — перенести на Supabase (план на день, логирование в той же БД). |

### Отложено (после внедрения у себя)

- Партнёрская программа, другие тренеры, биллинг, новые интеграции — см. [ROADMAP_REFERENCE_ARCHITECTURE.md](ROADMAP_REFERENCE_ARCHITECTURE.md).
- Постепенный отказ от GAS для Master: уже сделано; для Марка — после переноса дашборда и программы.

---

## Два контура данных (важно для архитектуры)

- **Master (тренер + офлайн-клиенты):** вход, дашборд и трекер на Supabase. Оценка (assessment) — в процессе интеграции.
- **Марк:** отдельный дашборд (Master API, clientId=1) + отдельная «Программа» (свой GAS/таблица). В master-дашборде Марк отображается как клиент из Supabase (ensure_mark_dashboard.sql).

---

## Ключевые файлы для контекста

| Файл | Зачем |
|------|--------|
| **docs/cursorrules_v2.1.md** | Правила для Cursor: 7 разделов, 2 контура, формат ответов, безопасность |
| **docs/CLAUDE_RULES_V2.1.md** | Правила для Claude: детали разделов, health check, быстрые команды |
| docs/SYNC_STATUS.md | Текущий статус (этот файл) |
| docs/CURRENT_STATE_v5.md | Общее состояние проекта (GAS, API, тестирование) |
| supabase/ИНСТРУКЦИЯ_ПЕРВЫЙ_РАЗ.md | Пошаговый первый запуск, архитектура Марка vs офлайн |
| supabase/TESTING_FIRST_TIME.md | Тестирование входа и дашборда |
| supabase/DATA_RESTORE_AND_MARK.md | Восстановление данных Кирилла/Ярослава и Марка |
| supabase/FRONTEND_INTEGRATION.md | Интеграция фронта с Supabase |
| docs/ROADMAP_NEXT_STEPS.md | Фазы и следующие шаги по миграции |
| docs/ROADMAP_REFERENCE_ARCHITECTURE.md | Приоритет «единая система», план до масштабирования |
| docs/GIT_WORKFLOW.md | Когда и как коммитить, скрипт git-push.ps1 |
| docs/CONTEXT7_SETUP.md | Настройка Context7 MCP |
| docs/DASHBOARD_UPGRADE_PLAN.md | План muscleLoad, exerciseProgress |

---

## Что скопировать в Claude.ai при новом диалоге

Кратко: «Проект fitness-coach-system. Миграция Master на Supabase завершена (вход, дашборд, трекер, кабинет). Фокус: стабилизация, онбординг (Алена), единый контур Марка. Роадмап: docs/ROADMAP_REFERENCE_ARCHITECTURE.md. docs/SYNC_STATUS.md — статус, docs/CLAUDE_RULES_V2.1.md — правила.»

Либо приложить/вставить содержимое этого файла (SYNC_STATUS.md) в начало диалога. Для полных правил работы с системой приложи также **docs/CLAUDE_RULES_V2.1.md**.
