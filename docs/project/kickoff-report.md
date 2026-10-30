# Kickoff report — Phase 0

Date: 2026-10-30
Scope: Tasks 1–5 of the kickoff brief (reconnaissance, architecture, repository
initialisation, simulator feasibility PoC, report).

## 1. What was inspected

| Item | Finding |
|---|---|
| Workspace | Not a Git repository at start. Three pre-existing artifacts: requirements PDF, frontend, backend. |
| Requirements | `WattTwin_AI_cahier_de_charge.pdf` v1.0 (14 pages, French). Read in full. |
| `frontend/` | AI-generated React 19 + Vite + TS prototype, 9 pages, ~6.4k lines, **100 % mock-backed** (`services/mock/mockData.ts`). No backend calls. Dependencies include unrelated Express/GenAI packages. |
| `backend/` | PyCharm FastAPI "Hello World" (2 endpoints) + a venv with FastAPI/Pydantic/Uvicorn. No tests, no DB, no packaging. |
| `industrial/`, `docs/`, `scripts/` | Absent. |
| Host | Pop!_OS 24.04, 8 vCPU, 15 GiB RAM, 16 GB free disk, Docker 29.1.3, Node 24.14.0, Python 3.12.3. |
| §Simulator upstream | Open Industry Project is a browser/Electron TypeScript app (MIT). Modbus needs the desktop shell, but headless Node tooling and a Modbus server implementation exist. |
| §PLC upstream | OpenPLC Runtime v4 has no web UI; REST on 8443; Modbus master plugin; program deployment normally via Editor. |

## 2. What was implemented

- Git repository initialised on `main`; ignore rules for Python/Node/secrets/artifacts.
- Monorepo layout for `industrial/`, `docs/`, `scripts/`.
- Backend restructured into `backend/app/` with typed settings, health endpoint, app
  factory, Dockerfile, `pyproject.toml`, Ruff/Mypy/Pytest configuration and 3 tests.
- Root `README.md` with an explicit implemented/mock/simulated status table.
- `docker-compose.yml` for PostgreSQL (host port 5433) and an optional backend service.
- CI workflow for backend lint/format/type/tests. Frontend gate deliberately excluded
  while the UI is mock-backed.
- Phase 0 scripts: pinned simulator bootstrap, OpenPLC start/stop at an immutable digest,
  and the full evidence run.
- Requirements baseline, system architecture, two ADRs, draft Modbus map, feasibility
  report, reproduction runbook, Kanban.

No frontend code was modified.

## 3. What was tested (real, on this machine)

| Test | Result |
|---|---|
| Backend `pytest` | 3 passed |
| Backend `ruff check` | passed |
| Backend `ruff format --check` | passed after one formatting fix |
| Backend `mypy --strict` | passed |
| OIP headless `test-project` | 4/4 tests, exit 0 |
| OpenPLC Runtime v4 container | v4.3.1, `/api/version` 200 |
| Real OpenPLC ↔ headless sim over Modbus | 9/9 checks, 500 requests per function code |
| Two-run/4-run repeatability | event times within 10 ms, position within 5 mm; wall-clock coupled |
| Immutable-digest runtime start script | passed |

## 4. What was *not* tested / remains unproven

- Our own conveyor/sorting line, PLC program and register map.
- Time-series telemetry export with timestamps and quality flags.
- In-process reset; only fresh-world-per-process was observed.
- PostgreSQL/Compose startup.
- Frontend build/type-check against the new backend (no API client exists yet).
- Any digital twin, energy model, trust rule, optimizer, validator, agent or attack.

## 5. Architecture decisions taken

1. **ADR-0001 (accepted):** modular monorepo; Python backend never imports simulator
   internals; a Node industrial runner owns OIP lifecycle; PostgreSQL is the system of
   record; Docker Compose only.
2. **ADR-0002 (provisional):** retain OIP, drive it headlessly, OpenPLC is the Modbus
   master, energy is modelled not measured. Stack-level evidence passes; project-level
   gate open.

## 6. Blockers and risks

| Risk | Severity | Mitigation |
|---|---|---|
| Docker network isolation silently yields zero Modbus traffic | High | Host networking + assert non-zero request counters; documented |
| OIP is 11 days old and warns of breaking changes | High | Pin commit; re-run V1–V5 on every bump |
| OpenPLC deployment needs Editor sources + STruC++ | Medium | Pinned; cached; documented |
| No energy signal in OIP | High | Energy model is a first-class Phase 2 deliverable |
| Frontend is entirely mock, may mislead a demo audience | Medium | Status banner and README; wire incrementally |
| Disk: OIP checkout + node_modules ≈ 1 GB | Low | Gitignored; documented |

No blocker prevents continuing. The only gate that is formally open is our own line's
reproduction (P0-07b).

## 7. Kanban status

Done: P0-01, P0-02, P0-03, P0-05, P0-06, P0-07, P0-08 (harness level), P0-10 (partial).
Doing: P0-13. Next: P0-07b, P0-09, P0-11, P0-04, P0-12.

## 8. Recommended next tickets

1. **P0-07b** — author `industrial/scenarios/line-v0` (OIP project folder) with our
   conveyor/sorting line and PLC program; run the same loop against it.
2. **P0-09** — telemetry trace exporter: fixed sim-time sampling to JSONL with
   `sim_time`, `tag`, `value`, `quality`, `source`.
3. **P0-11** — validate every row of the draft Modbus map against observed traffic,
   including REAL word order.
4. **P0-04** — bring up PostgreSQL and prove migration tooling on an empty database.
5. **P0-12** — close ADR-0002 with the project-level evidence, or invoke the fallback
   ladder with a specific failed requirement.

Do not start MCP/agent work before G4.
