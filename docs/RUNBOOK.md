# RUNBOOK — from nothing to a repo that builds every night

*Current as of take 113.* **Since take 89 the repo is the record:** a session
works on a branch and opens a pull request; you merge; the merge builds. §6
is every take. §1–§5 are how the repo was first stood up from a seed zip and
remain the recovery procedure; you need them again only for a new repo or a
tree that must be replaced wholesale.

The order matters. Do not skip 2b.

---

## 1. Create the repo

github.com → **New repository**
- name: `optcghub`
- visibility: **Private** (recommended until v1 — the sideload key is
  committed; A8 states the trade-off)
- tick **Add a README** → **Create repository**

## 2. Paste the two workflows — by hand, once (a new repo only)

In a repo that already exists the workflow files live in git and change
through pull requests like every other file (§5b). Standing up a *new* repo
from a seed is the one time they are pasted, because the seed job cannot
write them.

**Add file → Create new file**, path exactly `.github/workflows/build.yml`,
paste the whole of `build.yml`, **Commit changes**.

Same again: path `.github/workflows/bootstrap.yml` ← `bootstrap.yml`.

### 2b. Check the paste (thirty seconds, saves a week)

Open `.github/workflows/build.yml` in the browser and confirm:
- there is a job called **`seed`**
- under `push: paths:` the line **`- 'optcghub-seed*.zip'`** is present

A paste has dropped these before; when it does, every later run rebuilds the
same stale take at full green and nothing tells you.

## 3. Turn on Pages and Actions permissions — before the first run

- **Settings → Pages → Build and deployment → Source: GitHub Actions.**
  One tap. Without it the `pages` job is skipped (it is allowed to), and the
  privacy-policy URL Play needs does not exist.
- **Settings → Actions → General → Workflow permissions: Read and write.**
  The `seed` and nightly jobs commit back to the repo. Read-only = every run
  fails at the first `git push`.

## 4. Upload the seed and run bootstrap

**Releases → Create a new release** → tag `seed` → attach
`optcghub-seed-tNNN.zip` → **Publish release**.

**Actions → bootstrap → Run workflow.** ~30 seconds: it takes the
highest-numbered seed on the latest release, replaces the tree with it,
commits, and **asks for the build by name** — its own push could never start
one (landmine 108; fixed at take 33, which is why `bootstrap.yml` must be
re-pasted once, §5b).

### The first build, what to expect

- **seed** — "no seed zip at root — building the committed tree as-is". Correct.
- **bundle** — ~6 minutes: TCGCSV fetch (6 s), hashes restored from the
  committed sidecar (seconds), puppeteer install (~1 min), smoke + Chrome
  render + gate. Then it **commits `catalog/prices_daily.json` back** — the
  first nightly commit, one day on file.
- **pages** — deploys `www/`. The URL is shown on the job.
- **apk** — ~8 minutes on a cold Gradle cache. Produces
  `optcghub-take-N.apk` (sideload) and `optcghub-take-N…DEVKEY-DO-NOT-UPLOAD.aab`
  (until §7), and creates **Release `take-N`** with `ci/RELEASE.md` as notes.

If any job goes red: **Actions → the run → the red job → expand the last
group.** The scripts print the reason in one line before anything else. The
table at the end of this file maps the common ones.

## 5. Turn on live prices — one line, one upload

Once Pages has deployed, the URL is `https://<you>.github.io/optcghub/`.
**Set at take 33** to `https://sergeantcs2.github.io/optcghub/bundle/`; if
Pages was never enabled (§3) the app says *Sync failed* and keeps its bundled
catalogue until it is. In `tools/config.py` the line is:

```
UPDATE_URL = "https://<you>.github.io/optcghub/bundle/"
```

Zip the seed again (or edit the file in the browser and commit — the push
triggers a build). From then on an installed app fetches the nightly catalogue
when it is online: quietly once per open, or **More → Sync now**. Price alerts
fire against it. Until this is set the app says "update the app for newer
prices", which is true.

