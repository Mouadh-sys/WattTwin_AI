# Modbus TCP signal map (DRAFT — not yet validated)

Status: **proposal for the Phase 0 feasibility loop.** No row in this document is
"verified" until the loop in `simulator-feasibility.md` runs and the addresses are read
back from the PLC.

## 1. Direction — the inversion that matters

Open Industry Project exposes the scene as a **Modbus TCP server** (an I/O rack). The PLC
polls it as **master**. This is stated by the upstream guide and implemented in
`src/plc/link/modbusServer.ts` + `scripts/lib/modbus-tcp-listen.mjs`.

```text
OpenPLC Runtime  (Modbus master, polls)
        │  FC2 read discrete inputs   ── sensors, buttons
        │  FC4 read input registers   ── analog measurements
        │  FC5/15 write coils         ── actuators
        │  FC6/16 write holding regs  ── analog setpoints
        ▼
Simulator (Modbus TCP server, 127.0.0.1:5020)
```

The telemetry collector is a second, **read-only** Modbus client. It must not be given a
write path in production code; tests may use a separate tool.

## 2. Address derivation (upstream rule)

The scene's `%I/%Q` addresses *are* the map; there is no separate mapping table:

| IEC address | Modbus area | Protocol address | Function |
|---|---|---|---|
| `%IXb.n` | Discrete input | `b×8 + n` | FC2 |
| `%QXb.n` | Coil | `b×8 + n` | FC5 / FC15 |
| `%IWn` | Input register | `n` | FC4 |
| `%QWn` | Holding register | `n` | FC6 / FC16 |
| `%IDn` | Input registers | `2n`, `2n+1` | FC4 (REAL/DINT, **low word first**) |
| `%QDn` | Holding registers | `2n`, `2n+1` | FC16 (REAL/DINT, low word first) |

Protocol addresses are **0-based**. Engineering tools that display 1-based labels show
discrete input 0 as `10001`. Unit/slave id: `1` (the simulator ignores it, but the PLC
configuration must match).

## 3. Phase 0 minimal line (proposed)

Scene: infeed belt `Belt1`, outfeed belt `Belt2`, entry photo-eye `Eye1`, exit photo-eye
`Eye2`, box spawner. PLC program: start/stop latch, both belts run, stop on exit eye jam
condition (minimal diagnostic logic).

### 3.1 Discrete inputs — simulator → PLC (FC2, read-only)

| IEC | Protocol addr | Signal | Type | Unit | Meaning | Written by |
|---|---|---|---|---|---|---|
| `%IX0.0` | DI 0 | `Eye1` | BOOL | — | Box present at infeed transfer | Simulator (physics) |
| `%IX0.1` | DI 1 | `Eye2` | BOOL | — | Box present at outfeed discharge | Simulator (physics) |
| `%IX0.2` | DI 2 | `StartPB` | BOOL | — | Start pushbutton | Simulator (operator panel) |
| `%IX0.3` | DI 3 | `StopPB` | BOOL | — | Stop pushbutton (normally closed logic in PLC) | Simulator (operator panel) |

### 3.2 Coils — PLC → simulator (FC5/FC15)

| IEC | Protocol addr | Signal | Type | Unit | Meaning | Read by |
|---|---|---|---|---|---|---|
| `%QX0.0` | CO 0 | `Belt1Run` | BOOL | — | Infeed belt motor run | Simulator part behaviour |
| `%QX0.1` | CO 1 | `Belt2Run` | BOOL | — | Outfeed belt motor run | Simulator part behaviour |
| `%QX0.2` | CO 2 | `AlarmBeacon` | BOOL | — | Stack light / fault indication | Simulator lamp |

### 3.3 Input registers — simulator → PLC (FC4, read-only)

