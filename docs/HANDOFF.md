# HANDOFF — through Take 30

## Take 30 — 2026-09-03 — the repo, for real: the workflows read against the tools, and the runbook rewritten

Opened before any code (PROTOCOL §6).

### Jacob's ask

Get this into GitHub. Update all documentation. Provide every step.

### What reading the workflows against the tools found

`build.yml`, `bundle.sh` and `apk.sh` were written at takes 4–9 and the
pipeline has grown twenty-one takes since. Three things would have failed on
the second night, one on the first:

1. **The price-history sidecar was never committed back.** `history.py`
   appends tonight's prices on the runner; the next night's checkout starts
   from the committed copy. History would never have accrued past the seed,
   every 7d/30d delta would have stayed empty forever, and nothing would have
   said so. Landmine 66 on CI. `bundle.sh` now commits and pushes the
   sidecars; `catalog/` is not in `push.paths`, so it does not re-trigger.
2. **`gh release create` fails on an existing tag**, and the nightly cron
   builds the same take every night. Create once, then replace the assets.
3. **`build-tools/36.0.0` was pinned** and a runner image may not carry it.
   The newest present is used.
4. **The signer was never checked in CI** — eleven takes of checking it by
   hand in chat. It is a gate in `apk.sh` now: not the committed sideload key,
   no release.

Landmine 105 covers the first three; the fourth is landmine 211's rule
finally applied where it matters.

### The runbook, rewritten

`docs/RUNBOOK.md` is the entire procedure now — eight sections, in the order
they must happen, with the two settings a first run silently needs (Pages
source = GitHub Actions; workflow permissions = read and write), what each of
the four jobs should show on the first run and how long, the one config line
for live prices, the four Play secrets, and a "first night" check whose whole
point is one commit: `nightly: prices YYYY-MM-DD, 2 day(s) on file`.

**smoke.mjs 235, render.mjs 48 (Chrome). Workflows parse; scripts pass
`bash -n`.**

### DEFERRED this cycle

- **Running it.** Everything in this take is a reading, not a run. The first
  run is Jacob's, and the first red job is expected to teach something the
  reading did not — that is what the "if something goes wrong" table is for.
- **The Play side** (RUNBOOK-play) is unchanged since take 22 and correct.
- **A2's remaining half, D11, D15, D7, pictures, the cellular guard.**

## Take 29 — 2026-09-03 — import formats, the workflows checked, and "is it in a good spot"

Opened before any code (PROTOCOL §6).

### Jacob's question

*"Let me know when you think it's in a good spot."* The honest answer, written
here so it is on the record:

**The core is in a good spot for a closed test, and has been since take 22.**
Every row of the reference app's parity matrix is built or disclosed;
scanning is proven on the device; the deck builder follows the official
rules; backup survives uninstall; ads are wired against test units; the tour
explains it. What stands between this seed and a running fourteen-day clock
is not code: it is the repo (A21 step 2 — `build.yml` has never run on a
runner), the Play console, screenshots from a phone, sixteen testers, and one
config line for live prices. All of it is Jacob's, none of it is hard, and
none of it gets easier by adding features.

What is NOT in a good spot, honestly: the scanner's field half — foils,
sleeves, toploaders — is unmeasured, and the closed test is exactly where
that gets measured. That is a reason to start the clock, not to wait.

### This take

- **8.8 — deck-list import formats.** The importer takes `4 OP01-016 Nami`;
  OPTCG Sim exports `4xOP01-016` with no space, and Limitless copies as
  `4x OP01-016`. Three formats, one regex, a test for each.
- **The workflows, checked as far as they can be here.** Neither has run on a
  runner; both can at least be parsed and their job graph read back.
- **RELEASE.md** is take 22's. Refreshed to what a tester installs today.
- **The delta download** — measured and deferred, with the number.

### Built

- **One deck-list parser, five shapes** — this app's own, Limitless with and
  without the `x`, OPTCG Sim's no-space `4xOP01-016`, the forum `NUM x4`, and
  a bare number as one. Both importers use it; a test per shape.
- **The workflows parse** and their job graph reads seed → bundle → pages +
  apk. That is as far as a runner-less check goes, and it is written that way.
- **RELEASE.md** is take 29's: what a tester installs, and five minutes in
  the order that produces the unmeasured number.
- **A25** — sync cost measured: 0.56 MB gzip per day, 16 KB as a delta.
  Deferred with the number; the cellular guard is one line next pass.

**smoke.mjs 235, render.mjs 48 (Chrome).**

### Two landmines about the ledger itself

Landmine 103 (the seal piped through `tail`) was told to Jacob at take 28 and
was not in the file: the script that wrote it was chained behind a failing
build. Landmine 104 is that. Both are in the file now — grep-checked, not
read off a terminal — and AGENTS carries the two rules: the seal runs bare,
and a ledger write is its own command.

### DEFERRED this cycle

- **Cellular guard on the quiet sync.** One line; next.
- **8.9 trade matching via QR** — needs the ML Kit barcode plugin for the
  scanning half; the sharing half already exists as text.
- **Everything of Jacob's** — and the assessment above says the next real
  step is his.

## Take 28 — 2026-09-03 — the colour question on the agenda; binder view; deck price history

Opened before any code (PROTOCOL §6).

### Jacob's ask

The colour scheme still reads as Collectr; something One Piece, maybe a
transparent background; green for up and red for down stay. Not a priority.
Recorded as A24 with options and a question (D15), and left there.

### This take

Phase 8 next two: **8.6 binder view** — nine-up pages in card-number order,
the way a binder is actually laid out — and **8.7 deck price and history** —
a deck is a list, the chart code exists.

### Built

- **Binder** — nine pockets a page, one set at a time, in numeric order, one
  pocket per number held: the scanned photo if there is one, else the
  reference art, ×N when more than one. Empty pockets for numbers not held, so
  a page reads like the object does — gaps and all — and an empty pocket is a
  want-toggle. Pages flip; the page is remembered per set. From the action
  row.
- **Deck value and history** — on the deck screen: today's value at the
  sleeved printings, the move since yesterday, how many of the deck's cards
  the collector owns and what the rest cost, and a dashed estimate line across
  every catalogue day on file (landmine 91's rule; `sparkOn` generalises the
  portfolio spark to any canvas).
- **Landmine 101, fourth consequence** — two pockets reading "002"; labels
  now show the full number for a reprint carrying another set's number.
- **A24 and D15** on the ledgers, not a priority.

**smoke.mjs 227, render.mjs 48 (Chrome).**

### DEFERRED this cycle

- **The binder shows one pocket per number.** A collector with a base and an
  alt-art of the same number sees the dearer; a "pocket per printing" toggle
  is the natural next ask.
- **Deck history is the estimate only** — no per-deck snapshots; the estimate
  is the honest one for a list that changes.
- **8.8 Limitless import, 8.9 trade matching via QR** next.
- **D15** and everything of Jacob's.

## Take 27 — 2026-09-03 — price alerts

Opened before any code (PROTOCOL §6).

**8.5 — price alerts.** "Tell me when OP01-016 (Manga) drops under $1,500."
The nightly build already knows every price; the app already carries every
day's history. What is missing is a watch and a way to say so when the phone
is closed. The local-notifications plugin gives the second; its API is read
from `definitions.d.ts` first (landmine 73). No server: the check runs when
the app syncs a fresh catalogue, which is the only moment a price can have
changed.

### Built

- **Price alerts** — on a printing, below or above a price, from the card
  page. Checked at boot and after a sync, idempotent per catalogue date, fires
  once through the local-notifications plugin (API read from its definitions)
  or a toast in a browser, then rests until re-armed. Listed under the want
  list. In the backup.
- **In-app catalogue refresh — which did not exist.** Wiring the alert check
  to "after a sync" found there was no sync: the installed app only ever read
  its bundled catalogue. Landmine 102. `refreshCatalogue()` now fetches the
  nightly bundle from Pages, keeps it on disk, and the loader takes the newer
  of disk and bundle. Opt-in via `UPDATE_URL`; PROVISION declares the host;
  RUNBOOK §4b says when to set it. The stale banner's copy is true now.

**smoke.mjs 217, render.mjs 48 (Chrome).**

### DEFERRED this cycle

- **`UPDATE_URL` is empty** until the repo and Pages exist — Jacob's step.
  Until then the app says "update the app for newer prices", which is true.
- **The refresh downloads the whole 4 MB catalogue.** A delta would be
  kinder on mobile data; the nightly already computes deltas. Not yet.
- **Alerts on a NUMBER** ("any Nami under $1") rather than a printing — a
  reasonable ask; the model is per-printing on purpose (landmine 1).
- **8.6 binder view, 8.7 deck price history** next.

## Take 26 — 2026-09-03 — the checklist grid and the want list

Opened before any code (PROTOCOL §6).

Phase 8, next two, taken together because one falls out of the other:

- **8.3 — set-completion checklist grid.** Home's set-completion panel says
  "34 of 121"; the collector wants to see *which* 87 are missing, as a grid in
  card-number order, each a tap from search or the scanner.
- **8.4 — want list.** The inverse of the collection, valued the same way. A
  missing card in the grid is one tap from the want list; "what would it cost
  to finish OP-06" is the want list's total for that set.

### Built

- **The set checklist** — every number in a set as a binder-style grid in
  numeric order, the reference art faint under the missing ones and bright
  under the held ones with ×N, wanted ones dotted. All / Missing / Have.
  "6 of 66 — the 60 missing come to $63.33 at each one's likeliest printing."
  Tap a missing card to want it, a held one to open it, or *Want the 60
  missing* at once. Home's set-completion rows open it.
