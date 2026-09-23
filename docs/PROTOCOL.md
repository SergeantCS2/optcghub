# PROTOCOL

*Current as of take 99.*

The working rules for this project. The gate enforces the ones it can.

Inherited from APEX ORV at its take 167. Sections marked **[INHERITED]** are
carried over unchanged because they were paid for on that repo and cost nothing
here. Sections marked **[NEW]** are specific to a collection tracker.

---

## 0. Start of every session **[INHERITED; take 32 for a seed start; rewritten take 89 for the branch flow]**

The session starts in a git checkout of the repo, on its own branch. The tree
is the truth; the record of what shipped is the Release page and the Actions
tab, not a folder a previous session remembers filling.

0. **Confirm where you are:** `git status`, `git log -3 main`, and `BUILD`
   says the take you expect — the last one merged. Your branch starts from
   `main`.
1. **Verify the deliverables where the owner reaches them:** the latest
   Release `take-N` carries the APK he installs, and Actions shows the last
   nightly green. A red nightly or a missing Release is the first fact of the
   take — read the run's last group before anything else (RUNBOOK §8). Four
   red nights went unread once because the take's brief said one.
2. **Read** `V1-STATE.md`, then `HANDOFF.md` newest-first, then `LANDMINES.md`
   §0, then `AGENDA.md`. In that order; the state document is the map.
3. **Rebuild once, in full:** `bash ci/deps.sh` (pillow, puppeteer, acorn)
   then `python3 tools/pipeline.py`. A fresh checkout has no TCGCSV cache, so
   ingest must run; the gate wants Chrome's render receipt, so render must
   run in Chrome — `mode: chrome` in its last line, landmine 112. Green
   before any change; red on an untouched `main` is the take. **If a host is
   blocked, name it** — the package registries and the image CDN have been —
   and the owner opens it in the environment. Do not route around it.
4. **Open the HANDOFF entry** for the new take before any code (§6). Bump
   `BUILD`. Write the `ci/RELEASE.md` paragraph.
5. **Ship as a PR** (AGENTS, *Shipping a take*): gate green bare, the
   runner-owned files restored, named paths committed, the branch pushed, a
   PR titled `take N — …`, the `check` workflow green. The owner merges; the
   merge builds.

**Recovery, not the flow:** `bash tools/seal.sh` still writes a seed zip —
outside the tree — and the `seed` and `bootstrap` jobs still rebuild the tree
from one (RUNBOOK §6). A seed zip is never committed (landmine 122).

The inherited list follows and still applies.


**Deliverables are verified where the person reaches them.** A session that hands
over work checks what is ACTUALLY on the Release and in Actions — not what a
previous session remembers putting there. Every Release carries its take in
its tag; a seed zip, when one is made, carries it in its filename
(`optcghub-seed-tNNN.zip`) with its sha256 printed beside it.

**One-off audit probes are code and get the same suspicion as checks.** A probe
is verified against a known-true case before its findings are believed.

Read, in this order:

1. `docs/LANDMINES.md` §0 — the symptom index. Do not read landmines top to
   bottom; nobody finds the right one that way.
2. `docs/AGENDA.md` — what is open, and what has already been ruled out for each.
3. `docs/HANDOFF.md` — newest take first.

---

## 1. Evidence labelling **[INHERITED]**

Every claim about system behaviour is one of:

- **PROVEN** — observed directly, with the observation stated. "I ran it and saw X."
- **MEASURED** — a number, with the method that produced it.
- **INFERRED** — reasoned from documentation or analogy. Say so.
- **UNKNOWN** — not established. Say this instead of guessing.

Label first, and when in doubt label down.

**A specific trap for this project:** "the plugin supports it" is INFERRED until
it runs on the Fold. A desktop Chrome `getUserMedia` stream is not evidence about
a Samsung WebView, and an OCR accuracy figure from clean scans is not evidence
about a foil card in a toploader under a kitchen light.

---

## 2. Takes **[INHERITED]**

Every shipped build gets a number, stamped in `BUILD` as `VAULT_TAKE=N`. Takes
are never reused and never back-dated.

---

## 3. Check upstream before building a mechanism **[INHERITED, retargeted]**

Before writing anything that looks like infrastructure, check whether it exists:

- Card catalogue and prices → **TCGCSV**. Do not write a scraper.
- On-device OCR → **ML Kit** via `@capacitor-mlkit/text-recognition`. Do not
  ship a WASM Tesseract build without measuring the native one first.
- Quad detection and perspective warp → **OpenCV.js**. Do not hand-roll a
  corner finder.
- Perceptual hashing → dHash is nine lines. This one you may write; it is
  smaller than any dependency that provides it.
- SQLite on device → `@capacitor-community/sqlite`. Do not invent a store.
- Charts → the sibling repo already ships a renderer. Read it first.

**Copying beats deriving.** A mechanism you wrote is a mechanism you maintain.

---

## 4. Cleverness policy **[INHERITED]**

Prefer the boring mechanism. If a fix requires explaining why it works, it is
probably the wrong fix. Removing something is a valid change and usually a better
one than adding.

---

## 5. Three-strike circling rule **[INHERITED]**

**After three consecutive failed attempts at the same symptom, stop.** Then, in
order:

1. Write down what has been ruled out, with evidence. A short list is itself the
   finding — the attempts were not producing information.
2. Find something that already does the thing and works, and read its source.
3. Add a readback diagnostic. Turn "it doesn't work" into a fact.
4. Ask the owner for a *differential test*, not another build. A test that isolates
   one variable is worth more than three builds that change several.
5. If none of that produces a new fact, say so and offer to stop.

