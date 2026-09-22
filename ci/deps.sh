#!/usr/bin/env bash
# Every install the pipeline needs, in ONE place: bundle.sh (the nightly) and
# check.sh (the PR check) both run this. Landmine 121: a workflow that depends
# on a package only the other one installs runs red the first time it runs.
# hunt.yml installs its own smaller set inline; it never runs smoke or render.
set -euo pipefail
# pillow: hashes.py and the star template. --break-system-packages is for a
# runner's Debian python; harmless where pip does not need it.
pip install --quiet --break-system-packages pillow
# render.mjs falls back to a DOM check without puppeteer and says so. CI is
# the place pixels actually get verified, so CI is where Chrome has to exist.
# acorn: the scrubber's parser (tools/strip_comments.mjs, take 35). Without it
# build_app.py stops at the strip and says so.
npm install --silent --no-save puppeteer acorn
