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

**Вариант A — через проект (уже подготовлено)**

1. Открой файл `.cursor/mcp.json`
2. Замени `YOUR_API_KEY` на свой ключ
3. Перезапусти Cursor или перезагрузи окно (Cmd/Ctrl+Shift+P → "Developer: Reload Window")

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
