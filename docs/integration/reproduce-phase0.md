# Reproducing the Phase 0 stack evidence

This runbook reproduces V1–V4 of `simulator-feasibility.md` on a Linux machine. It runs
the **upstream conveyor case**, which is a stack test, not yet WattTwin's own line.

## Prerequisites

| Tool | Version verified | Notes |
|---|---|---|
| Linux | Pop!_OS 24.04 | `--network host` is Linux-only |
| Node.js | 24.14.0 | OIP requires `>=24` |
| npm | bundled with Node | ~730 MB of dependencies |
| Docker | 29.1.3 | runtime image ~981 MB |
| curl | any | runtime API check |
| Python | 3.12 | reads the pin file; backend tests |

Ports: `8443` (OpenPLC REST) and `5020` (simulator Modbus server) must be free.

## Steps

```bash
# 1. Pin file is the single source of versions
cat industrial/configurations/versions.lock.json

# 2. Clone OIP at the pinned commit, install, run headless smoke test
./scripts/phase0/bootstrap_simulator.sh

# 3. Start OpenPLC Runtime v4 at the pinned image digest, host networking
./scripts/phase0/start_openplc.sh

# 4. Run V1 + V3/V4 twice; logs land in artifacts/phase0/
./scripts/phase0/verify_stack.sh

# 5. Stop the runtime when done (named volume is kept)
./scripts/phase0/stop_openplc.sh
```

Expected: V1 prints `all 4 test(s) passed`; each loop run prints
`The program behaves the same on OpenPLC as in the simulator.` and exits 0.

## Verified result (2026-10-30)

```text
V1  exit 0, 4/4 tests
V3  exit 0, 9/9 checks
    FC2 x500, FC4 x500, FC15 x500, FC16 x500 over 10 s wall clock
    belt on 0.02 s, eye 5.52 s, belt off 5.57 s, box x = 2.824 m
    stop latency OpenPLC 50 ms vs in-process 17 ms
V4  4 runs: event times within 10 ms, final position within 5 mm,
    stop latency 50–67 ms, worst step lag 20–26 ms (wall-clock coupled)
```

## Troubleshooting (learned the hard way)

### The PLC says RUNNING but no Modbus requests arrive

Most likely cause: **network namespace**. With `docker run -p 8443:8443`, the runtime
inside the container resolves `127.0.0.1` to itself. The headless sim listens on the host
loopback. The PLC polls nothing and still reports `RUNNING`.

Fix: run the runtime with `--network host` (as the script does), or make the sim bind
`0.0.0.0` and configure the PLC's remote device with the host gateway address. Never
diagnose this as "the PLC program is wrong" before checking the request counters.

### The OpenPLC account already exists

The first successful deployment creates an admin account (`openplc` / `openplc` in the
harness). The named volume `watttwin-openplc-data` persists it. If the password was
changed, export `OPENPLC_USER` / `OPENPLC_PASSWORD` before `verify_stack.sh`.

### Port 8443/5020 already in use

Stop the previous container (`./scripts/phase0/stop_openplc.sh`) or another service using
the port. Do not change only one side of the Modbus port configuration.

### Build fails while fetching the Editor toolchain

The harness downloads OpenPLC Editor sources at commit `13fee913…` and installs STruC++
`v0.6.7`. First run needs network; later runs use `.work/` caches. If GitHub is
unreachable, use `--offline` only when the cache is warm.

### Reset between runs is a process restart

The harness prepares a fresh world per invocation. That is a valid reset strategy for
repeatability, but **in-process reset is not yet proven**. Do not describe the runner as
"resetting the line" until P0-08b implements and tests it.

## What this does NOT prove

- WattTwin's own line, PLC program, register map or energy model.
- Time-series telemetry (only assertions and end-of-run metrics).
- Cross-machine determinism (upstream does not claim bit-exactness).
- Behaviour under attack injection.
