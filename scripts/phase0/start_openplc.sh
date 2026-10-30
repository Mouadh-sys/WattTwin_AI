#!/usr/bin/env bash
# Start OpenPLC Runtime v4 at the pinned digest.
#
# Host networking is REQUIRED for the loop: the headless simulator serves Modbus on the
# host loopback (127.0.0.1:5020). A container with published ports would see its own
# loopback and the PLC would poll nothing while still reporting RUNNING.
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
IMAGE="$(python3 -c 'import json,sys; d=json.load(open(sys.argv[1]))["openplc"]; print(d["image"].split(":latest")[0] + "@" + d["image_tag_digest"])' "${ROOT}/industrial/configurations/versions.lock.json")"
NAME=watttwin-openplc

command -v docker >/dev/null || { echo "docker is required" >&2; exit 1; }

docker rm -f "${NAME}" >/dev/null 2>&1 || true
echo "==> Starting ${NAME} from ${IMAGE}"
docker run -d \
  --name "${NAME}" \
  --network host \
  --cap-add=SYS_NICE \
  --cap-add=SYS_RESOURCE \
  -v watttwin-openplc-data:/var/run/runtime \
  "${IMAGE}" >/dev/null

for _ in $(seq 1 20); do
  sleep 3
  if curl -sk --max-time 3 https://127.0.0.1:8443/api/version >/tmp/watttwin-openplc-version.json 2>/dev/null; then
    echo "==> OpenPLC $(cat /tmp/watttwin-openplc-version.json)"
    echo "OK: runtime ready on https://127.0.0.1:8443"
    exit 0
  fi
done

echo "Runtime did not become ready. Logs:" >&2
docker logs --tail 40 "${NAME}" >&2
exit 1
