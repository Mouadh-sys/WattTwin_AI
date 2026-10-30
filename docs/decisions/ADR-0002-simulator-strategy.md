# ADR-0002 — Simulator execution strategy and the Phase 0 gate

- **Status:** **Provisionally accepted** — stack-level evidence pass (V1–V4); project-level
  gate open until our own line, PLC program and telemetry exporter reproduce it
- **Date:** 2026-10-30
- **Deciders:** Student A (OT), Student B (platform), technical lead
- **Related:** F-03, F-04, F-13, NFR Reproducibility, Annex A hypothesis 2, gate G1/G2
- **Supersedes:** none

## Context

The cahier des charges selects **Open Industry Project (OIP)** as the virtual process and
requires headless execution, controlled initialisation, signal extraction and OpenPLC
integration. It also states that OIP is retained *only if* a prototype confirms these
capabilities, and that CoppeliaSim is the fallback to evaluate otherwise.

Upstream evidence gathered on 2026-10-30 (see
`docs/integration/simulator-feasibility.md` for the full evidence table):

- OIP is MIT-licensed and actively developed, but **young**: the current repository was
  first published 2026-10-19 and explicitly warns of breaking changes.
- It is a **browser/Electron** application (TypeScript, three.js, Jolt WASM). The
  documentation states that a browser tab cannot open a network port; **Modbus TCP
  serving requires the desktop app**.
- It nonetheless ships **headless Node tooling**: `npm run test-project` steps the real
  `SimWorld` + embedded ST engine with no browser, no worker and no wall clock; there are
  CLIs for scene authoring, project validation, wiring, I/O assignment and a headless
  Modbus TCP server (`src/plc/link/modbusServer.ts` + `scripts/lib/modbus-tcp-listen.mjs`).
- Upstream's own `npm run openplc-loop` harness runs a **real OpenPLC Runtime v4** polling
  a **headless** sim over **Modbus TCP**, and asserts that the PLC's behaviour matches the
  in-process program. It depends on OpenPLC Editor sources (pinned commit) and STruC++ to
  build `program.zip`, and on a runtime reachable via `OPENPLC_URL`.
- OIP does **not** emit energy or power. Energy must be computed by our model from tags.
- The simulator is the Modbus **server**; OpenPLC is the Modbus **master**.

So the question is not "can OIP run headlessly?" (upstream does it in CI), but "can *we*
reproducibly drive our line, deploy our PLC program, collect tags and energy inputs, reset,
and repeat — on this machine, from our Python stack?"

## Decision (proposed)

1. **Retain OIP as the primary simulator**, pinned to a commit, executed only through its
   headless Node path. Do not depend on the Electron GUI for experiments.
2. Build the **industrial runner** as a thin Node process around OIP's own headless APIs
   (project-test runner / `SimWorld` + `ModbusServerIo`), exposing the `SimulatorAdapter`
   contract (ADR-0001). Do not fork OIP physics.
3. Run the Phase 0 gate with a **minimal line**: infeed conveyor, photo-eye, outfeed
   conveyor (and a diverter only if G1 passes early). Prove reset, two identical runs,
   tag collection, Modbus traffic, and OpenPLC-in-the-loop behaviour.
4. If the gate fails on a *specific* requirement, record the failed requirement and
   evaluate the fallback ladder below **before** writing advanced application code.
5. Energy is **modelled** from state/speed/load tags and is always labelled `MODEL`, never
   `MEASURED`.

## The gate (pass criteria)

| # | Requirement | Pass condition |
|---|---|---|
| G1.1 | Headless execution | A documented command runs the scene without a display server |
| G1.2 | Controlled init/reset | Two runs from the same config + seed start from the same state hash |
| G1.3 | Programmatic start/stop/step | No GUI interaction in the experiment path |
| G1.4 | Parameterisation | Speed/load/spawn rate configurable from a versioned file |
| G1.5 | Tag extraction | Named tags + timestamps exported to a machine-readable file |
| G1.6 | OpenPLC over Modbus | Runtime v4 polls the sim; PLC output changes the process |
| G1.7 | Repeatability | Two trials compared; numeric tolerance and observed dispersion reported |
| G1.8 | Timing measured | Modbus/PLC latency and jitter reported separately from sim variability |

Failure of G1.6 with all others passing is a *partial* pass: the simulator is usable for
twin/optimizer work, but G1 is not closed and the OpenPLC path needs a workaround.

## Fallback ladder (do not skip a rung)

1. **OIP headless + our own Node Modbus bridge** (recommended fallback). Keeps OIP physics
   and visuals; only the transport harness is ours. Effort: 1–3 days. Risk: medium.
2. **OIP for visual demonstration + a deterministic Python plant model for experiments.**
   Same adapter interface; experiments no longer use OIP physics. This is a *significant*
   requirement change (F-04 loses its real simulator target) and needs supervisor approval.
3. **CoppeliaSim** (as named in the cahier des charges). Effort: 1–2 weeks and a new
   adapter; Python API, headless (`-h`), but scene/PLC/Modbus work must be redone.
   Licence: EDU/Pro restrictions must be checked before adoption.
4. **Custom Python plant model only** (last resort). Fastest to control, but abandons the
   "industrial simulator" premise and weakens the academic contribution.

Using a fallback while calling it OIP, or claiming a passing gate without evidence, is
prohibited.

## Consequences

Positive:

- Keeps the agreed simulator and its credible 3D/industrial semantics.
- The gate is cheap: upstream already provides the hard parts; we verify, pin and wrap.
- Energy modelling becomes an explicit, defensible research artefact.

Negative:

- A Node runtime is added to the industrial tier.
- Pinning means we inherit upstream bugs until we deliberately bump.
- OpenPLC v4 deployment may require Editor sources/STruC++; this is a build-toolchain risk,
  not just a runtime risk.
- The current OIP desktop MCP server is **not** our agent's MCP server; it must not be
  confused with F-18. Our agent tools are backend-owned.

## Evidence required to accept this ADR

- `docs/integration/simulator-feasibility.md` filled with commands, outputs, versions and
  two-run comparison.
- A committed scenario/project folder and the runner entry point.
- CI job (manual/scheduled until stable) reproducing the headless run.

## Follow-ups

- Freeze the OIP commit in `industrial/configurations/versions.lock.json`.
- Record the OpenPLC image digest and runtime version.
- Re-evaluate on every OIP bump; do not auto-track `main`.
