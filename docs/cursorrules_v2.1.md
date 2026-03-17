# FITNESS COACH SYSTEM — Cursor Rules v2.1

> Правила для безопасной разработки с AI-ассистентом
> Владелец: Николай (не программист, работает с AI)
> Дата: 30 января 2026

---

## 🎯 ГЛАВНЫЙ ПРИНЦИП

**Объясняй просто, показывай где работаешь, проверяй перед изменениями.**

Владелец проекта не имеет опыта программирования. Каждый ответ должен:
1. Указывать затронутые разделы системы (1-7)
2. Указывать контур (Master/Supabase или Mark/GAS)
3. Объяснять риски простым языком
4. Давать чёткий план проверки

---

## 📐 ОГРАНИЧЕНИЕ СЛОЖНОСТИ ЗАДАЧ

**Сложные задачи делить на маленькие этапы и делать изменения постепенно.**

- Не брать в одну сессию крупный рефакторинг или много файлов сразу — перегружает Cursor/процессор, выше риск ошибок.
- Сложную задачу разбить на шаги: сначала план этапов, затем по одному этапу за раз, после каждого — проверка (и при необходимости коммит).
- Один этап = одна логическая порция (один файл или одна функция/фича), чтобы можно было проверить и при необходимости откатить.
- Если задача большая — предложить разбиение на подзадачи и спросить, с какого этапа начать.

---

## 📊 7 РАЗДЕЛОВ СИСТЕМЫ

При ЛЮБОМ изменении кода указывай затронутые разделы:

```
[1] FRONTEND        — интерфейс (HTML, CSS, JS)
[2] BACKEND         — серверная логика (Supabase / GAS)
[3] DATABASE        — хранение данных (Supabase PostgreSQL / Google Sheets)
[4] AUTHENTICATION  — вход и роли (Supabase Auth)
[5] PAYMENTS        — оплаты и подписки (не реализовано)
[6] SECURITY        — защита данных (RLS, шифрование)
[7] INFRASTRUCTURE  — хостинг, деплой (Netlify, Supabase, GitHub)
```

---

## 🔄 ДВА КОНТУРА ДАННЫХ (переходный период)

```
КОНТУР 1: MASTER (Supabase) ✅ ОСНОВНОЙ
├── deploy/master/login.html     — вход
├── deploy/master/dashboard/     — дашборд тренера
├── deploy/master/tracker/       — трекер (миграция в процессе)
└── Данные: Supabase PostgreSQL

КОНТУР 2: MARK (GAS) ⏸️ LEGACY
├── deploy/mark/dashboard/       — дашборд Марка
├── deploy/mark/program/         — программа тренировок
└── Данные: Google Sheets + Master API
```

**Правило:** При изменениях всегда указывать контур!

---

## 🏗️ СТРУКТУРА ПРОЕКТА

```
fitness-coach-system/
│
├── deploy/                     — [1][7] Готовые для деплоя файлы
│   ├── master/                   — ОСНОВНОЙ (Supabase)
│   │   ├── login.html              — страница входа ✅
│   │   ├── dashboard/              — дашборд тренера ✅
│   │   ├── tracker/                — трекер 🔄
│   │   ├── css/
│   │   └── js/
│   │
│   └── mark/                     — LEGACY (GAS)
│       ├── dashboard/              — дашборд Марка
│       ├── program/                — программа
│       └── index.html
│
├── src/                        — [1] Исходники для разработки
│   ├── dashboard/
│   ├── tracker/
│   ├── online/
│   ├── css/common.css
│   └── js/
│       ├── api.js
│       └── utils.js
│
├── supabase/                   — [2][3][4] Supabase конфигурация
│   ├── migrations/               — SQL миграции
│   ├── functions/                — Edge Functions (будущее)
│   ├── ИНСТРУКЦИЯ_ПЕРВЫЙ_РАЗ.md
│   ├── TESTING_FIRST_TIME.md
│   └── FRONTEND_INTEGRATION.md
│
├── gas/                        — [2] Google Apps Script (legacy)
│   ├── Master_API_assessment.gs  — Master API v7.0
│   ├── online_API_v4.gs          — API для Марка
│   └── ONBOARDING_V2.gs          — онбординг
│
├── docs/                       — Документация
│   ├── SYNC_STATUS.md            — текущий статус ⭐
│   ├── SYNC_STATUS.md            — состояние проекта, следующие шаги
│   ├── ARCHITECTURE_V2.md        — архитектура
│   ├── cursorrules_v2.1.md      — правила для Cursor (этот файл)
│   └── CLAUDE_RULES_V2.1.md     — правила для Claude
│
├── scripts/                    — Скрипты автоматизации
│   ├── sync-claude.ps1
│   └── sync-claude.js
│
├── .cursorrules                — ЭТО ФАЙЛ (краткая ссылка на правила)
├── .env                        — НЕ КОММИТИТЬ!
├── CLAUDE.md                   — Контекст для Claude
└── README.md
```

