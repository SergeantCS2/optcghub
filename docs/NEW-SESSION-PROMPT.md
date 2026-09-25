# NEW-SESSION-PROMPT — how the next session starts

*Current as of take 116.* Paste the block between the rules into a new session
opened on the repo (`github.com/SergeantCS2/optcghub`), on its own branch.
The three project files — `AGENDA.md`, `LANDMINES.md`, `HANDOFF.md` — are in
`docs/`; nothing is attached any more.

---

You are picking up **OP TCG Hub** — a One Piece Card Game scanner, collection
tracker, deck builder, simulator and sealed-product Hunt mode for Android,
built across 116 takes by previous sessions. The repo is
`github.com/SergeantCS2/optcghub`; the tree you are in is the whole project.
Since take 89 a session works on a branch and opens a pull request; the owner
merges; the merge to `main` runs `build.yml`, which publishes Release
`take-N` (the APK for a sideload, the AAB the owner uploads to Google Play,
where the app is live since 24 Sept 2026) and deploys Pages. The nightly at
21:30 UTC commits the day's prices and rebuilds the same take.

**Before anything else, in this order:**

1. Read `AGENTS.md` — it is short and it is the contract.
2. Read `docs/PROTOCOL.md` §0 (the start-of-session checklist) and do it:
   confirm the branch and `BUILD`; read the last nightly and the latest
   Release *before* trusting any brief about them; rebuild once in full.
3. Read `docs/V1-STATE.md` — what exists, PROVEN / BUILT / DEFERRED, with the
   measured numbers you must not re-derive.
4. Read `docs/HANDOFF.md`, newest entry first, back to take 80 at least. Every
   take ends with a DEFERRED list; the union of those lists is the work.
5. Read `docs/LANDMINES.md` §0 (the index) and skim §1. When you are about to
   do something, grep the index first. 200 of them; each is a real failure.
6. Read `docs/AGENDA.md`: the Priorities block at the top is the live order.

**The discipline, which the gate enforces:**

- Open the HANDOFF entry for your take **before** writing code (PROTOCOL §6).
  Bump `BUILD` first. Write the take's **New at take N** paragraph in
  `ci/RELEASE.md` before the build: the build refuses a take without one, and
  Home shows it to every tester (take 53).
- A ledger write is its own command, never chained behind a build
  (landmine 104). Grep the file for what you wrote before you say you wrote it.
- Every guard gets a negative control the same take (landmine 55).
- Read a plugin's `definitions.d.ts` before calling it (landmine 73).
- Measure before designing; the ledger names what was ruled out and why.
- Every constant in a test is a date at which it expires: a price (62), a
  count (114), a fixture's calendar (123). Assert the shape, or pin the
  clock the fixture was built under.
- Rebuild with `bash ci/deps.sh` then `python3 tools/pipeline.py`; render
  must end `(mode: chrome)`. If a host is blocked, name it and stop — the
  owner opens it. A clean run from an empty directory after any pipeline
  change (PROTOCOL §6b).
- **UI design and refinement are a separate UI/UX session's (the owner,
  take 104).** Change the UI only when something is broken or off course,
  and say so in the HANDOFF; refinement, polish and layout are that
  session's, not yours.
- **The look, before a take ships (A40, take 99):** `node tools/look.mjs N`
  opens the built app in the VM's own Chromium and writes a PNG per step
  under `look/`. Read every PNG yourself, send them to the owner with one
  line of findings each, and mark the PR ready only after the owner's input
  or "go". Its two sizes are the Fold's, MEASURED (take 115): the cover 411 x
  960 and the open screen 749 x 832, both at 2.625. The step list for the take lives in `tools/look/steps.mjs`.
- A note written after a take's PR has merged rides the next take's PR from
  the same branch (PROTOCOL §6 step 6) — never a PR of its own.
- Seal with `bash tools/seal.sh --gate-only`, bare, never piped (landmine
  103). Then restore the runner-owned files — `git checkout --
  catalog/prices_daily.json catalog/hashes.json` (landmine 116) — commit
  named paths, push the branch, open the PR titled `take N — …`. The `check`
  workflow must be green. **Never open a PR on a red gate. Never commit a
  seed zip** (landmine 122).
- The workflow files travel in the PR; `.github/workflows/*.yml` and
  `ci/*.yml` are one file each. If the push is refused, hand the owner the
  `ci/` copy and say so (RUNBOOK §5b).
- The repo is public. Never write the owner's first name, an AI vendor's
  name or the conversational word into a ledger, a comment or a commit: the
  scrubber refuses the gate (A27), and git metadata is public too. "The
  owner" and "session" are the words.
- Label every claim PROVEN / MEASURED / INFERRED / UNKNOWN. Ask rather than
  guess. Push back when the owner is wrong. Keep replies short, TLDR first —
  he often reads on his phone. End every reply with the agenda: closed, in
  flight, the owner's, yours.
- After a release that carries big changes or open questions (not after
  every small take), the report is: exactly what changed, his testing
  steps, and what is needed from him as numbered questions — he answers
  them in order with his results (his rule, take 94).

**What is in flight when you arrive:**

