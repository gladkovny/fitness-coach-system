# Как устроен деплой и как выложить сайты в сеть

**Дата:** январь 2026  
**Хостинг:** Netlify (как раньше), альтернатива — Vercel, GitHub Pages.

---

## Как сейчас устроено

- В корне репозитория есть **`netlify.toml`** — в нём указано `publish = "deploy/master"`. Если подключишь репо к Netlify через Git, Netlify сам возьмёт эту папку как корень сайта, ничего вручную в настройках указывать не нужно.
- **Два отдельных «сайта»** — две папки, которые можно выложить как один или два домена:
  1. **Тренер (master)** — вход, дашборд, трекер. Папка: **`deploy/master`**
  2. **Марк** — дашборд Марка и программа тренировок. Папка: **`deploy/mark`**

| Сайт | Папка | Что внутри | Данные |
|------|--------|------------|--------|
| Тренер | `deploy/master` | login.html, dashboard/, tracker/ | Supabase |
| Марк | `deploy/mark` | dashboard/, program/, index.html | GAS (Master API + свой скрипт) |

Раньше ты выкладывал через Netlify — логика та же: раздаётся статика (HTML/CSS/JS), бэкенд — Supabase и GAS.

---

## Вариант 1: Netlify (как раньше)

### Сайт тренера (обязательный)

**Способ A — Netlify Drop (без Git, самый быстрый)**

1. Зайди на **https://app.netlify.com/drop**
2. Перетащи в окно **папку `deploy/master`** (или zip-архив этой папки)
3. Netlify выдаст URL вида `https://random-name-12345.netlify.app`
4. Открой в браузере:
   - Вход: `https://твой-сайт.netlify.app/login.html`
   - Дашборд: после входа откроется сам
   - Трекер: `https://твой-сайт.netlify.app/tracker/index.html`

При Drop **корень сайта** = содержимое `deploy/master`, поэтому пути такие:
- `/login.html`
- `/dashboard/index.html`
- `/tracker/index.html`

**Способ B — Netlify + GitHub (удобно для обновлений)**

1. Зайди на **https://app.netlify.com** → **Add new site** → **Import an existing project**
2. Выбери **GitHub** и репозиторий `fitness-coach-system`
3. Netlify подхватит **`netlify.toml`** из корня — **Publish directory** будет `deploy/master` автоматически. Build command можно оставить пустым.
4. **Deploy** — после каждого `git push` сайт будет обновляться автоматически.

Домен будет вида `https://имя-сайта.netlify.app`. Пути те же: `/login.html`, `/dashboard/index.html`, `/tracker/index.html`.

---

### Сайт Марка (если нужен отдельный URL)

Если Марку нужна своя ссылка (дашборд + программа):

1. Создай **второй сайт** в Netlify (Add new site)
2. **Drop:** перетащи папку **`deploy/mark`**  
   **или Git:** тот же репозиторий, но **Publish directory:** `deploy/mark`
3. Получится второй URL, например `https://mark-fitness.netlify.app`
4. Пути:
   - Дашборд Марка: `https://твой-url.netlify.app/dashboard/index.html`
   - Программа: `https://твой-url.netlify.app/program/index.html`

---

## Вариант 2: Vercel

1. Зайди на **https://vercel.com** → **Add New** → **Project**
2. Импортируй репозиторий `fitness-coach-system`
3. В настройках проекта укажи **Root Directory:** `deploy/master` (для сайта тренера)
4. **Deploy**

Для Марка — второй проект Vercel с **Root Directory:** `deploy/mark`.

---

## Вариант 3: GitHub Pages

Один репозиторий может отдавать только одну папку как корень сайта. Варианты:

- Либо один сайт с корнем `deploy/master` (настройка в Settings → Pages → Source: branch, folder: `deploy/master`)
- Либо два репозитория/ветки для двух сайтов (сложнее).

Для твоего случая проще Netlify или Vercel.

---

## После выкладки

1. **Supabase:**  
   В **Supabase Dashboard** → **Authentication** → **URL Configuration** добавь домен сайта в **Redirect URLs** (например `https://твой-сайт.netlify.app/**`), чтобы вход и редиректы работали.

2. **Конфиг:**  
   В `deploy/master/js/supabase-config.js` уже прописаны SUPABASE_URL и SUPABASE_ANON_KEY — они работают с любого домена (CORS у Supabase по умолчанию разрешён для публичных запросов).

3. **Обновления:**  
   При Netlify + Git достаточно делать `git push` — деплой пойдёт сам. При Drop нужно заново перетащить папку или залить новый zip.

---

## Кратко

| Вопрос | Ответ |
|--------|--------|
| Как раньше выкладывал? | Через Netlify (Drop или Git). |
| Как выложить сейчас? | Так же: Netlify Drop или Netlify + GitHub; папка для тренера — `deploy/master`, для Марка — `deploy/mark`. |
| Конфиг в репо есть? | Да — `netlify.toml` в корне, `publish = "deploy/master"`. При подключении по Git Netlify подхватит его сам. |
| Один сайт или два? | Тренер = один сайт (`deploy/master`). Марк = при необходимости второй сайт (`deploy/mark`). |

Подробные шаги по тесту перед деплоем и типичным ошибкам — в [TRACKER_DEPLOY_STATUS.md](TRACKER_DEPLOY_STATUS.md).
