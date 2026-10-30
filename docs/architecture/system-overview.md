# System architecture — baseline

Status: **working baseline**, Phase 0. Some elements are decisions (ADR), some are
hypotheses pending the simulator feasibility gate. Each is labelled.

## 1. Design intent

WattTwin AI must keep five kinds of authority separate:

1. **Plant authority** — the simulated process and the PLC decide what the line physically
   does.
2. **Measurement authority** — telemetry is timestamped and provenance-tracked; it is not
   self-certifying.
3. **Estimation authority** — the digital twin estimates state and energy, and publishes
   residuals and uncertainty.
4. **Decision authority** — the deterministic optimizer proposes; the independent validator
   disposes; the human approves.
5. **Explanation authority** — the LLM explains and orchestrates authorised tools; it never
   produces authoritative numbers and never actuates.

The agent sits *beside* the control loop, not inside it. A dashboard cannot bypass the
validator, and the validator cannot be disabled by the agent.

## 2. Logical components

```text
 React dashboard (typed client)
            |
            v
 FastAPI backend  ──────────────┐
   |  experiments, auth, audit  │
   v                            │
 Experiment orchestrator        │
   |                            │
   v                            │
 Experiment runner (industrial) │
   |                            │
   v                            │
 Simulator adapter ──> Open Industry Project (headless sim)
   |                            ^
   | telemetry tags             │ process I/O
   v                            │
 Modbus TCP  <──── OpenPLC Runtime (Modbus master)
   |
   v
 Telemetry collector → validation → PostgreSQL
                                     |
                    ┌────────────────┴────────────────┐
                    v                                 v
              Digital twin                      Trust engine
              (state + energy + residuals) <──────┘
                    |
                    v
              Trust decision (TRUSTED / SUSPECT / UNTRUSTED)
                    |
          ┌─────────┴──────────┐
          v                    v
  MCP agent (tools)     Deterministic optimizer
          |                    |
          └────────> Candidate strategy <──┘
                           |
                           v
                 Independent validator (no LLM, no agent)
                           |
                           v
                 Isolated simulation trial
                           |
                           v
                 Baseline comparison → recommendation
                           |
                           v
                 Human approval → audit log
```

## 3. Deployment view (Phase 0 target)

| Process | Runtime | Why |
|---|---|---|
| `frontend` | Node/Vite dev server (later static build) | Dashboard |
| `backend` | Python 3.12 / FastAPI | API, domain services, orchestration |
| `postgres` | Docker container | Persistence |
| `simulator runner` | Node 24, pinned OIP checkout | OIP ships as a Vite/TS app; its headless `SimWorld` and Modbus server are Node APIs |
| `openplc` | OpenPLC Runtime v4 container | Real IEC 61131-3 runtime and Modbus master |
| `modbus` | TCP 5020 (simulator server) | Remote I/O link |

**Consequence:** the industrial tier is polyglot (Python + Node). The Python backend must
not import OIP internals. It talks to the runner through a narrow, versioned contract
(JSON over stdio or a small HTTP API). This is recorded in ADR-0001.

## 4. Protocol direction (critical)

Upstream Open Industry Project's PLC guide is explicit: the simulator *serves* Modbus TCP
as a remote I/O rack; the PLC *polls* it as master. Therefore:

- simulator = Modbus TCP **server**;
- OpenPLC Runtime = Modbus **client/master**, configured with a remote-I/O device;
- our telemetry collector is a **separate Modbus client** reading the *same* points
  (read-only) or receives samples from the runner; it must never write control points.

This is the opposite of the naive assumption "PLC is a Modbus server and the simulator
polls it". The mapping document and the adapter must encode this direction explicitly.

## 5. Interface contracts (initial)

These are the seams that must be agreed before parallel work. They are deliberately small.

### 5.1 `SimulatorAdapter` (Python protocol; implemented by runner client)

```python
class SimulatorAdapter(Protocol):
    def prepare(self, config: SimulationConfig) -> PreparedRun: ...
    def reset(self, seed: int) -> None: ...
    def start(self) -> None: ...
    def step(self, simulated_seconds: float) -> None: ...
    def stop(self) -> RunOutcome: ...
    def read_tags(self, names: Sequence[str]) -> dict[str, TagValue]: ...
```

Rules:

- `prepare` is idempotent for a given config hash.
- `reset` must produce a verifiable initial state (hash + seed recorded).
- `stop` always returns an outcome, including on abort/timeout.
- Tags are typed (`BOOL`, `INT`, `REAL`) and carry a source timestamp.

### 5.2 Telemetry sample (stored)

Every sample carries: `run_id`, `tag`, `value`, `unit`, `quality`
(`GOOD|UNCERTAIN|BAD`), `source` (`SIMULATOR|PLC|MODEL|DERIVED`), `sim_time_s`,
`wall_time_utc`, `sequence`, `config_hash`. **No unlabelled number is allowed in the
database or UI.**