---

## 🛠️ ТЕХНОЛОГИЧЕСКИЙ СТЕК

| Раздел | Технология | Статус |
|--------|------------|--------|
| [1] Frontend | Vanilla HTML/CSS/JS | ✅ Работает |
| [2] Backend (новый) | Supabase | ✅ Настроен |
| [2] Backend (legacy) | Google Apps Script | ✅ Работает |
| [3] Database (новый) | Supabase PostgreSQL | ✅ Данные перенесены |
| [3] Database (legacy) | Google Sheets | ✅ Бэкап |
| [4] Auth | Supabase Auth | ✅ Работает |
| [7] Hosting | Netlify | ✅ Работает |
| [7] Code | GitHub | ✅ Синхронизирован |

---

## 📝 ФОРМАТ ОТВЕТОВ

### При любом изменении кода ОБЯЗАТЕЛЬНО:

```markdown
## 📍 РАЗДЕЛЫ: [1] Frontend, [3] Database
## 📍 КОНТУР: Master (Supabase)

## 📝 ЧТО МЕНЯЕТСЯ:
- Обновляю трекер для работы с Supabase
- Заменяю fetch к GAS на fetch к Supabase

## ⚠️ РИСКИ:
| Раздел | Уровень | Причина |
|--------|---------|---------|
| [1] | 🟢 Низкий | Только изменение URL |
| [2] | 🟡 Средний | Переключение бэкенда |

## ✅ ПРОВЕРИТЬ ПОСЛЕ:
- [ ] Трекер загружается без ошибок
- [ ] Список клиентов отображается
- [ ] Можно начать тренировку
- [ ] Данные сохраняются в Supabase

## ↩️ ОТКАТ (если сломалось):
Вернуть старый URL GAS в файле tracker/index.html
```

---

## 🔒 ПРАВИЛА БЕЗОПАСНОСТИ

### НИКОГДА не делать:

```javascript
// ❌ ЗАПРЕЩЕНО — ключи в коде
const SUPABASE_KEY = "eyJhbGciOiJIUzI1...";

// ❌ ЗАПРЕЩЕНО — URL в коде (для Supabase)
const SUPABASE_URL = "https://xxx.supabase.co";

// ❌ ЗАПРЕЩЕНО — удаление без подтверждения
await supabase.from('clients').delete();
```

### ВСЕГДА делать:

```javascript
// ✅ ПРАВИЛЬНО — ключи из конфига или .env
// В HTML файлах допустимо (anon key публичный), но лучше в отдельном config.js
const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// ✅ ПРАВИЛЬНО — проверка перед удалением
if (confirm('Удалить тренировку? Это действие необратимо.')) {
  await supabase.from('workout_sessions').delete().eq('id', sessionId);
}

// ✅ ПРАВИЛЬНО — обработка ошибок
const { data, error } = await supabase.from('clients').select();
if (error) {
  console.error('Ошибка загрузки:', error.message);
  alert('Не удалось загрузить данные');
  return;
}
```

---

## 📋 ПРАВИЛА КОДА

### Общие:
- Комментарии: **РУССКИЙ**
- Переменные: **английский camelCase**
- Константы: **UPPER_SNAKE_CASE**
- Даты: **ISO формат (YYYY-MM-DD)**
- **HTML:** семантические теги (header, main, section); min touch target 44px; подключать CSS/JS внешними файлами
- **CSS:** использовать переменные (--bg, --accent), не хардкодить цвета

### Примеры:

```javascript
// Загрузка клиентов из Supabase
async function loadClients() {
  const { data: clients, error } = await supabase
    .from('clients')
    .select('id, name, status, client_type')
    .order('name');
    
  if (error) {
    console.error('Ошибка загрузки клиентов:', error.message);
    return [];
  }
  
  return clients;
}

// Форматирование даты в ISO
function formatDateISO(date) {
  const d = new Date(date);
  return d.toISOString().split('T')[0]; // "2026-01-30"
}

// Константы статусов
const CLIENT_STATUS = {
  LEAD: 'lead',
  ONBOARDING: 'onboarding',
  ACTIVE: 'active',
  PAUSED: 'paused',
  CHURNED: 'churned'
};
```

