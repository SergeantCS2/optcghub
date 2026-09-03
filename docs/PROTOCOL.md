# PROTOCOL

*Current as of take 35.*

The working rules for this project. The gate enforces the ones it can.

Inherited from APEX ORV at its take 167. Sections marked **[INHERITED]** are
carried over unchanged because they were paid for on that repo and cost nothing
here. Sections marked **[NEW]** are specific to a collection tracker.

---

## 0. Start of every session **[INHERITED, extended take 32 for a seed start]**

When the session starts from a seed zip rather than a live tree:

0. **Unzip the seed** to `~/vault-seed`. Confirm `BUILD` says the
   take you expect. If the container already holds a tree, the seed wins.
1. **Verify the deliverables** where the owner reaches them: the session's
   outputs folder should carry the last seed and APK; if not, that is the first fix.
2. **Read** `V1-STATE.md`, then `HANDOFF.md` newest-first, then `LANDMINES.md`
   §0, then `AGENDA.md`. In that order; the state document is the map.
3. **Rebuild once:** `python3 tools/pipeline.py history catalog validate app
   smoke stamp gate`. Green before any change. Red on a fresh seed means the
   seed was sealed wrong, and that is the take.
4. **Open the HANDOFF entry** for the new take before any code (§6). Bump
   `BUILD`.

The inherited list follows and still applies.


**Deliverables are verified where the person reaches them.** A session that hands
over work checks what is ACTUALLY in the outputs directory — not what a previous
session remembers putting there. Every sealed seed carries its take number in its
filename (`optcghub-seed-tNNN.zip`) and its sha256 is printed beside it.

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
3. Build, gate, ship.

If a response runs out of room, what is lost is the build — one message away and
obviously missing — instead of the record, which is silently gone forever.

**Never compress a cycle to fit one response.** A ship may span two turns. Say
which turn you are on.

**End every shipping response by stating what was DEFERRED.** Deferral that is
spoken is a decision; deferral that is silent is a hole in the record.

---

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

1. **Runtime assets carry no remote origins** except the declared allowlist.
   The allowlist has exactly two entries and both are user-tap-only: the
   catalogue/price sync host, and the TCGplayer image CDN for browsing cards the
   collector has not scanned. Neither is load-bearing — the airplane-mode
   invariant above is untouched, because a scanned card uses the collector's own
   photograph.
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
