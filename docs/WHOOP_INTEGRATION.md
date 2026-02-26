# Интеграция WHOOP с Fitness Coach System

Краткий чек-лист и шаги для подключения WHOOP к сервису. В проекте уже заложены таблицы `integrations` и `daily_logs` с полями под WHOOP.

---

## Регистрация приложения без своего WHOOP

**Связь без регистрации приложения сделать нельзя** — WHOOP использует OAuth 2.0, для этого нужны Client ID и Client Secret, которые выдаются только после создания приложения в Developer Dashboard.

**Важно:** Официально WHOOP требует от разработчиков наличие аккаунта и устройства (см. [Support / FAQ](https://developer.whoop.com/docs/developing/support/)). На практике доступ в Developer Dashboard даёт **учётная запись WHOOP** — её можно создать на основном сайте (см. ниже). Данные в приложении будут у **клиента**, у которого есть WHOOP: он подключает свой аккаунт к вашему сервису, после чего вы синхронизируете его данные в вашу БД.

---

## Нет кнопки «Регистрация» на странице входа — как войти

На странице [developer-dashboard.whoop.com/login](https://developer-dashboard.whoop.com/login) есть только **SIGN IN**: отдельной регистрации для разработчиков нет. Вход делается **учётной записью WHOOP** (логин/пароль с основного сайта WHOOP).

**Как обойти:**

1. **Создать аккаунт WHOOP на основном сайте** (это и есть «регистрация»):
   - Откройте [join.whoop.com](https://join.whoop.com/) (или [whoop.com](https://www.whoop.com/)).
   - Оформите регистрацию / подписку (есть пробный период). Так вы получите логин и пароль WHOOP.
2. **Войти в Developer Dashboard этими же данными:**
   - Вернитесь на [developer-dashboard.whoop.com/login](https://developer-dashboard.whoop.com/login).
   - Нажмите **SIGN IN** и введите email и пароль от аккаунта WHOOP.

После первого входа вас могут попросить создать **Team**, затем можно создавать приложение (App) и получать Client ID / Client Secret.

**Если не хотите покупать устройство:** можно попробовать оформить только учётную запись/триал на join.whoop.com и сразу войти в Developer Dashboard — иногда доступ к дашборду открывается уже после создания аккаунта. Если доступ потребуют только при наличии устройства, остаётся написать в поддержку WHOOP через [форму обратной связи](https://whoopinc.typeform.com/to/XmzituEp) и запросить доступ к Developer Platform без устройства (например, для интеграции в сервис тренера, где данные будут у клиентов).

---

## Можно ли «обойти систему» и брать данные напрямую с аккаунтов клиентов?

**Через пароли клиентов или вход «под ними» — нельзя.** Хранить логин/пароль WHOOP клиента, входить в его аккаунт или парсить их приложение/сайт — нарушение правил WHOOP, риски безопасности и персональных данных, плюс при любом изменении интерфейса всё сломается. Так делать не стоит.

**Через OAuth вы как раз и берёте данные с аккаунтов клиентов** — но разрешённым способом: клиент один раз нажимает «Подключить WHOOP» и даёт доступ вашему приложению, вы получаете токены и по API запрашиваете *его* данные (recovery, сон, strain). То есть данные приходят напрямую из аккаунта клиента, просто через официальный API, а не в обход.

**Легальный обход без Developer Dashboard и без своего WHOOP — ручной экспорт.** WHOOP даёт пользователям выгружать свои данные в CSV из приложения:

- В приложении WHOOP: **More** → **App Settings** → **Data Export** → указать email → **Create Export**. На почту приходит ссылка на архив (обычно до 24 ч). В архиве CSV: `workouts.csv`, `sleeps.csv`, `physiological_cycles.csv`, `journal_entries.csv`.
- Экспорт можно запрашивать раз в 24 часа.

**Что можно сделать в вашем сервисе без API и без регистрации приложения:**

1. В кабинете клиента: кнопка «Загрузить экспорт WHOOP» (или «Интеграции» → загрузка файла).
2. Клиент скачивает экспорт в приложении WHOOP, загружает полученный ZIP или нужные CSV в ваш сервис.
3. Ваш бэкенд или Edge Function парсит CSV (например, `physiological_cycles.csv` и `sleeps.csv`), маппит в `daily_logs` (recovery_score, strain, hrv, sleep_hours, source='whoop') по `client_id` и дате.

Минусы: не автоматически (клиент сам выгружает и загружает), раз в 24 часа лимит на экспорт у WHOOP. Плюсы: не нужен ваш аккаунт WHOOP, не нужна регистрация приложения в Developer Dashboard, данные по-прежнему «напрямую с аккаунта клиента», но через официальный экспорт.

Итого: «напрямую с аккаунтов клиентов» — да, но либо через OAuth (официальный API), либо через ручной экспорт CSV. Обходить систему паролями или скрапингом — нельзя.

---

## Веб-перехватчик со стороны клиента? Ссылка, куда автоматически падают данные?

**Перехватчик в браузере/устройстве клиента (расширение, скрипт, перехват трафика)** — плохая идея. Это нарушение правил WHOOP, риски безопасности, плюс при любом изменении приложения или сайта WHOOP всё сломается. Так делать не стоит.

**Но «ссылку клиентам, куда автоматически падают данные» можно сделать легально — через webhooks WHOOP.** Схема такая:

1. **Вы один раз настраиваете:**
   - приложение в WHOOP Developer Dashboard;
   - **Webhook URL** — ваш HTTPS-эндпоинт (например Supabase Edge Function), куда WHOOP будет слать события. Указывается в настройках приложения в Dashboard.

2. **Клиентам даёте одну ссылку** — на старт OAuth: «Подключить WHOOP» (редирект на WHOOP, клиент входит и нажимает «Разрешить»).

3. **После того как клиент один раз перешёл по ссылке и разрешил доступ** WHOOP начинает присылать на **ваш** Webhook URL события по этому пользователю: `sleep.updated`, `recovery.updated`, `workout.updated`. То есть данные «автоматически падают» на ваш сервер — не на клиента, а на ваш зарегистрированный URL. В теле запроса приходит `user_id` (WHOOP) и тип события; вы по `user_id` определяете своего клиента (сопоставление делается при OAuth при сохранении в `integrations`), по типу события запрашиваете нужные данные через API и пишете в `daily_logs`.

Перехватчик со стороны клиента не нужен: WHOOP сам шлёт POST-запросы на ваш endpoint. Клиенту нужна только одна ссылка для подключения аккаунта; дальше всё идёт автоматически.

Кратко: **ссылку — да** (ссылка на OAuth «Подключить WHOOP»). **Данные автоматически падают — да**, но на **ваш** webhook URL, а не «со стороны клиента»; клиент только один раз переходит по ссылке и даёт доступ. Подробнее: [Webhooks | WHOOP for Developers](https://developer.whoop.com/docs/developing/webhooks).

---

## Пошаговая инструкция: синхронизация с данными клиента

### Шаг 1. Вы (тренер/разработчик): зарегистрировать приложение один раз

1. Если у вас ещё нет аккаунта WHOOP — создайте его на [join.whoop.com](https://join.whoop.com/), затем войдите в [WHOOP Developer Dashboard](https://developer-dashboard.whoop.com/) **этим же логином и паролем** (на странице входа отдельной регистрации нет).
2. Создайте **Team** (если попросит при первом входе) — любое название, например «Fitness Coach».
3. Перейдите в **Apps** → **Create App** (или [создание приложения](https://developer-dashboard.whoop.com/apps/create)).
4. Заполните:
   - **App name** — например «Fitness Coach System».
   - **Scopes** — отметьте: `offline`, `read:recovery`, `read:cycles`, `read:sleep` (при необходимости ещё `read:workout`).
   - **Redirect URIs** — добавьте URL вашего кабинета, куда WHOOP вернёт клиента после авторизации, например:
     - `https://ваш-сайт.netlify.app/cabinet/whoop-callback`
     - для локальной разработки можно добавить `http://localhost:8888/cabinet/whoop-callback` (если WHOOP разрешает http для теста).
5. Нажмите **Create**, сохраните **Client ID** и **Client Secret** в надёжное место (Secret — только для бэкенда, не в код фронтенда).

На этом ваша часть без WHOOP завершена. Дальше подключается клиент.

---

### Шаг 2. Клиент (у которого есть WHOOP): подключить свой аккаунт

1. Клиент заходит в **кабинет клиента** в вашем сервисе (cabinet).
2. Нажимает кнопку **«Подключить WHOOP»** (или «Интеграции» → WHOOP).
3. Его перенаправляет на страницу WHOOP, где он входит в свой аккаунт WHOOP и нажимает **«Разрешить»** доступ вашему приложению.
4. WHOOP перенаправляет его обратно на ваш **Redirect URI** с параметрами `code` и `state` в URL.
5. Ваш бэкенд (Edge Function или сервер) по этому `code` запрашивает у WHOOP **access_token** и **refresh_token** и сохраняет их в таблицу **integrations** с привязкой к `client_id` этого клиента.

После этого у вас есть связь «клиент в вашей системе ↔ его WHOOP»; данные по API запрашиваются от его имени по сохранённым токенам.

---

### Шаг 3. Синхронизация данных клиента (WHOOP → ваша БД)

Синхронизация — это периодический или ручной запрос данных WHOOP по токенам этого клиента и запись в `daily_logs`.

1. **Кто выполняет:** Edge Function (Supabase) или ваш бэкенд по расписанию (cron) или по кнопке «Синхронизировать» в кабинете.
2. **Для какого клиента:** берёте из таблицы **integrations** строки с `provider = 'whoop'` и `status = 'active'` (и при необходимости `client_id` конкретного клиента).
3. **Токен:** используете `access_token` из этой строки. Если WHOOP вернул 401 — сначала обновите токен через `refresh_token` (POST на Token URL с `grant_type=refresh_token`), обновите `access_token` и `refresh_token` в `integrations`, затем повторите запрос.
4. **Какие данные запрашивать у WHOOP (API v2):**
   - Recovery — балл восстановления, HRV;
   - Cycle — циклы (связь сна и strain);
   - Sleep — длительность и стадии сна.
5. **Куда писать:** в таблицу **daily_logs** по `client_id` и дате:
   - `recovery_score`, `strain`, `hrv`, `sleep_hours`, `sleep_quality`, `source = 'whoop'`;
   - если на эту дату уже есть запись (например, ручной ввод), решите: перезаписать только поля от WHOOP или мержить (например, не трогать ручные поля).
6. Обновите у этой интеграции поле **last_sync** (и при желании храните `token_expires_at` для предобновления токена).

В результате в дашборде/отчётах по клиенту будут видны его WHOOP-данные из `daily_logs`.

---

### Шаг 4. Повторная синхронизация

- **Вручную:** кнопка «Синхронизировать WHOOP» в кабинете клиента → вызов вашего эндпоинта (например POST /whoop/sync), который для этого клиента повторяет шаг 3.
- **По расписанию:** cron раз в день (или чаще) запускает ту же логику для всех клиентов с активной интеграцией WHOOP.

Кратко: приложение регистрируете вы один раз (без своего WHOOP); клиент с WHOOP один раз подключает аккаунт; дальше вы только синхронизируете его данные по сохранённым токенам.

---

## 1. Регистрация приложения в WHOOP (детали)

1. **Создать приложение** в [WHOOP Developer Dashboard](https://developer-dashboard.whoop.com/).
2. **Создать Team** (если ещё нет) — потребуется при первом заходе.
3. **Настроить App:**
   - **Scopes** — выбрать только нужные (рекомендуется для daily_logs):
     - `read:recovery` — Recovery Score, HRV
     - `read:cycles` — циклы (связь сна и восстановления)
     - `read:sleep` — сон (часы, стадии)
     - `read:workout` — тренировки (опционально, если хотите маппить на сессии)
     - `offline` — **обязательно**, чтобы получать refresh_token для долгой работы
   - **Redirect URIs** — добавить URL, куда WHOOP вернёт пользователя после авторизации, например:
     - `https://ваш-домен.netlify.app/cabinet/whoop-callback` или
     - `https://ваш-домен.netlify.app/integrations/whoop/callback`
   - Сохранить и получить **Client ID** и **Client Secret**.

**Важно:** Client Secret хранить только на бэкенде (Edge Function / сервер), никогда не отдавать во фронтенд.

---

## 2. OAuth 2.0 — что нужно для кода

| Параметр        | Значение |
|-----------------|----------|
| Authorization URL | `https://api.prod.whoop.com/oauth/oauth2/auth` |
| Token URL       | `https://api.prod.whoop.com/oauth/oauth2/token` |
| Redirect URL    | Точное совпадение с тем, что указано в Dashboard |
| State           | Случайная строка ≥ 8 символов (защита от CSRF) |
| Scope           | Например: `offline read:recovery read:cycles read:sleep` |

После успешной авторизации WHOOP вернёт на Redirect URL с параметрами `code` и `state`. По `code` на бэкенде нужно обменять на access_token и refresh_token (POST на Token URL с `grant_type=authorization_code`, client_id, client_secret, code, redirect_uri).

---

## 3. Что реализовать в проекте

### 3.1 Эндпоинты (по ARCHITECTURE_V2)

- **POST /whoop/connect** (или GET для старта OAuth) — редирект пользователя на WHOOP Authorization URL с client_id, scope, redirect_uri, state.
- **GET /integrations/whoop/callback** (или аналог) — страница/обработчик, куда WHOOP редиректит; передаёт `code` и `state` на бэкенд.
- **Бэкенд (Edge Function)** — обмен `code` на токены, сохранение в `integrations` (client_id, provider='whoop', access_token, refresh_token, status='active').
- **POST /whoop/sync** — синхронизация данных WHOOP → `daily_logs` (вызов от имени клиента или по крону).

### 3.2 Где хранить секреты и делать обмен код→токен

- **Supabase Edge Function** (рекомендуется): создать функцию, например `whoop-oauth-callback`, которая принимает `code` и `state`, обменивает код на токены и пишет в `integrations`. Client Secret хранить в секретах проекта: `supabase secrets set WHOOP_CLIENT_SECRET=...`
- Альтернатива: отдельный бэкенд (Node/Express и т.п.), если не хотите всё в Edge Functions.

### 3.3 Синхронизация WHOOP → daily_logs

- WHOOP API v2: эндпоинты [Cycle](https://developer.whoop.com/docs/developing/user-data/cycle), [Recovery](https://developer.whoop.com/api), [Sleep](https://developer.whoop.com/api).
- Маппинг в вашу таблицу `daily_logs`:
  - `recovery_score` ← Recovery
  - `strain` ← Strain (из цикла/дня)
  - `hrv` ← HRV из recovery
  - `sleep_hours` / `sleep_quality` ← Sleep
  - `source` = `'whoop'`
- Либо вставка новой строки на дату, либо обновление существующей (по client_id + date), чтобы не затирать ручные поля.

### 3.4 Обновление токенов

- Access token живёт недолго (`expires_in` в секундах). Нужен фоновый процесс (cron или при следующем запросе): если ответ 401 — обновить токен через Token URL с `grant_type=refresh_token`, refresh_token, client_id, client_secret, scope=offline; сохранить новые access_token и refresh_token в `integrations`.

### 3.5 Отзыв доступа

- При отключении интеграции пользователем вызывать [revokeUserOAuthAccess](https://developer.whoop.com/api/#tag/User/operation/revokeUserOAuthAccess) и обновить/удалить запись в `integrations`.

---

## 4. Схема БД (уже есть)

- **integrations** — client_id, provider='whoop', access_token, refresh_token, last_sync, status.
- **daily_logs** — client_id, date, recovery_score, strain, hrv, sleep_hours, sleep_quality, source='whoop'.

Дополнительно можно хранить `token_expires_at` в `integrations` (или в метаданных), чтобы заранее обновлять токен до истечения.

---

## 5. Полезные ссылки

- [WHOOP Developer Platform — Introduction](https://developer.whoop.com/docs/introduction)
- [Getting Started](https://developer.whoop.com/docs/developing/getting-started) — создание приложения, scopes, redirect URIs
- [OAuth 2.0](https://developer.whoop.com/docs/developing/oauth) — авторизация, refresh, revoke
- [API Reference](https://developer.whoop.com/api) — эндпоинты Cycle, Recovery, Sleep, Workout
- [Tutorials](https://developer.whoop.com/docs/tutorials/) — примеры (в т.ч. Passport, refresh token)

---

## 6. Минимальный порядок работ

1. Зарегистрировать приложение в WHOOP Dashboard (можно без своего WHOOP — только аккаунт разработчика), получить Client ID/Secret, задать Redirect URI и scopes.
2. Реализовать старт OAuth (редирект на WHOOP) во фронтенде кабинета клиента.
3. Реализовать Edge Function (или бэкенд) для приёма callback, обмена code→токены, записи в `integrations`.
4. Реализовать синхронизацию (Edge Function или cron): чтение Recovery/Sleep/Cycle из WHOOP API, запись/обновление `daily_logs` с source='whoop'.
5. Добавить обновление access_token по refresh_token при 401 или по расписанию.
6. (Опционально) Webhooks WHOOP — если нужна синхронизация в реальном времени; см. [Webhooks](https://developer.whoop.com/docs/developing/webhooks) (v2).

После этого интеграция WHOOP с сервисом будет готова к тестированию на одном клиенте.
