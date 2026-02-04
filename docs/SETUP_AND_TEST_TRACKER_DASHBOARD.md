# Настройка и тестирование трекера и дашборда

**Дата:** 31 января 2026  
**Контекст:** Учёт последних обновлений (миграции 00005/00006, Edge Function parse-workout, трекер + дашборд на Supabase).

---

## Текущий статус (31.01.2026)

| Этап | Статус | Примечание |
|------|--------|------------|
| 2.1. Миграция 00005 (seed exercises) | ✅ Выполнено | Success. No rows returned — таблица уже была заполнена |
| 2.2. Миграция 00006 (muscle_coefficients) | ✅ Выполнено | Success. No rows returned |
| Node.js + npm | ✅ Готово | v24.13.0, npm 11.6.2. Политика: `Set-ExecutionPolicy RemoteSigned -Scope CurrentUser` |
| 3.1. Supabase CLI | ✅ Выполнено | `npm i supabase --save-dev` |
| 3.2–3.5. Деплой parse-workout | ✅ Выполнено | login → link → secrets → deploy |
| 4. Запуск сервера | ✅ Выполнено | `npx serve deploy/master -l 3000` |
| 5. Тест: вход, дашборд, трекер | ✅ Выполнено | Работает, но выявлены баги (ниже) |

---

## Выявленные проблемы (01.02.2026)

| # | Проблема | Описание | Следующий шаг |
|---|----------|----------|---------------|
| 1 | **Нет распределения нагрузки по мышцам** | НАГРУЗКА показывает 0 подх. для всех групп (Ноги, Спина, Грудь, Руки и плечи) | Проверить: exById, muscle_coefficients, соответствие exercise_id в workout_sets и exercises.id |
| 2 | **История тренировок — упражнения и интенсивность** | В деталях тренировки не подтягиваются названия упражнений (только «Упражнение»), не видно интенсивность по каждому подходу | Проверить: setsBySession, exMap, формат отображения (все подходы, не только последний) |

---

## Чеклист подготовки

### 1. Supabase — базовая настройка (если ещё не сделано)

- [ ] Пользователь Auth создан (Authentication → Users)
- [ ] В таблице **trainers** заполнен **auth_id** (UUID из Auth Users)
- [ ] В **deploy/master/js/supabase-config.js** указаны **SUPABASE_URL** и **SUPABASE_ANON_KEY**
- [ ] Выполнен **supabase/scripts/ensure_mark_dashboard.sql** (Марк в списке клиентов)

Подробнее: **supabase/ИНСТРУКЦИЯ_ПЕРВЫЙ_РАЗ.md** (части 2 и 3).

---

### 2. Миграции — упражнения и muscle_coefficients

Выполни в **Supabase Dashboard → SQL Editor** (по порядку):

**2.1. Миграция 00005 — seed упражнений** ✅
- Открой `supabase/migrations/00005_seed_exercises.sql`
- Скопируй содержимое в SQL Editor → Run
- Результат: в `exercises` добавлены базовые упражнения (если таблица была пуста) и колонка `key`

**2.2. Миграция 00006 — muscle_coefficients** ✅
- Открой `supabase/migrations/00006_exercise_muscle_coefficients.sql`
- Скопируй в SQL Editor → Run
- Результат: у упражнений заполнены `muscle_coefficients` (для блоков НАГРУЗКА, ПРОГРЕСС, РЕКОРДЫ в дашборде)

---

### 3. Edge Function parse-workout (AI-парсинг текста тренировки)

**3.1. Supabase CLI** — `npm install -g supabase` **не поддерживается**. Варианты:

**Вариант A — локально в проект** (рекомендуется):
```powershell
npm i supabase --save-dev
```
Далее все команды через `npx supabase` (например: `npx supabase login`).

**Вариант B — через Scoop** (Windows):
```powershell
scoop bucket add supabase https://github.com/supabase/scoop-bucket.git
scoop install supabase
```

**3.2. Авторизация:**
```powershell
npx supabase login
```

**3.3. Связь с проектом** (если не настроено):
```bash
cd C:\Users\n.gladkov\Desktop\fitness-coach-system
npx supabase link --project-ref aobnfwvjmnbwdytagqyl
```
(project-ref смотри в URL Supabase Dashboard: `https://supabase.com/dashboard/project/aobnfwvjmnbwdytagqyl`)

**3.4. API ключ Gemini:**
- Получи ключ: https://aistudio.google.com/app/apikey
- Установи секрет:
```bash
npx supabase secrets set GEMINI_API_KEY=твой_ключ_здесь
```

**3.5. Деплой функции:**
```powershell
npx supabase functions deploy parse-workout
```

Без этой функции трекер при вводе текста тренировки будет падать на `parseWorkout` (если GAS API URL не настроен).

