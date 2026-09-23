# V1-STATE — what exists, as of take 92

*Current as of take 92.* The honest inventory: sorted into what is PROVEN on a
device, what is BUILT and verified in the harness, and what is DEFERRED with
the reason. Numbers are measured, not remembered; the take that measured
each is named.

## The app in one paragraph

OP TCG Hub scans One Piece Card Game cards by reading the printed number,
disambiguates the printing (base / alt-art / SP — the same number spans up to
4,292× in price, landmine 41), values the collection at TCGplayer market via
TCGCSV, and keeps everything on the phone with a backup that survives
uninstall. Two modes: **Collect** (home, search, scan, collection, trade,
wants, binder, checklists) and **Prep & Play** (decks built against the
official Comprehensive Rules, a deck-building card browse, a Life/DON!!
counter). Rewarded ads gate *saving*, never scanning (A17). No account, no
server; the only load-bearing network call is the opt-in nightly catalogue
refresh from Pages (take 27).

## PROVEN on a device (the Fold, take 16), on a runner (take 32), and in the Play Console (take 39)

- The camera comes up, the guide finds a plain card on a dark table, ML Kit
  reads the code, the picker opens with exactly the printings that share it.
  Two cards, two correct pickers. **A2's core question is answered.**
- **CI, end to end on GitHub's runner:** run #3 on take 31 — seed 6 s,
  bundle 42 s, apk 4 m 36 s, pages 14 s — Release take-31, Pages live at
  `sergeantcs2.github.io/optcghub` (read off the repo at take 34). The owner
  installed the APK it built. The AAB is dev-signed and named unfit until the
  upload-key secrets exist.
- **Play:** the app exists in the console as `com.optcghub.app` on a personal
  account; version code 35 accepted into internal testing; advertising-ID
  declaration and Data Safety done to landmine 94; listing copy in; closed
  track created; app-ads.txt served from the root user site (take 40); **the
  closed-testing release APPROVED by Play review (take 52, the owner's
  report).** The 14-day clock starts when the twelfth tester is opted in.
- **16 KB page size:** every arm64 native library in the APK loads at 0x4000
  alignment and is stored 16 KB-aligned in the zip (MEASURED take 34 on the
  take-32 APK). Play accepts it.

## BUILT and verified in the harness (Chrome + node), not yet on a device

