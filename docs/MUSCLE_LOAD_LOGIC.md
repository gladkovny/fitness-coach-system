# Логика мышечной нагрузки — fitness-coach-system

Документ описывает текущую реализацию трёх связанных подсистем: категории упражнений, коэффициенты мышечной нагрузки (muscle coefficients) и распределение нагрузки по телу. Код не менялся — только чтение и фиксация фактов.

---

## 1. Категории упражнений

### Где хранится список

- **Google Apps Script (GAS), офлайн-клиенты**: лист **`exercises_master`** в таблице Master API. Колонки включают `id`, `name`, **`category`**, **`subcategory`**, `type`, `equipment`, `videoUrl`, `notes`, а также колонки для мышц (см. раздел 2).
  - Ссылка: `gas/Master_API.gs` — `getExercises()` читает лист `exercises_master` (стр. 1450–1451), колонки задаются через `findColumns(..., category: ['category'], subcategory: ['subcategory'])`.
- **Supabase (CRM / трекер / кабинет)**: таблица **`exercises`** — поля `category TEXT`, `subcategory TEXT` (схема в `supabase/migrations/00001_initial_schema.sql`, стр. 45–46).
- Отдельного «справочника» категорий в коде нет: список категорий строится как уникальные значения из данных (например, в GAS: `const categories = [...new Set(exercises.map(e => e.category).filter(Boolean))]` — стр. 1535).

### Как присваиваются

- **GAS**: вручную при добавлении/редактировании строки на листе `exercises_master`. Функция `addExercise(data)` (стр. 1542 и далее) записывает `data.category` и `data.subcategory` в соответствующие колонки, если они есть в заголовках.
- **Supabase**: при создании/обновлении записи в `exercises` через API или UI. Сид и миграции задают категории при первичном заполнении (например, `00005_seed_exercises.sql` вставляет `category`, `subcategory` из seed-данных). Далее — ручное редактирование или логика приложения (например, AI-парсер в трекере подставляет категорию при разборе текста).
- **Трекер** (`deploy/master/tracker/index.html`): при разборе упражнения из текста или выборе из базы подставляется `category` (например, `dbEx.category || ex.category || 'Другое'`, стр. 4129, 4142; по умолчанию «Другое» во многих местах).

### Иерархия

- Иерархия **плоская**: два независимых поля — **категория** и **подкатегория** (category → subcategory). Отдельной древовидной структуры «категория → подкатегория» в коде нет; подкатегория используется как уточнение (например, «Спина» → «Широчайшие», «Плечи» → «Средняя дельта»).
- В кабинете и миграциях логика fallback для коэффициентов опирается на оба поля: сначала проверяется `subcategory`, затем `category` (см. `cabinet-workouts.js`, `getDefaultCoeffsByCategory(category, subcategory, name)` — стр. 33–97; миграции `00006`, `00007` — `e.category ILIKE ...` и `e.subcategory ILIKE ...`).

### Файлы

| Место | Файлы |
|-------|--------|
| GAS | `gas/Master_API.gs` — getExercises, addExercise, лист exercises_master |
| Supabase | `supabase/migrations/00001_initial_schema.sql`, `00005_seed_exercises.sql` |
| Трекер | `deploy/master/tracker/index.html` — подстановка category при разборе/выборе упражнения |
| Кабинет | `deploy/master/cabinet/js/cabinet-workouts.js` — getDefaultCoeffsByCategory(category, subcategory, name) |
| Дашборд | `deploy/master/dashboard/index.html` — getCoeffs(ex) с опорой на ex.category |

---

## 2. Muscle Coefficients (задействованные мышцы)

### Где хранятся

- **GAS**: тот же лист **`exercises_master`**. В первой строке — заголовки; кроме `id`, `name`, `category`, `subcategory` и т.д. есть колонки с именами мышц (список задаётся константой **`MUSCLE_COLUMNS`** в `Master_API.gs`, стр. 5286–5292; в репозитории значения заменены на `'key'` — см. раздел 4). Функция **`getExerciseMuscleCoefficients()`** (стр. 4453–4516) читает лист и возвращает объект `{ [exerciseId]: { [muscleKey]: number } }`.
- **Supabase**: таблица **`exercises`**, поле **`muscle_coefficients JSONB DEFAULT '{}'`** (схема — `00001_initial_schema.sql`, стр. 47). Пример: `{"chest": 0.8, "front_delt": 0.15, "triceps": 0.05}`.

### Структура данных

