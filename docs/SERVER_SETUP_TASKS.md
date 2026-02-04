# Этап настройки сервера — приоритизированные задачи

**Дата:** 31 января 2026  
**Цель:** Настроить трекер и дашборд для работы с Supabase, восстановить отображение данных.

---

## Приоритеты (по техническим зависимостям)

### 1. Объяснение взаимодействия с Supabase
**Приоритет:** Информационный (не блокирует разработку)  
**Время:** ~15 мин  
**Файл:** docs/SUPABASE_VS_SHEETS.md  

**Что сделано:** Создан документ с простым сравнением Sheets vs Supabase, схемой потока данных, способом правки данных через Table Editor / SQL Editor.

**Почему первый:** Пользователь попросил объяснить «простым языком» — это снижает cognitive load при работе с остальными задачами.

---

### 2. Трекер тренера → Supabase
**Приоритет:** Высокий (источник данных)  
**Время:** 4–8 часов  
**Файлы:** deploy/master/tracker/index.html, deploy/master/tracker/assessment.html  

**Технические зависимости:**
- Supabase client (уже есть в supabase-config.js)
- Таблицы: clients, programs, training_blocks, workout_sessions, workout_sets, exercises, daily_logs
- RLS по auth.uid() (уже настроены)
- Сессия Supabase Auth (проверка при входе)

**Что нужно сделать:**

| Действие | Детали |
|----------|--------|
| Подключить Supabase | Добавить supabase-config.js, Supabase JS в tracker/index.html |
| Проверка сессии | requireAuth() — редирект на login.html при отсутствии входа |
| Клиенты из Supabase | Заменить apiCall('getClients') на loadClientsFromSupabase() |
| Профиль клиента | Заменить getClientProfile → from('clients').select('profile') |
| Блоки | getTrainingBlocks → from('training_blocks') |
| Сессии | getRecentSessions → from('workout_sessions') |
| Упражнения | getExercises → from('exercises') |
| startSession | POST в workout_sessions |
| addSet | POST в workout_sets |
| finishSession | PATCH workout_sessions (status, total_tonnage) |
| getActiveBlock | from('training_blocks').eq('status','active') |
| Assessment | saveAssessment, updateClientProfile → Supabase |

**Почему второй:** Трекер — единственный источник новых тренировок. Без него нельзя тестировать «заполнение программ». Дашборд может показывать мигрированные данные, но для полного цикла нужен работающий трекер.

---

### 3. Дашборд — восстановление данных
**Приоритет:** Высокий (отображение)  
**Время:** 2–4 часа  
**Файлы:** deploy/master/dashboard/index.html  

**Технические зависимости:**
- Данные уже в Supabase (workout_sessions, workout_sets, exercises)
- loadDashboardFromSupabase уже загружает sessions, sets
- Не хватает: вычисление muscleLoad, exerciseProgress, allRecords

**Что нужно сделать (по DASHBOARD_UPGRADE_PLAN.md):**

| Функция | Входные данные | Алгоритм |
|---------|----------------|----------|
| computeExerciseProgress | sets + exercises за период | Группировка по exercise_id, первый/последний подход, расчёт progressKg, progressPercent |
| computeMuscleLoad | sets + exercises (muscle_coefficients) | Распределение подходов по мышцам, сумма по группам legs/back/chest/arms |
| computeAllRecords | sets + exercises | max(weight*reps) или max(weight) по упражнению |
| Фильтр по периоду | currentPeriod (block/3m/all) | Ограничить sessions по date |

**Почему третий:** Логически — после понимания (1) и источника данных (2). Но технически дашборд можно делать параллельно с трекером: он читает уже мигрированные данные. Для «отображалось больше данных» — приоритет высокий.

---

## Порядок реализации (рекомендуемый)

```
1. Прочитать docs/SUPABASE_VS_SHEETS.md
2. Трекер → Supabase (сессия, клиенты, startSession, addSet, finishSession)
3. Дашборд → computeExerciseProgress, computeMuscleLoad, computeAllRecords
4. Assessment → Supabase (опционально, после трекера)
```

---

## Проверка после каждого этапа

| Этап | Чек-лист |
|------|----------|
| Трекер | [ ] Вход через login, [ ] Выбор клиента из Supabase, [ ] Начать тренировку, [ ] Добавить подход, [ ] Завершить — данные в workout_sessions/workout_sets |
| Дашборд | [ ] НАГРУЗКА показывает группы мышц, [ ] ПРОГРЕСС показывает упражнения с ростом, [ ] РЕКОРДЫ показывает персональные рекорды |

---

## Связанные документы

- docs/SUPABASE_VS_SHEETS.md — объяснение Supabase
- docs/DASHBOARD_UPGRADE_PLAN.md — план muscleLoad, exerciseProgress
- supabase/FRONTEND_INTEGRATION.md — подключение фронта
- docs/SYNC_STATUS.md — текущий статус проекта
