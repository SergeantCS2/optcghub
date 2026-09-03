# ROADMAP — OP TCG Hub

*Current as of take 40.*

An offline-first Android collection tracker and card scanner for the One Piece
Card Game, built from TCGplayer catalogue data via TCGCSV. Play Store plus
sideloaded APK. No subscription, no account, no backend, and no network required
to scan.

**The bar:** if Collectr has a feature worth having, it belongs on this list. The
parity matrix below is the checklist.

**The driver:** the reference app caps free scanning at 25 cards. A Constructed
deck is 51. A binder page is 9. A booster box is 288. The cap makes the one
feature that matters unusable, and per PROTOCOL §9 nothing that protects the
collector's data gets cut for schedule.

---

## Re-sequenced at take 10 — The owner's order

No field testing until everything is built. After the core:

1. **The scanner** — built at take 10, every stage but the camera verified.
2. **The collection: filtering and sorting proper** — done take 11.
3. **The deck builder** — rules researched take 12 (RULES.md), built take 13.

Two agenda items close only on a device and will stay open by construction
until the day the owner tests: **A2's field half** (sleeves, glare, angle) and
**A14** (ML Kit language-model exclusion). Everything else closes here.

## Phase 8 — the approved backlog (A20), in order · added take 24

Approved wholesale at take 24. Not scheduled; picked from in this order unless
The owner says otherwise. Cheap first.

| # | item | needs | status |
|---|---|---|---|
| 8.1 | Life / DON!! counter (Play screen) | nothing | **done take 24** |
| 8.2 | Card text search on keywords | filter chip | **done take 25** |
| 8.3 | Set completion checklist grid | half built | **done take 26** |
| 8.4 | Want list, valued | collection model | **done take 26** |
| 8.5 | Price alerts on sync | local notifications plugin | **done take 27** — and Sync itself, which did not exist |
| 8.6 | Binder page view | layout | **done take 28** |
| 8.7 | Deck price and history | chart code exists | **done take 28** |
| 8.8 | Limitless / sim deck-list import | three parsers | **done take 29** — one parser, five shapes |
| 8.9 | Trade matching via QR | QR plugin | |
| 8.10 | Sealed EV | community pull rates — label as estimate of estimate | |
| 8.11 | Grading ROI | a graded-price source TCGCSV lacks | |
| 8.12 | Collection share page (static HTML) | export code | |
| 8.13 | Other games (A19) | per-game scanner + rules; catalogue packs | |
| 8.14 | Japanese printings (A11) | second catalogue | |
| 8.15 | Simulator (A23) | a phase | |
| 8.16 | Cloud sync via the user's own Drive | Drive plugin | |

## Where the phases actually landed · take 32

The seven phases below are the take-1 plan, kept as the record. What
happened:

| phase | plan | actual |
|---|---|---|
| 0 — Feasibility spike | a weekend on the Fold | the rig was built at take 4 and never run; the *app's own scanner* was proven on the Fold at take 16 instead. A2 closed the way the plan did not expect |
| 1 — Pipeline | 1 week | take 1, then hashes take 3, history take 8, keywords take 12, in-app refresh take 27 |
| 2 — Shell | 2 weeks | take 2; redesigned take 16; two modes take 24 |
| 3 — Scanner | 2–3 weeks | simulated take 2, built take 10, proven take 16; field half (foils, sleeves, toploaders) still unmeasured |
| 4 — Charts | 1–2 weeks | snapshots take 3, deltas take 8, history estimate take 20 |
| 5 — Collection safety | 1 week | export take 2, auto-backup take 15 (fourteen takes late — landmine 80), portfolios take 18 |
| 6 — Release | 2–4 weeks | signed APK take 9, Play listing copy take 23, repo stood up take 30, first CI run take 31 reached step 4 of 10. **In flight.** |
| 7 — Deck builder | after v1 | rules take 12, built take 13, browse take 25 |
| 8 — Backlog | — | 8.1–8.8 done; 8.9–8.16 open |

Thirty-two takes in three days against a plan of thirteen weeks. The plan's
*order* held; its *durations* were for a person, not a session.

## Read this before the phases

**The money case is real but modest, and that's fine.** A tracker subscription
runs a few dollars a month. Build it for the reasons that hold:

- **Ownership you can prove.** The collection is a SQLite file on the phone, with
  a CSV export, not a row in someone's database behind a paywall.
- **No cap.** Scan four thousand cards on a Sunday if you want to.
- **Honest numbers.** Every price carries its source and its date, and the app
  refuses to invent a condition adjustment it cannot substantiate.
- **It cannot be repriced, gated, or pivoted out from under you.**

If a phase stops serving one of those four, cut it.

---

## Feature parity matrix

**Gap** means we can't match it and should say so plainly rather than pretend.

