#!/usr/bin/env bash
# Every step that can change lives HERE, not in the workflow file, because the
# seed can update this and cannot update .github/workflows (APEX landmines 46, 84).
set -euo pipefail

# The carry-over, a function because it runs twice: here, after the pipeline,
# and again as `bash ci/bundle.sh --carry-over` in build.yml's pages job, which
# does nothing else. Take 115: the nightly race -- this job's read comes
# before the pages job starts, and an hourly that deployed in between lost its
# row, so the pages job reads again right before it deploys, inside the
# `pages` concurrency group that hunt.yml's run holds too.
carry_over() {
echo "::group::carry the hourly feed forward (take 82)"
# Pages is one site with two deployers. The nightly must not wipe what the
# hourly wrote: copy the live hunt/ files into www/ before this deploy.
# Take 114 review: Pages holds the only copy of hunt/history.json, and a deploy
# without it is the next hourly's reset of the whole record. Exit 3 says it
# could not be read (a timeout or a 5xx after three tries -- not a 404, not a
# file that is not a history); any other failure may have missed it too. Either
# way this build does not deploy Pages: pages=skip skips build.yml's pages job
# (here) or its upload and deploy (there), Pages keeps the hourly's last
# deploy, history whole, and the next hourly deploys again. The APK and the
# Release go ahead. Still non-fatal.
rc=0; python3 tools/hunt.py --carry-over || rc=$?
if [ "$rc" -ne 0 ]; then
  echo "::warning::hunt carry-over exited $rc -- this build does not deploy Pages (pages=skip); the APK and the Release go ahead"
  echo "pages=skip" >> "${GITHUB_OUTPUT:-/dev/null}"
fi
echo "::endgroup::"
}
if [ "${1:-}" = "--carry-over" ]; then carry_over; exit 0; fi

echo "::group::deps"
bash ci/deps.sh        # one install list for the nightly and the PR check (landmine 121)
echo "::endgroup::"

echo "::group::source present?"
# Fail here, plainly, rather than 200 lines later inside python (APEX landmine 78).
missing=
for f in BUILD tools/pipeline.py src/app.html tools/config.py; do
  [ -f "$f" ] || missing="$missing $f"
done
if [ -n "$missing" ]; then
  echo "::error::This repo has no OP TCG Hub source. Missing:$missing"
  echo "Files at root:"; ls -A | sed 's/^/  /'
  echo "Merge a take, or (recovery, RUNBOOK §6) upload optcghub-seed-tNNN.zip to the repo ROOT and re-run."
  exit 1
fi
echo "take $(grep -oP 'VAULT_TAKE=\K[0-9]+' BUILD)"
echo "::endgroup::"

echo "::group::the day's prices, fetched first"
# Landmine 115: the price fetch is the one irreplaceable thing this job does
# -- TCGCSV publishes today's prices once and yesterday's are gone. Five nights
# were lost because a stale assertion failed AFTER the fetch and before the
# commit. So the day's prices are recorded FIRST, in their own pipeline call;
# whatever follows may go red without costing the history.
# Landmine 116: a seed's sidecar can be thinner than the repo's (the session
# is a snapshot, the runner is the record) and the seed job overwrites. Restore
# every day any recent commit had, then fetch today's.
python3 tools/history.py --merge-git
python3 tools/pipeline.py ingest history
echo "::endgroup::"
echo "::group::commit the day's prices (before anything that can fail)"
git config user.name  "optcghub-nightly"
git config user.email "optcghub-nightly@users.noreply.github.com"
git add catalog/prices_daily.json 2>/dev/null || true
if git diff --cached --quiet; then
  echo "prices unchanged"
else
  read -r day days < <(python3 -c "import json;h=json.load(open('catalog/prices_daily.json'));print(max(h), len(h))")
  git commit -q -m "nightly: prices $day, $days day(s) on file"
  branch=$(git rev-parse --abbrev-ref HEAD)
  git push origin "$branch" || { git pull --rebase --autostash -q origin "$branch" && git push origin "$branch"; }
  echo "prices committed and pushed: $day, $days day(s) on file"
fi
echo "::endgroup::"

echo "::group::pipeline"
python3 tools/pipeline.py
echo "::endgroup::"

carry_over      # the function at the top; build.yml's pages job runs it again (take 115)

# render.mjs already ran inside the pipeline in Chrome mode (puppeteer was
# installed above); running it twice was take 4's belt-and-braces and is now
# just a minute of runner time.

# ── commit the sidecars back ──────────────────────────────────────────────
# Landmine 66 on CI (landmine 105): history.py appended tonight's prices to
# catalog/prices_daily.json ON THE RUNNER, and the next night's checkout
# starts from the committed copy. Without this push, history never accrues
# past the seed and every 7d/30d delta stays empty forever. hashes.json is
# the same shape for newly released printings. catalog/ is NOT in push.paths,
# so this commit does not re-trigger the workflow.
# The Chrome receipt is for the gate, not for Pages (take 42).
rm -f www/render.png

echo "::group::commit sidecars"
git config user.name  "optcghub-nightly"
git config user.email "optcghub-nightly@users.noreply.github.com"
git add catalog/prices_daily.json catalog/hashes.json catalog/star_template.json 2>/dev/null || true
if git diff --cached --quiet; then
  echo "sidecars unchanged"
else
  # The date in the message is the SOURCE date -- the newest day in the file --
  # not the day the runner ran (landmine 3: a fetch at 03:00 UTC carries
  # yesterday's prices). Rehearsed at take 33: the fetch-date version said
  # "prices 2026-09-03" on a commit that added 2026-09-02.
  read -r day days < <(python3 -c "import json;h=json.load(open('catalog/prices_daily.json'));print(max(h), len(h))")
  git commit -q -m "nightly: prices $day, $days day(s) on file"
  # A push is rejected if anything landed on the branch during the ~6 minute
  # build (a docs edit in the browser, say). The commit is one file that nobody
  # else writes, so rebase once and push again rather than lose the night to
  # a red job and an issue. Rehearsed against a moved remote at take 33.
  branch=$(git rev-parse --abbrev-ref HEAD)
  git push origin "$branch" || { git pull --rebase --autostash -q origin "$branch" && git push origin "$branch"; }
  echo "sidecars committed and pushed: prices $day, $days day(s) on file"
fi
echo "::endgroup::"

# The catalogue is small (landmine 8) so it ships inside the APK rather than
# being downloaded, and Pages serves the same bundle for in-app sync (take
# 27). ~0.56 MB gzipped for the entire game (A25).
echo "::group::sizes"
du -sh www; du -sh www/bundle   # two calls: du counts an overlapping pair once
python3 - <<'PY'
import json
m = json.load(open('www/bundle/manifest.json'))
print(f"take {m['take']}  {m['cards']} cards  {m['sets']} sets  "
      f"{m['hashed']} hashes  source {m['source_updated_at']}")
PY
echo "::endgroup::"