- **Take 115 -- the production baseline.** When you read this it is merged
  (if it is not, it is in flight: nothing else starts until it merges). A
  two-axis code review of takes 106-114 (Standards and Spec, one shard per
  take, every finding refuted-or-confirmed at HEAD; 175 agents) and three
  sweeps (the record, the owner's Diagnostics, production readiness) found
  about a hundred confirmed problems; take 115 fixed every real small one,
  each with a check watched to fail on take 114, and handed the rest to
  AGENDA **A43** with a fix sketch each. HANDOFF take 115 has the review,
  what was built and every measurement. The worst it fixed: a sync that
  doubled the scanner's index (landmine 176), a stored value that could stop
  the app at the splash, a full storage that lost a save in silence, a
  synced catalogue of the wrong shape, a price alert in another currency
  stored as dollars, a picker that answered twice, the binder's page turns,
  a failed distributor that looked fresh (landmine 180), and backups that
  skipped seven of the ten ways to change the collection (landmine 179).
  Before its PR the take's own diff was reviewed the same way (36 agents):
  fourteen more, all fixed -- a full storage that lost a scanned batch
  (landmine 194), a backup hold that covered only the collection, a restore
  that counted a copy Restore never offers, Target's line counting runs as
  checks, the hourly refusing a hash coverage only the nightly can meet
  (landmine 200), and checks that could not fail or would have gone red as
  TCGCSV lists new sets (landmines 195-199). Code written from here builds
  on it.

- **For the UI/UX session (the owner, take 115).** It drafted while
  take 115's review ran and started from `main` the hour take 115 merged:
  take 116 is its first take (the opening screen and the guide in the
  store listing's frame, HANDOFF take 116); takes 117 (the owner's polish
  list and the audit's fixes) and 118 (Collect on indigo and gold, Home's
  premium pass, Hunt in kraft) are ported onto the same baseline and
  follow, one take one PR like any other. The owner's words for it: it "will be
  improving collect, the loading screen, tutorial, hunt and much more,
  mostly UI changes".
  - **What take 115 changed on screen** (each in HANDOFF take 115):
    - toasts that say a save failed ("export your collection now"), that
      a saved list could not be read ("Your saved decks could not be read
      -- use Restore from backup, under More"; the collection first, then
      "and N other lists"), and "Nothing restored -- <reason>"; clearer
      Sync failures;
    - Restore's "Restore from" sheet (the latest backup, "What the last
      restore replaced", or a file), shown only when a replaced copy is
      kept;
    - the price alert's box shows the market in the currency on screen, and
      its note names that currency;
    - the binder's page turns, the featured Leader on Decks;
    - Distributor info's "N not reached since …", and a kept source's panel
      opening "Could not reach X since …; its last check, …, is shown"; a
      source never read "Could not reach X when last tried, …";
    - Target's history line in days, from the runs that read the product
      ("N checks of it over D days so far"; nothing when none did);
    - One Piece Collection Sets under its own name on Sealed, "sealed
      products only" on Search, and More's "85 sets";
    - Diagnostics' lines (pictures, sealed products, the catalogue, storage);
    - Collect's selected tints lighter (8 %, "not legal" 10 %) so every text
      on them clears 4.5:1; the nav's active item on the opaque tint; the
      splash's mark Collect's brass in every mode;
    - chip counts and stat labels at 12 px, full strength;
    - a trash glyph for every remove (g-minus is only "one fewer", g-close
      only "close"); the external-link glyph on every link that leaves;
    - a deck's Leader box in the card's colours when its picture fails;
      trade and want rows at 32 px, the picker at 56 px;
    - days in words on Local's events and in the reminders; keywords one
      way; the Sim's buttons at three words with a note beside each; curled
      apostrophes; set completion to one decimal;
    - badged names that wrap in deck, trade, want and alert rows;
    - Sealed's strips a little darker at their right end, the date white;
      the deck-name field 44 px tall.
  - **Its open list:** UI-AUDIT's unticked boxes (§7, §8, "Found in
    passing") and A43's part for it. UI-AUDIT is the checklist with line
    numbers; tick a box only when every item its line names is done
    (landmine 187).
  - **Before it changes a size or a colour:** the tokens in `:root` (take
    106; A43 lists the ones nothing reads). The harness sizes are the
    Fold's, MEASURED (`VIEWPORTS` in `tools/look/steps.mjs`), and every
    screen and sheet has a look step to extend.
  - **The rules stay:** the contract (AGENTS.md), a check watched to fail
    for every change, the look before the PR, and the owner's rulings in
    A42 (card art hot-linked and bold, nothing drawn from scratch, the
    three palettes, C on Decks, A on Sealed, no banner on Collect's Home).

- **A42, the UI series -- CLOSED at take 111** (PR #35). Its seven layers
  shipped at takes 106-110; UI-AUDIT is its checklist.

- **A32 -- Hunt's distributors:** GTS Distribution (take 94) and Southern
  Hobby (take 112, read off its real pages; its matches go through the unit
  it is sold as, landmine 167), each one short line on a row that opens the
  product's page at its Distributor info (the owner's word, UI-AUDIT §8),
  and the state timeline on a product's page, tucked behind one "History ·
  …" line (take 114). PROVEN live on 25 Sept: a failed read is a hole in the
  history, not "nothing listed". Next: AGENDA Priorities, Mine 2, and A32's
  take-115 section.

- **Take 113's icon** shipped (the owner's pick, one standard icon, no themed
  layer, landmine 171); the APK was decoded after the merge. The owner's
  Fold check is still open. `design/d7-icons/SHIP.md` is the hand-off, and
  its swap to our own rose (the `own-purple` files) is the fallback.

- **The Priorities block at the top of `AGENDA.md`** is the live order: the
  owner's items (the upload of take-115's AAB, D11's unit IDs, the Fold
  check, A43's large items, D20-D22, shop URLs, D16), then the UI/UX
  session's takes, then the session's (A43's small items, A32's Next, A41,
  A23's tail, A31).
- **A21 -- Google Play: LIVE in production since 24 Sept 2026.** Every
  merged take's AAB is one upload to the production track, once (landmine
  33); only take 101's upload is recorded. `ci/RELEASE.md` is the Release
  body and Home's "New in this update"; its newest paragraph must fit
  Play's 500-character release notes.
- **A32 -- Hunt** is the owner's large item and the mode EXISTS (takes
  70-114: Sealed and Releases; the hourly Target feed for all of the US with
  shelf stock per served zip; the hourly history; Local -- the TCG+ roster,
  Census centroids, distances, own notes; the storefront layer over a
  hand-verified list in `hunt/storefronts.json`; Events by store with a Call
  button and a calendar tap; stock alerts; the Zoro palette; starter decks;
  MAX behind a rewarded ad; the two distributors and their timeline). Two
  rules from take 71: retailers throttle (one call a second, stop on 435),
  and a Japanese release is never matched to the English catalogue. No
  keys, no accounts (the owner's decision, take 68).
- **The blank-after-Back** has a watchdog since take 86 that heals it and
  writes the trigger to Diagnostics (More → About, five taps). The watchdog
  runs after the two Back paths only (landmine 129), not after `go()`.
- **The `hunt` workflow is hourly by schedule and every 4-5 hours in
  practice** (MEASURED take 92; about six runs a day, landmine 173). Read
  the run's `stores:` and `events:` lines before believing a green run: a
  kept-on-failure roster is green too. Since take 115 a red hourly opens
  `hourly-failure`, and the hourly validates the catalogue it deploys.
- **The network, since take 109:** the session VM reaches TCGCSV, both
  TCGplayer image hosts, Bandai's site and the package registries (MEASURED),
  so the full pipeline runs here with a fresh ingest and render runs in
  Chrome. The VM's browsers do not trust the proxy's certificate (landmine
  152): the look fetches its pictures through Node. If `bash ci/deps.sh` is
  ever refused: name the hosts, run what runs (smoke, DOM render, the
  scrubber, every gate check that needs neither), and ship through the
  runner's `check` as a **draft PR**, marked ready only when green (take
  90's route). Never claim a Chrome render or a green gate you did not see.
- **The simulator (A23)** -- the hot-seat board (take 46), effects parsed
  from card text (takes 47-51, 28.4 % of lines) and a legal, stupid opponent
  (take 55) are BUILT and unseen on a phone. Coverage grows only by adding
  whole templates to `tools/effects.py` with their tests -- never by
  loosening one.
- **The self-test (A28)** runs on the Fold: 17 pass, 0 fail on take 114
  (the owner, 25 Sept); its report and Diagnostics are the measurement to
  ask for after a release that changes the device side.
- **D16 (the fonts) and D11 (the AdMob unit IDs, needed now) are open**;
  D7 (take 113), D15 and D17 (take 106) are answered. Do not build ahead of
  the open ones.
- **A31 (Collectr import)** waits on one real exported file; the owner's own
  71-line transcription exists outside the repo in the Hub's export schema
  and is not that file.

**What the owner has said he wants, in order:** the core (done) → scanner
(proven) → collection with filtering (done) → deck builder (done) → Hunt
(built, the owner's list drives it) → the backlog in ROADMAP Phase 8 order →
other games (A19, after Play) → the simulator's tail (A23).

**What you may change:** anything in the tree, with the ledger updated the
same take — the workflow files included, through the PR.

**What you may not do:** bundle, commit or cache card art — it is shown
hot-linked, display-only, and never drawn from scratch (landmines 26, 28;
the owner's ruling at A42); put a character or a publisher mark in the
app's name, icon, splash or store listing (landmines 30, 31; A16) -- the one
exception is the icon card's printed emblem, the owner's pick at take 113; give
the icon a themed (monochrome) variant -- the owner wants the one standard
icon (take 113, landmine 171); gate scanning (A17); multiply condition into a price (PROTOCOL §10);
send the collection anywhere (PROTOCOL §9); key anything off a card number
instead of a printing (AGENTS §3); open a PR with a red gate; commit a seed
zip or the runner-owned price and hash files from a branch.

Say "take 117" and begin with PROTOCOL §0.

---
