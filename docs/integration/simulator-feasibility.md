# Simulator feasibility report (Phase 0 gate)

Gate owner: Student A (OT) with Student B (platform)
Started: 2026-10-30
Status: **PROVISIONAL PASS at stack level — project-level gate OPEN**

This document is the evidence record for the first major milestone. A row is only marked
PASS if the command is reproducible and its output is shown. Anything else is UNKNOWN.

Environment: Pop!_OS 24.04 LTS, 8 vCPU, 15 GiB RAM, Node 24.14.0, Python 3.12.3,
Docker 29.1.3, no display server used for any check below.

Pinned simulator: `Open-Industry-Project/Open-Industry-Project@dcebf5312c3c6d8aa141bb5786bb58545f3c1675`
(2026-10-29). Pinned PLC image: `ghcr.io/autonomy-logic/openplc-runtime` digest
`sha256:2ca9fc61…` reporting **v4.3.1**.

---

## 1. What the source document requires

The cahier des charges (Annex A / gate G1–G2) requires OIP to demonstrate:

1. headless execution;
2. controlled initialisation/reset;
3. programmatic start/stop and time control;
4. configure process parameters and initial conditions;
5. programmatic telemetry extraction;
6. OpenPLC communication over Modbus TCP;
7. repeatable experiments with controlled initial conditions;
8. automatic result collection and comparison.

## 2. Upstream facts established before testing

These come from the pinned source tree and official documentation, not from assumptions.

| # | Fact | Evidence |
|---|---|---|
| U1 | Browser/Electron TypeScript app; three.js + Jolt WASM | repo tree, `package.json` |
| U2 | Modbus TCP server needs the desktop app; a browser tab cannot open a port | official Modbus guide |
| U3 | Headless Node tooling exists: `test-project`, `validate-project`, `check-wiring`, `assign-io`, `check-flow`, `bench-sim` | `docs/cli.md`, `docs/project-tests.md` |
| U4 | Headless runner steps real `SimWorld` + ST engine with no rAF/worker/wall clock | `docs/sim-clock.md` |
| U5 | Simulator is the Modbus **server**; PLC is master | official guide, `src/plc/link/modbusServer.ts` |
| U6 | Upstream has a real OpenPLC v4 in-the-loop harness, including analog REALs both ways | `scripts/openplc-loop.mjs` |
| U7 | That harness builds `program.zip` with OpenPLC Editor sources pinned at `13fee913…` and STruC++ | `scripts/lib/openplc-editor.mjs` |
| U8 | OIP emits no power/energy signal | source/API review; no energy tag in catalog |
| U9 | Project is early-stage and warns of breaking changes | `README.md`, first public release 2026-10-19 |
| U10 | The desktop app also exposes an MCP server on 127.0.0.1:5189 — unrelated to our agent's MCP tools | `docs/agent-tools.md` |

## 3. Test log

### V1 — Headless scene execution and embedded PLC (PASS)

```bash
cd <pinned oip checkout>
npm install                       # 693 packages, ~730 MB, 4 min
npm run test-project -- examples/projects/start-stop-motor
```

Observed exit code: **0**. All 4 tests passed, including fault and comms-loss cases.
This proves items 1, 3 (stepped in simulated time) and 5 (tag assertions) at the
*in-process* level. It does **not** prove Modbus or reset semantics.

Representative output:

```text
✓ start-stop.test.json - "Start/stop seal-in latches and unlatches the motor" (2s)
    ✓ Running = false at t=0.2s
    ✓ Running reached = true at t=0.53s
✓ motor-fault.test.json - "A motor that stops responding trips MotorFault ..." (4.5s)
✓ all 4 test(s) passed
```

### V2 — OpenPLC Runtime v4 starts without a GUI (PASS)

