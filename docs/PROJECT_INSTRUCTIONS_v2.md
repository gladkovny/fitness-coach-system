# FITNESS COACH SYSTEM — Project Instructions v2

## 🎯 О ПРОЕКТЕ

**Название:** Fitness Coach System
**Владелец:** Николай (фитнес-тренер, Бали)
**Цель:** SaaS-платформа для фитнес-тренеров с возможностью быстрого развёртывания (франшиза)

---

## 👤 ПРОФИЛЬ ВЛАДЕЛЬЦА

- **Имя:** Николай
- **Локация:** Бали, Индонезия, родом из России
- **Основная деятельность:** Фитнес-тренер (онлайн + офлайн)
- **Вторая деятельность:** Риелтор (недвижимость Бали)
- **Опыт в фитнесе:** 10+ лет
- **Технический уровень:** Базовый (Google Sheets, код с помощью AI)
- **Стиль коммуникации:** Прямой, аналитический, ценит иронию и честность

---

## 📊 ТЕКУЩЕЕ СОСТОЯНИЕ

### Версии компонентов
| Компонент | Версия | Строк кода |
|-----------|--------|------------|
| Dashboard | v10.9 | — |
| Coach Tracker | v10.0 | — |
| Unified Tracker | v4.4 | 6131 |
| Offline Dashboard | v4 | — |
| Master API | v7.0 | — |
| База упражнений | 126 шт | + muscle coefficients |

### Активные клиенты
| Клиент | Тип | Статус | Особенности |
|--------|-----|--------|-------------|
| **Марк** | hybrid | День 24/90 | Online → зал |
| **Ярослав** | offline | Активен | Split, ЛФК кисти |
| **Кирилл** | offline | Активен | FullBody, осанка |

---

## 🏗️ АРХИТЕКТУРА

```
┌─────────────────────────────────────────────────────────────┐
│                     COACH SYSTEM                             │
├─────────────────────────────────────────────────────────────┤
│  ┌─────────────┐     ┌─────────────┐     ┌─────────────┐   │
│  │   COACH     │     │   MASTER    │     │   CLIENT    │   │
│  │   TRACKER   │────►│    API      │◄────│  DASHBOARD  │   │
│  │  (Mobile)   │     │  (v7.0)     │     │  (Web)      │   │
│  └─────────────┘     └──────┬──────┘     └─────────────┘   │
│                             │                               │
│                     ┌───────┴───────┐                       │
│                     │  COACH MASTER │                       │
│                     │   - Clients   │                       │
│                     │   - Exercises │                       │
│                     │   - Blocks    │                       │
│                     └───────┬───────┘                       │
│                             │                               │
│         ┌───────────────────┼───────────────────┐          │
│         ▼                   ▼                   ▼          │
│   ┌───────────┐      ┌───────────┐      ┌───────────┐     │
│   │ Client 1  │      │ Client 2  │      │ Client N  │     │
│   │ (Марк)    │      │ (Ярослав) │      │ (Кирилл)  │     │
│   └───────────┘      └───────────┘      └───────────┘     │
└────────────────────────────────────────────────────────────┘
```

---

## 📁 ТИПЫ КЛИЕНТОВ

| ID | Название | Описание | Особенности |
|----|----------|----------|-------------|
| `online` | Онлайн | Удалённое ведение | КБЖУ, фото-отчёты, вес, сон |
| `offline` | Офлайн | Тренировки в зале | Посещения, замеры, программы, блоки |
| `hybrid` | Комбо | Онлайн + зал | Всё вместе |

---

## 📋 СТРУКТУРА ДАННЫХ

### Coach Master (главная таблица)
```
Clients:        id | name | spreadsheetId | clientType | status | startDate
Exercises:      126 упражнений + muscle coefficients
ClientBlocks:   clientId | blockId | totalSessions | usedSessions | startDate
Settings:       key | value
```

### Client Sheet (для каждого клиента)
```
Goals:           key | value
Nutrition:       key | value (целевые КБЖУ)
Daily:           Date | Nutrition | Weight | Sleep | InBody fields...
ActualNutrition: Date | Calories | Protein | Fats | Carbs
WorkoutSessions: sessionId | date | type | status | notes
WorkoutLog:      sessionId | exerciseId | sets | reps | weight | RPE
TrainingBlocks:  blockId | totalSessions | usedSessions | startDate | status
MandatoryTasks:  taskId | name | category | frequency | notes
```

---

## 🛠️ ТЕХНОЛОГИЧЕСКИЙ СТЕК

| Компонент | Технология |
|-----------|------------|
| Backend | Google Apps Script |
| Frontend | Vanilla HTML/CSS/JS |
| Database | Google Sheets |
| Hosting | Netlify |
| Charts | Chart.js |
| Version Control | Git + GitHub |
| IDE | Cursor + Claude.ai |

---

## 🔄 WORKFLOW РАЗРАБОТКИ

### Инструменты
| Задача | Инструмент |
|--------|------------|
| Планирование, архитектура | Claude.ai |
| Анализ Excel/CSV | Claude.ai |
| Сложные баги | Claude.ai |
| Написание кода | Cursor |
| Рефакторинг | Cursor |
| Коммиты | Git Bash |

### GitHub
```bash
# После изменений:
git add .
git commit -m "Описание"
git push

# Перед работой:
git pull
```

