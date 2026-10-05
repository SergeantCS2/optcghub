# V1-STATE — what exists, as of take 143

*Current as of take 143.* The honest inventory: sorted into what is PROVEN on a
device, what is BUILT and verified in the harness, and what is DEFERRED with
the reason. Numbers are measured, not remembered; the take that measured
each is named.

## The app in one paragraph

OP TCG Hub scans One Piece Card Game cards by reading the printed number,
disambiguates the printing (base / alt-art / SP — the same number spans up to
4,292× in price, landmine 41), values the collection at TCGplayer market via
TCGCSV, and keeps everything on the phone with a backup that survives
uninstall. Three modes: **Collect** (home, search, scan, collection, trade,
wants, binder, checklists), **Prep & Play** (decks built against the
official Comprehensive Rules, a deck-building card browse, a Life/DON!!
counter, the hot-seat Sim) and **Hunt** (sealed products and their prices,
Releases, stock from Target, local shops and two distributors, Local,
Events; take 70 on). Rewarded ads gate *saving*, never scanning (A17). No
account; no server but the Sim's match relay, spoken to only while a player
hosts or joins a match (take 131, D18 by the owner's word); the other network
calls are the catalogue refresh from Pages (take 27) and Hunt's feed files
from Pages (take 71). Live on Google Play
since 24 Sept 2026.

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
  track created; app-ads.txt served from the root user site (take 40), which
  the listing names again since take 121 (it had moved to
  `https://sergeantcs2.dev/`, where the file was 404, landmine 209; the owner
  set it back the same day), AdMob's *Verify app* the owner's; the
  closed-testing release approved by Play review (take 52); **take 101
  uploaded to the closed track, the app APPROVED FOR PRODUCTION (24
  Sept, take 102) and LIVE on Google Play the same day (take 105:
  `play.google.com/store/apps/details?id=com.optcghub.app`, take 101's
  bundle; the owner's own Fold runs the Play build at 17 of 17)** — from
  here every take is one upload to the production track; the real AdMob
  rewarded unit IDs (D11) ride the take after he sends them (take 121:
  three, through `ads.live`, after the consent flow). The accepted
  upload proved the registered upload key is the one the secrets hold,
  and its fingerprint is pinned (take 103).
- **16 KB page size:** every arm64 native library in the APK loads at 0x4000
  alignment and is stored 16 KB-aligned in the zip (MEASURED take 34 on the
  take-32 APK). Play accepts it.

## BUILT and verified in the harness (Chrome + node), not yet on a device

| area | what | verified by |
|---|---|---|
| Scanner | *take 125:* the view the guide shows → a look (whole, the number's corner at 2x, CLAHE for glare; cards upright) → OCR's lines → the numbers on a card upright in the look, in the view (CODE_AT, MEASURED on 51 card pictures) and not contradicted by its own name → one number or "several" → the outline only where the number sits on it → face (SP text on the number's line / star template on a believed outline) → 2-of-3 vote, the number held while in view → confidence gate → auto or picker; batch persists; likelihood-ordered picker; the stages are src/scan.js | render.mjs pixel stages and the live loop end to end, smoke parse/vote/hold/rules, star port 30/30 vs Python (takes 10, 16); the owner's 29 upright frames with a camera-text reader standing in for ML Kit: 23 right, 0 wrong, and 0 wrong on 19 more on their side (take 125); take 123's stages read 0 of 15 of them |
| Catalogue | 6,862 cards + 658 sealed, 87 sets, from TCGCSV cat 68; keywords extracted (line-start rule); cleaned text; 3 days of price history, growing nightly | pipeline gate, validate.py 6 guards with negative controls |
| Values | market/low/high per printing; deltas labelled with the horizon they measured, never "yesterday" across a missed night (take 58); Market Movers; chart from snapshots (record) or history (estimate, dashed, purchase-date-aware) | smoke arithmetic vs the catalogue's own deltas |
| Collection | portfolios, conditions, graded, cost basis, favourites, bulk actions, filter/sort sheet (two scopes; the set chips returned nothing from take 11 to 89 — fixed take 90, landmine 126), a picture beside every card and set in every list (take 93; the grid, the sheet, the binder and the checklist had them since take 12), export CSV **via the share sheet on a device** (take 34, landmine 110), a self-contained share page (8.12, take 42), import CSV, auto-backup to Documents on every save, restore with a file-picker fallback; a card's sheet is a screen the phone's Back returns from (take 98, landmine 137 — from take 81 to 97 Back from a sheet left no screen on and the watchdog put Home back), its condition segment updates in place and says what it records (take 98), Home's most-valuable rows open the card (take 98) | smoke 255, render 51; **export/restore not yet seen on a phone** |
| Stock decks | 17 legal decks built from the ST sets, listed on the Decks screen (take 61; back there at take 109 -- the markup had them in the deck editor since take 66 at the latest, landmine 149), each showing its Leader's picture over the cover the app draws from the Leader colours and set code (take 62, now the picture's fallback), shown as *ready-made*, playable in the sim, **never in the collection** (take 61) | smoke 10 incl. the never-owned guard with a control; stockdecks.py 9 guards in the gate |
| Decks | legality per Comprehensive Rules §5-1 by section; advisor (curve, counters, blockers, triggers, life); Leader sheet; printing swap; import 5 list formats; export; value + history; sim-readiness and *Play this deck in Sim* (take 53) | smoke, two guards on R6 (number-keying) |
| Hunt | a third mode with its own palette; **Sealed** — 343 sealed products with market/low/high, nightly delta, search, kinds, alerts through the detail sheet; **Releases** — every set's publish date, upcoming with a countdown (take 70); *take 128 (D24 b):* Sealed lists a product a distributor, Target or a shop names before TCGplayer prices it, its row saying "no market price yet" | smoke 16, render 3 in Chrome; take 128's D24 section (5 checks, two controls) *Take 130:* Walmart, from its item pages on the runner (`sources.walmart`): a line under a matched product, a Where-to-buy chip, an alert source; the committed item list is a person's to grow; a shelf near a zip waits on a measured way to ask (A32) |
| Diagnostics | hidden behind five taps on More → About: live endpoint probes, storage, the last twenty errors — kept across restarts since take 91 — the self-test, copy or share (take 82). **More itself was unreachable from take 83 to take 90** (its section was built on demand and the take-83 guard refused it first; A37, landmine 128); a static section since take 91 | smoke 5 + the take-91 More and persistence assertions; render opens More and reaches Diagnostics in Chrome (take 91) |
| Prep & Play | mode slider + palette; Cards browse (keywords, colour, cost, text, for-this-deck); Play counter with §6-4-1 first turn and a *pass the phone* mode (take 44); **Sim: the hot-seat board** — two legal decks, the rules of RULES.md §3 enforced with sections cited, effects by hand through a tray, the curtain at every hand-over (take 46); **scripted effects** parsed from card text at build time, 2,161 of 7,553 lines (28.6%): chains, costs, continuous effects and keywords, follow-ons, searches in every phrasing, Events at both timings, cost changes, modifiers with honest expiries that follow their card, offered under their conditions with engine-computed targets (takes 47–51); **an opponent** — legal, not clever, never reads the hand — so one person can play (take 55); **take 122 -- the Sim rebuilt on an audit** against Comprehensive Rules **v1.2.1** (28 Aug 2026): one entry point (`SIM.act`), whose decision (`who`), the legal moves (`legal`), every move a transaction, a seeded shuffle so a game is its seed and its moves (`replay`); every effect line offered at its timing -- 2,481 of 7,720 scripted, the other 5,341 kept by hand: offered with only the moves their words name, or, for a continuous line no template reads, shown beside the card as the player's to apply -- Once Per Turn per card, the sixth Character and the second Stage by the rules, DON!! +1000 on its owner's turn only, given DON!! home when a card leaves, deck-out as rule processing, "during this battle" ending with the battle, [Unblockable], [Rush: Character], "cannot activate [Blocker]", an effect K.O.'s [On K.O.]; a Rules button on every Prep & Play screen (the digest, searchable, with Check for updates); each effect marked proven or unproven, and Report | render draws the dealt board; smoke 22 against §3, 40 on the effect classes, two whole bot games under a conservation invariant |; take 122: card proofs `tools/cards/` (25 cards -- ST01's and every ready-made deck's Leader -- 85 printings, 346 scenarios; 123 of 200 fail on take 121), self-play (`tools/selfplay.mjs`: bot, chaos and two apps under an auditor after every move, eight planted faults named; the whole-Sim review's sweep, 7,200 games and 1.68 million audited moves, clean after it found three engine faults), the gate's `check_sim`; take 123 -- **ready for the UI pass:** `SIM.view(seat)`, everything a board draws and nothing its seat may not see (the other hand, both Lives and both decks as counts, a look, an unused [Trigger] and an effect's choices and the legal moves to the seat deciding, no card that moved unrevealed named in the log, §3-2, §3-4, §3-10, §10-1-5), the board drawn from it alone, hot-seat players named Player 1 and Player 2, and `docs/SIM-UI.md`, the contract the owner's UI pass builds against (smoke: the view a pure read, no hidden card in the other seat's view with a planted leak named, no painter reading the engine with a planted read named; self-play: each seat's view audited after every move, three more planted faults; the look, take 123, a real hand-over in Chromium, 10 of 10); take 124 -- **the table** (the UI pass, the owner's to the session): an audit of take 123 first (a battle's result named the app's Life card to the human past the view -- now `view.last`, per seat; the log in words; the app's turn a move at a time; the tap handler from the painted view; faces on hand and deck choices; the painter guard over a whole block), then the playmat of hot-linked pictures, both halves mirrored, Life, Deck, Trash, Stage and DON!! as the table has them, a tap for a card's legal moves, targets lit on the table, the effect panel, the zoom, the log, motion, the full screen with Leave (forfeit and back), the icon's card backs, sizes solved from the space for phones, both Fold screens and tablets (smoke 1,476 with the take-124 section's controls; render's table in Chrome; the look, take 124, at four sizes -- the Fold's two MEASURED, a phone and a tablet INFERRED; not yet seen on the Fold itself); on the owner's word mid-take the backs in the game's colours and the screen used as fully as it can be (the open Fold's cards cover 64 % of it, 49 % before; the tablet's 51 %, 27 %), and his rule for testing the Sim: **the rulebook** (`tools/lib/rulebook.mjs`), the auditor's own model of the game from the rules, holds every self-play move to them -- the legal moves at every decision, the whole game after every move -- over every pairing of the ready-made decks and random legal decks, with the card's words checked against every scripted step; it found nine faults in the engine (an automatic effect declinable, §8-1-3-1; a used [Trigger] kept in hand; looked-at cards left out of the deck; an effect whose card had left waiting for any move; a begun effect dropped when its card left; "that card" with none chosen standing the game still; a by-hand Once Per Turn reading another card; what a step set off dropped mid-effect; a target never offered taken by a step whose condition was false), each fixed with a smoke scenario and a planted control (fifteen rulebook plants, each named); on the final build 4,000 self-play games (all 289 pairings and 2,000 of random decks, 839,198 moves) and 800 on two apps, 0 violations
| Trade | two lists valued with spread; paste their list; share summary | smoke |
| Wants & alerts | want list valued at likeliest printing; set checklist grid; binder pages; price alerts via local notifications, idempotent per catalogue date | smoke |
| Ads | AdMob 8.1.0; the store-linked AdMob app `~9519036366` (take 121; take 41 to 120 named "testing", landmine 210), approved "Ready" (30 Sept); **the owner's three rewarded units live from take 127** (Scan Credits, Deck Save, MAX Unlock), loaded only once UMP's consent allows ads (`consentAsk`, take 127; every older install keeps Google's test units); More's Privacy choices where UMP requires it; **a free save when no ad loads** (the owner's rule), the tray kept offline; MAX its own unit (landmine 211); credit ledger; pending tray; reward from the event only | smoke (the take-127 section: consent in both orders, the free save, the tray); the gate's `check_ads`; the look 127; **PROVEN on the Fold, take 121: the MAX and deck-save ads** |
| Onboarding | the opening screen and the first-open guide in the store listing's frame (take 116): four pages, one per mode and one for what stays on the phone, each with a real printing looked up when it opens; Next pages, Back closes it unseen, a dialog for screen readers; the key `optcghub.guide.v3`; the native launch image is the same scene, painted by `ci/icon.py`; **New in this update** on Home once per take, from the release note (take 53) | render 2; smoke 14; the look 18 |
| Packaging | signed APK (committed sideload key), AAB branch for Play (needs 4 secrets), one standard icon: the adaptive icon (background and foreground; no themed layer, at the owner's word), legacy and round icons, the reminders' glyph, the splash and the Play icon from four SVGs (`ci/icon.py`, checked, its controls in the gate; take 113, the owner's pick), CAMERA + POST_NOTIFICATIONS + AD_ID in the manifest | built every take since 9; signer verified by aapt2/apksigner |
| CI | build.yml on `main` only (seed → bundle → pages + apk → report), nightly 21:30 UTC with sidecar commit-back; **check.yml runs the whole pipeline on every PR with a read-only token (take 89)**; hunt.yml hourly; bootstrap.yml as recovery. Since take 89 the workflows live in git, byte-identical to their `ci/` copies, and a take is a PR the owner merges. *Take 115:* a report job that needs every job files one `nightly-failure` thread for any failed job and closes it only on a run where every job ran green, and the hourly does the same under `hourly-failure` (landmine 184); the nightly's Pages deploy reads the hourly's files again inside the `pages` group the hourly holds; the hourly validates the catalogue it deploys; the Release carries the Play icon; `apk.sh` stops on a Gradle failure (landmine 183) and `check.sh` fails when it cannot fetch main *Take 129:* `check.yml` builds the sideload APK and a dev-signed AAB on every PR through `ci/apk.sh` itself (A44 item 1), so a plugin, Gradle or R8 change is red on the PR before `main`; `package-lock.json` is committed and `seal.sh` keeps it | **ran green on a runner at take 32; APK installed by the owner.** Four red nights 09-18..21 read at take 89: the Events fixture's clock and the hashes guard's treatment of unpublished images (landmines 123, 124); both fixed with controls |
| Self-test | More → Self-test: 17 on-device checks (catalogue, gate, search, fonts, storage, Filesystem, share, camera, ML Kit on a drawn code, notifications, ads, sim, sync), shareable report | smoke 9; **run on the Fold at take 91: 16 pass, and the one FAIL was the check's own (`m.num`, landmine 131) — fixed take 92. On take 114 (the owner, 25 Sept): 17 pass, 0 fail, on the Play build** |
| Scrubber | comments stripped from the shipped app on every build; the gate refuses a first name, an AI-vendor name, the conversational word, a credential, a container path or a leftover to-do marker anywhere public | scrub.py --selftest 9 controls (take 102: the two literal file names pass as whole tokens, the vendor word beside them still fires); smoke 5 (take 35) |
| Typography | four roles (display / comic / body / heavy), OFL/Apache faces bundled, 232 KB, licensed faces as a file drop in `assets/user/fonts/` | render.mjs: Chrome reports all four LOADED and h2 resolves to the display face, with a missing-file control; smoke 7 |
| Design tokens (take 106, A42) | one scale for the whole app: type roles 12 to 44 px (nothing under 12), spacing, radii, thumbnail sizes, motion and a z scale; semantic colours per palette — the accent as text (`--accent-ink`, Prep & Play `#E5705C`), the label on the accent (`--on-accent`), a control edge at 3:1 (`--line-strong`), tints mixed from each palette; the charts read the palette they are drawn in | smoke take-106 section (contrast per palette on card and card2, no font size under 12 px, every glyph a call names in the sprite); the look, take 106, 7 of 7 at both viewports |
| One header on every screen (take 107, A42) | a `header.appbar` in all twenty screens: the title an `h1` in the display face at 26 px in the mode's accent, at one height; one line under it where a screen has one; the gear to More last on the twelve screens in a nav, in all three modes (A37); the back arrow on the eight one level down (the phone's own Back path); Home's two views a tab row; every sheet a titled head and a close button; Back closes the filter, Leader and printing sheets first (landmine 144) | smoke take-107 section (every screen's header, Back, the gear, the sheets, the handlers; watched to fail on take 106); render (twenty titles measured in Chrome: one height, size and face, two lefts, the gear in one spot; the arrow, Back over two sheets, the ask sheet's cross); the look, take 107, 11 of 11 at both viewports |
| The light theme (take 120, A42) | a second axis beside the three palettes: More → Appearance, Dark (the default) / Light / Auto (the phone's dark mode, followed live); in light each mode keeps its own ground -- parchment for Collect, chalk for Prep & Play, cream for Hunt -- every colour token redefined, the tints mixed from them, the fill a deeper gold that clears 3:1 on the card; the status bar told LIGHT or DARK through `@capacitor/status-bar`; and the series' riders: the binder a spread of two pages on the open Fold (the pager by two), a product with no market price saying so, the Sim's battle lines, a deck row's second line and a set's name wrapping, a Sealed row's kind in the singular, the two sheets' refused pictures showing the number | smoke: six palettes' contrast from the shipped rules (every text on every tint), the blocks' token sets, the switch live in the stub (the store, the root, Auto through a planted matchMedia, the bar); render: the switch tapped in Chrome, the three light grounds, the total's clip, Auto with an emulated phone both ways; the look at both Fold sizes ({LOOK} steps: the binder's spread at 749 with nothing to scroll, a deck's rows unclipped) |
| The art layer, first half (take 109, A42) | the picture measured first: TCGplayer's largest (`_in_1000x1000`) 600x838, up to 716x1000; Bandai's 600x838; the SAMPLE stamp on 38 of 40 card pictures at the two hosts, always one band at about 45-60 % of the card (landmine 151); the retry to `<id>.jpg` never served (403 for 241 of 241, landmine 150) and is gone. Decks opens under the featured deck's Leader (C: the art blurred from above the stamp, the card rising from behind the title with only its top 42 % showing -- gone at take 110, the owner's word; the title in A's slot); the ready-made decks back on Decks with their Leaders' pictures; a deck's Leader at 96 px; a card's own page over its own colours with the card at up to 196 px; the 600x838 picture only when the build's runner saw it serve; offline, the card's own colours; Home has no banner (the owner's ruling) | smoke take-109 section (the picture's address from the printing's own URL, the large size only when measured, the hero's place, the ready-made decks' screen, the colours; watched to fail on take 108); render (the fallbacks with pictures blocked, the crop above 42 %, no sideways scroll, the 44 px squares); hashes.py's large-size probe with its control; the look, take 109, with real pictures |
| The UI series' second half (take 110, A42) | Sealed under the newest set's top card (sharp, cut above the stamp) and every Sealed heading a strip; each Leader faint behind its side of the Play counter; the owner's hero-play.jpg and hero-hunt.jpg; at the owner's word no card rises from behind Decks' title, the blur shows the band above the stamp whole (the whole card in a blur still shows the stamp, MEASURED) and three texts are gone. The voice: Collection for Portfolio (the CSV and the backup keep `portfolio`), sentence case, one word per thing, money that keeps its currency, one percentage rule, days and moments in words, every field named. Polish: motion from the tokens, a sheet that rises, a mode switch that crossfades, one empty state, tabular figures, three thumbnail sizes. The Fold's inner screen: two panes from 700 to 899 px (its width INFERRED). Bulk delete, move and condition take the lines on screen -- the collection, the star, the filter, the search (landmine 155). A review after the first push: the currency sign read from the currency shown (landmine 157); words over art measured from pixels, 4.5:1 or better at a yellow card (landmine 158); a rising sheet ignores a tap on its scrim (landmine 159); the open Fold's grid spans what is not a row, and Local is one column (landmine 160). | BUILT; smoke, render in Chrome and the look (34 steps at both sizes) |
| The last look (take 111, A42) | every screen and the sheets read at both of the Fold's sizes (34 views each) and what they showed put right: a row's small line joins the parts it has (a printing with no number opened it with a dot); the filter counts results and lines; a printing's badge is never cut by the ellipsis (AGENTS rule 3; landmine 164); the bulk bar two lines on a phone; a card's page with a Watch panel apart from Graded, one triangle, and a sealed product's page with its kind, no Graded, no Want and no list of the 674 printings with no number; a DON!! card's page a card's (253 are filed as sealed; landmine 162); Set completion counts numbered cards of the collection on screen; the card page's Save, stepper and cost basis keep to the collection it names, and a slab is a line of its own (AGENTS rule 5; landmine 163); the binder opens at the first held card; a deck's value counts its Leader, as its history does; rows centred on their picture, the Sealed bell with them (landmine 161); CHF named once, About's day in words, Scan's note inside the margins, Local's sentence whole | smoke take-111 section and render (bulk bar, row centres, the alert line, the deck prompt, Scan's note, badges, the bell), watched to fail on take 110's app; the look, take 111, 68 of 68 |
| The second distributor (take 112, A32) | Southern Hobby's One Piece list, read hourly on the runner: 20 products; from each product page, when stores must order, the release and prerelease days, and "in-store only". Matched through the unit it is sold as: a case only to a case, and a starter deck or double pack only once its unit is read. On Sealed, beside GTS's, one short line each -- its name and its state -- a 44 px target that opens the product's page at its Distributor info (its full words and its own page); on Releases a set's row carries the same short lines as text, and a tap on the row opens the set (take 115's review: a button cannot hold another); the long notes sit under closed "Distributor info" drop-downs, at the owner's word. A product with no photo yet shows its set's code, not an empty white card | hunt.py selftest 90 (the page budget, the unit and the item checks, each with a control); smoke 988 in all; render 187 in Chrome, real taps on the drop-downs and on a row's distributor line; one live fetch from the VM, 20 of 20 with 20 pages read; the look, 22 of 22 at both sizes |
| The distributor timeline (take 114, A32) | On a sealed product's page, each distributor's history on file, inside the closed Distributor info and tucked behind one "History · …" line until tapped (the owner's word). It gives the checks and their days and the state at the first check, never "since". Each change sits between its two checks, read off the page or worked out from its dates, with the distributor's own day when its dates put it there. GTS's date is its Order Due Date ("stores order by"), and the GTS stock alert counts only stock for stores. The hourly stops rather than deploy a history that lost its past | BUILT: smoke, render (Chrome), the hunt selftest and the look. PROVEN when the first real change reaches the rows (INFERRED: PEB-01, 15 Oct UTC) |
| The production baseline (take 115) | A two-axis review of takes 106-114 and three sweeps; every confirmed small finding fixed with a check watched to fail on take 114: the scanner's index rebuilt on every load (a sync had doubled it, landmine 176); stored values read and written through one reader and one writer, an unreadable collection kept aside and every backup held until a restore (177); a synced catalogue checked against the bundled one before it is written, the bundled one at launch when a synced copy fails; a deadline on every request; one commit path for the collection that backs up every change (179), a backup that carries the stock alerts, reminders, notes and trade lists, and a restore that checks its file and keeps what it replaces; the picker's prompts settled every way they close (178); the binder's page turns, the featured Leader, an alert in the currency on screen, the alert's fired day; a kept distributor 'not reached' everywhere (180); Target's history in days; the sealed-only set back (181); Diagnostics' counts that say what they count; contrast per palette, nothing under 12 px as drawn, one glyph per meaning, aria-pressed and aria-selected, the Sim's short labels; the runner's report job, the pages group, the hourly's validate, the scrubber at every level (182). Its self-review of its own diff (36 agents) fixed fourteen more: a full storage that lost a scanned batch or the pending tray (194), a backup hold for every list the backup carries, a restore that kept only a copy Restore never offers, Target's line counting only the runs that read the product, a never-read source's 'when last tried', the hourly's validate without the hash coverage only the nightly can meet (200), and checks that could not fail or would have gone red as TCGCSV lists new sets (195-199) | BUILT: smoke 1248, render 215 in Chrome, the look 36/36 at the MEASURED sizes, every tool selftest. Not yet seen on a phone: a commit or a drained tray on a full storage, the backup hold and its words, a stalled sync recovering, the 'Restore from' sheet, its second question and backup-before-restore.json, re-armed reminders, the next distributor timeout read as not reached |
| Controls and icons (take 108, A42) | every icon a sprite symbol with one meaning (Lucide's for the interface, ISC and MIT, their notices shipped in the sprite and credited in About; the game's own glyphs keep the game's meanings); every control a 44 px target -- a real 44, or a 44 px hit area round a drawn chip; a pressed look and a disabled look; every icon button named, every toggle `aria-pressed`; the scanner's shutter row above the nav (landmine 146) | gate: no icon drawn as a character (probes plant one literally and as an escape); smoke take-108 section (the glyph map as a table, watched to fail on take 107); render: every control's 44 px square on twenty screens and three sheets in Chrome (a 34 px stepper as its control), the scanner above the nav, a held press, a disabled button; the look, take 108, 10 of 10 at both viewports |
| Sync | quiet once-per-open sync holds on cellular unless switched on; Sync now always runs; `UPDATE_URL` points at Pages | smoke 4 controls; **not yet seen on the Fold** |
| A scanned line's picture by choice (take 128, the owner's note) | a line with the collector's own photo carries an arrow on its tile; a tap on it, or a sideways swipe across the picture, flips the tile between the photo and the catalogue's picture; the choice is the line's (`pic: 'ref'`, or absent), kept through `commitOwn` so the backup and the restore carry it, and honoured wherever the photo is drawn (the tile and the binder's pocket, one rule: `linePic`); a vertical drag stays the page's | smoke (the rule, the tile, the flip both ways, the stored line and the backup, the swipe's decision, the binder, the stylesheet); render in Chrome (the arrow's 44 px target at the corner, a real tap that flips and does not open the card, a finger across the picture through CDP touch, a finger up and down that flips nothing); the look, take 128, 16 of 16 at both Fold sizes -- the first look found the card opening under the tap (landmine 244) |
| An update notice from Google Play (take 128, the owner's question) | Play's own answer through `@capawesome/capacitor-app-update` (`PLATFORM.appUpdateInfo`, `openStore`): on its own -- at every launch (after the first-open guide and the consent message), on return to the front six hours or more after the last check, and every six hours while open -- the app asks Play; a newer take opens a sheet once per version (Update opens Play, Later is remembered), More → About carries a Google Play row ("Take N is on Google Play -- you have take M", "Up to date on Google Play", or why Play could not be asked) with Update or Check for updates, and Diagnostics an `update:` line; a browser or a sideload shows nothing and says why under About | smoke (a planted plugin: the newer take, the sheet once per version, Later, up to date, an answer that says nothing, a sideload's error, no plugin, offline, Diagnostics); render in Chrome (the sheet from a planted answer, a real tap on Update, the About row, a real tap on Check for updates); the look, take 128. **INFERRED on a device**: the plugin's first build is the merge's `apk` job; the Fold proves it beside a newer take on Play |

**The look (take 99, A40):** `tools/look.mjs` — the session's own review,
not CI: the built app in the VM's Chromium (Playwright, installed globally
there) at the Fold's two sizes, a per-take step list of real clicks and
`window.VAULT` calls (`tools/look/steps.mjs`), a PNG and a measured line
per step under `look/` (gitignored), read by the session and sent to the
owner before a PR is marked ready. Its first run, on take 98's changes,
found the toast wrapping into a tall half-width pill and a sealed sheet's
subtitle ending in two stray dots — both fixed the same take. Limits:
no camera, notifications, share sheet or native Back. Since take 109 the
VM reaches the picture hosts and the look fetches its pictures through
Node (landmine 152). Its two sizes are the Fold's, MEASURED from the
owner's Diagnostics on take 114: the cover 411 x 960 and the open screen
749 x 832, both at 2.625 (take 115). An emulator was measured impossible here (no KVM, no SDK,
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

**The host's placeholder (take 126, landmine 240):** TCGplayer serves one
"Image Coming Soon" picture, 200 OK, for some products; the hash step had
hashed it as the picture of 22 card printings and never fetched them again.
PROVEN 30 Sept, every hashed picture fetched again: 6,749 card pictures
portrait (1.295 to 1.5 times as tall as wide), the 22 at 200 x 115, and one
sealed product (606589) with the same picture; the second host serves its own
copy for the same ids. The hash step now judges a picture the night it is
fetched -- a card picture that is not card-shaped, or any picture within 6
bits of a placeholder hash on file (learned, never typed), is a miss, retried
every night -- and the build ships those printings no URL and no hash, so
every screen draws them as a card with no picture. The gate's
`check_pictures` refuses a hash on two names, one near a placeholder hash, or
a URL for a printing the runner saw serve it. The Sim, which plays the card
and not the printing, draws a card with no picture of its own from another
printing of it (194 of 257 card printings; the 63 left are EB05's and OP18's,
not yet photographed); Collect does not (landmine 241).

**Harness totals, take 115:** smoke.mjs 1248 assertions, render.mjs 215 in Chrome at the Fold's MEASURED sizes (411 x 960 and 749 x 832 at 2.625) in America/New_York, the look's take-115 list 36 of 36, hunt.py --selftest 135, hashes.py 23, ci/icon.py 28, scrub.py 11 (85 files), ci/apk.sh 7, ci/check.sh 6, gate.py's probes 21. Every take-115 check was watched to fail on take 114's build, and the self-review's on the build it reviewed (8f5034b), or on a planted fault.

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
| Scanner field half — ML Kit's reads and speed on the Fold; the printing from the picture (base / alternate art / manga) | the rebuilt stages (take 125) are measured on the owner's photographs with a stand-in reader; the art hash and an outline from the number are measured and deferred | A2's take-125 section |
| First real-ad impression | take 127's units after the merge and upload; the owner's Fold is a test device, so its ads read "Test Ad"; earnings in AdMob about a day after real users watch. The consent message in the EEA is proven by smoke's stub only -- the US Fold gets NOT_REQUIRED | A17, RUNBOOK-play §9 |
| First notification | needs a phone | 8.5 |
| The update notice on the Fold | the plugin (`@capawesome/capacitor-app-update`) is first built by the merge's `apk` job; the sheet, the About row and the Diagnostics line are proven against a planted plugin in the stub and in Chrome; a take-128 Play build beside a newer take on Play is the proof | HANDOFF take 128 |
| Export and restore on the Fold | share sheet and file picker are INFERRED from the plugin definitions until seen | landmine 110 |
| The backup after a reinstall on the Fold | take 121 on the Fold failed every backup: the uninstalled sideload's `backup-latest.json` is not this install's (landmine 239); take 125 writes a name this install owns and keeps a failure's reason -- PROVEN in smoke with Android's `EACCES`, the Fold's next backup is the proof | HANDOFF take 125 |
| First Sync on the Fold | `UPDATE_URL` is set; the first *Sync now* that shows a date proves Pages and the URL | RUNBOOK §5 |
| Real AdMob unit IDs | *closed at take 127*: the owner's three units under the linked app, in `ADMOB_LIVE_*` from take 127, with the consent flow (A43's item, the owner's worldwide answer) | A17, D11 |
| The named fonts as files | D16; the roles ship with free faces, the slot takes licensed ones | A26 |
| Whether the faces themselves fit | the colour and contrast are fixed (take 60); whether Luckiest Guy and Bangers are the right faces is D16 | A26 |
| A TalkBack session on a phone | every control has a name and the roles are right (take 66); whether the order and wording make sense needs a person | A30 |
| Focus order | the ring exists (take 80); tab order across screens is unreviewed | A30 |
| Hunt mode — local shops, reprints, the preorder watch, per-user zips | Sealed, Releases (take 70) and the hourly Target feed — online stock for all of the US, shelf stock per served zip with a zip pop-up, a fortnight of hourly history turned into dated restocks per store, and Local — 2,967 event-running shops with distances from your zip, the distance dropdown, your own notes, verified local shops' online sealed stock hourly, and Events — every event near you for a month with fee, seats and a TCG+ Register link (the source became a chunked index on 2026-09-22 and the roster froze for six days under a green hourly; read both shapes since take 92, landmine 130) — in a Zoro-green palette, with stock alerts that fire on the flip at any tracked source, any event onto the calendar as an .ics, exact distances on request (takes 71–79), and the first distributor — GTS Distribution's One Piece list with release and order-due dates (landmine 172), sold out and allocated in its own words under each product it lists, the products it has before the catalogue does on Releases, and a distributor restock as an alert source (take 94; proven live on the runner and on the Fold), a tapped release opening the set's products and a stock alert on the sealed sheet (take 95), and where to buy — a chip per seller under each sealed row and a panel on its sheet, the seller's own page, a shop's address and Call, no logo and no referral (take 96), and Releases with starter decks folded per release day, the countdown coloured by nearness, Remind me (a notification the day before, scheduled and checked on open) and Calendar (an all-day event through the take-78 path) (take 97), and Southern Hobby, the second distributor, in its own words -- its dates and "in-store only" (take 112), and the distributor state timeline on a product's page (take 114) BUILT; date moves, delisted items, the Releases list's history and the retailers that need a residential IP follow in A32 order | A32 |
| Importing from other apps (Collectr) | needs one real exported file; guessing the format would mis-key printings | A31 |
| The icon on the Fold | the owner's check: the launcher on both screens, the splash, a reminder's ドン!! glyph (landmine 170); the APK was decoded after take 113's merge | A16 |
| A14 ML Kit language trim (3.8 MB raw of models, plus R8 on 23 MB of dex) | **PROVEN take 104 on the Fold** (the self-test's OCR read "OP01-016" on the shrunk build); the same run found R8 had dropped the notifications plugin's permission annotation (landmine 141), fixed at take 105 | A14 |
| Backlog 8.9–8.11, 8.13–8.16 | not scheduled; 8.12 done take 42 | ROADMAP Phase 8 |
| Other games | measured, one-app-per-game or packs; not before Play | A19 |
| Simulator step (2), the rest | more whole templates with tests; Event timings; chained sentences — coverage is 6.1% and grows only by whole templates | A23 |
| Simulator step (4) | two phones (D18); a stronger opponent is a different promise | A23 |
| The board on the Fold | two people, one phone; the curtain and the battle window unmeasured | A23 |
| Two phones across the internet | *Take 131:* the relay's suite (58 checks, four plants named) and the exchange against the real Worker under `wrangler dev`; two app copies on the in-memory relay in smoke; the look with two browser contexts. A match between two real phones waits on the owner's deploy (RUNBOOK §9) | A23 step 4, D18 |

## What is NOT in the app, by design

No account, no server but the match relay (take 131, D18, the owner's word:
spoken to only while a player hosts or joins), no analytics, no crash
reporting, no social feed, no
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
- The number's line sits 0.950-0.958 down and 0.817-0.853 across a card, on 51 CDN pictures of 17 numbers (take 125)
- Take 123's stages on the owner's photographed frames: 0 of 15; take 125's: 23 of 29 upright frames right, 0 wrong (a camera-text stand-in for ML Kit)
- A photo's art hash: the owned printing nearest in 5 of 6, but a 4 % crop error flips a parallel to its base (take 125)
- The card's name as a one-read confirmation would confirm 680 of 64,428 one-digit misreads (take 125)
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
