# V1-STATE — what exists, as of take 112

*Current as of take 112.* The honest inventory: sorted into what is PROVEN on a
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
  installed the APK it built. **The AAB is signed with the Play upload key**
  (the four `PLAY_UPLOAD_*` secrets are set): every build's `apk` job reads
  the signer back off the bundle and prints `AAB signer: Owner: CN=OP TCG
  Hub upload, OU=play` — PROVEN from run 48's log at take 101, and the
  file carries no `DEVKEY-DO-NOT-UPLOAD` suffix. Since take 101 an
  unreadable signer fails the build. **Sizes (MEASURED from Release
  take-100's files):** APK 34.7 MB packed / 58.0 MB raw (what the phone
  reports as installed); AAB 23.6 MB packed. Dex 23.0 MB raw, the OCR
  engine 11.1 MB (arm64) + 6.8 MB (armeabi-v7a), the app and catalogue
  8.6 MB raw / 1.8 packed, the OCR language models 5.5 MB raw. **Take
  103 (MEASURED, run 52 and the released files):** APK 26.4 MB file /
  36.9 MB raw (from 34.9 / 58.0), AAB 19.6 MB (from 23.8); dex 6.4 MB raw
  in one file (from 23.0 in three), the OCR models 1.5 MB raw (from 5.5),
  the engine unchanged at 11.1 + 6.8. The apk
  job prints this breakdown every build since take 101 (`tools/shipped.py`).
