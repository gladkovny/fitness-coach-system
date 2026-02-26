# Context7 — настройка для Cursor

Context7 подгружает актуальную документацию библиотек (Supabase, Chart.js и др.) прямо в Cursor, чтобы AI использовал свежие API вместо устаревших данных из обучения.

---

## Шаг 1. Получить API ключ

1. Зайди на https://context7.com
2. Зарегистрируйся (бесплатно для личного использования)
3. Создай API ключ в настройках
4. Скопируй ключ

---

## Шаг 2. Настроить Cursor

**Вариант A — через проект (рекомендуется)**

В проекте в `.cursor/mcp.json` уже прописан ключ **FC System** (Context7). Чтобы запросы шли именно с него:

1. Открой этот проект в Cursor (не только глобальные настройки).
2. Убедись, что в **Cursor Settings → Tools & MCP** в списке серверов есть `context7` и он включён — тогда используется конфиг из `.cursor/mcp.json` этого репозитория.
3. Если ты добавлял Context7 через one-click глобально с другим ключом (например, «Fitness Coach BOT TG»), отключи дубликат или оставь только проектный конфиг, чтобы в дашборде context7.com по ключу «FC System» появлялись запросы.
4. Перезагрузи окно: `Ctrl+Shift+P` → «Developer: Reload Window».

**Вариант B — One-Click (глобально)**

Перейди по ссылке с официального сайта: [Add to Cursor](https://cursor.com/en/install-mcp?name=context7&config=...) — подставит настройки в глобальный конфиг Cursor.

---

## Шаг 3. Автоматическое срабатывание (обязательно)

Context7 **по умолчанию требует** явный промпт «use context7». Чтобы он работал автоматически, нужны **оба** пункта:

### 3.1. Project Rule (уже создано)

В проекте есть `.cursor/rules/context7-auto.mdc` с `alwaysApply: true` — правило всегда в контексте и предписывает AI вызывать Context7 при задачах с библиотеками.

### 3.2. User Rule в Cursor Settings (добавь вручную)

Без этого Context7 может не срабатывать автоматически.

1. Открой **Cursor** → **Settings…** → **Cursor Settings** → **Rules and Commands**
   - Или нажми `Ctrl+Shift+P` (Win) / `Cmd+Shift+P` (Mac) → введи «Cursor Settings»
2. В разделе **User Rules** нажми **+ Add Rule**
3. Вставь текст правила:

```
Always use Context7 MCP when I ask about library documentation, API references, or need code examples from external packages. For Supabase, Chart.js, RLS, Edge Functions — invoke Context7 as the first action before answering or writing code.
```

4. Сохрани правило

После этого Context7 должен вызываться автоматически при вопросах про Supabase, Chart.js и другие библиотеки, без «use context7» в промпте.

---

## Использование

**Автоматически:** Задай вопрос или задачу — Context7 подтянется сам, если тема касается Supabase, Chart.js или внешних библиотек.

**Вручную** (если нужно): добавь в промпт `use context7`:

```
use context7 для Supabase JavaScript — select с join
use context7 for Chart.js — doughnut chart
use context7 with /supabase/supabase-js for RLS
```

---

## Рекомендуемые библиотеки для этого проекта

| Библиотека | Зачем |
|------------|-------|
| `/supabase/supabase-js` | Запросы к БД, auth, RLS |
| `chart.js` | Графики тоннажа, нагрузки |
| `vanilla-js` | DOM, fetch (если нужно) |

---

## Supabase MCP (в том же `.cursor/mcp.json`)

В проекте в `.cursor/mcp.json` добавлен сервер **supabase** (`https://mcp.supabase.com/mcp`). Он даёт AI доступ к твоему проекту Supabase: SQL-запросы, миграции, Edge Functions, генерация типов.

**После перезагрузки окна Cursor:**
1. **Cursor Settings → Tools & MCP** — в списке должен появиться **supabase**.
2. При первом использовании Cursor предложит войти в аккаунт Supabase (персональный токен больше не обязателен).
3. Проверка: спроси в чате, например: «Какие таблицы в базе? Используй MCP» — AI сможет обратиться к Supabase через MCP.
