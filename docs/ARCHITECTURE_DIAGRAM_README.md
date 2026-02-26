# Диаграмма архитектуры системы (Excalidraw)

## Файл

**`docs/architecture-system.excalidraw.json`** — полная схема архитектуры Fitness Coach System с описанием каждой страницы.

## Как открыть

1. **Excalidraw в браузере:** [excalidraw.com](https://excalidraw.com) → меню (≡) → **Open** → выбрать `architecture-system.excalidraw.json`.
2. **VS Code / Cursor:** установить расширение **Excalidraw** (автор: Excalidraw) и открыть файл `.excalidraw.json`.

## Что на диаграмме

- **Заголовок:** Fitness Coach System, два контура (Master + Mark), Netlify.
- **Контур Master (Supabase)** — синий блок:
  - **login.html** — вход, Supabase Auth, редирект на дашборд.
  - **cabinet/index.html** — кабинет тренера, навигация, список клиентов.
  - **dashboard/index.html** — прогресс клиента, Chart.js, нагрузка по мышцам.
  - **tracker/index.html** — трекер тренировки, подходы, AI, Supabase.
- **Контур Mark (GAS)** — красный блок:
  - **index.html** — редирект на dashboard.
  - **dashboard/index.html** — дашборд Марка (90 дней), GAS.
  - **program/index.html** — программа/трекер Марка, день X/90, GAS API.
- **Backend:** Supabase (БД, Auth, RLS, Edge Functions), GAS (Master API, онлайн API), Netlify (хостинг).
- Стрелки: Master → Supabase, Mark → GAS.

Файл можно редактировать в Excalidraw и экспортировать в PNG/SVG.