- **Play:** the app exists in the console as `com.optcghub.app` on a personal
  account; version code 35 accepted into internal testing; advertising-ID
  declaration and Data Safety done to landmine 94; listing copy in; closed
  track created; app-ads.txt served from the root user site (take 40); the
  closed-testing release approved by Play review (take 52); **take 101
  uploaded to the closed track, the app APPROVED FOR PRODUCTION (24
  Sept, take 102) and LIVE on Google Play the same day (take 105:
  `play.google.com/store/apps/details?id=com.optcghub.app`, take 101's
  bundle; the owner's own Fold runs the Play build at 17 of 17)** — from
  here every take is one upload to the production track; the real AdMob
  rewarded unit IDs (D11) ride the take after he sends them. The accepted
  upload proved the registered upload key is the one the secrets hold,
  and its fingerprint is pinned (take 103).
- **16 KB page size:** every arm64 native library in the APK loads at 0x4000
  alignment and is stored 16 KB-aligned in the zip (MEASURED take 34 on the
  take-32 APK). Play accepts it.

## BUILT and verified in the harness (Chrome + node), not yet on a device

| area | what | verified by |
|---|---|---|
| Scanner | quad detect → warp → code crop → OCR → catalogue check → face (SP text / star template) → 3-frame vote → confidence gate → auto or picker; batch persists; likelihood-ordered picker | render.mjs pixel stages, smoke parse/vote, star port 30/30 vs Python (takes 10, 16) |
| Catalogue | 6,862 cards + 658 sealed, 87 sets, from TCGCSV cat 68; keywords extracted (line-start rule); cleaned text; 3 days of price history, growing nightly | pipeline gate, validate.py 6 guards with negative controls |
| Values | market/low/high per printing; deltas labelled with the horizon they measured, never "yesterday" across a missed night (take 58); Market Movers; chart from snapshots (record) or history (estimate, dashed, purchase-date-aware) | smoke arithmetic vs the catalogue's own deltas |
| Collection | portfolios, conditions, graded, cost basis, favourites, bulk actions, filter/sort sheet (two scopes; the set chips returned nothing from take 11 to 89 — fixed take 90, landmine 126), a picture beside every card and set in every list (take 93; the grid, the sheet, the binder and the checklist had them since take 12), export CSV **via the share sheet on a device** (take 34, landmine 110), a self-contained share page (8.12, take 42), import CSV, auto-backup to Documents on every save, restore with a file-picker fallback; a card's sheet is a screen the phone's Back returns from (take 98, landmine 137 — from take 81 to 97 Back from a sheet left no screen on and the watchdog put Home back), its condition segment updates in place and says what it records (take 98), Home's most-valuable rows open the card (take 98) | smoke 255, render 51; **export/restore not yet seen on a phone** |
| Stock decks | 17 legal decks built from the ST sets, listed on the Decks screen (take 61; back there at take 109 -- the markup had them in the deck editor since take 66 at the latest, landmine 149), each showing its Leader's picture over the cover the app draws from the Leader colours and set code (take 62, now the picture's fallback), shown as *ready-made*, playable in the sim, **never in the collection** (take 61) | smoke 10 incl. the never-owned guard with a control; stockdecks.py 9 guards in the gate |
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
| Scrubber | comments stripped from the shipped app on every build; the gate refuses a first name, an AI-vendor name, the conversational word, a credential, a container path or a leftover to-do marker anywhere public | scrub.py --selftest 9 controls (take 102: the two literal file names pass as whole tokens, the vendor word beside them still fires); smoke 5 (take 35) |
| Typography | four roles (display / comic / body / heavy), OFL/Apache faces bundled, 232 KB, licensed faces as a file drop in `assets/user/fonts/` | render.mjs: Chrome reports all four LOADED and h2 resolves to the display face, with a missing-file control; smoke 7 |
| Design tokens (take 106, A42) | one scale for the whole app: type roles 12 to 44 px (nothing under 12), spacing, radii, thumbnail sizes, motion and a z scale; semantic colours per palette — the accent as text (`--accent-ink`, Prep & Play `#E5705C`), the label on the accent (`--on-accent`), a control edge at 3:1 (`--line-strong`), tints mixed from each palette; the charts read the palette they are drawn in | smoke take-106 section (contrast per palette on card and card2, no font size under 12 px, every glyph a call names in the sprite); the look, take 106, 7 of 7 at both viewports |
| One header on every screen (take 107, A42) | a `header.appbar` in all twenty screens: the title an `h1` in the display face at 26 px in the mode's accent, at one height; one line under it where a screen has one; the gear to More last on the twelve screens in a nav, in all three modes (A37); the back arrow on the eight one level down (the phone's own Back path); Home's two views a tab row; every sheet a titled head and a close button; Back closes the filter, Leader and printing sheets first (landmine 144) | smoke take-107 section (every screen's header, Back, the gear, the sheets, the handlers; watched to fail on take 106); render (twenty titles measured in Chrome: one height, size and face, two lefts, the gear in one spot; the arrow, Back over two sheets, the ask sheet's cross); the look, take 107, 11 of 11 at both viewports |
| The art layer, first half (take 109, A42) | the picture measured first: TCGplayer's largest (`_in_1000x1000`) 600x838, up to 716x1000; Bandai's 600x838; the SAMPLE stamp on 38 of 40 card pictures at the two hosts, always one band at about 45-60 % of the card (landmine 151); the retry to `<id>.jpg` never served (403 for 241 of 241, landmine 150) and is gone. Decks opens under the featured deck's Leader (C: the art blurred from above the stamp, the card rising from behind the title with only its top 42 % showing -- gone at take 110, the owner's word; the title in A's slot); the ready-made decks back on Decks with their Leaders' pictures; a deck's Leader at 96 px; a card's own page over its own colours with the card at up to 196 px; the 600x838 picture only when the build's runner saw it serve; offline, the card's own colours; Home has no banner (the owner's ruling) | smoke take-109 section (the picture's address from the printing's own URL, the large size only when measured, the hero's place, the ready-made decks' screen, the colours; watched to fail on take 108); render (the fallbacks with pictures blocked, the crop above 42 %, no sideways scroll, the 44 px squares); hashes.py's large-size probe with its control; the look, take 109, with real pictures |
| The UI series' second half (take 110, A42) | Sealed under the newest set's top card (sharp, cut above the stamp) and every Sealed heading a strip; each Leader faint behind its side of the Play counter; the owner's hero-play.jpg and hero-hunt.jpg; at the owner's word no card rises from behind Decks' title, the blur shows the band above the stamp whole (the whole card in a blur still shows the stamp, MEASURED) and three texts are gone. The voice: Collection for Portfolio (the CSV and the backup keep `portfolio`), sentence case, one word per thing, money that keeps its currency, one percentage rule, days and moments in words, every field named. Polish: motion from the tokens, a sheet that rises, a mode switch that crossfades, one empty state, tabular figures, three thumbnail sizes. The Fold's inner screen: two panes from 700 to 899 px (its width INFERRED). Bulk delete, move and condition take the lines on screen -- the collection, the star, the filter, the search (landmine 155). A review after the first push: the currency sign read from the currency shown (landmine 157); words over art measured from pixels, 4.5:1 or better at a yellow card (landmine 158); a rising sheet ignores a tap on its scrim (landmine 159); the open Fold's grid spans what is not a row, and Local is one column (landmine 160). | BUILT; smoke, render in Chrome and the look (34 steps at both sizes) |
| The last look (take 111, A42) | every screen and the sheets read at both of the Fold's sizes (34 views each) and what they showed put right: a row's small line joins the parts it has (a printing with no number opened it with a dot); the filter counts results and lines; a printing's badge is never cut by the ellipsis (AGENTS rule 3; landmine 164); the bulk bar two lines on a phone; a card's page with a Watch panel apart from Graded, one triangle, and a sealed product's page with its kind, no Graded, no Want and no list of the 674 printings with no number; a DON!! card's page a card's (253 are filed as sealed; landmine 162); Set completion counts numbered cards of the collection on screen; the card page's Save, stepper and cost basis keep to the collection it names, and a slab is a line of its own (AGENTS rule 5; landmine 163); the binder opens at the first held card; a deck's value counts its Leader, as its history does; rows centred on their picture, the Sealed bell with them (landmine 161); CHF named once, About's day in words, Scan's note inside the margins, Local's sentence whole | smoke take-111 section and render (bulk bar, row centres, the alert line, the deck prompt, Scan's note, badges, the bell), watched to fail on take 110's app; the look, take 111, 68 of 68 |
| The second distributor (take 112, A32) | Southern Hobby's One Piece list, read hourly on the runner: 20 products; from each product page, when stores must order, the release and prerelease days, and "in-store only". Matched through the unit it is sold as: a case only to a case, and a starter deck or double pack only once its unit is read. On Sealed, Where to buy and Releases beside GTS's, each line naming its distributor and when it was read. A product with no photo yet shows its set's code, not an empty white card | hunt.py selftest 90 (the page budget, the unit and the item checks, each with a control); smoke 17; render 6 in Chrome at 360 and 411 px; one live fetch from the VM, 20 of 20 with 20 pages read; the look, 16 of 16 at both sizes |
| Controls and icons (take 108, A42) | every icon a sprite symbol with one meaning (Lucide's for the interface, ISC and MIT, their notices shipped in the sprite and credited in About; the game's own glyphs keep the game's meanings); every control a 44 px target -- a real 44, or a 44 px hit area round a drawn chip; a pressed look and a disabled look; every icon button named, every toggle `aria-pressed`; the scanner's shutter row above the nav (landmine 146) | gate: no icon drawn as a character (probes plant one literally and as an escape); smoke take-108 section (the glyph map as a table, watched to fail on take 107); render: every control's 44 px square on twenty screens and three sheets in Chrome (a 34 px stepper as its control), the scanner above the nav, a held press, a disabled button; the look, take 108, 10 of 10 at both viewports |
| Sync | quiet once-per-open sync holds on cellular unless switched on; Sync now always runs; `UPDATE_URL` points at Pages | smoke 4 controls; **not yet seen on the Fold** |

**The look (take 99, A40):** `tools/look.mjs` — the session's own review,
not CI: the built app in the VM's Chromium (Playwright, installed globally
there) at the Fold's two sizes, a per-take step list of real clicks and
`window.VAULT` calls (`tools/look/steps.mjs`), a PNG and a measured line
per step under `look/` (gitignored), read by the session and sent to the
owner before a PR is marked ready. Its first run, on take 98's changes,
found the toast wrapping into a tall half-width pill and a sealed sheet's
subtitle ending in two stray dots — both fixed the same take. Limits:
no camera, notifications, share sheet or native Back; no CDN pictures
from the VM. An emulator was measured impossible here (no KVM, no SDK,
no network).

**Pictures (take 100, A39 item 3):** every printing's `img` is TCGCSV's
URL on the first host; the runner's hash step now probes the 674 sealed
images every run (availability only, never hashed) and TCGplayer's
second host for every id the first refused, records `missing_sealed`,
`alt` and `alt_host` in the sidecar, and the app build ships the second
host's URL for an id the runner saw it serve — nothing guessed. The gate
reads the bundle's image hosts against PROVISION (a host in data shipped
unseen before). Diagnostics prints the counts. **MEASURED (check run
29):** 23 of 674 sealed images are unavailable at the first host; the
second host serves 1 of the 242 missing ids and answers 404 for 241 —
the pattern is real and the missing pictures are not there either. The
owner's image address from TCGplayer's own page is the next measurement;
the phone's picture is the proof.

**Harness totals, take 105:** smoke.mjs 706 assertions (9 new: the
fresh-boot stack holds Home, a lone card's Back goes home and reports
handled, a lone Home's Back is the one unhandled case and Hunt's Sealed
likewise, `notifyPermission` on an empty answer is `unknown` and still
asks with granted/denied controls, the `unknown` toast — four watched to
fail on the take-104 build); shrink.py 15 controls (+4, the real take-104
mapping among them); the look 2 steps × 2 viewports, the cover measured
411×960 @2.625; render 105 of 106 in local Chrome.

**Harness totals, take 104:** smoke.mjs 697 assertions (6 new: the three
camera verdicts, the skip-with-reason through the self-test's own check,
the effects line's text, the Diagnostics line calling it — all watched to
fail on the take-103 build, where the camera line read FAIL "0 camera(s)"
as on the owner's PC); shipped.py 8 controls (+2: the R8 map's group and
the installed total, watched to fail); the look 2 steps × 2 viewports
(the camera line reads SKIP with its reason in real Chromium; the effects
line "2186 of 7694 effect lines (1925 cards)" on the VM's cached
catalogue); render 105 of 106 in local Chrome.

**Harness totals, take 103:** smoke.mjs 691 (no app change; 689 on the
session VM against the nightly's newer sidecar — the runner's number
counts); signer.sh 10 controls (+3: the pinned fingerprint passes, the
upload DN with another fingerprint and an empty line are refused);
shrink.py 11 controls, new (the fixture and Capacitor's own template:
the build type flips, the block sits before `android {`, a second run
changes nothing, four rules once; a `build.gradle` without a release
block is refused — every one watched to fail against a silent patch);
gate 12 probes +1 selftest hook; render 105 of 106 in local Chrome.

**Harness totals, take 102:** smoke.mjs 691 assertions (unchanged: no app
change); gate 12 probes, each with a named failure category and the first
an unmutated copy that must fire nothing (landmine 139: the eleven before
it had fired on the copy's own missing keystore since take 35, and two
were dead underneath), +1 check (V1-STATE's heading against BUILD);
signer.sh 7 controls (a bundle signed with the committed sideload keystore
classifies `sideload`, a third key `other`); shipped.py +1 control (a
`lib/` segment inside the app's assets is the app's); scrub.py +3 (the two
literal file names pass, the vendor word beside them still fires);
render.mjs 105 of 106 on the session VM (the Leader thumbnail needs the
CDN this VM is refused), 106 expected on the runner.

**Harness totals, take 100:** smoke.mjs 691 assertions (6 new: both hosts
in their shape with a third refused, the sidecar's `alt` ids ship the
second host's URL — watched to fail on a hand-edited sidecar against the
take-99 build — the manifest's counts, the second-host chain in
`productPic`, the Diagnostics line), hashes.py selftest +8 (the probes'
pure parts, the sidecar round-trip), validate.py +1 (sealed misses never
widen the exemption, shown to refuse the tempting sum), gate +1 probe (an
undeclared host in the bundle's `img` column); render.mjs 106 in Chrome;
the look 2 steps for take 100 on the session VM.

**Harness totals, take 99:** smoke.mjs 685 assertions (5 new: the look
exists and `look/` is ignored at the root only with a `git check-ignore`
control, the toast rule, the sealed subtitle with a card control),
render.mjs 106 in Chrome, gate 23 checks, hunt.py 61 — measured on the
runner by the PR check (run 26, gate passed); the look 20 steps at two
viewports, 24 PNGs, on the session VM.

**Harness totals, take 98:** smoke.mjs 680 assertions (14 new: the back
path from a sheet with two controls, the most-valuable rows, the splash,
the toast, the decks fold, the condition tap with a control), render.mjs
106 in Chrome (five new: Back from a sheet on the real history path with
no blank record and its control with a prompt open, a most-valuable
row's click, the long toast inside the screen, the splash rule), gate 23
checks with negative controls, hunt.py
61 selftest lines — measured on the runner by the PR check (run 25,
gate passed); the session VM has no puppeteer and no pillow, so the
harness's Chrome and the hashes run on the runner only (a globally
installed playwright with Chromium exists on the VM since take 98 for
reproductions, outside the harness).

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
| Hunt mode — local shops, reprints, the preorder watch, per-user zips | Sealed, Releases (take 70) and the hourly Target feed — online stock for all of the US, shelf stock per served zip with a zip pop-up, a fortnight of hourly history turned into dated restocks per store, and Local — 2,967 event-running shops with distances from your zip, the distance dropdown, your own notes, verified local shops' online sealed stock hourly, and Events — every event near you for a month with fee, seats and a TCG+ Register link (the source became a chunked index on 2026-09-22 and the roster froze for six days under a green hourly; read both shapes since take 92, landmine 130) — in a Zoro-green palette, with stock alerts that fire on the flip at any tracked source, any event onto the calendar as an .ics, exact distances on request (takes 71–79), and the first distributor — GTS Distribution's One Piece list with release and preorder dates, sold out and allocated in its own words under each product it lists, the products it has before the catalogue does on Releases, and a distributor restock as an alert source (take 94; proven live on the runner and on the Fold), a tapped release opening the set's products and a stock alert on the sealed sheet (take 95), and where to buy — a chip per seller under each sealed row and a panel on its sheet, the seller's own page, a shop's address and Call, no logo and no referral (take 96), and Releases with starter decks folded per release day, the countdown coloured by nearness, Remind me (a notification the day before, scheduled and checked on open) and Calendar (an all-day event through the take-78 path) (take 97), and Southern Hobby, the second distributor, in its own words -- its dates and "in-store only" (take 112) BUILT; the distributor state timeline and the rest follow in A32 order | A32 |
| Importing from other apps (Collectr) | needs one real exported file; guessing the format would mis-key printings | A31 |
| Colour direction | D15; parked, not a priority | A24 |
| Icon motif | D7; the take-16 placeholder is back by request | A16 |
| A14 ML Kit language trim (3.8 MB raw of models, plus R8 on 23 MB of dex) | **PROVEN take 104 on the Fold** (the self-test's OCR read "OP01-016" on the shrunk build); the same run found R8 had dropped the notifications plugin's permission annotation (landmine 141), fixed at take 105 | A14 |
| Backlog 8.9–8.11, 8.13–8.16 | not scheduled; 8.12 done take 42 | ROADMAP Phase 8 |
| Other games | measured, one-app-per-game or packs; not before Play | A19 |
| Simulator step (2), the rest | more whole templates with tests; Event timings; chained sentences — coverage is 6.1% and grows only by whole templates | A23 |
| Simulator step (4) | two phones (D18); a stronger opponent is a different promise | A23 |
| The board on the Fold | two people, one phone; the curtain and the battle window unmeasured | A23 |

## What is NOT in the app, by design

No account, no server, no analytics, no crash reporting, no social feed, no
shop, no affiliate links, no bundled or cached art (card art is shown
hot-linked, display-only -- the owner's ruling at take 106, used from take 109),
no character or publisher mark in the name, icon, splash or store listing, and
no product box shot on a cover (take 62, A29). A market
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