| area | what | verified by |
|---|---|---|
| Scanner | quad detect → warp → code crop → OCR → catalogue check → face (SP text / star template) → 3-frame vote → confidence gate → auto or picker; batch persists; likelihood-ordered picker | render.mjs pixel stages, smoke parse/vote, star port 30/30 vs Python (takes 10, 16) |
| Catalogue | 6,862 cards + 658 sealed, 87 sets, from TCGCSV cat 68; keywords extracted (line-start rule); cleaned text; 3 days of price history, growing nightly | pipeline gate, validate.py 6 guards with negative controls |
| Values | market/low/high per printing; deltas labelled with the horizon they measured, never "yesterday" across a missed night (take 58); Market Movers; chart from snapshots (record) or history (estimate, dashed, purchase-date-aware) | smoke arithmetic vs the catalogue's own deltas |
| Collection | portfolios, conditions, graded, cost basis, favourites, bulk actions, filter/sort sheet (two scopes; the set chips returned nothing from take 11 to 89 — fixed take 90, landmine 126), export CSV **via the share sheet on a device** (take 34, landmine 110), a self-contained share page (8.12, take 42), import CSV, auto-backup to Documents on every save, restore with a file-picker fallback | smoke 255, render 51; **export/restore not yet seen on a phone** |
| Stock decks | 17 legal decks built from the ST sets, with covers the app draws from the Leader colours and set code (take 62), shown as *ready-made*, playable in the sim, **never in the collection** (take 61) | smoke 10 incl. the never-owned guard with a control; stockdecks.py 9 guards in the gate |
| Decks | legality per Comprehensive Rules §5-1 by section; advisor (curve, counters, blockers, triggers, life); Leader sheet; printing swap; import 5 list formats; export; value + history; sim-readiness and *Play this deck in Sim* (take 53) | smoke, two guards on R6 (number-keying) |
| Hunt | a third mode with its own palette; **Sealed** — 343 sealed products with market/low/high, nightly delta, search, kinds, alerts through the detail sheet; **Releases** — every set's publish date, upcoming with a countdown (take 70) | smoke 16, render 3 in Chrome |
| Diagnostics | hidden behind five taps on More → About: live endpoint probes, storage, the last twenty errors — kept across restarts since take 91 — the self-test, copy or share (take 82). **More itself was unreachable from take 83 to take 90** (its section was built on demand and the take-83 guard refused it first; A37, landmine 128); a static section since take 91 | smoke 5 + the take-91 More and persistence assertions; render opens More and reaches Diagnostics in Chrome (take 91) |
| Prep & Play | mode slider + palette; Cards browse (keywords, colour, cost, text, for-this-deck); Play counter with §6-4-1 first turn and a *pass the phone* mode (take 44); **Sim: the hot-seat board** — two legal decks, the rules of RULES.md §3 enforced with sections cited, effects by hand through a tray, the curtain at every hand-over (take 46); **scripted effects** parsed from card text at build time, 2,161 of 7,553 lines (28.6%): chains, costs, continuous effects and keywords, follow-ons, searches in every phrasing, Events at both timings, cost changes, modifiers with honest expiries that follow their card, offered under their conditions with engine-computed targets (takes 47–51); **an opponent** — legal, not clever, never reads the hand — so one person can play (take 55) | render draws the dealt board; smoke 22 against §3, 40 on the effect classes, two whole bot games under a conservation invariant |
| Trade | two lists valued with spread; paste their list; share summary | smoke |
| Wants & alerts | want list valued at likeliest printing; set checklist grid; binder pages; price alerts via local notifications, idempotent per catalogue date | smoke |
| Ads | AdMob 8.1.0, the app's own app ID with Google's test ad units (take 41); credit ledger; pending tray; reward from the event only | smoke; **no ad has been seen on a device** |
| Onboarding | first-run tour v2 (6 cards), versioned; picture slots in assets/user; **New in this update** on Home once per take, from the release note (take 53) | render; smoke 3 |
| Packaging | signed APK (committed sideload key), AAB branch for Play (needs 4 secrets), icon + splash from SVG, play-assets, CAMERA + POST_NOTIFICATIONS + AD_ID in the manifest | built every take since 9; signer verified by aapt2/apksigner |
| CI | build.yml on `main` only (seed → bundle → pages + apk), nightly 21:30 UTC with sidecar commit-back and one labelled failure thread; **check.yml runs the whole pipeline on every PR with a read-only token (take 89)**; hunt.yml hourly; bootstrap.yml as recovery. Since take 89 the workflows live in git, byte-identical to their `ci/` copies, and a take is a PR the owner squash-merges | **ran green on a runner at take 32; APK installed by the owner.** Four red nights 09-18..21 read at take 89: the Events fixture's clock and the hashes guard's treatment of unpublished images (landmines 123, 124); both fixed with controls |
| Self-test | More → Self-test: 17 on-device checks (catalogue, gate, search, fonts, storage, Filesystem, share, camera, ML Kit on a drawn code, notifications, ads, sim, sync), shareable report | smoke 9; **run on the Fold at take 91: 16 pass, and the one FAIL was the check's own (`m.num`, landmine 131) — fixed take 92** |
| Scrubber | comments stripped from the shipped app on every build; the gate refuses a first name, an AI-vendor name, the conversational word, a credential, a container path or a leftover to-do marker anywhere public | scrub.py --selftest 6 controls; smoke 5 (take 35) |
| Typography | four roles (display / comic / body / heavy), OFL/Apache faces bundled, 232 KB, licensed faces as a file drop in `assets/user/fonts/` | render.mjs: Chrome reports all four LOADED and h2 resolves to the display face, with a missing-file control; smoke 7 |
| Sync | quiet once-per-open sync holds on cellular unless switched on; Sync now always runs; `UPDATE_URL` points at Pages | smoke 4 controls; **not yet seen on the Fold** |

