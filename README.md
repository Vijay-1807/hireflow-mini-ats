# HireFlow — Mini Applicant Tracking System

> **Assignment:** Full Stack Developer Intern · EarlyJobs.ai
> **Built by:** Bontha Vijay · 2026 B.Tech (AI & Data Science)

A production-style mini ATS to **manage candidates, move them across hiring stages, search/filter talent, and track dashboard metrics** — wrapped in a glassmorphism UI with fluid animations.

![status](https://img.shields.io/badge/status-complete-brightgreen) ![node](https://img.shields.io/badge/node-%3E%3D18-339933) ![stack](https://img.shields.io/badge/stack-React%20·%20Express%20·%20SQLite-6366f1)

---

## Live demo

**Deployed app:** _[Add your Render URL here after deploy]_
**Repository:** _[Add your GitHub repo URL here]_
**Demo video (2–3 min):** _[Add Loom / Drive link here]_

> Demo video script suggestion: Dashboard metrics → search "react" → filter by stage → drag a candidate from Screening to Interview on the Pipeline → open a candidate drawer → add a note → create a new candidate → bulk-move candidates.

---

## Features

### Candidates
- Full CRUD — create, read, update, delete candidates
- Rich profile: name, email, phone, location, role, experience, expected salary, source, resume URL, skills, star rating, notes
- **Instant search** across name, email, role, skills, location and phone (debounced)
- Filters: stage, role, source · Sort on any column (name, stage, rating, experience, dates)
- Table view **and** card grid view
- Bulk select → bulk move candidates between stages
- Candidate detail drawer with **activity timeline** (auto stage-change history + manual notes)

### Pipeline (Kanban)
- 6 stages: Applied → Screening → Interview → Offer → Hired / Rejected
- **Drag-and-drop** between columns (dnd-kit) with optimistic UI and instant API save
- Per-column counts, skills chips, salary and rating at a glance

### Dashboard
- Animated KPI cards: total candidates, active pipeline, hire count, avg. time-to-close, conversion %, week-over-week growth
- 14-day applications area chart, source donut chart, stage funnel bars, top skills, recent applicants feed

### Engineering
- REST API with validation, filtering, sorting, pagination and audit timeline
- Seeded with **48 realistic candidates** and generated activity histories
- Loading skeletons, empty states, error states, toasts on every mutation
- Fully responsive (mobile bottom-nav, stacked layouts)
- Code-split production build

---

## Tech stack

| Layer | Choice |
|---|---|
| Frontend | React 18, Vite 5, Tailwind CSS 3 |
| Animation | Framer Motion, dnd-kit, Recharts |
| Icons | lucide-react · Toasts: react-hot-toast |
| Backend | Node.js, Express 4 |
| Database | SQLite via better-sqlite3 (WAL) |
| Deploy | Render / Railway / Docker / any Node host |

---

## Quick start

```bash
# 1. Install everything
npm run install:all

# 2. Build the frontend + seed sample data
npm run build
npm run seed

# 3. Start (serves API + built UI on one port)
npm start
# → open http://localhost:4000
```

### Development mode (hot reload)

```bash
# Terminal 1 — API on :4000
npm run dev:server

# Terminal 2 — Vite on :5173 (proxies /api → :4000)
npm run dev:client
```

### Reset the database

```bash
npm run reset   # wipes and reseeds 48 candidates
```

---

## API reference

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/health` | Health check |
| `GET` | `/api/stages` | Stage definitions (id, label, colour) |
| `GET` | `/api/candidates` | List — supports `q`, `stage`, `role`, `source`, `location`, `sort`, `order`, `page`, `limit` |
| `GET` | `/api/candidates/filters/options` | Distinct roles, sources, locations, skills |
| `GET` | `/api/candidates/:id` | Candidate + activity timeline |
| `POST` | `/api/candidates` | Create candidate |
| `PATCH` | `/api/candidates/:id` | Update candidate (stage change auto-logged) |
| `DELETE` | `/api/candidates/:id` | Delete candidate (cascade deletes activity) |
| `POST` | `/api/candidates/bulk-stage` | `{ ids: number[], stage: string }` |
| `POST` | `/api/candidates/:id/activities` | Add note to timeline |
| `GET` | `/api/metrics` | Dashboard aggregates |

Example:

```bash
curl "http://localhost:4000/api/candidates?q=react&stage=interview&sort=rating&order=desc"
```

---

## Project structure

```
├── server/                 # Express + SQLite API
│   ├── src/
│   │   ├── index.js        # App entry, static serving, error handling
│   │   ├── db.js           # Schema, WAL, stage definitions
│   │   ├── seed.js         # Realistic demo data generator
│   │   └── routes/
│   │       ├── candidates.js  # CRUD, search, filters, bulk, timeline
│   │       └── metrics.js     # KPIs, funnel, charts, feeds
│   └── data/ats.db         # SQLite file (git-ignored, auto-created)
└── client/                 # React SPA
    └── src/
        ├── pages/          # Dashboard, Candidates, Pipeline
        ├── components/     # Sidebar, Kanban, Drawer, Forms, Charts…
        ├── hooks/          # useAsync, useCandidateList, useDebounced
        ├── api/            # Axios client + typed API surface
        └── lib/            # Formatters, stage meta, gradients
```

---

## Deployment

### Option A — Render (recommended, free)

1. Push this repo to GitHub.
2. On [render.com](https://render.com) → **New → Blueprint** → pick the repo (uses the included `render.yaml`).
3. Render builds the client, starts the API, and serves everything from one URL with health checks on `/api/health`.

> The Express server automatically serves `client/dist` when it exists — **one service, one URL, zero CORS config**.

### Option B — Railway

```bash
railway init && railway up
# build: npm run setup
# start: npm start
```

### Option C — Docker (anywhere)

```bash
docker build -t hireflow .
docker run -p 4000:4000 -v ats-data:/app/server/data hireflow
```

### Option D — Split hosting (Vercel + Render)

- **Frontend** → Vercel: root `client`, build `npm run build`, output `dist`, add env `VITE_API_URL` if API is hosted separately.
- **Backend** → Render: root `server`, start `npm start`.

---

## Why this design

- **Glassmorphism** (blur + translucent layers + gradient glows) signals modern product polish.
- **Motion with meaning** — spring page transitions, staggered list entrances, animated counters and funnel bars draw the eye to metrics that matter.
- **Instant feedback** — optimistic drag-and-drop, skeletons while loading, toasts on every mutation.
- **Real ATS workflows** — the pipeline mirrors how hiring actually happens, and every stage change writes an audit trail.

---

MIT © Bontha Vijay
