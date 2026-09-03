# RUNBOOK — from nothing to a repo that builds every night

*Current as of take 56.* Everything below is the whole procedure. You need
three files from the outputs: `build.yml`, `bootstrap.yml`, and the newest
`optcghub-seed-tNNN.zip`. A PC makes step 2 easier; a phone works.

The order matters. Do not skip 2b.

---

## 1. Create the repo

github.com → **New repository**
- name: `optcghub`
- visibility: **Private** (recommended until v1 — the sideload key is
  committed; A8 states the trade-off)
- tick **Add a README** → **Create repository**

## 2. Paste the two workflows — by hand, once

GitHub's build token cannot push workflow files, so these two are the only
things you ever paste. Everything else arrives by zip.

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

## 5b. When `build.yml` or `bootstrap.yml` changes

The two workflow files are the ones the seed cannot update. When a take
changes one (take 31: `build.yml` gained `issues: write`; **take 33:
`bootstrap.yml` gained `actions: write` and a last step that starts the
build** — landmine 108), the release notes say so, and the fix is: open
`.github/workflows/<file>` in the browser → the pencil → select all → paste
the new file → commit. Then the 2b checks again for `build.yml`. It happens
rarely and the runbook will always say when.

## 6. Every take after the first

Two paths, same result:
- **Add file → Upload files** → drop `optcghub-seed-tNNN.zip` at the repo
  root → Commit. The `seed` job unpacks and commits it.
- **Or** attach it to a Release and run **bootstrap** again.

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

If the run went red, there is an open issue labelled `nightly-failure` with
the reason (A9).

---

## If something goes wrong

| Symptom | Look at |
|---|---|
| bootstrap: "No optcghub-seed" | the Release must carry a file named exactly `optcghub-seed-tNNN.zip` |
| Uploading a seed starts no run | §2b — the `push.paths` glob was dropped from the paste |
| Any job: `remote: Permission … denied` on push | §3 — workflow permissions are read-only |
| bundle red in `ingest` | TCGCSV: throttled cloud IP (APEX 205) or an unreleased set (landmine 42). Re-run once; if it persists the log names the group |
| bundle red in `gate` | the gate's last lines say which check; the seed was sealed green, so this is the runner's environment — read the line |
| pages skipped or red | §3 — Pages source is not "GitHub Actions" |
| apk red at "no Android build-tools" | the runner image changed; open an issue with the log |
| apk red at "APK is not signed by the committed sideload key" | `signing/optcghub.keystore` is missing from the tree — the seed lost it |
| APK installs beside the old one instead of over it | the signer changed; must not — A8 |
| Second night: release step red | should not since take 30 (idempotent); if it is, the tag exists and `--clobber` failed — the log says |
| App shows `—` for every delta | one day of history (landmine 68); the second nightly fixes it |
| More → Sync says "not configured" | §5 |
| More → Sync says "Sync failed" | §3 — Pages is not deployed at the URL in `config.py`; the app keeps its bundled catalogue |
| bootstrap went green and nothing built | the old `bootstrap.yml` — §5b, paste the take-33 file (landmine 108) |
| The quiet sync never runs on the phone | it is on mobile data — More → Sync → *Also sync quietly on mobile data*, or wifi; Sync now always works (A25) |
