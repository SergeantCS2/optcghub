# AGENDA

*Current as of take 119.* Ranked by blocking-ness, not by interest.

**Every item lists what has been RULED OUT and with what evidence.** Keep it that
way, so nobody re-derives a dead end.

---

## Priorities — as of take 115

The live order, top first. Everything below this block is the record of how
each item got where it is; this block is what to do next. (Rewritten at take
115, the production baseline: its review of takes 106-114 is in HANDOFF, and
what it handed on is A43.)

**The owner's, gating everything else**
1. **Merge take 115, then upload Release take-115's AAB** to the production
   track. The app is LIVE on Google Play since 24 Sept 2026
   (`play.google.com/store/apps/details?id=com.optcghub.app`); every merged
   take's AAB is one upload, once (landmine 33), and only take 101's upload
   is recorded -- say which you upload. The sideload APK does not install
   over the Play build (landmine 34): a sideload proof means export →
   uninstall → sideload → import.
2. **D11, needed now:** the two real AdMob rewarded unit IDs. Register your
   phones as AdMob test devices first; the take that carries the IDs
   switches every install at its next sync.
3. **Take 113's Fold check:** the launcher on both screens, the splash, a
   reminder's ドン!! glyph (landmine 170).
4. **Answers still open:** A43's large items -- ad consent for EEA and UK
   users, reproducible builds (a lockfile or pinned versions, and the
   nightly's AAB), a measurement of the app's data folder before any
   automatic-backup rule, and More's "Last backup" line after the
   sideload-to-Play switch; A41's parts and the source; the take-100 look's
   "tiny bit of work" (which picture, what).
5. **D22** background stock checks; **D21** local stock for unserved zips;
   **D20** a crowd-report inbox. Each caps a Hunt feature until answered.
6. Shop URLs for stores you know (A32's storefront list, one entry today).
7. D16 the faces.
8. If your want list shows a sealed product or a DON!! card saved before
   take 111, remove it by hand (take 111 stopped new ones).

*Answered at take 115 by the owner's Diagnostics on take 114:* the
`viewport` line (the Fold's open screen is 749 x 832 at 2.625, the cover
411 x 960) and the `pictures` line (221 cards, 5 DON!! cards and 19 sealed
products without a picture at the first host).

**The UI/UX session's, the owner's call take by take:** from take 116, on
take 115's baseline -- Collect, the loading screen, the tutorial, Hunt and
more, mostly UI changes (the owner, take 115). Its open list is UI-AUDIT's
unticked boxes and A43's UI part; the session prompt's section for it says
what take 115 changed on screen.

**Mine, in order**
1. **A43's small items**, when wanted: the gate checks (the catalogue's
   shape; "Say take N" = BUILD + 1), the Restore file picker, the waiting
   batch in the backup, the cost basis in the currency on screen, CSV
   import's one write.
2. **A32's Next** (its take-115 section): date moves, a delisted item, the
   history on Releases, Southern Hobby's paging, the retailers that need a
   residential IP.
3. **A41** -- waits on the owner's list of the parts and the source; then
   one take per source, measured on the runner first.
4. **A23** the sim's tail -- modal effects, ordering, protection, the
   opponent's hidden choices -- one mechanism per take, when wanted.
5. **A31** Collectr import, the day a real exported file exists.
6. The standing offer: the release-notes trim.

**Closed since the take-88 audit:** A36 the set chips (take 90), A37 More
unreachable (take 91), A38 (takes 95-97), A39 (takes 98 and 100), A40 the
look (take 99), A14 PROVEN on the Fold (take 105), A42 (its seven layers
at takes 106-110 and the last look at take 111, closed at that merge), D7
the icon (take 113, the owner's pick; the Fold check is item 3 above), A24
(answered with D15 at take 106), A32's state timeline (take 114) and the
nightly race (take 115). Before it (takes 57-94): A26 colour/contrast/
desktop, A29 stock decks, A30 the tester report in full, A33 all six, A34
currency and splash, A35 all thirteen, the first paste's three items (take
92); A32 steps 1-3 and Local, Events, storefronts, stock alerts, the
calendar tap, exact distances, the first distributor (take 94).

**Stale and marked so:** A19 other games and A11 Japanese printings stay
ruled out; A20's backlog is where ideas wait, not a queue.

## A1 — Price and catalogue source · CLOSED take 1

The question the whole project rested on: can a $0 budget get TCGplayer-quality
data legally?

- **CLOSED. TCGCSV.** PROVEN take 1: `https://tcgcsv.com` serves TCGplayer
  categories, groups, products and prices as free JSON and CSV, updated daily
  around 20:00 UTC. One Piece Card Game is `categoryId 68`.
- **PROVEN the numbers are the same ones the reference app shows.** `EB03-024
  (SP)`, productId 672822: TCGCSV market **$467.33**, low **$400.00**. The owner's
  Collectr screenshot shows **$467.33**, and its TCGplayer shop row shows "From
  $400.00". Identical to the cent. The reference app's catalogue *is* the
  TCGplayer catalogue, and so is ours.
- **MEASURED:** 87 groups, 7,518 products (6,860 cards, 658 sealed), 7,317 price
  rows, fetched in 174 requests / **11 seconds**.
- **Ruled out: the TCGplayer developer API.** Public applications have been closed
  for years; after the eBay acquisition access is restricted to existing key
  holders, established sellers and approved partners. Applying returns silence.
- **Ruled out: scraping TCGplayer.** Terms discourage it, prices render
  client-side, Cloudflare wins, and it is an independent ground for Play removal
  (landmine 32).
- **Ruled out: paid aggregators** (JustTCG, tcgapi.dev, PriceCharting) **for v1.**
  the owner's budget is $0 and TCGCSV covers One Piece completely. They remain the
  answer if per-condition pricing ever becomes required (A4).
- **Ruled out: community One Piece APIs** (apitcg, optcgapi) as the *price*
  source. They are fine catalogues but they carry TCGplayer prices second-hand;
  TCGCSV is the same data one hop closer.
- **Open:** nothing blocking. Watch TCGCSV's availability — it is one person's
  Patreon-supported service, which is A9.

## A2 — Camera and OCR path on the Fold · **PROVEN ON THE DEVICE take 16** · sleeves/foils/toploaders still to measure

The one unproven assumption in the entire plan. Everything else is arithmetic.

- **INFERRED viable:** `@capacitor-mlkit/text-recognition` 8.2.0 exists, is
  Apache-2.0, wraps native ML Kit, and targets Capacitor 8 — the same major APEX
  ORV already ships. `@jcesarmobile/capacitor-ocr` is a second option with the
  same peer requirement.
- **UNKNOWN:** frame throughput. ML Kit through a Capacitor bridge on a
  still image is a different workload from a live 20 fps analysis stream. The
  plugin API takes an image URI or base64, which implies a per-frame round trip
  through the bridge — possibly the binding constraint.
- **Ruled out: assuming the APEX renderer measurement transfers.** A2 on the
  sibling repo measured 124 fps average for MapLibre in the Fold's WebView. That
  is evidence about GPU compositing, not about camera capture, JPEG encode,
  bridge marshalling and OCR. Different workload; the number does not carry.
- **Ruled out: nothing else yet, on purpose.** Phase 0 measures before anything
  is designed around it.
- **MEASURED take 7, synthetically:** on clean 600px card renders, with a tight
  crop, a constrained charset, digit normalisation and a catalogue-membership
  check, Tesseract reads **53%** of codes, gets **51%** right and is confidently
  wrong **2%** of the time. That is a floor, not a forecast: ML Kit is a stronger
  recogniser than Tesseract, and a CDN render is kinder than a photograph.
- **PROVEN the information is legible at phone-plausible resolution**, which is
  the half of A2 that four takes called unanswerable.
- **Ruled out: the anchored regex.** It reported 3% and the crop was fine.
  Landmine 63 — and the rig shipped that regex for three takes.
- **Ruled out: a trailing-digit filter.** Removes the last 2% of errors at the
  cost of 26 points of recall. Landmine 65.
- **STILL UNKNOWN, and it is the whole remaining risk:** sleeves, toploaders,
  glare, angle, motion and shop lighting. None of that is simulable here.
- **BUILT take 10:** the real pipeline in the app — getUserMedia preview, the
  rig's quad detector, canonical warp, code and star crops, ML Kit via
  `Filesystem` + `processImage({path, script:'LATIN'})`, `parseRead` with the
  catalogue check, the star detector ported from the committed template,
  3-frame temporal voting, auto-capture on a stable quad, the scan photo as the
  collection thumbnail, gallery import via the Photo Picker. Every stage is
  asserted in Chrome with synthetic frames and an injected recogniser
  (`render.mjs` 32/32); the star port agrees with Python 30/30 on real cards.
- **Ruled out: a separate simulation path in the APK.** `simulateScan()` runs
  only where `PLATFORM.hasOcr()` is false — the browser build — and the app
  says "preview only" there rather than pretending.
- **PROVEN take 16, on the Fold, by the owner:** *"The camera was able to scan my
  common cards."* Two plain base cards (OP16-074, OP16-107) on a dark table in a
  dark room — the guide found the card, ML Kit read the code, the picker opened
  with exactly the two printings that share the number. Fifteen takes of
  measurement said the pipeline should work; one evening said it does.
- **Still unmeasured, and now the only open half:** foils, sleeves,
  toploaders, the star region (Q4), and how often the picker is needed once the
  set chip is set. RELEASE.md night two asks for exactly those.
- **Found by the same test:** the picker's ordering was wrong for the common
  case (landmine 84) and the batch was never committed (landmine 83) — neither
  visible without a phone.
- **If the bridge is too slow:** capture stills on auto-detect rather than
  analysing every frame (fewer, larger round trips), or write a thin native
  plugin that does detect → crop → OCR entirely on the Android side and returns
  only the string. The second is a day's work and keeps the whole stack.

## A3 — Stack · DECIDED take 1 · RE-EXAMINED take 11 with the constraints lifted

**Take 11.** the owner confirmed the stack is free to change for this repo — APEX was
sent for its process, and the phone-only constraint is gone. So the decision was
re-run without either leg it originally stood on.

- **Still Capacitor.** The one workload where native clearly wins is per-frame
  OCR through the bridge. The scanner built at take 10 does not do that: it runs
  quad detection in JS at frame rate (cheap, no bridge) and makes **one** OCR
  call per card, on a quad stable for 350 ms. A bridge round-trip per card is
  invisible; per frame it would not have been. The design routed around the only
  reason to switch.
- **What would be thrown away by switching now:** `smoke.mjs` (78), `render.mjs`
  (32, Chrome), the pipeline, `ci/apk.sh` with a signed APK, and the RUNBOOK.
  Ten takes.
- **What would be gained:** nothing the design still needs.
- **Ruled out: switching to native Kotlin.** As above.
- **Ruled out: adding a bundler / splitting `src/app.html`.** It is 1,700 lines
  and the harnesses know exactly where the seam is. Churn without a failure to
  point at.
- **Reopen if:** A2's field measurement shows the JS quad detector cannot find
  a card at frame rate on the Fold. That is the one result that would move the
  hot path native.



- **Decision: Capacitor 8 + vanilla JS in `src/app.html`, built to `www/`.**
  Identical to the sibling repo.
- **Reasoning:** the valuable thing about APEX ORV is not Capacitor, it is the
  governance — takes, seed zips, `gate.py`, `smoke.mjs` executing the shipped
  artifact, `render.mjs` in real Chrome, the seed→CI→Release ritual, 167 takes of
  landmines. That machinery is written, debugged and phone-operable *today*.
  Rebuilding it against Gradle and Kotlin means re-learning two hundred failures
  in a new dialect before the first card is scanned.
- **The native OCR is not given up.** ML Kit runs natively via the plugin; only
  the orchestration is JavaScript. The one place native would clearly win is the
  per-frame hot path, and A2 measures exactly that before it matters.
- **Ruled out: native Kotlin + Compose.** Better on the hot path, worse on
  everything else here. It discards `gate.py`, both harnesses, the CI, the release
  flow and the phone-only capability. Revisit only if A2 fails and a native
  Capacitor plugin does not rescue it.
- **Ruled out: Flutter.** All the costs of a rewrite, none of the hot-path win,
  and no iOS requirement to justify it.
- **Ruled out: a second app framework "just for the scanner".** Two build systems
  is two gates.
- **Note:** the owner now has PC access, which removes the constraint that originally
  forced this on APEX. The decision stands on the toolchain argument alone, not
  on the constraint.

## A4 — Per-condition pricing · CLOSED as impossible from this source, take 1

- **Ruled out: TCGCSV.** PROVEN — it explicitly does not share SKU-level data,
  and SKU is where TCGplayer keeps condition. Product-level market/low/mid/high
  per printing is all there is.
- **Decision:** condition is a label the collector asserts, displayed beside the
  value, never multiplied into it. The app says which price it is showing.
- **Ruled out: inventing condition multipliers.** A fabricated ×0.85 for Lightly
  Played is a confident wrong answer about someone's money (PROTOCOL §10.3).
- **Reopen if:** a free per-condition source appears, or the owner decides a paid tier
  is worth it. Not before.

## A5 — Variant disambiguation · REDESIGNED take 2 on measurement

Take 1 had this as a detail. Take 2 measured it and it is the architecture.

- **MEASURED take 2, over all 6,860 cards:** the printed code alone resolves to
  a single printing **8.9%** of the time. With the set known, **60.2%**. Because
  a number is not scoped to a set — 1,822 of 2,824 numbers (65%) appear in more
  than one. `OP01-016` is twelve printings, $0.47 to $2,017.24, **4,292x**.
- **MEASURED: 99.6% of catalogue value** sits in numbers the code cannot resolve.
- **Decision: the picker is the primary surface**, not a fallback. Artwork,
  prices, set names, treatment labels, one tap, and a sheet that explains itself
  in money.
- **Decision: the confidence gate is economic, not visual.** Auto-accept only
  when every candidate is within 1.25x of every other — when being wrong is
  cheap. Precomputed into `number_group` / `number_group_in_set` at build time.
- **Decision: a set chip in the scanner.** Worth 7x for one tap. It was not in
  the take-1 design at all.
- **PROVEN take 2, catalogue-to-catalogue:** the three `EB03-024` printings sit
  30/30/34 Hamming apart; two genuinely identical `OP01-016` reprints sit 9
  apart. A threshold near 15 separates same-art from different-art *between
  catalogue images*.
- **Ruled out: image embeddings as the primary identifier.** The code plus the
  set chip does the narrowing for free; hashing is a discriminator inside a
  candidate set of two to thirteen, never a search over 6,860.
- **Ruled out: resolving same-art printings by hash** (landmine 13). Parallel,
  textured, pirate, jolly roger and reprint are flagged `same_art` in the
  catalogue and always go to the picker.
- **Ruled out: quoting the catalogue-to-catalogue distances as if they answered
  the real question** (landmine 45). A phone photo against a catalogue thumbnail
  is a different comparison and it is UNKNOWN.
- **UNKNOWN, and it is Phase 0's whole job:** does a photograph of printing X
  land closer to X than to its siblings?

## A5c — Can the artwork hash separate printings at all? · MEASURED take 3

- **PROVEN, whole catalogue, 6,657 hashes:** clustering each number's printings
  on image distance splits cleanly. Separable pairs p5 13 / median 29;
  indistinguishable pairs median 3. **Zero overlap below Hamming 6.**
- **MEASURED and it overturned take 2:** the keyword-derived `same_art` flag
  called 34.7% of near-identical pairs "different artwork". Replaced with the
  clustering above (landmine 49).
- **MEASURED: 3,918 printings (57%) are visually indistinguishable from a
  sibling.** For the majority of the catalogue no image method can help and the
  picker is the only honest answer.
- **Ruled out: keyword-derived same_art.** Wrong by a third, and wrong in the
  reprint direction that landmine 41 is about.
- **Ruled out: thresholds chosen by taste.** Match ≤ 8 and gap ≥ 13 both come
  from the measured distribution and the numbers are recorded beside the code.
- **STILL UNKNOWN, unchanged:** this is catalogue-to-catalogue. A phone photo
  against a catalogue thumbnail is a different comparison (landmine 45). Phase 0.

## A5b — Variant parsing · CLOSED take 2

- **PROVEN:** `tools/variants.py` splits a TCGplayer product name into
  `treatment` / `provenance` / `award` / number-echo. 9/9 cases plus a negative
  control that fires.
- **MEASURED distribution:** 5,453 base, 511 alternate art, 254 reprint, 182
  parallel, 146 SP, 90 pirate foil, 75 full art, 72 jolly roger, 32 manga,
  22 textured, 12 box topper, 11 wanted poster.
- **Ruled out: deriving the treatment at runtime.** Parsed once at build time
  into a column; a runtime re-derivation is a second implementation to drift.
- **Ruled out: trusting `extendedData`.** Landmine 2 — it carries no field that
  distinguishes a $1.48 base from a $467.33 SP.
## A6 — Collection thumbnails · DECIDED take 1

- **Decision: the collector's own scan photo is the thumbnail.**
- **Ruled out: bundling card art.** Copyright, and 6,860 images is a large binary
  for no benefit (landmine 26).
- **Ruled out: caching CDN images to disk.** Same reason, one step removed.
- **Consequence, and it is a good one:** the binder shows the actual cards. The
  reference app cannot do this — every thumbnail in the owner's screenshots is a
  publisher SAMPLE watermark.
- **Open:** what a not-yet-scanned card shows in search. Currently: hot-linked
  CDN image, memory-cache only, declared in PROVISION, DISPLAY-ONLY in the gate.
- *Take 109:* the same hot-linked picture is now used boldly (A42, the owner's
  ruling): the Decks hero, a card's backdrop, the card at 600x838. The two
  **Ruled out** lines above stand -- nothing is bundled, nothing is cached to
  disk -- and a scanned card still shows its own photograph first.

## A7 — Sealed product · MANUAL ENTRY SHIPPED take 15 · barcode RULED OUT

658 of 7,518 products are sealed, and for many collectors sealed is a large share
of value.

- **Ruled out: scanning them with the card pipeline.** No card number, no card
  face (landmine 9).
- **Decision for v1:** manual entry, present in search, excluded from the scan
  index.
- **MEASURED take 15: TCGCSV carries no UPC.** All 658 sealed products
  inspected — top-level keys and every `extendedData` name; no barcode field
  anywhere. A barcode scanner would have nothing to look up against.
- **Ruled out: barcode scanning**, on that measurement. It would need a UPC
  source that does not exist in the data.
- **SHIPPED take 15:** sealed product is in the bundle, searchable and addable
  by hand, flagged `sealed`, and never a scan candidate — the number index
  refuses an empty key so a no-read cannot resolve to "all 658 boxes".

## A8 — App name, id and signing · CLOSED take 4 · REGISTERED WITH PLAY take 35

Blocked the first commit for three takes. The owner's call, take 4.

- **Name: OP TCG Hub.** Package **`com.optcghub.app`**, permanent from first
  registration under developer verification (landmine 36) and fixed from first
  Play upload.
- **Trademark read, stated plainly because it is a judgement and not a fact.**
  "OP" is an abbreviation the community uses, "TCG" and "Hub" are generic, and
  the name does not contain a registered mark. That is meaningfully safer than
  "One Piece Collection Tracker" and meaningfully riskier than a name with no
  allusion at all. It is an allusion, and Play IP enforcement is
  complaint-driven, so the residual risk is real but small and it sits with the
  three mitigations that carry most of the weight: no publisher artwork shipped
  (landmine 26), no publisher logo in the icon or listing (landmine 30), and no
  monetisation (landmine 31).
- **Ruled out: any name containing "One Piece".** Direct use of a registered
  mark in a store title is the fastest route to a takedown.
- **Ruled out: renaming the `VAULT_TAKE` build variable.** It would break every
  take citation in HANDOFF and the gate's parser, for no gain. The seed is now
  `optcghub-seed-tNNN.zip` and `ci/build.yml` push.paths follows it —
  APEX landmine 202 is exactly what happens when that glob and the filename
  drift apart.
- **CLOSED take 9: `signing/optcghub.keystore` is generated and committed.**
  CN=OP TCG Hub, OU=sideload, alias `optcghub`, valid to 2054. The first signed
  APK was built with it and the signer read back off the artifact matches the
  keystore's certificate byte for byte:
  `b8308fdb…a39167`.
- **Trade-off, stated plainly (APEX A21):** anyone with the repo can sign as this
  app and produce an APK that installs *over* a real one. Acceptable for a
  private repo and a personal tool with a dozen testers. **Revisit before any
  public distribution or before the repo goes public** — at that point the key
  moves to a secret, and because the history carries it, a new appId.
- **Ruled out: per-build debug keys.** Signature mismatch forces uninstall on
  every take, which destroys the collection. PROTOCOL §9.
- **Ruled out: keeping the sideload key in secrets.** Then a PC build and a CI
  build sign differently and cannot install over each other.
- **The Play upload key is a separate key**, never in the tree, held only in
  repository secrets (RUNBOOK-play §B). `ci/apk.sh` reads the signer back off
  the AAB and refuses to publish one signed with the sideload key.
- **Nothing blocks the first commit.** `docs/RUNBOOK.md` is the procedure.

## A15 — Star-glyph detection · MEASURED take 7, ships behind the rig

Take 6 deferred this because the star region "would false-positive on ornate
cards". Take 7 measured it against 572 labelled card images instead.

- **PROVEN the star is where the catalogue says it is.** Differencing the mean of
  200 star cards against 254 plain ones puts it at x 0.8883, y 0.9362, blob
  0.0150 x 0.0108 — and it is *crisp* in a 200-card average, so its position is
  consistent, not approximate.
- **MEASURED operating point**, template trained on half the sample and scored on
  the held-out half: threshold **0.61**, recall **64.6%**, **zero** false
  positives on 133 plain cards, margin over plain-p95 **+0.36**.
- **The failure mode aligns with landmine 60's asymmetry.** It misses stars and
  never invents them, and a miss costs one picker tap.
- **Ruled out: the take-6 box.** Five times too large; it swallowed the rarity
  badge and left +0.01 of margin. Landmine 64.
- **Ruled out: searching a window.** ±2.5% in x recovered zero extra stars and
  cut the margin to +0.13. More probes, more chances for background noise.
- **Ruled out: treating recall as a tuning target.** Three of six inspected
  misses genuinely have no star printed.
- **Ordering that makes the SP overlap harmless:** OCR reads the literal `SP`
  badge from the code crop first; the star detector only runs if no SP was seen.
  So the 5% of SP cards that also carry a star never narrow to the wrong class.
- **Open:** all of this is on clean 600px renders. Whether the margin survives a
  phone photo is the rig's Q4, and the rig now carries the measured box.


## A19 — Other games: MTG, Pokémon, Lorcana, Riftbound · MEASURED take 23 · DECISION NEEDED BEFORE THE PLAY LISTING

The owner's ask: add the other big TCGs. Measured against TCGCSV at take 23:

| game | TCGCSV cat | sets | products (rough) | catalogue in the APK? |
|---|---|---|---|---|
| One Piece | 68 | 87 | 7,520 | yes — 2.9 MB raw, ships today |
| Disney Lorcana | 71 | 20 | ~3,700 | yes |
| Riftbound | 89 | 13 | ~2,000 | yes, and it is brand new — expect churn |
| Dragon Ball Super Fusion | 80 | 51 | ~4,900 | yes |
| Star Wars Unlimited | 79 | 32 | ~6,200 | yes |
| Flesh and Blood | 62 | 105 | ~2,700+ | probably |
| Pokémon (English) | 3 | ~212 | ~20,000 | **no** — ~8 MB, downloaded per game |
| Magic: The Gathering | 1 | 455 | ~100,000 | **no** — ~40 MB, downloaded per game |
| Yu-Gi-Oh | 2 | 658 | ~36,000 | no |

*(Six-group samples; MTG and Pokémon are underestimates. The shape is what matters.)*

### What generalises for free

- **The pipeline.** `config.py`'s `CATEGORY_ID` is the only One Piece-specific
  number in `tcgcsv.py`, `history.py`, `hashes.py`. A game is an adapter file
  and a category id. Prices, deltas, sidecars, the star-of-the-art hashes — all
  per game, same code.
- **The collection, portfolios, trade, backup, export, filters, credits.** None
  of it knows what game a card is from.
- **The reference-art path.** Same CDN, same rules (landmine 28).

### What does NOT generalise, and what each costs

- **The scanner.** `CODE_BOX`, `CODE_RE`, the star region, `face_class` — all
  measured on One Piece card faces at takes 6–7. Pokémon prints `123/198`
  bottom-left; MTG prints a collector number and set code bottom-left and
  changed the layout in 2015; Lorcana prints `123/204`; Riftbound is unknown.
  **Each game is a take 6 and a take 7 again** — an afternoon of images and a
  measured crop box — plus its own variant story (Pokémon's reverse holos,
  MTG's showcase frames). One Piece's 91%-ambiguous number problem may be
  better or worse elsewhere; unmeasured.
- **The deck builder.** RULES.md is One Piece. MTG has formats and a ban list
  that changes monthly; Pokémon has rotation; Lorcana has ink limits. Each is
  a RULES document from the official text and a legality function.
- **The catalogue size.** One Piece fits in the APK (landmine 8). MTG does not
  — 40 MB raw — and the take-1 design already said "per-game catalogue
  downloads" for exactly this. That is a real feature: a download screen, a
  checksum, a delta, and the first time the app needs the network for
  something load-bearing (PROTOCOL §8 has an exception to write).
- **The name.** *OP TCG Hub* is One Piece. The package name `com.optcghub.app`
  is permanent from the first Play upload (landmine 36, A8).

### The decision — D14, and it is URGENT because of the Play clock

Two honest shapes:

**(a) One app, many games** — the reference app's model. One listing, one
tester gate, one AdMob app, a game picker at the top. Needs a name that is
not One Piece-specific **before the listing exists**, because the package
name cannot change after. The collection model gains a `game` field (cheap,
now). Games arrive as catalogue packs over the months after launch.

**(b) One app per game** — *OP TCG Hub* ships now as it is; *MTG Hub*,
*Lorcana Hub* are siblings from the same seed with a different
`CATEGORY_ID`, adapter and RULES. Each is its own listing, its own **12
testers × 14 days**, its own AdMob app. Ninety-five percent code reuse; five
Play clocks.

- **Ruled out: adding games before the Play upload.** Every day of delay is a
  day the fourteen-day clock has not started, and the scanner work per game
  is measured in afternoons, not hours.
- **Ruled out: "we'll rename later."** The package name cannot be renamed.
  Only the display name can.
- **Recommendation, stated plainly:** if multi-game is the ambition, choose
  (a), pick a non-franchise name this week, and I re-cut the package name
  before the first upload — a ten-minute change today and an impossible one
  next week. If One Piece is the app and other games are a maybe, ship (b)
  as-is and decide later with no cost. **This is the one question that has
  a deadline.**

### What I do either way, now

- The collection line gets a `game` field defaulting to `'optcg'`, and the
  bundle gets a `game` key — so the data model is ready for (a) and harmless
  for (b). Cheap now, migration later.

## A20 — Ideas backlog · OPENED take 23, RANKED

The owner: *"what other ideas can you think of?"* Ranked by value-to-a-collector
over cost, with what each needs. None are scheduled; this is the list to pick
from.

*Take 24: The owner approved the whole list — "add them to the list." It lives in ROADMAP Phase 8 in this order. #7 shipped take 24 as Prep & Play's first screen.*

**Cheap, high value — hours each**
1. **Price alerts.** "Tell me when OP01-016 (Manga) drops under $1,500." The
   nightly build already knows every price; an in-app watch list checked on
   sync, a notification via the local-notifications plugin. No server.
2. **Wishlist / want list.** The inverse of the collection, valued the same
   way; "what would it cost to finish OP-06" falls out of set completion.
3. **Set completion goals with a checklist view** — the missing cards of a set
   as a tappable grid, each one a search hit away. Half built already.
4. **Binder view** — nine-up pages in card-number order, the way a binder is
   actually laid out; flip pages. Collectors think in pages.
5. **Card text search** — "all cards with [Blocker] under 4 cost in Red". The
   keywords are extracted (take 12); it is a filter chip away.
6. **Deck price and its history** — a deck is a list; the chart code exists.
7. **Life / DON!! counter for playing** — a game-day screen: two Life totals,
   DON!! given, turn counter. No catalogue needed; the RULES doc has the flow.

**Medium — a take each**
8. **Deck import from Limitless / OPTCG Sim exports** — tournament lists are
   the community's lingua franca; parsing three formats is a morning.
9. **Trade matching between two collectors** — "cards in my trade pile that
   are on your want list", from a shared QR export. Two lists, an
   intersection, no server.
10. **Sealed EV** — a booster box's expected value from its set's price
    distribution and pull rates. Pull rates are community-sourced and change;
    label it as an estimate of an estimate.
11. **Grading ROI** — "this raw card at $463; a PSA 10 lists at $X" needs a
    graded-price source TCGCSV does not carry (A4's cousin). Real value,
    needs data.
12. **Collection share page** — a static HTML export of the collection with
    reference art, for showing off. The export code exists.

**Large — a phase each**
13. **Other games** — A19.
14. **Japanese printings** — A11, a second catalogue with its own scanner
    measurements.
15. **Cloud sync between devices** — the one feature that needs a server, and
    the ledger has said no to servers since take 1. A file-based sync via the
    user's own Drive is the honest version.

**Ruled out, with the reason**
- Anything that sends the collection anywhere by default (PROTOCOL §9).
- Auto-grading condition from a photo (a separate product; A4).
- A social feed (a backend; ROADMAP won't-build).

## A21 — Google Play · LIVE 24 Sept 2026 (take 101's bundle) · every take is one production upload

*Take 105 addendum — LIVE:* the owner's report at 02:42 UTC: "finally
approved on Google play and it's listed", the Play install on his Fold
(take 101) at 17 pass, 0 fail, the guide shown on the first open.
Everything below is the road there.


*Take 101 addendum:* the owner asked whether take 100's bundle is fit for
Play. Verified from the build's own log: upload-key signed, versionCode
100, targetSdk 36, `com.optcghub.app`. The 56 MB he sees is the installed
size (the file is 34.9 MB; Play serves splits from the 23 MB bundle). The
sizes were then measured from the release files (the table in the take-101
HANDOFF entry): dex 23 MB raw, the OCR engine 11.1 + 6.8 MB, the OCR
language models 5.5 MB raw, the app and catalogue 8.6 MB raw. **He picked
R8 and the non-Latin OCR models — take 103** (A14). The upload-key
question closed itself: **he uploaded take 101 and Play accepted it, and
the app is approved for production (take 102).** The reset steps in
RUNBOOK-play §2 stay as reference. Landmine 34 applies to his own phone:
export before installing from Play.

The owner wants the closed-testing clock started in a few days. The gate is
**12 testers opted in for 14 continuous days** (landmine 35). Everything below
is what stands between the seed and that clock, in order, with who does it.

| # | step | who | state |
|---|---|---|---|
| 1 | **D14 — one game or many, and therefore the package name** | The owner | DONE take 24; `com.optcghub.app` registered with Play at the take-35 upload, permanent |
| 2 | Stand up the repo: RUNBOOK §1–4 | The owner | **DONE** — read off the repo at take 34: public, run #3 green end to end (seed 6 s, bundle 42 s, apk 4 m 36 s, pages 14 s), Release **take-31**, Pages live. PROVEN |
| 3 | First CI build produces the AAB | CI | **DONE** — the four secrets are set; every build's `apk` job prints `AAB signer: Owner: CN=OP TCG Hub upload, OU=play` and names the file `optcghub-take-N.aab` (PROVEN from run 48's log, take 101). **The registered upload key is that key — PROVEN take 102:** Play accepted the upload-key-signed take 101. **Its fingerprint is pinned since take 103** (`ci/signer.sh`, from run 51's printed line, `32:8E:60:…:28:95`): a bundle carrying the upload DN with any other fingerprint fails the build before Play can refuse it. The pin passed on a real bundle at run 52 (take 103) — PROVEN in CI |
| 4 | Play Console: create the app, Play App Signing, the four secrets | The owner | **DONE** — personal account; app created; version code 35 accepted into internal testing (two optional warnings). **UNKNOWN: whether the upload-key bundle or the DEVKEY one was the first upload** — RUNBOOK-play §2 says how to reset if the latter |
| 5 | Listing: title, short and full description opening with the disclaimer, screenshots, icon 512, feature graphic 1024×500 | The owner | copy pasted (take 36); screenshots from the Fold with the take-37 showcase files; the console shows the jolly roger icon — swap to `play-assets-t33/icon-512.png` or say so (D7) *Take 113: the console shows the owner's pick -- the icon, the feature graphic and eight screenshots, from `design/play-listing`, uploaded by the owner; the build writes `play-assets/icon-512.png`, the full-bleed master Play masks, and no longer draws a feature graphic.* |
| 6 | Privacy policy live on Pages, naming AdMob | take 30 | Pages deployed at `https://sergeantcs2.github.io/optcghub/` (run #3); the policy is `/privacy.html` there |
| 7 | Data Safety form: **AD_ID collected/shared for advertising** (landmine 94); camera; no other collection | The owner | **DONE** — advertising-ID declaration Yes / advertising; Data Safety: device IDs collected and shared, advertising, required, not ephemeral, encrypted in transit, no deletion request, no accounts |
| 8 | Internal test → closed test; 16–18 testers recruited (landmine 35) | The owner | **closed-test release APPROVED by Play review (take 52, the owner's report).** Now: the opt-in link to 16–18; the clock starts when the twelfth is opted in; `ci/RELEASE.md` is the guide they read |
| 9 | Developer verification: package + signing key registered (landmine 36) | The owner | |
| 10 | Real AdMob IDs — **not required to start the clock**; Google's test units are correct for a closed test | The owner, D11 | account exists (take 33): `pub-6243777967151950`; **app-ads.txt live at the root site, take 40** — RUNBOOK-play §9 |

- **Ruled out: waiting for real AdMob IDs.** Test units are what a closed test
  should run on.
- **Ruled out: adding games first.** A19.
- **Take 52:** the tester guide rewritten for Play testers — the opt-in link, the sideload-to-Play switch (export → uninstall → import, landmine 34), stay installed two weeks, run the self-test once and share it, play one sim game.
- **Ruled out (take 39): a second applicationId for the sideload build (D3).** The id is registered now; the Play build and the sideload build share it, so the switch is export → uninstall → import (landmine 34, RUNBOOK-play).
- **Ruled out (take 33): building the APK in the session container now that the runner does.** The runner's build is the one the owner installs; a container build is a second signer's worth of doubt for no information. The seed is the deliverable, the Release is the artifact.
- **Take 34:** `tools/play-key.ps1` for Windows (PowerShell cannot run a `.sh`), tested under PowerShell 7 with a damaged-keystore control; the take-32 APK's arm64 libraries MEASURED 16 KB page-aligned (Play's rule for new apps); export through the share sheet and restore through a file picker, because the landmine-34 switch is a reinstall (landmine 110).
- **Ruled out (take 34): `android:hasFragileUserData` to keep data across the uninstall.** Kept data pins the old signature; the Play build's different signer would then refuse to install at all. Export → import is the honest path.
- **Built take 33:** `tools/play-key.sh` (the upload key and the four secrets, one command, read back before trusted), RUNBOOK-play as the whole ordered procedure, the landmine-34 export/uninstall/restore warning up front, the Play graphics from the reverted icon.
- **Built take 30 toward 5 and 6:** `docs/PLAY-LISTING.md` (the copy, in
  the shape Play wants), `www/privacy.html` (served by Pages), and `ci/apk.sh`
  now emits `play-assets/` — icon 512 and a 1024×500 feature graphic from the
  committed SVG.

## A25 — Catalogue sync cost · MEASURED take 29 · CELLULAR GUARD BUILT take 33 · delta deferred with a number

A sync (take 27) downloads the whole catalogue. MEASURED: **4.2 MB raw, 0.56 MB
as Pages serves it (gzip)**. A price-only delta of the rows that moved
overnight (2,433 of 7,520, take 8's 34%) would be **16 KB gzip** — 35× smaller.

- **Deferred, and the reason is the number:** half a megabyte once a day on
  wifi is nothing; on mobile data it is a photo. The delta is worth building
  when a tester says it is not nothing, or when the catalogue carries more
  than prices per day (history is already in the bundle and grows ~30 KB/day
  gzip). Written down so it is a decision, not a surprise.
- **Ruled out: syncing on mobile data without asking.** The quiet once-per-
  open sync checks `navigator.onLine` only; it should also check the
  connection type (`navigator.connection.type` where available) and defer
  on cellular unless the collector says otherwise. **Built take 33** after
  sitting in four DEFERRED lists (landmine 70): `quietSyncAllowed()` holds the
  quiet sync on `type === 'cellular'` unless *More → Sync → Also sync quietly
  on mobile data* is on; an absent API means unknown and proceeds; **Sync now
  never asks**. Four smoke controls, one of them the guard firing. INFERRED
  that Android's WebView reports `cellular` until the Fold shows it.
- **`UPDATE_URL` is set** (take 33) to the Pages host; the first *Sync now* on
  the Fold that reports a date is the proof.

## A26 — Typography and legibility · BUILT take 33 · REPORTED WEAK take 57 · COLOUR AND CONTRAST FIXED take 60

The owner, on seeing the app on the Fold: change the fonts — a mix of **Impress
BT** and **Anime Ace BB** for the loud parts, and **Trebuchet MS**, **Avenir
Black**, **Open Sans Semibold** for the plain parts (the Crunchyroll and
Funimation house stacks, which is the vibe).

- **What ships:** four ROLES, resolved at build time, every file bundled
  (PROTOCOL §8, 232 KB for all four after subsetting to Latin and woff2):
  *display* = Luckiest Guy (Apache-2.0) for Impress BT's job — headlines,
  the hero, panel titles; *comic* = Bangers (OFL) for Anime Ace BB's job —
  tabs, group labels, the mode slider; *body* = Open Sans (OFL, the one he
  named) for everything readable; *heavy* = Nunito Sans at 900 (OFL) for
  Avenir Black's job — the totals and counts. The CSS names the role ("OPH
  Display"), never the face.
- **The slot:** a licensed file dropped into `assets/user/fonts/<role>.woff2`
  (or `.ttf`/`.otf`) replaces the default for that role at the next build and
  not a line of CSS changes (`assets/user/README.md`). If the owner buys Impress
  BT it becomes `display.ttf` and Luckiest Guy leaves.
- **Verified:** render.mjs asks Chrome whether the four faces LOADED and what
  `h2` resolved to, with a control that points a face at a missing file and
  expects `error`; smoke checks the four rules are local files. Every layout
  check at 360/412/673/820 still passes on the new metrics.
- **Ruled out: shipping Impress BT, Anime Ace BB, Avenir Black or Trebuchet
  MS as downloaded.** Impress BT and Avenir are Bitstream/Monotype commercial
  faces and an app embed is a paid licence; Anime Ace BB is free only for
  independent comic creators and non-commercial use, and A17 makes this a
  commercial app; Trebuchet MS ships with Windows under a licence that does
  not allow redistribution in an app. A font.download or dafont copy inside a
  commercial APK is the same exposure as character art (landmine 26), on a
  surface a takedown notice can name. The mechanism is built; the files are
  the owner's call and the owner's purchase.
- **Ruled out: Google Fonts by URL.** Dead offline (A-3), and a request on
  every launch that PROVISION would have to declare.
- **Fixed take 60, in the order the take-57 entry set out.** (1) The gold:
  the colour lives on the display role now (`h1, h2`, `.panel h3`, the tour
  heading), so it follows the palette into Prep & Play — landmine 117.
  (2) Contrast: `--dim2` was **2.64:1** on the card in Collect and 3.20:1 in
  Prep & Play; MEASURED replacements clear AA at **4.58:1** and **4.77:1**,
  and smoke now computes every text token's ratio from the shipped tokens
  with the old value as its control, so a palette edit cannot quietly go
  under again. (3) Desktop: Pages serves the same file to a 1440px browser,
  where the app ran edge to edge; it is a centred 520px column now, with the
  fixed bottom nav pinned to the same width, asserted in Chrome at 1440.
  (4) Measured before changing, and the screenshot is what found the
  remaining faults — a left-pinned column because the media query sat above
  `body{margin:0}`, and a two-line *Got it* button.
- **Still open (D16):** whether the free faces stand. The owner's "weird /
  out of place" may be the faces rather than the colour; that question is
  cleaner to answer now that the palette is right.
- **The owner, take 57, on the app as shipped:** *"the font looks a little
  weird / out of place compared to what it was before, and it's not gold any
  more, or poorly in some places — maybe that's because I'm viewing on
  desktop."* Not built this take, at his instruction. What to check first,
  in order:
  1. **The gold went out of the headings at take 33 and nobody noticed.**
     Before: `h2` and the hero's `em` were the serif at `--brass`
     (`#C9A24A`) by inheritance from their containers. After: `h1, h2` got
     `font-family:var(--display)` and no colour rule, so they inherit
     `--fg` — off-white. The panel titles, the hero name, the tour headings
     and the sim's panel heads all went pale in one line. The share page
     (`collectionPage`) still sets `#C9A24A` explicitly, which is why *that*
     looks right and the app does not. Fix: a colour on the display role,
     brass in Collect and the Play palette's own accent in Prep & Play — one
     rule, then look at every screen.
  2. **Desktop was never looked at.** `render.mjs` sets a 412×915 viewport
     and checks four widths — 360, 412, 673, 820 — all phone and Fold. A
     desktop browser is 1200–1900 wide, where a display face at
     `font-size:28px` sits in a column of white space and reads as loud and
     stranded. The app is an Android app and a desktop browser is not a
     target, but Pages serves it and the owner looks at it there, so the
     honest answer is either a max-width on the content column or a stated
     "phone only" on the Pages build.
  3. **The faces themselves.** Luckiest Guy (display) is rounder and
     shorter than Impress BT; Bangers (comic) is narrower than Anime Ace.
     If the objection survives the colour fix, the role slot is the lever
     (D16) — a licensed file in `assets/user/fonts/` changes the face
     without touching CSS.
  4. **Measure, then change:** a render pass at a desktop width and a
     screenshot of every screen in both modes, side by side with take 32's,
     before any rule is edited. The complaint is about how it looks, and the
     harness cannot see that (landmine 69 in reverse).
- **Open:** Fira Sans is the free Trebuchet if a third plain face is wanted;
  not added, because four families is already the ceiling for one app.

## A27 — The scrubber · BUILT take 35 · in the build and in the gate

APEX ORV runs one before a release; this repo did not, and it is public.

- **Built:** `tools/scrub.py` — `--strip` removes every comment from the
  shipped `www/` (JS by acorn's exact ranges via `tools/strip_comments.mjs`,
  HTML and CSS by pattern outside scripts), called from `build_app.py` so
  the harnesses test the stripped artifact; `--check --docs` refuses the
  owner's first name, an AI vendor's name, the conversational word, a
  credential-shaped string, a build-container path or a leftover to-do marker anywhere public
  — shipped files, public text, ledgers, source — and the gate runs it; a
  `--selftest` plants each marker and shows the guard fire. MEASURED: 135
  comments out of `app.js` (177 → 146 KB), 8 KB out of `index.html`.
- **Applied once, take 35:** the first name became "the owner" (the GitHub
  handle stays; it is the repo's), the conversational word became "session",
  the container path became `~`, and the session prompt file was renamed
  to `NEW-SESSION-PROMPT.md`. 196 lines, grep-checked.
- **Ruled out: scrubbing the source's comments.** The record lives in the
  source; the artifact is what ships. Strip on build, never on commit.
- **Ruled out: a regex comment stripper.** A regex cannot tell `//` in a
  string or a URL from a comment; the parser can, and it is one dependency
  CI already installs beside puppeteer.
- **Ruled out: making the repo private.** Pages on a free plan needs public,
  and Pages is the privacy-policy URL Play requires.
- **Ruled out: the README's link to the sibling repo.** It is the owner's own
  public project and the README says why the governance is shared.

## A32 — Hunt: sealed-product prices, availability, releases and reprints · OPENED take 67 · a third mode

The owner, take 67: *"a price tracker for all sets, hunting all available
sources — Barnes & Noble, Meijer, Target, Walmart, all local game stores,
anything online — for the cheapest prices on boxes and sealed packs. A major
issue with One Piece is finding availability at a reasonable price. Eventually
more local features for card/pack hunting. Maybe a new third mode called
Hunt. List upcoming release dates with details from the OPTCG website, and any
reprint info."*

### MEASURED take 67 — what the app already holds toward this

- **660 of 667 sealed products in the catalogue carry a TCGplayer market
  price** — 46 booster boxes, 216 packs, 105 starter decks, 10 cases, 290
  other — and **590 of them are in the nightly price sidecar today**, so a
  sealed price *history* already exists and grows every night. The app
  currently treats sealed as manual entry and never shows it. That is the
  free first half of the tracker.
- **TCGCSV's group data carries publication dates.** Today it names four
  upcoming releases (Set Sail Deck Set 2026-09-18; Heroine's Edition Vol. 2
  2026-10-30; The Dominance of God event cards 2026-11-13 and the set
  2026-11-20). The ingest already reads this to skip unreleased sets
  (landmine 42). A release calendar is a view over data the pipeline has.

### Where it lives

A third mode on the slider: **Collect · Prep & Play · Hunt.** The palette
mechanism from take 24 takes a third entry. Hunt's screens, in the order they
earn their place: **Sealed** (every box, pack and deck with market/low/high,
the nightly delta, a chart from the sidecar, and a price alert — the alert
mechanism from take 27 already keys on productId); **Releases** (what is
dropping and when, from the group dates, with the set's card count once the
group publishes); **Reprints** (see sourcing); **Near me** (the local half,
last, and the hardest).

### The owner's redirection, take 68

*No account information will be provided. Scrape as much as possible — who
has stock, when they release, current pricing, as real-time as reasonable.
eBay, Facebook, any supplier, official or third party. Into prod if there
are no concerns. The point: help people find cards without paying 2–3× MSRP
on a new pack; if someone lists one low, see it. Scope local to Michigan,
48329, 50 miles.* Get creative; nobody offers this.

### MEASURED take 68 — what a plain, keyless request gets, from a cloud IP

| source | result | meaning |
|---|---|---|
| **Target RedSky JSON** (`plp_search_v2`, the site's own public key) | **HTTP 200, 24 products with prices, priced for a store near 48329** | **PROVEN.** The runner can do this every hour. Store-level stock is one more endpoint (`product_fulfillment`), same key |
| Target search HTML | 200, page shell with captcha markers | the data is not in the HTML anyway |
| Walmart search | 200 but a 15 KB captcha page | cloud-blocked; phone likely fine |
| Meijer | 403 access denied | cloud-blocked |
| Barnes & Noble | 404 on the search path | untried at the right URL |
| eBay search HTML | 403 robot check | cloud-blocked; phone-side works for real browsers |
| OpenStreetMap Overpass (game shops within 80 km) | 503, overloaded, twice | the right keyless discovery source; retry off-peak or self-mirror |

### The architecture that makes "into prod" honest

**Two scrapers, one feed.** The **nightly runner** already fetches, publishes
to Pages and the app syncs — that pipeline becomes hourly for Hunt: one
cloud IP, low volume, every result cached with the minute it was fetched,
published as `hunt/feed.json` beside the catalogue. **The Play build reads
the feed and never scrapes a retailer itself**: ten thousand phones hitting
Target's JSON would get the app's traffic pattern blocked in a week and put
the owner's developer account on the wrong side of a retailer's terms; one
runner fetching hourly does not. That is what "no concerns" has to mean for
prod. The **sideload build** additionally runs the phone-side scrapers —
the sources that block cloud IPs but serve a residential browser (eBay,
Walmart, Meijer) — from the owner's own phone and IP, for himself. Both
paths land in the same Hunt screens; a tile always shows *which source,
fetched when*, and *unreachable since* when one breaks. Never a stale number
dressed as now (§10).

### The suppliers, as expansive as keyless allows — each with its status

**National retail (runner-side unless marked):**
- **Target** — RedSky JSON: search, price, store stock by store id. PROVEN.
- **Walmart** — site JSON behind PerimeterX; phone-side in the sideload
  build, INFERRED. Store pickup availability lives on the item page.
- **GameStop** — Demandware search JSON and store-pickup availability;
  keyless; UNKNOWN until probed. Sells OP TCG.
- **Best Buy** — carries TCG now; site JSON; keyless UNKNOWN.
- **Barnes & Noble** — server-rendered product pages; probe the right search
  URL; UNKNOWN.
- **Meijer** — Mi9 storefront API, 403 to cloud; phone-side, INFERRED.
- **Amazon** — heavy bot defence; phone-side product pages for MSRP
  reference only; low priority.
- **Costco / Sam's Club** — occasional; skip until seen.

**Marketplaces:**
- **TCGplayer via TCGCSV** — sealed prices nightly, PROVEN (660 products).
- **TCGplayer listings** — the seller list per product names hundreds of
  stores, many of them local game stores on TCGplayer Pro; one source that
  is *many suppliers*. Their listing JSON is unofficial; probe from the
  runner. This is the creative unlock for "including TCG": not scraping
  TCGplayer's price, scraping *who is selling at what*.
- **eBay** — search HTML from a phone, sold and active, `_nkw=OP-11 booster
  box`; the "someone listed one low" signal the owner described. Sideload
  only, INFERRED. No RSS since 2021.
- **Facebook Marketplace — NO.** Login-walled, and automating it from an app
  with the owner's session is how the account gets banned. Not a rule; a
  measured outcome. The value is in eBay and the LGS storefronts.
- **Reddit r/OnePieceTCG restock threads** — `.json` endpoints keyless at low
  volume; a "spotted at" signal, not a price. Phone-side, INFERRED.

**Releases and reprints:**
- **TCGCSV group dates** — PROVEN, four upcoming today.
- **Bandai's products and news pages** — release details, reprint and
  restock notices as *headlines with a link*; runner-side; INFERRED.
- **Distributors** — GTS Distribution, Southern Hobby, Alliance publish
  product pages with release dates and allocation/sold-out flags for the
  stores they supply; that is the reprint wave before it reaches shelves.
  UNKNOWN until probed.

**Local game stores, Michigan, 48329 ± 50 miles — the part nobody offers:**
1. **Discovery**: Overpass (`shop=games|hobby` within 80 km of 42.686,
   −83.386), one keyless query, run off-peak or against a mirror, plus a
   curated seed list — Metro Detroit, Flint, Ann Arbor, Lansing's edge — each
   store verified by hand once.
2. **The unlock**: most LGS storefronts run on **Shopify** (often via
   BinderPOS) and every Shopify store exposes **`/products.json` and
   `/collections/<handle>/products.json` — public, keyless, by design.**
   Stock and price for every listed sealed product, without touching HTML.
   Crystal Commerce and TCGplayer Pro storefronts are the other two shapes;
   each gets a parser. A store whose site is a Facebook page has no feed and
   goes in as a *name and address* with the collector's own last-seen note.
3. **Cadence**: hourly from the runner for the Shopify stores (cheap JSON),
   plus a refresh on open from the sideload build.

### What is still ruled out, and why it costs nothing to keep

- **Ruled out: on-device scraping in the Play build.** Above. The feed serves prod.
- **Calling anything "the cheapest".** Show source, price, fetched-when.
- **A server or a shared spotted-at board.** §9. The runner is not a server:
  it writes a file.
- **Affiliate links.** The listing says none.

### Take 69 — nine more probes, the distance filter, and the stores that publish nothing

**The owner:** a distance dropdown on the local view (50 miles is the
default for now; whatever the collector sets, later); keep building the
list; and think about stores that do not publish stock — including an AI
that phones the shop and asks, which he calls crude.

**Nine probes from a cloud IP, one pass:**

| source | result | status |
|---|---|---|
| GameStop search JSON | 403, captcha | phone-side (sideload) |
| Best Buy search | 503 | UNKNOWN; retry |
| Barnes & Noble | 404 on two search paths | needs the real URL; site is server-rendered |
| TCGplayer listings (`mpapi`) | 404 | the endpoint shape is wrong or gone; needs a real product id and method |
| **GTS Distribution** | 404 on the search path but a **617 KB rendered page with 43 "release" and 4 "allocation" hits** | **reachable from cloud**; the catalogue pages exist, the search URL does not — a real source once the paths are read off the site |
| Southern Hobby | 404 on the search path, 124 KB rendered page | same shape as GTS: reachable, path wrong |
| Alliance | 503 | UNKNOWN |
| Bandai `/information/` | 404 | the news path is different; find it from the site nav |
| Overpass | 503, third time today | overloaded; run at night or self-mirror |

The lesson of the pass: **a cloud probe with a guessed URL proves little
either way.** Each source needs one session with its real page structure in
hand, and its parser needs a saved real response in smoke with a control
that fails on a changed shape. That is a take per source, not a line.

**The distance filter.** A dropdown on the local view — 10, 25, 50, 100
miles — over stores with a location, from the collector's own position (the
device, with permission) or a zip they type. Fifty is the default and the
only radius the seed list covers at first; the filter is just a filter, so
it works for any radius as the list grows. Ships with the first local view.

**Stores that publish nothing online — the options, honestly ranked:**
1. **The collector's own notes** (name, address, phone, *last seen: 3 boxes
   at $130, 9/12*). On the phone, no server, works today. v1.
2. **A Call button with a script.** The store's number comes from OSM; the
   app offers *"Do you have One Piece boxes in stock, and what's the price
   on OP-11?"* — the collector makes the call. Crude, but it is the human
   version of the owner's idea, costs nothing, and stores answer a person.
3. **The AI phone call.** Feasible: a telephony service (Twilio or similar)
   plus speech-to-text and text-to-speech, a scripted question, a parsed
   answer. **Costs**: an account and a phone number, per-minute charges, a
   server to run the call — the one thing this project has refused — and
   the store's goodwill, which a robot that rings daily will spend fast.
   Legally, calling a business is allowed but automated callers must
   identify themselves and honour do-not-call requests. **Verdict: not now,
   and not in the app.** If ever, it is a separate service the owner runs
   for himself, whose *results* land in the feed like any other source.
4. **Crowd reports** — *"I saw boxes at Pandemonium for $130"* from any
   collector, shared with everyone. The single most valuable signal for
   stores with no feed, and it needs a place to put the report that other
   phones can read: a server, however small. Named as **D20** rather than
   built or refused.
5. **The store's own social page** (Facebook, Instagram) where many small
   shops announce restocks — login-walled and unscrapable; the collector
   can follow them, the app cannot.

### Take 70 — the "dealers" question, and the first build

**The owner:** some dealers have direct Bandai supply or access to large
supply and sell just over MSRP in bulk — locate them, list contact info or
stock? **Businesses yes, private individuals no.** Bandai's US supply moves
through authorised distributors (GTS, Southern Hobby, Alliance/Diamond,
ACD, PHD) to *businesses with accounts*; nobody private has "direct Bandai
supply". The people the owner means are **volume retailers** — Game Nerdz,
Dave & Adam's, Coolstuffinc, Miniature Market, Potomac (sells to the
public), Steel City, Blowout, Troll and Toad, TCGplayer Direct, Premium
Bandai itself, the Bandai Namco Amazon store, the two official shops (Plano
TX, Brooklyn NY) — all with public storefronts that publish stock and
price, most on Shopify or BigCommerce. They go on the source list as a
**volume-seller and preorder watch**: the moment a preorder opens at MSRP
is the moment a real fan beats a scalper, so a stock flip from *coming
soon* to *preorder* across those storefronts is the highest-value alert
Hunt can send. **Ruled out: publishing any private seller's contact
details.** The app lists businesses that list themselves.

**Built take 70:** the third mode — **Collect · Prep & Play · Hunt** — with
its own palette (measured: dim2 5.42:1 on the card, fg 14.13, brass 7.59),
nav and home. **Sealed:** 343 products (79 boxes, 161 packs, 51 decks, 6
cases, 28 collections, 18 other) with market, low, high, the nightly delta
and its horizon label, searchable, filtered by kind, grouped by set with the
set's date, each row opening the detail sheet where the chart and the price
alert already live. The 232 DON!! cards TCGCSV files as sealed are kept out
by name. **Releases:** every set with a publish date, upcoming first with a
countdown, then the twelve most recent, an unpublished card list said to be
unpublished. Sixteen smoke assertions, three render assertions in Chrome
(knob under Hunt, rows drawn, palette applied). A screenshot found what the
first render assertion did not: the knob measured mid-animation.

### Take 71 — step 2 built: Target, hourly, with shelf stock near 48329

`tools/hunt/target.py` + `tools/hunt.py` + `ci/hunt.yml` + the app's `HUNT`.
Sixty-two products (twelve of them the Japanese release), eight stores
within 17 miles, online and per-store stock, matched to the catalogue where
the match is safe, shown with its fetch time and called stale or
unreachable when it is. **Two measured facts that shape every source after
this:** Target throttles availability calls at ~40 in a burst (one a
second, 64 a run, stop on 435), and a retailer's One Piece shelf is largely
the Japanese release, which is a different product from the English
catalogue and is never matched to it. **Ruled out: asserting a live fetch in
smoke** — the tests build the feed from saved real responses.

### Take 72 — all of the US online, the zip for the shelf, the quota

The radius question answered as two layers: online for everywhere, shelf
stock for served zips (`HUNT_ZIPS`), the pop-up once, and an honest match
(exact → same area → none, said as none). **MEASURED: thirty calls per run
is the quota even at one a second**, so the feed is a rotating budget with a
cursor and a timestamp on every check. **Ruled out: pretending an unserved
zip is served by the nearest one** — the app names the covered areas
instead, and D21 asks how far the phone-side fetch should go.

### Take 73 — the time series, and where the runner keeps its memory

The cursor and the history live on **Pages**: each hourly run fetches its
own last deploy back, because a fresh checkout has nothing. `history.json`
keeps a fortnight of hourly rows (take 114: 336 rows, about 55 days at the measured four-hourly cadence; landmine 173); the app turns them into dated restocks per
store and the last time a product shipped, and refuses to call anything a
pattern under 24 checks. **Ruled out: predicting from thin data** — a list
of what was seen, with the count it rests on, until a real fortnight exists.

### Take 74 — Local, built on the roster nobody else uses

**The roster is Bandai's own list, read sideways:** onepieceevents.com
publishes every TCG+ event as static JSON with the store's address, so the
stores that carry One Piece are the stores on it — 2,967 in the US, 96 in
Michigan — each with its next events. Distances from the collector's zip
area (Census centroids, public domain; the app ships prefix means, ±10 mi).
The Local screen: dropdown, shops by distance, the feed's Target stores,
your own notes with a Call link. **Ruled out: Bandai TCG+'s own API** (a
session-bound JavaScript app) and **claiming a roster store has stock** —
the screen says registered-to-run-events, and stock is the feed's and your
notes' business.

### Take 75 — the storefront layer, on a verified list

Shopify's public `products.json` gives a shop's One Piece listings with
price and availability; the hourly run polls every shop on
`hunt/storefronts.json` and the app shows each shop's sealed stock on Local
and on the matching Sealed rows. **MEASURED: one of seven guessed domains
was right, and the one store lists 405 One Piece products of which two are
sealed** — the online listing is not the shelf, and the screen says so.
**Ruled out: guessing a shop's website** — the list is hand-verified with a
date per entry, and grows as shops are added.

### Take 76 — Events, and the mode's own colours

Every One Piece event in the next month, near the collector, with fee,
seats, a release badge and a Register link into Bandai TCG+ — from a compact
table the roster now emits (11,564 rows, 94 KB gzipped). Hunt is Zoro's:
green ground, cream, gold accent, a three-stroke mark, all measured to AA
before it was written. **Ruled out: any likeness or costume art** — a palette
and a mark are as far as the theme goes (landmine 26).

### Take 77 — stock alerts

Renamed at the owner's word and built by its use: watch a sealed product,
be told when it is in stock at any source the feed tracks, once per flip per
source. **MEASURED: none of seven national volume sellers is readable
keylessly from a cloud IP** (403/404/503), so the watch runs over Target
online, the served Target shelf and the local shops' storefronts, and gains
sources as the feed does. **Ruled out: an alert that repeats every hour a
product stays in stock** — it fires on the flip, and again only after out
and back in.

### Take 78 — an event onto the calendar

A *+cal* on every Events row hands a standards-plain `.ics` to the share
sheet; the phone's calendar takes it. **Ruled out: a calendar plugin** — a
dependency, a permission and a build change for what one file does; and
**a start time** — the source carries dates only, and a time waits for a
source that has one.

### Take 79 — exact distances on request; D22 for background checks

The full zip-centroid table rides to Pages and a collector fetches it once
to be placed within a mile or two instead of ten. Background stock checks
are **D22** — a native plugin, a permission and a review question, filed
with three options rather than built blind. **Ruled out: the runner knowing
what a phone watches** — that is a phone sending its list somewhere (§9).

### Take 81 — first impressions from the Fold

One bug, three symptoms: a sub-16px input zoomed the page, the zip sheet
went off-screen and, being a fixed sheet, covered the nav; relaunch reopened
on Collect's Home under Hunt's colours. Fixed with a viewport rule and 16px
inputs, a boot that lands on the mode's home, a real back-button stack, the
zip asked once per launch, a themed search bar, readable mode labels, the
tour stopping on every card, and Sealed folded by set. **Ruled out: a
modal that cannot be dismissed** — the back button now cancels it.

### Take 82 — the 404, and the diagnostics

Two deployers, one site: the nightly wiped the hourly's feed until the next
hour. The nightly now carries the live `hunt/` files forward. **A hidden
Diagnostics screen** (five taps on About) writes the report the owner asked
for: live probes of every endpoint, storage, errors, the self-test. Also:
Prep & Play in charcoal and red, every native control themed, a neutral zip
placeholder, Details links on Releases. **Ruled out: two deployers writing
disjoint files** — one site has one truth, and each deploy carries the
other's.

### Order, and the first take

1. **Sealed** — the mode, the screen, the chart, alerts on sealed productIds
   (data already on the phone). 2. **Target via the runner** — search +
   store stock for 48329, hourly, into `hunt/feed.json`; the app's Sealed
   tiles gain a *Target: $X, in stock at N stores near you, fetched HH:MM*
   line. 3. **Releases** from group dates. 4. **Michigan LGS** — discovery,
   then Shopify `products.json` polling. 5. **TCGplayer sellers.** 6. The
   phone-side pack in the sideload build: eBay, Walmart, Meijer. 7.
   Reprints from Bandai and the distributors. Each source lands with a
   probe in smoke that proves the parser against a saved real response and
   a control that fails on a changed shape.

### Take 92 — the events source changed shape; the roster froze for six days under a green hourly

The first diagnostics paste (take 91) said `events.json: HTTP 404`,
`stores.json … 6 days ago`. **PROVEN:** `onepieceevents.com/data/evnt_us.json`
became a chunk index on 2026-09-22 (`format: chunked-events-v1`, three
`evnt_us_part_NNNN.json` files, 50,300 events, ~108 MB raw); the fetcher
indexed `["events"]`, raised `KeyError`, and the hourly's failure path kept
the 09-17 roster and dropped the events table — a 404 no later run could
heal, under a green workflow (landmine 130). **Fixed:** the parser accepts
both shapes and refuses a third; chunks are joined in index order and
checked against the counts the index promises; a failed rebuild keeps both
files; a fresh roster with no live events table is rebuilt, not carried.
Proved against the live source from the session VM before it shipped.
**MEASURED, not ours to fix:** the "hourly" ran six times in the last day
(GitHub delays a public repo's cron); the *checked N ago* labels are honest.
**Ruled out: a block on the roster host** — 200 from the runner and from the
VM; the log said KeyError, not HTTPError.

### Take 94 — GTS Distribution, the first distributor source

The owner opened the hosts in the environment's network policy and chose
GTS. **Read off the real pages (MEASURED):** a Website Pipeline storefront
whose listing page embeds `var productResults = {"count", "products"}`;
Brand `ONE PIECE` × Manufacturer `BANDAI JAPAN` is 49 products and
`rpp=60` returns them in one call; per product the name, SKU, UPC, MSRP,
release and preorder dates, the stock words and `flags[1]`. **PROVEN:**
`flags[1]` is the allocation flag — the product page's template shows
"This product may be allocated" on it, and the Allocated facet holds
exactly the 32 flagged products of the 49. Today every booster from OP-16
to OP-19, EB-05, EB-06 and the ST-31 to ST-38 displays are sold out and
allocated months before release (OP-19: 2027-03-05). **Built:**
`tools/hunt/gts.py` (strict parser, fixture, controls), the feed's second
source with the keep-the-last-good path, the distributor line under a
Sealed row, the panel, the Releases line and the *not in the catalogue
yet* list, the `gts:` alert source. The matcher learned the wholesale
names (a normaliser on the source side), three set-code families and a
tie-break (landmine 134). **Next:** Southern Hobby, same shape, its own
take; the state timeline from the history rows.

### Take 112 — Southern Hobby, the second distributor source

**Not GTS's shape (MEASURED; the record's "same shape" was inferred,
landmine 165).** Southern Hobby is an osCommerce-style storefront with no
embedded product object. Its One Piece category is one page: 20 rows, the
footer says 20, and the columns are name, item number, release and
order-due dates. Prices sit behind a login. Each product page adds a
prerelease date, the unit it is sold as, the configuration, and "brick and
mortar restricted" on 2 products. Every one of the 20 is "subject to
allocation", so the flag says nothing about one product. robots.txt allows
both kinds of page and disallows search, quick view and `sort=`.

**Built:** `tools/hunt/southern.py`, with a strict parser, fixtures from
the saved pages, and controls:
- the category page every run;
- a product page on first sight and weekly, at most 25 a run, none
  started 90 s in;
- the feed's keep-the-last-good path;
- each item's state in the history rows;
- a match through its own normaliser, where the unit decides: no match
  while a starter deck's or a double pack's unit is unread, and a case
  only to a case (landmine 167).

The app's distributor lines, Sealed's panel, Where to buy and Releases
carry both distributors, each in its own words. Southern Hobby's words
are dates and "in-store only".

**PROVEN from the VM:** one live fetch returned 20 of 20 and read 20
pages with 0 failed, in 21 calls and 45 s. It matched 4 products, the
same 4 as the fixtures.

**Ruled out:** Southern Hobby as a stock-alert source (no stock words);
its allocation flag (on every presell); its prices (behind a login); one
row per product across the two distributors in "not in the catalogue
yet" (only a set code joins them).

**The owner's word on the pictures:** "I don't want them flooding the
screen." A distributor on a sealed row is now one short line (its name and
its state) that opens the product's page at its Distributor info; on
Releases the same lines are text on the set's row, which opens the set
(take 115's review). The panels
and the not-in-the-catalogue list sit under closed "Distributor info"
drop-downs, and Where to buy lists sellers to collectors only (UI-AUDIT §8).

**Next:** the state timeline from the history rows. *(Done, take 114.)*

### Take 114 — the distributor state timeline, and GTS's date read off its own page

**Measured first:**
- The rows are kept by count, 336, which is about 55 days at the measured
  four-hourly cadence, not a fortnight (landmine 173).
- No distributor state has changed yet in 8 GTS reads and 1 Southern Hobby
  read.
- Every Southern Hobby state, and GTS's `coming`, `preorder` and `out`, is
  computed from dates. The rows keep the state word, not the dates.
- GTS's `preorder_date` is its Order Due Date, read off its own product
  page. The app called it the day preorders open (landmine 172).

**Built** (the HANDOFF has each part and its checks):
- The timeline, app-only from the rows, inside each distributor's section
  of the closed "Distributor info" on a product's page. It gives the checks
  and their days, the state at the first check, and each change between
  its two checks, saying whether it was read off the page or worked out
  from its dates.
- GTS's words in the Order Due Date's own sense.
- An hourly that stops rather than deploy a history that lost its past.

**The owner's answers to the pictures:**
- GTS's words: "exactly exactly right, that's fine".
- The history: "it should be tucked away". It sits behind one line, tapped
  open.
- The GTS stock alert: "your suggestion", stock for stores only.

**Ruled out:**
- A second record of changes beside the rows: a change log in git would be
  a third runner-owned file, and two records can disagree.
- "Since" on any line, since the first check is only the left edge.
- A pattern or a forecast at any count (take 73).
- Naming a calendar change's day from dates that do not put it between its
  two checks.
- A new GTS state for "no due date".
- The timeline on a row, a short line, Sealed's panels or Releases (the
  owner's take-112 word).
- Changing the GTS stock alert without the owner.

**After the merge (take 115):** PROVEN live on 25 Sept at 01:28 UTC -- GTS
timed out, the feed kept its last copy, and the new row has no `gts` key: a
failed read is a hole, not "nothing listed".

### Take 115 — what the production review closed in A32

- **A kept copy reads "not reached".** The app took a kept distributor
  (`ok` still true, `kept`, `stale_since`) for a fresh one; the live timeout
  above read "2 distributors · checked just now". Now one predicate says
  not reached, on Sealed, a product's page, Releases and Diagnostics, and the
  kept copy is still shown (landmine 180).
- **Target's history line counts days** from the rows' own times, not
  "hourly checks", and hides once the rows span a fortnight (landmine 173).
- **The nightly race is closed.** The nightly's Pages deploy reads the
  hourly's files again inside the `pages` group the hourly holds (landmine
  184's take).
- **The hourly validates** the catalogue it deploys, and a red hourly opens
  its own issue.
- **Southern Hobby:** an unread Illustration Box, or an unread name that
  says Case, matches nothing until its page is read (landmine 167's
  addendum).

**Next** (in order):
- Date moves ("release moved Nov 20 → Dec 4"): the runner must record each
  change's dates; the rows keep states only, and about 55 days of them.
- A delisted item: the rows carry no map from an id to its product.
- The history on Releases' not-in-the-catalogue list; the first real change
  is INFERRED for PEB-01 on 15 Oct UTC.
- Southern Hobby's paging: if its One Piece category grows past one page,
  the fetch fails on its count, by design, and keeps the last good copy. How
  the site pages is UNKNOWN (the page-2 probe returned the same 20).
- The hourly's feed is still tied to TCGCSV and to validate: an outage or a
  refused catalogue stops the feed's deploy too. Separating them means
  deploying the feed over the live catalogue (take 115's runner lane).
- GameStop, Walmart, Meijer and eBay need a residential IP: they wait for
  the sideload build.
- UNKNOWN: whether stores can still order on GTS's due day itself.

## A42 — The UI series: uniform headers, card art used boldly, one voice · OPENED take 106 · CLOSED take 111 (PR #35, merged 16:31 UTC 24 Sept)

**Take 119 (the UI/UX session), the owner's picks from the six take-119
sheets:** the surface with the caps label and the fading rule on every panel
of Collect and Hunt (S1); the collection tile as a surface card (T1); the
surface on Prep & Play's panels too (P1); the mode swipe as drafted; the last
literal radii and inline sizes onto the tokens. Measured in Chrome: the
surface's gradient, corner and shadow per mode, a real drag on the bar, the
slide paused half-way, reduced motion. **Ruled out (take 119):** a slide on
every switch (the guide, Back and the harness need `MODE.set` instant); a
cloned screen under the slide (its canvases go blank); the swipe on the page
body; `contain:paint` on the body for the slide's overflow; the count always
on a line of its own.

**Take 118 (the UI/UX session), the owner's picks from drawn schemes:**
Collect is Wano indigo with the bright gold G1 and Home wears the premium
pass -- the hero on the dearest printing's art, the total in a gold
gradient, a pill switch, one pill group, surfaced panels with caps labels,
Most valuable as a shelf of the six dearest cards; Hunt is the treasure map,
kraft; Prep & Play stays. Every pair measured in smoke on every build.
**Ruled out (take 118):** Collect's C1-C4 and Hunt's H1 and H3 as drawn
(the pair must not share a family, or the switch stops reading); the second
gold G2; Most valuable as rows; a light skin (take 120's question).

**Take 117 (the UI/UX session), the owner's polish list from the take-114
look and this session's rendered audit:** Sealed lists a starter-deck set's
products once, under Starter decks, and every set strip is 104 px on the
card's face with the release date in words under the name (B3, the owner's
pick); a card's page shows the same three cells on every card -- Type, Cost
or a Leader's Life, Power -- each label above its value, and the printing's
badge sits on the title's centre line; the scanner's bottom row is a grid
that keeps one shape at every width (landmine 203) and its hint sits in
the column's flow; the mode bar carries the status-bar inset and covers it
once a page scrolls; the release note moved from Home to More -> About;
every stylesheet size is on the token scale. **Ruled out (take 117):** five
cells (they overflowed at 411 px); captions under the scan row's icon
buttons (a one-rule rider if the owner wants them); a whole-card thumbnail
beside the strip name (the owner chose the taller strip); the hint above the
well.

The owner, 24 Sept, to the UI/UX session: the app "needs refinement,
some text isn't consistent, some title/headers shift/don't line up or
have the same design, much more small critiques", and "leverage One
Piece TCG art as much as possible". The owner's rulings, in order of asking: art
— official and card art welcome, "Hot-Linked Card Art, Bold", nothing
drawn from scratch; the three palettes stay; priority Prep & Play, then
Hunt, then Collect, then uniformity; the Fold's inner layout later; D17
Collection; A37 the same gear to More on every main screen. From the
preview page (three headers in the app's own fonts and palettes): C on
Decks with the title in A's slot, A's art banner on Sealed, A's compact
bar with a back arrow one level down, no banner on Collect's Home, the
blur always the card's own colour.

The series, one take each, by layer and app-wide (a header converted
mode by mode leaves the app less uniform in between):
1. **Foundation** (take 106): design tokens, the Prep & Play accent
   readable, nothing under 12 px, colours that follow the mode, the two
   blank icons, the equal-thirds slider.
2. **One header** on every screen (take 107): one title in one place,
   back on the screens one level down, the More gear on every main
   screen, Home's two views as one switch, the sheets' titles and a
   close button.
3. **Controls and icons** (take 108, split from the header take so each
   take is one thing to look at): icons from the sprite only, one
   meaning per glyph, 44 px targets, pressed and disabled states.
4. **The art layer:** the record's art policy corrected first (landmines
   26 and 28 corrected, not renumbered; 30 and 31 stand), then the
   banners, backdrops and Leader-art covers, measured on the runner.
   *Take 109, the first half:* the record corrected; the picture
   measured (TCGplayer's largest is 600x838, up to 716x1000; Bandai's
   is 600x838; the SAMPLE stamp on 38 of 40 card pictures at the two
   hosts, always one band from about 45 % to 60 % of the card, so a
   banner shows only the card above 42 %); Decks under its Leader (C,
   the title in A's slot), the ready-made decks back on Decks with their
   Leaders' pictures, a deck's Leader large, a card's own page over its
   own colours. The owner, asked about the stamp: "We should be pulling
   the highest quality images for the main cards. This is the only way
   using cards as a banner will work." *Take 110, the second half:*
   Sealed's banner (A), every Sealed heading a strip, each Leader behind
   its side of the Play counter, the owner's own hero pictures; at the
   owner's word the card no longer rises from behind Decks' title, the
   blur shows the band above the stamp whole (the whole card in a blur
   still shows the stamp, MEASURED), whole cards stay whole ("It should
   show the whole card"), and three texts are gone.
5. **The voice:** one word per thing, one date and money format,
   Collection for Portfolio, the developer's voice out of the UI. *Take
   110.*
6. **Polish:** motion, loading, empty and error states, the checklist.
   *Take 110*, with the thumbnail tokens and a readable fallback label.
7. **The Fold's inner screen:** two panes where two fit, between a phone
   and the desktop column. *Take 110*, brought forward at the owner's word
   ("Ensure 110 has as many planned changes in it as possible"). Its width
   was INFERRED (840 px) until the owner's Diagnostics measured it at take
   115: 749 x 832 CSS px at 2.625, where the 700-899 px rules hold
   (MEASURED in Chrome).

Take 110 carried layers 4 (second half) to 7 in one take, overnight, at
the owner's word: "You will check your work along the way then we will
push to github as one massive take." What is left is the owner's review.
*Take 111:* the owner merged take 110 at 14:07 UTC on 24 Sept without a
note on the look ("Merged, continue - monitor and continue with 111"); take
111 is the last look -- every screen at both sizes -- and what it turns up.
The item closed when take 111 merged (PR #35, 16:31 UTC, 24 Sept). What it turned up (the HANDOFF has
each): a dot opening a line for a printing with no number; the filter's
words; a printing's badge cut by the ellipsis on the phone (landmine 164);
the bulk bar off a 411 px phone; a sealed product's page and the 253 DON!!
cards filed as sealed (landmine 162); Set completion counting products;
the card page saving to another collection's line and a second slab taking
over the first's grade (landmine 163, AGENTS rule 5); the binder opening on
empty pockets; rows askew on their picture (landmine 161); and a dozen
words. Left for the UI/UX session: a binder page that fits the open Fold
(pockets near 110 px wide, or a scroll, as now).

The audit behind it, with line numbers and a box per finding, is
`docs/UI-AUDIT.md`; each take ticks its boxes.

**Ruled out:** a design system generated from a style database (its
two proposals were a landing page and a generic palette; the app keeps
its own four faces and three palettes); converting one mode at a time;
re-adding the skull glyph (removed at the owner's ask, take 63);
bundling art in the APK (the owner's own hero pictures through
`assets/user` remain the owner's choice and the owner's exposure); Bandai's card site as the cleaner picture (take 109: its
pictures carry the stamp, 20 of 20, and it keys by card number); a
per-card stamp detector (take 109: the stamp's place is fixed, so a crop
above it is clean for every card and needs no threshold); covering or
retouching the stamp (drawing on the publisher's card); the whole card
in a blurred backdrop (take 110: the stamp comes through a blur as a light
band, up to 80 levels of 255, MEASURED on ST02-001's clean and stamped
pictures); strips on Releases and art in empty states (take 110: the
reasons are in its HANDOFF); a back arrow on Market Movers (take 107: it
is a state of Search, a screen in the nav); a header that stays on screen
as the page scrolls (take 107: the mode slider already does, and a second
fixed band costs every screen about 64 px on the cover display); Save in
the deck's header (take 107: it stays where a deck is finished); Lucide's
icons wholesale (take 107: the sprite takes a symbol only where the app
needs one).

## A43 — What take 115's production review handed on · OPENED take 115

The two-axis review of takes 106-114 and its three sweeps (HANDOFF take 115,
"The review") confirmed about a hundred findings. Take 115 fixed every one
that was real and small, each with a check watched to fail on take 114's
build. This item is the rest: what is too large for one take, what is the
owner's to decide, what only a phone can prove, and the small things left
on purpose, each with why and a fix sketch. The UI/UX session's items are
UI-AUDIT's open boxes; they are listed here once so nothing is lost.

**Large, or the owner's decision:**
1. **Ad consent.** There is no consent (UMP) flow. If rewarded ads do not
   fill for a user in the EEA or the UK there is no fallback, and that
   user's pending cards never commit. The owner decides whether the app
   serves those users and how; a consent flow is a new plugin, a Play form
   and a take of its own.
2. **D11, the two real rewarded unit IDs** (the owner's). Register the
   owner's phones as AdMob test devices first; the IDs ride the Pages
   manifest, so the take that carries them switches every install.
3. **Reproducible builds.** There is no `package-lock.json` (`seal.sh`
   deletes it, so `npm ci` in `apk.sh` always falls back to `npm install`);
   `ci/deps.sh` installs unpinned; and the nightly replaces take N's AAB
   under the same versionCode, so a plugin update can reach a production
   upload through a nightly with no PR. Sketch: commit a lockfile and stop
   `seal.sh` deleting it, or pin exact versions; give the nightly's AAB its
   own versionCode, or stop the nightly replacing it. The owner's call: it
   changes what a nightly can ship.
4. **Android's automatic backup** (INFERRED from Android's 25 MB per-app
   limit). No rule keeps the rebuildable synced catalogue (5.1 MB) out of it;
   the scan photos are the collector's own pictures and must stay. After
   roughly 300-400 scans the whole automatic backup could stop -- the one
   that brought the owner's 71 lines back at take 105. Measure the app's
   data folder on the Fold before writing any rule.
5. **The backup file after the sideload-to-Play switch** (INFERRED, landmine
   110's family): whether the Play install may overwrite
   `Documents/OPTCGHub/backup-latest.json` (and take 115's
   `backup-before-restore.json`) written by the sideload install. The proof
   is More's "Last backup" line on the owner's phone.
6. **Which takes reached production** is not recorded after take 101. The
   owner uploads take-115's AAB after the merge (one upload per take,
   landmine 33).
7. **The hourly's feed is tied to TCGCSV and to validate**: an outage, or a
   catalogue the validator refuses, stops the feed's deploy too. Separating
   them means deploying the feed over the live catalogue (take 115's runner
   lane).

**Only a phone can prove** (BUILT and checked in smoke and render):
- a commit on a full storage, the restore toast and the backup hold, a
  stalled sync recovering (take 115, A1); since the self-review, a commit
  and a drained tray with the storage at its quota, the hold's words for a
  list other than the collection, and the restore's second question;
- the "Restore from" sheet, the `backup-before-restore.json` write, the
  re-armed release notifications (A2);
- the next distributor timeout read as "not reached" (A3).

**Small, left on purpose:**
- A gate check that freezes the catalogue's top-level keys and columns, so
  a take that renames one knows older installs will refuse its syncs (A1).
- Restore goes straight to `backup-latest.json` when no kept copy exists, so
  an older dated backup is reachable only through "Choose a file" on the
  "Restore from" sheet, which shows only when a kept copy exists (A1, A2).
- The waiting scan batch is in no backup; a new or renamed collection is
  backed up only at the next commit (A2).
- A cost basis and a Hunt note's price are typed in dollars and say so:
  candidates for the price alert's treatment (A2).
- `build_catalog.py` still prints and ships `manifest.sets` = 87, every
  group; the app no longer reads it (A3).
- Render opens the first set's checklist; a future upcoming sealed-only
  group would sort first and show "0 of 0" there (A3).
- `gtsWord`'s `DIST_WORDS[s] || s` has the prototype-key hazard `shWord`
  had; GTS's states are the runner's own words (A3).
- `hunt.py`'s SQL `NOT LIKE '%DON!! Card%'` is the runner's copy of the app's
  DON!! predicate (A3).
- An unread booster box whose name carries a count ("12CT") still matches
  the single box; no live listing does. Refusing every unread unit needs
  saved OP-18 and SD-01 pages first (B1; the owner's).
- How GitHub classes a timed-out job for the report job is UNKNOWN (B2).
  (The new-set pause of the hourlies is fixed: the hourly's validate is not
  `--strict`, landmine 200.)
- CSV import saves the whole collection once per row (each `OWN.add`), so a
  file of thousands of lines writes it thousands of times. Sketch:
  `OWN.add(..., { save: false })` in the loop and the one `commitOwn('import')`
  after it, the self-review's `moveIn` pattern (take 115's self-review).
- The storage-full toast says "export your collection" whichever write
  failed; Export CSV carries the collection only, not the decks or the
  alerts. The backup carries everything (take 115's self-review).
- The restore's second question, when storage cannot keep what it replaces,
  could say that on the phone a copy was written to Documents › OPTCGHub ›
  backup-before-restore.json (take 115's self-review, optional).
- A gate check that the session prompt's "Say take N" equals BUILD + 1: the
  miss happened at takes 113 and 114.
- The Cards list's cost dot: 16 of 2,712 playable numbers have no cost in
  the feed (take 111); a data gap, not a code one.
- The card page's 300 px art on the open Fold needs 788 device pixels at
  2.625, and TCGplayer's largest is 600 wide: it is stretched 1.31 times.
  There is no larger source (A41).
- Take 110's question, whether any other long note should go, closes unless
  the owner names a note.
- Render's default phone is still 412 x 915 at 2; moving it to the cover's
  MEASURED 411 x 960 at 2.625 is untested (A5).
- Smoke's pin on Sealed's strip reads only the scrim's first stop; render
  measures the text over a white picture (A5, landmine 191).
- The look lists of takes 98-112 now run at 749 px in New York time and have
  not been rerun there (takes 106 and 114 have).
- The distributor Open's aria-label has a straight apostrophe after a name
  (an attribute, which take 110's apostrophe rule leaves alone) (A4).

**For the UI/UX session** (UI-AUDIT's open boxes -- §7, §8, §9 and "Found in
passing" -- and what take 115 found): the binder on the open Fold; Sealed's
banner crop at 749 px; the distributors' names verbatim in the
not-in-the-catalogue list; one product in two rows there; "— · market" on an
unpriced product; the day in Releases' group line; the history's `.dtl` look;
Sealed's GTS counts overlapping; a Pages favicon; a Sealed row's kind in the
plural for one product; Releases listing an upcoming group by its sealed
product alone; the Sim's "5000attacks with"; the empty grey box on the
Leader and printing sheets when a picture is refused; a deck row's second
line cut at 411 px; set completion's names cut at 749 px; text on Sealed's
strips held to 4.5:1 over a white picture; the sixteen tokens nothing reads
(`--teal --fs-label --fs-row --sp-1 --sp-4 --sp-5 --sp-6 --r-sm --r-md --r-lg
--ic-sm --ic-md --ic-lg --thumb-s --thumb-m --z-screen`).

**Ruled out:** putting a condition note back on a card's page (the owner
removed it at take 110; PROTOCOL §10.3 now says where the label lives); a
try/finally on the refresh buttons (every inner call already catches; a
stall was the only way to stick, and the deadline answers it); clearing the
deadline once headers arrive (a stalled body would still hang); always
showing the "Restore from" sheet (the straight path stays when nothing is
kept); stripping every comma from a typed amount ("11,36" in euros would
become 1136); working out the DON!! split in `build_app.py` (a second copy
of the app's predicate); taking a kept copy out of Releases' "Checked"
footer (that time is the copy shown). From the self-review: counting the
fixture's unlisted products with a second copy of the app's rule (it would
pass whatever the app did; the fixture's own catalogue is read instead);
the Hunt files' deadline in gzip (it would let the default fall to 7 s);
`hashes` in the hourly (every image probed every hour); removing the older
undo copy before "Restore anyway" is answered (a Cancel would lose the last
restore's undo).

## A41 — Missing images elsewhere in the app, sourced from somewhere other than TCGplayer · OPENED take 100

The owner, on closing A39 item 3: *"there may be other parts of the app
we can source images for that are missing."* Nothing is built until he
names the parts and the source. What is known: the 219 card images the
CDN refuses (recorded in the sidecar's `missing`; the list is readable
there), the 23 sealed images (`missing_sealed` — read at take 101: ten
are the unreleased OP18 and EB05 boxes, packs, cases and the Double Pack
Set; the other thirteen are displays, cases, DON!! cards, a dash pack, a
bonus pack and a judge pack TCGplayer never photographed — the full list
with ids is in the take-100 HANDOFF entry), the stock-deck covers (drawn
by the app on purpose, take 62), Local and Events (no images by design).
The second host served one id of 242 (599838, a card). Any new source is a PROVISION
row and a display-only reference (landmine 26: art is never hosted);
the runner measures availability before a URL ships (the take-100
pattern — one constant per host). *Take 109:* the owner's ruling for the
UI series ("if we can use official art, card art or anything we can
leverage i'm more than okay with it") answers whether art may be shown;
which parts, and from where, is still this item. Measured at take 109:
Bandai's card site serves every card looked at (600x838) but stamped
SAMPLE on 20 of 20 -- not a cleaner source -- and names a card by its
number, not its printing (AGENTS rule 3). The 221 ids TCGplayer refuses
are refused at every size it serves (`_in_1000x1000` included). *Take
115, the owner's Diagnostics on take 114:* 221 cards and 24 rows without a
number have no picture at the first host, and the second host serves 1
(599838). Of the 24, 5 are DON!! cards (677570, 677571, 710745, 710746 and
719824, new since take 100's 23) and 19 are sealed products; the sidecar
counts every row without a number as "sealed" (landmine 162's family).

**Ruled out:** hosting or caching any image; a source without terms
the app can cite; shipping a URL the runner has not seen serve; a
source keyed by card number standing in for a printing.

## A40 — The look: the session clicks through and screenshots every change before a take ships · OPENED take 99

The owner, mid-take 98: *"add a way for you to directly test these new
features and bug fixes … it prob shouldn't be in the app build … maybe an
Android phone emulator where you can click buttons and test yourself and
run your findings by me … We don't need to test every line of code, just
new features, bug fixes … This should be ran before the task is finished.
We will use screenshot testing and browser testing."* His two decisions:
the harness first (take 99), the pictures probe next (take 100); the
screenshots and findings sent to the owner, every take.

**What it is (take 99):** `tools/look.mjs` opens the built `www/` in the
session VM's own Chromium (Playwright is installed globally there) at the
Fold's two sizes, walks a per-take step list (`tools/look/steps.mjs`:
real clicks, typed text, `history.back()`, the app's `window.VAULT`
surface), and writes a PNG and a measured line per step under `look/`
(gitignored). The session reads every PNG and sends them with findings
before the PR is marked ready; the owner's input closes the loop.
PROTOCOL §6 carries the step.

**Limits (MEASURED at take 99):** no camera, notifications, share sheet or
native Back (history Back runs the same handler chain — landmine 137's
test); no CDN pictures from this VM (every host but GitHub is refused), so
pictures are label boxes in the look; the inner viewport is INFERRED until
the owner's Diagnostics `viewport` line arrives.

**Ruled out:** an Android emulator in this environment — no `/dev/kvm`,
no virtualization flag, no SDK, no network (MEASURED); anything inside the
app build; the CI harness as the review (pass/fail by design); the look in
CI for now (a puppeteer port and an artifact gallery — deferred, the
owner's call).

## A39 — The take-97 look: seven items from the third install · OPENED take 97

The owner installed 97 (over 96, in place), answered the release report
for takes 95–97 with five screenshots and the Diagnostics paste, and named:

1. **"Back button is still weird … takes me to Collect's home instead of
   the previous page"** — and the paste's eight `blank: no screen on after
   hardware back … >detail` records. The blank-after-Back, root-caused:
   `closeAnyOverlay()` closed the card sheet as if it were an overlay
   (landmine 137). → take 98.
2. **"Make starter decks automatically collapsed"** (the Sealed section).
   → take 98.
3. **"Still some missing pictures, namely releases and some newer packs —
   these 100% have pictures on TCG"** — the catalogue's CDN URLs answer
   404 for them; TCGplayer's own pages use a second image host. A
   two-URL question to the owner decides whether a second host is worth a
   take (PROVISION, landmine 29). *Take 100:* the runner measures it
   instead — the 674 sealed images probed every run (never before), the
   second host probed for every missing id, what serves exported as the
   product's `img`, what nothing serves stays the label box, and
   Diagnostics carries the counts. The owner's two-URL answer stays the
   independent check. *MEASURED, check run 29:* 23 of 674 sealed images
   unavailable at the first host; the second host serves 1 of 242
   missing and 404s the rest — real host, wrong place for these. *Closed
   take 100* by the owner's own check of TCGplayer's page for 712901:
   "they have no image". The newest boxes and packs have no picture
   anywhere TCGplayer serves; the label box is the honest picture, and
   the runner keeps measuring every build so a picture appears the night
   it exists. His follow-on — other parts of the app whose missing
   images could be sourced elsewhere — is A41.
4. **"I haven't seen the tutorial popup in a while"** — the guide shows
   once per install (`GUIDE_KEY`). *Closed take 99 by reading:* the row to
   reopen it already exists — More → *How it works* → *Show the guide
   again* (`#guideAgain`); the release report tells the owner where.
5. **"The loading screen has the default color, then changes to the
   color of … whatever I was doing last. It should be the same constant
   color"** → take 98.
6. **"I can't click the cards directly in most valuable"** → take 98.
7. **The condition buttons "still don't work, I click them and the page
   seems to refresh. I'm still confused what they even do"** — a tap
   repainted the whole sheet and nothing said the tap chooses the
   condition recorded with the copy you add → take 98, in place and
   explained. Also from the answers: the reminder toast ran off both sides
   of the screen → take 98, a toast that wraps.

**Ruled out:** treating the sheet as an overlay again (it navigates, so it
goes through the stack); a second image host on a guess (the owner's
measurement first, then PROVISION); a background check for anything.

**Order:** take 98 (1, 2, 5, 6, 7, the toast) → the picture answer decides
3 → A32 Southern Hobby.

## A38 — The take-94 look: eight items from the first install with a distributor · OPENED take 94

The owner installed take 94, answered the release questions in order
(five screenshots, the Diagnostics paste: 17 of 17, `gts 49 products`, no
errors) and named, in his words:

1. **"Starter decks flood the release page"** — their own section on
   Releases, grouped by release day. → take 97. *(built take 97: a run of
   two or more starter decks on one day is one row with a fold — on
   Upcoming, Recent and the distributor's list)*
2. **"NM, LP, MP, HP, DMG don't do anything if they're buttons — they
   shouldn't show on boxes"** — the condition segment on a sealed
   product's sheet; unexplained on a card's. → take 95: hidden on sealed,
   labelled on cards.
3. **"Some pictures are still missing (Dominance of God, Starter Decks
   31-36)"** — INFERRED: the catalogue carries their CDN URLs and the CDN
   has not published the photos; the tile is the honest state. Nothing to
   build; watched.
4. **"Add links to where I can buy these under each listing with a
   picture representing where"** — TCGplayer, online, local
   address/phone. → take 96, as text chips per source (a brand logo in a
   Play-listed app is a rejection ground; the name says the same thing).
   *(built take 96: a chip per seller under each Sealed row — a glyph for
   the kind, the name, ↗ — and a Where-to-buy panel on the sheet with the
   roster's address, distance and a Call button; TCGplayer's product page
   from the catalogue's own id, no parameter)*
5. **Releases: "make days change through different colors as it gets
   closer, add the ability to add an alert, or to add an event to my
   phone's cal"** → take 97 (the take-78 `.ics` path for the calendar).
   *(built take 97: four colour bands from the palette's own tokens;
   Remind me — a notification the day before, scheduled and checked on
   open; Calendar — an all-day event through the take-78 path)*
6. **"I can't click on the release"** → take 95, landmine 135.
7. **"Not sure where to add alerts"** → take 95: *Alert me when in stock*
   on the sealed sheet beside the price alert; the row's circle labelled.
8. **The MSRP configuration text** stays as the distributor writes it
   ("12 cards / 24 packs / 12 displays" — his call). No change.

Also decided with the paste: the blank-after-Back is **closed** by the
owner ("call it fixed" — A33 item 5); domain access stays open through
the source takes and he is told when to narrow it; after a release with
big changes or open questions, the report is what changed, his testing
steps and numbered questions (NEW-SESSION-PROMPT carries the rule).

**Order:** take 95 (6, 7, 2) → take 96 (4) → take 97 (1, 5) → A32
Southern Hobby.

**Ruled out:** brand logos on the buy links (a trademark in a Play-listed
app is a rejection ground — landmine 29's family; a name says the same);
building anything for the missing pictures (the CDN publishes the photo
when TCGplayer has it, and the tile is the honest state until then);
hiding the condition segment on a *card* (the condition is the
collector's own assertion, PROTOCOL §10, and stays); doing items 1, 4 and
5 inside take 95 (one mechanism per take, the take-69 rule).

## A37 — More unreachable since take 83 · OPENED AND CLOSED take 91

The owner, on take 88: *"more, settings, export, and etc buttons do nothing
… clicking more takes me back to the top of the main page."* He was
reading Home's bottom link — *More · settings, export, sources*.

- **The cause (INFERRED from the code by two readings, PROVEN in smoke
  before the fix — see the take-91 entry):** `<section id="settings">` was
  never in the markup; `paintSettings()` built it on first run; take 83's
  guard in `go()` refuses an id with no section before any paint runs, so
  every tap on More recorded *no screen for 'settings'*, fell back to the
  mode's home and scrolled to the top. Eight takes, 83–90, in Chrome as on
  the Fold. Behind it: Export, Backup, Restore, Sync now, Currency, the
  self-test, About, and the ×5 gesture to Diagnostics — so the paste the
  Priorities block asked for since take 86 could not exist, and the error
  buffer was memory-only besides. Landmines 128 and 129.
- **Fixed take 91:** the section is static markup like every other screen;
  the error buffer persists (`vault.errs`, twenty records) so a record
  survives the restart that follows a blank screen. **PROVEN green on the
  runner's check (render 81, mode chrome):** Home's link opens More and
  five taps on About reach Diagnostics in a real DOM.
- **Ruled out: an Android-only cause** — Chrome bounced identically.
  **Ruled out: a boot exception** — Home paints, the `data-go` delegate
  works. **Ruled out: a plugin chain throwing** — `PLATFORM.plugin`
  null-checks and try-wraps. **Ruled out: WebView syntax** — one `||=`,
  three lookbehinds, all current.
- **Open, the owner's:** whether More belongs in the nav (Hunt has no way
  to it at all) — a design question, not this fix.

## A36 — The set chips in the filter sheet return zero cards · OPENED take 89 · REPRODUCED AND CLOSED take 90

Recorded from the take-35 listing-frames session, never written down until
the pre-move review. Tapping a set chip in Filter & sort — either scope —
leaves nothing in the list.

- **INFERRED from the code (take 89, not yet reproduced):** the chip's
  click handler pushes `c.dataset.fv` — a string, because it came through
  the DOM — onto `f.set`, and `applyFilter` asks `f.set.includes(p.set)`
  with `p.set` an int from the bundle (MEASURED at take 35: 17675). Strict
  equality never matches, so every row fails the set test. The chip's `on`
  state (`f[key].includes(v)` with `v` the int from `bySet`) and the saved
  filters in localStorage carry the same mismatch, so the chip also stops
  showing as selected once the sheet reopens.
- **Ruled out: a data problem.** The bundle's `set` field is an int on every
  printing and the chips are built from those same ints; the comparison is
  the bug, not the catalogue.
- **Ruled out: the other facets.** `rarity`, `color`, `type`, `treat` and
  `cond` are strings on both sides.
- **Next:** reproduce in Chrome (render.mjs: click a set chip, count the
  rows) with the mismatch as the negative control; then compare as strings
  on both sides and migrate the saved filters on load. One function. A
  product change, so a take of its own after 89.
- **PROVEN take 90, in smoke on the shipped app before the fix:** the real
  `#filters` click handler, handed a chip whose `dataset.fv` is the string a
  DOM gives, stored `["3188"]`; `applyFilter` returned 0 of 1; the sheet
  said *0 cards*. Three assertions red on the unfixed build, green after.
- **Fixed take 90:** the handler coerces the set facet at the DOM boundary
  (`+c.dataset.fv`, the file's own pattern for `bnset`, `browseSet`,
  `setpick`); `loadFilter()` normalises a saved filter's set ids to ints
  when it loads and loads blank on a corrupt one; both scopes go through
  it. Eight smoke assertions with two controls; seven in Chrome — tap,
  count, Show's tiles, lit on reopen, un-select — with the string shape
  as the control, **PROVEN green on the runner's check (render 76, mode
  chrome)**. Landmine 126.
- **Ruled out: comparing as strings on both sides** (take 89's sketch): two
  writers with two types, and the toggle-off `indexOf` still wrong for one.

## A35 — The fourth look, after Hunt's first live run · OPENED take 86

Thirteen items from the Fold, filed in the owner's order with their take:
1. splash a second longer *(86)*; 2. starter decks their own section in Hunt
*(87)*; 3. every set open in Sealed, the "4 ▸" gone *(86)*; 4. the Target
panel's wording *(86)*; 5. back to a blank screen after closing a product —
a watchdog restores the screen and records the stack *(86; the record was
unreadable until 91 — A37)*; 6. packs with
no picture (EB03) — retry the photo without the size suffix *(86)*; 7. the
Events list — MEASURED as real (3.9 One Piece events per store per month),
so regrouped by store with the store's phone and exact position from the
same file *(87)*; 8. Releases rows overflowing *(86)*; 9. the Portfolio
caption's face *(86)*; 10. MAX behind a rewarded ad, the FREE badge gone
*(87)*; 11. content hiding behind the bottom bar at the end of every scroll
*(86)*; 12. the "4 requests" pill wrapping *(86)*; 13. more in Diagnostics
*(86)*. **Ruled out: filtering the events file by game** — it is already
One Piece. *Take 87 closed 2, 7 and 10; the whole list is done. Two more
notes from the same session — the Sim selects overflowing, the newest sets
refusing to collapse (fixed by 86's logic) — closed in 87.*

## A34 — Display currency and the opening screen · BUILT take 85

Seven currencies by daily ECB reference rate at build time, every converted
price marked ≈ with the rate's date a tap away, pills on Home and Sealed, a
row in More; an opening screen from first paint, gone once the app has
drawn. **Ruled out: live rates from the phone** (a request the store floor
cannot make, §8) and **converted price history** (a rate per day, not
asked).

## A33 — The second look: uniformity, pictures, the blank back · OPENED take 83

The owner's list from the Fold, in his order, with what each is and its
state:

1. **Portfolio / One Piece** — the label in the body face beside the name in
   the display face at a different size reads as two fonts fighting. Fix:
   the label becomes a small, spaced, dim caption above the name; the name
   keeps the display face at the hero's size. *(take 83)*
2. **The bottom bar** — a different width per mode (four or five items),
   the card colour blending into every palette. Fix: one height, one
   near-black bar with the mode's accent for the active item and a brighter
   border, in all three modes. *(take 83)*
3. **Headings** — Overview/Performance, Decks, Sealed start at slightly
   different heights, so switching modes jumps. Fix: one `.bar` height and
   top padding for every screen. *(take 83)*
4. **Pictures in Hunt** — every sealed product carries a TCGplayer product
   photo (343 of 343); they go beside the title on Sealed rows and on
   Releases (the set's booster box), through the display-only image path of
   take 12 (hot-linked, lazy, never stored, fails to a placeholder). A
   product with no photo gets a drawn tile in the set's colours. *(take 83)*
5. **The blank back** — after the back button the screen went empty until a
   tap. `go()` now refuses an id that matches no screen (it falls back to the
   mode's home and records the id in the error buffer), and `NAV.back()`
   pops until it finds a real screen. The record will name the cause the
   next time. *(take 83; the record could not be read until take 91 and
   did not survive a restart until then — A37; "closed" take 94 at the
   owner's word after takes 91–94 with no record; **reopened take 97 by
   the record itself** — eight `no screen on after hardware back …
   >detail` entries in one hour — and **closed take 98 by the cause**:
   `closeAnyOverlay()` treated the card sheet as an overlay, landmine
   137; the watchdog had been healing it to Home since take 86)*
6. **Overall "non-uniform and basic"** — the owner's own diagnosis is the
   lack of pictures; item 4 is the first step, and the same treatment for
   Collect's rows and Decks follows once Hunt's is seen. *(take 93: a card
   picture beside every row that had none — search hits, Market Movers,
   Home's top list, the set browse and set progress (the set's box), the
   card sheet's other printings, a deck's card rows and add-card results,
   the Cards browse, Trade's results — through one box helper over the
   take-12 path, so every row gets the retry, the silent failure and the
   labelled placeholder; and the four thumbnails that drew unsized are
   sized, landmine 132. The grid, the card sheet, the binder, the checklist
   and the Decks list already had art.)*

- **Ruled out: a fourth typeface.** The mismatch is scale and pairing, not
  a missing font.

## A31 — Importing from other collection apps · OPENED take 61 · NOT A PRIORITY

The owner, take 61: *"we have the ability to import decks, ensure this works
with other platforms such as Collectr — they have an export feature, only
works with their paid version however so I don't have an example to
provide."*

- **What exists.** `parseListLine` takes five deck-list shapes (take 29):
  `4 OP01-016 Nami`, `4xOP01-016`, `OP01-016 x4`, tab-separated, and bare
  numbers. Collection CSV import (take 11) keys on `product_id` and refuses
  an ambiguous number without one (landmine 41).
- **The blocker is evidence, not code.** Collectr's export is behind their
  paid tier and neither of us has a file. **Writing an importer against a
  guessed format is the same error as a guessed price**: it would appear to
  work, mis-key a printing, and put the wrong card in someone's collection.
  So this waits for **one real exported file** — anyone's, with the header
  row intact; a screenshot of the first three lines is enough to start.
- **What can be done without one, and is cheap:** make the CSV importer
  *tolerant by shape rather than by vendor* — accept any header that carries
  a recognisable number column and a quantity column, report per-row what it
  matched and what it skipped, and never silently drop a line. That helps
  every vendor at once and is testable against files we can construct.
- **Ruled out: a vendor-specific parser per app.** Collectr, Dragon Shield,
  TCGplayer and Deckbox all change their format when they feel like it, and
  a parser with no sample to test against is a liability with a version
  number.
- **Priority: after A30's Rate/Share rows** and after the TalkBack pass, per
  the owner ("not a priority"), or immediately if a sample file arrives.

## A30 — The Testers Community report · ASSESSED take 60 · one third of it was true

The owner bought the cheapest plan to reach production and forwarded the
report. Read in full and checked against the code, take 60.

- **"No user onboarding" — FALSE.** A six-card tour fires 250 ms after boot
  on every fresh install (take 25), and *More → How it works* plus *Show the
  guide again* repeat it. **Kept open as the one useful reading:** if the
  tour genuinely did not appear for them, that is a real bug on a device
  this session has never seen. The owner will check when he opens the app.
- **"No Rate Your App" — TRUE.** Worth a row in More that opens
  `market://details?id=com.optcghub.app`. Ruled out: the In-App Review API —
  a plugin, a Play dependency and prompt-timing rules, for the same outcome.
- **"No app sharing" — HALF TRUE.** *Share as a web page* shares the
  collection (take 42); there is no *share the app*. Five lines through the
  Share plugin. Ruled out: referral promotions — incentivised installs are a
  Play policy hazard and need a server.
- **Accessibility — right by accident, and the most valuable line in it.**
  They wrote "consider accessibility"; measuring it found `--dim2` at
  2.64:1, fixed at take 60 (A26). Still owed: a TalkBack pass — 171 buttons,
  two icon-only, one `aria-label`.
- **Ruled out entirely:** forums and community features (a server; PROTOCOL
  §9 and the listing both say no), "performance monitoring" (analytics,
  refused since take 1 and stated in the store listing), tutorial videos
  (hosting plus card-art licensing).
- **What the report is evidence of.** No device list, no Android versions,
  no steps, no screenshots, no logs — and they did not run *More → Self-test
  → Run → Share the report*, which is one tap and answers their entire
  brief. They did not mention scanning (they would need cards), the sim, or
  Export CSV's share sheet: the three things this project has listed as
  unverified on a device for ten takes. "No crashes found" from fifteen
  minutes is the absence of evidence, not evidence of absence. Treat the
  document as a to-do list someone else wrote, not as a test result.
- **Built take 65 — the two rows that were actually missing.** More →
  *Rate this app on Google Play* opens `market://details?id=com.optcghub.app`
  where the Play app exists and the https listing otherwise; *Tell someone
  about the app* hands the listing URL and one plain line to the share sheet,
  falling back to the clipboard where there is no Share plugin. **The link is
  the app id and nothing else** — no referral parameter, no campaign tag, no
  tracking, asserted in smoke — because A30 ruled referral promotions out and
  the app claims no analytics. The app id comes from the manifest so it is
  not a literal in two places. Ruled out again: the In-App Review API.
- **Take 80 — the focus ring.** `:focus-visible` in the accent, keyboard
  only, measured in Chrome. A30 is complete.
- **Built take 66 — the accessibility pass, A30's last item.** Every button
  a screen reader would announce as *nothing* now has a name: the favourites
  star, both filter gears, the torch, the gallery, the shutter, the scan
  shortcut, the Leader slots, and every +/− stepper in Decks, Trade and the
  Play counter (named from their own context — *One more Nami*, *Life up*).
  The ten screen titles announce as `role="heading"` instead of tabs; the two
  real tabs keep `role="tab"` with `aria-selected`; the network badge is a
  `role="status"` live region; decorative glyphs inside labelled controls are
  `aria-hidden`. **Asserted twice:** in smoke against the markup, with a
  control, and **in real Chrome** by walking every visible control and
  checking it has a name. MEASURED: 2 `aria-label`s before, 20 after.
- **Still owed, and it is the owner's:** a real TalkBack session. The
  machine can prove a name exists; only a person can hear whether the order
  and the wording make sense.
- **The decorative-control sweep (take 65).** Every non-button element
  wearing an interactive class was listed: **Home was the only multi-tab bar
  in the app**, and it is fixed (landmine 118). The other ten `tab on` spans
  are single screen titles — decoration by design, but they still announce
  as tabs, which is the TalkBack pass's problem, not a second bug.
- **Agreed order (take 60):** the tour check (the owner's, open) → A26
  colour and contrast (**done this take**) → A29 stock decks → Rate and
  Share rows, one small take together → the TalkBack pass.

## A29 — Stock decks · BUILT take 61 · generated, not reproduced, and never owned

The owner: *"For decks, include the starter decks you can find — they should
all be posted online. Starter decks should be included by default so users
can play/test the sim or other features with that. They shouldn't be added to
the portfolio or anything."*

- **What they are.** Bandai's ST decks are fixed 51-card lists (one Leader,
  fifty) sold as a product; ST01–ST2x exist in the catalogue already as
  printings, so a stock deck is a list of numbers, not new card data. The
  catalogue carries the set and the printings; what is missing is only the
  **contents** of each product, which are published per set.
- **The two rules he gave, which the build must enforce:**
  1. **Available by default** — a fresh install has them, no import step, so
     the sim, the advisor and the browse have something to run against on
     day one. They appear in Decks (marked as stock) and in the sim's deck
     picker.
  2. **Never in the collection.** A stock deck is a reference list, not
     owned cards: it must not touch `OWN`, the portfolio total, the CSV
     export, the binder or the checklist. The guard is the point of the
     item, and it needs a negative control the same take: a smoke assertion
     that loading every stock deck leaves `OWN.total()` and the export byte
     count unchanged.
- **MEASURED take 61, and it settled the design.** (a) The catalogue has ST
  printings but no contents — ST01 alone carries 113 printings against a
  51-card deck. (b) **Bandai's product page publishes rarity counts and a
  misprint correction, not per-card quantities**, and its footer forbids
  reproducing site data. (c) Fan sites have lists: unverified, early sets
  only. So a faithful reproduction is not available honestly, and inventing
  quantities would be PROTOCOL §10's error wearing a deck list.
- **Built instead: `tools/stockdecks.py`.** One deck per ST set, assembled
  from that set's own base printings by a fixed rule — the set's Leader, the
  cheapest printing of each in-colour number, four of each by cost then
  number until fifty — deterministic, validated against `legality()` at
  build time, and **named for what it is**: *Red Monkey.D.Luffy — built from
  ST01*, never *Starter Deck ST-01*. **17 decks from 36 ST sets;** 19 sets
  skipped, named in the build output (no Leader, or too few legal cards).
  They ride in the bundle, appear under *Ready-made decks* on the Decks
  screen with one line saying they are not in your collection, and the sim's
  picker offers them, so a tester with nothing scanned can play at once.
- **The guard the owner asked for, tested:** reading every stock deck leaves
  `OWN` empty and the total at zero, no stock id is ever in the collection,
  none is written to the saved deck list — with a control that shows the
  collection *does* move when a card is genuinely added.
- **Take 62 — covers, drawn not downloaded.** The owner asked for the
  official product preview images. **Declined**, on the rules this project
  has held for sixty takes: landmine 26 (card art is copyrighted and this
  app never hosts it — the pipeline hashes and discards), landmine 30 and
  A16 (the ONE PIECE logo and the BANDAI marks stay out of the app), and
  Bandai's own footer on the page he linked — *all images, text and data on
  this website may not be reproduced without permission*. Published
  officially is not the same as licensed, and the store listing that Play
  approved states the app carries no character art and no publisher marks;
  shipping box shots would make that false in an ad-supported app during a
  closed test. Built instead: `deckCover()` draws each cover from data the
  app already holds — the Leader's colours as the field, the set code in the
  display face, the Leader's name — inline SVG, no file, no request, and
  smoke asserts no `<image>`, no URL and no publisher word appears in it.
  **Not declined: the owner's own build.** `assets/user/` takes his own
  photographs already; a deck-cover slot there is his call about his own
  copy and would ship no defaults. **The only path to the real images** is
  written permission from Bandai, which is a real thing to ask for and not
  something to assume.
- *Take 109 — superseded for the app's own screens, and one claim above
  corrected.* The owner's ruling for the UI series: "if we can use official
  art, card art or anything we can leverage i'm more than okay with it"
  (A42). Each ready-made deck now shows its Leader's picture, hot-linked like
  every other card picture, over the drawn cover as its fallback. The claim
  that the approved listing "states the app carries no character art and no
  publisher marks" was wrong: `docs/PLAY-LISTING.md` has no such sentence,
  and its content-rating note says trading-card artwork is displayed from the
  publisher's own previews. What stands: no mark or art in the icon, the
  splash or the listing (landmines 30, 31), and no box shot on a cover.
- **The slot stays open.** If real quantities arrive — the owner's own
  decks, a licensed list, a paid export — they replace the generated lists
  in the same place and the names lose "built from".
- **Where the lists come from — the original plan, superseded above.** Options in order of preference: (a) the deck lists are
  derivable from the catalogue itself if TCGCSV's product rows for an ST
  product carry contents — check before anything else; (b) Bandai's own
  product pages, one fetch per set, cached into the seed as a data file with
  its source and date recorded in PROVISION; (c) hand-entered from the
  printed decklist insert, which is 24 lists × 51 lines and the last resort.
  Whatever the source, the lists ship **in the seed as data**, validated at
  build time against the catalogue (every number must resolve, every deck
  must pass `legality()`), so a bad list fails the gate rather than the
  player's game.
- **Also worth having if the lists exist:** the sim's *play a stock deck
  against the app* becomes a one-tap thing for a tester with no collection
  and no deck of their own, which is most of them.
- **Ruled out ahead of time: shipping card images or scans with them.**
  Landmine 26 and A16; a stock deck is numbers and names. *(Take 109: still
  nothing shipped with them -- the Leader's picture is the same hot-linked
  one every card row shows.)*
- **Ruled out: seeding them into the collection as "owned".** The owner said
  no, and it would be a lie about what a person owns (PROTOCOL §9).
- *Take 110:* the paragraph under the Ready-made decks heading ("17 legal
  decks built from the starter-deck sets ... never count toward its value")
  went at the owner's word, with two other texts: "remove this text when
  you get the chance - all of it". The heading and every row's badge still
  say ready-made, and a stock deck is still never in the collection
  (smoke's take-61 checks, unchanged).

## A28 — The on-device self-test · BUILT take 45

APEX ORV's self-test told a rider the app worked before he was three miles
in; the owner wants the same here so the phone checks itself instead of him
tapping every feature.

- **Built:** More → Self-test → Run. Fourteen checks, each PASS / FAIL /
  SKIP with one line: catalogue loaded and counted, index one-to-one, price
  history on file, the confidence gate asking on EB03-024, a unique number
  auto-accepting, search, the star template, the four fonts, storage
  round-trip, a Filesystem write/read/delete, the share sheet, the camera,
  **ML Kit reading a code the app draws on a canvas** (the scanner's OCR
  half with no card in hand), notifications, ads on test units, the sync
  URL. A shareable text report for testers. smoke runs it in node with the
  plugin checks SKIPping and a truncated-catalogue control.
- **What it does not cover, said plainly:** the camera *stream*, quad
  detection on a real card, the star detector on a real foil, an ad
  actually showing, a notification actually appearing — anything that needs
  a hand and an eye. SKIP is "this environment cannot answer", never
  "probably fine".
- **Ruled out: a check that PASSes when a plugin is absent.** A missing
  plugin is the most likely field failure; it is SKIP with the reason.
- **Ruled out: running it at boot.** It writes files and calls plugins; a
  tester runs it on purpose and pastes the report.

- **Take 92, from the first real report (take 91, the Fold):** 16 pass, 1
  fail — and the fail was the check's own: *OCR reads a code the app drew*
  compared `m.num`, a field `parseRead` never had, against the code, so ML
  Kit's correct read of `OP01-016` was marked FAIL on every phone since
  take 45 (landmine 131). Fixed to `m.number`; smoke now runs the
  comparison with an injected read and a wrong one. Everything else on the
  Fold PASSED: camera, Filesystem round-trip, share sheet, notifications
  prompt, test ad units, the sim probe, the sync URL.

## A24 — The colour scheme, again · OPENED take 28 · ANSWERED take 106 (D15: the three mode palettes stay)

The owner, take 28: it still reads as Collectr; something One Piece; a transparent
background would be fine at some point; green up, red down stay.

What is true today: Collect is night-sea navy with brass and parchment (take
16); Prep & Play is felt green with vermilion (take 24). The first is a dark
app with a warm accent, which is a family Collectr also lives in, whatever the
exact hexes. "One Piece" without a mark means the world's *materials*, and the
take-16 pass chose one of them (a sea chart). Other honest directions, none
chosen yet:

- **Parchment-light.** A light mode: aged paper `#EFE4C8`, ink `#1E1A14`,
  wax-seal red, brass. Wanted posters and a ship's log are light objects; every
  card-collection app is dark, so light is the distinctive move. Costs
  contrast work on the six game colours and on the SAMPLE art, which is
  designed for dark tiles.
- **Straw and sky.** Warm straw `#E8C36A` accents on a deep sky `#1A3A5C`; the
  Grand Line by day. Nearer to what exists.
- **Ink and paper.** Near-white paper, black ink, the game's six colours doing
  all the work. Manga on the page. The most "One Piece" of the three and the
  most demanding, because the six colours must then carry every accent.
- **A photographed background** — the `home-bg.jpg` / `guide-bg.jpg` slots in
  `assets/user/` (A18) already do this: a photo of his own cards or a playmat
  behind the hero at low opacity. That is the "transparent background" and it
  is his picture away.
- **Ruled out:** the franchise's own palette as a mark — the Straw Hat red and
  straw yellow *specifically arranged* as their crew mark is theirs; red and
  yellow as colours are not.

Mechanically it is a token swap (take 16 made every component read tokens),
so the cost is a design pass and a screenshot review, not a rewrite. Waits on
D15.

## A22 — Two modes: Collect and Prep & Play · SHELL BUILT take 24

The owner: a slider at the top; two modes; the whole colour scheme and feel
changes. *Collect* is the collection. *Prep & Play* holds the deck builder and,
in the future, the simulator.

- **Built take 24:** the slider in the top bar of every screen; `data-mode` on
  the document swaps the palette through the same CSS tokens the take-16
  design pass introduced (so every component follows without a rewrite);
  mode-specific navigation; the mode persists and is restored at boot.
- **Collect** keeps the night-sea chart — navy, brass, parchment. Home, Search,
  Scan, Collection; Trade and Movers from the action row.
- **Prep & Play** is *the table*: felt green `#0F2A1E`, chalk `#F1EFE6`, a
  vermilion accent `#D9583B`. A playmat — which is what the subject *is* in
  that mode. Decks, the builder, Cards (the catalogue browse, keyword filters
  first), **Play** (the Life / DON!! counter, new), and a Sim entry that says
  plainly it is coming.
- **Ruled out: two apps.** The collection and the decks are one data set; a
  deck values itself from the collection. One app, two faces.
- **Ruled out: a colour-only swap.** The nav changes too, or "mode" is a theme
  toggle wearing a bigger word.
- **Ruled out: a third mode for other games.** A19 — later, if ever, and it
  would be a game picker inside Collect, not a mode.
- **Open:** the tour needs a card for the modes; the icon and splash are
  Collect's palette (fine — the icon is the app, not a mode).

## A23 — An OP TCG simulator · SCOPED take 24 · STEP (1) BOARD take 46 · STEP (2) EFFECTS takes 47–51 · STEP (3) OPPONENT take 55 · PHASE

The owner wants an actual simulator inside Prep & Play, in the future. Scoped
honestly:

- **What exists to build on:** RULES.md from the official Comprehensive Rules
  v1.2.0 with section numbers; a deck model; every card's cost, power, counter,
  colour, type, attribute and keyword flags in the bundle; the Life / DON!!
  counter (this take) as the first piece of game-day UI.
- **What a sim IS:** a rules engine (zones §3, phases §6, battle §7, effect
  resolution §8, keyword effects §10) plus a UI for two hands. The *card
  effects* are the hard part: 6,000+ cards of free text. A sim that enforces
  the rules and leaves effects to the players (hot-seat, honour system) is
  weeks; a sim that *executes* effects is a programming language for card text
  and is months per hundred cards.
- **The honest sequence:** (1) hot-seat on one phone, rules enforced, effects
  manual — the counter grows into a full board; (2) a scripted effect language
  for the most-played cards, measured by tournament frequency; (3) an AI
  opponent that plays scripted decks; (4) online play, which needs a server
  and the ledger has said no to servers since take 1 — that is its own
  decision.
- **The reference (take 42): OPTCG Sim, optcgsim.com.** The owner has used
  it. Read off its site: unofficial; Unity; Windows, Mac, Linux, Android and
  iOS; online matchmaking through Unity services (port 7777) with an
  auto-patcher; sideloaded on every platform, never on a store; ~600 MB
  because it ships every card's image; at 1.43a (2 Sep 2026) and its patch
  notes are per-card effect fixes — that is sequence step (2), the scripted
  effect language, kept alive by a volunteer team card by card. What this
  app already shares with it: its deck-list shape (`4xOP01-016`) imports
  and exports here since take 29, so a deck built in OP TCG Hub is playable
  there today.
- **What that measures for us:** the sim's whole value is (2)+(4) — scripted
  effects and online play — and both are the things this app has ruled out
  or deferred (art on the phone, a server). A phone hot-seat board (1) is
  the piece OPTCG Sim does not do well and this app can: two players, one
  Fold, rules enforced, effects by hand, the collector's own scans as the
  cards. That stays the first step.
- **Ruled out for now:** starting before the Play clock is running and A2's
  remaining half is measured. The sim does not help the closed test.
- **Take 51 — searches in every phrasing, keyword grants, cost changes,
  ids.** The search's reveal filter now takes a type, two tokens, a quoted
  type, a named card, a cost line, and *other than* — with each bracketed
  token classified against the catalogue as a name or a type (landmine 113);
  *place the rest at the bottom* and *trash the rest* are the steps that
  follow it. Keywords are read through the engine now — printed, granted
  while a condition holds (*[DON!! x1] This Character gains [Rush]*), or
  granted for the turn — and Rush, Blocker, Double Attack and Banish all
  consult it. Cost changes are timed modifiers that every cost filter reads
  (*−N cost, then K.O. up to N* is the classic two-card play and it works
  across two cards). Every Character in play has an instance id so a
  modifier follows its card when another leaves. Also: a cost after a
  condition, N-sentence chains, *add a DON!! rested*, mill, Life moves, *set
  this Character as active*, permanent *+N power*. **MEASURED: 2,161 of
  7,553 lines (28.6%); 1,130 cards fully, 772 partly.** Thirty-eight parser
  controls; a smoke assertion that every action the parser emits is one the
  engine handles.
- **Take 55 — step (3), the opponent, honest about being a script.**
  *Opponent: the app* on the setup screen, described there as *legal and
  not clever; it never sees your hand*. `BOT` is a policy on the same
  engine calls a player uses: play the dearest affordable Character while
  there is room, give spare DON!! to the Leader, attack with everything
  that may — the Leader always at the Leader so games end, a Character at a
  rested Character it can beat, else the Leader — block when a Character
  would die and a Blocker can take it, counter when the Leader would take
  damage at two Life or less, apply an offered effect to its first legal
  target (declining a trash cost that would empty its hand). One action per
  step so the human sees each move; no curtain; the human's screen is
  always the one shown; the app's block and counter are shown before the
  human resolves. **MEASURED, twenty bot-versus-bot games on the showcase
  deck: 10–19 turns, all ending by damage, 8–12 by seat, attacks 329–339 by
  seat — symmetric.** In smoke, two whole games run under a running
  invariant: every card in exactly one zone (fifty-one per player), DON!!
  summing to ten, never six Characters (class 4 as a property, not a
  fixture).
- **Ruled out: lookahead, bluffing, reading the human's hand or deck.** A
  stronger opponent is a later step and would be a different promise; this
  one is for testing decks and finding effects that misfire, alone.
- **Take 53 — feel, for testers.** The board's card lines carry their
  colour dot on the name, DON!! is a row of pips (active bright, rested
  dim, given in brass, the DON!! deck hollow), the attacker's row is marked
  while a target is chosen, and a refusal reason sits on its own line. The
  deck screen says how many of a deck's cards the sim runs itself, partly,
  or by hand — naming the by-hand ones — and **Play this deck in Sim** takes
  it to the board as Player 1. Home shows **New in this update** once per
  take, lifted from `ci/RELEASE.md` at build time (the build refuses a take
  whose release note is missing — the note is written first, PROTOCOL §6).
- **Take 52 — the tail, measured, and two things for testers.** After
  take 51 the unparsed shapes are a long tail: the largest with an
  identifiable mechanism are *Choose one:* (37, a modal), *look at N and
  place them at the top or bottom in any order* (27, an ordering choice),
  *cannot be K.O.'d …* (protection flags, ~25 across eight phrasings), and
  the opponent's hidden choices (*your opponent trashes/returns/chooses*,
  ~25 across eight phrasings; on one phone that is the curtain mid-effect).
  None reaches forty lines; each is its own mechanism with its own tests.
  Template-chasing pauses here at 28.6% and resumes when a game has been
  played — the next measurement is a person's. Built instead: **Share the
  game log** on the board, so "an effect fired when it shouldn't" arrives
  with the record; and a **self-test check** that the effects bundle loaded
  and one plain [On Play] draw offers and applies on the phone.
- **The inferred sign (landmine 113):** the 48 lines that read *Give … 2000
  power* are treated as −2000. The only inference in the parser; marked in
  the data.
- **Take 50 — two sentences, "that card", durations.** A line of two
  sentences is its two templates in order when both halves are known (62
  today; every new template adds to both halves); *Then, if …* puts a
  condition on the second step, read when that step runs; *that card gains
  an additional +N* lands on the card the first step chose with no new
  choice. Durations are honest now: a modifier carries its expiry — *during
  this turn/battle* ends at the end of the turn on **both** sides (it used
  to survive on the opponent's card until their refresh), *until the start
  of your next turn* survives the opponent's turn and ends at the source's
  refresh. Also *If you have N or less Life cards*, *N or more cards in your
  trash*, and *Trash up to N* with a *Trash none* choice. **MEASURED: 1,774
  of 7,553 lines (23.5%); 824 cards fully, 772 partly.** Twenty-eight parser
  controls, including a three-sentence line that must stay manual.
- **Take 49 — costs and Events.** A cost before the colon is the first
  step of the effect — *You may trash N cards from your hand:* (346 lines),
  *DON!! −N (…):* (192), *You may rest this Character:* (140) — and an
  effect whose cost cannot be paid is not offered at all: an empty hand, too
  few DON!! on the field, an already-rested source. Declining the cost step
  declines the effect. Events have their two timings: a [Main] Event is
  played from hand in Main for its cost and its effect is offered; a
  [Counter] Event the defender can afford is listed in the counter step,
  paid from the defender's own active DON!!, and its +power lands on the
  defending card. Also *If your Leader is [X]*, the DON!!-count comparison,
  and the typed *Play up to 1 [X] type Character card … from your hand*
  (free, five-limit). **MEASURED: 1,627 of 7,553 lines (21.5%); 712 cards
  fully, 788 partly.** Twenty-four parser controls, seventeen new smoke
  assertions including the three declines.
- **Take 48 — step (2) grown by whole templates, in count order.** Eleven
  more: *Draw N and trash N* (the first chained effect — steps run in
  order, the second waiting for its hand target), *Play this card* and
  *Activate this card's [On Play] effect* (follow-on offers; a [Trigger]
  card that is activated is trashed afterwards, §10-2), K.O. by power and
  by rested-with-cost, return or bottom *any* Character under a cost line,
  add a DON!! from the DON!! deck, −N power to an opponent's Character, the
  Leader +N during this battle, and the search (*look at N, reveal one of
  the [X] type, the rest to the bottom*). And **continuous effects**: a
  line with a condition and no trigger — *[DON!! x1] This Character gains
  +1000 power* — is evaluated inside `power()` every time it is read, so it
  is there while the DON!! is and gone when it goes. **MEASURED: 1,143 of
  7,553 lines (15.1%); 498 cards fully, 607 partly.** The board now
  surfaces every timing the parser knows: [On Block] at the block, [End of
  Your Turn] before the turn ends, [Trigger] and [On K.O.] on the
  defender's result screen with a *Done — hand back* button.
- **Ruled out, still: cost changes** (*−N cost during this turn*, 40 lines).
  A cost modifier changes every other effect's filter for the turn; it is
  its own mechanism with its own tests, not a template.
- **Ruled out: "This Character gains +N power" with no condition.** That is
  base power, the catalogue's number; a template for it would double count.
- **Built take 47 — step (2)'s foundation, to take 45's requirement.**
  `tools/effects.py` parses every printing's text at build time into effect
  lines and claims a line only when every bracket tag is one the engine can
  fire or evaluate (On Play, When Attacking, Activate: Main, On K.O.,
  Trigger, On Block, End of Your Turn; DON!! xN, Once Per Turn, Your /
  Opponent's Turn; "if your opponent has N or less Life", "if you have N or
  more DON!!", "if your Leader has the [X] type") **and** the whole sentence
  matches one of twelve templates (draw N; this card / up to one of yours
  +N power this turn; K.O. / rest / return an opponent's Character under a
  cost or power line; give up to N rested DON!!; set N DON!! active; a Life
  card to hand; trash one from hand). **MEASURED: 462 of 7,553 effect lines
  (6.1%); 201 cards fully scripted, 261 partly; the rest are the text and
  the tray.** The engine's `offers()` evaluates the conditions and computes
  the legal targets itself; `apply()` runs under the same invariants as
  every other action; the board shows the offer (text, targets, Apply,
  Skip) at the trigger's timing — [When Attacking] before the defender's
  window, [Activate: Main] as a button, Once Per Turn tracked per card.
  Smoke tests the five classes on real cards: scope (only the cost-legal
  target), never-always-on (no DON!!, no offer), duration (gone at refresh),
  limits (once per turn refused, offered next turn), data (all of it from
  the catalogue; nothing typed). `effects.py --selftest` runs in the gate:
  six sentences that must parse, six that must be refused.
- **Ruled out: widening a template to catch more cards.** "Draw 1 card.
  Then, trash 1 card from your hand." is refused on purpose: the second
  sentence is a second action and the template set does not chain yet. A
  looser regex would script the first half and silently drop the second —
  failure class 3 built in. Coverage grows by adding whole templates with
  their tests, never by loosening one.
- **Ruled out: [Main] and [Counter] Events.** They are played from hand at
  a timing the board does not yet model as a trigger; they stay manual until
  the Event flow exists.
- **Built take 46 — step (1), the hot-seat board.** Prep & Play → Sim. Two
  legal decks from Decks, a first player, Deal. The engine (`SIM`) owns what
  RULES.md §3 lists and cites the section on every refusal: §5-2 setup and
  Life from the deck, §5-2-3 one mulligan each, §6-1 the phases with the
  first player's turn-one exceptions, §2-7 cost paid by resting DON!!, the
  five-Character limit, §6-5-5 giving DON!! on your own turn, §6-5-6-1 no
  battle on a first turn, §10-1 Rush, §7-1 targets (the Leader or a rested
  Character), the block step with one active [Blocker], the counter step
  with Counter cards from hand, §7-1-4 damage with ties to the attacker,
  Double Attack, Banish, K.O., and both defeats. The curtain passes the
  phone at every hand-over, including into the defender's block/counter
  window. **Effects by hand:** a ⋯ tray on every card (+/−1000 this turn,
  rest, K.O., to hand) and a row under the hand (draw, +DON!!, Life up or
  down); every manual act is logged as "(effect)". No art: a card is its
  catalogue line. Twenty-two smoke assertions against §3 on a real deck, and
  Chrome draws the dealt board (three panels, five Play buttons).
- **Not in step (1), on purpose:** Stage effects, [Trigger] resolution (the
  Life card is shown and named as having one), [Counter] Events (played by
  hand), Unblockable, effect durations other than "this turn", the DON!!
  attached to Characters counting toward "DON!! x" conditions. Each is
  either card text or a rule the honour system covers.
- **Built take 44 — the first primitive of step (1):** *Pass the phone* on
  the Play counter. One panel at a time, upright, the opponent's Life and
  DON!! on a line, and *End turn* drops a curtain naming who takes the
  phone; the board repaints when they tap. In a full board that curtain is
  what keeps a hand a hand. Remembered per phone; the table layout is the
  default and unchanged.
- **The owner's two transports for step (4), measured on paper (take 44):**
  1. **Hot-seat** — one phone, the curtain. Zero network, zero server, fits
     PROTOCOL §9 as it stands. This is the path until (2) exists.
  2. **Two phones by QR, each on their own screen, the deck arriving when
     the game loads.** The honest way to do it without a server is WebRTC
     with the signalling carried by the QR itself: phone A shows its offer
     as a QR, phone B scans it and shows its answer, A scans that, and the
     data channel is up — on the same wifi or one phone's hotspot, no
     internet, no STUN, no server. INFERRED: an SDP offer is 1–3 KB and a
     QR holds ~2.9 KB, so the offer must be reduced to its ICE candidates
     and fingerprint (~200 bytes, a known technique) or split over two
     codes; Android's WebView carries WebRTC; the ML Kit barcode plugin is
     the scanning half 8.9 already needs. The deck is 14 lines of text and
     rides in the first message. Across the internet it would need a STUN
     server and a signalling relay — that is the server the ledger has said
     no to since take 1, and it would be its own decision (D18).
- **Requirement for step (2), from the owner at take 45: cards must follow
  their rules, and the reference shows how they fail.** OPTCG Sim 1.43a's
  patch notes are thirteen fixes; twelve are a card doing what its text does
  not say. Sorted, they are five failure classes, and each names a guard
  this app would build *before* the first scripted effect:
  1. **Card data typed by hand** — *Gunko is black instead of purple*,
     *Franky leader gives real counter values*. Guard: colour, cost, power,
     counter, keywords and type come from the catalogue bundle, never from
     the effect script; the gate already refuses a bundle that drifts.
  2. **A keyword or effect that is always on** — *Curly Dadan always has
     Double Attack*, *Law is buffing for the turn*. Guard: every effect has
     a trigger and a duration from a closed list (§8, §10), and a test that
     the effect is *absent* when its trigger did not fire.
  3. **Scope wider than the text** — *Robin can save characters from combat
     KOs*, *Heat and Wire can rest a character below total life, not the
     opponent's*, *Luffy is preventing cost-5 stages*. Guard: targets are
     declared as a filter over zone + type + owner + cost, and the test
     asserts the filter on both sides of the boundary (landmine 55's rule).
  4. **A limit or a count unchecked** — *Thanks for the Treat is not
     checking DON!! counts*, *Ace can allow opponents beyond 5 characters*.
     Guard: the rules engine owns the invariants (five characters, DON!!
     totals, hand size, life) and rejects an effect that would break one,
     regardless of the script.
  5. **Timing and state** — *Franky can break the combat state during
     Counter events*, *Issho's On Attack isn't proccing Kuzan's leader
     ability*, *Linlin should not change characters already under a base-
     power change*. Guard: a phase/state machine from §6–§7 in which an
     effect can only run in the windows its trigger names, and stacked
     modifiers are ordered by the rules' own layering, not by script order.
  The thirteenth (*a setting not saving*) is landmine 83's family.
  Consequence: **an effect is data, not code** — trigger, condition, target
  filter, action, duration — validated against the catalogue and the
  engine's invariants at build time, and every scripted card ships with a
  test of what it does *and* what it does not do. The volunteer sim fixes
  these one at a time after players find them; this app's whole method is to
  refuse them before they ship. That is the difference the ledger buys.
- **Ruled out: competing with OPTCG Sim on scripted effects or online play.**
  A volunteer team is years into it; the honest companion is deck
  compatibility, which exists.
- **Ruled out: card art in the sim.** It is the collector's own scans or the
  reference art under landmine 28's rules; nothing new.

## A18 — First-run guide and user pictures · BUILT take 19 · REDONE take 116

The owner's ask: a tutorial like APEX's, a splash-style tour of every capability,
a One Piece background, and placeholders for whatever I cannot supply.

- **Built:** `#tour` — five cards (Scan, Value, Decks, Trade, Yours-offline),
  every line a fact the app backs up today; swipe or Next; Skip; a versioned
  key (`optcghub.guide.v1`) so a rewrite shows again exactly when it is worth
  reading (APEX A129/A147); reachable from More → How it works.
- **Built:** `assets/user/` — named picture slots with sizes, copied into the
  bundle if present and listed in the manifest; the app uses each if it exists
  and the brass compass otherwise. `guide-bg.jpg`, `guide-1..5.jpg`,
  `home-bg.jpg`, `splash-bg.jpg`, `empty-collection.png`.
- **Ruled out: shipping any One Piece image myself.** Landmines 26 and 30,
  unchanged. `assets/user/README.md` states the line once, plainly, and then
  it is the owner's folder: his own photographs of his own cards are the safest
  and the most premium thing the app can show, because they are real.
- **Ruled out: an un-versioned "seen" flag.** APEX A147: a v1 flag set on the
  phone at an early take would suppress every rewrite forever.
- **Found while building:** the tour's id collided with the scanner's
  viewfinder (landmine 90); a JS escape landed in HTML text; the README still
  said "no counter, no cap" after the stale-copy grep missed it (landmine 88).
- **Redone, take 116 (the UI/UX session, the owner's picks from drawn
  drafts):** the opening screen and the guide share the store listing's
  frame -- the Prussian band with the word-mark, the buff sky, the app's own
  card on a calm sea, the icon's grain under everything -- and the native
  launch image is the same scene, painted by `ci/icon.py`. Four pages, one
  per mode and one for what stays on the phone, each with a real printing
  looked up when the guide opens; Next pages the strip (it never did,
  landmine 202); Back closes it unseen (it could not see it, landmine 201);
  a dialog for screen readers; the key is `optcghub.guide.v3`. The
  `guide-bg`, `guide-1..5` and `splash-bg` slots are retired: the guide and
  the launch image are the scene, and `check()` refuses any other picture.
- **Ruled out (take 116):** the mode's palette under each page; a `<dialog>`
  element (no `showModal` in the stub, a second Back path); `role="tab"`
  dots; coach marks over the live screens; a guided first scan (a camera on
  first run).
- **Open:** the launch image is a bitmap the window stretches (Capacitor's
  template); a layer-list drawable placed by gravity would end the stretch.
  Its own small take.

## A17 — Ads and revenue · SDK WIRED take 22 against Google test units · REAL APP ID take 41 · unit IDs pending (D11)

The owner's ask, take 13: ad revenue, probably Google's. Starting ideas — 20 scans
free then 20 per rewarded ad, repeating; 1 deck build free then 1 per ad,
repeating. His app, his decision. This entry keeps the ledger honest about what
the decision touches, proposes a mechanism that does not recreate the thing the
app was built to replace, and asks what only he can answer.

### What it touches

- **The founding premise.** Take 1's README: *"the app it replaces stops at 25
  scans"*; product principle 5: *"No wall, ever."* A 20-scan gate with a
  rewarded ad is the reference app's mechanism with an ad where the
  subscription was. That is not a reason not to do it — it is a reason to put
  the wall where it does not destroy a scanning session (below).
- **Landmine 31.** *"Do not monetise; a free non-commercial app is a materially
  different posture."* True, and now overtaken. The posture becomes the
  reference app's own: a commercial app displaying publisher SAMPLE art and
  TCGplayer data with attribution. Collectr operates that way, publicly, at
  scale, so it is a known-survivable posture rather than a novel one. The
  residual uplift is real and it is the name's allusion (A8) plus hot-linked
  art (landmine 28) in a paid context; neither is new to the market.
- **Landmine 39.** The near-empty Data Safety form is gone. AdMob collects the
  advertising ID and device identifiers; the form declares it, the privacy
  policy names AdMob, and APEX's take-166 rejection (advertising-ID
  declaration made verifiable) is the field manual.
- **PROTOCOL §8, and this is the design constraint that matters.** A rewarded
  ad needs signal. A card-shop basement or a convention hall has none. **If the
  gate is on the camera, a collector with twenty credits and no signal hits a
  wall mid-binder and the app is worse than the one it replaced.**
- **TCGCSV terms — CHECKED take 13:** usage guidelines cover rate limits and
  User-Agent only, no commercial prohibition, and the service itself runs an
  affiliate link and a Patreon. Not a blocker. The underlying data is
  TCGplayer's; that exposure is the same one the reference app carries.

### Proposed mechanism — the wall is at COMMIT, not at the camera

1. **Identifying a card is free and unlimited, always.** It is the collector's
   camera and the collector's phone, and it runs offline. Nothing about
   scanning changes.
2. **Committing a card to the collection spends one credit.** The batch review
   screen (landmine 19 — commit happens at the end, after review) is where the
   count is settled. With credits, the batch commits. Without, the batch waits
   in a **pending tray** — nothing scanned is ever lost.
3. **Credits are earned online, spent anywhere.** A rewarded ad banks +20 (or
   whatever number the owner sets). The scanner shows the balance and, when it is
   low *and* there is signal, offers to top up **before** the binder session.
   Offline with zero credits: keep scanning; the tray fills; it commits when
   the next ad is watched. The convention-hall session survives intact.
4. **Deck builds: the same shape.** Building and editing is free; *saving* a
   second deck spends a credit; the first save is free.
5. **Nothing already committed is ever locked.** Credits gate new work, never
   access to the collector's own data — export, backup and browsing stay
   unconditional (PROTOCOL §9).

Starting numbers, all the owner's to change: 20 free credits on install, +20 per
ad, 1 free deck, +1 per ad. These live in `config.py` as constants, not in code.

### Mechanism, technically

- `@capacitor-community/admob` **8.1.0**, `latest` tag, aligns with the
  Capacitor 8 major (PROVEN present on npm, take 13). Its rewarded API is read
  from `definitions.d.ts` at the integration take, not from memory — take 10's
  ML Kit lesson (landmine 73).
- AdMob app ID and ad-unit IDs are the owner's, created in the AdMob console; they
  go in `capacitor.config.json` / the manifest, not in secrets (they are
  public by nature). Test unit IDs in every non-release build so nobody
  accrues invalid traffic on a real unit during development.
- Credits persist in `user.db` alongside the collection and travel in the
  backup, so a restore does not zero them.
- The whole thing sits behind one flag, `ADS_ENABLED`, off in the browser
  build and in the Phase 0 rig, and off until the owner has AdMob IDs.

### Ruled out

- **Gating the camera or the identification.** Breaks §8 and the founding
  premise together. The wall goes at commit.
- **Locking export, backup or the collection behind credits.** PROTOCOL §9.
- **Interstitials mid-scan.** An ad between two cards in a batch is a scan
  loop slower than typing (landmine 17).
- **A subscription.** Not asked for, and it is the exact thing the app was
  built to replace.
- **Banner ads on the scan screen.** The camera surface is the product.
- **Real ad units in debug builds.** Invalid-traffic bans are permanent.

### Built take 22

- `@capacitor-community/admob` 8.1.0 in the build; the API read from its
  definitions. `initialize` once at boot, a rewarded unit preloaded on the scan
  screen so a tap shows an ad rather than a spinner, `showRewardVideoAd()` on
  the earn button and on a refused deck save, and **the credit lands in the
  `onRewardedVideoAdReward` listener only** (landmine 95).
- **Google's published test units** in `config.py`; `ADMOB_IS_TEST` derives
  from them; `initializeForTesting` follows it. Real IDs are a three-line
  config change and nothing else moves.
- `ADS_ENABLED` is **derived**: unit IDs in the manifest AND a Capacitor
  runtime. A browser and the rig never gate; the APK gates saves at the D10
  numbers, with 20 free on install.
- The manifest `meta-data` and `strings.xml` are generated by `ci/apk.sh`
  every build, asserted after.
- MEASURED on the first build: the GMA SDK adds `AD_ID` to the merged
  manifest (landmine 94) and 4 MB to the APK.
- RUNBOOK-play §F: the Play consequences, in order.

### Questions for the owner (DECISIONS-OPEN D10–D13)

- **The numbers.** 20 / +20 / 1 / +1 are his starting ideas; confirm or change.
- **AdMob account.** Does one exist? It is a separate sign-up from Play, and
  the app must be published (at least in testing) to be linked.
- **Banners anywhere?** Proposed: none on Scan; optionally one on the Search
  screen. His call.
- **Ad-free purchase?** A one-time IAP that grants unlimited credits is the
  usual companion to rewarded ads and needs the Billing library. Not
  proposed for v1 unless he wants it.

## A16 — Theming, icon, splash · DESIGNED take 16, ICONOGRAPHY take 17 · ICON REVERTED take 33 as asked · one request declined · ICON SHIPPED take 113 (the owner's pick)

*Take 113: the owner's icon (D7) ships. It is the pick from the graphic
design session: v4, bottom waves, the printed card-back emblem on the
purple-bordered card, and ink ドン!!. The owner uploaded it to Play, where it
is live and approved, and asked for it in the app. `assets/icon*.svg` holds
four files, and `ci/icon.py` renders them with its controls in the gate.*
- **One standard icon, no themed variant:** on the sheet of what the build
  writes, the owner said: "I'm confused by the dark and light themes, nor
  do I really like them. I just want the one standard icon."
  - The hand-off's monochrome layer is out, and `ci/icon.py` refuses one
    (landmine 171).
  - The reminders' status-bar glyph stays: Android draws that icon in one
    colour.
- **The owner's ruling, recorded:** a reversal of landmines 30 and 31 and of
  the marks line below, for the icon's emblem only. The name, the listing
  text, characters and wordmarks are unchanged.
- **The fallback:** the own-rose swap in `design/d7-icons/SHIP.md`.
- **Ruled out:** the compass placeholder and the jolly roger as the icon,
  both kept in `assets/`; our own rose while the owner's pick stands, since
  it is the ready swap.

The owner wants One Piece theming, pictures and decals; placeholders where unsure;
he will send more screenshots.

- **Built take 12, not a question:** card art on tiles, search rows, the picker
  and the detail hero — hot-linked from the TCGplayer CDN, DISPLAY-ONLY, exactly
  as designed at take 1 (landmine 28). The tiles now read like the reference
  app's, SAMPLE watermark and all. The game's six colours (§2-3-3) as a colour
  bar on every tile and as named dots on the detail.
- **Shipped as an original placeholder:** `assets/icon-placeholder.svg` — a
  compass rose behind a card silhouette, the six-colour hexagon every card
  carries. No character, no logo, no franchise mark, no crew's jolly roger.
- **The line, stated so it can be argued with (landmines 26, 30):** the game's
  six colours, a compass, a log pose, rope, parchment, treasure, a *generic*
  jolly roger, nautical anything — centuries older than the franchise, fine.
  The Straw Hats' specific skull, any character likeness, the Going Merry, the
  franchise wordmark, the Toei/Bandai/Shueisha marks — not in the icon, not in
  the splash, not in the store listing. *(Take 113: the one exception is the
  icon card's printed card-back emblem, the owner's pick, at the owner's
  word; `design/d7-icons/SHIP.md`.)*
- **Ruled out: bundling any card art or character image** for theming. Landmine
  26, unchanged. *(Take 109: showing hot-linked card art inside the app is the
  owner's call and he made it -- A42, "Hot-Linked Card Art, Bold". The icon,
  the splash and the store listing stay clear of characters and marks, as
  this item says.)*
- **Ruled out: a "Straw Hat" motif in the icon.** It is the one nautical symbol
  that IS the franchise.
- **Take 17 — DECLINED, and written down so it is not quietly reversed:** the owner
  asked for a Zoro image as the app icon. The old placeholder is kept as
  `assets/icon-placeholder.old.svg` as asked. The image is not used, for four
  reasons that were true at take 1 and are more true now:
  1. It is a character likeness — Oda's, Shueisha's, Toei's — and landmine 26
     says no character art ships, anywhere.
  2. The icon is the single most exposed surface on a Play listing: the first
     thing a reviewer sees, the thing a takedown complaint screenshots.
  3. A17 makes this a commercial app. Landmine 31's "free non-commercial is a
     different posture" no longer applies.
  4. The reference app, a funded company with lawyers, does not put a
     character in its icon. That is not an accident.
  What ships instead: `assets/icon.svg` — a plain jolly roger on a compass on a
  card, in the take-16 palette. The skull wears nothing and the blades are
  generic cutlasses. Nobody owns the pirate flag.
- **Take 63 — the skull removed, the Decks tab made a card back.** The owner
  on `g-roger`: *"it looks awful."* It was drawn at take 17 and used in one
  place, the empty-collection state, which now shows the scan-card decal it
  is telling you to tap; the symbol is deleted from the sprite and smoke
  refuses its return. The Decks tab was a card with a crown and is now
  `g-cardback` — the inset border and centre diamond a card back reads as,
  **drawn here**: the real card back is the publisher's design and is no
  more shippable than the box art (landmines 26, 30). The shape was the ask;
  the artwork is theirs.
- **Take 33 — reverted, as asked.** the owner asked for the old icon back for
  now; `assets/icon.svg` is the take-16 compass placeholder again and the
  jolly roger is kept as `assets/icon-jollyroger.svg`. D7 stays open.
- **Built take 17, the answer to "not a single One Piece decal":**
  `assets/glyphs.svg`, nineteen original symbols in two families. *The game's
  grammar* — Leader / Character / Event / Stage (§2-2), the six-colour hexagon
  (§2-3-2), DON!! (§3-3), Life (§2-9), Counter (§2-10), Trigger (§2-11),
  Blocker, Rush, the rarity plate. *Nautical* — compass, wheel, anchor,
  spyglass, rope, a plain skull-and-cutlasses, and the scan-card decal. Inlined
  at build time (PROTOCOL §8), used through one helper, and wired into the nav,
  the action row, the scanner's idle viewfinder, tile rarity lines, the detail
  hero's stats, the deck rows' keyword tags, the Leader line and every empty
  state.
- **Ruled out: the game's own icons** — the DON!! card's art, the rarity
  plate's typography, the attribute symbols as printed. Those are Bandai's
  artwork. The *concept* of each is the game's grammar and is drawn fresh.
- **Questions for the owner** (DECISIONS-OPEN D7–D9): the motif direction; whether
  the app should render in the six colours or stay teal-on-black with colour
  accents; whether the splash is the icon large or something else.

## A14 — Trimming the ML Kit language models · PROVEN take 104 on the Fold

*Take 105, later the same hour — the contrast:* the Play install of take
101 (pre-R8) on the same phone passed `Notifications permission —
display: prompt`; the shrink's regression (landmine 141) is MEASURED,
not inferred.

*Take 105 addendum — PROVEN:* the owner's take-104 install on the Fold,
self-test `PASS OCR reads a code the app drew (ML Kit) — read "OP01-016"`,
camera 1, every plugin present, 16 of 17. **The one FAIL is the size
take's own regression** — `Notifications permission` resolved undefined
because R8 dropped the plugin's `@Permission` annotation (landmine 141);
take 105 keeps the Capacitor layer whole, reads the mapping back and
treats an empty answer as `unknown`. The proof of that fix is the same
line on take 105.

*Take 103, merged — MEASURED (run 52, and the released files on the
session VM, identical):* APK 34.9 → **26.4 MB** file, 58.0 → **36.9 MB**
installed; AAB 23.8 → **19.6 MB**; dex 23.0 → 6.4 MB raw (one file);
the OCR models 5.5 → 1.5 MB raw; the engine unchanged. The readback on
the real APK: non-Latin entries 0, Latin 4. R8 needed no rule beyond
the four `-dontwarn` lines. PROVEN waits on the Fold's self-test (the
ML Kit line) on take 103.

*Take 103 addendum — BUILT:* the four non-Latin `com.google.mlkit:
text-recognition-*` modules excluded from every configuration in
`ci/apk.sh` (their AARs carry the models, so the assets leave with them:
3.81 MB raw / 2.39 packed, measured from take 100's files), `-dontwarn`
for the four option packages the plugin's switch still names, and R8 on
the release build (`minifyEnabled`, `shrinkResources`, the optimize
defaults) against 23.0 MB of raw dex. The build refuses an APK that still
carries a non-Latin model or lacks the Latin one. Proven on the runner at
the merge only (this VM has no Android SDK); PROVEN on the Fold when the
self-test's ML Kit line passes on take 103. **Ruled out:** the asset-level
knobs (`aaptOptions`, `packagingOptions` scope the app's own assets and
Java resources, not a library's); patching the plugin under
`node_modules`.

*Take 101 addendum — MEASURED from Release take-100's files (`tools/shipped.py`):*
the OCR language models are **5.5 MB raw / 3.7 MB packed** in the APK, of
which the non-Latin recognisers (Hani 0.89, Jpan 0.89, Kore 0.80, Deva
0.44, Beng 0.44 MB) are ~3.5 MB raw — the "~10 MB" above was an estimate.
The native pipeline is 11.1 MB (arm64) + 6.8 MB (armeabi-v7a), stored
uncompressed in the APK, 4.4 + 3.5 MB in the bundle. Dex is 23.0 MB raw /
8.7 packed with R8 off. **The owner picked R8 and the non-Latin models for
take 102**; the 32-bit ABI in the sideload APK (6.8 MB) and a gzipped
catalogue (~4.4 MB installed) stay listed, unpicked. The proof for 102 is
the Fold's self-test (the ML Kit read included) and a manual pass — the
harness cannot see a `NoClassDefFoundError` on a phone.

- **MEASURED take 5:** `@capacitor-mlkit/text-recognition` pulls Latin, Chinese,
  Devanagari, Japanese and Korean recognisers and ships each one's LSTM model
  (~0.9 MB) plus its share of a 11 MB native pipeline per ABI.
- **None of it is used.** One Piece codes are Latin and the recogniser is
  charset-constrained to `[A-Z0-9-]` (landmine 11).
- **Proposed:** `configurations.all { exclude group: 'com.google.mlkit', module:
  'text-recognition-chinese' }` and the same for the other three.
- **Ruled out: doing it blind.** The plugin's Java may reference those classes
  and fail at runtime with `NoClassDefFoundError`, which a compile cannot catch
  and this container cannot test. It needs a device, so it waits for the same
  session that closes A2.
- **Already banked without it:** ABI filtering took the sideload APK from 51 MB
  to 29 MB (landmine 58).

## A13 — Deck builder · BUILT take 13 against RULES.md

Wanted eventually, explicitly not a priority. Checked now because discovering at
Phase 7 that a required field was never ingested costs a re-ingest, and checking
cost minutes.

- **MEASURED, the catalogue can feed one:** card_type 100%, color 99.8%,
  subtypes 99.5%, cost 94.3%, attribute 85.6%, power 84.2%, counter 60.9%.
  366 Leader printings across 146 distinct leader numbers, with dual-colour
  leaders present and correctly delimited (`Green;Red`).
- **FOUND MISSING and fixed this take:** `Life`. TCGCSV publishes it, the take-2
  ED map dropped it, and a leader's life total is the one field a deck builder
  cannot work without. Now ingested — 357 printings carry it.
- **Ruled out: deferring the feasibility check to Phase 7.** This is what the
  check was for.
- **BUILT take 13.** Legality per §5-1 with section-cited problems; the
  advisor; one-row-per-number adding that prefers owned printings; export in
  the community list shape. MEASURED while building: all 165 dual-colour cards
  are Leaders — §2-3-5 works through the Leader.
- **Two guards on R6** in smoke: sabotaging copies to key on `productId` fails
  both. This is the "someone will fix it into landmine 1" protection.
- **Open, for whenever it happens:** deck legality is a colour rule derived from
  the Leader plus a 4-copy limit keyed on *card number*, not printing — a deck
  cares that you have four Namis, not which printings. That is the one place in
  this codebase where keying on the number is correct rather than a bug, and it
  should carry a comment saying so or someone will "fix" it into landmine 1.

## A9 — TCGCSV as a single point of failure · MITIGATED, ALERTING BUILT take 20

*Take 58: A9's issue was open for five nights and nobody looked, so the
failure mode it guards against — a silent stale catalogue — happened anyway.
The structural fix is upstream of the issue: `ci/bundle.sh` now commits the
day's prices **before** anything that can fail (landmine 115), so a red
night costs the build and not the history. The issue remains the notice; it
is no longer the only thing standing between a bad night and lost data.*

- **The risk:** one maintainer, Patreon-funded, free. If it stops, the app's
  prices freeze.
- **Mitigated by design, not by a backup source:** the app already works offline
  against its last catalogue, and every price carries its date. A stale price
  that says it is stale is a degraded product, not a broken one.
- **Ruled out: mirroring their whole archive into this repo.** Redistribution of
  a redistribution, and it solves a problem that has not happened.
- **Decision:** the fetcher is one adapter file behind an interface, so a swap is
  a single-file change. Health-probe before every build; fail loudly (landmine 5),
  never ship a half-empty catalogue.
- **Built take 20:** a Home banner at three days of staleness naming the
  catalogue date, and a CI step that opens one labelled issue on a failed
  night and comments on each further failure (landmine 92). A lost night is
  now visible in two places; the app still runs.
- **Open:** support them on Patreon if this app gets used. Cheap insurance and
  the right thing.

## A10 — Value history · DESIGNED take 1 · ESTIMATE SERIES take 20

- **Decision:** snapshot the *portfolio's* total nightly into `user.db`, not just
  per-card prices. A chart reconstructed from card prices lies when cards are
  added or sold; a snapshot series is the history of this collection.
- **Ruled out: reconstructing history from `price_history`.** Wrong by
  construction the first time anything is bought or sold.
- **Ruled out: PRO-gating any timeframe.** The reference app locks MAX behind a
  subscription. All timeframes are free here; this is the whole premise.
- **Take 20, and it is a refinement not a reversal:** the catalogue carries
  daily history now, so a fresh install draws an *estimate* — holdings × each
  day's prices — dashed and labelled, until three real snapshots exist and the
  record takes over. Landmine 91 is the line between the two.

## A11 — Japanese printings · CLOSED for v1, take 1

- **Decision:** out of scope. TCGCSV 68 is the English game.
- **Required anyway:** the scanner must detect and *refuse* a JP card rather than
  match it to the EN printing sharing its number (landmine 24).
- **Ruled out: silently treating JP as EN.** 10× price errors, and it is landmine
  1 in a different costume.

## A12 — Distribution channel · REVISED take 1 · Play route CONFIRMED take 11

- **Take 11:** the owner is following the same Play process as APEX ORV, which is now
  in closed testing. So the account exists, its type is whatever passed that
  gate, and landmine 35's calendar cost is known rather than unknown.
- **Ruled out: the private-repo recommendation as a blocker.** APEX ORV is
  public with a committed sideload key and the route worked; RUNBOOK §1 keeps
  "private until v1" as the recommendation and A8 states the trade either way.


- APEX ORV started as a sideloaded personal APK with Play added later. That
  ordering is no longer available to a new app.
- **PROVEN external constraint:** Android Developer Verification enforcement began
  30 Sep 2026 in four markets, global from 2027, and covers direct APK installs on
  certified devices.
- **Decision: Play is the primary channel; the APK is the backup.** Both are
  built by CI as on APEX; the priority order flips.
- **Ruled out: planning around indefinite frictionless sideloading.**
- **Open:** whether the hobbyist verification tier applies. Worth checking early.


- **Decision: Capacitor 8 + vanilla JS in `src/app.html`, built to `www/`.**
  Identical to the sibling repo.
- **Reasoning:** the valuable thing about APEX ORV is not Capacitor, it is the
  governance — takes, seed zips, `gate.py`, `smoke.mjs` executing the shipped
  artifact, `render.mjs` in real Chrome, the seed→CI→Release ritual, 167 takes of
  landmines. That machinery is written, debugged and phone-operable *today*.
  Rebuilding it against Gradle and Kotlin means re-learning two hundred failures
  in a new dialect before the first card is scanned.
- **The native OCR is not given up.** ML Kit runs natively via the plugin; only
  the orchestration is JavaScript. The one place native would clearly win is the
  per-frame hot path, and A2 measures exactly that before it matters.
- **Ruled out: native Kotlin + Compose.** Better on the hot path, worse on
  everything else here. It discards `gate.py`, both harnesses, the CI, the release
  flow and the phone-only capability. Revisit only if A2 fails and a native
  Capacitor plugin does not rescue it.
- **Ruled out: Flutter.** All the costs of a rewrite, none of the hot-path win,
  and no iOS requirement to justify it.
- **Ruled out: a second app framework "just for the scanner".** Two build systems
  is two gates.
- **Note:** the owner now has PC access, which removes the constraint that originally
  forced this on APEX. The decision stands on the toolchain argument alone, not
  on the constraint.

