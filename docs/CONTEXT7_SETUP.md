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

## Шаг 3. Правило (уже в .cursorrules)

В проекте настроено **автоматическое** использование Context7: AI сам подтягивает документацию при задачах с Supabase, Chart.js и другими библиотеками. Явный промпт «use context7» не нужен.

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
