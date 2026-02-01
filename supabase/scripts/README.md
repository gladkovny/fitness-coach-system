# Скрипты переноса данных Google Sheets → Supabase

Есть **три способа**. Если нет доступа к Google Cloud Console (например, нет номера для регистрации) — используй **вариант A (миграция из GAS)** или **вариант B (CSV)**.

---

## Вариант A: Миграция из Google Apps Script (без Google Cloud и без номера)

Данные переносятся **прямо из твоего текущего GAS-проекта**: он уже имеет доступ ко всем таблицам. Ни Google Cloud Console, ни Service Account, ни номер телефона не нужны.

### Шаг 1: Добавить файл миграции в проект GAS (подробно)

Речь идёт о **том же проекте Apps Script**, который привязан к твоей таблице Coach Master (та, где листы Clients, exercises_master, Settings). В этом проекте уже есть файл с Master API. Нужно добавить в него ещё один файл с кодом миграции.

#### 1.1. Открыть редактор Apps Script

- Открой в браузере **таблицу Coach Master** (Google Таблицы).
- В меню выбери: **Расширения** → **Apps Script**.  
  Откроется редактор скриптов. В левой колонке будут файлы проекта (например `Master API_assessment.gs` или `Code.gs`). Это и есть «тот же проект».

#### 1.2. Создать новый файл скрипта

- В левой панели нажми **+** рядом с надписью «Файлы» (или меню **Файл** → **Создать** → **Файл**).
- Введи имя файла, например: **MigrateToSupabase** (расширение `.gs` добавится само).
- Нажми **Создать** / Enter. Откроется пустой редактор этого файла.

#### 1.3. Вставить код миграции

- На компьютере открой файл проекта **gas/MigrateToSupabase.gs** (в Cursor или в проводнике: папка `fitness-coach-system` → `gas` → `MigrateToSupabase.gs`).
- Выдели **весь** текст в файле (Ctrl+A) и скопируй (Ctrl+C).
- Вернись в браузер, в открытый пустой файл **MigrateToSupabase.gs** в редакторе Apps Script.
- Вставь скопированный код (Ctrl+V).
- Сохрани проект: **Файл** → **Сохранить** или Ctrl+S.

#### 1.4. Зачем именно этот проект

Миграция вызывает функции `findColumns` и `formatDate` — они объявлены в файле **Master API_assessment.gs**. В Google Apps Script все файлы в одном проекте видят друг друга, поэтому MigrateToSupabase должен лежать **в том же проекте**, что и Master API. Тогда при запуске `migrateToSupabase()` эти функции будут доступны.

**Итог шага 1:** в проекте Apps Script есть два файла (или больше): Master API и MigrateToSupabase с вставленным кодом. Дальше — настройка свойств и запуск.

---

### Шаг 2: Настроить свойства скрипта

1. **Открой настройки проекта**  
   Слева в панели нажми иконку **шестерёнки** (под блоком «Сервисы») — откроется страница **Настройки проекта**.

2. **Перейди к свойствам скрипта**  
   Прокрути страницу вниз до раздела **«Свойства скрипта»** (Script properties). Не путай с «Переменными проекта».

3. **Добавь три свойства**  
   Нажми **«Добавить свойство скрипта»** (или «Add script property»). Для каждого свойства укажи **Ключ** и **Значение**, затем снова «Добавить свойство скрипта» для следующего:

   | Ключ (имя свойства) | Значение (откуда взять) |
   |--------------------|-------------------------|
   | `SUPABASE_URL` | `https://ТВОЙ_ПРОЕКТ.supabase.co` — скопируй из Supabase: **Settings → API → Project URL** |
   | `SUPABASE_SERVICE_ROLE_KEY` | Длинный ключ **service_role** (Secret) — в Supabase: **Settings → API** → секция **Project API keys** → **service_role** → Reveal и копируй |
   | `MIGRATION_TRAINER_EMAIL` | Email тренера (тот, что в листе Clients в строке тренера). Строка с этим email попадёт в таблицу `trainers`, остальные — в `clients` |