```bash
docker run -d --name watttwin-openplc \
  -p 127.0.0.1:8443:8443 -p 127.0.0.1:502:502 \
  --cap-add=SYS_NICE --cap-add=SYS_RESOURCE \
  -v watttwin-openplc-data:/var/run/runtime \
  ghcr.io/autonomy-logic/openplc-runtime:latest

curl -sk https://127.0.0.1:8443/api/version
# {"version":"v4.3.1"}
```

The container also ships `modbus_master`, `modbus_slave` and `opcua` plugins. No web UI
exists in v4; program deployment is via the REST API (Editor normally drives it).

### V3 — Headless sim ↔ real OpenPLC over Modbus TCP (PASS)

Command:

```bash
OPENPLC_URL=https://127.0.0.1:8443 OPENPLC_USER=openplc OPENPLC_PASSWORD=openplc \
OIP_MODBUS_PORT=5020 npm run openplc-loop
```

First attempt **failed with 0 Modbus requests**. The runtime was started with published
ports (`-p 8443:8443`); inside that container `127.0.0.1:5020` is the container loopback,
not the host where the headless sim listened. Root cause was network topology, not the
protocol. Re-running the runtime with `--network host` produced a full pass:

```text
program:   built by the editor with STruC++ v0.6.7, 35 files in program.zip
runtime:   OpenPLC v4.3.1, uploaded and built in 2.1 s
wiring:    %QX100.0 = coil 800, %IX100.0 = discreteInput 800,
           %QD100 = holdingRegister 200, %ID100 = inputRegister 200
master requests: FC2 x500, FC4 x500, FC15 x500, FC16 x500
OpenPLC:   belt on 0.02 s, eye 5.52 s, belt off 5.57 s, box at x = 2.824 m
analog:    REAL speed 0.5 then 0.3 m/s arrived correctly; laser 0.376 m
checks:    9/9 ok, exit 0
```

Measured PLC-induced differences versus the in-process program on the same case:

| Quantity | In-process | OpenPLC | Delta |
|---|---|---|---|
| Belt start | 0.03 s | 0.02 s | −10 ms |
| Box reaches eye | 5.57 s | 5.52 s | −50 ms |
| Belt stops after eye | 17 ms | 50 ms | +33 ms |
| Final box position | 2.818 m | 2.824 m | +6–7 mm |
| Worst sim step lag | — | 20 ms | measured |

The stop-latency difference is consistent with one Modbus poll + one PLC scan. **This is
not determinism**: it is quantified, bounded timing variability and must be reported as
such.

**Proves:** headless Modbus server, real OpenPLC master, FC2/FC4/FC15/FC16, REAL word
order (low word first), deployment via REST API + Editor toolchain, process response to
PLC outputs.

**Does not prove:** our line, our PLC program, reset semantics, time-series telemetry.

### V4 — Repeatability (PASS within measured tolerance, 4 runs)

The V3 command was run four times on the same machine, including while other builds were
running. Results are repeatable but **not identical** — which is the honest finding:

| Run | Belt on | Eye | Belt off | Final x | Stop latency | Worst step lag |
|---|---|---|---|---|---|---|
| 1 | 0.02 s | 5.52 s | 5.57 s | 2.824 m | 50 ms | 20 ms |
| 2 | 0.02 s | 5.52 s | 5.57 s | 2.824 m | 50 ms | 20 ms |
| 3 | 0.02 s | 5.52 s | 5.58 s | 2.829 m | 67 ms | 26 ms |
| 4 | 0.02 s | 5.53 s | 5.58 s | 2.826 m | 50 ms | 24 ms |

Observed spread: **≤10 ms** on event times, **≤5 mm** on final position, **17 ms** on stop
latency, under light-to-moderate host load. The in-process reference was stable at
0.03 / 5.57 / 5.58 s and 2.818 m.

Interpretation: the simulation step is deterministic for a fixed input trace, but the
**OpenPLC loop is wall-clock coupled**. Load changes the lag and therefore the millisecond
at which the PLC samples. This is exactly the variability the cahier des charges asks us to
measure separately (NFR Reproducibility). Experiments must use tolerances and repeated
trials, not single-run exact comparisons.

