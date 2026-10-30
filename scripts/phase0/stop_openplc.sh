#!/usr/bin/env bash
set -euo pipefail
docker rm -f watttwin-openplc >/dev/null 2>&1 || true
echo "Stopped watttwin-openplc (named volume watttwin-openplc-data retained)."
