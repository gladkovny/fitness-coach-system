# Баг: расчёт интенсивности/тоннажа для упражнений с собственным весом

**Дата фиксации:** 2026-02-06

## Проблема

В кабинете тренера (и при отображении нагрузки) для упражнений с собственным весом (подтягивания, выходы силой, скручивания и т.д.) в колонке «Тоннаж» показывается **0**, хотя нагрузка есть.

Причина: тоннаж считается как `weight × reps` из `workout_sets`. Для bodyweight-упражнений в подходах часто хранится `weight = 0` (или не заполнен), поэтому объём получается нулевым.

## Методика расчёта (уже описана)

См. **docs/BODYWEIGHT_AND_INTENSITY.md** и миграцию **00009_exercises_bodyweight_ratio.sql**:

```
effectiveWeight = вес_клиента × exercises.bodyweight_ratio
```

- Вес клиента: `clients.profile.weight` или последняя запись `daily_logs.weight`.
- Коэффициент по упражнению: `exercises.bodyweight_ratio` (подтягивания/брусья/выходы силой ≈ 1.0, отжимания ≈ 0.66, пресс ≈ 0.35–0.4 и т.д.).

Трекер при сохранении уже подставляет `effectiveWeight` в `workout_sets.weight` (см. `deploy/master/tracker/index.html`, поток «Распознать»). Но если подходы были внесены без веса или из старой системы, в БД остаётся 0.

## Что нужно исправить

1. **Кабинет (Нагрузка по мышцам, модальное окно сессии)**  
   При расчёте тоннажа по подходу: если `weight == 0` (или null) и упражнение bodyweight (по `exercise_id` → `exercises.bodyweight_ratio` не null или `equipment` «свой вес»), подставлять `effectiveWeight = clientWeight × bodyweight_ratio` для расчёта объёма.

2. **Дашборд**  
   Аналогично: при подсчёте нагрузки по мышцам и тоннажа по сессиям учитывать bodyweight через `effectiveWeight`, если в сете вес не задан.

3. **Источники данных**  
   Для веса клиента использовать `cabinetData.client.profile.weight` или `lastDailyWeight` (уже подгружается в кабинете); для коэффициента — join с `exercises` по `exercise_id` и поле `bodyweight_ratio`.

## Ссылки

- docs/BODYWEIGHT_AND_INTENSITY.md
- supabase/migrations/00009_exercises_bodyweight_ratio.sql
- deploy/master/cabinet/index.html — секция «Нагрузка», `renderLoadSection`, модалка сессии «Распределение нагрузки»
