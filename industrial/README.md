# Industrial tier

This folder owns everything between the application and the simulated plant:

```text
simulator_adapter/   contract + (later) the headless Node runner
openplc/             IEC 61131-3 program sources, deployment procedure
modbus/              register map, client/server notes, test tools
scenarios/           versioned production scenarios (load, seed, duration)
configurations/      pinned versions, images, hashes
experiment_runner/   run lifecycle: prepare → reset → start → collect → stop
```

## Non-negotiable rules

1. The simulator is the **Modbus TCP server** (remote I/O rack). OpenPLC is the **master**.
2. The collector reads process data read-only. It never writes coils/holding registers.
3. Every run is identified by a configuration hash and a random seed.
4. Simulated seconds and wall-clock seconds are different quantities and must be labelled.
5. Nothing here is claimed to work until `docs/integration/simulator-feasibility.md`
   records the command and its output.

## Phase 0 status

See `docs/integration/simulator-feasibility.md`. The upstream simulator is pinned; do not
track `main` directly.
