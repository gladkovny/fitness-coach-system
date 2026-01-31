# Настройка Supabase Auth — автоматизированный процесс

Пошаговая инструкция для подключения авторизации (email/password) и настройки RLS.

---

## Шаг 1: Включить Auth в Supabase Dashboard

1. Открой Supabase Dashboard → **Authentication** → в левом меню **Configuration** → **Providers** (или **Sign In / Providers**).
2. Нажми на провайдер **Email** (откроются настройки).
3. Найди опцию **"Confirm email"** (или **"Enable email confirmations"**) и **выключи** её — тогда пользователь сможет входить сразу после регистрации без перехода по ссылке из письма.
4. Сохрани изменения (Save).

**Результат:** Auth включён, можно создавать пользователей.

---

## Шаг 2: Применить миграции (автоматически)

В Supabase → **SQL Editor** выполни по порядку:

1. **00003_add_auth_id.sql** — добавляет колонку `auth_id` в таблицу `trainers`:
   ```sql
   -- Скопируй содержимое файла supabase/migrations/00003_add_auth_id.sql
   -- и выполни в SQL Editor
   ```

2. **00004_real_rls_policies.sql** — заменяет временные RLS на реальные с проверкой `auth.uid()`:
   ```sql
   -- Скопируй содержимое файла supabase/migrations/00004_real_rls_policies.sql
   -- и выполни в SQL Editor
   ```

**Результат:** схема готова для Auth, RLS настроен.

---

## Шаг 3: Создать пользователя и связать с тренером (автоматически)

### Вариант A: Node.js скрипт (рекомендуется)

1. Открой `supabase/scripts/setup_auth.js`.
2. В начале файла замени:
   - `TRAINER_EMAIL` — email тренера (например `gladkovny@gmail.com`).
   - `TRAINER_PASSWORD` — пароль для входа (придумай надёжный).
   - `TRAINER_NAME` — имя тренера (опционально, для обновления).

3. Запусти **в терминале на своём компьютере** (PowerShell, cmd или встроенный терминал Cursor), **не** в Supabase SQL Editor:
   ```bash
   cd supabase/scripts
   npm install  # если ещё не установлены зависимости
   node setup_auth.js
   ```
   Или из корня проекта: `node supabase/scripts/setup_auth.js` (после `cd` в корень репозитория).

Скрипт автоматически:
- Создаст пользователя в `auth.users` (если его нет).
- Найдёт тренера в таблице `trainers` по email.
- Обновит `trainers.auth_id` = `auth.users.id`.
- Выведет результат и данные для входа.

### Вариант B: Вручную через Dashboard + SQL (рекомендуется, если Node.js не установлен)

1. **Создать пользователя:**
   - Supabase Dashboard → **Authentication** → **Users** → **Add user**.
   - Email: `gladkovny@gmail.com` (или email тренера из таблицы `trainers`).
   - Password: придумай надёжный пароль (запомни его — понадобится для входа).
   - **Confirm email** — можно выключить (если уже отключил в шаге 1).
   - Нажми **Create user**.

2. **Связать с тренером:**
   - В **SQL Editor** выполни (замени `gladkovny@gmail.com` на email тренера из таблицы `trainers`):
   ```sql
   UPDATE trainers
   SET auth_id = (
     SELECT id FROM auth.users WHERE email = 'gladkovny@gmail.com'
   )
   WHERE email = 'gladkovny@gmail.com';
   ```

3. **Проверка:**
   ```sql
   SELECT t.id, t.email, t.name, t.auth_id, u.email as auth_email
   FROM trainers t
   LEFT JOIN auth.users u ON t.auth_id = u.id;
   ```
   Должна быть одна строка с заполненным `auth_id` и `auth_email` (оба не NULL).

---

## Шаг 4: Проверить RLS

1. В Supabase Dashboard → **Table Editor** → таблица `trainers`.
2. Попробуй открыть запись — должна быть видна только запись с `auth_id`, совпадающим с твоим `auth.uid()` (после входа).
3. В **SQL Editor** выполни (замени email на свой):
   ```sql
   -- Войди как пользователь (через Dashboard → Authentication → Users → Actions → Impersonate)
   -- или используй anon key в клиенте после входа
   SELECT * FROM trainers;
   ```
   Должна вернуться только твоя запись.

---

## Шаг 5: Тест входа (опционально)

Можно протестировать вход через Supabase Dashboard:
- **Authentication** → **Users** → найди своего пользователя → **Actions** → **Impersonate** (вход от его имени).

Или через фронтенд (если уже подключён Supabase Client):
```javascript
const { data, error } = await supabase.auth.signInWithPassword({
  email: 'gladkovny@gmail.com',
  password: 'твой_пароль'
});
```

---

## Что дальше

- **Фронтенд:** подключить `@supabase/supabase-js` и использовать `supabase.auth.signInWithPassword()` для входа. После входа все запросы к Supabase будут автоматически использовать `auth.uid()` для RLS.
- **API:** если делаешь Edge Functions или отдельный бэкенд, передавай `Authorization: Bearer <access_token>` из фронта, Supabase проверит токен и `auth.uid()` будет доступен в функции.

---

## Troubleshooting

**Ошибка: "relation auth.users does not exist"**
- Auth не включён. Вернись к шагу 1.

**Ошибка: "permission denied for table trainers"**
- RLS политики не применены. Выполни миграцию 00004_real_rls_policies.sql.

**Пользователь создан, но auth_id не обновился**
- Проверь, что email в `trainers` точно совпадает с email в `auth.users` (регистр важен).
- Выполни UPDATE вручную (см. Вариант B, шаг 2).

**После входа не вижу данные**
- Проверь, что `trainers.auth_id` = `auth.users.id` (выполни проверку из шага 3, вариант B).
- Убедись, что используешь `anon` key на фронте (не `service_role`), иначе RLS не применяется.