- **Ключи мышц**: в GAS и в Supabase-миграциях используются английские ключи: `chest`, `lats`, `traps`, `low_back`, `front_delt`, `mid_delt`, `rear_delt`, `biceps`, `triceps`, `quads`, `hamstrings`, `glutes`, `calves`, `core`. В `getExerciseMuscleCoefficients()` есть маппинг русских названий колонок в эти ключи (стр. 4463–4481, например `'lower back': 'low_back'`).
- **Значения**: числа с плавающей точкой, по смыслу **доли от 0 до 1** (в сумме по упражнению могут быть ≤ 1 или чуть больше). В коде везде используются только значения `> 0` (например, `if (val > 0) coefficients[enKey] = val` — стр. 4503).

### Как назначаются

1. **Вручную**: в таблице `exercises_master` (GAS) — заполнение колонок мышц; в Supabase — обновление `exercises.muscle_coefficients` через админку/API.
2. **Автоматически по категории/подкатегории/имени**:  
   - В **Supabase**: миграции **`00006_exercise_muscle_coefficients.sql`** и **`00007_refill_muscle_coefficients.sql`** заполняют `muscle_coefficients` по правилам `CASE WHEN e.category ILIKE ... OR e.subcategory ILIKE ... OR e.name ILIKE ...`.  
   - В **GAS** (getDashboardMuscleLoadGrouped): если в `exercises_master` нет коэффициентов для упражнения, используется fallback **categoryToMuscles** (категория → объект мышц, стр. 4830–4847) и при необходимости **getCoeffsByName(exerciseName)** — подбор по ключевым словам в названии (стр. 4850–4941).  
   - В **кабинете** и **дашборде**: при отсутствии `muscle_coefficients` у упражнения — **getDefaultCoeffsByCategory** / **CATEGORY_TO_MUSCLES** + **NAME_KEYWORDS** (см. cabinet-workouts.js, dashboard index.html).
3. **defaultCoeffs и «fuzzy» по имени**: в GAS функция **aiDetermineExerciseForMuscle(name)** (стр. 5724–5835) использует объект **patterns** с полями `keywords` и **defaultCoeffs** по категориям; по совпадению ключевых слов в названии возвращается соответствующий объект коэффициентов. В репозитории части строк заменены на `'key'` (см. раздел 4). В **трекере** аналог — **generateDefaultCoeffs(category, subcategory)** (стр. 5737–5780) с фиксированными объектами по подкатегории и категории (русские названия мышц: Грудь, Широчайшие, Квадрицепс и т.д.).

### EXPLICIT_EXERCISE_RULES

- Отдельной константы с именем **EXPLICIT_EXERCISE_RULES** в репозитории не найдено. Явные правила заданы в виде:  
  - маппинга категория/подкатегория → коэффициенты в GAS (categoryToMuscles, getCoeffsByName),  
  - CASE WHEN в SQL (00006, 00007),  
  - объектов **patterns** / **subcatDefaults** / **defaults** в aiDetermineExerciseForMuscle и generateDefaultCoeffs.

### Файлы

| Назначение | Файлы |
|------------|--------|
| Загрузка коэффициентов из листа | `gas/Master_API.gs` — getExerciseMuscleCoefficients, MUSCLE_COLUMNS, getExercisesMaster (coeffs в объекте упражнения) |
| Fallback по категории/имени (GAS) | `gas/Master_API.gs` — getDashboardMuscleLoadGrouped (categoryToMuscles, getCoeffsByName), aiDetermineExerciseForMuscle |
| БД и авто-заполнение | `supabase/migrations/00006_exercise_muscle_coefficients.sql`, `00007_refill_muscle_coefficients.sql` |
| Кабинет | `deploy/master/cabinet/js/cabinet-workouts.js` — getLoadCoeffs, getDefaultCoeffsByCategory, MUSCLE_LABELS, RUS_TO_ENG_MUSCLE |
| Дашборд | `deploy/master/dashboard/index.html` — getCoeffs, CATEGORY_TO_MUSCLES, NAME_KEYWORDS, computeMuscleLoad |
| Трекер | `deploy/master/tracker/index.html` — getExerciseCoeffs, generateDefaultCoeffs, MUSCLE_GROUPS (русские названия) |
| API упражнений (Supabase) | `deploy/master/js/tracker-supabase.js` — getExercisesSupabase (возвращает muscle_coefficients) |

---

## 3. Распределение нагрузки по телу — алгоритм

### Откуда берутся данные

