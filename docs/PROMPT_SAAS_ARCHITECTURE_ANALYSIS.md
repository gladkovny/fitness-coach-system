# ПРОМТ ДЛЯ CURSOR: Анализ архитектуры SaaS-продуктов + Визуализация

> **Цель:** Исследовать best practices успешных SaaS-продуктов в фитнес-индустрии и смежных B2B2C нишах, создать визуализацию архитектурных паттернов в Excalidraw, которую можно переложить на продукт CS FITNESS.

---

## КОНТЕКСТ ПРОЕКТА

**CS FITNESS** — SaaS-платформа для фитнес-тренеров. Тренер ведёт клиентов (онлайн, офлайн, гибрид), система трекает тренировки, питание, прогресс, тело. AI усиливает тренера, а не заменяет.

**Текущий стек:** Google Apps Script + Google Sheets → мигрируем на Supabase (PostgreSQL) + React/Next.js PWA.

**Бизнес-модель:** B2B2C — тренер платит подписку ($29-99/мес), его клиенты получают доступ бесплатно. Рынок: RU+CIS (450K тренеров) + англоязычный (500K тренеров).

**Текущие компоненты:**
- Coach Tracker (мобильный трекер тренировок для тренера)
- Unified Tracker (офлайн-трекер v4.4)
- Client Dashboard (веб-дашборд прогресса для клиента)
- Onboarding System (Google Form → автоматическое создание клиента)
- Master API v7.0 (бэкенд на GAS)
- Coach Master (центральная таблица: клиенты, упражнения, блоки)
- Assessment (вводная оценка клиента)
- 126 упражнений с muscle coefficients

**Ключевые фичи на горизонте:**
- Telegram-бот для клиентов (ввод веса, фото еды, напоминания)
- Telegram Mini App (трекер внутри Telegram)
- AI-распознавание еды по фото → КБЖУ
- AI-распознавание упражнений по видео
- Интеграции: Whoop, Apple Health, Garmin, InBody OCR
- Геймификация (достижения, серии, рекорды)
- Мультитренерность (франшиза)
- Stripe-биллинг
- 3D визуализация тела

---

## ЗАДАЧА

### Часть 1: Исследование (используй web search)

Изучи архитектуру и UX-паттерны следующих категорий SaaS-продуктов:

#### A. Прямые конкуренты (фитнес-тренер SaaS)
Найди и проанализируй архитектурные решения:
- **Trainerize** — как устроен flow тренер → клиент, какие интеграции, как масштабировались
- **TrueCoach** — UX тренировочного трекера, mobile experience
- **PT Distinction** — AI-функции, onboarding тренера, биллинг
- **My PT Hub** — клиентский дашборд, нутрициология
- **Everfit** — мобильное приложение, видео-интеграция
- **TrainHeroic** — геймификация, community features

#### B. Лучшие B2B2C SaaS (архитектурные паттерны)
- **Calendly / Cal.com** — как один продукт обслуживает и бизнес, и конечного пользователя
- **Notion** — workspace-модель, масштабируемость данных
- **Linear** — скорость UI, offline-first подход
- **Stripe** — multi-tenant архитектура, onboarding
- **Intercom / Crisp** — real-time коммуникация бизнес ↔ клиент

#### C. Мессенджер-first SaaS
- **ManyChat** — Telegram/WhatsApp бот как точка входа
- **Tidio** — чат-виджет + бот + CRM
- **Kommo (amoCRM)** — мессенджер-центричная CRM

### Что именно анализировать по каждому:

1. **Архитектура данных** — как организована multi-tenancy (tenant = тренер), изоляция данных клиентов, шаринг общих ресурсов (база упражнений)
2. **User journey** — путь от регистрации тренера до первого платящего клиента, onboarding flow
3. **Точки контакта с клиентом** — web app, mobile app, email, push, Telegram/WhatsApp, SMS
4. **Интеграционный слой** — как подключают wearables, платёжные системы, мессенджеры
5. **AI/ML компоненты** — что автоматизировано, что нет, где AI даёт value
6. **Масштабируемость** — от 1 тренера до 10,000: что меняется в архитектуре
7. **Монетизация** — тарифная сетка, что в бесплатном плане, что за деньги, метрики (LTV, churn)
8. **Offline capability** — PWA, sync, conflict resolution

---

### Часть 2: Синтез — Reference Architecture

На основе анализа создай **Reference Architecture для fitness-тренер SaaS**, которая включает:

#### Слой 1: Frontend (Multi-platform)
```
- Trainer Web App (React/Next.js) — dashboard, program builder, analytics
- Trainer Mobile (PWA / React Native) — session tracker, quick actions
- Client Web App (React) — progress dashboard, achievements
- Client Mobile (PWA) — daily input (вес, еда, задачи)
- Telegram Bot — quick input, notifications, mini app
- Landing / Marketing site
```

#### Слой 2: API Gateway + Auth
```
- API Gateway (rate limiting, versioning)
- Auth (multi-role: admin → trainer → client)
- Webhook receiver (Stripe, Telegram, Whoop)
- File upload (photos → S3/Supabase Storage)
```