**Обход: parse-workout без CLI**
- Пока не деплоить — трекер работает с ручным вводом упражнений; парсинг текста будет недоступен до деплоя.

---

### 4. Запуск локального сервера

```bash
cd C:\Users\n.gladkov\Desktop\fitness-coach-system
npx serve deploy/master -l 3000
```
Или через Live Server в Cursor: правый клик по `deploy/master/login.html` → Open with Live Server.

---

## Тестирование

### 5. Тест: вход и дашборд

1. Открой **http://localhost:3000/login.html** (или порт, который использует Live Server)
2. Войди по email/паролю из Supabase
3. Выбери клиента (Кирилл, Ярослав или Марк)
4. Проверь:
   - [ ] Блок и цели отображаются
   - [ ] Вкладка **НАГРУЗКА** показывает группы мышц (не «Нет данных»)
   - [ ] Вкладка **ПРОГРЕСС** показывает рост по упражнениям или «Пока нет рекордов»
   - [ ] Вкладка **РЕКОРДЫ** показывает персональные рекорды или «Пока нет рекордов»
   - [ ] **НЕДЕЛЯ VS ПРОШЛАЯ** — числа, не нули (если есть данные)

---

### 6. Тест: трекер тренера

1. Открой **http://localhost:3000/tracker/index.html**
2. Без входа должен быть редирект на login — зайди, затем снова открой трекер
3. Выбери клиента
4. **Создание тренировки:**
   - [ ] «Новая тренировка» → выбор даты и типа → создаётся сессия
5. **Ввод упражнений вручную:**
   - [ ] Поиск упражнения — список подгружается из Supabase (Жим лёжа, Приседания и т.д.)
   - [ ] Добавление подхода (вес × повторения) → сохранение
6. **AI-парсинг текста** (если parse-workout задеплоена):
   - [ ] Вставь текст, например: `Жим лёжа 60×12, 70×10. Приседания 100×8×3`
   - [ ] Нажми парсинг → упражнения и подходы должны подставиться

---

### 7. Возможные проблемы

| Проблема | Решение |
|----------|---------|
| Список клиентов пуст | Проверь `auth_id` у тренера в таблице trainers |
| «Нет данных» в НАГРУЗКА | Выполни миграцию 00006 (muscle_coefficients) |
| Упражнения не распознаются | Выполни миграцию 00005 (seed exercises) |
| ParseWorkout ошибка | Задеплой parse-workout и задай GEMINI_API_KEY |
| CORS при запросах | Открывай страницы через HTTP (Live Server или npx serve), не file:// |
| `npm` не выполняется (PSSecurityException) | `Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser` |
| "Installing Supabase CLI as global is not supported" | Используй `npm i supabase --save-dev` и `npx supabase` |
| "could not determine executable" (serve) | Пакет **serve**, флаг **-l**: `npx serve deploy/master -l 3000` |

---

## Краткий порядок действий

1. Supabase: auth_id, supabase-config.js, ensure_mark_dashboard.sql  
2. SQL Editor: 00005–00010 (см. **docs/MIGRATION_CHECKLIST.md** — там статус каждой миграции)  
3. CLI: `npm i supabase --save-dev`, затем `npx supabase login` → `link` → `secrets set` → `functions deploy parse-workout`  
4. Запуск: `npx serve deploy/master -l 3000` (пакет **serve**, флаг **-l**)  
5. Тест: login → dashboard → выбор клиента → вкладки НАГРУЗКА, ПРОГРЕСС, РЕКОРДЫ  
6. Тест: tracker → новая тренировка → ввод упражнений → парсинг текста  

---

## Следующие задачи (после первого теста)

- [x] **Баг 1:** НАГРУЗКА — распределение по мышцам показывает 0 (исправлено: join exercises, NAME_KEYWORDS, set.exercises)
- [x] **Баг 2:** История тренировок — названия упражнений, интенсивность (исправлено: setsList, Supabase join)  
- [ ] **Если всё ещё в «Кор»:** 1) Выполни миграцию **00008** (добавляет колонку `exercise_name`). 2) Из папки `supabase/scripts` запусти: `node backfill-exercise-names.js` (нужны .env, config.json, GOOGLE_APPLICATION_CREDENTIALS). 3) Перезагрузи дашборд  
- [ ] **Если названия тренировок — только «Тренировка»:** запусти `node backfill-session-names.js` (заполняет `workout_sessions.type` из WorkoutSessions splitType/type)  

---

**Ссылки:** ИНСТРУКЦИЯ_ПЕРВЫЙ_РАЗ.md, EXERCISES_AND_AI_UPGRADE.md, SYNC_STATUS.md, **MIGRATION_CHECKLIST.md** (статус миграций и backfill)