- **Вариант на GAS (офлайн-клиенты)**: лист **WorkoutLog** в клиентской таблице. Колонки включают sessionId, exerciseId, exerciseName, category, weight, reps, setType, а в варианте v6.6 также **muscleCoeffs** и **muscleLoad** (сохранённые при вызове saveWorkoutWithCoeffs). Если этих колонок нет или они пусты — коэффициенты подставляются при расчёте из exercises_master (getExerciseMuscleCoefficients) и fallback по category/имени.
- **Вариант на Supabase**: таблица **workout_sets** (session_id, exercise_id, exercise_name, reps, weight) и джойн с **exercises** (id, name, category, muscle_coefficients). Отдельных колонок muscle_load/muscle_coeffs в workout_sets нет — нагрузка считается на лету по коэффициентам из exercises.

### Формулы

- Для каждого **сета** (одна строка лога/workout_sets):  
  - `volume = weight * reps` (тоннаж сета).  
  - По каждой мышце с коэффициентом `coeff`:  
    - **«Подходы» (sets)**: вклад в группу мышц как `coeff` (один сет даёт дробное число «эквивалентных подходов» по мышцам): `muscleSets[muscle] += coeff` (GAS, стр. 5014–5015; в других местах аналогично).  
    - **Объём по мышце**: `muscleVolume[muscle] += weight * reps * coeff` (GAS стр. 5015; трекер: `load[muscle] = (load[muscle] || 0) + weight * reps * coeff` — стр. 5786).
- Итоги по **группам** (legs, back, chest, arms, core): сумма по входящим в группу мышцам (например, legs: quads, hamstrings, glutes, calves). Результат округляется (например, sets до одного знака, volume до целого).

### Где считается и отображается

- **GAS**:  
  - **getDashboardMuscleHeatmap(ss, blockId)** — тепловая карта по мышцам (sets, volume) за блок, стр. 4344–4446.  
  - **getDashboardMuscleLoadGrouped(ss, period, currentBlockId)** — распределение по группам за период (block/3m/all), стр. 4816–5059.  
  - **getDashboardMuscleLoadGroupedV2(clientId, period)** — то же по периодам, но читает уже сохранённые в WorkoutLog поля muscleLoad/muscleCoeffs; при их отсутствии вызывает aiDetermineExerciseForMuscle и считает load по weight*reps*coeff (стр. 5544–5704).
- **Дашборд** (Supabase): `deploy/master/dashboard/index.html` — загрузка `workout_sets` с join на `exercises`, затем **computeMuscleLoad(allSets, exById, sessionDateMap)** (стр. 965–1006): для каждого сета берутся коэффициенты через getCoeffs(ex), затем по мышцам накапливаются sets и привязка к группам (muscleToGroup). Блок «НАГРУЗКА» рендерит группы и мышцы (стр. 1477–1591). Маппинг мышц → группы и описание групп для отображения см. в подразделе ниже.
- **Кабинет тренера**: `deploy/master/cabinet/js/cabinet-workouts.js` — по сессиям и сетам считаются мышечные итоги (muscleTotal, muscleByWeek) через getLoadCoeffs(ex) и вывод таблицы по мышцам/неделям (стр. 336–382, 439, 454). В `deploy/master/cabinet/index.html` — запрос упражнений с `muscle_coefficients`, расчёт по группам (CABINET_MUSCLE_TO_GROUP) и таблица «Группа мышц / Подходов» (стр. 1198–1332).
- **Трекер**: при вводе/выборе упражнения показывается превью нагрузки (**renderMuscleLoadPreview**) и при необходимости редактор коэффициентов (слайдеры/инпуты, redistributeCoeffs). Расчёт для превью: **calcMuscleLoad(coeffs, weight, reps)** (стр. 5783–5790). Коэффициенты для отображения: из БД (muscleCoeffs) или generateDefaultCoeffs(category, subcategory).

### Маппинг мышц в дашборде клиента (muscleToGroup и groupDefs)

В дашборде клиента (`deploy/master/dashboard/index.html`) распределение нагрузки по группам опирается на два объекта:

1. **muscleToGroup** (стр. 973–987) — сопоставление **ключа мышцы** (из `muscle_coefficients`) **→ группа** для расчёта. Используется внутри **computeMuscleLoad**: по каждому ключу из коэффициентов определяется группа, в которую накапливаются sets.

   ```text
   quads, hamstrings, glutes, calves → 'legs'
   lats, traps, low_back → 'back'
   chest → 'chest'
   biceps, triceps, front_delt, mid_delt, rear_delt → 'arms'
   core → 'core'
   ```

   Если ключа нет в `muscleToGroup`, вклад этого сета по данной мышце не учитывается (`if (!g) return;`).

