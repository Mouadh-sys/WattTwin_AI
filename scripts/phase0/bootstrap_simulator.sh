#!/usr/bin/env bash
# Fetch and prepare the pinned Open Industry Project checkout used by Phase 0.
# The checkout is gitignored; it is a build input, not vendored source.
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
DEST="${ROOT}/vendor/open-industry-project"
PIN="$(python3 -c 'import json,sys; print(json.load(open(sys.argv[1]))["simulator"]["commit"])' "${ROOT}/industrial/configurations/versions.lock.json")"
REPO="https://github.com/Open-Industry-Project/Open-Industry-Project.git"

command -v node >/dev/null || { echo "node is required (>=24)" >&2; exit 1; }
node_major="$(node -p 'process.versions.node.split(".")[0]')"
[ "${node_major}" -ge 24 ] || { echo "Node >=24 required, found $(node -v)" >&2; exit 1; }

if [ ! -d "${DEST}/.git" ]; then
  echo "==> Cloning Open Industry Project"
  mkdir -p "$(dirname "${DEST}")"
  git clone "${REPO}" "${DEST}"
fi

cd "${DEST}"
echo "==> Checking out pinned commit ${PIN}"
git fetch --depth 1 origin "${PIN}"
git checkout --detach "${PIN}"

echo "==> Installing dependencies (this is large: ~700 MB of node_modules)"
npm install --no-audit --no-fund

echo "==> Smoke test: headless scene + embedded PLC"
npm run test-project -- examples/projects/start-stop-motor

echo "OK: simulator prepared at ${DEST} (${PIN})"
