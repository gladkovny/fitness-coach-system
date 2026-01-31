# Master API Reference

**Версия:** v6.6.1 (v7.0 sync endpoints)

## Базовый URL

```
https://script.google.com/macros/s/{DEPLOYMENT_ID}/exec
```

## Формат запросов

### GET
```
GET ?action=<action>&clientId=<clientId>&param1=value1
```

### POST
```json
POST
Content-Type: application/json

{
  "action": "actionName",
  "clientId": "client_id",
  "param1": "value1"
}
```

## Формат ответа

```json
{
  "success": true,
  "data": { ... }
}
```

или при ошибке:

```json
{
  "error": "Описание ошибки",
  "stack": "..."
}
```

---

## Endpoints

### Общие

| Action | Method | Описание |
|--------|--------|----------|
| `ping` | GET | Проверка API, версия |
| `getClients` | GET | Список всех клиентов |
| `getClientTypes` | GET | Типы клиентов (online/offline/hybrid) |

#### Пример: ping
```
GET ?action=ping

Response:
{
  "ok": true,
  "version": "6.6.1",
  "timestamp": "2026-01-28T..."
}
```

---

### Online (Dashboard, Daily Tracking)

| Action | Method | Params | Описание |
|--------|--------|--------|----------|
| `getGoals` | GET | clientId | Цели клиента |
| `getNutrition` | GET | clientId | Целевое КБЖУ |
| `getDaily` | GET | clientId | Ежедневные данные |
| `getActualNutrition` | GET | clientId | Фактическое КБЖУ |
| `getQuotes` | GET | clientId | Мотивационные цитаты |
| `getSettings` | GET | clientId | Настройки клиента |
| `getAllData` | GET | clientId | Все данные разом |
| `saveDaily` | POST | clientId, data | Сохранить день |
| `saveActualNutrition` | POST | clientId, data | Сохранить КБЖУ |

#### Пример: getNutrition
```
GET ?action=getNutrition&clientId=mark

Response:
{
  "nutrition": {
    "target_calories": 2100,
    "target_protein": 150,
    "target_fats": 70,
    "target_carbs": 200,
    "BMR": 1850,
    "activity_multiplier": 1.55
  }
}
```

---

### Offline (Gym Workouts)

| Action | Method | Params | Описание |
|--------|--------|--------|----------|
| `getClientProfile` | GET | clientId | Профиль клиента |
| `getExercises` | GET | search?, category?, type? | База упражнений |
| `getExerciseHistory` | GET | clientId, exerciseId, limit? | История упражнения |
| `getRecentSessions` | GET | clientId, limit? | Последние тренировки |
| `getSessionDetails` | GET | clientId, sessionId | Детали тренировки |
| `getMuscleStats` | GET | clientId, sessionsBack? | Статистика по мышцам |
| `getMandatoryTasks` | GET | clientId | Обязательные задачи |
| `getTrainingBlocks` | GET | clientId | Блоки тренировок |
| `getOfflineDashboard` | GET | clientId | Данные для дашборда |
| `getOfflineDashboardV2` | GET | clientId, period? | Расширенный дашборд |

#### Пример: getExercises
```
GET ?action=getExercises&category=Ноги

Response:
{
  "exercises": [
    {
      "id": "squat",
      "name": "Приседания",
      "category": "Ноги",
      "subcategory": "Квадрицепс",
      "equipment": ["штанга", "гантели"],
      "muscleCoeffs": { "quads": 0.7, "glutes": 0.2, "hamstrings": 0.1 }
    },
    ...
  ]
}
```

---

### Тренировки (Write)

| Action | Method | Params | Описание |
|--------|--------|--------|----------|
| `startSession` | POST/GET | clientId, date, type? | Начать тренировку |
| `addSet` | POST/GET | clientId, sessionId, exerciseId, weight, reps, ... | Добавить подход |
| `removeSet` | POST/GET | clientId, logId | Удалить подход |
| `finishSession` | POST/GET | clientId, sessionId, notes?, rating? | Завершить тренировку |
| `deleteSession` | POST | clientId, sessionId | Удалить тренировку |

