# План доработки дашборда — восстановление данных после миграции на Supabase

**Цель:** Восстановить отображение данных, которые показывал дашборд до перехода на Supabase (GAS getOfflineDashboardV2).

**Контекст:** `deploy/master/dashboard/index.html` уже имеет блоки интерфейса (НАГРУЗКА, ПРОГРЕСС, РЕКОРДЫ), но `loadDashboardFromSupabase` возвращает пустые данные для них.

---

## Что сейчас пусто

| Блок | Текущее значение | Что должно быть |
|------|------------------|-----------------|
| **НАГРУЗКА** (muscleLoad) | `{ groups: {} }` | Распределение подходов по мышечным группам за период (блок/3м/всё) |
| **ПРОГРЕСС** (exerciseProgress) | `{ improvements: [] }` | Список упражнений с ростом веса (первый → текущий, прогресс в кг и %) |
| **РЕКОРДЫ** (allRecords) | Не возвращается | Персональные рекорды по упражнениям |

---

## Источник данных (Supabase)

| Таблица | Поля | Для чего |
|---------|------|----------|
| `workout_sessions` | id, client_id, block_id, date, type | Сессии, фильтр по периоду |
| `workout_sets` | session_id, exercise_id, reps, weight | Подходы с весом и повторениями |
| `exercises` | id, name, category, subcategory, muscle_coefficients | Имя упражнения, коэффициенты мышц |

---

## Алгоритмы (из GAS → Supabase)

### 1. exerciseProgress (прогресс по упражнениям)

1. Получить все `workout_sets` клиента за период (через session → block или date).
2. Сгруппировать по `exercise_id`.
3. Для каждого упражнения: отсортировать по дате, взять первый и последний подход.
4. Если `lastWeight > firstWeight` — добавить в improvements: `{ name, firstWeight, currentWeight, progressKg, progressPercent, lastDate }`.
5. Сортировать по progressPercent, взять топ-10.

### 2. muscleLoad (нагрузка по мышцам)

1. Получить `workout_sets` за период с join на `exercises`.
2. Для каждого подхода: взять `muscle_coefficients` из exercises (или fallback по category/subcategory).
3. Распределить «1 подход» по мышцам согласно коэффициентам (например, chest: 0.8, front_delt: 0.2).
4. Суммировать по группам: legs (quads, hamstrings, glutes, calves), back (lats, traps, low_back), chest, arms (biceps, triceps, delts).
5. Вернуть структуру `{ groups: { legs: { totalSets, muscles: {...} }, ... } }`.

### 3. allRecords (рекорды)

1. По каждому упражнению найти подход с максимальным `weight * reps` или просто `weight`.
2. Вернуть `[{ name, value, unit, date }]`.

---

## Этапы реализации

| # | Задача | Файл | Сложность |
|---|--------|------|-----------|
| 1 | Добавить `computeExerciseProgress()` в loadDashboardFromSupabase | deploy/master/dashboard/index.html | Средняя |
| 2 | Добавить `computeMuscleLoad()` с учётом muscle_coefficients | deploy/master/dashboard/index.html | Средняя |
| 3 | Добавить `computeAllRecords()` | deploy/master/dashboard/index.html | Низкая |
| 4 | Убедиться, что в `exercises` заполнены muscle_coefficients при миграции | supabase/scripts/migrate.js | Проверить |
| 5 | Fallback: маппинг category/subcategory → мышцы, если coefficients пустые | — | Низкая |

---

## Использование Context7

При реализации запрашивай актуальную документацию:

```
use context7 for Supabase JavaScript client — select with join, filter by date range
```

Это поможет избежать устаревших примеров и ошибок в запросах.
