#!/usr/bin/env bash
# Every step that can change lives HERE, not in the workflow file, because the
# seed can update this and cannot update .github/workflows (APEX landmines 46, 84).
set -euo pipefail

echo "::group::deps"
pip install --quiet --break-system-packages pillow
# render.mjs falls back to a DOM check without this and says so. CI is the place
# pixels actually get verified, so CI is where Chrome has to exist.
# acorn: the scrubber's parser (tools/strip_comments.mjs, take 35). Without it
# build_app.py stops at the strip and says so.
npm install --silent --no-save puppeteer acorn
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
  echo "Upload optcghub-seed-tNNN.zip to the repo ROOT and re-run."
  exit 1
fi
echo "take $(grep -oP 'VAULT_TAKE=\K[0-9]+' BUILD)"
echo "::endgroup::"

echo "::group::pipeline"
python3 tools/pipeline.py
echo "::endgroup::"

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