### 5.3 Experiment lifecycle (backend state machine)

```text
DRAFT → CONFIGURED → QUEUED → RUNNING → COMPLETED
                        |         ├→ ABORTED
                        |         ├→ FAILED
                        |         └→ TIMED_OUT
                        └→ CANCELLED
```

Immutability rule: after `CONFIGURED`, the configuration is frozen; any edit creates a new
version (`config_hash` changes).

### 5.4 Trust decision

```json
{
  "run_id": "...",
  "state": "SUSPECT",
  "score": 0.62,
  "reasons": [{"rule": "residual_power", "tag": "M102.power", "detail": "..."}],
  "evaluated_at_sim_time": 1234.5,
  "model_version": "twin-0.1.0",
  "action": "REQUEST_MORE_DATA"
}
```

The trust engine returns a *decision*, not a boolean. The optimizer consumes
`action`; critical safety invariants are re-checked independently.

### 5.5 Candidate and validation

```json
{
  "candidate_id": "...",
  "setpoints": {"conveyor_speed_mps": 0.8, "mill_load_pct": 65, "packaging_eco_idle": true},
  "predicted_energy_per_unit": 0.41,
  "constraints": {"min_throughput_uph": 50, "max_defect_rate_pct": 4.0},
  "validation": {"accepted": false, "violations": [{"code": "MIN_THROUGHPUT", "detail": "..."}]}
}
```

`predicted_*` values are *estimates*; only the simulation outcome is evidence.

### 5.6 MCP tool boundary

- Tools are read-only except `propose_strategy` and `run_candidate_simulation`, which
  create *requests*, not actuation.
- No tool exposes a register write.
- Every call is logged with arguments, caller, run id and result hash.
- Tool outputs are data, never instructions (prompt-injection boundary).

## 6. Trust boundaries

| Boundary | Crossing | Control |
|---|---|---|
| OT lab ↔ platform | Modbus TCP, read-only collector + PLC master | Isolated Docker network, allow-list, no inbound internet |
| Runner ↔ backend | Versioned JSON contract | Schema validation, timeouts, no shell interpolation |
| Agent ↔ tools | MCP | Allow-list, typed schemas, per-call audit, no permission mutation |
| Human ↔ system | REST/UI | AuthN/AuthZ, approval recorded with actor and reason |
| LLM ↔ evidence | Prompt/response | Structured tool results only; numbers re-derived by code |

## 7. Data model (Phase 1 target, not yet implemented)

`experiment`, `experiment_config` (versioned, hashed), `simulation_run`, `machine`,
`sensor`, `telemetry_sample` (time-series, partitioned by run), `simulation_result`,
`baseline`, `twin_estimate`, `trust_assessment`, `candidate`, `validation_result`,
`recommendation`, `approval`, `audit_event`, `agent_tool_call`.

Key invariants:

- `simulation_run.experiment_config_hash` is immutable.
- `telemetry_sample` is append-only; corrections create new records with a reason.
- `recommendation` references its run, baseline, candidates and trust assessments.
- `audit_event` is append-only and hash-chained (Phase 3+).

## 8. What can be built in parallel (Phase 0–1)

| Workstream | Depends on simulator gate? | Notes |
|---|---|---|
| Backend skeleton, DB schema, experiment lifecycle | No | Can proceed now |
| Typed API client + dashboard wiring | No | Replace mocks incrementally |
| Requirements/API/audit contracts | No | Must be agreed first |
| Energy model (analytical, per machine) | Partly | Needs tag semantics, not the simulator binary |
| Telemetry validation rules | No | Test with synthetic streams |
| Trust engine | Partly | Residual inputs need twin + telemetry |
| Simulator adapter PoC | **Yes** | Blocking for G1/G2 |
| OpenPLC program + Modbus mapping | **Yes** | Blocking for G1 |
| Optimizer/validator | No (design), Yes (evaluation) | Build against a fake plant first |
| Agent/MCP | Blocked by G4 | Do not start |

## 9. Risks recorded at baseline

1. OIP is an early-stage project (public repository first published 2026-10-19) with
   explicit breaking-change warnings. Pinning is mandatory.
2. Its Modbus server and MCP server live in the Electron desktop shell, not a documented
   daemon. Headless Modbus may require a custom Node harness.
3. OpenPLC Runtime v4 has no web UI; program deployment is via the Editor's REST client.
   Reproducible deployment may require the Editor's build toolchain (STruC++).
4. Simulator time is not wall-clock time; mixing "simulated seconds" and "real seconds" is
   the most likely source of invalid repeatability claims.
5. Energy is not emitted by OIP. It must be modelled from tags, and this model is a
   first-class research artefact, not a detail.
