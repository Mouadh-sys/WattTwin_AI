#!/usr/bin/env bash
# Reproduce the stack-level feasibility evidence (V1 + V3/V4).
#
# Prerequisites:
#   scripts/phase0/bootstrap_simulator.sh
#   scripts/phase0/start_openplc.sh
#
# This runs upstream's conveyor case, not yet WattTwin's own line (ticket P0-07b).
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
DEST="${ROOT}/vendor/open-industry-project"
ART="${ROOT}/artifacts/phase0"
mkdir -p "${ART}"

[ -d "${DEST}" ] || { echo "run bootstrap_simulator.sh first" >&2; exit 1; }
curl -sk --max-time 5 https://127.0.0.1:8443/api/version >/dev/null || {
  echo "OpenPLC runtime not reachable; run start_openplc.sh" >&2; exit 1;
}

cd "${DEST}"

echo "==> V1: headless scene + embedded PLC"
npm run test-project -- examples/projects/start-stop-motor 2>&1 | tee "${ART}/v1-headless.log"

echo "==> V3/V4: real OpenPLC over Modbus (run 1)"
OPENPLC_URL=https://127.0.0.1:8443 OPENPLC_USER=openplc OPENPLC_PASSWORD=openplc \
OIP_MODBUS_PORT=5020 npm run openplc-loop 2>&1 | tee "${ART}/v3-openplc-run1.log"

echo "==> V3/V4: real OpenPLC over Modbus (run 2)"
OPENPLC_URL=https://127.0.0.1:8443 OPENPLC_USER=openplc OPENPLC_PASSWORD=openplc \
OIP_MODBUS_PORT=5020 npm run openplc-loop 2>&1 | tee "${ART}/v3-openplc-run2.log"

echo "OK: evidence in ${ART}"