---

## 🗄️ РАБОТА С SUPABASE

### Подключение (в HTML):

```html
<script src="https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2"></script>
<script>
  // Эти значения безопасно хранить в клиентском коде (anon key публичный)
  // RLS политики защищают данные на уровне БД
  const SUPABASE_URL = 'https://your-project.supabase.co';
  const SUPABASE_ANON_KEY = 'eyJ...';
  
  const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
</script>
```

### Авторизация:

```javascript
// Вход
const { data, error } = await supabase.auth.signInWithPassword({
  email: email,
  password: password
});

// Проверка сессии
const { data: { session } } = await supabase.auth.getSession();
if (!session) {
  window.location.href = '/login.html';
}

// Выход
await supabase.auth.signOut();
```

### Запросы к базе:

```javascript
// Получение списка клиентов (RLS автоматически фильтрует по trainer_id)
const { data, error } = await supabase
  .from('clients')
  .select('*')
  .order('name');

// Получение с join
const { data, error } = await supabase
  .from('workout_sessions')
  .select(`
    *,
    clients(name),
    training_blocks(name)
  `)
  .eq('client_id', clientId);

// Вставка
const { data, error } = await supabase
  .from('workout_sessions')
  .insert({
    client_id: clientId,
    block_id: blockId,
    date: new Date().toISOString(),
    status: 'in_progress'
  })
  .select()
  .single();

// Обновление
const { data, error } = await supabase
  .from('workout_sessions')
  .update({ status: 'completed' })
  .eq('id', sessionId)
  .select()
  .single();
```

---

## ⚠️ УРОВНИ РИСКА

| Уровень | Когда | Действия |
|---------|-------|----------|
| 🟢 **Низкий** | Стили, текст, новые компоненты | Можно делать |
| 🟡 **Средний** | Изменение логики, API запросы | Проверить локально |
| 🔴 **Высокий** | Миграции БД, RLS, авторизация | Бэкап + тест + подтверждение |
| ⛔ **Критический** | Удаление данных, production | Только после явного ОК |

---

## 🔄 СИНХРОНИЗАЦИЯ ПОСЛЕ ИЗМЕНЕНИЙ

### Чек-лист после любых изменений:

```markdown
## Синхронизация

1. **Проверить локально:**
   ```powershell
   cd deploy\master
   python -m http.server 3000
   # Открыть http://localhost:3000/login.html
   ```

2. **Проверить в консоли браузера (F12):**
   - Нет ошибок JavaScript
   - Запросы к Supabase успешны (статус 200)

3. **Если менялся фронтенд:**
   - Скопировать из `src/` в `deploy/master/` или `deploy/mark/`
   - Залить на Netlify

4. **Закоммитить:**
   ```powershell
   .\scripts\git-push.ps1
   # Выбрать тип (feature/fix/docs/refactor/chore) и ввести описание
   ```

5. **Обновить документацию:**
   - docs/SYNC_STATUS.md — если изменился статус
   - docs/SYNC_STATUS.md — если добавлен функционал
```

### 📌 Напоминание о коммите (для AI)

**Когда напоминать:** после завершения логичной задачи:
- Добавлена или изменена функция
- Исправлен баг
- Обновлена документация
- Сделан рефакторинг
- Конец сессии (перед завершением диалога)

**Как напоминать:**
> «Готово. Стоит закоммитить изменения: `.\scripts\git-push.ps1`»

**Когда не напоминать:** код сломан, задача не завершена, пользователь явно сказал «не коммитить».

---

## 🆘 ЕСЛИ ЧТО-ТО СЛОМАЛОСЬ

### Быстрый откат:

```bash
# Посмотреть последние коммиты
git log --oneline -5

# Откатить последний коммит (сохранив изменения в файлах)
git reset --soft HEAD~1

# Откатить последний коммит (удалив изменения)
git reset --hard HEAD~1

# Откатить конкретный файл
git checkout HEAD -- deploy/master/tracker/index.html
```

### Если сломался Supabase:

1. Проверить статус: https://status.supabase.com
2. Проверить RLS политики в Supabase Dashboard
3. Проверить что пользователь залогинен (есть session)

### Если сломался GAS:

1. Использовать предыдущий деплой (URL)
2. В GAS: Deploy → Manage deployments → выбрать рабочую версию

---

## 📞 КОГДА СПРАШИВАТЬ ПОДТВЕРЖДЕНИЕ

