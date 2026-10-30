# Kanban — Phase 0

Source of truth for execution. Tickets are small, testable and mapped to requirements.
Status values: `TODO`, `DOING`, `BLOCKED`, `REVIEW`, `DONE`.

Owners: **A** = Industrial automation / OT (Student A), **B** = Platform / intelligent
systems (Student B), **AB** = pair.

## Phase 0 — Foundation and feasibility

| ID | Pri. | Ticket | Owner | Req. | Acceptance criteria | Status |
|---|---|---|---|---|---|---|
| P0-01 | P0 | Repository baseline: git, layout, conventions, README, env example | B | — | `git status` clean after first commit; README status table matches reality | DONE |
| P0-02 | P0 | Requirements baseline and architecture overview | AB | — | F-01…F-22 + NFRs + gates extracted with page refs; ambiguities listed | DONE |
| P0-03 | P0 | Backend shell: FastAPI app, settings, health, tests, lint/type gates | B | NFR Maintainability | `pytest`, `ruff`, `mypy` pass locally and in CI | DONE |
| P0-04 | P0 | Postgres + Compose skeleton | B | — | `docker compose up -d postgres` healthy; connection string documented | TODO |
| P0-05 | P0 | Verify OIP headless execution (V1) | A | F-03 | Command + exit 0 recorded in feasibility report | DONE |
| P0-06 | P0 | Verify OpenPLC Runtime v4 starts and reports version (V2) | A | F-04 | `/api/version` = v4.3.1; digest recorded | DONE |
| P0-07 | P0 | **PLC-in-the-loop over Modbus (V3)** | A | F-04, G1 | Sim headless on 5020; OpenPLC polls; FC2/4/5/15 observed; PLC output changes process | DONE |
| P0-07b | P0 | Reproduce V3/V4 on **our** line, PLC program and map | A/B | F-04, G1 | Our scenario runs; our tags traverse Modbus; evidence recorded | TODO |
| P0-08 | P0 | Reset + two-run repeatability (V4) | A | F-03, G2 | Two runs from same seed compared; deltas + tolerance reported | DONE (harness); our line pending P0-07b |
| P0-09 | P0 | Telemetry trace exporter (fixed sim-time sampling, JSONL) | A/B | F-05 | Tag trace with sim_time, value, quality; documented schema | TODO |
| P0-10 | P0 | Pin immutable artefacts (OIP commit, runtime digest, editor commit, STruC++) | B | NFR Reproducibility | `versions.lock.json` complete; no floating tags in run path | DOING |
| P0-11 | P0 | Modbus map validated against real traffic | A | F-04 | Every row read/written successfully; word order confirmed | TODO |
| P0-12 | P0 | Feasibility decision ADR accepted/rejected with evidence | AB | G1/G2 | ADR-0002 status changed; failed requirements listed if rejected | TODO |
| P0-13 | P0 | CI: backend gates; frontend gate deferred | B | NFR Maintainability | Workflow green on push | DOING |

## Phase 1 — Backend and experiments (starts after P0-07/P0-08, design may start now)

| ID | Pri. | Ticket | Owner | Req. | Acceptance criteria | Status |
|---|---|---|---|---|---|---|
| P1-01 | P1 | Data model + first Alembic migration (experiment, config, run, telemetry) | B | F-01/F-02/F-05 | Migration up/down; constraints and indexes reviewed | TODO |
| P1-02 | P1 | Experiment lifecycle state machine + tests | B | F-01 | Illegal transitions rejected; immutability enforced by hash | TODO |
| P1-03 | P1 | Experiment CRUD + run endpoints | B | F-01 | OpenAPI documented; validation errors consistent | TODO |
| P1-04 | P1 | Runner client contract (JSON schema + fake runner) + contract tests | AB | F-03/F-13 | Backend tested without simulator | TODO |
| P1-05 | P1 | Frontend API client + replace mock experiment service | B | F-20 | Typed client; loading/error states; no `any` | TODO |

## Phase 2+ — not started (listed for dependency awareness)

- P2 telemetry normalization + PostgreSQL time series; twin + energy model + residuals.
- P3 trust engine, A1–A3 attack harness, quantitative security evaluation.
- P4 optimizer + independent validator + candidate simulation.
- P5 MCP tool gateway + agent, security tests.
- P6 dashboard wiring per page.
- P7 end-to-end evaluation.

## Explicitly deferred decisions

- ADR-0004: backend ↔ runner transport (stdio vs localhost HTTP).
- ADR-0005: authentication/role model for the prototype.
- Energy model fidelity and calibration dataset.
