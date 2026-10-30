# WattTwin AI

Security-aware industrial digital twin for energy optimisation, built as an academic
prototype by NexaForge Industrial Intelligence.

**Central objective:** minimise simulated energy per conforming unit without violating
throughput, quality or safety constraints — while detecting manipulated telemetry and
resisting agent manipulation.

> This is a simulation-only prototype. No result in this repository is a claim about a real
> plant, and no component commands physical equipment.

---

## Current status (honest snapshot)

Last updated: 2026-10-30 — Phase 0 kickoff.

| Area | Status | Evidence |
|---|---|---|
| Requirements baseline (`WattTwin_AI_cahier_de_charge.pdf`, v1.0) | Read and summarised | `docs/architecture/requirements-baseline.md` |
| Repository / conventions | Initialised | this README, `.gitignore`, `docs/` |
| Backend API shell | Working (health endpoint + tests) | `backend/`, `pytest` |
| PostgreSQL / Compose | Skeleton only, not yet exercised | `docker-compose.yml` |
| React dashboard | **Mock prototype** (9 pages, in-memory services) | `frontend/`, not wired to the API |
| Simulator (Open Industry Project) | **Stack-level feasibility PASS**; our line pending | `docs/integration/simulator-feasibility.md` |
| OpenPLC ↔ Modbus loop | **Verified headless**, 9/9 checks, 4 repeat runs | same document (V3/V4) |
| Digital twin / energy model | Not started | — |
| Trust engine, optimizer, agent, MCP | Not started | — |

No integration is claimed as working until the feasibility report records a reproducible
command and its output.

---

## Repository layout

```text
backend/            FastAPI application, tests, pyproject.toml
frontend/           React + TypeScript + Vite dashboard (currently mock-backed)
industrial/         Simulator adapter, PLC program, Modbus map, scenarios, runner
docs/               Requirements, architecture, ADRs, integration and test evidence
scripts/            Developer and reproducibility scripts
docker-compose.yml  PostgreSQL (and backend once containerised)
```

`frontend/` and `backend/` pre-existed at kickoff. The frontend is an AI-generated UI
prototype backed entirely by `frontend/src/services/mock/mockData.ts`; it is preserved as a
design reference and will be progressively wired to typed API clients.

---

## Quick start (backend)

```bash
cd backend
python3 -m venv .venv
source .venv/bin/activate
pip install -e ".[dev]"
uvicorn app.main:app --reload
# http://127.0.0.1:8000/docs
pytest
```

## Quick start (persistence)

```bash
cp .env.example .env
docker compose up -d postgres
```

## Quick start (frontend, mock mode)

```bash
cd frontend
npm install
npm run dev        # http://localhost:3000
```

The dashboard currently shows **synthetic data only**. Every screen must be treated as a
UI mock until its data source is replaced by the backend.

---

## Key documents

- `docs/architecture/system-overview.md` — components, boundaries, data flow
- `docs/architecture/requirements-baseline.md` — F-01…F-22, NFRs, acceptance criteria
- `docs/decisions/` — architecture decision records (ADR)
- `docs/integration/simulator-feasibility.md` — the Phase 0 gate and its evidence
- `docs/integration/modbus-signal-map.md` — proposed register map (not yet validated)
- `docs/project/kanban.md` — ticket backlog and status

## Engineering rules

1. No component is "done" without a reproducible test or command.
2. Mocked, simulated, modelled and measured data are labelled differently everywhere.
3. The LLM never produces authoritative numbers and never writes to PLC registers.
4. Every optimisation candidate passes the independent validator before simulation.
5. Requirements changes are recorded as ADRs, not silent edits.