Cursor должен ОСТАНОВИТЬСЯ и спросить если:

1. **Удаление данных**
   > "Это удалит данные. Продолжить?"

2. **Изменение схемы БД**
   > "Это изменит структуру базы. Нужна миграция. Показать план?"

3. **Изменение RLS политик**
   > "Это изменит правила доступа к данным. Уверен?"

4. **Переключение контура**
   > "Это переключит с GAS на Supabase. Проверил что Supabase работает?"

5. **Работа с production**
   > "Это повлияет на реальных пользователей. Уверен?"

---

## 🎯 ТЕКУЩИЙ СТАТУС (30.01.2026)

```
ЭТАП: Проверка Supabase

✅ Сделано:
- Supabase настроен
- Данные перенесены
- Auth работает
- Login + Dashboard готовы

🔄 В процессе:
- Проверка входа и дашборда
- Миграция трекера на Supabase

⏸️ Ожидает:
- Дашборд Марка (пока на GAS)
- Программа Марка (пока на GAS)
- Edge Functions

БЛОКЕР: Node.js не установлен
ОБХОД: python -m http.server 3000
```

---

## 🎯 КЛИЕНТЫ

| ID | Имя | Тип | Контур | Статус |
|----|-----|-----|--------|--------|
| mark | Марк | hybrid | GAS + Supabase | День 24/90 |
| yaroslav | Ярослав | offline | Supabase | Активен |
| kirill | Кирилл | offline | Supabase | Активен |
| alena | Алёна | hybrid | GAS (онбординг) | Тест |

---

## 🔧 ЧАСТЫЕ ЗАДАЧИ

| Задача | Как делать |
|--------|------------|
| Добавить страницу | Создать в `src/` или `deploy/master/`, подключить `common.css`, `api.js`, `supabase-config.js` |
| Изменить стили | Общие → `css/common.css`, специфичные → в компоненте |
| Supabase-запрос | Context7 → актуальный синтаксис; проверить RLS |
| GAS endpoint | `gas/Master API_assessment.gs` → switch + функция |

---

## 🐛 ЧАСТЫЕ ОШИБКИ

| Ошибка | Причина | Решение |
|--------|---------|---------|
| Кракозябры | Неверная кодировка | Пересохранить UTF-8 |
| Git: execution policy | PowerShell блокирует .ps1 | `Set-ExecutionPolicy RemoteSigned -Scope CurrentUser` |
| Git: user.name/email | Не настроены | `git config --global user.name "..."` и `user.email "..."` |
| Supabase не отвечает | CORS, file:// | Запускать через HTTP (Live Server) |
| Стили не применяются | Кэш браузера | Ctrl+Shift+R |

---

## 📚 ПОЛЕЗНЫЕ КОМАНДЫ

```powershell
# Запуск локального сервера (Python)
cd deploy\master
python -m http.server 3000

# Git
git status               # Статус изменений
git diff                 # Показать изменения
git log --oneline -10    # Последние 10 коммитов
git add .                # Добавить все файлы
git commit -m "msg"      # Закоммитить
git push                 # Отправить на GitHub
git pull                 # Получить с GitHub

# Проверка кодировки (перед деплоем)
file deploy/master/tracker/index.html
# Должно показать: UTF-8 или ASCII
```

---

## 📝 CONTEXT7 MCP — АВТОМАТИЧЕСКОЕ ИСПОЛЬЗОВАНИЕ

**Правило для AI:** При любой задаче, касающейся следующих тем, АВТОМАТИЧЕСКИ использовать Context7 MCP (без явного «use context7» в промпте пользователя):

| Тема | Библиотека / раздел |
|------|---------------------|
| Supabase JavaScript client | `/supabase/supabase-js` |
| Запросы к БД (select, join, filter) | Supabase |
| RLS, авторизация | Supabase Auth |
| Edge Functions | Supabase |
| Графики, charts | Chart.js |
| Любая внешняя библиотека в проекте | по названию |

**Не полагаться на данные обучения** для library-specific кода — всегда подтягивать актуальную документацию через Context7.

**Настройка:** `.cursor/mcp.json`, API ключ с https://context7.com. См. `docs/CONTEXT7_SETUP.md`.

**Project Rules:** `.cursor/rules/context7-auto.mdc` (alwaysApply), `.cursor/rules/low-resource-agent.mdc` (дробить задачи).

---

> **Версия:** 2.1
> **Обновлено:** 30.01.2026
> **Следующий review:** После стабилизации Supabase
