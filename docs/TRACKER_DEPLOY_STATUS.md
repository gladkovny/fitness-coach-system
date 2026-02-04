# Статус трекера тренера и деплой

**Дата:** 31 января 2026  
**Цель:** протестировать трекер и задеплоить для использования на тренировке.

---

## Текущий статус трекера

| Компонент | Статус | Примечание |
|-----------|--------|------------|
| Трекер подключён к Supabase | ✅ | `tracker-supabase.js` — все actions (getClients, addSet, startSession и т.д.) |
| Edge Function parse-workout | ✅ | Деплой выполнен, GEMINI_API_KEY настроен |
| Локальное тестирование | ✅ | Работает через `npx serve deploy/master -l 3000` |
| Дашборд (прогресс, рекорды, нагрузка) | ✅ | Исправлены баги, 0 кг отфильтрованы |
| Миграции 00005–00010 | ✅ | Применены в Supabase |

---

## Быстрый тест перед деплоем

1. **Запусти сервер:**
   ```powershell
   npx serve deploy/master -l 3000
   ```

2. **Открой в браузере:**
   - Вход: http://localhost:3000/login.html
   - Трекер: http://localhost:3000/tracker/index.html

3. **Проверь:**
   - [ ] Вход по email/паролю
   - [ ] Выбор клиента (Кирилл, Ярослав, Марк)
   - [ ] Новая тренировка → добавление упражнений (поиск из Supabase)
   - [ ] Сохранение подходов (вес × повторения)
   - [ ] (Опционально) AI-парсинг текста — вставь «Жим лёжа 60×12, 70×10» и нажми парсинг

---

## Деплой на Netlify (для тренировки)

### Вариант A — Netlify Drop (самый быстрый)

1. Зайди на https://app.netlify.com/drop
2. Перетащи папку `deploy/master` в окно (или zip-архив этой папки)
3. Netlify выдаст URL вида `https://random-name-12345.netlify.app`
4. Открой: `https://твой-сайт.netlify.app/login.html` → вход → трекер

**Важно:** при Drop корень сайта = содержимое `deploy/master`. Пути:
- `/login.html` — вход
- `/tracker/index.html` — трекер
- `/dashboard/index.html` — дашборд

### Вариант B — Netlify + GitHub (для обновлений)

1. Подключи репозиторий в Netlify: Add new site → Import from Git
2. В настройках сборки укажи:
   - **Publish directory:** `deploy/master`
   - Build command — оставь пустым (статический сайт)
3. Deploy → сайт обновится при каждом push

### Вариант C — Vercel

1. https://vercel.com → New Project → Import Git repo
2. **Root Directory:** `deploy/master` (или укажи в настройках)
3. Deploy

---

## После деплоя

- Вход: `https://твой-домен.netlify.app/login.html`
- Трекер: `https://твой-домен.netlify.app/tracker/index.html`
- Supabase URL и anon key уже в `supabase-config.js` — работают с любого домена (CORS настроен в Supabase по умолчанию для публичных сайтов)

---

## Если что-то не работает

| Проблема | Решение |
|----------|---------|
| CORS при запросах к Supabase | В Supabase Dashboard → Authentication → URL Configuration добавь домен Netlify в **Redirect URLs** |
| «Supabase не загружен» | Проверь, что на странице есть `<script src="js/supabase-config.js">` и он загружается |
| parseWorkout ошибка | Edge Function parse-workout должна быть задеплоена, GEMINI_API_KEY задан: `npx supabase secrets set GEMINI_API_KEY=...` |
| Пустой список клиентов | В таблице `trainers` должен быть заполнен `auth_id` (UUID из Auth Users) |

---

**Ссылки:** SYNC_STATUS.md, SETUP_AND_TEST_TRACKER_DASHBOARD.md