**A sign you are circling: your last three changes were all ADDING things.**

---

## 6. Ordering — the lossy step goes first **[INHERITED]**

1. Write the HANDOFF entry **first**.
2. Update LANDMINES / AGENDA / ROADMAP if the take taught anything.
3. Build and run the harnesses (smoke, render).
4. **The look (take 99, A40):** `node tools/look.mjs N` clicks through the
   take's changes in the session's own browser and writes a PNG per step
   under `look/`. Read every PNG yourself, send them to the owner with one
   line of findings each, and mark the PR ready only after his input or
   his "go". The step list is the take's, in `tools/look/steps.mjs`; a
   take that changes what the collector sees adds its steps there.
5. Gate, ship.

If a response runs out of room, what is lost is the build — one message away and
obviously missing — instead of the record, which is silently gone forever.

**Never compress a cycle to fit one response.** A ship may span two turns. Say
which turn you are on.

**End every shipping response by stating what was DEFERRED.** Deferral that is
spoken is a decision; deferral that is silent is a hole in the record.

---


*Take 53/54:* the take's **New at take N** paragraph in `ci/RELEASE.md` is
part of opening the take. The build lifts it into the manifest and Home shows
it to testers; a build without it stops and says so.
## 6b. Clean runs **[INHERITED]**

**Any take that adds or changes a pipeline step is followed by a clean run before
it ships.** Copy the committed files into an empty directory, run
`tools/pipeline.py`, then gate.

This matters more here than it did on APEX, because `tcgcsv_cache/` makes a
broken fetcher invisible: the join still succeeds against yesterday's payload and
the catalogue still builds.

---

## 7. The gate **[INHERITED]**

`tools/gate.py` runs on every build. It is not advisory. Every check corresponds
to a mistake that is easy to make and hard to notice. When a new one turns up,
add a check rather than resolving to be careful.

---

## 8. Offline is about the shop floor, not about the network **[NEW, modelled on APEX §8]**

APEX's version of this rule was about a rider thirty miles into a forest. The
equivalent here is a collector standing at a card shop table, or in a basement,
or at a convention hall where five thousand phones are fighting over one cell.

**Provisioning — at home, on wifi.** The app may download the catalogue, price
updates and reference images. This is expected and fine.

**Scanning — no signal assumed, ever.** Nothing in the scan → identify → value →
store path may depend on a network call. Not the OCR model, not the hash index,
not the price, not a licence check.

**The invariant that makes this safe rather than aspirational:**

> After a catalogue sync completes and verifies, the app must be **provably**
> complete. The test is a cold start in airplane mode: scan a card, resolve its
> printing, see its value, and commit it to the collection, with the NET badge
> green throughout.

Three controls:

1. **Runtime assets carry no remote origins** except the declared allowlist —
   `docs/PROVISION.md`'s table, which the gate enforces by refusing any other
   host in `www/`. It began as two entries (the sync host and the TCGplayer
   image CDN for cards the collector has not scanned) and carries five since
   take 65 (the Pages sync, the CDN, and three links the OS browser opens).
   Only the sync is load-bearing — the airplane-mode invariant above is
   untouched, because a scanned card uses the collector's own photograph and
   every hot-linked picture fails to a labelled placeholder. *(Wording
   corrected take 93; the count and the "in the gate" purpose check were
   stale — landmine 129's shape.)*
2. **The app wraps `fetch` and `XMLHttpRequest`** and shows a NET badge.
3. **Every provisioning host is declared** in `docs/PROVISION.md` with its
   purpose, licence and refresh cadence. The gate refuses an undeclared host.

---

## 9. The collection is load-bearing **[NEW, replaces APEX §9]**

On APEX, Phase 4 was safety: a rider getting home. Here the equivalent is the
collector's data.

Anything in ROADMAP Phase 5 — export, backup, restore, import — does not get cut
for schedule, does not ship behind a toggle that defaults off, and never depends
on a network call. If any of it can fail silently, it needs an indicator showing
it is working.

A collection is months of a person's evenings. Losing it is this project's
equivalent of routing someone onto a trail they cannot legally ride.

---

## 10. Money claims **[NEW]**

This app displays dollar figures a person may act on. Three rules:

1. **Every price carries its source and its date.** Not in a settings screen — on
   the card. `$467.33 · TCGplayer market · 31 Aug`.
2. **Never present a modelled number as a transaction.** The market price is not
   what the card sold for and is not what it will sell for. On the take-1
   measurement, `EB03-024 (SP)` had market $467.33 against a low of $400.00 —
   a 17% spread on the same printing on the same day. The card detail shows the
   spread rather than hiding it.
3. **Never invent a condition adjustment.** TCGCSV publishes no per-condition
   pricing (landmine 4). The app shows the price it has and labels the condition
   as the collector's own assertion. A made-up "×0.85 for Lightly Played" would
   be a confident wrong answer about someone's money.

---

## 11. Before shipping, ask **[INHERITED]**

- Did I label PROVEN / MEASURED / INFERRED / UNKNOWN honestly?
- Did I check upstream before building a mechanism? (§3)
- Is this my third failed attempt at the same symptom? (§5)
- Did I write the HANDOFF entry FIRST? (§6)
- Have I stated what I am DEFERRING this cycle? (§6)
- Am I asking the owner to test more than one thing at a time?
- Does anything I added key off a card number instead of a printing? (AGENTS §3)

**Touched steps run before the seal.** If a take edits a pipeline tool, that step
executes this take before anything is sealed. Parse is not verification; cached
payloads hide dead code until the clean CI runner finds it.
