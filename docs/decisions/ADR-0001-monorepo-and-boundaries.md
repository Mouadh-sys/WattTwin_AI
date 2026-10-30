# ADR-0001 — Modular monorepo with an explicit industrial runner boundary

- **Status:** Accepted
- **Date:** 2026-10-30
- **Deciders:** WattTwin AI team (2 students + technical lead)
- **Related:** F-01…F-05, NFR Maintainability, NFR Reproducibility

## Context

The project must integrate a Python backend (FastAPI, NumPy, OR-Tools, MCP), a React
frontend, a TypeScript/three.js simulator (Open Industry Project), and OpenPLC Runtime.
The team is two students on a 14-week academic schedule with student-grade hardware.

Two failure modes are likely:

1. **Premature distribution** — many microservices, message brokers and Kubernetes, which
   consumes the schedule and hides integration bugs.
2. **A single process that imports everything** — FastAPI importing simulator internals,
   making the system untestable and the simulator irreplaceable.

## Decision

Use **one Git repository** with independently testable modules:

```text
backend/     Python domain + API
frontend/    React/TS dashboard
industrial/  simulator adapter, PLC sources, Modbus map, scenarios, runner
docs/        architecture, ADRs, integration evidence
```

Runtime boundaries:

- The **backend never imports simulator code**. It talks to the industrial runner through
  a versioned JSON contract (stdio or localhost HTTP; final choice in ADR-0004).
- The **industrial runner** owns simulator lifecycle (`prepare/reset/start/step/stop`) and
  tag access. It is the only component allowed to know OIP internals.
- The **frontend** talks only to the backend's typed REST API. It has no knowledge of
  Modbus or the simulator.
- **PostgreSQL** is the single system of record. In-memory state is allowed only inside a
  single run and must be persisted on completion.

Deployment: **Docker Compose** for PostgreSQL and the backend; the simulator runner and
OpenPLC may run on the host if containerisation complicates lifecycle control. No
Kubernetes, no message broker, no service mesh.

## Consequences

Positive:

- Each module can be unit-tested without the others.
- The simulator can be replaced (CoppeliaSim or a Python plant model) by implementing one
  adapter contract.
- A student can work on the dashboard while the simulator gate is unresolved.

Negative / accepted costs:

- The industrial tier is polyglot (Python + Node). This is a real operational cost; it is
  accepted because OIP is a TypeScript application and re-implementing its physics would be
  worse and would violate the "do not silently replace" rule.
- Two processes must be started for an end-to-end run, and lifecycle/cleanup must be
  enforced by the runner.
- The JSON contract becomes an API that needs versioning and contract tests.

## Alternatives considered

| Alternative | Why rejected |
|---|---|
| Single Python monolith importing OIP | Impossible: OIP is TypeScript; would force a rewrite |
| Microservices per component | Unjustified for a local prototype; operational overhead |
| Kubernetes | Explicitly unnecessary for a student prototype |
| Frontend calling Modbus/simulator directly | Violates the trust boundary and duplicates business rules |

## Follow-ups

- ADR-0004 must freeze the backend ↔ runner transport and its versioning.
- Contract tests must fail if either side changes a field name or unit.
- `industrial/README.md` must document how to run the runner in isolation.
