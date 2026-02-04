# Восстановление базы упражнений, AI-парсера и оптимизация

**Дата:** 31 января 2026  
**Контекст:** Восстановить функционал из Sheets, улучшить систему, оценить варианты AI.

---

## Context7

**Использую ли я Context7?**  
Context7 настроен в проекте (`.cursor/mcp.json`), но **нет отдельного MCP‑инструмента** для его вызова в текущем наборе. По правилам проекта (CONTEXT7_SETUP.md) AI должен автоматически подтягивать документацию при задачах с Supabase, Chart.js и др.  

**Как включить:** Добавь в промпт фразу `use context7` для Supabase / Chart.js, чтобы подтянуть актуальную документацию.

---

## 1. План восстановления функционала

### Этап A: muscle_coefficients в exercises

| Задача | Детали |
|--------|--------|
| Расширить seed | Добавить `muscle_coefficients` для упражнений в `00005_seed_exercises.sql` |
| Формат JSONB | `{"chest": 0.8, "front_delt": 0.2}` для жима, `{"quads": 0.6, "glutes": 0.3, "hamstrings": 0.1}` для приседа и т.п. |
| Fallback | В дашборде: если `muscle_coefficients` пуст — маппинг по category/subcategory |

### Этап B: Дашборд — computeMuscleLoad, exerciseProgress, allRecords

По DASHBOARD_UPGRADE_PLAN.md — добавить в `loadDashboardFromSupabase`:
- `computeMuscleLoad()` — распределение подходов по мышцам
- `computeExerciseProgress()` — рост веса по упражнениям
- `computeAllRecords()` — персональные рекорды

### Этап C: Доп. поля в exercises (опционально)

| Поле | Назначение | Приоритет |
|------|------------|-----------|
| bodyweight_ratio | Расчёт веса для «свой вес» | Средний |
| laterality | bilateral / canBeUnilateral / alwaysUnilateral | Средний |
| equipment_options | Варианты оборудования (JSON array) | Низкий |
| position_options | Варианты позиций (JSON array) | Низкий |

---

## 2. AI для парсинга: варианты

| Вариант | Плюсы | Минусы | Стоимость |
|---------|-------|--------|-----------|
| **Gemini (текущий, GAS)** | Уже интегрирован, бесплатный tier | Зависимость от GAS, ключ в коде | Бесплатно (лимиты) |
| **Supabase Edge + Gemini** | Без GAS, секрет в env | Нужна настройка Edge Function | Бесплатно |
| **Supabase Edge + OpenAI GPT-4o-mini** | Хорошо под JSON, стабильный API | Платно (~$0.15/1M input) | ~$0.001 за тренировку |
| **Supabase Edge + Claude** | Качественный structured output | Платно | Аналогично OpenAI |
| **Улучшить локальный парсер** | Нет внешних вызовов, мгновенно | Не покрывает сложные случаи | Бесплатно |
| **Гибрид** | Локальный — основной, AI — fallback | Сложнее логика | Минимальные затраты |

### Рекомендация

**Кратко:** Гибрид: основной — локальный парсер, при необходимости — AI через Edge Function.

**Почему:**
1. Локальный парсер покрывает большинство форматов.
2. AI нужен только для нестандартного текста и опечаток.
3. Edge Function убирает зависимость от GAS.
4. Gemini бесплатный; GPT-4o-mini — при желании лучшего качества.

---

## 3. Архитектура AI-парсера

### Вариант 1: Supabase Edge + Gemini (рекомендуется)

```
Трекер → fetch(supabase.functions.invoke('parse-workout', { body: { text } }))
         → Edge Function → Gemini API → JSON
```

Плюсы: без GAS, ключ в `SUPABASE_SECRETS`, тот же Gemini.

### Вариант 2: Supabase Edge + OpenAI

То же, но вместо Gemini — `openai.chat.completions.create()` с `response_format: { type: "json_object" }`.

Плюсы: стабильный structured output, быстрый ответ.

### Вариант 3: Оставить GAS

Трекер вызывает `apiCall('parseWorkout')` → GAS → Gemini. Требует настроенный API URL в трекере.

Плюсы: без изменений, всё уже работает.

---

## 4. Оптимизации

| Область | Оптимизация |
|---------|-------------|
| **Запросы к Supabase** | Один запрос с join вместо нескольких: `workout_sets` + `exercises` + `workout_sessions` |
| **Кэш exercises** | Кэш в sessionStorage/LocalStorage (TTL 5–10 мин) при выборе клиента |
| **Локальный парсер** | Добавить паттерны из реальных тренировок, синонимы упражнений |
| **Lazy load** | Дашборд: muscleLoad/Progress только при переходе на вкладку |
| **Batch insert** | При сохранении тренировки — один `insert` с массивом sets вместо N вызовов |
| **Индексы** | `workout_sets(session_id)`, `workout_sessions(client_id, date)` — уже есть |

---

## 5. Порядок реализации

| # | Задача | Оценка | Статус |
|---|--------|--------|--------|
| 1 | muscle_coefficients в seed + fallback (00006) | 1–2 ч | ✅ Сделано |
| 2 | computeExerciseProgress, computeMuscleLoad, computeAllRecords | 2–3 ч | ✅ Сделано |
| 3 | Supabase Edge Function parse-workout (Gemini) | 2 ч | ✅ Создана |
| 4 | Трекер: parseWorkout через Edge | 0.5 ч | ✅ Сделано |
| 5 | Batch insert для workout_sets | 0.5 ч | Отложено |
| 6 | bodyweight_ratio, laterality | 1 ч | Отложено |

---

## 6. Развёртывание parse-workout (Edge Function)

```bash
# 1. Установить Supabase CLI (если нет)
# 2. supabase login

# 3. Секрет — API ключ Gemini
supabase secrets set GEMINI_API_KEY=твой_ключ

# 4. Деплой функции
supabase functions deploy parse-workout
```

Ключ Gemini: https://aistudio.google.com/app/apikey

---

## 7. Контрольные точки

- [ ] Миграция 00006 выполнена (muscle_coefficients)
- [ ] НАГРУЗКА в дашборде показывает группы мышц
- [ ] ПРОГРЕСС показывает рост по упражнениям
- [ ] РЕКОРДЫ показывает персональные рекорды
- [ ] parse-workout задеплоена, GEMINI_API_KEY задан
- [ ] Трекер распознаёт текст через Edge (без GAS API URL)
