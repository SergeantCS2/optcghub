@AGENTS.md

# Working here as a session — what AGENTS.md leaves to the record

AGENTS.md above is the contract and the one place the rules live; this file
adds only what a session needs beyond it (take 102). Read
`docs/PROTOCOL.md` §0 and §6, then `docs/NEW-SESSION-PROMPT.md` — the
in-flight state — before touching anything.

## Commands, in the order a take runs them

| Command | What it is |
|---|---|
| `bash ci/deps.sh` | puppeteer, acorn, pillow (needs `registry.npmjs.org` and `pypi.org`) |
| `python3 tools/pipeline.py` | the whole pipeline; `python3 tools/pipeline.py app smoke render` runs only those steps |
| `node tools/smoke.mjs` | executes the shipped `www/app.js` in a DOM stub (~690 assertions) |
| `node tools/render.mjs` | real Chrome via puppeteer; falls back to a DOM check and says `(mode: dom)` |
| `node tools/look.mjs N` | the look (A40): clicks through take N's changes in a real Chromium and writes a PNG per step under `look/` — read every PNG, send them to the owner, mark the PR ready only after his input |
| `python3 tools/gate.py` | the contract; `--selftest` runs its own probes |
| `python3 tools/scrub.py --check --docs` | refuses the owner's first name, an AI vendor's name, the conversational word, credentials, container paths |
| `bash tools/seal.sh --gate-only` | stamps every doc with the take, then the gate — bare, never piped |
| `python3 tools/hunt.py --selftest` · `python3 tools/hashes.py --selftest` · `python3 tools/shipped.py --selftest` · `bash ci/signer.sh --selftest` | the guards' negative controls, all run by the gate |

## The take, end to end

1. `git fetch origin main && git checkout -B <the take's branch> origin/main`; read the last Release and the last nightly before trusting any brief.
2. Ledgers first (PROTOCOL §6): `BUILD`, the HANDOFF entry, `ci/RELEASE.md`'s "New at take N", a landmine for anything that bit, the AGENDA item with its **Ruled out** line, the NSP counters. Each ledger write is its own command, `grep`-checked in the file.
3. Code, every guard with a negative control watched to fail on the previous build first.
4. Harnesses, the look, the seal. Then `git checkout -- catalog/prices_daily.json catalog/hashes.json` — the nightly owns them.
5. Commit named paths (never `git add -A`), push, open a **draft** PR titled `take N — …`; the runner's `check` is the seal; mark it ready when green and the owner has seen the look. The owner merges; the merge builds Release `take-N`.
6. A note written after the merge rides the next take's PR from the same branch, never a PR of its own.

## Where things are

- `src/app.html` — the whole app, one file; built into `www/` by the pipeline. `tools/*.py` — the pipeline; `tools/hunt/` — the Hunt feed's sources; `tools/look/steps.mjs` — the look's step lists, one per take.
- `docs/` — the record: HANDOFF (newest first), LANDMINES (§0 index), AGENDA (Priorities at the top), PROTOCOL, PROVISION (every host, or the gate refuses), RUNBOOK and RUNBOOK-play, V1-STATE (PROVEN / BUILT / DEFERRED), NEW-SESSION-PROMPT.
- `ci/` — `apk.sh`, `signer.sh`, `deps.sh`, `check.sh`, the workflow copies (`ci/*.yml` must equal `.github/workflows/*.yml`; the gate refuses a difference).
- Generated, never committed: `www/bundle/`, `www/app.js`, `www/index.html`, `catalog/*.sqlite`, `android/`, `node_modules/`, `look/`.

## What bites here

- The runner is the seal: the session VM usually has no Chrome receipt and no CDN access, so `render.png` and the image hashes come from the runner's `check`; a red gate on the receipt alone is expected here, anything else is not.
- The DOM stub in `smoke.mjs` answers class selectors with a dummy element and cannot see `[hidden]` or a document-level click handler: assert through `window.VAULT` (screens by `V.NAV.stack`), and lift a handler into a named function to test it (landmines 135, 136).
- `.gitignore` patterns are anchored (`/look/`), or a same-named directory anywhere vanishes from the commit and `git add` fails the chain silently (landmine 138).
- A "closed" item stays open until its own record says so (landmine 137: the watchdog healed the symptom for eleven takes).
- The repo is public. "The owner" and "session" are the words; the scrubber refuses the rest.
- Network from the VM: GitHub and the package registries only, unless the owner's environment says otherwise; if a host is refused, name it and stop — the runner or a new session fetches.