2. **groupDefs** (стр. 1492–1538) — описание групп **для отображения** в блоке «НАГРУЗКА»: название группы, иконка, цвет, список мышц группы и **labels** (ключ мышцы → подпись на русском). Порядок и состав групп должны совпадать с тем, что задаёт muscleToGroup (legs, back, chest, arms, core).

   Пример одной группы:
   - `legs`: name `'Ноги'`, muscles `['quads', 'hamstrings', 'glutes', 'calves']`, labels `{ quads: 'Квадрицепс', hamstrings: 'Бицепс бедра', glutes: 'Ягодицы', calves: 'Икры' }`.

   Итоговая структура по группам (totalSets, muscleData по ключам мышц) из **computeMuscleLoad** подставляется в **groupDefs** при рендере (стр. 1543–1554): для каждой группы выводятся название, полоска по totalSets и детализация по мышцам (group.muscles + group.muscleData[m].sets).

Отдельной функции с именем «muscleMapping» в дашборде нет — маппинг реализован этими двумя константами (muscleToGroup для расчёта, groupDefs для UI).

### Цепочка данных (кратко)

- **workout_log (GAS)** или **workout_sets (Supabase)** → по каждой записи: exerciseId/ exercise_id + exercise_name → получение коэффициентов (exercises_master / exercises.muscle_coefficients или fallback по category/имени) → для каждого сета: sets += coeff, volume += weight*reps*coeff по мышцам → агрегация по группам мышц → отображение в дашборде/кабинете/трекере.

---

## 4. Известные проблемы и TODO

- **Замазанные строки в GAS**: в `Master_API.gs` часть русских текстов и ключей заменена на `'key'` (в т.ч. MUSCLE_COLUMNS, categoryToMuscles, getCoeffsByName, aiDetermineExerciseForMuscle, defaultCoeffs/keywords в patterns). Восстановление логики для переноса или синхронизации нужно делать по смыслу или по резервной копии с полными строками.
- **Два набора названий мышц**: в GAS, дашборде и cabinet-workouts используются **английские** ключи (chest, lats, quads, …); в **трекере** — **русские** (Грудь, Широчайшие, Квадрицепс, Кор и т.д.). В cabinet-workouts есть маппинг **RUS_TO_ENG_MUSCLE** для нормализации ключей из БД (стр. 133–162). При синхронизации с Telegram_Mini_App нужно договориться об одном формате (например, английские ключи в БД и маппинг для отображения).
- **WorkoutLog vs workout_sets**: в GAS по клиенту используется лист WorkoutLog с опциональными колонками muscleCoeffs, muscleLoad; в Supabase в workout_sets этих полей нет, расчёт только по exercises.muscle_coefficients. При миграции данных (migrateWorkoutLogData) коэффициенты подставляются из getExercisesMaster при записи.
- **Кэш exercises_master (GAS)**: getExercisesMaster кэширует результат в CacheService на 21600 секунд (6 часов). После обновления листа нужно вызывать **clearExercisesMasterCache** (action в API), иначе старые коэффициенты будут отдаваться до сброса кэша.
- Явных TODO/FIXME в коде по этой логике в репозитории не отмечено; ограничения выше выведены из анализа кода.

---

## 5. Связь с Telegram_Mini_App

- **Общая база**: по `CLAUDE.md` и миграциям, **таблица `exercises` в Supabase** — общая для fitness-coach-system (CRM, дашборд, трекер, кабинет) и для Telegram_Mini_App (@fitprogabot). Поля `category`, `subcategory`, `muscle_coefficients` доступны и боту, и Mini App при чтении упражнений.
- **Что уже есть в системе**: в CRM/трекере/кабинете реализованы категории, коэффициенты и распределение нагрузки (источники — Supabase exercises + workout_sets или GAS exercises_master + WorkoutLog). В Mini App/боте в текущем описании проекта (CLAUDE.md) акцент на программах тренировок и отчётах; отдельного блока «распределение нагрузки по телу» для клиента/тренера в боте не описано.
- **Что имеет смысл перенести/синхронизировать**:  
  - Использовать в боте/Mini App те же **category/subcategory** и **muscle_coefficients** из таблицы `exercises` при отображении упражнений и при необходимости при расчёте нагрузки по отчётам.  
  - Если в Mini App или отчётах появятся «подходы × вес × reps», можно применять ту же формулу (volume = weight×reps, вклад по мышце = volume×coeff) и тот же набор ключей мышц (рекомендуется английские в БД + маппинг для локализации).  
  - Логику fallback (по категории/подкатегории/имени) можно взять из cabinet-workouts.js (getDefaultCoeffsByCategory) или из миграций 00006/00007, чтобы новые упражнения, добавленные через бота без явных коэффициентов, получали разумные коэффициенты при расчётах в CRM.

---

*Документ составлен по состоянию репозитория fitness-coach-system без внесения изменений в код.*
