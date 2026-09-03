#!/usr/bin/env bash
# The seal. Landmine 103: `python3 tools/gate.py | tail -1` returns tail's exit
# code, so a failing gate sealed take 28. The gate's exit code is the seal, and
# nothing between it and the zip may swallow it.
set -euo pipefail
cd "$(dirname "$0")/.."
TAKE=$(grep -oP 'VAULT_TAKE=\K[0-9]+' BUILD)
python3 tools/stamp.py >/dev/null
python3 tools/gate.py                       # exits non-zero on any failure; set -e stops here
rm -rf __pycache__ tools/__pycache__ node_modules android www/render.png assets/gen play-assets
rm -f catalog/catalog.json.gz package-lock.json   # manifest.json stays: the gate reads it
OUT=/mnt/user-data/outputs
zip -qr "$OUT/optcghub-seed-t$TAKE.zip" . -x 'www/*' 'tcgcsv_cache/*' 'catalog/catalog.sqlite' '*.pyc' '*__pycache__*' 'android/*' 'node_modules/*'
mkdir -p "$OUT/docs-t$TAKE" && cp docs/*.md "$OUT/docs-t$TAKE/"
echo "sealed take $TAKE: $(sha256sum "$OUT/optcghub-seed-t$TAKE.zip" | cut -c1-16)…"