### V5 — Reset semantics

Status: **UNKNOWN.** The harness re-prepares a fresh world per invocation, which is one
valid reset strategy (process restart). In-process reset without restarting the runner is
untested. Both strategies must be documented before experiments are automated.

### V6 — Parameterisation and telemetry export

Status: **PARTIAL.** `test-project` takes declarative JSON (duration, inputs, checks) and
`--json` emits a machine-readable result. It does **not** emit a time-series trace by
default. A dedicated runner script will be needed to stream tags at a fixed sim rate.
Treat "telemetry" as *not solved* until that script exists.

### V7 — Energy measurability

Status: **FAIL (by design of the simulator).** OIP has no electrical power model. Energy
must be computed by WattTwin's model from machine states/speeds/loads, labelled `MODEL`.
This is not a simulator defect, but it invalidates any plan that expected energy tags.

## 4. Gate checklist (live)

| # | Requirement | Status | Note |
|---|---|---|---|
| 1 | Headless execution | **PASS (V1)** | No display; 4/4 tests |
| 2 | Controlled init/reset | PARTIAL (V5) | Fresh world per process; in-process reset untested |
| 3 | Programmatic start/stop/step | **PASS (V3)** | PLC start/stop and sim stepping headless |
| 4 | Configure params/initial conditions | PARTIAL (V6) | Project/test JSON; our line params not yet exercised |
| 5 | Telemetry extraction | PARTIAL (V6) | Assertions + `--json`; no time-series trace |
| 6 | OpenPLC over Modbus | **PASS (V3)** | 500 requests per FC; REAL both ways |
| 7 | Repeatability | **PASS within tolerance (V4)** | 4 runs; ≤10 ms / ≤5 mm; not bit-exact |
| 8 | Automatic result collection | PARTIAL | `--json` exists; no persisted run artefact |

**Gate verdict: PROVISIONAL PASS at stack level. The project-level gate remains OPEN**
until the same evidence is produced for *our* line, our PLC program, our Modbus map and
our telemetry exporter. Do not mark G1/G2 closed yet; do start Phase 1 backend work in
parallel, because the architectural risk it depended on is now retired.

## 5. Risks made concrete by this investigation

1. **Network topology is a correctness issue.** A published-port container silently
   produced 0 Modbus traffic; the PLC looked "RUNNING" the whole time. Any experiment
   runner must assert that telemetry actually arrived (non-zero request counters + fresh
   samples), not just that the PLC process is alive.
2. **Desktop-only Modbus is avoidable.** The headless Node path works; the Electron app is
   not required for experiments. This retires the largest gate risk.
3. **Editor toolchain dependency is real but reproducible.** Building `program.zip` pulled
   Editor sources (pinned `13fee913…`) and STruC++ **v0.6.7**, completed in ~2 s once
   cached. These must be pinned and cached in the repo/CI.
4. **`latest` image.** Runtime is pinned only by digest right now. Replace with
   `@sha256:2ca9fc61…` in evaluation runs.
5. **No energy signal.** Energy is a model output, not a simulator readout.
6. **Upstream is early-stage.** Every bump re-runs V1–V5.

## 6. Decision

**Provisionally accept ADR-0002**: retain OIP, drive it headlessly through the Node
industrial runner, keep OpenPLC as Modbus master. The stack-level uncertainties (headless
execution, Modbus direction, REAL encoding, deployment, repeatability) are resolved with
evidence.

Conditions before the gate is fully closed:

- reproduce V3/V4 on **our** conveyor/sorting line and **our** PLC program;
- implement the telemetry trace exporter (fixed sim-time sampling, quality flags);
- document and test reset both ways (fresh world and in-place reset);
- record immutable pins for the OIP commit, runtime digest, Editor commit and STruC++.

If any condition fails, invoke the fallback ladder in ADR-0002 with the specific failure.
