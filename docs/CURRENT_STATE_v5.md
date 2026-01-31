# 📊 ТЕКУЩЕЕ СОСТОЯНИЕ ПРОЕКТА

**Дата обновления:** 30 января 2026

---

## 🎯 СТАТУС: ФАЗА 2 ~85%, СИНХРОНИЗАЦИЯ НАСТРОЕНА

```
Компонент          Статус      Версия
─────────────────────────────────────
Dashboard          ✅ Работает  v10.9
Coach Tracker      ✅ Работает  v10.0
Workout Tracker    ✅ Работает  v9.0
Unified Tracker    ✅ Работает  v4.4 (6131 строк)
Offline Dashboard  ✅ Работает  v4
Master API         ✅ Работает  v7.0 (sync endpoints)
База упражнений    ✅ Готова    126 шт + коэффициенты мышц
─────────────────────────────────────
GitHub             ✅ Подключен gladkovny/fitness-coach-system
Cursor             ✅ Настроен  + .cursorrules
─────────────────────────────────────
Тестирование Марк  🔄 День 24 из 90 (hybrid)
Тестирование офлайн 🔄 Ярослав (split), Кирилл (fullbody)
Онбординг          🔄 Алена (тест Google Form → Assessment)
─────────────────────────────────────
Фаза 1 MVP         ✅ Завершена
Фаза 2 Offline     🔄 ~85% готово
```

---

## 🟢 МИГРАЦИЯ НА SUPABASE — ТЕКУЩИЙ ЭТАП (январь 2026)

**Актуальный статус для синхронизации с Claude:** см. **docs/SYNC_STATUS.md**. **Правила для AI (7 разделов, 2 контура):** **docs/cursorrules_v2.1.md** (Cursor), **docs/CLAUDE_RULES_V2.1.md** (Claude).

| Что сделано | Детали |
|-------------|--------|
| Supabase проект | Схема БД, RLS, auth_id у trainers |
| Данные в Supabase | Тренер, клиенты, программы, блоки, сессии, daily (GAS MigrateToSupabase) |
| Вход + дашборд master | deploy/master/login.html, dashboard — данные из Supabase |
| Марк в списке клиентов | ensure_mark_dashboard.sql выполнен |
| Инструкция первого запуска | supabase/ИНСТРУКЦИЯ_ПЕРВЫЙ_РАЗ.md, TESTING_FIRST_TIME.md |

**Где застряли:** запуск локального сервера — `npx` не найден (Node.js не установлен). **Обход:** Python: `cd deploy\master` → `python -m http.server 3000` (или `py`). Затем открыть http://localhost:3000/login.html.

**Следующие шаги (30.01.2026):**  
1) Запустить сервер (Python/Node), проверить вход и дашборд.  
2) Подключить трекер (deploy/master/tracker) к Supabase.  
3) Дашборд и программа Марка — оставить на GAS или постепенно переводить на Supabase. Подробнее: **docs/SYNC_STATUS.md**.

---

## 🔄 СИНХРОНИЗАЦИЯ ПРОЕКТА

### Репозиторий
- **GitHub:** https://github.com/gladkovny/fitness-coach-system
- **Видимость:** Private
- **Ветка:** main

### Workflow разработки

| Инструмент | Для чего использовать |
|------------|----------------------|
| **Claude.ai** | Планирование, архитектура, анализ Excel/CSV, сложные баги. При новом диалоге приложить **docs/SYNC_STATUS.md** и **docs/CLAUDE_RULES_V2.1.md** для актуального этапа и правил. |
| **Cursor** | Написание и редактирование кода, рефакторинг. Следовать **docs/cursorrules_v2.1.md** при изменениях (разделы [1]–[7], контур, риски, чек-лист). |
| **Git Bash** | Коммиты и синхронизация с GitHub |

### Команды Git
```bash
# После изменений:
git add .
git commit -m "Описание изменений"
git push

# Перед работой:
git pull
```

---

## ⚙️ MASTER API v7.0

### Ключевые возможности
- ✅ Мультиклиентная архитектура
- ✅ Online + Offline режимы
- ✅ База упражнений (126 шт + muscle coefficients)
- ✅ MandatoryTasks (обязательные задачи клиента)
- ✅ WorkoutSessions + WorkoutLog
- ✅ TrainingBlocks (учёт купленных тренировок)
- ✅ deleteSession (удаление тренировок)
- ✅ Автосоздание Daily с InBody полями
- ✅ **syncBlockToMaster** — синхронизация блока в Coach Master
- ✅ **syncAllBlocks** — синхронизация всех блоков клиента

