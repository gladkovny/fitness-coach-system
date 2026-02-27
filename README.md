# Fitness Coach System

[![Built with Claude](https://img.shields.io/badge/Built_with-Claude-cc785c?style=flat-square)](https://www.anthropic.com/claude)
[![Python](https://img.shields.io/badge/Python-3.x-3776ab?style=flat-square&logo=python&logoColor=white)](https://www.python.org/)
[![JavaScript](https://img.shields.io/badge/JavaScript-ES6+-f7df1e?style=flat-square&logo=javascript&logoColor=black)](https://developer.mozilla.org/en-US/docs/Web/JavaScript)
[![Supabase](https://img.shields.io/badge/Supabase-Backend-3ecf8e?style=flat-square&logo=supabase&logoColor=white)](https://supabase.com/)

**A SaaS platform for personal fitness coaches.** Single source of truth for client data, CRM, integrations (Whoop, Apple Health), and AI-assisted workflows. Built as an active indie project with real clients — developed entirely with AI assistance (Claude + Cursor).

**Architecture (source of truth):** [docs/ARCHITECTURE_V2.md](docs/ARCHITECTURE_V2.md) — target stack Supabase + React PWA, Olympus design system, API, roadmap. Currently migrating from GAS/Sheets to Supabase (Phase 2).

---

## Why this project matters

- **Market:** Targets **450K+ Russian-speaking fitness trainers** who need affordable, professional tools — not enterprise software.
- **Product:** SaaS platform that unifies client profiles, nutrition (macros), workout tracking, assessments, and integrations in one place.
- **Status:** Actively developed with **real paying clients** (90-day programs, split/full-body plans). Not a demo or side experiment.
- **Approach:** Innovative fitness SaaS built from the ground up with AI-assisted development (architecture, code, cross-repo coordination, prompt engineering).

---

## Built with Claude

This project is developed with **Claude** (claude.ai Projects), **Cursor**, and **Claude Code** throughout the entire workflow:

| Area | How Claude is used |
|------|---------------------|
| **Architecture & planning** | Target architecture (Supabase, React PWA, API design), migration phases, and roadmap documents are drafted and refined with Claude. |
| **Code generation** | Frontend (Dashboard, Tracker), backend (Master API, GAS → Supabase migration), and scripts are written and refactored with Claude Code in Cursor. |
| **Cross-repo coordination** | Same Supabase instance and shared tables (`exercises`, `users`, etc.) are used across **fitness-coach-system** (CRM), **Telegram_Mini_App** (bot + Mini App), and **exercise-video-bot**. Claude helps keep docs (e.g. CLAUDE.md, STATUS) and schemas aligned. |
| **Exercise recognition & logic** | Exercise database, muscle coefficients, and assessment logic are designed and validated with Claude. |
| **Prompt engineering** | Project rules (`.cursor/rules`), CLAUDE.md context, and agent instructions are maintained so that AI assistance stays consistent and on-brand. |

No claim that “AI wrote everything” — it’s an **indie project** where Claude is a core part of the development process.

---

## Quick start

```
src/           — Frontend (HTML/CSS/JS)
├── dashboard/   — Client dashboard
├── tracker/     — Workout tracker + Assessment
├── css/         — Shared styles
└── js/          — Shared modules

gas/           — Google Apps Script (Backend)
├── Master API_assessment.gs   — Main API (6500+ lines)
└── ONBOARDING_V2.gs           — Onboarding system

docs/          — Documentation
├── CURRENT_STATE_v5.md        — Current status
├── PROJECT_INSTRUCTIONS_v2.md — Project instructions
└── API.md                     — API reference

archive/       — Archive (legacy clients, backups)
```

---

## Tech stack

| Layer | Technology |
|-------|------------|
| **Backend** | Google Apps Script (legacy) → Supabase (migration) |
| **Database** | Google Sheets (legacy) → Supabase Postgres |
| **Frontend** | Vanilla HTML/CSS/JS |
| **Charts** | Chart.js |
| **Hosting** | Netlify |

---

## Components

| Component | Version | Description |
|-----------|---------|-------------|
| Dashboard | v10.9 | Client dashboard (progress, macros) |
| Offline Dashboard | v4 | Dashboard for in-person clients |
| Unified Tracker | v4.4 | Coach workout tracker |
| Master API | v7.0 | Backend endpoints |
| Exercises DB | 126 | Exercise library + muscle coefficients |

---

## Client types

| Type | Description | Modules |
|------|-------------|---------|
| `online` | Remote coaching | Macros, Daily, weight |
| `offline` | In-gym training | Sessions, WorkoutLog, Blocks |
| `hybrid` | Combined | All modules |

---

## Active clients

- **Client A** (offline) — 90-day program
- **Client B** (offline) — Split training
- **Client C** (offline) — FullBody training
- **Client D** (hybrid) — Onboarding test
- **Client E** (offline) — Preparation for competitions DH

---

## Data structure

### Coach Master (central table)

- **Clients** — Client list + spreadsheetId  
- **Exercises** — 126 exercises with muscle coefficients  
- **ClientBlocks** — Training block sync  
- **Settings** — System settings  

### Client sheet (per client)

- **ClientProfile** — Profile (weight, height, age)  
- **Goals** — Program goals  
- **Nutrition** — Target macros (formulas)  
- **Daily** — Daily data  
- **WorkoutSessions** — Workout history  
- **WorkoutLog** — Exercise details  
- **TrainingBlocks** — Training blocks  
- **MandatoryTasks** — Mandatory tasks  
- **Assessment** — Assessment history  

---

## Code conventions

- **Comments:** Russian  
- **Variables:** `camelCase`  
- **Constants:** `UPPER_SNAKE_CASE`  
- Mobile-first design  
- Encoding: UTF-8  
- Minimal dependencies  

---

## Deployment

### Frontend (Netlify)

1. Deploy `src/` to Netlify  
2. Configure domain  

### Backend (Google Apps Script)

1. Open Coach Master spreadsheet  
2. Extensions → Apps Script  
3. Paste code from `gas/`  
4. Deploy → New deployment → Web app  

---

## Architecture & roadmap

| Document | Description |
|----------|-------------|
| [ARCHITECTURE_V2.md](docs/ARCHITECTURE_V2.md) | Target architecture, stack, DB, API, integrations, monetization |
| [ROADMAP_NEXT_STEPS.md](docs/ROADMAP_NEXT_STEPS.md) | Next steps by phase (stabilization → Supabase migration) |

**Current phase:** 1 (stabilization) → 2 (migration to Supabase). DB schema and migrations live in `supabase/`.

---

## Links

- **GitHub:** https://github.com/gladkovny/fitness-coach-system  
- **Docs:** [PROJECT_INSTRUCTIONS_v2.md](docs/PROJECT_INSTRUCTIONS_v2.md)  
- **API:** [docs/API.md](docs/API.md)  

---

## Maintainer

**Nikolai** — Fitness coach, Bali