#### Слой 3: Business Logic
```
- Training Module (programs, blocks, sessions, sets)
- Nutrition Module (daily log, AI recognition, targets)
- Progress Module (body composition, measurements, photos)
- Communication Module (notifications, reminders, chat)
- Billing Module (subscriptions, payments, invoices)
- Onboarding Module (trainer setup, client intake)
- Gamification Module (achievements, streaks, leaderboards)
```

#### Слой 4: Integration Hub
```
- Wearables (Whoop, Apple Health, Garmin, Oura, Fitbit)
- Messaging (Telegram Bot API, WhatsApp Business)
- Payments (Stripe)
- AI Services (OpenAI Vision, Claude API)
- OCR Services (Google Vision — InBody, Visbody)
- Analytics (Amplitude, Mixpanel, PostHog)
```

#### Слой 5: Data Layer
```
- Primary DB (PostgreSQL / Supabase)
- Cache (Redis — sessions, frequent queries)
- Queue (для async tasks: AI processing, sync, notifications)
- Storage (S3 / Supabase Storage — photos, videos)
- Search (для базы упражнений — Meilisearch / pg_trgm)
```

#### Слой 6: Infrastructure
```
- CI/CD (GitHub Actions)
- Monitoring (Sentry, Uptime)
- Logging
- Backups
- CDN
```

---

### Часть 3: Визуализация в Excalidraw

Создай **3 диаграммы** в формате Excalidraw JSON:

#### Диаграмма 1: "SaaS Reference Architecture — Full Stack"
Полная архитектура из 6 слоёв (см. выше). Визуальные зоны с цветовым кодированием:
- Синий (#dbe4ff) — Frontend / UI
- Фиолетовый (#e5dbff) — API / Auth / Logic
- Зелёный (#d3f9d8) — Data / Storage
- Оранжевый (#fff3bf) — Integrations / External
- Розовый (#eebefa) — AI / ML
- Серый — Infrastructure

Стрелки показывают data flow. Каждый блок — прямоугольник с названием и коротким описанием.

**Формат:** Excalidraw JSON (массив элементов). Использовать:
- `type: "rectangle"` с `roundness: { type: 3 }`, `backgroundColor`, `fillStyle: "solid"`
- `label: { text: "...", fontSize: 16 }` внутри прямоугольников
- `type: "arrow"` с `points`, `endArrowhead: "arrow"`, `startBinding`/`endBinding`
- `type: "text"` для заголовков зон
- Минимальный размер блока: 140×60
- Минимальный fontSize: 16 (для текста), 20 (для заголовков)

#### Диаграмма 2: "User Journey Map — Trainer & Client"
Визуальная карта пути пользователя:
```
Trainer: Discovery → Registration → Onboarding → First Client → Active Use → Upgrade → Advocate
Client: Invite → Form → Dashboard → Daily Use → Results → Retention
```
Показать touchpoints (web, mobile, telegram, email) на каждом этапе.

#### Диаграмма 3: "CS FITNESS — Target Architecture (Migration Path)"
Наложить reference architecture на конкретный план CS FITNESS:
- Текущее состояние (GAS + Sheets) — серым цветом
- Phase 2-3 (Supabase + React) — цветным
- Phase 4-5 (AI + Integrations) — пунктиром
- Phase 6 (Scale) — прозрачным контуром

Показать что уже есть, что в процессе, что на горизонте.

---

### Часть 4: Рекомендации

На основе анализа сформулируй:

1. **ТОП-5 архитектурных решений**, которые CS FITNESS должен заимствовать (с обоснованием и примером из конкурента)
2. **ТОП-3 антипаттерна**, которых стоит избегать (с примерами провалов конкурентов)
3. **Приоритизация интеграций** — что даст максимальный ROI для привлечения первых 100 тренеров
4. **Telegram-стратегия** — на основе ManyChat/Kommo: какую роль Telegram должен играть в продукте (входная точка? Дополнение? Основной канал?)
5. **Рекомендация по тарифной сетке** — на основе анализа конкурентов, что включать в бесплатный/стартовый/про план

---

## ФОРМАТ ВЫВОДА

```
## 1. Результаты исследования
   (по каждому продукту: 3-5 ключевых инсайтов)

## 2. Reference Architecture
   (описание каждого слоя + обоснование)

## 3. Excalidraw JSON
   (3 диаграммы, каждая в отдельном блоке кода)

## 4. Рекомендации для CS FITNESS
   (конкретные, actionable, с приоритетами)

## 5. Следующие шаги
   (что делать первым на основе анализа)
```

---

## ОГРАНИЧЕНИЯ

- Не придумывай данные — ищи реальную информацию через web search
- Если не нашёл конкретную архитектуру продукта, так и скажи, и предложи аналог
- Excalidraw JSON должен быть валидным — без комментариев, trailing commas
- Диаграммы должны быть читаемы при ширине 800px (fontSize >= 16)
- Все тексты на русском (кроме технических терминов)
- Фокус на практической применимости для CS FITNESS, а не на академическом обзоре
