# NEW-SESSION-PROMPT — how the next session starts

*Current as of take 114.* Paste the block between the rules into a new session
opened on the repo (`github.com/SergeantCS2/optcghub`), on its own branch.
The three project files — `AGENDA.md`, `LANDMINES.md`, `HANDOFF.md` — are in
`docs/`; nothing is attached any more.

---

You are picking up **OP TCG Hub** — a One Piece Card Game scanner, collection
tracker, deck builder, simulator and sealed-product Hunt mode for Android,
built across 114 takes by previous sessions. The repo is
`github.com/SergeantCS2/optcghub`; the tree you are in is the whole project.
Since take 89 a session works on a branch and opens a pull request; the owner
merges; the merge to `main` runs `build.yml`, which publishes Release
`take-N` (the APK the owner sideloads) and deploys Pages. The nightly at
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
   do something, grep the index first. 174 of them; each is a real failure.
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
  line of findings each, and mark the PR ready only after his input or his
  "go". The step list for the take lives in `tools/look/steps.mjs`.
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

- **The UI series (A42), the UI/UX session's:** take 106 laid the design
  tokens every later UI take uses (type roles, spacing, radii, semantic
  colours per palette, a z scale); take 107 put one header on every
  screen (`header.appbar`: the title, back one level down, the More
  gear on every main screen); take 108 made every icon a sprite symbol
  with one meaning, every control a 44 px target with a pressed and a
  disabled look; take 109 put the first card art in (Decks under its
  Leader, the ready-made decks back on Decks, a deck's Leader large, a
  card's own page over its own colours) and measured the picture: most
  card pictures carry a SAMPLE stamp at both hosts, always in one band
  (about 45-60 % of the card), so a banner shows only the card above
  42 % (landmine 151); take 110, one take overnight at the owner's word,
  carried the rest: Sealed's banner and strips, the Play counter's
  Leaders, the voice (Collection for Portfolio, one date and money
  format), polish (motion from the tokens, one empty state, three
  thumbnail sizes) and the Fold's inner screen (two panes between 700 and
  899 px), and a review of the whole take after its first push fixed what
  it found (bulk actions on the lines on screen, a currency label that
  matches its figure, words over art measured readable, landmines
  157-160); the owner merged it without a note, and take 111 was the last
  look the series planned -- every screen at both sizes, and what it
  turned up (a card page that saved to another collection's line, a slab
  that took over another's grade, the 253 DON!! cards filed as sealed and
  treated as products, rows askew on their picture; landmines 161-164).
  It merged on 24 Sept and A42 closed with it. Refinement is now the
  owner's call, take by take. `docs/UI-AUDIT.md` is its
  checklist, with line numbers. Touch the UI only to fix what is broken, and read the
  tokens in `:root` before writing a size or a colour.