## 5b. When a workflow file changes

Since take 89 the four workflows — `build.yml`, `check.yml`, `hunt.yml`,
`bootstrap.yml` — travel in the take's PR: `.github/workflows/<file>` and
`ci/<file>` are one file each, and the gate refuses a take where they
differ. Merging the PR is the whole procedure.

**If a push of `.github/workflows` is refused** (the session's GitHub App
lacks the *Workflows* permission), the PR carries the `ci/` copy alone and
its HANDOFF entry says so. The paste is then yours: open
`.github/workflows/<file>` in the browser → the pencil → select all → paste
the contents of `ci/<file>` → commit. Then the 2b checks again for
`build.yml`. (Earlier pastes: take 31 `issues: write`; take 33
`bootstrap.yml`'s `actions: write` and its last step, landmine 108; take 84
`hunt.yml`'s install, landmine 121.)

## 5c. The hourly Hunt feed (take 71)

`hunt.yml` was the third hand-pasted workflow; since take 89 it travels in
the PR like the others (§5b). It runs at :17 every hour, rebuilds `www/`
from the committed tree, fetches Target's product and shelf stock for the
configured zip with `tools/hunt.py`, and deploys `www/` to Pages — the app
reads `hunt/feed.json` from there. Change the zip or radius without a paste:
repository **Variables** `HUNT_ZIP` and `HUNT_RADIUS` (Settings → Secrets and
variables → Actions → Variables). It shares the `pages` concurrency group
with the nightly so the two never deploy over each other. A run costs about
two minutes of a public repo's free runner time.

**The first run is yours to start:** Actions → hunt → *Run workflow*. A new
schedule's first cron run can lag by an hour or more; a manual run proves the
workflow and deploys the feed at once. The `hunt.yml` from take 84 or later is
required — earlier ones lacked an install and go red at the `app` step.

**If Hunt says the stock feed is unavailable (404):** the hourly workflow has
not deployed since the nightly last did. Check Actions → hunt: no runs means
the file was never pasted or the cron has not fired yet; a red run means
`tools/hunt.py` failed (a stale paste from take 71 calls `--zip`, which no
longer exists — re-paste). Since take 82 the nightly carries the hourly's
files forward, so once the hourly has run green once, the feed stays up.
More → About, tapped five times, opens Diagnostics: its Hunt section probes
every feed file live and says HTTP 200 or 404 for each.

## 6. Every take after the first

**The flow (take 89).** The session works on a branch and opens a pull
request titled `take N — …`. The `check` workflow runs the whole pipeline on
the PR — ingest, hashes, smoke, Chrome render, gate — with a read-only token:
it can commit, release and deploy nothing. When it is green and you have read
the PR: **Squash and merge** (one commit per take on `main`, and the branch
name stays out of `main`'s history). The merge runs `build.yml`: Release
`take-N` with the APK and the AAB, Pages redeployed. Sideload from the
Release as before.

Two things a PR must never carry, and the check refuses the first:
`catalog/prices_daily.json` and `catalog/hashes.json` — the nightly on `main`
writes them and is their record (landmine 116) — and a seed zip, which the
`seed` job would unpack over the tree (landmine 122; `.gitignore` refuses it).

**Recovery — the tree is wrong, or git is not to hand.** The seed path still
works, unchanged: `bash tools/seal.sh` writes `optcghub-seed-tNNN.zip`
outside the tree; **Add file → Upload files** → drop it at the repo root →
Commit (the `seed` job unpacks and commits it), **or** attach it to a Release
and run **bootstrap**.

The nightly runs at **21:30 UTC**, after TCGCSV's ~20:05 refresh, with no
action from you. It commits the day's prices, redeploys Pages, and replaces
the assets on the current take's release.

## 7. Play — when you are ready for the AAB

RUNBOOK-play has the whole Play side. The one thing that touches this repo:
four **repository secrets** (Settings → Secrets and variables → Actions):

| secret | what |
|---|---|
| `PLAY_UPLOAD_KEYSTORE_B64` | your upload keystore, base64 — `base64 -w0 upload.jks` |
| `PLAY_UPLOAD_STORE_PASS` | its store password |
| `PLAY_UPLOAD_KEY_ALIAS` | the key alias |
| `PLAY_UPLOAD_KEY_PASS` | the key password |

The next build signs the AAB with it and the file loses the
`DEVKEY-DO-NOT-UPLOAD` suffix. The upload key **never enters the tree or a
session**. The sideload APK keeps the committed key regardless, so testers'
installs keep working.

## 8. First night check

The morning after the first build:
- **Actions** shows a scheduled run at 21:30 UTC, green.
- The repo has a commit `nightly: prices YYYY-MM-DD, 2 day(s) on file` from
  `optcghub-nightly`. That commit is the whole point of the nightly.
- The app on your phone, after **Sync now**, shows *Prices from* yesterday's
  date and yesterday's deltas on the tiles.

If the run went red, there is **one** open issue labelled `nightly-failure`,
with a comment per red night; a green night closes it (A9; landmine 125 is
the four separate issues that came before the label existed). The reason is
in the run's last group; the table below maps the common ones.

---

## If something goes wrong

| Symptom | Look at |
|---|---|
| bootstrap: "No optcghub-seed" | the Release must carry a file named exactly `optcghub-seed-tNNN.zip` |
| Uploading a seed starts no run | §2b — the `push.paths` glob was dropped from the paste |
| Any job: `remote: Permission … denied` on push | §3 — workflow permissions are read-only |
| bundle red in `ingest` | TCGCSV: throttled cloud IP (APEX 205) or an unreleased set (landmine 42). Re-run once; if it persists the log names the group |
| bundle red in `gate` | the gate's last lines say which check; the take was gated green before its PR, so this is the runner's environment — read the line |
| bundle red in `hashes` the week a set drops | since take 89 a 403/404 is "not published yet" and never counts; if it still stops, the canary failed — the CDN is refusing the runner (landmine 124) |
| bundle red in `smoke` on a day with no code change | a fixture or an assertion with an expiry date (landmines 62, 114, 123); the log names the assertion |
| `check` red on a PR at "runner-owned files" | the branch carries `catalog/prices_daily.json` or `hashes.json`; `git checkout origin/main -- catalog/prices_daily.json catalog/hashes.json`, commit, push (landmine 116) |
| `check` red on a PR at `workflows` | `ci/<file>.yml` and `.github/workflows/<file>.yml` differ — copy one over the other; they are one file |
| a Release or a Pages deploy from a branch | `branches: [ main ]` was lost from `build.yml`'s push trigger — put it back (landmine 122) |
| pages skipped or red | §3 — Pages source is not "GitHub Actions" |
| apk red at "no Android build-tools" | the runner image changed; open an issue with the log |
| apk red at `Received status code 429 from server: Too Many Requests` from `repo.maven.apache.org` | Maven Central rate-limited the runner's address (first seen take 94, thirty artifacts at once); Actions → the run → *Re-run failed jobs*, once — the second attempt on the same commit passed. A second failure is real |
| apk red at "APK is not signed by the committed sideload key" | `signing/optcghub.keystore` is missing from the tree — the seed lost it |
| APK installs beside the old one instead of over it | the signer changed; must not — A8 |
| Second night: release step red | should not since take 30 (idempotent); if it is, the tag exists and `--clobber` failed — the log says |
| App shows `—` for every delta | one day of history (landmine 68); the second nightly fixes it |
| More → Sync says "not configured" | §5 |
| More → Sync says "Sync failed" | §3 — Pages is not deployed at the URL in `config.py`; the app keeps its bundled catalogue |
| bootstrap went green and nothing built | the old `bootstrap.yml` — §5b, paste the take-33 file (landmine 108) |
| The quiet sync never runs on the phone | it is on mobile data — More → Sync → *Also sync quietly on mobile data*, or wifi; Sync now always works (A25) |
