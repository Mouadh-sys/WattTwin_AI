# Requirements baseline

Source: `WattTwin_AI_cahier_de_charge.pdf`, version 1.0, 12 October 2026
(NexaForge Industrial Intelligence; authors M. Boukari, L. Nooman, R. Menzli;
supervisor Mme L. Bousbia). Status: *Spécification initiale*.

This file is a faithful engineering extraction, not a replacement for the source. Page
numbers refer to the PDF. If this summary and the PDF disagree, the PDF wins and this file
must be corrected.

## 1. Scope (p. 4)

In scope (MVP):

- one virtual production line of limited complexity (conveyor/sorting assumption, Annex A);
- OpenPLC + Modbus TCP exchange with the simulator;
- telemetry collection, validation and storage;
- explainable digital twin and energy model;
- deterministic optimisation and baseline comparison;
- MCP agent with least-privilege tools;
- three simulated OT attack scenarios and defences;
- human approval and audit trail.

Out of scope: real plant/PLC connection, autonomous physical actuation, industrial
certification, high-fidelity plant physics, RL in production, unrestricted agent access to
PLC registers or the OT network, intrusive tests on third-party systems (p. 4).

## 2. Actors (p. 6)

| Actor | Responsibility |
|---|---|
| System administrator / engineer | Environment, connections, profiles, allowed settings |
| Process / energy engineer | Baseline, energy objectives, production constraints, result analysis |
| Operator / approver | Reviews, accepts or rejects a strategy with a justified decision |
| AI agent | Plans investigation, calls only authorised MCP tools, never commands the PLC |
| Optimisation engine | Generates bounded candidates from explicit objectives |
| Independent validator | Checks constraints and blocks non-conforming candidates |
| Auditor / academic evaluator | Inspects experiments, evidence, metrics and audit logs |

## 3. Functional requirements (p. 6–7)

| ID | Pri. | Requirement | Verification idea |
|---|---|---|---|
| F-01 | Must | Create, configure, start, stop and inspect a uniquely identified experiment | API + UI lifecycle test |
| F-02 | Must | Load a versioned configuration of process, baseline, parameters and scenario | Config hash stored per run |
| F-03 | Must | Initialise/reset the simulator to a controlled initial state before each trial | Repeatability test |
| F-04 | Must | Execute PLC logic and exchange defined signals over Modbus TCP | Loop-back integration test |
| F-05 | Must | Collect measurements, states, timestamps and events with provenance | Telemetry schema test |
| F-06 | Must | Validate schema, ranges, freshness, missing values, abnormal rates | Unit tests per rule |
| F-07 | Must | Estimate process state and energy consumption with the digital twin | Model tests vs synthetic truth |
| F-08 | Must | Compute residuals and track model uncertainty | Residual test |
| F-09 | Must | Assign TRUSTED / SUSPECT / UNTRUSTED per datum | Trust engine tests |
| F-10 | Must | Block or limit optimisation when trust is insufficient | Gate test |
| F-11 | Must | Generate candidate strategies deterministically | Optimizer tests |
| F-12 | Must | Independently verify safety limits, minimum throughput, quality | Validator rejection tests |
| F-13 | Must | Evaluate each candidate in a controlled simulation comparable to baseline | Runner integration test |
| F-14 | Must | Compare total energy, energy/unit, throughput, quality, duration, violations | Comparison report test |
| F-15 | Must | Present recommendation with assumptions, metrics, limits, evidence | Schema + UI |
| F-16 | Must | Require human approval/rejection and record the decision | Approval workflow test |
| F-17 | Must | Keep a timestamped audit log of experiments, tool calls, decisions | Audit chain test |
| F-18 | Should | Agent orchestrates tools via MCP with allow-list and validated params | Agent security tests |
| F-19 | Should | Run sensor falsification, twin poisoning, agent manipulation scenarios | Attack harness |
| F-20 | Should | Provide dashboards and exportable reports | UI + export test |
| F-21 | Could | Compare several optimisation algorithms or energy models | Benchmark |
| F-22 | Could | Architecture ready for future read-only real sensors/equipment | ADR + adapter boundary |

## 4. Business rules (p. 7)

- An experiment is immutable once started; a change creates a new version or experiment.
- Comparisons use comparable load, initial state, simulated duration and conditions.
- SUSPECT data triggers investigation or additional collection; UNTRUSTED blocks the
  affected optimisation.
- The trust score never replaces safety rules: critical constraints are checked by an
  independent component.
- A rejected candidate keeps its rejection reason in results and audit.
- The agent cannot change its permissions, disable controls, or write PLC registers.
- Human approval authorises only an action inside the simulated MVP scope.

## 5. Non-functional requirements (p. 8)

Security: authentication, role separation, secrets out of code, strict input validation,
logging. OT security: isolated environment, explicitly allowed exchanges, no command to
physical equipment. Safety: limits independent of the agent, safe stop/fallback on
untrusted data, communication loss or invalid candidate. Reliability: communication error
and timeout handling, controlled recovery, explicit status for interrupted experiments.
Reproducibility: per trial, store configuration, simulator version, commit, dependencies,
random seed, PLC parameters and scenario. Performance: measured simulation/optimisation
durations. Maintainability: decoupled modules, documented API, automated tests, external
configuration, pinned versions. Usability: configure, understand KPIs, compare, decide.
Traceability: every recommendation links to its data, baseline, tested candidates and human
decisions.

