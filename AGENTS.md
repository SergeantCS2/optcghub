# Working in this repo

OP TCG Hub is an offline-first Android collection tracker and card scanner for
the One Piece Card Game. It is built for one collector, the owner, on a Samsung
Galaxy Z Fold 7. A PC is available for this project; the phone-only path is still
the one CI is designed around, because a build that only works on a laptop is a
build that stops when the laptop isn't there.

It is a sibling of APEX ORV and inherits its governance wholesale. Where a rule
below is short, it is short because APEX already paid for it.

**Read `docs/PROTOCOL.md` first, then `docs/LANDMINES.md` §0.** The landmine list
starts at 1 for this project but §2 carries the APEX findings that transfer —
those were paid for in real failures on the other repo and cost nothing to
inherit here.

---

## The one-paragraph version

`tools/pipeline.py` pulls the One Piece catalogue and prices from TCGCSV, joins
them, computes a perceptual hash per printing, builds a SQLite catalogue, and
assembles `www/`. `tools/gate.py` refuses to let anything ship that has drifted.
CI runs the pipeline and the harnesses on every pull request (`check.yml`) and
again on every merge to `main` (`build.yml`), which also produces a signed APK
plus a Play AAB and publishes Release `take-N`. You change `src/app.html` and
`tools/*.py`; everything else is generated.

## Rules that are not negotiable

1. **The gate is the contract.** `python3 tools/gate.py` must pass before you
   ship. If it fails, the repo is wrong — do not work around it.

2. **Verify the check before you believe it.** A failing test is more often a
   wrong test than a broken product, and a passing test proves nothing until you
   have watched it fail on purpose. Every guard gets a negative control.
   (APEX landmine 54, fired eight times over there.)

3. **A printing is the unit, never a card.** `EB03-024` is three different
   products worth $1.48, $23.36 and $467.33. Nothing in this codebase may key
   value, quantity or identity off a card number alone. `check_variant_keying()`
   enforces this against the built catalogue. Do not weaken it.

4. **A wrong match is worse than no match.** The app may say "I don't know."
   It may not quietly enter the $1.48 printing when the collector scanned the
   $467.33 one. Confidence gates are asymmetric on purpose and every auto-accept
   threshold has a recorded false-accept measurement behind it.

5. **The collection is the user's and it is never lost.** Export exists before
   charts exist. A backup runs on every batch commit. `user.db` is never touched
   by a catalogue sync. This is Phase-4-equivalent work under PROTOCOL §9 and
   does not get cut for schedule.

6. **Assert your anchors.** String-replacement patches that silently no-match
   have shipped call sites with no definitions on the sibling repo. `assert old
   in s` before every replace, and grep after.

7. **A clean run after any pipeline change.** PROTOCOL §6b. Artifacts survive on
   disk and hide broken producers. Nothing else finds this.

8. **Data claims need a source total.** TCGCSV publishes counts per group. The
   gate checks the built catalogue against the sum of the group manifests.
   "6,860 = 6,860" is worth more than any amount of confidence that an ingest
   looks right.

## Verifying your work

```bash
python3 tools/pipeline.py          # ingest → join → hash → build → smoke → render
node   tools/smoke.mjs             # executes the SHIPPED app
node   tools/render.mjs            # real Chrome, real pixels
python3 tools/gate.py              # the contract
```

`smoke.mjs` runs the built `www/app.js`, not a copy. `render.mjs` answers "did it
DRAW", which no stub can. Both must pass; they measure different things on purpose.

## Shipping a take

Takes are numbered and never reused. Since take 89, **one take is one branch
and one pull request**, titled `take N — …`. The owner merges; the merge to
`main` runs `build.yml`, which publishes Release `take-N` and deploys Pages.
In order:

1. Bump `VAULT_TAKE` in `BUILD` (the build puts it in the app's `TAKE` -- More's About row, Diagnostics -- and in the heading of Release `take-N`; since take 110 the page `<title>` carries no take)
2. Write the `docs/HANDOFF.md` entry **before** any code — what changed, what
   was measured, what was ruled out, and what you got wrong — and the take's
   **New at take N** paragraph in `ci/RELEASE.md` (the build refuses without it)
3. New landmine for anything that bit you, numbered, never renumbered
4. Rebuild: `bash ci/deps.sh`, then `python3 tools/pipeline.py` — render must
   end `(mode: chrome)`; a clean run from an empty directory after any
   pipeline change (PROTOCOL §6b)
5. `bash tools/seal.sh --gate-only`, bare, never piped — stamps, then the gate
6. Restore the runner-owned files: `git checkout -- catalog/prices_daily.json
   catalog/hashes.json`. The nightly on `main` is their record (landmine 116);
   the PR check refuses a branch that carries them
7. Commit named paths (never `git add -A`), push the branch, open the PR. The
   `check` workflow — the whole pipeline, with a read-only token — must be
   green before you hand over. **Nothing opens with a red gate.**

The workflow files travel in the PR like any file: `.github/workflows/*.yml`
and `ci/*.yml` are one file each and the gate refuses a difference. If a push
of `.github/workflows` is refused, hand the owner the `ci/` copy to paste
(RUNBOOK §5b) and say so in the reply.

## What is generated, and must not be committed

`www/bundle/`, `www/vendor/`, `catalog/`, `android/`, `node_modules/`,
`*_payload.json`, `tcgcsv_cache/`, `img_cache/`, `*.sqlite`.

**Never from a branch:** `catalog/prices_daily.json`, `catalog/hashes.json`
(committed by the nightly on `main` and nowhere else — landmine 116) and any
`optcghub-seed*.zip` (the seed job would unpack it over the tree — landmine
122; `.gitignore` refuses it).

Committed on purpose: `assets/logo-master.png` and `signing/optcghub.keystore`.
The keystore is deliberate — a stable key is what lets take N install over
take N−1.

**Never committed, ever:** the Play upload key. It lives in repository secrets
and nowhere else, exactly as it does on APEX ORV.

## Honesty is a feature here

This app is a ledger of money. It tells the collector what it does not know.

A price carries the date it was fetched and the marketplace it came from. A
printing the scanner could not resolve is presented as a choice, not a guess. A
condition the app cannot observe is labelled as the collector's assertion, not as
a fact. TCGCSV publishes no per-condition pricing, so the app does not invent
condition multipliers — it says which price it is showing and lets the collector
apply their own judgement.

If you find yourself making a number look more certain than it is, stop. The
worst outcome is not a missing feature. It is a collector selling a $467 card for
$5 because this app was confidently wrong about which printing they owned.


## The seal (take 28; `--gate-only` since take 89)

`bash tools/seal.sh --gate-only` — stamps, then runs the gate **unpiped**; in
the branch flow the PR is the deliverable and the gate is the seal. Without the
flag it also zips a seed — the recovery route, written outside the tree, and
refused if pointed inside it. Never seal by hand; landmine 103 is what a hand
seal did. **Never pipe `seal.sh` either** — `seal.sh | tail` is the same hole
one level up. Run it bare and read its last line.

## Ledger writes are their own command (take 29)

A script that writes to AGENDA, LANDMINES or HANDOFF is never chained with
`&&` behind a build or a test. It runs first, alone, and its confirmation is
`grep`-checked in the file, not read off the terminal. Landmine 104.
