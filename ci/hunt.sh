#!/usr/bin/env bash
# OP TCG Hub — the hourly's build: hunt.yml's feed job runs this and deploys www/.
# Take 145: moved here from the workflow, so a merged take changes it (hunt.yml
# says why) and `hunt.py --selftest` runs these lines with stand-ins.
set -euo pipefail

pip install --quiet pillow
# the app build strips comments through acorn (tools/scrub.py --strip);
# take 84: this workflow forgot to install it and would have gone red
npm install --silent --no-save acorn

# Take 145: the last green nightly's catalogue, kept aside before the fresh
# ingest writes over it. The nightly's cache step saves only when its build job
# ends green, so this copy passed validate and the gate.
good="${RUNNER_TEMP:-/tmp}/catalog-last-green.sqlite"
rm -f "$good"
if [ -f catalog/catalog.sqlite ]; then cp catalog/catalog.sqlite "$good"; fi

# Take 115: validate.py before `app`. Through take 114 this built and deployed a
# fresh ingest that no check had read: the card-count floor, the source's age,
# a set with no prices, a printing with no number, a >10x overnight move, the
# confidence tables. Not --strict: its hash coverage reads the committed sidecar
# against this fresh ingest, and this job never hashes -- a new set's 139th
# unhashed printing (MEASURED: 138 pass) refused every hourly until the nightly
# committed its hashes. Hash coverage is the nightly's refusal; a printing with
# no hash yet is asked about at a scan, never matched wrongly.
if python3 tools/pipeline.py ingest history catalog && python3 tools/validate.py; then
  python3 tools/pipeline.py app
  echo "catalogue=fresh" >> "${GITHUB_OUTPUT:-/dev/null}"
else
  # Take 145: a refused catalogue (or TCGCSV out) no longer stops the feed: on
  # 4 Oct one real price move froze the stock lists with the prices (landmine
  # 252). The page is built from the last green catalogue -- the feed matches
  # against it -- and the catalogue Pages already serves is put back over its
  # bundle, byte for byte, so phones adopt nothing new. Unreadable, or not one
  # this build reads: nothing deploys, as before.
  if [ ! -f "$good" ]; then
    echo "::error::the fresh catalogue was refused (above) and there is no last green one to build the page from -- nothing deploys; Pages keeps its last deploy"
    exit 1
  fi
  echo "::warning::the fresh catalogue was refused (above) -- the feed ships over the catalogue Pages already serves"
  cp "$good" catalog/catalog.sqlite
  python3 tools/pipeline.py app
  python3 tools/hunt.py --live-bundle
  echo "catalogue=live" >> "${GITHUB_OUTPUT:-/dev/null}"
fi

python3 tools/hunt.py --zips "${HUNT_ZIPS:-48329}" --radius "${HUNT_RADIUS:-50}"