### Endpoints — Online

| Action | Описание |
|--------|----------|
| `getClients` | Список клиентов |
| `getGoals` | Цели клиента |
| `getNutrition` | Целевое КБЖУ |
| `getDaily` | Ежедневные данные |
| `getActualNutrition` | Фактическое КБЖУ |
| `saveDaily` | Сохранить день |
| `saveActualNutrition` | Сохранить КБЖУ |

### Endpoints — Offline

| Action | Описание |
|--------|----------|
| `getExercises` | Справочник упражнений |
| `getMandatoryTasks` | Обязательные задачи клиента |
| `getWorkoutSessions` | История тренировок |
| `getWorkoutLog` | Детали тренировки |
| `getExerciseHistory` | История упражнения |
| `startWorkout` | Начать тренировку |
| `addSet` | Добавить подход |
| `finishWorkout` | Завершить тренировку |
| `deleteSession` | Удалить тренировку |
| `syncBlockToMaster` | Синхронизировать блок |
| `syncAllBlocks` | Синхронизировать все блоки |

---

## 📈 ТЕСТИРОВАНИЕ

### Марк (Online/Hybrid)

| Параметр | Значение |
|----------|----------|
| Старт программы | 05.01.2026 |
| **Текущий день** | **День 24** |
| Осталось | 66 дней |
| Стартовый вес | 105.6 кг |
| Целевой вес | 90 кг |
| Режим | Online → Hybrid |

### Ярослав (Offline)

| Параметр | Значение |
|----------|----------|
| Тип | Split (3 дня/нед) |
| Особенности | Недоразвитая НС правой руки, компенсация левой стороной |
| MandatoryTasks | ЛФК кисти, растяжка |
| Статус | ✅ Активно тестирует |

### Кирилл (Offline)

| Параметр | Значение |
|----------|----------|
| Тип | FullBody (3 дня/нед) |
| Особенности | Проблемы с осанкой |
| MandatoryTasks | Дыхание 360, ЛФК осанки |
| TrainingBlock | ID 1, 10 сессий куплено, 3 использовано |
| Статус | ✅ Активно тестирует |

### Алена (Onboarding Test)

| Параметр | Значение |
|----------|----------|
| Цель | Тестирование системы онбординга |
| Этап | Google Form → ClientProfile → Assessment |
| Компоненты | ONBOARDING_V2.gs, assessment.html |
| Статус | 🔄 В процессе |

---

## 🏗️ АРХИТЕКТУРА