#### Пример: startSession
```json
POST
{
  "action": "startSession",
  "clientId": "yaroslav",
  "date": "2026-01-28",
  "type": "Push"
}

Response:
{
  "success": true,
  "sessionId": "S_20260128_001"
}
```

#### Пример: addSet
```json
POST
{
  "action": "addSet",
  "clientId": "yaroslav",
  "sessionId": "S_20260128_001",
  "exerciseId": "bench_press",
  "exerciseName": "Жим лёжа",
  "setNumber": 1,
  "weight": 60,
  "reps": 10,
  "rpe": 7
}

Response:
{
  "success": true,
  "logId": "L_001"
}
```

---

### Блоки тренировок

| Action | Method | Params | Описание |
|--------|--------|--------|----------|
| `createTrainingBlock` | POST/GET | clientId, totalSessions, priceUSD?, startDate? | Создать блок |
| `updateBlock` | POST/GET | clientId, blockId, ... | Обновить блок |
| `completeBlock` | GET | clientId, blockId | Завершить блок |
| `syncBlockToMaster` | GET | clientId | Синхронизировать в Coach Master |
| `syncAllBlocks` | GET | — | Синхронизировать все блоки |

---

### Assessment (Вводная оценка)

| Action | Method | Params | Описание |
|--------|--------|--------|----------|
| `saveAssessment` | POST | clientId, date, assessments | Сохранить оценку |
| `updateClientProfile` | POST/GET | clientId, updates | Обновить профиль |
| `updateNutrition` | POST/GET | clientId, key, value | Обновить Nutrition |
| `updateClientStatus` | POST | clientId, status | Изменить статус |

---

### AI Parser

| Action | Method | Params | Описание |
|--------|--------|--------|----------|
| `parseWorkout` | GET | text, exercisesList? | Распознать тренировку из текста |
| `aiCoach` | GET | clientId, text | AI-тренер с контекстом |
| `getClientContext` | GET | clientId | Контекст клиента для AI |

---

### Система коэффициентов мышц

| Action | Method | Params | Описание |
|--------|--------|--------|----------|
| `getExercisesMaster` | GET | — | База упражнений с коэффициентами |
| `saveWorkoutWithCoeffs` | GET | clientId, workout | Сохранить с коэффициентами |
| `getDashboardMuscleLoadGroupedV2` | GET | clientId, period? | Нагрузка по мышцам |

---

## Коды статусов клиентов

| Status | Описание |
|--------|----------|
| `pending_assessment` | Ожидает вводную оценку |
| `active` | Активный клиент |
| `paused` | На паузе |
| `completed` | Программа завершена |

---

## Типы тренировок

| Type | Описание |
|------|----------|
| `Push` | Толкающие (грудь, плечи, трицепс) |
| `Pull` | Тянущие (спина, бицепс) |
| `Legs` | Ноги |
| `FullBody` | Всё тело |
| `Upper` | Верх тела |
| `Lower` | Низ тела |
| `assessment` | Вводная оценка |

---

## Периоды для статистики

| Period | Описание |
|--------|----------|
| `block` | Текущий тренировочный блок |
| `3m` | Последние 3 месяца |
| `all` | Всё время |

---

## Группы мышц (для heatmap)

```javascript
const muscleGroups = {
  legs: ['quads', 'hamstrings', 'glutes', 'calves'],
  back: ['lats', 'traps', 'low_back', 'rear_delt'],
  chest: ['chest', 'front_delt', 'mid_delt'],
  arms: ['biceps', 'triceps', 'core']
};
```

---

## Ошибки

| Код | Описание |
|-----|----------|
| `Unknown action` | Неизвестный action |
| `Client not found` | Клиент не найден |
| `Sheet not found` | Лист не найден |
| `Invalid parameters` | Неверные параметры |