| IEC | Protocol addr | Signal | Type | Scaling | Unit | Meaning |
|---|---|---|---|---|---|---|
| `%IW0`/`%ID0` | IR 0–1 | `Belt1Speed` | REAL | IEEE-754, low word first | m/s | Measured belt linear speed |
| `%IW2`/`%ID2` | IR 2–3 | `Belt2Speed` | REAL | IEEE-754, low word first | m/s | Measured belt linear speed |
| `%IW4` | IR 4 | `UnitsProduced` | INT | 1 count | units | Cumulative units discharged (PLC-visible mirror) |
| `%IW5` | IR 5 | `DefectCount` | INT | 1 count | units | Cumulative non-conforming units |

> Note: OIP does not emit `UnitsProduced` natively. It will be produced by our runner's
> flow/probe logic or by the PLC program counting `Eye2` edges. The chosen source must be
> recorded; do not present a modelled counter as a measurement.

### 3.4 Holding registers — PLC → simulator (FC6/FC16)

| IEC | Protocol addr | Signal | Type | Scaling | Unit | Meaning |
|---|---|---|---|---|---|---|
| `%QW0`/`%QD0` | HR 0–1 | `SpeedSetpoint` | REAL | IEEE-754, low word first | m/s | Requested belt speed |
| `%QW2` | HR 2 | `EcoIdleEnable` | BOOL (0/1) | — | — | Packaging/auxiliary eco-idle request |
| `%QW3` | HR 3 | `ScenarioMarker` | INT | — | — | Test/attack marker (never used in normal runs) |

**Constraint:** the optimizer's decision variables are *not* raw registers. It proposes
values; the backend converts them to a validated setpoint request; only an approved
strategy may write holding registers, and only through the PLC program's normal logic.
The agent has no register-write tool.

## 4. Energy and power (our model, not OIP)

OIP simulates kinematics, not electrical power. Power and energy are **model outputs**:

```text
P_machine(t) = P_idle + P_run(state) + k_speed · v(t) + k_load · load(t) + P_aux
E_total      = ∫ P_total(t) dt
E_per_unit   = E_total / N_conforming
```

Every such value is stored with `source = MODEL` and `model_version`. The UI and API must
never label it "measured". Calibration constants live in a versioned config file and are
part of the experiment configuration hash.

For the Phase 0 loop, the runner emits modelled power as **derived telemetry** (not as a
Modbus register yet), to avoid pretending the PLC can see it.

## 5. Quality and error handling

| Condition | Collector behaviour | Trust effect |
|---|---|---|
| TCP connect refused | Retry with backoff; mark run `DEGRADED`; after timeout `FAILED` | No data → UNTRUSTED |
| Read timeout | One retry, then gap with `quality=BAD` | Freshness rule |
| Illegal address / exception response | Fail the run, record function code + address | Configuration error |
| Value outside engineering range | Store raw value + `quality=UNCERTAIN` | Range rule |
| Stale timestamp (> 3 × poll period) | Store with `quality=BAD` | Freshness rule |
| Word order mismatch (REAL) | Detected by plausibility bounds; fail fast | Configuration error |

Poll period for Phase 0: **100 ms** on the simulator side, **50 ms** PLC remote-I/O poll;
these are starting values, measured and tuned during G1. The collector must record the
actual inter-sample interval, not assume it.

## 6. OpenPLC deployment note

Runtime v4 has no web UI. A program and its remote-I/O device are built by the OpenPLC
Editor toolchain and uploaded via the runtime REST API (port 8443). The compiled bundle
must be committed or reproducibly built; "someone clicked Deploy" is not reproducible.
The Editor commit and STruC++ version are pinned in `configurations/versions.lock.json`.

## 7. Open questions

1. Does OIP's Modbus server coalesce overlapping requests or require one point per read?
2. What is the measured end-to-end latency from a coil write to the actuator changing, and
   from a sensor edge to the PLC seeing it? (One poll + one scan, per upstream.)
3. Are REAL values low-word-first in every OIP version, or an implementation detail that
   needs a contract test?
4. Can the runner expose a *deterministic* tag trace with timestamps, or only end-of-run
   assertions? This determines whether telemetry can be time-series rather than snapshots.