4. **Сохрани**  
   После ввода всех трёх закрой страницу настроек или просто вернись к редактору — свойства сохраняются автоматически.

**Важно:** ключ `SUPABASE_SERVICE_ROLE_KEY` даёт полный доступ к проекту Supabase. Никому не передавай его и не публикуй; в GAS он хранится только в свойствах скрипта и виден только тебе.

### Шаг 3: Запустить миграцию

В редакторе выбери в выпадающем списке функцию **migrateToSupabase** и нажми **Выполнить** (▶). Полный перенос за один запуск.

Если данных много и срабатывает лимит времени (~6 минут), можно запускать по шагам:

- `migrateToSupabase('trainers')` — только тренер
- `migrateToSupabase('clients')` — только клиенты
- `migrateToSupabase('exercises')` — только упражнения
- `migrateToSupabase()` без аргумента — программы, блоки, сессии, подходы, daily по всем клиентам (после того как тренер и клиенты уже перенесены).

**Итог:** один раз настроил свойства и запустил функцию — данные уходят в Supabase.

---

## Вариант B: Экспорт в CSV + загрузка (без Google API)

Если не хочешь трогать GAS:

1. В каждой нужной таблице Google Sheets: открой лист (Clients, exercises_master, Daily и т.д.) → **Файл → Скачать → CSV**.
2. Положи CSV в папку, например `supabase/scripts/csv_export/` (подпапки по листам: `Clients.csv`, `exercises_master.csv`, по клиентам — `client_ID/Daily.csv` и т.д.).
3. Можно добавить отдельный скрипт `migrate-from-csv.js`, который читает эти CSV и вставляет в Supabase (аналогично `migrate.js`, но источник — локальные файлы). Такой скрипт при необходимости можно описать отдельно.

Минус: экспорт вручную по каждому листу; плюс: не нужен ни Google Cloud, ни GAS.

---

## Вариант C: Node.js + Google Cloud (Service Account)

Полностью автоматический перенос с одного запуска `npm run migrate`, но нужны проект в Google Cloud и Service Account (для регистрации в Google Cloud может потребоваться номер телефона).

### Что нужно один раз

### 1. Google Cloud: Service Account