| Capability | Collectr | Plan |
|---|---|---|
| Card scanning | 25 free, then PRO | **built take 10** — unlimited; camera itself untested (A2) |
| Batch scan with running total | ✓ | **done take 10** |
| Collection grid, search, sort | ✓ | **done take 11** — filter & sort sheet, both scopes |
| Portfolio total + daily delta | ✓ | **done take 8** — real day-over-day |
| Value chart 1D–6M | ✓ | **done take 20** — estimate dashed, record solid |
| Value chart MAX | PRO | **done take 20 — free** |
| Price history per card | ✓ | take 8 — 1d now; 7d/30d appear as history accrues |
| Multiple portfolios | ✓ | **done take 18** |
| Graded card entry | ✓ | **done take 3** |
| Bulk actions | ✓ | **done take 3** |
| Export | ✓ | **done take 2** |
| Import | ✓ | **done take 3** — refuses ambiguous rows |
| Auto-backup + restore | – | **done take 15** — Documents/OPTCGHub on every commit |
| Per-condition valuation | ✓ | **Gap** — A4, no free source. Disclosed in-app |
| Sealed product | ✓ | **manual entry take 15**; barcode ruled out — no UPC in the data (A7) |
| Japanese printings | ✓ | **Gap** — A11. Detected and refused, not mismatched |
| Market movers | ✓ | **done take 8** |
| Set completion | ✓ | **done take 3** |
| Deck builder | – | **built take 13** against RULES.md — Leader picker and printing swap pending |
| Trade analyzer | ✓ | **done take 18** |
| Social feed | ✓ | **Won't build** — needs a backend |
| Shop / affiliate links | ✓ | **Won't build** — their revenue model, not our need |
| Auto-grading from photo | – | **Won't build** — a separate product |
| Subscription | ✓ | **Won't build** — the paywall is why this exists |

---

## Phase 0 — Feasibility spike 🔬

**One weekend. Blocks everything. Agenda A2.**

The catalogue question is closed (A1, PROVEN). The scanner question is not. This
phase produces a number, not an opinion.

- 30 real One Piece cards from the owner's own collection:
  10 foil / SP / Alternate Art, 5 penny-sleeved, 5 in toploaders, 5 under poor
  light, 5 loose base cards as a control
- Throwaway harness: capture → OpenCV quad detect → warp → crop bottom-right →
  `@capacitor-mlkit/text-recognition` → regex `^(OP|ST|EB|P)\d{2}-\d{3}$`
- Record correct / wrong / no-read **per category**, and the wall-clock time from
  shutter to string
- Run it **on the Fold**, not on a desktop (PROTOCOL §1)

**Gate: ≥85% correct code read first-try, ZERO wrong codes on the control group,
and a measured round-trip under 400 ms.**

- Pass → Phase 1.
- 70–85% → proceed, budget a week for temporal voting and exposure lock
  (landmines 10, 11).
- <85% but zero wrong reads → still proceed; a picker-heavy scanner is usable, a
  lying one is not.
- Any wrong code on the control group → stop. That is landmine 12 territory and
  the confidence model needs rethinking before anything is built on it.

**Running in parallel from this phase onward, because they are calendar time:**

- ☐ Confirm the Play account type and creation date (landmine 35)
- ☐ Begin recruiting 16–18 closed testers
- ☐ Settle A8: app id, name, sideload keystore, backed up off the phone
- ☐ Check whether the hobbyist developer-verification tier applies (A12)

---

## Phase 1 — Catalogue pipeline 🗄️

**1 week. Python only, no app code.**

1.1 `tools/tcgcsv.py` — fetch categories → groups → products → prices for
category 68. Declared User-Agent, sequential, non-empty assertion per group
(landmine 5). Cache to `tcgcsv_cache/`.
1.2 Variant parsing — normalise the `name` suffix into `variant_kind`
(`base` / `alternate_art` / `sp` / `parallel` / `manga` / `promo`), landmine 2.
1.3 `tools/hashes.py` — download art in the runner, 64-bit dHash of the art
window, **discard the images** (landmine 26).
1.4 `tools/build_catalog.py` — SQLite: `card_set`, `product`, `price`,
`product_hash`, FTS5 over name + number.
1.5 `tools/validate.py` — the QA gates: product count within 2% of the previous
build, no group returning zero, no price moving >10× day-over-day (landmine 7),
`last-updated.txt` within 36 hours (landmines 3, 6).
1.6 `ci/catalog.sh` + nightly workflow → zstd → checksum → GitHub Release.

**Gate:** a nightly Action produces a checksummed catalogue with 6,860±2% card
products and a hash for every one of them, and `validate.py` demonstrably fails a
deliberately corrupted input (PROTOCOL §7 negative control).

---

## Phase 2 — App shell 📱

**2 weeks. No camera yet — prove the data layer end to end.**