---

## 📏 ПРАВИЛА РАЗРАБОТКИ

### Код
- Комментарии: русский
- Переменные: английский (camelCase)
- Константы: UPPER_SNAKE_CASE
- Mobile-first дизайн
- Минимум зависимостей

### ⚠️ КРИТИЧНО: Кодировка
```bash
# ВСЕГДА проверять перед деплоем:
file <путь>
grep -c "Ð" <путь>
# OK: UTF-8 или ASCII, 0 вхождений "Ð"
```

### Дизайн
- Стиль: Notion-like (светлый, чистый)
- Touch-friendly (min 44px кнопки)
- Offline-ready где возможно

---

## 🔧 ТЕХНИЧЕСКИЕ ПАТТЕРНЫ

### 1. Exercise Recognition
Использовать EXPLICIT_EXERCISE_RULES с regex ПЕРЕД fuzzy matching:
```javascript
const EXPLICIT_EXERCISE_RULES = [
  { pattern: /разгибан.*блок/i, result: { exercise: 'tricep_pushdown', subcategory: 'Трицепс' } },
  { pattern: /сгибан.*блок/i, result: { exercise: 'cable_curl', subcategory: 'Бицепс' } },
];
```

### 2. Muscle Coefficients
Учитывать subcategory при генерации коэффициентов:
```javascript
function generateDefaultCoeffs(category, subcategory) {
  if (subcategory === 'Трицепс') return { triceps: 1.0 };
  if (subcategory === 'Бицепс') return { biceps: 1.0 };
  // generic category fallback
}
```

### 3. Proportional Redistribution
При изменении коэффициента — перераспределять пропорционально:
```javascript
function redistributeCoeffs(coeffs, changed, newVal) {
  const others = Object.keys(coeffs).filter(m => m !== changed);
  const sumOthers = others.reduce((s, m) => s + coeffs[m], 0);
  const remaining = 1 - newVal;
  others.forEach(m => coeffs[m] = (coeffs[m] / sumOthers) * remaining);
  coeffs[changed] = newVal;
}
```

### 4. Auto-creation
Использовать ensureColumns/ensureSheet вместо existence checks:
```javascript
// ✅ ПРАВИЛЬНО:
ensureColumn(sheet, 'InBodyWeight');

// ❌ НЕПРАВИЛЬНО:
if (!sheet.getRange(...).getValue()) { ... }
```

### 5. Date Format
Всегда использовать ISO (YYYY-MM-DD) для хранения и сравнения:
```javascript
function formatDateISO(date) {
  return `${date.getFullYear()}-${String(date.getMonth()+1).padStart(2,'0')}-${String(date.getDate()).padStart(2,'0')}`;
}
```

---

## 🎯 ROADMAP

### ФАЗА 1: MVP ONLINE ✅
- [x] Dashboard клиента
- [x] Coach Tracker
- [x] Master API
- [x] Тестирование (Марк)

### ФАЗА 2: OFFLINE MODULE (~85%)
- [x] Учёт посещений зала
- [x] WorkoutSessions + WorkoutLog
- [x] TrainingBlocks (блоки тренировок)
- [x] MandatoryTasks
- [x] Unified Tracker v4.4
- [x] Sync to Coach Master
- [ ] Тестирование 2 недели
- [ ] Замеры тела (обхваты, фото)

### ФАЗА 3: HYBRID + УНИФИКАЦИЯ
- [ ] Объединённый Dashboard
- [ ] Переключение режимов
- [ ] Шаблоны для типов клиентов
- [ ] Автоматическое создание клиентов

### ФАЗА 4: FRANCHISE
- [ ] Документация
- [ ] Видео-инструкции
- [ ] Онбординг тренеров
- [ ] Монетизация

---

## 💰 БИЗНЕС-ЦЕЛИ

| Метрика | Цель | Срок |
|---------|------|------|
| Чистый доход | $20,000+/мес | Дек 2026 |
| Активных тренеров | 200+ | Дек 2026 |
| Средний чек | $100 + $20/мес | — |

---

## 🔗 ВАЖНЫЕ ССЫЛКИ

- **GitHub:** https://github.com/gladkovny/fitness-coach-system
- **Mark's Sheet ID:** 1k6YhU6KOb8TQdS3272dqMTQKHavVHE4WqoA2oBEAQN8
- **Netlify:** (для хостинга HTML)

---

## ⚠️ ОГРАНИЧЕНИЯ

- Google Apps Script: лимиты на запросы
- Google Sheets: не для больших данных (>10000 строк)
- Нет авторизации пользователей (пока)
- Нет push-уведомлений

---

## 💡 БУДУЩИЕ ИДЕИ (TODO)

### При упаковке продукта:
- Google Form для онбординга → автозаполнение ClientProfile
- Справочник TaskCategories (отдельный лист)

### AI-фичи:
- Распознавание упражнений по фото/видео (пользователь заполняет только интенсивность)
- InBody OCR сервис (Google Vision API)

### Аналитика:
- Распределение нагрузки по мышцам (визуализация)
- Сравнение интенсивности по группам (грудь vs грудь, ноги vs ноги)

### После revenue:
- 3D визуализация тела с heatmap мышц (греческие статуи)
- Геймификация
- Мобильное приложение (React Native)