1. Зайди в [Google Cloud Console](https://console.cloud.google.com/) → выбери или создай проект.
2. **APIs & Services → Library** → найди **Google Sheets API** → **Enable**.
3. **APIs & Services → Credentials → Create Credentials → Service account**.
4. Дай имя (например `migrate-sheets`), создай. Открой сервисный аккаунт → вкладка **Keys** → **Add key → Create new key → JSON** — скачай файл.
5. Положи JSON в `supabase/scripts/google-credentials.json` (или другой путь) и **добавь этот файл в .gitignore**.
6. Открой каждую нужную таблицу в Google Sheets:
   - Coach Master (таблица с листами Clients, exercises_master, Settings);
   - таблицу каждого клиента (её ID берётся из листа Clients, колонка spreadsheetId).
   В каждой: **Поделиться** → добавь email сервисного аккаунта (из JSON, поле `client_email`) с правом **Читатель**.

### 2. Конфиг миграции (для варианта C)

1. Скопируй `config.sample.json` в `config.json`:
   ```bash
   cp config.sample.json config.json
   ```
2. В `config.json` укажи:
   - **coachMasterSpreadsheetId** — ID таблицы Coach Master (из URL: `https://docs.google.com/spreadsheets/d/ЭТОТ_ID/edit`).
   - **trainerEmail** — email тренера (строка в Clients с этим email считается тренером и попадёт в `trainers`; остальные — в `clients`).

### 3. Переменные окружения (для варианта C)

В корне `supabase/` уже есть `.env` с `SUPABASE_URL` и `SUPABASE_SERVICE_ROLE_KEY`. Скрипт подхватывает его из `../.env` (относительно папки `scripts/`).

Дополнительно для Google:
- **GOOGLE_APPLICATION_CREDENTIALS** — путь к JSON ключа сервисного аккаунта, например: `./google-credentials.json`.

Пример запуска с указанием ключа:
```bash
cd supabase/scripts
set GOOGLE_APPLICATION_CREDENTIALS=./google-credentials.json
npm install
npm run migrate
```

---

## Запуск

```bash
cd supabase/scripts
npm install
npm run migrate
```

Режим «сухой прогон» (только чтение Sheets, без записи в Supabase):
```bash
npm run migrate:dry
```
(на Windows: `set DRY_RUN=1` и `node migrate.js`)

---

## Порядок переноса (автоматически)

1. **Coach Master / Clients** → тренер (строка с trainerEmail или без spreadsheetId) → `trainers`; остальные → `clients` с `trainer_id`.
2. **Coach Master / exercises_master** → `exercises` (trainer_id = NULL для общей базы).
3. Для каждого клиента (по spreadsheetId из Clients):
   - **Goals** → при необходимости `programs`.
   - **TrainingBlocks** → `training_blocks` (связь с program).
   - **WorkoutSessions** → `workout_sessions`.
   - **WorkoutLog** → `workout_sets` (связь session_id, exercise по имени/id).
   - **Daily** → `daily_logs`.
   - **ActualNutrition** (если есть) → `nutrition_logs` (базовый маппинг).
4. **Settings** Coach Master → `trainers.settings` (JSONB).

Подробный маппинг листов и таблиц — в [../MIGRATION_PLAN.md](../MIGRATION_PLAN.md).

---

## Backfill exercise_name (если всё ещё «все в Кор»)

Если после миграции в дашборде НАГРУЗКА показывает все подходы в «Кор», а названия упражнений в истории — «Упражнение», значит в `workout_sets` много записей с `exercise_id = null`. Скрипт **backfill-exercise-names.js** заполняет колонку `exercise_name` из WorkoutLog в Google Sheets.

**Требования:** миграция **00008** выполнена (колонка `exercise_name` добавлена), настроены .env, config.json, GOOGLE_APPLICATION_CREDENTIALS (как для варианта C).

```bash
cd supabase/scripts
node backfill-exercise-names.js
```

Скрипт читает WorkoutLog из таблиц клиентов, матчит по дате сессии и порядку подходов, обновляет `exercise_name` для записей с `exercise_id = null`.

---

## Backfill названий тренировок (type)

Если в модальном окне тренировки отображается только «Тренировка» вместо названия (Спина, Pull и т.п.), запусти скрипт для заполнения `workout_sessions.type` из листа WorkoutSessions (колонки splitType или type):

```bash
cd supabase/scripts
node backfill-session-names.js
```

Скрипт обновляет только записи с пустым `type`. Требования те же: .env, config.json, GOOGLE_APPLICATION_CREDENTIALS, доступ к таблицам клиентов.

---

## Backfill profile (weight, mainGoals) для клиентов

Для корректного расчёта интенсивности bodyweight-упражнений нужен вес клиента в `clients.profile.weight`. Скрипт **backfill-client-profile.js** заполняет `profile` из листа Goals таблиц клиентов:

```bash
cd supabase/scripts
node backfill-client-profile.js
```

Читает Clients с master для маппинга client→spreadsheetId, затем Goals каждого клиента. Обновляет `profile.weight`, `profile.startDate`, `profile.mainGoals`. Требования те же: .env, config.json, coachMasterSpreadsheetId, GOOGLE_APPLICATION_CREDENTIALS.

---

## Проверка после миграции

- В Supabase **Table Editor**: сравнить количество записей в `trainers`, `clients`, `exercises`, `workout_sessions`, `daily_logs` с ожидаемым.
- Убедиться, что нет «висячих» ссылок (все `client_id`, `trainer_id`, `program_id`, `block_id`, `session_id` указывают на существующие строки).