- **A32, take 112 (merged 24 Sept) -- Southern Hobby, the second distributor:**
  - It is read off its real pages (not GTS's shape, landmine 165): the
    category page hourly, and each product page on first sight and
    weekly, within a 90 s budget.
  - Its words are dates -- when stores must order, the release, a
    prerelease -- and "in-store only", beside GTS's on Sealed, Where to
    buy and Releases.
  - Its matches go through the unit it is sold as: a case only to a case
    (landmine 167).
  - It is not a stock-alert source (it has no stock words).
  - One live fetch from the VM read 20 of 20 and matched 4.
  - At the owner's word, distributor info never floods a row. Each
    distributor is one short line that opens the product's page at its
    Distributor info, and the long text sits under closed drop-downs
    (UI-AUDIT §8).
  - A32's next is the distributor state timeline from the history rows.

- **Take 114 (in flight) -- A32's distributor state timeline, from the history
  rows:**
  - On a sealed product's page, each distributor's history is inside the
    closed Distributor info, tucked behind one "History · …" line until
    tapped (the owner's answer).
    - It gives the checks and their days, and the state at the first check
      (never "since").
    - Each change sits between its two checks, read off the page or worked
      out from its dates.
  - GTS's `preorder_date` is its Order Due Date (landmine 172): "stores
    order by", "orders close", "orders were due". The GTS stock alert counts
    only stock for stores.
  - The hourly stops (exit 3, nothing deployed) rather than lose the
    history. The rows are kept by count, about 55 days (landmine 173).
  - Next for A32: date moves need a runner record of dates.

- **Take 113 (merged as PR #37; Release take-113) -- the owner's icon (D7),
  from the graphic design session:**
  - After the merge, the APK was decoded (HANDOFF take 113, "After the
    merge"). The glyph is in it, and there is no themed layer. The owner's
    Fold check is still open.
  - Its branch is merged (`…/compassionate-mayer-acc24r`; the icon commit
    `93481b3`). `design/d7-icons/SHIP.md` is the hand-off: what changes, what
    was verified, what only the runner and the Fold can show.
  - The emblem is the owner's reversal of landmines 30 and 31 and A16, for
    the icon's emblem only. The own-rose swap in SHIP.md is the fallback.
  - One standard icon, at the owner's word ("I just want the one standard
    icon"). There is no themed (monochrome) layer, and `ci/icon.py` refuses
    one (landmine 171).
  - `ci/icon.py --selftest` runs in the gate. After the Release, decode the
    APK's icon files (landmine 78); the owner checks the Fold. Landmine 170
    is the reminders' icon.

- **The Priorities block at the top of `AGENDA.md`** is the live order: the
  owner's items (the diagnostics paste, D20–D22, shop URLs, D7, D16, the
  `.aab`), then the session's (whatever the next diagnostics paste names,
  A32's remaining sources, A23's tail, A31).
- **A21 — the Play clock.** The closed-testing release is **approved** (take
  52). What is left is the owner's: the opt-in link to 16–18 testers, twelve
  opted in, fourteen days, then *Apply for production*. `ci/RELEASE.md` is the
  guide testers read; keep it true. **UNKNOWN and worth asking first:** which
  `.aab` was uploaded first — if the DEVKEY one, the upload key must be
  reset (RUNBOOK-play §2). Every merged take becomes a Play update for the
  testers: merge only what you would ship.
- **A32 — Hunt** is the owner's large item and the mode EXISTS (takes
  70–87: Sealed and Releases; the hourly Target feed for all of the US with
  shelf stock per served zip; the hourly history; Local — the TCG+ roster,
  Census centroids, distances, own notes; the storefront layer over a
  hand-verified list in `hunt/storefronts.json`; Events by store with a Call
  button and a calendar tap; stock alerts; the Zoro palette; starter decks;
  MAX behind a rewarded ad). Next: D22 (background checks, the owner's),
  then national sellers from a residential IP in the sideload build, then
  the restock time series. Two rules from take 71: retailers throttle (one
  call a second, stop on 435), and a Japanese release is never matched to
  the English catalogue. No keys, no accounts (the owner's decision, take 68).
- **The blank-after-Back** has a watchdog since take 86 that heals it and
  writes the trigger to Diagnostics (More → About, five taps). **More was
  unreachable on takes 83–90** (A37, landmine 128) and the buffer died at
  every restart, so no paste ever existed; from take 91 both are fixed.
  **The first paste (take 91) showed no blank** — it named instead the
  events source's shape change (landmine 130) and a false FAIL in the
  self-test (131), both fixed at take 92. The watchdog runs after the two
  Back paths only (landmine 129), not after `go()`.
- **The `hunt` workflow is hourly by schedule and every 4–5 hours in
  practice** (MEASURED take 92; GitHub delays a public repo's cron). Read
  the run's `stores:` and `events:` lines before believing a green run: a
  kept-on-failure roster is green too.
- **The network, since take 109:** the session VM reaches TCGCSV, both
  TCGplayer image hosts and Bandai's site (MEASURED, HTTP 200), so the
  full pipeline runs here with a fresh ingest. The VM's browsers do not
  trust the proxy's certificate (landmine 152): the look fetches its
  pictures through Node, which checks it.
- **The session VM has had no package registries for two takes** (89, 90:
  `registry.npmjs.org`, `pypi.org`, `files.pythonhosted.org` answer 403, so
  no pillow and no puppeteer). If `bash ci/deps.sh` fails the same way:
  name the hosts, run what runs (smoke, DOM render, the scrubber, every
  gate check that needs neither), and ship through the runner's `check`
  as a **draft PR**, marked ready only when green — take 90's route, at
  the owner's word. Never claim a Chrome render or a green gate you did
  not see.
- **The simulator (A23)** — the hot-seat board (take 46), effects parsed from
  card text (takes 47–51, 28.6% of lines) and a legal, stupid opponent (take
  55) are BUILT and unseen on a phone. Coverage grows only by adding whole
  templates to `tools/effects.py` with their tests — never by loosening one.
- **The self-test (A28)** is built and not yet run on the Fold; the first
  report the owner pastes is the next measurement.
- **D16 (fonts), D11 (AdMob unit IDs, later), D7 (icon), D15 (colour), D17
  (the word Portfolio).** Do not build ahead of them.
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

Say "take 114" and begin with PROTOCOL §0.

---