```
┌─────────────────────────────────────────────────────────────────┐
│                                                                 │
│   ONLINE                    MASTER API              CLIENT      │
│   ───────                     (v7.0)                ──────      │
│   Coach Tracker  ──────────►    │    ◄──────────  Dashboard     │
│   (v10.0)                       │                   (v10.9)     │
│                                 │                               │
│   OFFLINE                       │                 Offline       │
│   ───────                       │                 Dashboard     │
│   Unified Tracker ─────────────►│◄────────────── (v4)          │
│   (v4.4)                        │                               │
│                                 │                               │
│                                 ▼                               │
│                    ┌───────────────────────┐                    │
│                    │     Coach Master      │                    │
│                    │  ┌─────────────────┐  │                    │
│                    │  │ Clients         │  │                    │
│                    │  │ Exercises (126) │  │                    │
│                    │  │ ClientBlocks    │◄─┼─ Sync              │
│                    │  │ Settings        │  │                    │
│                    │  └─────────────────┘  │                    │
│                    └───────────┬───────────┘                    │
│                                │                                │
│         ┌──────────────────────┼──────────────────────┐        │
│         ▼                      ▼                      ▼        │
│   ┌───────────┐         ┌───────────┐         ┌───────────┐   │
│   │   Марк    │         │ Ярослав   │         │  Кирилл   │   │
│   │  (hybrid) │         │ (offline) │         │ (offline) │   │
│   │ Daily     │         │ Sessions  │         │ Sessions  │   │
│   │ Nutrition │         │ WorkoutLog│         │ WorkoutLog│   │
│   │ Sessions  │         │ Mandatory │         │ Blocks    │   │
│   └───────────┘         └───────────┘         └───────────┘   │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

---

## 📋 БЛИЖАЙШИЕ ЗАДАЧИ

### Приоритет 1: Стабилизация
- [ ] Тестирование Unified Tracker v4.4 (2 недели)
- [ ] Фикс багов по фидбеку Ярослава и Кирилла
- [ ] Марк: День 24/90

### Приоритет 2: Онбординг клиента (🔄 в работе)
- [x] Google Form для первичной анкеты
- [x] ONBOARDING_V2.gs — скрипт интеграции
- [x] assessment.html — интерфейс тестирования
- [ ] Тестирование на Алене — завершить цикл
- [ ] Автозаполнение Goals из формы

### Приоритет 3: Партнёрская программа
- [ ] Список 5-7 потенциальных партнёров
- [ ] Презентация/оффер для бета-тренеров

---

## 📏 ПРАВИЛА КОДА

- **Комментарии:** русский язык
- **Переменные:** английский (camelCase)
- **Константы:** UPPER_SNAKE_CASE
- **Кодировка:** UTF-8

### ⚠️ КРИТИЧНО: Проверка кодировки перед деплоем
```bash
file <путь_к_файлу>
grep -c "Ð" <путь_к_файлу>
# Должно показать: UTF-8 или ASCII, 0 вхождений "Ð"
```

---

## 🔧 КЛЮЧЕВЫЕ ТЕХНИЧЕСКИЕ ПАТТЕРНЫ

### 1. EXPLICIT_EXERCISE_RULES
При распознавании упражнений ВСЕГДА использовать явные правила с regex перед fuzzy matching:
```javascript
const EXPLICIT_EXERCISE_RULES = [
  { pattern: /разгибан.*блок/i, exercise: 'tricep_pushdown', subcategory: 'Трицепс' },
  { pattern: /сгибан.*блок/i, exercise: 'cable_curl', subcategory: 'Бицепс' },
  // ...
];
```

### 2. Muscle Coefficients
Коэффициенты мышц должны учитывать subcategory, а не только category:
```javascript
function generateDefaultCoeffs(category, subcategory) {
  if (subcategory === 'Трицепс') return { triceps: 1.0 };
  if (subcategory === 'Бицепс') return { biceps: 1.0 };
  // ...
}
```

### 3. Proportional Redistribution
При изменении одного коэффициента, остальные перераспределяются пропорционально:
```javascript
function redistributeCoeffs(coeffs, changedMuscle, newValue) {
  const remaining = 1 - newValue;
  const others = Object.keys(coeffs).filter(m => m !== changedMuscle);
  const sumOthers = others.reduce((s, m) => s + coeffs[m], 0);
  others.forEach(m => coeffs[m] = (coeffs[m] / sumOthers) * remaining);
  coeffs[changedMuscle] = newValue;
}
```

### 4. Auto-creation вместо existence checks
При обновлении API использовать ensureColumns/ensureSheet вместо проверок:
```javascript
// ПРАВИЛЬНО:
ensureColumn(sheet, 'InBodyWeight');
ensureSheet(ss, 'TrainingBlocks');

// НЕПРАВИЛЬНО:
if (!sheet.getRange(...).getValue()) { ... }
```

---

## 📅 ИСТОРИЯ ВЕРСИЙ

| Дата | Компонент | Версия | Изменения |
|------|-----------|--------|-----------|
| 28.01.2026 | Master API | 7.0 | syncBlockToMaster, syncAllBlocks |
| 28.01.2026 | Проект | — | GitHub + Cursor синхронизация |
| 27.01.2026 | Unified Tracker | 4.4 | EXPLICIT_EXERCISE_RULES, redistribution |
| 26.01.2026 | Master API | 6.7 | deleteSession, Daily auto с InBody |
| 26.01.2026 | Offline Dashboard | 4 | Прогресс тренировок |
| 25.01.2026 | Dashboard | 10.9 | DATE_COMPAT fix |
| 21.01.2026 | Master API | 6.1 | Offline endpoints |

---

## 💡 TODO (долгосрочные)

- AI распознавание упражнений по фото/видео
- InBody OCR сервис (Google Vision API)
- 3D визуализация тела с heatmap мышц (греческие статуи)
- Справочник TaskCategories (отдельный лист в Coach Master)
- Сравнение интенсивности по мышечным группам (грудь vs грудь, ноги vs ноги)
- Обновление дизайна трекера (единый нейтральный стиль)
