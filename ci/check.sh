#!/usr/bin/env bash
# The PR check (take 89). What the nightly does MINUS everything that writes
# outside the runner: no price commit, no sidecar commit, no Pages, no release.
# Runs the whole pipeline -- ingest, history, catalogue, hashes, validate, app,
# smoke, Chrome render, stamp, gate -- on the PR's merge commit, so a red gate
# never reaches main (landmine 122).
#
#   bash ci/check.sh              # the check
#   bash ci/check.sh --selftest   # the runner-owned-files guard, with controls
set -euo pipefail

# Landmine 116: catalog/prices_daily.json and catalog/hashes.json are written
# by the nightly on main -- the runner is the record. A branch that carries
# them would overwrite the runner's fuller copy at merge. Refused here.
owned() { grep -E '^catalog/(prices_daily|hashes)\.json$' || true; }

if [ "${1:-}" = "--selftest" ]; then
  echo "check.sh negative controls:"
  ok=1
  hit=$(printf 'docs/HANDOFF.md\ncatalog/prices_daily.json\n' | owned)
  [ -n "$hit" ] && echo "  ok    a branch carrying prices_daily.json is refused" || { echo "  FAIL  prices_daily.json passed the guard"; ok=0; }
  hit=$(printf 'catalog/hashes.json\n' | owned)
  [ -n "$hit" ] && echo "  ok    a branch carrying hashes.json is refused" || { echo "  FAIL  hashes.json passed the guard"; ok=0; }
  hit=$(printf 'docs/HANDOFF.md\ncatalog/star_template.json\ntools/hashes.py\n' | owned)
  [ -z "$hit" ] && echo "  ok    docs, the star template and tools pass" || { echo "  FAIL  the guard refused a file it should not: $hit"; ok=0; }
  [ "$ok" = 1 ] && exit 0 || exit 1
fi

echo "::group::deps"
bash ci/deps.sh
echo "::endgroup::"

echo "::group::the runner is the record (landmine 116)"
base=${CHECK_BASE:-main}
if git fetch -q --depth=1 origin "$base" 2>/dev/null; then
  hit=$(git diff --name-only FETCH_HEAD HEAD | owned)
  if [ -n "$hit" ]; then
    echo "::error::this branch changes runner-owned files (landmine 116):"
    echo "$hit"
    echo "restore them: git checkout origin/$base -- catalog/prices_daily.json catalog/hashes.json"
    exit 1
  fi
  echo "runner-owned files untouched against origin/$base"
else
  echo "no remote to compare against here — the guard runs on the runner"
fi
echo "::endgroup::"

echo "::group::pipeline"
python3 tools/pipeline.py
echo "::endgroup::"
