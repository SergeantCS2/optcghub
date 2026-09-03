# AGENDA

*Current as of take 40.* Ranked by blocking-ness, not by interest.

**Every item lists what has been RULED OUT and with what evidence.** Keep it that
way, so nobody re-derives a dead end.

---

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

## A21 — Google Play · IN THE CONSOLE take 39 · internal test live, closed track at 4 of 5, review next

The owner wants the closed-testing clock started in a few days. The gate is
**12 testers opted in for 14 continuous days** (landmine 35). Everything below
is what stands between the seed and that clock, in order, with who does it.

| # | step | who | state |
|---|---|---|---|
| 1 | **D14 — one game or many, and therefore the package name** | The owner | DONE take 24; `com.optcghub.app` registered with Play at the take-35 upload, permanent |
| 2 | Stand up the repo: RUNBOOK §1–4 | The owner | **DONE** — read off the repo at take 34: public, run #3 green end to end (seed 6 s, bundle 42 s, apk 4 m 36 s, pages 14 s), Release **take-31**, Pages live. PROVEN |
| 3 | First CI build produces the AAB | CI | built, dev-key-signed, named unfit (correct). Loses the suffix the first build after `tools/play-key.sh` sets the four secrets — RUNBOOK-play §2 |
| 4 | Play Console: create the app, Play App Signing, the four secrets | The owner | **DONE** — personal account; app created; version code 35 accepted into internal testing (two optional warnings). **UNKNOWN: whether the upload-key bundle or the DEVKEY one was the first upload** — RUNBOOK-play §2 says how to reset if the latter |
| 5 | Listing: title, short and full description opening with the disclaimer, screenshots, icon 512, feature graphic 1024×500 | The owner | copy pasted (take 36); screenshots from the Fold with the take-37 showcase files; the console shows the jolly roger icon — swap to `play-assets-t33/icon-512.png` or say so (D7) |
| 6 | Privacy policy live on Pages, naming AdMob | take 30 | Pages deployed at `https://sergeantcs2.github.io/optcghub/` (run #3); the policy is `/privacy.html` there |
| 7 | Data Safety form: **AD_ID collected/shared for advertising** (landmine 94); camera; no other collection | The owner | **DONE** — advertising-ID declaration Yes / advertising; Data Safety: device IDs collected and shared, advertising, required, not ephemeral, encrypted in transit, no deletion request, no accounts |
| 8 | Internal test → closed test; 16–18 testers recruited (landmine 35) | The owner | internal test rolled out; closed track created, 4 of 5 — roll out, *Send for review*, then the opt-in link to 16–18 |
| 9 | Developer verification: package + signing key registered (landmine 36) | The owner | |
| 10 | Real AdMob IDs — **not required to start the clock**; Google's test units are correct for a closed test | The owner, D11 | account exists (take 33): `pub-6243777967151950`; **app-ads.txt live at the root site, take 40** — RUNBOOK-play §9 |

- **Ruled out: waiting for real AdMob IDs.** Test units are what a closed test
  should run on.
- **Ruled out: adding games first.** A19.
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

## A26 — Typography · BUILT take 33 · the named faces are a file drop, not a download

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

## A24 — The colour scheme, again · OPENED take 28 · NOT A PRIORITY

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

## A23 — An OP TCG simulator · SCOPED take 24 · PHASE, NOT A TAKE

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
- **Ruled out for now:** starting before the Play clock is running and A2's
  remaining half is measured. The sim does not help the closed test.
- **Ruled out: card art in the sim.** It is the collector's own scans or the
  reference art under landmine 28's rules; nothing new.

## A18 — First-run guide and user pictures · BUILT take 19

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
- **Open:** the splash-bg slot is declared but `ci/apk.sh` does not yet use it
  — it renders the icon on navy. One line, next take.

## A17 — Ads and revenue · SDK WIRED take 22 against Google test units · ADMOB ACCOUNT EXISTS take 33 · unit IDs pending (D11)

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

## A16 — Theming, icon, splash · DESIGNED take 16, ICONOGRAPHY take 17 · ICON REVERTED take 33 as asked · one request declined

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
  the splash, not in the store listing.
- **Ruled out: bundling any card art or character image** for theming. Landmine
  26, unchanged.
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

## A14 — Trimming the ML Kit language models · OPEN, UNVERIFIED

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