## 6. Trust model (p. 9)

Minimum inputs: freshness, missing values, schema conformity, plausible physical limits,
rate of change, cross-sensor consistency, digital-twin residuals. Thresholds documented
and calibrated on normal and perturbed trials.

| State | Meaning | Expected behaviour |
|---|---|---|
| TRUSTED | Coherent and fresh enough per configured rules | Optimisation allowed under constraints |
| SUSPECT | Inconsistency/uncertainty needing confirmation | Suspend affected optimisation or request more data |
| UNTRUSTED | Confirmed corruption, insufficient freshness or critical anomaly | Block optimisation and apply defined fallback |

## 7. OT attack scenarios (p. 10)

| Scenario | Controlled injection | Expected defence evidence |
|---|---|---|
| A1 Sensor falsification | Biased, frozen, out-of-range or inconsistent values in the simulated stream | Range/freshness checks, residuals, trust state, optimisation block; detection and false-positive measurement |
| A2 Digital twin poisoning | Controlled modification of calibration parameters or reference data | Versioning, parameter integrity, drift detection, reference comparison, recalibration procedure |
| A3 Agent manipulation | Malicious instruction or forged tool result pushing a dangerous strategy or bypassing rules | Authenticated MCP, allow-list, schema validation, least privilege, outputs treated as untrusted, independent constraints |

All attacks are synthetic and occur only in the isolated virtual lab.

## 8. Objective and KPIs (p. 10–11)

`min E_total / N_conforming_units` subject to: throughput ≥ minimum, defect rate ≤ maximum,
machine parameters within bounds, no safety-invariant violation. Penalties may discourage
excessive setpoint changes or downtime.

KPIs: total energy (kWh simulated); energy per conforming unit; throughput; quality
(conforming/non-conforming); relative energy gain
`(E_base/unit − E_cand/unit) / (E_base/unit) × 100`; constraint violations (count and
severity); data-trust distribution and reasons; detection rate, false positives and
detection delay per scenario; execution cost (simulation duration, optimisation time,
number of agent tool calls).

## 9. Acceptance criteria (p. 11)

1. A complete experiment can be created, executed, stopped and inspected, with its ID and
   configuration retained.
2. The simulated process is driven by OpenPLC through the documented Modbus mapping.
3. Data and results needed for the KPIs are stored and exportable.
4. Baseline and candidate trials share comparable initial conditions and load.
5. Optimisation is blocked on UNTRUSTED data; SUSPECT follows the defined behaviour.
6. The independent validator rejects every candidate designed to violate the tested
   constraints.
7. The three attack scenarios are demonstrated and defence effectiveness is quantified.
8. Results clearly separate simulation, estimation and real measurement; no real saving is
   claimed without physical validation.

## 10. Milestones (p. 13)

| Gate | Evidence | Decision |
|---|---|---|
| G1 Integration | Virtual scene driven by OpenPLC over Modbus; mapping verified | Keep Open Industry Project or activate the alternative |
| G2 Repeatability | Reset trials, versioned configuration, comparable results | Authorise twin and optimizer development |
| G3 Trustworthy data | Telemetry stored; residuals and trust states tested | Authorise conditional optimisation |
| G4 Safe optimisation | Candidates evaluated, independent constraints, baseline comparison | Authorise agent orchestration |
| G5 Final evaluation | Three attack scenarios, KPIs, reports, reproducible demo | Validate prototype |

## 11. Explicit hypotheses to confirm during framing (Annex A, p. 14)

- The simulated process is a conveyor/sorting line, simple but with distinct machine states
  and conforming/non-conforming units.
- Open Industry Project is retained only if the prototype confirms headless execution,
  controlled initialisation, signal collection and OpenPLC integration.
- If lifecycle automation or repeatability is insufficient, CoppeliaSim is evaluated as the
  alternative **before** advanced implementation.
- Energy gains come from a simulated power model, not physical measurements.
- The system is demonstrated in an isolated lab; no production OT network connection.

## 12. Known ambiguities (to resolve by ADR, not assumption)

1. "Open Industry Project headless" is not defined by the source document. The current
   upstream project is a TypeScript/three.js app with an Electron desktop shell; the
   project must define precisely which execution mode satisfies F-03/F-13.
2. The source assumes a Modbus exchange but not its direction. Upstream OIP exposes the
   scene as a Modbus **server** (remote I/O); OpenPLC must therefore be the Modbus
   **master**, configured as a remote-I/O device. This inversion is significant and is
   recorded in ADR-0002.
3. The energy model has no specified physical fidelity. It must be explicit, versioned and
   calibrated on synthetic scenarios, and labelled *modelled*.
4. Authentication/role model is required but the prototype's deployment (single machine,
   no external users) must still define concrete roles and boundaries.