- **The want list** — keyed on number, valued at the likeliest printing
  (landmine 84's rule), totalled and broken down by set. From the checklist,
  from a card's page, from the action row. In the backup.
- **Landmine 101** — a set can carry cards numbered for other sets; the sort,
  the completion count and the scanner's set chip were each checked against
  that.

**smoke.mjs 205, render.mjs 48 (Chrome).**

### DEFERRED this cycle

- **The want list values at the likeliest printing** — a collector who wants
  *the SP* specifically can set it from the card page (the `id` is stored) but
  the checklist path always wants the number. Right default; a long-press to
  pick a printing would complete it.
- **8.5 price alerts** is next; it needs the local-notifications plugin, read
  from its definitions first.
- **Everything of Jacob's, no deadline.**

## Take 25 — 2026-09-03 — Cards for the table, the tour learns the modes, who goes first

Opened before any code (PROTOCOL §6).

Three from take 24's "mine, next":

1. **8.2 — card-text search, as Prep & Play's Cards screen.** Take 24 made
   Cards a palette swap of Collect's search. A deck-builder's browse is a
   different question: *which Blockers under 4 cost are Red?* Keyword chips
   from the take-12 extraction, a cost range, and a "for this deck" toggle
   that filters to the open deck's Leader colours and adds straight into it.
2. **The tour** has no card for the modes. One card.
3. **Play** — a "who goes first" toggle so the first player's +1 DON!! on turn
   one (§6-4-1) is modelled rather than left to taps.

### Built

- **Cards** — Prep & Play's own browse. Twelve keyword chips from the take-12
  extraction, the six colours, four cost bands, full text over the cleaned
  card text, one row per number at the likeliest printing, and **for this
  deck**: filter to the open deck's Leader colours and `+` straight into it,
  with the count already in the deck shown. "Red Blockers at cost 0–2" is
  two taps: eleven cards. The deck screen links to it.
- **Card text is in the bundle now** — it was not, and an assertion said the
  search covered it. Landmine 100; the assertion tests the data.
- **The tour** is v2 with a "Two faces" card; it shows once more.
- **Play** models §6-4-1: a "who goes first" toggle, and the first player's
  first turn is +1 DON!!, not +2. The Start button says what happens.

**smoke.mjs 196, render.mjs 48 (Chrome). Bundle 4.2 MB raw, 0.54 MB gz.**

### DEFERRED this cycle

- **Cards' text preview** is line-clamped to two lines; a tap opens the
  detail. A long-press to show the full text inline would suit the table.
- **The Play board on the Fold's inner display** — unmeasured layout.
- **8.3 set-completion checklist grid** is next in Phase 8.
- **A2's remaining half, D7, D11, pictures, the repo** — Jacob's.

## Take 24 — 2026-09-03 — two modes, a game-day counter, and a correction to landmine 96

Opened before any code (PROTOCOL §6).

### Jacob's answers and asks

- The A20 backlog is approved wholesale: "add them to the list."
- **One Piece is the main mode.** Other games remain a future maybe.
- **Two modes, a slider at the top, the whole feel changes:** *Collect* and
  *Prep & Play*. P&P holds the deck builder and, in the future, an actual OP
  TCG simulator.
- Standing instruction restated: on "continue", follow every protocol, keep
  every ledger, be meticulous.

### A correction first

Take 23 wrote landmine 96 as "the package name encodes a game and cannot
change, so D14 has a deadline." That overstated it. The package name is an
identifier users never see except in the Play URL; the **display name** is
what brands the app and it can change at any time. A multi-game app under
`com.optcghub.app` would be cosmetically odd in one URL and nothing more.
D14 therefore has no deadline; One Piece is the app; the package name stays.
Landmine 97 is about checking what a constraint actually constrains before
writing a deadline on it.

### This take

1. **A22 — two modes.** The shell: a slider, a `data-mode` on the document that
   swaps the palette, mode-specific navigation, persisted. Collect keeps the
   night-sea chart. Prep & Play gets the *table*: felt green, chalk white, a
   vermilion accent — a playmat, which is what the subject IS in that mode.
2. **A20 #7 — the Life / DON!! counter** as Prep & Play's first native screen.
   No catalogue, no network; the RULES document has the flow.
3. **A23 — the simulator**, scoped honestly as a phase, not a take.
4. **ROADMAP Phase 8** — the approved backlog, ordered.

### Built

- **The mode slider**, sticky under the status bar on every screen. `data-mode`
  on the root swaps the palette through the take-16 tokens; the nav swaps;
  the choice persists. Collect: the chart. Prep & Play: the table — felt
  `#0F2A1E`, chalk, vermilion `#D9583B`, a faint playmat weave. Verified in
  Chrome: body `rgb(15,42,30)`, one nav visible, lands on Decks, back to the
  sea on the way out.
- **Play** — the Life / DON!! counter. Two panels, the far one rotated for
  across the table; Life, active DON!! over total, given; a Leader slot that
  sets starting Life from the catalogue; Next turn does §6-2's refresh and
  §6-4's +2. Nothing saved, nothing sent. ROADMAP 8.1 done.
- **Sim** — an honest placeholder naming A23's sequence.
- **Cards** in Prep & Play is the catalogue browse; the same screen, the other
  face.
- Two bugs found by looking: both navs drew (landmine 98), a `\\u` escape on a
  button (landmine 99, second instance, now a gate check).

**smoke.mjs 187, render.mjs 48 (Chrome). Gate: 20 checks.**

### DEFERRED this cycle

- **The tour has no card for the modes.** One card, next pass.
- **Prep & Play's Cards screen** is the Collect search with a different
  palette; a deck-building-first browse (keyword filters up top, cost curve
  as you go) is 8.2 and belongs to this mode.
- **The first player's +1 DON!! on turn one** is left to the players' taps
  rather than modelled; a "who goes first" toggle would do it.
- **The Play screen's rotated panel** relies on CSS transform; it should be
  checked on the Fold's inner screen, where a two-panel side-by-side may be
  the better layout.
- **A2's remaining half, D7, D11 real IDs, pictures, the first test ad, the
  repo** — Jacob's, no deadline.

## Take 23 — 2026-09-03 — multi-game measured, an ideas backlog, and the road to Play

Opened before any code (PROTOCOL §6).

### Jacob's three asks

1. What other ideas can I think of?
2. Add the other big TCGs — MTG, Pokémon, Lorcana, Riftbound.
3. Google Play in a few days, to start the closed-testing clock.

### The order they get done in

(3) sets the priority: the clock needs a repo that has built once, a listing,
a privacy policy, a Data Safety form that matches what the APK requests
(landmine 94), and twelve testers. None of that is code. (2) is a real
architecture question and gets an honest, measured answer as A19 — what
changes, what does not, what it would cost — and a recommendation that does
not put it in the way of (3). (1) becomes a backlog, A20, ranked.

### Written

- **A19 — other games, MEASURED.** Every one is in TCGCSV; the pipeline
  generalises on a category id. The scanner does not (each game is a take 6
  and 7 again), the rules do not, MTG and Pokémon do not fit in the APK, and
  the name does not. Two honest shapes — one app with game packs, or one app
  per game — and the decision, **D14**, has a deadline: the package name is
  permanent at first upload. Landmine 96.
- **A20 — an ideas backlog**, fifteen items ranked by value over cost, three
  ruled out with reasons.
- **A21 — the road to Play**, ten steps, who does each, what state it is in.
  The repo has never built on a runner; that is step 2 and it is Jacob's.

### Built toward Play

- `docs/PLAY-LISTING.md` — title, short and full description opening with the
  disclaimer, category, content rating, the Data Safety answers matching what
  the APK requests (landmine 94), graphics, the tester note.
- `src/privacy.html` — served by Pages beside the app; names AdMob and the
  advertising ID as the only thing that leaves the phone.
- `ci/apk.sh` emits `play-assets/icon-512.png` and `feature-1024x500.png`.
- The bundle and every collection line carry `game: 'optcg'`, so the data
  model is ready for D14 either way.
- `check_play_readiness()` in the gate.

### DEFERRED this cycle

- **D14, and it is the only thing with a clock.**
- **Screenshots** for the listing need a phone.
- **A20** is a backlog, not a plan; nothing from it is scheduled.
- **The first test-ad impression, A2's remaining half, D7, pictures.**

## Take 22 — 2026-09-03 — day three, and the ad SDK against test units

Opened before any code (PROTOCOL §6). New day: TCGCSV has published a third
snapshot, and the pipeline runs before anything else so the history sidecar
captures it (landmine 66).

### Jacob's answer, in effect

He is finishing the AdMob account. Rather than wait on IDs, A17 gets wired now
against **Google's published test unit IDs** — the ones AdMob documents for
exactly this purpose, which serve real test ads and never accrue invalid
traffic. The real IDs become a two-line change in `config.py` when they exist.
Every other question (D10, D12, D13) keeps its proposed default until he says
otherwise; the defaults are constants.

### Method, unchanged

The plugin's API is read from `definitions.d.ts` before a line is written
(landmine 73). `ADS_ENABLED` stays false in the browser build and in the rig;
in the APK it follows a config flag that is on only when unit IDs are set.

### Built

The ad flow, end to end, against Google's test units: initialise at boot,
preload on Scan, show on the earn button or a refused deck save, credit from
the reward event. `ADS_ENABLED` derives from the manifest and the runtime, so a
browser never gates and the rig never gates. `ci/apk.sh` writes the app ID into
`strings.xml` and the manifest and asserts both. First AdMob build: 33 MB, the
SDK's `AD_ID` permission present (landmine 94), `APPLICATION_ID` in the merged
manifest, verified with `aapt2`.

Real IDs: three lines in `config.py`. Nothing else changes.

**smoke.mjs 177, render.mjs 43 (Chrome).**

### DEFERRED this cycle

- **No ad has been SEEN.** The flow is wired against definitions and asserted
  in the harness; the first test-ad impression needs a phone. Take 22's APK
  will show Google's test ad on the earn button — that is the check.
- **Real unit IDs — D11.** And D10/D12/D13 keep their defaults.
- **Banner ads** — none anywhere yet; D12 is unanswered.
- **A2's remaining half, D7, pictures** — Jacob's, no deadline.

## Take 21 — 2026-09-02 — the last prompts, and an estimate that knows when you bought

Opened before any code (PROTOCOL §6).

Two from take 20's "mine next":

1. **The six remaining `prompt()`s.** Deck-list paste and trade paste need a
   textarea; cost basis, grader, grade and cert need a field. One generic input
   sheet — text / number / multiline — replaces all six, and the ratchet goes
   to zero.
2. **The estimate series ignores purchase dates.** It values today's holdings
   on every day, including days before a card was bought. The `added` stamp on
   every line is the honest cut-off: a card contributes to the estimate only
   from the day it entered the collection.

### Built

- **`ask()`** — one input sheet, three shapes (text / number / multiline),
  returning a Promise so the six call sites read like the prompts they
  replaced. Deck-list paste and trade paste get a monospace textarea with an
  example; cost basis and grade get a decimal keyboard; the grader is a
  choice, so it is a picker. **`prompt()` count: 0.** The ratchet holds it there.
- **The estimate respects purchase dates.** A line contributes to the
  history-derived series only from the day it entered the collection. Before
  that the card was not yours and its price is not your history.
- **Landmine 93** — the patch died on its last line and wrote nothing, but a
  `sed` after it moved the gate's ceiling anyway. Guard and change move
  together, or the guard moves second.

**smoke.mjs 173, render.mjs 43 (Chrome).**

### DEFERRED this cycle

- **The ad SDK.** Mechanism complete, plugin identified, `ADS_ENABLED` false.
  Blocked on D11.
- **A2's remaining half, D7, the picture slots** — Jacob's.
- **Nothing else is open on my side that does not need an answer first.**

## Take 20 — 2026-09-02 — the chart from history, and three carried items

Opened before any code (PROTOCOL §6) — the gate checked at take 19, and it
will check again.

Four things from take 19's "mine next":

1. **`splash-bg.jpg`** — declared at take 19, not yet honoured by `ci/apk.sh`.
2. **The value chart from catalogue history** (ROADMAP 4.2) — the last open
   parity row. A fresh install shows one point; the catalogue knows every day
   it has on file, and holdings × history is a legitimate *estimate* of what
   the collection was worth, as long as it is labelled as one (PROTOCOL §10).
3. **A9 — nightly failure alerting.** The app runs on its last catalogue when a
   night fails; nothing tells Jacob a night failed. Three nights should.
4. **Portfolio move and rename** are still `prompt()`.

### Built

- **The chart from history** — the last open parity row. The bundle carries
  every day's prices on file, aligned to a day list; a fresh install draws an
  *estimate* of holdings × each day's prices, **dashed and labelled**, until
  three real snapshots exist. Landmine 91. Two days of history cost 0.04 MB gz;
  the window's end is estimated at ~1 MB and written down.
- **A9 alerting** — a Home banner at three days naming the catalogue date; a
  CI step that opens one labelled issue and comments on each further failed
  night. Landmine 92.
- **`splash-bg.jpg` honoured** — cover-fit, darkened, icon centred.
- **Portfolio move, new, rename and bulk condition** are sheets. `prompt()`
  count 8 → 6, and the gate now ratchets it: it can only fall.

**smoke.mjs 169, render.mjs 43 (Chrome). Gate: 16 checks.**

### DEFERRED this cycle

- **Six `prompt()`s remain** — deck-list paste, trade paste, cost basis, and
  the three graded fields. The pastes need a textarea sheet.
- **The estimate ignores purchase dates.** It values *today's* holdings on
  every day, including days before a card was bought. Labelled honestly; a
  cost-basis-aware version would use `added`/`acquired` dates and is a follow-
  up, not a fix.
- **A2's remaining half, D11, D7** — Jacob's.

## Take 19 — 2026-09-02 — the guide, the picture slots, and the gate catching me

**Opened AFTER the code, and the gate is what made me write this line.** Jacob
asked for a tutorial and a copy audit; I built both and ran the gate to check
the new stale-copy guard, and it reported *"no HANDOFF entry for take 19 —
write it FIRST (PROTOCOL §6)"* alongside the copy it had found. Take 2 inverted
§6 and said so; take 19 did it again, nineteen takes in, and this time a check
said so instead of me. That is the whole point of the check. Landmine 89.

### Jacob's ask

Stale copy — "unlimited scans" — and a first-run tutorial like APEX's, with a
splash-style tour of what the app does and a One Piece background; placeholders
for anything I cannot supply, which he will fill.

### What this take does

- **Copy audit.** "No counter, no cap" was written at take 2 and was still on
  the scan screen at take 18 — six takes after A17 designed a credit gate on
  *saving*. Scanning IS unlimited by design; the cap line was not. The scan
  screen now says the true thing and says what changes when ads arrive; the
  README had the same line and the new gate found it after my grep did not.
- **`check_stale_copy()`** — a banned-phrase list with the reason each phrase
  is false under the current design. Landmine 88.
- **The first-run guide (A18)** — five capability cards, facts only, a
  versioned key so a rewrite shows again, reachable from More. Modelled on
  APEX A129.
- **`assets/user/`** — named picture slots with sizes, copied into the bundle
  if present, the compass otherwise. The README in that folder states the
  landmine-26/30 line once, plainly: his own photographs of his own cards are
  the safest and honestly the most premium thing the app can show; official
  art is his exposure on the listing.

### Also found

- **Two elements with `id="guide"`** — the tour reported shown and painted
  0x0. Landmine 90; the gate now refuses duplicate ids in the built HTML.
- **A JS escape (`\u25be`) in HTML text** on the portfolio switcher.

**smoke.mjs 159, render.mjs 41 (Chrome). Gate: 15 checks.**

### DEFERRED this cycle

- **`splash-bg.jpg` is declared and not yet honoured** by `ci/apk.sh`.
- **The tour's cards are one sentence each.** Right for a first open; a
  longer "How it works" page under More would suit the same content expanded.
- **Value chart from catalogue history, A9 alerting, portfolio prompts** —
  carried.
- **A2's remaining half, D11, D7** — Jacob's.

## Take 18 — 2026-09-02 — portfolios, the Trade Analyzer, and a gate for the docs

Opened before any code (PROTOCOL §6).

### Jacob's standing instruction, now a rule

Every take: the agenda in the chat, the docs in the seed, the ledgers and gate
kept current. The first two were already the practice; the third is now
**enforced** — `check_docs_complete()` fails the gate if any ledger or runbook
is missing from `docs/`, so "the docs are in the seed" is a fact the seal
proves rather than a habit. Landmine 87 explains why a habit is not enough.

### This take

The last two Collectr features from the original screenshots that are still
open rows in the parity matrix:

- **Multiple portfolios** (ROADMAP 5.4). Screenshot 3 says "Portfolio **One
  Piece**" — a named scope. One game here, but a collector still separates
  binder from trade pile from deck stock. Never built.
- **Trade Analyzer** (ROADMAP 6.3). The last button on the action row that is a
  toast. A diff of two lists, and the deck model gives the list shape.

### Built

- **Portfolios.** A name on every collection line, one active at a time, "All"
  as a cross-view. Home, Collection, Most Valuable and set completion scope to
  the active one; the home title is the switcher; scans land in the open
  portfolio; Bulk Actions can move lines; deleting a portfolio moves its lines
  to the default and loses nothing; the default cannot be deleted. Backup and
  CSV carry the portfolio; import recreates it by name.
- **Trade Analyzer.** Two lists — your side from the collection, theirs from
  the catalogue or a pasted `4 OP01-016` list — valued at market with low-to-
  high spread, and the difference stated as in your favour / against you /
  even. Pasted numbers resolve to the likeliest printing (landmine 84's rule),
  swappable. The verdict says market is a model, not a sale (PROTOCOL §10).
  Shareable summary.
- **`check_docs_complete()`** in the gate. Landmine 87.
- **Landmine 86, third instance** — a badge stretched to a bar by a
  descendant-span rule. Fixed at the selector: `> span` everywhere.

**smoke.mjs 159, render.mjs 41 (Chrome).**

### DEFERRED this cycle

- **Portfolio move and rename use `prompt()`.** Same debt as the Leader picker
  had; same fix, next pass.
- **Value chart from catalogue history (4.2)** — the last open parity row.
- **A9 — nightly failure alerting.** Nothing tells Jacob when a build has failed
  three nights running.
- **A2's remaining half, the ad SDK (D11), D7.**

## Take 17 — 2026-09-02 — the game's own iconography, and one thing declined

Opened before any code (PROTOCOL §6).

### Jacob's ask

Keep the current icon as `.old`; replace it with an image he attached — Zoro's
face. And: *"there isn't a single One Piece decal or icon,"* including the
scanner's idle state.

### What this take does with that

**Kept as `.old`.** `assets/icon-placeholder.old.svg`.

**Declined: the Zoro image as the icon.** Recorded in A16 with the reasoning,
because a decline that is not written down is a decision the next session
reverses. The short form: it is a character likeness, the icon is the most
exposed surface on a Play listing, and A17 makes this a commercial app. The
reference app does not put a character in its icon for the same reason.
Landmines 26 and 30.

**Built instead:** an original iconography set drawn from the game's own
vocabulary — which is not Bandai's artwork but the *structure* every card
carries — plus generic pirate motifs older than the franchise. Used everywhere a
tester said the app looked bare: the scanner's idle viewfinder, empty states,
card-type and rarity glyphs on tiles and in the builder, keyword tags. And the
icon re-cut in the take-16 palette.

### What shipped

- **`assets/glyphs.svg`** — nineteen symbols, 24x24, stroke-based,
  `currentColor`, so any of them takes brass or a game colour from CSS. Inlined
  into `index.html` at build time; `G(id, size)` is the only way the app draws
  one.
- **The nav** is compass / spyglass / cards / stage / Leader. **The scanner's
  idle viewfinder** is a brass card outline with corner marks and "Point the
  camera at a card", hidden the moment the stream arrives. **Tiles** carry the
  card-type glyph beside the rarity. **The detail hero's stats** carry DON!!,
  Life and Counter. **Deck rows'** keyword tags carry Blocker / Rush / Trigger /
  Counter. **Every empty state** has a symbol and a sentence that says what to
  do next.
- **`assets/icon.svg`** — re-cut in the palette. `ci/apk.sh` renders it.
- **A wrap bug** on the detail price, the same shape as take 8's tile bug on a
  different element. Landmine 86. The Chrome harness measures both now.

**smoke.mjs 143, render.mjs 41 (Chrome).**

### DEFERRED this cycle

- **The character-likeness question stays declined**, and D7 stays open for a
  motif Jacob wants that nobody owns. A sketch would settle it.
- **The splash** still renders from the icon at 30% — fine, but it could carry
  the compass at full bleed.
- **A2's remaining half, the ad SDK, Trade Analyzer, multiple portfolios** —
  unchanged.

## Take 16 — 2026-09-02 — first field data: A2 answers YES, and four things it showed

Opened before any code (PROTOCOL §6). Jacob ran take 15 on the Fold at
22:16–22:18 and sent four screenshots.

### A2, PROVEN on the device

*"The camera was able to scan my common cards."* The guide border went yellow,
the code was read, the picker opened with the right two printings — twice, on
OP16-074 Magellan and OP16-107 Jesus Burgess, on a dark table in a dark room.
The only thing this project could not measure for fifteen takes is measured.
The pipeline built at take 10 against plugin definitions, never run on a
phone, ran on a phone.

### What the screenshots show, in the order it hurts

1. **The app draws under the status bar and the gesture bar** on every screen.
   "Overview" sits behind the clock; the Set chip is behind the status icons;
   the picker's Cancel and the home page's More link are behind the nav bar.
   Every screen looks broken because of it. Edge-to-edge is enforced on API 35+
   and landmine 37 named it in take 1 as a retrofit cost; the retrofit was never
   done.
2. **"I don't think my collection saved."** Both screenshots after scanning show
   an empty collection. The batch lives in memory and commits only on
   *Review →*; leaving the screen or closing the app loses it, and nothing said
   so. Most likely he never reached Review. Either way the design is wrong.
3. **"It was always the cheaper card."** The picker sorts dearest-first, so for
   a common card the *release-event* promo sat on top, highlighted, and the one
   he was actually holding — the main-set base — was second, every time. Order
   by likelihood, not by price.
4. **"Broken icons."** The release-event printings have no thumbnail — they are
   in the 203 images the CDN answers 403 for (landmine 51), and the picker
   rendered an empty box instead of a placeholder.
5. **"Basic, not premium, no One Piece theming."** Part of that is 1 — nothing
   looks premium under a status bar. Part is emptiness. Part is real, and this
   take does a proper design pass rather than another placeholder.

### Fixed, each from a screenshot

1. **Insets.** `env(safe-area-inset-*)` is 0 in an Android WebView; Capacitor 8
   injects `--safe-area-inset-*` in pixels (read from `SystemBars.java`). One
   token per edge, every fixed element uses them, and `render.mjs` now sets
   36/24px before its geometry checks. Landmine 82.
2. **The batch.** Persists on every accept, badges the Scan tab, announces
   itself on reopen, survives a force-close. Landmine 83. The set chip is a
   sheet now too — it was the second `prompt()` a tester would have hit.
3. **The picker order.** MEASURED: dearest-first puts a promo on top for 49.8%
   of ambiguous numbers. Now likelihood — main set > deck > promo, base first
   when nothing was seen, a sighting overrides. Landmine 84. The take-2
   assertion that candidates come dearest-first was asserting the bug.
4. **Blank boxes.** The picker's art slot has a placeholder that names the
   printing when the CDN says 403. Landmine 85.
5. **The look.** A design pass done against the skill's list of defaults —
   which read as an audit of takes 2–15: near-black with one bright accent,
   identical rounded panels, ALL-CAPS labels, tinted black. The subject gives
   the palette: night sea `#0B1622`, brass `#C9A24A`, parchment `#EADFC8`,
   rope `#A08E70`. Serif for the totals and titles. Home reads as a log —
   hairlines between sections, boxes only around lists. A single faint
   compass behind the hero and on empty states. The six game colours are
   untouched: they are data.

**smoke.mjs 143, render.mjs 38 (Chrome).**

### DEFERRED this cycle

- **A2's remaining half** — foils, sleeves, toploaders, the star. Night two.
- **Set-chip likelihood** is a prior; it should also *learn* — a set the
  collector picked twice in a row is likelier next time.
- **The splash and icon are still the compass placeholder**; the palette moved
  under them and they should be re-rendered in brass. D7 still open.
- **Trade Analyzer, multiple portfolios, ad SDK** — unchanged.

## Take 15 — 2026-09-02 — the deferrals the ledger says were not allowed

Opened before any code (PROTOCOL §6).

"Any agenda item." So: the ones the protocol says should never have waited.

- **Auto-backup on every batch commit.** PROTOCOL §9, ROADMAP 5.1, landmine 20:
  *"does not get cut for schedule."* Fourteen takes of DEFERRED lists and it
  never appeared in one, because export existed and nobody noticed the other
  half of the sentence. A collector who scans 2,000 cards and loses the phone
  has an export they never ran.
- **The splash** — Capacitor's, for the first second of every launch. Same fix
  as the icon (landmine 78), same file.
- **Torch and exposure lock** on the app camera — landmine 10's foil
  mitigation. The rig has torch; the app does not.
- **Set abbreviations** — carried since take 11.
- **A7's ten-minute question** — does TCGCSV carry a UPC for sealed product?

### The bug nobody could have tested for here

Reading the Filesystem plugin's `Directory` enum to find where a backup should
go, it became obvious where the scan photos had been going since take 10: into
`localStorage`, as base64, ~50 KB each, against a WebView quota of 5–10 MB.
**Around card 100 the collection would have stopped saving**, with a
`QuotaExceededError` that says nothing about the camera. The harness's fake
localStorage has no quota; only reading the platform found it. Photos now go to
`Directory.Data` and the item stores a `convertFileSrc()` URL. Landmine 79.

### The requirement the ledger let slide

PROTOCOL §9: auto-backup does not get cut for schedule. Export shipped at take
2, and backup never appeared in a DEFERRED list after that — not deferred,
absent. Now `Documents/OPTCGHub/backup-latest.json` plus a dated copy, written
on every batch commit, deck save and detail save; the folder survives uninstall
on Android 11+ (from the plugin's definitions); failure toasts; restore replaces
and says so. Landmine 80 is about the ledger, not the feature.

### Also

- **A7 answered and closed.** No UPC anywhere in TCGCSV's 658 sealed products,
  so barcode scanning has nothing to look up against — ruled out on measurement.
  Sealed product is now in the bundle, searchable, addable by hand, and the
  number index refuses the empty key so it is never a scan candidate.
- **Torch and continuous focus/exposure** on the app camera — landmine 10's
  foil mitigations, as track constraints, shown only if the device advertises
  them.
- **Set abbreviations** derived from card-number prefixes at build time, kept
  only where unique — `OP17` and `OP17 RE` instead of `OP-17` and `OP-17-RE`.
  Four takes carried.
- **The splash** is the icon on the app background, rendered in `ci/apk.sh`
  beside the launcher icons. The first second is ours now.
- **Take-15 APK**, signed, versionCode 15, staged.

- **The gate fired on a correct bundle** — 7,518 "duplicate printings" —
  because its variant check read column 0 as the id and column 0 became
  `sealed`. Magic index, thirteen takes old. Fixed by name. Landmine 81.

**smoke.mjs 141, render.mjs 36 (Chrome).**

### DEFERRED this cycle

- **Multiple portfolios** (ROADMAP 5.4). The reference app scopes a portfolio
  per game; this app is one game. Still on the list.
- **Trade Analyzer.** Last toast on the action row.
- **Ad SDK.** Gated on D10–D13.
- **A2.** Jacob's.

## Take 14 — 2026-09-02 — the first device test approaches; make it informative

Opened before any code (PROTOCOL §6).

Jacob wants to test tonight, and said not to alter priorities for it — work
meticulously. So this take does the things that make a **first** device test
tell us the most, in the order that removes embarrassment before it adds
features:

1. The deck builder's Leader picker is a `prompt()`. It is the first thing a
   tester touches in that screen. A real sheet.
2. The credit ledger and pending tray from A17, built with the gate **off** by
   default behind `ADS_ENABLED`, so the mechanism exists and can be exercised
   with a dev toggle before AdMob IDs exist. No ad SDK yet — that waits on D11.
3. Printing swap and list import for decks — the two deferred items that are
   small.
4. A full signed build, again, on a clean `android/` — nothing has proven the
   take-9 packaging still works after four takes of app changes.
5. `ci/RELEASE.md` rewritten as night-one instructions, and the RUNBOOK handed
   over.

### Built

- **Leader picker as a sheet** — art, colour-filter chips, one row per number,
  owned Leaders first. The `prompt()` is gone.
- **Printing swap** — tap a deck row's name to choose which printing is sleeved;
  copies merge if the target printing is already in the deck.
- **Deck import** — the export shape back in; unrecognised lines are reported,
  never dropped silently; a Leader line sets the Leader.
- **Credits and the pending tray** — A17's mechanism, gate **OFF** by default
  behind `ADS_ENABLED`. With the gate forced on in the harness: three credits
  admit three of a five-card batch, two wait in the tray, earning drains the
  tray into the collection, re-saving an existing deck is never refused
  (PROTOCOL §9). No SDK is called, and an assertion says so.
- **A signed take-14 APK, from a clean `android/`** — 29 MB, versionCode 14,
  targetSdk 36, CAMERA declared, catalogue inside, correct signer, zero x86,
  **and the placeholder icon on every launcher path**, verified by decoding the
  APK's PNGs and matching pixel statistics after three wrong ways of checking
  (landmine 78). Staged in outputs as `optcghub-take-14.apk` so tonight does
  not wait on CI.
- **`ci/RELEASE.md` rewritten as night one** — A2 first, in the order that
  produces a number.

**smoke.mjs 129, render.mjs 36 (Chrome).**

### DEFERRED this cycle

- **The ad SDK.** Mechanism built, plugin identified, integration gated on
  D10–D13. `ADS_ENABLED` stays false.
- **Splash screen** is still Capacitor's. The icon is ours; the first second is
  not. Same fix, same file, next take.
- **Torch and exposure lock** on the app camera — the rig has them, the app
  does not.
- **Set abbreviation normalisation.** Fourth take carrying this.
- **A2's answer.** Tonight, on the Fold.

## Take 13 — 2026-09-02 — ads on the agenda, and the deck builder

Opened before any code (PROTOCOL §6).

### Jacob's ask

Ad revenue, probably Google's. Two starting ideas: 20 scans free, 20 more per
short rewarded ad, repeating; and 1 free deck build, one more per ad, repeating.
APEX stays free and ad-less; that is irrelevant here.

This is his app and his decision. The job of this take is to put it on the
agenda *with the ledger's honesty intact*: three things this repo has written
down as principles are touched, and one data-source term has to be checked
before the idea is viable at all. Then to design the mechanism so it does not
recreate the thing the app was built to replace, and to ask the questions only
Jacob can answer.

And then the deck builder, built against RULES.md.

### Ads, on the agenda honestly — A17

The idea touches three written principles and one data-source term. The term
is fine: TCGCSV's usage guidelines are rate limits and User-Agent only, and the
site itself runs affiliate links and a Patreon. The principles are stated in
A17 and none of them is a reason not to do it; one of them is a reason to put
the wall somewhere else.

**The wall goes at COMMIT, not at the camera.** A rewarded ad needs signal; a
card-shop basement has none. Identification is free and unlimited, always —
it is the collector's camera. Committing a card spends a credit; without one,
the batch waits in a pending tray and nothing scanned is ever lost. Credits are
earned online and spent anywhere. Deck saves: the same shape. Nothing already
committed is ever locked — export, backup and browsing stay unconditional.

Starting numbers (20 / +20 / 1 / +1) are Jacob's and live in config.
`@capacitor-community/admob` 8.1.0 is on npm at `latest`; its API is read from
`definitions.d.ts` at the integration take, not now. README and landmine 31 no
longer say "no ads" — a doc that lies is worse than none. D10–D13 ask the
questions only Jacob can answer, starting with whether an AdMob account exists.

### The ledger had been corrupting itself for two takes

Grepping for a phrase returned it four times. The agenda held **three copies
of A4–A12**, one with a stale heading, 1,755 lines where take 11 had 1,263. The
cause was an edit pattern I used three times — `s.replace(heading, NEW +
rest_of_document)` — which appends the rest of the document inside the
replacement while the original rest remains. Deduplicated, keeping the newest
version of each section; the pattern is banned in this repo; and the gate now
fails on any duplicate agenda id, landmine number, inherited number or take
entry, with the corrupt file as its negative control. Landmine 76. The gate had
asserted stamps, citations and DEFERRED sections for eleven takes and never once
asked whether a ledger had two of anything.

### The deck builder, against RULES.md

Built from the rules document, not from memory, and every assertion cites a
section:

- **§5-1-2** — exactly one Leader; exactly fifty. "2 more cards needed
  (§5-1-2)" is what the screen says at 48.
- **§5-1-2-1** — a Leader in the main deck is flagged as not a main-deck card.
- **§5-1-2-2 + §2-3-5** — colour legality by intersection. MEASURED: **all 165
  dual-colour cards in the catalogue are Leaders**; no dual-colour Character,
  Event or Stage exists. So §2-3-5 does its work through the Leader — a
  Green/Red Leader admits Green cards and Red cards — and the first test
  fixture, which assumed dual-colour Characters, was wrong and is now a
  measured fact instead.
- **§5-1-2-3** — max four **by card number, across printings**. Two of one
  printing plus two of another plus one of a third = five Namis, flagged. This
  is R6, the one place number-keying is correct, and the smoke suite has two
  guards on it: sabotaging `byNum` to key on `productId` fails both.

The advisor: cost curve against two DON!! a turn, average cost, counter cards
(≥1000), [Counter] events, innate blockers / triggers / rush from the take-12
line-start keywords, type breakdown, Life from the Leader, deck value. Adding
shows one row per card *number*, preferring a printing the collector owns, and
greys off-colour or wrong-type cards with the reason rather than hiding them.
Export writes the community's `4 OP01-016 Nami` list shape.

Decks replaced "More" on the nav; More is a link off the home sources panel.

**smoke.mjs 115, render.mjs 36 (Chrome).**

### DEFERRED this cycle

- **Ad integration.** Designed, not built. Gated on D10–D13 and on an AdMob
  account existing. Credits, the pending tray and `ADS_ENABLED` are unwritten.
- **The Leader picker is a `prompt()`.** It works and it is ugly; a proper
  sheet with art and colour chips is the obvious next pass.
- **Choosing which PRINTING is in the deck** — the model stores `productId`
  and adding prefers an owned printing, but there is no UI to swap it.
- **Deck import** from a pasted list — export exists, import does not.
- **§5-1-2-4 override effects** — shown in card text, not parsed, per RULES.md R8.
- **Ban / restriction lists** — not in the catalogue; RULES.md §4 says so.
- **Everything device-bound.**

## Take 12 — 2026-09-02 — the look, and the rules

Opened before any code (PROTOCOL §6).

### Jacob's ask

One Piece theming, pictures, decals — placeholders where unsure, ask where it
matters, and he will provide more screenshots.

This sits directly on landmines 26 and 30. The honest split:

- **Card art on the tiles** is not a theming question, it is a *design that
  already exists* — landmine 28, take 1: hot-link the TCGplayer CDN thumbnail
  for a card the collector has not scanned yet, memory-cache only, declared in
  PROVISION as DISPLAY-ONLY. It was never built because the scan photo was
  meant to replace it. It should be built now; the reference app's tiles look
  the way they do because of it.
- **Theming** — colour, motif, typography — can be *One Piece-flavoured* without
  containing a mark. The game's six card colours are the game's; a compass, a
  log pose, rope, parchment, a treasure chest, a jolly roger *in general* are
  centuries older than the franchise. The Straw Hat crew's specific jolly roger,
  the Going Merry, any character likeness, the Toei/Bandai logos, and the
  franchise wordmark are not, and they do not go in.
- **Icon and splash** ship as **original placeholders**, labelled as such, until
  Jacob says what he wants — and this take asks.

### And the rules

The deck builder is next by his order, on the condition that the game is
understood properly first. This take does that research and writes it down as
`docs/RULES.md`, so the builder is built against a document rather than a
memory. Nothing in the builder is written until that document exists.

### The rules, from the source

`docs/RULES.md`. Bandai's Comprehensive Rules v1.2.0 (16 Jan 2026) fetched and
read in full — 28 pages, not a guide's summary — and distilled into what the
builder **enforces** (§5-1: one Leader, exactly 50, Character/Event/Stage only,
colour legality via §2-3-5 "a multi-colour card is every colour it possesses",
**max 4 per card number**), what it **advises** (Life, cost curve against 2 DON!!
a turn, the counter package, Triggers, innate Blockers and Rush), and how a game
goes, with section numbers so any disagreement is settled against the document.

R6 is written up as the one place keying on the card number is *correct*, with a
warning that a future session will try to fix it into landmine 1.

### The catalogue learned the keywords

Card text was HTML (`<span style="color:red">`, `<br>`, `\r\n`) and is now
cleaned at build time. Keywords are extracted by a line-start rule, because the
same `[Blocker]` bracket marks a card that *has* Blocker and a card that says
"your opponent cannot activate a [Blocker]". MEASURED: naive matching over-counts
Blocker by 94 cards and **Rush by 4x** (94 vs 22 innate). Landmine 74. The bundle
now carries `kw`, `counter`, `attr`, `subtypes` per printing — everything §4 of
RULES.md says the builder can draw on.

### The look

**Card art on the tiles** — hot-linked from the TCGplayer CDN, `loading="lazy"`,
memory cache only, fails silently to the text placeholder. This was the take-1
design (landmine 28) and was never built because the scan photo was meant to
replace it; it is what makes the reference app's tiles look the way they do.
Verified loading in Chrome: 3/3 arrived. Then the placeholder ghosted through
the art — `position:absolute` stacks above — caught by *looking*, not by the
assertion that the image loaded. Landmine 75.

**The game's six colours** (§2-3-3) as a colour bar on every tile, split for
dual-colour, and as named dots on the detail hero. **The detail hero** now shows
cost / power / life / counter alongside the art — more than the reference app
shows, and all of it from §2.

**An original icon placeholder** — compass rose, card silhouette, six-colour
hexagon. No character, no mark. A16 draws the line and D7–D9 ask the questions.

### DEFERRED this cycle

- **The deck builder itself.** RULES.md exists so it can be built against a
  document; that is next take.
- **Icon, splash, decals are placeholders** pending D7–D9.
- **Conditional keywords** ("gains [Rush]" under a cost) are recorded as
  references, not possessions — correct, but a builder may want a third state.
- **Set abbreviation normalisation** — unchanged from take 11.
- **The `1`/`4000`/`9000` counter values** look like upstream typos and are
  shown as-is with the source named rather than corrected by guess.
- **Everything device-bound.**

## Take 11 — 2026-09-02 — the stack re-examined with the constraint lifted; filtering and sorting

Opened before any code (PROTOCOL §6).

### Jacob's clarification, and what it changes

APEX ORV was sent for its *process* — the ledgers, the gate, the harnesses, the
take discipline — not to bind this app to its stack. The build process and core
are free to change for this repo. And he is following the same Play route, which
worked: APEX ORV is in closed testing now.

Two things follow.

**A3 gets re-examined.** The take-1 stack decision rested on two legs: the
governance toolchain (which transfers regardless of stack) and the phone-only
constraint (which no longer applies — Jacob has a PC). With both removed, does
Capacitor still hold? Answered in A3 below: yes, and the reason is no longer
"because APEX" but because the scanner was designed as one OCR call per *card*
on a stable quad, not per *frame* through the bridge, which was the only place
native would have clearly won. Ten takes of harnesses and a proven signed APK
would be thrown away for a benefit the design already avoided needing.

**A35's question is answered.** Jacob has a Play developer account and it has
passed or is passing the closed-testing gate. Landmine 35's calendar risk is
known, not unknown.

### This take

By Jacob's order: the collection with proper filtering and sorting. The
reference app's collection screen (screenshot 1) has a star filter and a
sliders icon beside the search bar. This repo has a star toggle and a sort
button that cycles. That is not "proper".

### What was built

**One filter model, two scopes.** `own` (the collection) and `all` (the
catalogue) each persist their own state, because "my SRs over $20" and "browse
OP-06 alternate arts" are different questions. Facets: set, rarity, colour
(dual-colour cards match either), card type, printing, condition (item-level,
collection only), a price range, and an "only" row — favourites, qty 2+, graded,
has cost, moved today, my scans; or for the catalogue: I own, I don't own, moved
today, special printings. Every facet multi-selects; empty means any.

**Sort** is a chip row: value, biggest move, name, number, set, recently added,
quantity, gain/loss — tapping the active key flips it. Every key computes its
*natural* order and `dir` reverses uniformly; the first cut multiplied by `dir`
and special-cased three keys, and the default value sort came out ascending.
Smoke caught it.

**The sheet counts live.** Chips carry facet counts from the current pool, and
the apply button says "Show 14 cards" *before* it is pressed — a filter that
returns nothing should say so on the sheet, not on an empty screen. The empty
state, when it does happen, offers "Clear 3 filters" in one tap. Tapping a set
in the catalogue index browses it, number-ordered. The apply row is pinned to
the sheet's bottom edge; on a 412x915 viewport it sits at y 847–891 without a
scroll, and `render.mjs` asserts that.

**smoke.mjs 94**, **render.mjs 36 in Chrome.**

### DEFERRED this cycle

- **Trade Analyzer** — the last un-built button on the action row. It is a
  diff of two collections; the deck builder's list model will make it cheap.
- **Set abbreviations are TCGCSV's and inconsistent** (`OP-PR`, `EB-01`,
  `OP14`). Readable, not pretty. A normalisation map is a small pipeline job.
- **Saved filter presets** ("my binder", "trade pile") — natural next step,
  not asked for.
- **Everything device-bound, unchanged.**

## Take 10 — 2026-09-02 — the scanner, for real

Opened before any code (PROTOCOL §6).

### Jacob's reordering

No field testing until everything is built. Priority after the core: **the
scanner**, then **the collection with proper filtering and sorting**, then **the
deck builder** — with the game's rules understood properly first, not guessed.
ROADMAP is re-sequenced below to match, and the agenda items that can only close
on a device (A2's field half, A14) are marked as the ones that will remain open
by construction until that day, rather than as things this repo has failed to
do.

### This take

`simulateScan()` has stood in for the camera since take 2. It runs the real
confidence gate on real cards, so the ask/auto ratio on screen has always been
honest — but no frame has ever been captured, no crop taken, no OCR called. This
take builds the real path end to end, against the ML Kit plugin's actual type
definitions rather than from memory, and exercises every stage in the harness
with synthetic OCR output so the only thing left unproven is the camera itself.

### Built against the real APIs

`node_modules` was reinstalled and three plugins' `definitions.d.ts` read before
a line was written. Two things that would have compiled and failed on the first
call: **the OCR plugin takes a `path`**, not base64 — so a crop goes canvas ->
base64 -> `Filesystem.writeFile` -> `processImage({path, script:'LATIN'})` ->
delete, in a `finally` (landmine 73). And **the WebView's `getUserMedia` needs
`CAMERA` in the manifest**, which nothing declares — read from Capacitor's
`BridgeWebChromeClient` source, and now added by `ci/apk.sh` with a grep-after
(landmine 72). `script:'LATIN'` is also the runtime half of A14.

### The pipeline

```
frame ─► detectQuad ─► warp(500x700) ─► cropCode ─► OCR ─► parseRead
                                     └► cropStar ─► starScore
           vote(3) ─► face ─► resolve(number,{setId,face}) ─► auto | picker
```

Each stage is a plain function. `PLATFORM` is the seam: Capacitor in the APK,
`getUserMedia` and *no recogniser* in a browser — and the browser build says
"preview only" rather than pretending. Auto-capture on a quad stable for 350 ms
(landmine 18), 800 ms cooldown (16), the scan photo becomes the tile (27),
gallery import via the Photo Picker (38). The star template is a committed
sidecar with its held-out evidence inside it — `tools/star_template.py` refuses
to write one whose numbers regressed.

### Verified, everything but the camera

- **smoke.mjs 78/0** — `parseRead` against the strings OCR actually returns
  (`EB04-024008`, `SPOP05-119SEC2`, `EBO3-O24`), the catalogue check turning
  `OP99-999` into a no-read, temporal voting with a noisy middle frame.
- **render.mjs 32/32 in Chrome** — a synthetic card-shaped quad detected, the
  crop handed to OCR is the upscaled strip, an injected `SP EB03-024 SR 4`
  resolves to the number, sets face=sp, and the gate auto-accepts; an empty
  frame is no-card; a toploader-shaped quad is rejected (landmine 14); the
  star template recognises itself and scores a flat patch below threshold.
- **The star port vs Python on 30 real cards:** max difference 0.175 from
  resampling, **30/30 threshold agreement**.

The pixel stages first ran in `smoke.mjs`, whose DOM mock has no canvas, and
returned NaN — which compares false against everything and read as "no star
seen", the safe answer. Seven assertions passed on nothing until one asked for a
positive. Landmine 71.

### Re-sequenced

ROADMAP now carries Jacob's order: scanner (done), then filtering and sorting
proper (take 11), then the deck builder with the rules understood first (12+).
A2's field half and A14 are marked as closing only on a device, by
construction, so nobody reads them as unfinished work.

### DEFERRED this cycle

- **The camera.** Every stage but the sensor. Unchanged and unchangeable here.
- **Torch and exposure lock** (landmine 10's foil mitigation) — `getUserMedia`
  track constraints, not written; the rig has torch, the app does not yet.
- **Filtering and sorting proper** — next take, by Jacob's order.
- **A14** — `script:'LATIN'` keeps the other recognisers idle at runtime; the
  models still ship. Needs a device to prove the exclusion is safe.
- **The gallery path reads a single image with no quad-stability**, which is
  correct for a still, and has no test — `pickImages` cannot be driven here.
- **`simulateScan()` still exists** for the browser build and is the only path
  a Pages visitor can exercise. It is honest about what it is.

## Take 9 — 2026-09-02 — day one, written down; and the key that blocked eight takes

Opened before any code (PROTOCOL §6).

### Two inputs

**APEX moved 167 -> 175.** Eight takes: the navigation arc, Camp mode, cluster
rebuild, unnamed-pin cleanup. PROTOCOL and AGENTS did not change — one date
line. Ten landmines did (203–212), and two of them describe failures this repo
hit independently at takes 3 and 5 without knowing the sibling had named them.
They come into §2 below.

**Jacob asked how to use this in a new GitHub repo.** The honest answer is that
this project has been *at that part* since take 5 — the pipeline runs, the gate
passes, an APK builds — and nobody wrote the day-one procedure. APEX has
`docs/RUNBOOK.md` and a `bootstrap.yml`; this repo has neither. And the single
thing every DEFERRED list since take 1 has ended with, "no keystore", was never a
technical blocker. It was a decision this repo kept declining to make that APEX
made at its take 20 and wrote down as A21.

### The key, decided

`signing/optcghub.keystore` generated and committed — CN=OP TCG Hub,
OU=sideload, alias `optcghub`, valid to 2054. `ci/apk.sh` wires it under a
**versioned** marker (`OPTCGHUB-SIGNING v1`, APEX landmine 211) that strips any
older block before writing, and the AAB branch reads the signer back off the
artifact and refuses one signed with the sideload key.

Then the build that had been unsigned for four takes:

```
app-release.apk                       29.3 MB
Signer #1 certificate DN:             CN=OP TCG Hub, OU=sideload, O=optcghub
Signer #1 certificate SHA-256:        b8308fdb…a39167
signing/optcghub.keystore SHA-256:    b8308fdb…a39167       MATCH
```

Trade-off stated in A8, mirroring APEX A21: anyone with the repo can sign as
the app. Private repo, personal tool, revisit before anything public. Landmine
70 is about the eight takes it took to write that paragraph.

### Running the config step by hand found two bugs in it

The versionCode patch, run with `VC` set but not exported, wrote `versionCode `
— nothing after it — and its assertion `"versionCode " in text` **passed** on
the damage. Then the next run could not repair it, because the regex only
matched a well-formed line. Landmine 69: assert the inputs, and match the whole
line so an interrupted run leaves a file the next run can fix.

The same shape then turned up in **the gate itself**: this entry's intro said
"every DEFERRED list since take 1", and `check_handoff` matched the *word* and
passed an entry with no deferred section at all. It now requires a `### DEFERRED`
heading with content, and its negative control still fires.

### The day-one procedure, written

Jacob asked how to use this in a new repo. **`docs/RUNBOOK.md`** — four screens,
one upload, one button: create a private repo, paste `build.yml` and
`bootstrap.yml` by hand (the token cannot push workflows), attach the seed to a
Release, run bootstrap. It downloads the highest-numbered seed, replaces the
tree, commits, and that push builds. Stage 0 is the Pages URL; Stage 1 is the
APK with five ordered checks, each a landmine's field test; then Phase 0.

**`ci/bootstrap.yml`** is new — APEX keeps its own outside the seed, so it was
never in the t167 zip I read at take 1, and this repo's `seed` job (upload the
zip to the repo root) was the only path. Both paths now exist and end in the
same commit.

### APEX 167 -> 175

PROTOCOL and AGENTS: one date line. Ten landmines, of which 205, 207, 208, 210,
211, 212, 203 and 204 are carried into §2. **207 is landmines 47 and 48 here,
found independently at take 3.** 205 — CI throttles third-party fetches — is the
one that needed a decision: hashes and prices are already committed sidecars
that CI only restores, and TCGCSV ingest is the one fetch CI must make, which is
174 requests to a purpose-built mirror that fails loudly if throttled. Written
down as the accepted exposure.

### DEFERRED this cycle

- **`bootstrap.yml` has never run.** Neither has `build.yml`. Both are
  syntax-checked and both mirror a workflow that has run 175 times on the
  sibling, which is the strongest thing that can be said without a runner.
- **The AAB branch (`-Pupload=1`) has never executed** with real secrets. The
  sideload branch is proven; the Play branch is written.
- **The Play upload key does not exist.** It is Jacob's to generate, on the
  Fold or the PC, and it must never enter a chat. RUNBOOK-play §A.3.
- **The committed key's password is in `ci/apk.sh` in plain text.** That is
  the APEX model too, and it is the same trade as committing the key at all —
  but it should be said, because someone will find it and think it was missed.
- **A2's field half, A14, A15 in-app** — unchanged.
- **The RUNBOOK's Stage 0 and Stage 1 checks have been walked through by nobody
  on a phone.** They are the field tests for landmines that were each found
  here; they have not yet found anything in the field.

## Take 8 — 2026-09-02 — day two, and the delta that was in every screenshot

Opened before any code (PROTOCOL §6). New session, new day; PROTOCOL §0 done —
the working tree, SDK, JDK and Tesseract all survived, and every sealed seed
t1–t7 is present in outputs with the take number in its filename.

### Why this take

Re-reading Jacob's five screenshots against what is built, the most visible thing
in all of them is the **day-over-day price delta**: `▼ $467.33 / -$4.00 (-0.85%)`
on every collection tile, `-0.85%` beside every Most Valuable line, and a red or
green triangle on the card detail. It is on four of the five screens.

It was deferred at take 3 ("Market Movers stores a baseline but has nothing to
compare to until a second catalogue lands") for the only honest reason: one day
of data has no delta. TCGCSV published overnight — `2026-09-02T20:05:50` against
yesterday's `2026-09-01T20:05:40` — so a second day now exists and the deferral
has expired.

### Day two, measured

```
2026-09-01   7,129 priced printings
2026-09-02   7,135
1-day delta  7,128 printings   2,433 moved (34%)   1,019 up · 1,414 down
|move|       median 2.7%   p90 12.5%   p99 33%   max 414%
>10x         none
```

Biggest overnight $ move: `OP17-079` Monkey.D.Luffy (Super Leader Alt), −$107.48
(−5.1%), now $1,996.94. The Vivi SP from Jacob's screenshot: +$0.00 (+0.00%),
$463.53 — flat today, and the app says flat rather than unknown because
yesterday is on file (landmine 68).

**The first thing the second day did was nearly get destroyed.** Ingest
overwrites the cache. Yesterday's prices were captured into the new sidecar by
hand, before the fetch, or they would have been gone. Landmine 66 — landmine 46's
rule for the third time.

### The first real run of a guard that had waited seven takes

Landmine 7's >10x check had never had a prior day. Its first positive:

```
product 552138 moved $176.58 -> $9.41 (>10.0x) — upstream data glitch?
```

Nothing moved. Foil $176.58, Normal $9.41, sidecar stores the dearer, guard
iterated every row against the aggregate. Landmine 44's fan-out in the validator.
Verified before believed (AGENTS rule 2), fixed with `MAX … GROUP BY`, and the
planted-300x control still fires. Landmine 67.

### What was built

- **`tools/history.py`** — rolling 200-day sidecar, keyed by the *source*
  publication date, one value per product per day, committed like
  `hashes.json`. Computes 1d / 7d / 30d / max deltas against the closest day at
  or before each horizon, and reports absence as absence — a missing day is
  never interpolated, because a flat line invented across a gap reads exactly
  like a real flat market.
- **Catalogue** — `price_history` populated for real; a `price_delta` table; the
  bundle carries eight delta columns per printing. 6,544 of 6,862 printings have
  a 1-day delta in the bundle.
- **The app** — `deltaHtml()` is one renderer and every surface uses it:
  `▼ $80.17` / `−$0.92 (−1.1%)` on collection tiles, `−0.85%`-style beside Most
  Valuable, the full line on card detail, and 7d/30d in the provenance line the
  moment history reaches seven days. **Market Movers is real** — your
  collection's moves ranked by dollars-times-quantity, then the biggest moves in
  the game with sub-$5 cards excluded because a 40% swing on $0.30 is noise. No
  per-device baseline: every device sees the same movers from the same
  catalogue.
- **Three-state delta.** Up, down, and *unknown* — rendered as `—` with a title,
  never as `0.00%`. On a fresh install every card is unknown and the app says so
  (landmine 68).
- **Two layout bugs caught by screenshot, not by harness.** The ▲ wrapped onto
  its own line because `.px span{display:block}` caught the inline triangle too,
  and the delta wrapped at 184px. Fixed, and `render.mjs` now asserts on
  **height** — the price block is two lines, `Qty: n` is one — with a negative
  control that fires on exactly the bug. Every prior geometry assertion was about
  width.
- **`smoke.mjs` at 63**, including: pct is arithmetically consistent with abs
  and yesterday; 7d/30d are absent not zero with two days on file; no printing
  moved >10x.
- The "Search all 6,860 cards" placeholder was a literal. It is 6,862 today.
  Now from the manifest.

### DEFERRED this cycle

- **7d / 30d / MAX are empty for five more days.** Correctly empty, and the app
  says when they will appear. Nothing to build; only calendar.
- **The portfolio sparkline still draws from per-device snapshots**, not from
  catalogue history. Right for a collection's *own* value (A10) — but it means a
  fresh install shows one point even though the catalogue now knows yesterday.
  A back-fill from `price_history` × current holdings is a fair estimate and it
  is deliberately not done: it would present a reconstruction as a record.
- **Trade Analyzer** is still a toast. It is a diff of two collections and
  cheap; it is also the last un-built thing on the action row.
- **A2's field half, A14, A15's in-app detector, the keystore, CI on a runner**
  — all unchanged. Eight takes.
- **The sidecar will grow ~200 KB/day** until the window rolls at 200 days.
  Fine, and the number is written down so it is not a surprise.

## Take 7 — 2026-09-01 — measuring the two things that were "waiting for a phone"

Opened before any code (PROTOCOL §6).

Take 6 established that the card face names its own printing, and left two
things explicitly unmeasured because they "needed a device":

- **A15**, the star detector, deferred because the star region on ornate cards
  looked like it would false-positive.
- **A2**, whether OCR can read the code at all.

Neither actually needs a device to get a first number. There are 6,861 card
images with ground-truth `face_class` in the catalogue, and Tesseract 5.3.4 is
installable here. A synthetic measurement is not a field measurement and will be
labelled as such throughout — but "we cannot know yet" was doing more work in
those two entries than it had earned.

### The instrument was broken, and it would have killed the project

The first synthetic OCR run came back **3% read**, at every resolution from 600px
down to 150px. Taken at face value that ends the scanner and re-plans the
architecture.

It was the regex. OCR of the printed strip does not return `EB04-024`. It returns
**`EB04-024008`** — the rarity badge and the cost bubble sit right against the
number and their digits run onto it. There is no word boundary between `024` and
`008`, so `\b...\b` matched nothing on a perfectly legible crop. Same crops,
anchors removed: **53%**.

**The Phase 0 rig has carried that regex since take 4.** Had Jacob run his thirty
cards this week, it would have reported that the camera cannot read a single
code, and the honest response to that report would have been to abandon the
approach. Landmine 63.

What caught it was AGENTS rule 2: 3% across five resolutions is not a degradation
curve, it is a constant, and a constant means the thing under test never ran.

### A2, the half that could be measured

MEASURED on 150 real card images, tight crop, constrained charset, digit
normalisation:

| pipeline | read | correct | **wrong** |
|---|---|---|---|
| regex only | 59% | 51% | 8% |
| + must exist in the catalogue | 53% | 51% | **2%** |
| + no digit may follow the match | 27% | 27% | 0% |

The catalogue check is free and it is the good one: we know all 2,825 valid card
numbers, so a read that is not one of them becomes a *no* read rather than a
wrong one. It quartered the error rate at zero cost to correctness.

The trailing-digit rule then removed the last three errors out of 150 by throwing
away **26 points of recall** — a different failure in safer clothes, since a
scanner that reads a quarter of cards has already lost to typing (landmine 17).
The residual 2% belongs to temporal voting, which the design has specified since
take 1 and which costs nothing: single-frame noise does not survive three frames
agreeing. Landmine 65.

**So the half of A2 that four takes called unanswerable is answered: the
information is legible at phone-plausible resolution.** Tesseract is weaker than
ML Kit and a CDN render is kinder than a photograph, so 51% is a floor with
unknown headroom, not a forecast. Sleeves, glare, angle and shop light remain
entirely unmeasured and remain the whole risk.

### A15, measured rather than feared

Take 6 deferred the star detector because the region "would false-positive on
ornate cards". Take 7 differenced the mean of 200 star cards against 254 plain
ones and found the star **crisp in the average** — its position is consistent,
not approximate: x 0.8883, y 0.9362, blob 0.0150 x 0.0108.

Template trained on half the sample, scored on the held-out half:

| box | plain median | star median | zero-FP threshold | **margin** |
|---|---|---|---|---|
| take-6 guess | +0.51 | +0.94 | 0.53 | **+0.01** |
| measured | +0.02 | +0.98 | 0.61 | **+0.36** |

**Recall 64.6%, zero false positives on 133 plain cards.** The failure mode
aligns exactly with landmine 60's asymmetry: it misses stars and never invents
them, and a miss costs one picker tap.

The take-6 box was five times too large and the excess swallowed the rarity
badge, which every card has. Plain cards scored 0.51 against a threshold of 0.53
— it would have worked on clean renders and fired on a base card the first time a
photo shifted a few pixels. **A margin is a measurement; "it works on my test
images" is not.** Landmine 64.

Two results that went against instinct, both measured:

- **Searching a window made it worse.** ±2.5% in x recovered *zero* extra stars
  and cut the margin from +0.36 to +0.13. Every extra probe is another chance for
  background to score high.
- **The misses are mostly real.** Three of six inspected genuinely have no star.

### What was built

- `tools/config.py` — the fixed regex, plus `VALIDATE_AGAINST_CATALOGUE`.
- `tools/phase0.html` — fixed regex, **measured** CODE_BOX (narrowed to exclude
  the badges: 27% -> 51% correct on the same images) and **measured** STAR_BOX.
  It is finally an instrument rather than a plausible one.

### DEFERRED this cycle

- **The star detector is not in the app.** Its geometry and threshold are
  measured and recorded; the code path that would run it does not exist, because
  the scanner it would hang off does not exist either.
- **The catalogue-membership check is not in the app** for the same reason —
  measured, specified, unwritten.
- **Everything synthetic stays synthetic.** 51% correct and +0.36 of margin are
  numbers about clean CDN renders. Landmine 45 has said since take 3 that these
  do not transfer to photographs, and take 7 does not change that; it only
  removes the excuse for not having numbers at all.
- **A14, ML Kit language models.** Unchanged, needs a device.
- **No keystore, seventh take.**
- **`ci/build.yml` has still never run on a runner.**
- **The star template itself is not shipped.** 280 float32 values that would need
  to live in the catalogue bundle; deferred until the scanner can use it.

## Take 6 — 2026-09-01 — the card tells you which printing it is

Opened after the first measurement rather than before it, because the first
measurement was a five-minute look at a card image and it changed what this take
was going to be. Noted rather than tidied away.

### Why this take exists

A2 has been the top blocker for five takes and the honest reason has always been
"a camera cannot be measured from a build container". That is true and it hid a
question that CAN be answered here: **is the printed code region even sufficient,
on a real card, at a resolution a phone would produce?**

The TCGplayer CDN serves card images at 600x838 under `_in_1000x1000.jpg`, which
is enough to read the printed strip. That makes a large part of A2 answerable
without a phone — not the sleeve, glare and angle half, but the *is the
information there at all* half.

### The finding: the card tells you which printing it is

Takes 2, 3 and 5 all assumed the printed strip contains a card number and
nothing else. It does not:

```
plain   OP13-014 [C]  (4)
star    OP04-030 *[R] (1)        a star above the rarity badge
sp   SP OP05-119 [SEC] (2)       a literal SP badge before the number
```

MEASURED across all twelve treatments, n=4 each. `plain` covers base, reprint,
pirate foil, jolly roger and box topper; `star` covers alternate art, parallel,
manga, full art and textured foil; `sp` covers SP and wanted poster.

**The signal is asymmetric and that is the whole finding.** 16/16 plain samples
had no star — so a star means special. But `ST01-005`, an alternate art, had no
star either, so absence proves nothing. A sample of one per treatment would have
called this a law; four found the exception.

| rule | printings | value |
|---|---|---|
| set chip only (take 3 baseline) | 62.3% | 35.4% |
| narrow both ways *(unsafe)* | 83.7% | 47.5% |
| **narrow only on a sighting** | **73.0%** | **47.0%** |

Half a point of value is the entire price of not silently entering a $78
alternate art as a $5 base card. `smoke.mjs` now asserts that symmetrising
`candidates()` turns a 316x spread into an auto-accept — because that is exactly
the "improvement" a future session will reach for.

### Then splitting it, because the two halves are not equally trustworthy

The `SP` badge is **literal text inside the crop the scanner already takes**, so
the same OCR pass reads it for nothing. The star is a **glyph in its own region**
and needs a detector.

| | printings | value |
|---|---|---|
| set chip only | 62.3% | 35.4% |
| + SP badge | 62.7% | **38.6%** |
| + star glyph | 73.0% | 47.0% |

The SP badge moves only 0.4 points of printings but 3.2 points of value, because
SP cards are the expensive ones. It ships.

The star does not, yet. Cropping the star region on six real cards showed it
clean on plain and star printings and **decorative background on two ornate SP
cards** — background a naive bright-ink test would call a star, on cards that
have no star at all. That is A15, gated on the rig, not written blind. Same
trade as take 5's ABI filter versus the language-model exclusion: ship the free
half, measure the risky one.

### What was built

- **`face_class` in the catalogue** — 5,881 plain, 822 star, 157 sp.
- **`candidates(number, setId, face)`** narrows on a positive sighting and
  otherwise only re-ranks, so the likely printing is first in the picker and the
  true one is never removed from it.
- **Picker now says why** — "SP badge on the card", "star on the card".
- **The rig grew a fourth question.** It crops the star region alongside the code
  on every capture, shows both, and records a per-card judgement plus the
  declared face into the CSV. Thirty cards answers whether a camera can see the
  star before a line of detector is written.
- **CODE_BOX retuned** from the take-4 guess to `x 0.60 y 0.930 w 0.38 h 0.048`,
  verified against six real cards of all three face classes. It lands on the full
  strip every time, SP badge included.
- **smoke.mjs at 54 assertions**, recomputing the coverage gain itself rather
  than quoting this document: 61.4% -> 71.7%.

### The catalogue moved under the tests, mid-take

TCGCSV published while this take was running. 6,860 cards became 6,861 and the
Vivi SP went $467.33 -> $463.53. Three smoke assertions went red on a correct
catalogue and a correct app, because take 2 had pinned live prices as if they
were facts about the system. In CI that fails daily, teaches nothing, and gets
muted — at which point it is worse than absent.

All four are now relational, and the useful pattern is the total: **derive the
expected figure from the same catalogue the app loaded**, so the check tests the
arithmetic instead of memorising an answer. `render.mjs` had the same bug twice,
once per mode, and fixing only the visible one would have left the other to fail
on the next run. Landmine 62.

### DEFERRED this cycle

- **A2 is still open and still only Jacob can close it.** Take 6 answered the
  half that could be answered here — *is the information on the card at all* —
  and the answer is yes, more of it than expected. The other half, whether a
  phone sees it through a sleeve at an angle under a kitchen light, is untouched.
- **A15, the star detector.** Deliberately unwritten.
- **A14, the ML Kit language models.** Unchanged from take 5, needs a device.
- **The `plain` face is never sent by anything yet.** `resolve()` accepts it and
  handles it correctly, but no caller supplies a face at all until the scanner is
  real, so the whole path is exercised only by tests.
- **No keystore, sixth take.** Take 5 proved every step of packaging up to
  signing; signing itself remains unproven.
- **`ci/build.yml` has still never run on a runner.**
- **The star mapping rests on n=4 per treatment.** It is enough to have found one
  exception and to have set the safe rule, and it is not enough to quote as a
  rate. Landmine 66 on the sibling repo is exactly this.

## Take 5 — 2026-09-01 — verifying the two things nobody had ever verified

Opened before any code (PROTOCOL §6).

Two claims in this repo have been unbacked since they were written, and both were
in every DEFERRED list from take 2 onward:

1. **"render.mjs verifies pixels in CI."** It has only ever run in its DOM
   fallback. Chrome has never rendered this app.
2. **"ci/apk.sh builds a signed APK."** Not one line of it has executed. There is
   no evidence a Capacitor project can even be created from this tree.

Both are INFERRED presented as if PROVEN, which PROTOCOL §1 exists to stop, and
four takes of green gates have been quietly resting on them. This take tries to
turn both into facts or find out why they are not.

### 1. Chrome has now rendered this app

`render.mjs` ran in a real engine for the first time. 824x1830, 49.5% non-black,
and the negative control fires: sabotaging the total paint turns 12/12 into
10/2. So "pixels are verified in CI" is now PROVEN rather than INFERRED.

**It found a bug on its first run that 45 smoke assertions could not.** At a
412px viewport the collection grid resolved to **two 277px columns inside a
380px grid** — the second column entirely off-screen, the page scrolling
sideways. `grid-template-columns: 1fr 1fr` sizes from free space, but the
minimum is min-content, and `.tile .s` carries `white-space:nowrap` on set names
like *Extra Booster: One Piece Heroines Edition*. The column inflated to fit the
unbroken string and `overflow:hidden` never got a chance, because the box was
never asked to be small.

`minmax(0, 1fr)` plus `min-width: 0`. Landmine 54. **smoke.mjs was correct about
every one of its assertions the whole time** — it asserts markup, and this was
never a markup problem. Layout needs a layout engine. `render.mjs` now measures
resolved column widths, tile bounding boxes and body scroll width across 360 /
412 / 673 / 820, because a Fold is two devices (APEX landmine 95).

Proving those new guards could fail took four attempts and three of them were my
own error — a `sed` that never matched, an assertion on a substring that also
appeared in the comment explaining the fix, and a revert of one of three
independent fixes. Landmine 55: **the negative control is itself code and needs
its own negative control.**

### 2. There is an APK

`ci/apk.sh` had never executed a line. Running it found four things:

- **It patched the wrong file.** `compileSdk` lives in `variables.gradle` as a
  `rootProject.ext` reference, so the regex produced
  `compileSdk 36 rootProject.ext.compileSdkVersion` — broken Gradle, on what
  would have been the first CI run. Landmine 56.
- **`catalog.json` and `catalog.json.gz` are the same asset** to Android's merger.
  `mergeReleaseAssets` failed with *Duplicate resources*. Landmine 57 — and the
  fix did nothing until `build_app.py` was made to *clean* its output directory,
  because a step that only adds leaves everything it has ever produced.
- **The take-4 fold patch was unnecessary.** Capacitor 8 already ships
  `screenLayout|smallestScreenSize|screenSize`. That step now verifies instead
  of patching.
- **Environment:** a plugin pins build-tools 35 while the app targets 36, a JRE
  is not a JDK, and behind a TLS-intercepting proxy a fresh JDK trusts nothing.
  Landmine 59.

Then it built. **BUILD SUCCESSFUL**, and the artifact says:

```
package: com.optcghub.app  versionCode 5  versionName 1.0.5  targetSdkVersion 36
application-label: OP TCG Hub
assets/public/bundle/catalog.json   1,862,611 bytes
```

Every one of those came from `ci/apk.sh` doing its job.

**It was 51 MB.** 41 MB of that is `libmlkit_google_ocr_pipeline.so` shipped four
times, and 23 MB is the x86 pair that only emulators run. Restricting the
sideload APK to `arm64-v8a` and `armeabi-v7a` took it to **29 MB** — a 43% cut,
identical function on every real device, and the Play AAB splits per-ABI anyway.
Landmine 58. The plugin also carries Chinese, Devanagari, Japanese and Korean
recognisers that a Latin charset-constrained scanner will never touch; excluding
them is agenda A14 and is deliberately **not** done blind, because the runtime
failure mode needs a device.

### DEFERRED this cycle

- **A2 remains the only thing that matters and remains UNKNOWN.** The rig from
  take 4 exists; nobody has pointed it at a card.
- **A14 unverified**, by choice — an exclusion that compiles and then throws
  `NoClassDefFoundError` on a phone is worse than a large APK.
- **The APK is unsigned.** `app-release-unsigned.apk`, because no keystore
  exists. Everything up to signing is now proven; signing itself is not.
- **The AAB path never ran.** Only `assembleRelease` was exercised, not
  `bundleRelease` or the upload-key branch.
- **`ci/build.yml` has still never run on a runner.** The *steps* are now proven
  locally, which is a different and weaker claim, and this repo has been burned
  by exactly that distinction twice this take.
- **`android/` is not committed** and must not be (`.gitignore`); it is
  regenerated by `npx cap add android` every build.
- **No keystore. Still the only thing blocking the first commit**, now for a
  fifth take.

## Take 4 — 2026-09-01 — the app gets its name, and Phase 0 gets an instrument

Opened before any code was written (PROTOCOL §6), as at take 3.

### The name

Jacob's call: **OP TCG Hub**. Package `com.optcghub.app`, permanent from first
registration. A8 closed after blocking the first commit for three takes.

A deck builder is wanted eventually and explicitly not a priority. It goes on the
roadmap at Phase 7 and this take checks only whether the catalogue could feed one
— a feasibility answer costs minutes, and discovering at Phase 7 that a required
field was never ingested costs a rebuild.

### What this take set out to close

A2 has been the top blocker since take 1 and has survived three takes untouched,
for the honest reason that a camera cannot be measured from here. So the
deliverable is the *instrument*: something Jacob can open on the Fold that runs
the real geometry and reports numbers, rather than another take of the plan
getting better while its one unknown stays unknown.

### What was built

- **`tools/phase0.html`** — the instrument. One file, opens on the Fold, no
  install and no build. It runs the real geometry the scanner will use and asks
  three questions **in order, because they fail differently**:

  | | question | needs network? |
  |---|---|---|
  | Q1 | can the camera find the card at all? | no |
  | Q2 | does the crop land on the printed code? | no |
  | Q3 | can the code be read? | once, for the recogniser |

  Q1 and Q2 answer the architecture question and need nothing. If the crop never
  lands on the code, no recogniser helps, and finding that out costs one evening
  instead of one phase. It labels each capture by category — base / foil /
  sleeved / toploadered / poor light, per landmine 14 — tallies per category,
  restates the ROADMAP Phase 0 gate on the phone so the verdict is unambiguous,
  and exports CSV.

  It **stops hard on a wrong read against a plain base card**, because that is
  landmine 12 territory: a wrong code is worse than no code, and the confidence
  model would need rethinking before anything is built on it.

  §8 note: the rig may load Tesseract from a CDN for Q3. That is why it lives in
  `tools/` and not in `www/` — the gate refuses remote origins in the shipped
  app, and a measuring instrument is not the shipped app.

- **Renamed to OP TCG Hub**, 17 files, `com.optcghub.app`, zero residual
  references. Seed is now `optcghub-seed-tNNN.zip` and `ci/build.yml` push.paths
  follows it, because a glob and a filename drifting apart is APEX landmine 202.

- **`life` ingested** — see A13. The deck-builder feasibility check found a field
  TCGCSV publishes that the take-2 map silently dropped.

### DEFERRED this cycle

- **A2 is still UNKNOWN and only Jacob can close it.** The rig exists; nobody has
  pointed it at a card. Everything past this point in the plan rests on a number
  that does not exist yet.
- **The app's scanner is still simulated.** `simulateScan()` runs the real
  confidence gate on real cards, so the ask/auto ratio is honest, but no frame
  has been captured by the app itself.
- **The rig's warp is axis-aligned, not perspective.** Stated in the code. It
  answers "does the crop land on the code" and does not answer "does a tilted
  card still work". A skew test is a follow-up if Q2 passes but reads are poor.
- **The rig's quad detection is a luminance bounding box, not contour finding.**
  Dependency-free on purpose — OpenCV.js is 8 MB and would make a question about
  geometry depend on the network. It will under-detect a card on a light
  surface, and that is a known limit, not a measurement.
- **CI has still never run.** No APK exists. Four takes.
- **No keystore.** The only thing left blocking the first commit.
- **Deck builder not built** (A13), by choice.
- **Puppeteer absent here**, so pixels were verified by nobody again this take.

## Take 3 — 2026-09-01 — render, packaging, and the features the code was already carrying

PROTOCOL §6 honoured this take: this entry was opened before any code was
written, and filled in as the take proceeded. Take 2 inverted it and said so;
this is the correction.

### What this take set out to close

Take 2 shipped a green gate with three holes in it, all named in its own DEFERRED
list: nothing proved the app *drew*, nothing packaged an APK, and 95% of the
artwork hashes did not exist. Those are the take-3 targets, plus the screens from
Jacob's screenshots that the data layer could already serve but the UI did not.

### The full hash pass, and what it overturned

**6,657 of 6,860 hashed — 100% of reachable.** 203 image URLs answer HTTP 403
permanently; verified individually while 6,657 others succeeded in the same run.
MEASURED 8.3/s sequential, **25/s at eight-way parallel**, so the pass is four
minutes rather than fourteen. Parallelism is safe against TCGplayer's image CDN
and was not safe against tcgcsv.com (landmine 5) — the difference is the
endpoint, and it is written down.

Then the measurement that mattered, over every hashed pair:

| pair type, by the take-2 KEYWORD | within Hamming 6 |
|---|---|
| flagged same-art | 38.0% |
| flagged DIFFERENT art | **34.7%** |
| unrelated cards | 0.0% |

A third of the pairs the keyword called "different artwork" were near-identical
images. **The keyword was answering a different question.** A plain base card
reprinted into a starter deck is `base` in both rows and no name suffix exists to
catch it — which is precisely the reprint case landmine 41 is about.

Replaced the guess with a measurement: at build time each number's printings are
clustered on actual image distance, single linkage, threshold 8.

| | p5 | median | p95 |
|---|---|---|---|
| pairs the hash may separate | 13 | 29 | 37 |
| pairs flagged indistinguishable | 0 | 3 | 33 |

**Zero overlap below 6**, where there had been 34.7%. The scanner's thresholds
(match ≤ 8, gap ≥ 13) now come from that distribution instead of from taste.

And the headline: **3,918 printings — 57% of the catalogue — are visually
indistinguishable from a sibling.** Take 2 concluded the picker was primary.
Take 3 measured that for the majority of cards it is the *only* honest answer.
Landmine 49.

### The bug that would have shipped

`smoke.mjs` stopped responding. The app's `hamming()` did `BigInt(a) ^ BigInt(b)`
then `while (x) x >>= 1n`. BigInt shifts are arithmetic, `-1n >> 1n` is `-1n`,
and roughly half of all stored hashes arrive negative because SQLite INTEGER is
signed. **The app would have frozen on the first artwork comparison a collector
ever triggered** — no error, no log line, nothing to debug from. Landmine 43
fixed the Python side at take 2 and this is its second face. Landmine 50.

A test that hangs is a test that found something.

### What was built

- **`render.mjs`** — the gap the gate had been noting since take 2. Runs in
  Chrome under Puppeteer in CI; falls back to a DOM-level check locally and
  **names what it did not verify** rather than counting it green (APEX landmine
  53). It earned its keep on its first run: `scale,clearRect,fillText` and no
  stroke, because with one snapshot the sparkline drew a caption and no line. A
  collector's day one was a blank chart.
- **`ci/apk.sh`** — Capacitor sync, targetSdk 36 (landmine 37), versionCode from
  the take (landmine 33), the fold `configChanges` patch with a grep-after
  (APEX landmine 99), signed APK plus AAB, and a hard check that
  `catalog.json` is actually inside the APK.
- **App features from the screenshots:** Performance tab with a real cost basis,
  set-completion bars, bulk multi-select with a confirm before deletion, sort
  cycling, CSV import that **refuses ambiguous rows rather than guessing**,
  graded entry with grader/grade/cert, gallery button, purchase markers on the
  chart, and a "what this app does not know" panel.
- **`smoke.mjs` grew to 45 assertions**, including one asserting `hamming(-1,0)`
  returns 64 — that assertion exists because the harness stopped responding.

### DEFERRED this cycle

- **The camera is still simulated.** AGENDA A2 is untouched and it remains the
  only thing that can kill this project. Everything measured so far says the
  catalogue and confidence design are sound; nothing says a phone photo can be
  matched at all.
- **Phase 0 has not run.** No frame captured, no OCR, no sleeved or toploadered
  card photographed.
- **Puppeteer is not installed here**, so pixels were verified by nobody this
  take. `ci/bundle.sh` installs it; that path has never executed.
- **CI has never run.** `ci/build.yml` and `ci/apk.sh` are written and
  syntax-checked, and not one line of either has executed on a runner. No APK
  exists.
- **No Capacitor project, no keystore, no app id.** A8 still blocks the first
  commit and has now blocked it for three takes.
- **Market Movers stores a baseline but has nothing to compare to** until a
  second catalogue lands. That is honest, and it is also not a feature yet.
- **`price_history` is an empty table.** Per-card history needs N daily builds.

---

## Take 2 — 2026-09-01 — the code identifies almost nothing, and the picker becomes the product

Pipeline built and run end to end against the live service. `www/` builds.
32 smoke assertions green against the shipped artifact.

**PROTOCOL §6 was inverted this take and I want that on the record.** The rule
says write the HANDOFF first. I built first, because the take-1 plan rested on an
assumption I could measure in minutes and the honest entry could not be written
until I had. That is a reason, not an excuse — the risk §6 exists to prevent is
exactly what nearly happened, since the record was the last thing written and the
first thing that would have been lost. Next take: HANDOFF first, as written.

### The finding

Take 1 assumed the scanner works like this: OCR the printed code, get one to
three candidates, let a perceptual hash pick between them. Measured over all
6,860 cards:

| | resolves to ONE printing |
|---|---|
| card number alone | **8.9%** |
| card number + which set you are holding | **60.2%** |

The assumption was wrong because **a card number is not scoped to a set**. 1,822
of 2,824 numbers — 65% — appear in more than one set, because reprints, promos,
deck inclusions and anniversary sets all carry the original number on the card
face. `OP01-016` is twelve printings across eight sets:

```
$2017.24  manga          Nami (OP01-016) (Manga)
$ 549.26  base           Nami (English Version 1st Anniversary Set)
$ 547.44  sp             Nami (SP)
$ 430.69  parallel       Nami (Parallel)            <- same art as base
$ 106.87  base           Nami (Gift Collection 2023)
$  78.60  alternate_art  Nami - OP01-016 (Alternate Art)
$   5.29  base           Nami
$   4.83  base           Nami - OP01-016 (Ultra Deck: The Three Captains)
$   1.73  base           Nami
$   0.49  base           Nami
$   0.47  base           Nami - OP01-016 (Luffy Deck)
```

**4,292x.** And it is not a tail: 78% of numbers with more than one printing span
10x or more, 23% span 100x or more, worst measured 35,714x. **99.6% of catalogue
value sits in numbers the code alone cannot resolve.** Landmine 41.

### What changed because of it

**The picker is now the primary surface, not a fallback.** It gets artwork,
prices, set names, treatment labels and one-tap selection, and the sheet explains
itself in money — "12 printings share OP01-016, $0.47 to $2,017.24, 4292x apart".
A picker costs one tap. A wrong auto-accept on that card costs $2,016.

**The confidence gate became economic rather than visual.** Auto-accept only when
being wrong is *cheap*: every candidate within 1.25x of every other.
`number_group` and `number_group_in_set` are precomputed at build time so the
scanner never does this arithmetic on the hot path.

**The set chip was added and is the highest-leverage element in the scanner.**
7x, for one tap before a batch. It was not in the take-1 design at all.

### What was built

`config.py` `variants.py` `tcgcsv.py` `build_catalog.py` `hashes.py`
`validate.py` `build_app.py` `smoke.mjs` and `src/app.html`.

- **Ingest** — 87 groups, 7,518 products (6,860 cards, 658 sealed), 7,317 price
  rows, **6 seconds**, declared User-Agent, sequential.
- **Variant parser** — landmine 2's suffix, normalised into `treatment` /
  `provenance` / `award` / number-echo. 9/9 cases including a negative control.
  MEASURED distribution: 5,453 base, 511 alternate art, 254 reprint, 182
  parallel, 146 SP, 90 pirate foil, 75 full art, 72 jolly roger, 32 manga.
- **Catalogue** — 5.5 MB SQLite; bundle is 1.7 MB raw, **0.24 MB gzipped**.
- **Validator** — six guards, all six shown to fire on purpose, real catalogue
  passes.
- **App** — every screen in Jacob's screenshots: portfolio hero with sparkline
  and 1D–MAX (MAX free), Most Valuable, collection grid with quantity and
  spread, action row, search, scanner with batch/undo/running total, card detail
  with quantity stepper and Ungraded/Graded, bottom nav. Plus the picker, the set
  chip, a price-provenance line and a live spread bar.
- **Smoke** — 32 assertions against the built `www/app.js`, including five
  negative controls and an independent recomputation of the ask/auto ratio
  (9.3% / 61.4%, agreeing with the Python side).

### Landmines that fired while building, all three found by their own guards

**42** — the landmine-5 empty-group guard cried wolf on an unreleased set that
correctly returned `{"success":true,"errors":[],"results":[]}`. AGENTS rule 2
caught it. Fixed by teaching it the difference, not by widening it.
**43** — an unsigned 64-bit dHash overflows SQLite's *signed* INTEGER on roughly
half of all inserts.
**44** — a LEFT JOIN onto prices emitted **6,880 rows for 6,860 cards**; ninety
printings carry both a Normal and a Foil price. Nothing looked wrong. Only the
count showed it. There is now an assertion.

### What is still UNKNOWN, and it is the thing that matters

**AGENDA A2.** The catalogue-to-catalogue hash distances measured well — the
three `EB03-024` printings sit 30/30/34 apart, two genuinely identical
`OP01-016` reprints sit 9 apart, so a threshold near 15 separates same-art from
different-art. **That is not the comparison the scanner makes.** A phone photo
against a catalogue thumbnail is a different and harder problem, and whether it
lands closer to its own printing than to a sibling is unmeasured. Landmine 45
exists so nobody quotes the easy number as if it answered the hard one.

**46** — the catalogue is deliberately disposable, and it took every artwork
hash with it on each rebuild: 14 minutes of re-downloading, MEASURED, for values
that had not changed. Hashes now live in a sidecar keyed on the stable
`productId`. Found by watching coverage go 4.5% -> 0.0% across a pipeline run;
nothing failed and the build was green both times.

### Also built after the entry above was first written

`gate.py` (12 checks, 6 negative controls, all firing), `stamp.py`,
`pipeline.py`, `ci/build.yml`, `ci/bundle.sh`. The gate found eight real
problems on its first run including two inside itself: it was flattening the
local and inherited landmine ledgers into one namespace, so every `APEX landmine
N` citation read as a bogus local one, and it flagged its own negative-control
test data as a citation. Both fixed in the guard, not by widening it.

### DEFERRED this cycle

- **`tools/gate.py` does not exist.** Every check named in AGENTS and PROTOCOL is
  still aspirational. This is now the largest gap in the repo.
- **`tools/render.mjs` does not exist.** Smoke proves the code ran; nothing yet
  proves it *drew*. APEX landmine 69.
- **`ci/build.yml`, `ci/bundle.sh`, `ci/apk.sh` are unwritten.** Nothing has run
  in CI. No APK, no AAB, no Release.
- **Hashes: 312 of 6,860 (4.5%).** MEASURED 8.3/s, so a full pass is ~14 minutes
  — fine for CI, too long for this session. `validate.py --strict` is the gate
  and it currently fails, correctly.
- **The camera is simulated.** `simulateScan()` draws a real card from the real
  catalogue and runs the real confidence gate, so the ask/auto ratio on screen is
  honest, but no frame has been captured and no OCR has run. Phase 0 is untouched.
- **No Capacitor project, no keystore, no app id.** A8 still blocks the first
  commit.
- **PROTOCOL §6 inverted**, noted above.

SEAL: smoke 32/0, validate 6/6 negative controls, real catalogue passes.
No CI, no APK. `optcghub-seed-t2.zip`, sha256 printed beside it in chat.

---

## Take 1 — 2026-09-01 — the data question, answered before anything was built

Project opened. No code this take; the deliverable is the governance seed and one
measurement that decided the architecture.

**The question that mattered.** Jacob's budget is $0 and he asked to lean on
TCGplayer as hard as possible. TCGplayer's own developer API has been closed to
new applicants for years — after the eBay acquisition, access sits with existing
key holders, established sellers and approved partners. Applying returns silence.
The reference app (Collectr) links straight into TCGplayer listings and shows
TCGplayer market prices, so it is a partner. We cannot be. The plan going into
this take assumed a paid aggregator at $10–20/month and treated $0 as a degraded
mode.

**That assumption was wrong, and measuring it took eleven seconds.**

TCGCSV (`tcgcsv.com`) is a free daily mirror of TCGplayer's catalogue and pricing,
run by one person and funded on Patreon. One Piece Card Game is `categoryId 68`.
PROVEN this take, against the live service:

- `last-updated.txt` — `2026-08-31T20:06:16+0000`. Daily, around 20:00 UTC.
- 87 groups, **7,518 products** — 6,860 cards, 658 sealed — and **7,317 price rows**
- The whole thing, catalogue and prices: **174 HTTP requests, 11 seconds**

Then the check that closed the question. Jacob's most valuable card, from his own
screenshot:

| productId | name | subType | market | low |
|---|---|---|---|---|
| 672767 | Nefeltari Vivi (024) | Foil | $1.48 | $0.49 |
| 672768 | Nefeltari Vivi (024) (Alternate Art) | Foil | $23.36 | $20.99 |
| 672822 | **Nefeltari Vivi (024) (SP)** | Foil | **$467.33** | **$400.00** |

Collectr shows **$467.33** for that card, and its TCGplayer shop row reads "From
**$400.00**". Identical to the cent, both numbers. The reference app's catalogue
*is* the TCGplayer catalogue reached through the same data, and so is ours, for
free. Agenda A1 closed. The $10–20/month line item is gone.

**The same query produced the project's first and worst landmine.** `EB03-024` is
three products spanning **316×**. Every plan that keys a collection off a card
number is wrong by two orders of magnitude on exactly the cards that matter. That
is landmine 1, it drove AGENTS rule 3, and it is why `productId` is the unit
everywhere in this repo. The discriminator is a parenthetical suffix on the
product *name* — there is no field for it in `extendedData` (landmine 2), which is
presumably why Collectr displays those suffixes verbatim rather than modelling
them.

**One landmine fired during the measurement itself.** The first attempt fetched
all 87 groups eight-way parallel with Python's default `urllib` User-Agent. It
returned zero products for every group, raised nothing, and printed a tidy table
of zeros that looked like a finding. Declared User-Agent, sequential: 7,518
products. That is landmine 5 here and APEX landmine 74 there — HTTP 200 with an
empty body — and it fired on the first real fetch of the project. The fetcher now
asserts non-empty per group.

**What was ruled out, with evidence, and is recorded in AGENDA:** the TCGplayer
developer API (A1), scraping (A1, landmine 32), paid aggregators for v1 (A1),
community One Piece APIs as the price source (A1), per-condition pricing from any
free source (A4), image embeddings as the primary identifier (A5), bundling card
art (A6), native Kotlin and Flutter (A3).

**Stack decided: Capacitor 8 and vanilla JS in `src/app.html`, as APEX ORV.**
Not because Capacitor is the best scanner runtime — it probably is not — but
because the valuable thing about the sibling repo is `gate.py`, the two harnesses,
the seed→CI→Release ritual and 167 takes of landmines, all of which are written
and working today. `@capacitor-mlkit/text-recognition` 8.2.0 puts native ML Kit
behind that stack on the same Capacitor major APEX already ships. Jacob now has PC
access, which removes the constraint that originally forced this choice on APEX;
the decision stands on the toolchain argument alone.

**The one thing still UNKNOWN is the only thing that can kill this project.**
Agenda A2: camera capture and OCR throughput on the Fold, through a Capacitor
bridge. APEX's 124 fps renderer measurement does not transfer — that was GPU
compositing, this is capture, encode, marshal and recognise. Phase 0 measures it
on the device, with sleeved and toploadered foils in the sample, before anything
is designed around it.

**DEFERRED this cycle:** all code. `tools/`, `src/app.html` and `ci/build.yml` are
scaffolds only — `ci/build.yml` here is the APEX workflow retargeted on paper and
has never run. `gate.py` does not exist yet and every check named in AGENTS and
PROTOCOL is aspirational until it is written and has watched itself fail. The
Phase 0 harness is not written. No keystore has been generated and A8 is
undecided, which blocks the first commit.

SEAL: no build this take. `optcghub-seed-t1.zip` is documentation only.