**Harness totals, take 92:** smoke.mjs 603 assertions (MEASURED in the
session VM), render.mjs 81 in Chrome at take 91 (unchanged this take; the
runner's check confirms), gate 23 checks with negative controls, hunt.py
39 selftest lines including the roster's two shapes and the failure path;
the session VM has no puppeteer and no pillow, so Chrome and hashes run on
the runner only.

## DEFERRED, and why

| item | why | where |
|---|---|---|
| Scanner field half — foils, sleeves, toploaders, the star region | needs the owner's cards under a phone camera | A2, RELEASE.md |
| First test-ad impression | needs a phone | A17 |
| First notification | needs a phone | 8.5 |
| The Play clock | approved; 12 of 16–18 testers opted in, then 14 days | RUNBOOK-play §7 |
| Which key signed the first upload | UNKNOWN until the owner says which `.aab` he uploaded | RUNBOOK-play §2 |
| Export and restore on the Fold | share sheet and file picker are INFERRED from the plugin definitions until seen | landmine 110 |
| First Sync on the Fold | `UPDATE_URL` is set; the first *Sync now* that shows a date proves Pages and the URL | RUNBOOK §5 |
| Real AdMob unit IDs | D11; the account exists and app-ads.txt is live; test units are correct for a closed test | A17, RUNBOOK-play §9 |
| The named fonts as files | D16; the roles ship with free faces, the slot takes licensed ones | A26 |
| Whether the faces themselves fit | the colour and contrast are fixed (take 60); whether Luckiest Guy and Bangers are the right faces is D16 | A26 |
| A TalkBack session on a phone | every control has a name and the roles are right (take 66); whether the order and wording make sense needs a person | A30 |
| Focus order | the ring exists (take 80); tab order across screens is unreviewed | A30 |
| Hunt mode — local shops, reprints, the preorder watch, per-user zips | Sealed, Releases (take 70) and the hourly Target feed — online stock for all of the US, shelf stock per served zip with a zip pop-up, a fortnight of hourly history turned into dated restocks per store, and Local — 2,967 event-running shops with distances from your zip, the distance dropdown, your own notes, verified local shops' online sealed stock hourly, and Events — every event near you for a month with fee, seats and a TCG+ Register link (the source became a chunked index on 2026-09-22 and the roster froze for six days under a green hourly; read both shapes since take 92, landmine 130) — in a Zoro-green palette, with stock alerts that fire on the flip at any tracked source, any event onto the calendar as an .ics, exact distances on request (takes 71–79) BUILT; the TCG+ roster and the rest follow in A32 order | A32 |
| Importing from other apps (Collectr) | needs one real exported file; guessing the format would mis-key printings | A31 |
| Colour direction | D15; parked, not a priority | A24 |
| Icon motif | D7; the take-16 placeholder is back by request | A16 |
| A14 ML Kit language trim (~10 MB) | needs a device to verify no NoClassDefFoundError | A14 |
| Backlog 8.9–8.11, 8.13–8.16 | not scheduled; 8.12 done take 42 | ROADMAP Phase 8 |
| Other games | measured, one-app-per-game or packs; not before Play | A19 |
| Simulator step (2), the rest | more whole templates with tests; Event timings; chained sentences — coverage is 6.1% and grows only by whole templates | A23 |
| Simulator step (4) | two phones (D18); a stronger opponent is a different promise | A23 |
| The board on the Fold | two people, one phone; the curtain and the battle window unmeasured | A23 |

## What is NOT in the app, by design

No account, no server, no analytics, no crash reporting, no social feed, no
shop, no affiliate links, no character art, no publisher marks — including
product box shots, asked for and declined at take 62 (A29). A market
price is a model and every screen says so. Condition is never multiplied into
a value. Nothing scanned is ever discarded.

## Numbers a new session should not re-derive

- Code alone resolves 8.9% of printings; + set chip 60.1%; + card face 71.7% (takes 2, 6)
- 3,918 printings (57%) are visually indistinguishable from a sibling (take 3)
- Star detector: threshold 0.61, recall 64.6%, 0 false positives on 133, margin +0.36 (take 7)
- OCR on clean renders: 53% read, 51% correct, 2% wrong with the catalogue check (take 7)
- Dearest-first puts a promo on top for 49.8% of ambiguous numbers (take 16)
- All 165 dual-colour cards are Leaders (take 13)
- Naive `[Rush]` matching over-counts by 4× (take 12)
- A set can carry other sets' numbers — EB03 has four (take 26)
- 34% of prices move on a given night; median move 2.7% (take 8)
- Contrast on the card background: fg 12.49:1, dim 5.19:1, dim2 4.58:1 after take 60 (2.64:1 before), brass 6.88:1 (Collect); dim2 4.77:1 in Prep & Play
- 69% of printings over $5 carry a low at least 5% under market; market sits outside low..high on 427 printings, because market is an average of sales and low/high are live listings (take 58)
- Bundle: 4.2 MB raw, 0.56 MB gzip; a delta would be 16 KB (take 29)
- TCGCSV on a GitHub runner: 3 s, no throttle (take 31)
- All four fonts, subset to Latin as woff2: 232 KB (take 33)
- Effect lines scripted from text with a closed template set: 2,161 of 7,553, 28.6%; 1,130 cards fully (take 51)
