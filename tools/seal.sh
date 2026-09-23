#!/usr/bin/env bash
# The seal. Landmine 103: `python3 tools/gate.py | tail -1` returns tail's exit
# code, so a failing gate sealed take 28. The gate's exit code is the seal, and
# nothing between it and the zip may swallow it.
#
# Take 89: the branch/PR flow needs no zip -- the PR is the deliverable and the
# gate is the seal -- so `--gate-only` stops after the gate. The zip is the
# recovery route (RUNBOOK §6) and is written OUTSIDE the tree: a seed zip in
# the tree would be committed, and the seed job would unpack it over
# everything (landmine 122), so an output folder inside the repo is refused
# before anything runs.
set -euo pipefail
cd "$(dirname "$0")/.."
TAKE=$(grep -oP 'VAULT_TAKE=\K[0-9]+' BUILD)
MODE=${1:-zip}
if [ "$MODE" != "--gate-only" ]; then
  OUT=${SEAL_OUT:-/mnt/user-data/outputs}
  real=$(python3 -c 'import os,sys;print(os.path.realpath(sys.argv[1]))' "$OUT")
  case "$real/" in
    "$(pwd -P)/"*) echo "seal: SEAL_OUT=$OUT is inside the repo — the zip would be committed and unpacked over the tree (landmine 122); point it elsewhere" >&2; exit 1;;
  esac
fi
python3 tools/stamp.py >/dev/null
python3 tools/gate.py                       # exits non-zero on any failure; set -e stops here
if [ "$MODE" = "--gate-only" ]; then
  echo "gate green for take $TAKE — no zip (branch flow: restore catalog/, commit, push, open the PR)"
  exit 0
fi
# node_modules stays: the zip excludes it below, and removing it was what sent
# render into DOM mode on the next take without anyone noticing (landmine 112).
rm -rf __pycache__ tools/__pycache__ android www/render.png assets/gen play-assets
rm -f catalog/catalog.json.gz package-lock.json   # manifest.json stays: the gate reads it
mkdir -p "$OUT"
zip -qr "$OUT/optcghub-seed-t$TAKE.zip" . -x 'www/*' 'tcgcsv_cache/*' 'catalog/catalog.sqlite' '*.pyc' '*__pycache__*' 'android/*' 'node_modules/*' '.git/*'
mkdir -p "$OUT/docs-t$TAKE" && cp docs/*.md "$OUT/docs-t$TAKE/"
echo "sealed take $TAKE: $(sha256sum "$OUT/optcghub-seed-t$TAKE.zip" | cut -c1-16)…"