2.1 `src/app.html` scaffold, dark theme, bottom nav. Borrow the APEX ORV shell.
2.2 SQLite on device, **two databases** (landmine 22): `catalog.db` replaceable,
`user.db` sacred.
2.3 Catalogue download → verify checksum → atomic swap.
2.4 Manual add: search → printing picker → condition → quantity → save.
Collection grid, search, sort.
2.5 Portfolio total, per-item value, daily delta with the plausibility cap.
Price provenance line on every card: source and date (PROTOCOL §10.1).
2.6 **CSV export.** Early, deliberately (landmine 20, PROTOCOL §9).

**Gate:** manually build a 20-card portfolio; the total matches a hand
calculation against the catalogue to the cent. Export it, reimport it into a
spreadsheet, and confirm every row survives.

---

## Phase 3 — Scanner 📷

**2–3 weeks. The hard part.**

3.1 Camera preview and capture, whichever path A2 selected.
3.2 OpenCV.js quad detect → perspective warp to 500×700 canonical → orientation
correction.
3.3 Crop the code region → OCR → constrained regex → catalogue lookup.
3.4 dHash disambiguation across the candidate set; measure the real Hamming
distribution before writing a threshold (A5).
3.5 Asymmetric confidence gate; picker on anything below it (landmine 12).
3.6 Temporal voting, exposure lock on the code region, CLAHE (landmines 10, 11).
3.7 Batch queue: auto-capture, haptics, running total, undo, 800 ms cooldown,
quantity increment on duplicates, review-and-commit (landmines 16–19).
3.8 `scan_log` on every attempt, on-device, from the first build. It is the only
way to improve accuracy and it costs nothing.
3.9 JP detect-and-refuse (landmine 24).

**Gate: 100 real cards from the owner's collection scanned in under 4 minutes, ≥95%
correctly identified, and ZERO silent misidentifications.** The last clause is the
one that matters; the first two are negotiable.

The owner starts using the app for real here, ugly or not. Real use is what carries
motivation through Phase 5.

---

## Phase 4 — Value over time 📈

**1–2 weeks.**

4.1 Nightly `portfolio_snapshot` write (A10).
4.2 Value chart, **all timeframes free**.
4.3 Per-card price history from the catalogue's `price_history`.
4.4 Most Valuable list.

**Gate:** the chart renders 30 days of real snapshots and stays correct when
cards are added and removed mid-period.

---

## Phase 5 — The collection is load-bearing 🛡️

**1 week. The boring phase that matters most. PROTOCOL §9.**

5.1 Auto-backup on every batch commit; Android Auto Backup for `user.db`.
5.2 CSV/JSON import — including a Collectr export, so migration in works.
5.3 Bulk actions: multi-select, delete, change condition, move portfolio.
5.4 Multiple portfolios.
5.5 Graded entry: grader, grade, cert number, separate from ungraded (landmine 25).
5.6 Sealed product, manual (A7).
5.7 Settings, About with TCGCSV and TCGplayer attribution and the affiliation
disclaimer (landmines 29, 30), privacy policy link, empty and error states.

**Gate:** wipe the app, restore from backup, diff the collection. Byte-identical
or it is not done (landmine 21).

---

## Phase 6 — Release 🚀

**2–4 weeks, mostly waiting.**

6.1 Internal testing track; dogfood the signed build.
6.2 **Closed testing: 12+ testers, 14 continuous days** (landmine 35).
6.3 Store listing opening with the affiliation disclaimer and naming every data
source with a working link — APEX ORV was rejected at take 166 for exactly this
and it is free to get right the first time (landmine 29).
6.4 Data Safety form; near-empty by design (landmine 39).
6.5 Privacy policy on GitHub Pages.
6.6 Developer verification, package name and signing key registered (landmine 36).
6.7 Apply for production access.

**Gate:** production access granted; v1.0 live.

---

## Phase 7 — After v1 ♾️

In rough priority: trade comparison, wishlist, sealed barcode scanning,
graded-slab cert scanning, and a **deck builder** — wanted, explicitly not a
priority (A13). The catalogue was checked at take 4 and can already feed one;
the only missing field, Leader `Life`, was ingested then. A second game is a
new adapter and a new crop region — cheap, if Phases 1–3 were built right, but not
before One Piece is genuinely good.

---

## Timeline

| Phase | Effort | Cumulative |
|---|---|---|
| 0 — Spike | 1 weekend | wk 0 | *(plan; see the table above for what happened)* |
| 1 — Pipeline | 1 wk | wk 1 |
| 2 — Shell | 2 wk | wk 3 |
| 3 — Scanner | 2–3 wk | wk 6 |
| 4 — Charts | 1–2 wk | wk 8 |
| 5 — Collection safety | 1 wk | wk 9 |
| 6 — Release | 2–4 wk, mostly waiting | **wk 11–13** |

**Roughly 3 months to a published v1.0** at APEX's observed pace, and the
closed-testing wait overlaps Phase 5 — *provided tester recruitment starts at
Phase 0.* Starting it at Phase 6 adds two weeks of dead time and nothing else.

The pipeline phase is a week rather than two because A1 came in far better than
planned: the entire catalogue is 11 seconds of HTTP and there is nothing to
optimise.
