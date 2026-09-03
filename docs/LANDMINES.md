# LANDMINES

*Current as of take 52.*

Numbered so they can be cited. Never renumber. Add, correct, or mark superseded —
but the number stays with the finding.

Entries 1–40 are this project's. §2 carries the APEX ORV findings that transfer,
cited by their APEX number with an `A-` prefix so the two ledgers never collide.

---

## §0 — Symptom index

Start here. Do not read top to bottom.

| What you're seeing | Landmine |
|---|---|
| Portfolio total is wildly wrong | 1, 2, 4 |
| A $467 card entered as a $1 card | 1, 2 |
| Scanner reads the code but picks the wrong printing | 2, 12, 13 |
| Prices all identical to a stale date | 3, 6 |
| Condition changes do nothing to value | 4 |
| Catalogue fetch returns zero rows, no error | 5 |
| Catalogue built but half the sets missing | 5, 6 |
| Nightly build succeeded, catalogue is yesterday's | 6, 7 |
| A price moved 300× overnight | 7 |
| OCR reads the code on plain cards, fails on foils | 10, 11 |
| Card outline never detected in a toploader | 14 |
| Scan works on the bench, fails at a shop table | 10, 14, 15 |
| Same card scanned twice creates two rows | 16 |
| Scanning is slower than typing | 17, 18 |
| Collection gone after reinstall | 20, 21 |
| Restore succeeded, quantities wrong | 21 |
| Catalogue update wiped user data | 22 |
| App rejected by Play for IP | 30, 31 |
| Play upload rejected, "already used" version | 33 |
| APK installs beside the Play build instead of over it | 34 |
| Testers' 14-day clock keeps resetting | 35 |
| Sideloaded APK blocked on install | 36 |
| Camera permission granted, preview black | 40 |
| Scanner reads the code but 12 cards match | **41** |
| Ingest refuses on a set that isn't out yet | 42 |
| OverflowError inserting a hash into SQLite | 43 |
| Catalogue has more rows than it has cards | 44 |
| Hash separates the catalogue but not a real photo | 45 |
| Hash coverage resets to zero every build | 46 |
| Long job dies silently mid-run | 47, 48 |
| Progress line looks fine, output is missing | 48 |
| Hash 'matches' two cards that look nothing alike | 49 |
| App freezes on the first scan, no error | **50** |
| A strict check can never pass | 51 |
| Negative controls stop running after a schema change | 52 |
| Uploading a seed starts no workflow at all | 53 |
| Second grid column off the side of the screen | **54** |
| Page scrolls sideways on a phone | 54 |
| A guard "doesn't work" when you try to break it | 55 |
| Gradle syntax error after a CI config patch | 56 |
| mergeReleaseAssets: Duplicate resources | 57 |
| Removing a file from the build changes nothing | 57 |
| APK is enormous | 58 |
| Gradle: does not provide JAVA_COMPILER | 59 |
| Scanner asks about a card that says what it is | **60** |
| A $78 alt-art entered as a $5 base card | 60 |
| Star detector fires on an ornate background | 61 |
| Tests go red overnight with no code change | **62** |
| OCR reads 'nothing' at every resolution | **63** |
| A detector that works on renders and fails on photos | 64 |
| Widening a search made accuracy worse | 64 |
| Scanner is accurate and almost never reads anything | 65 |
| Deltas never appear; yesterday keeps vanishing | **66** |
| >10x price alarm on a card that did not move | 67 |
| Every card shows 0.00% on a fresh install | 68 |
| versionCode is empty in the built APK | 69 |
| A deferral survives three takes unchanged | 70 |
| Scanner stage passes in smoke, fails in Chrome | 71 |
| "Camera unavailable: permission denied" | **72** |
| OCR plugin call rejects the image | 73 |
| Deck builder says 4x more Rush than the deck has | **74** |
| Text ghosting through card art | 75 |
| A phrase greps four times in one ledger | **76** |
| smoke.mjs dies with SyntaxError before any test | 77 |
| App icon is Capacitor's logo | 78 |
| Collection stops saving around card 100 | **79** |
| A §9 requirement never appears in DEFERRED | 80 |
| Thousands of 'duplicate printings' on a correct bundle | 81 |
| App draws under the status bar / gesture bar | **82** |
| "My collection didn't save" after scanning | **83** |
| Picker always shows the wrong printing first | **84** |
| Blank grey boxes in the picker | 85 |
| A triangle on its own line above a price, again | 86 |
| A doc is missing from the seed | 87 |
| A screen says something the design no longer means | 88 |
| Gate says: no HANDOFF entry for this take | 89 |
| An overlay says it is shown and nothing appears | 90 |
| Chart looks the same on a fresh install as a year in | 91 |
| Prices a week old and nothing said | 92 |
| The gate's ceiling says zero, the app has six | 93 |
| Play rejects the Data Safety form after adding ads | **94** |
| Closing an ad pays the same as watching it | 95 |
| Want to rename the app after it is on Play | 96 (urgency withdrawn, 97) |
| A ledger deadline that was not one | 97 |
| The wrong nav shows after switching mode | 98 |
| A literal \\u2699 on a button | 99 |
| A feature is green in smoke and does nothing on screen | **100** |
| A set checklist starts at 026 | 101 |
| Prices never change on an installed phone | **102** |
| A sealed seed with a red gate | **103** |
| A landmine cited in the session that is not in the file | **104** |
| Every 7d/30d delta empty forever after launch | **105** |
| Pipeline stops on the first new card of a set | **106** |
| Failure issue never appears after a red night | 107 |
| bootstrap ran green and no build followed | **108** |
| Nightly commit says today, the file gained yesterday | 109 |
| Export CSV says "Exported" and no file appears on the phone | **110** |
| Restore says "No backup found" right after a reinstall | 110 |
| A smoke assertion passes on a comment, not on code | 111 |
| Public repo names people, tools, or a container | 111 |
| Render says 10 passed (mode: dom) right after a seal | **112** |
| A ledger script changed some files and not others | 104, 112 |
| An effect says "gives 2000 power" to an opponent's card | **113** |
| Two engine actions share a name | 113 |
| Pipeline stops on a resumed run | 51 |
| Map/canvas renders in browser but not in the APK | A-1 |
| Works on wifi, dead offline | A-3, A-4 |
| A gate check stops running for no reason | A-33 |
| A verifier passes while the product fails | A-39 |
| Test fails but the product is fine | A-54 |
| CI builds an app you do not recognise | A-35, A-199 |
| Fresh repo cannot rebuild the data | A-32 |
| A failed assert silently drops the whole patch | A-99 |
| checkout lands on the triggering commit | A-85 |
| Seed job dropped from a pasted workflow | A-202 |

---

## §1 — Known-good references

- **TCGCSV** — `https://tcgcsv.com`. Free daily mirror of TCGplayer catalogue and
  pricing. One Piece Card Game is `categoryId 68`. Source and infrastructure are
  public on GitHub (`CptSpaceToaster/tcgcsv`). Patreon-supported; there is a
  Discord for the maintainer.
- **`@capacitor-mlkit/text-recognition`** — 8.2.0, Capacitor 8, Apache-2.0.
  Same Capacitor major as APEX ORV.
- **APEX ORV** — the sibling repo. `tools/gate.py`, `tools/smoke.mjs`,
  `tools/render.mjs`, `ci/build.yml` and `ci/apk.sh` are the working reference
  implementations of everything structural here.

---

## Landmines

**1. A card number is not a product. MEASURED at take 1, on the owner's own card.**
`EB03-024` resolves to three TCGplayer products in the same set:

| productId | name | market |
|---|---|---|
| 672767 | Nefeltari Vivi (024) | **$1.48** |
| 672768 | Nefeltari Vivi (024) (Alternate Art) | **$23.36** |
| 672822 | Nefeltari Vivi (024) (SP) | **$467.33** |

Same number, same rarity (SR), same set. **316× spread between the cheapest and
the dearest.** Anything in this codebase that keys identity, quantity or value off
a card number is wrong, and will be wrong by two orders of magnitude on exactly
the cards that matter most. `productId` is the unit. AGENTS §3 and the gate's
`check_variant_keying()` exist because of this entry.

**2. The variant lives in the product NAME, not in a field. PROVEN take 1.**
TCGCSV `extendedData` carries `Number`, `Rarity`, `Color`, `Cost`, `Power`,
`CardType`, `Counterplus`, `Attribute`, `Subtypes`, `Description` — and **nothing
that distinguishes base from Alternate Art from SP**. The only discriminator is
the parenthetical suffix on `name`. Parse it, normalise it into a `variant_kind`
column at build time, and never re-derive it at runtime. Note that the reference
app displays these names verbatim — "Nico Robin (Alternate Art)", "Shanks (001)
(Parallel)" — which is a hint that it does the same join and never solved this
more elegantly either.

**3. TCGCSV updates once daily, around 20:00 UTC. PROVEN take 1** —
`last-updated.txt` read `2026-08-31T20:06:16+0000`. Schedule the nightly build
*after* that, not before, or every build ships a catalogue one day stale while
reporting itself current. Read `last-updated.txt` in the pipeline and record it
in the manifest; the gate compares it against the build date.

**4. TCGCSV publishes no SKU data, therefore no per-condition prices. PROVEN
take 1**, stated plainly on their own front page. Prices arrive per *product*
per *subTypeName* (Normal / Foil) — market, low, mid, high. There is no "Lightly
Played" figure and there never will be from this source. Consequences:
- Condition is a label the collector asserts, not a valuation input.
- The app must not apply invented condition multipliers (PROTOCOL §10.3).
- If per-condition value is ever wanted, it needs a different source and a
  different agenda item. Do not fake it in the meantime.

**5. A blocked fetch returns an empty list, not an error. MEASURED take 1.**
Eight-way parallel requests with Python's default `urllib` User-Agent returned
**0 products across all 87 groups** and raised nothing that stopped the run —
the script printed a tidy table of zeros. The same requests with a declared
User-Agent, sequentially, returned 7,518 products in 11 seconds. Two rules:
- Every outbound request declares a User-Agent naming this project.
- The fetcher asserts a non-empty result per group and fails loudly. A zero is
  never a valid answer for a group that exists in the group manifest.

This is the local instance of APEX landmine 74 (HTTP 200 with an empty body) and
it fired on the very first real fetch of this project.

**6. Cached payloads hide a dead fetcher.** `tcgcsv_cache/` makes a broken
producer invisible: the join succeeds against yesterday's file and the catalogue
builds green. PROTOCOL §6b clean runs are the only thing that finds this. The
gate additionally requires the manifest's `fetched_at` to be within 36 hours of
the build.

**7. One bad upstream decimal destroys a portfolio chart.** A product whose
market price moves more than 10× day-over-day is far more likely to be a data
glitch than a market event. The pipeline fails the build on it and names the
product rather than shipping it. Also cap what the UI is willing to render as a
daily delta; a 4,000% badge is never information.

**8. The catalogue is small. Do not architect as if it were not. MEASURED take 1:**
87 groups, 7,518 products, of which **6,860 are cards** and 658 are sealed
product. 7,317 price rows. The entire catalogue and every price fetches in
**174 HTTP requests, 11 seconds**. Perceptual hashes at 8 bytes each are 55 KB
for the whole game. There is no need for delta sync, no need for a vector index,
no need for pagination. Rebuild it whole, every night. Complexity added here is
complexity spent on nothing.

**9. Sealed product is 9% of the catalogue and cannot be scanned.** 658 of the
7,518 products are booster boxes, packs and decks — no card number, no card face,
often a large share of a collection's value. They are legitimate collection items
and they are *manual entry only*. Filter them out of the scan index (they have no
`Number` in `extendedData`) but keep them in the search index.

**10. Foil glare is the primary OCR adversary, and every valuable card is foil.**
PROVEN by the catalogue itself: all three `EB03-024` printings carry
`subTypeName: Foil`. The cards worth getting right are exactly the hardest to
read. Mitigations that must exist before any accuracy claim is believed: temporal
voting across frames, exposure metering locked to the code region rather than the
art, and CLAHE on the crop. UNKNOWN until Phase 0 measures it on the Fold.

**11. Restrict the OCR charset.** One Piece codes match
`^(OP|ST|EB|P)\d{2}-\d{3}$`. An OCR pass allowed to return the full Latin
alphabet will return `EBO3-O24` and `EB03-D24`. Constrain the recogniser, and
normalise `O→0`, `I→1`, `S→5` inside numeric groups before matching. This is
cheaper and more effective than any model change.

**12. Confidence thresholds are asymmetric on purpose.** A picker shown
unnecessarily costs one tap. A wrong auto-accept silently misprices a line item
by up to 316× (landmine 1) and the collector does not find out until they try to
sell. Bias to the picker. Every auto-accept threshold in the code carries a
comment naming the measurement that justified it.

**13. Parallel and Alternate Art frequently share art.** The dHash discriminator
works when the art differs. Where a parallel is the *same* art with a different
foil treatment, hashing cannot separate them and the picker is the only correct
answer. Do not tune the threshold until it "works" on these — record them as a
known picker-always class instead.

**14. The card outline detected in a toploader is the toploader.** Rigid holders
are a different aspect ratio from the 63×88 mm card (0.714). Filter quads on
aspect ratio and the holder is rejected — but so is the card inside it, because
the holder's edge is the higher-contrast one. Sleeved and toploadered cards must
be in the Phase 0 sample; testing on loose base cards produces a false-positive
feasibility result. The owner's most valuable card is in a toploader in his own
screenshots.

**15. Bench light is not shop light.** Every accuracy figure carries the lighting
it was measured under. A number from a desk lamp is not evidence about a card
shop table or a convention hall.

**16. Duplicate scans must increment, not insert.** Scanning a playset of four
should produce one row with quantity 4, with a visible `×4` badge so a runaway
double-count is catchable. An 800 ms cooldown after each accept stops the same
card being counted twice while the hand moves.

**17. The scan loop is the product; 1.5 s per card is the budget.** If bulk
scanning is slower than typing card numbers, the feature has failed and the
project has no reason to exist — the whole premise is that a 25-scan cap makes
bulk entry unusable. Treat a regression here as a P0 bug, and measure it in the
smoke harness rather than by feel.

**18. Auto-capture, or it does not count.** The collector is looking at the
cards, not the screen. Require a stable match across three consecutive frames,
then fire, with haptic and tone. A shutter tap in the happy path costs a second
per card and 300 cards of attention.

**19. Batch commits at the end, never mid-batch.** A review list before anything
is written catches errors while they are still cheap. Undo-last must be one tap
throughout.

**20. Export exists before charts exist.** A collector who scans 2,000 cards over
six months and loses their phone has been served worse by this app than by the
subscription product it replaced — that one at least had a server. CSV export,
auto-backup on every batch commit, and Android Auto Backup for `user.db` are
Phase 5 items under PROTOCOL §9 and do not get deferred for a nicer chart.

**21. Restore is not tested until it has been tested.** Wipe the app, restore
from backup, diff the collection. If that has not been done this take, restore is
UNKNOWN, not working.

**22. Two databases, or a catalogue update will eat a collection.** `catalog.db`
is generated, read-only and replaceable wholesale. `user.db` is the collector's
and is never touched by sync. Cross-reference by `productId` string, not by
foreign key. Every catalogue schema change is otherwise a risky user-data
migration, and it will eventually be run at 1am.

**23. `productId` is the join key and it must be stable.** It is TCGplayer's, not
ours, and it survives set reprints and name corrections. Store it as a string.
Do not mint local ids that need remapping when the catalogue rebuilds.

**24. Japanese printings are a different catalogue.** TCGCSV category 68 is the
English One Piece Card Game. JP cards carry different codes and different prices,
frequently by 10×. Out of scope for v1 — but the scanner must *detect and refuse*
a JP card rather than mismatch it to the EN printing that shares its number.
An honest "I don't handle Japanese cards yet" is correct; a silent wrong match is
landmine 1 wearing a different hat.

**25. Graded slabs are not scannable by this pipeline.** Wrong aspect ratio,
label occlusion, card recessed behind thick acrylic. They also have their own
pricing that TCGCSV does not carry. Manual entry with grader, grade and cert
number; consider reading the cert barcode later. Do not let the scanner attempt
them and produce a plausible wrong answer.

**26. Card art is copyrighted and this app never hosts it.** Bandai, Shueisha,
Toei and Viz own it. The pipeline downloads images inside the CI runner, computes
a 64-bit dHash, and discards them. 6,860 hashes is 55 KB. What ships is derived
data three orders of magnitude removed from the work.

**27. The collection thumbnail is the collector's own photograph.** This is the
consequence of 26 and it is a better product: the binder shows the actual cards,
with their actual foiling, in their actual sleeves. The reference app cannot do
this — every thumbnail in the owner's screenshots is a publisher SAMPLE watermark,
which is itself evidence that they took advice on this and landed somewhere more
constrained.

**28. Reference images are hot-linked, never cached to disk.** For cards not yet
scanned, load `imageUrl` from the TCGplayer CDN
(`tcgplayer-cdn.tcgplayer.com/product/{productId}_200w.jpg`), memory-cache only,
declared in `PROVISION.md`, allowlisted in the gate as DISPLAY-ONLY with that
reasoning recorded. It is never load-bearing: PROTOCOL §8's airplane-mode
invariant covers scanning, which uses the collector's own photo.

**29. Attribution is not optional and it is not bureaucracy.** TCGCSV is one
person's free service carrying TCGplayer's data. Name both, in-app, with links.
APEX ORV was REJECTED by Play at take 166 for missing source attribution and had
to ship a whole take to fix it. That lesson is free here; take it.

**30. Publisher trademarks stay out of the name, icon and listing.** "One Piece"
is Bandai's. The app is OP TCG Hub. The store listing describes a collection
tracker for trading card games and does not foreground a franchise. A nominative
disclaimer — not affiliated with, endorsed by, or sponsored by Bandai, Shueisha,
Toei, Viz or TCGplayer — goes in the app and *opens* the listing, because APEX
ORV learned at take 167 that "easy-to-see" was the actual requirement and a
footnote did not satisfy it.

**31. Play IP complaints suspend first and appeal after.** *(Take 13: the
"do not monetise" guidance below is overtaken by A17. The posture with rewarded
ads is the reference app's own — commercial, attributed, SAMPLE art — which is
known-survivable. Mitigations 26–30 carry the weight.)* Repeated strikes
terminate the developer account, burning the $25, the listing, the registered
package name and the developer identity. Landmines 26–30 are the mitigation.
Do not monetise; a free non-commercial app is a materially different posture.

**32. Do not scrape TCGplayer.** Their terms discourage it, the site renders
prices client-side so naive requests return nothing useful, Cloudflare will win
the arms race, and it is an independent ground for Play removal. TCGCSV exists
precisely so this is unnecessary. The entire point of this project is to stop
depending on someone else's goodwill; a scraper just changes whose.

**33. Play version codes only go up, and never come back.** A `versionCode`
uploaded once is burned forever, even from a deleted draft. Derive it from the
take number and never hand-edit it.

**34. The Play build and the sideloaded build cannot coexist if they share an
applicationId.** Same id, different signing keys — the installer refuses. APEX
ORV ships them with different ids so both can sit on the phone, and the tester
guide warns that data does not carry across because WebView storage is scoped per
app. Decide this before there is a collection worth keeping, not after.

**35. The 12-tester clock is a continuous opt-in, not a cumulative one.**
Personal Play accounts created after 13 Nov 2023 need 12 testers opted in for 14
*continuous* days before production access. A tester who opts out on day 11
resets. Recruit 16–18 to absorb dropouts, and start recruiting at Phase 0, not
Phase 6 — this is pure calendar time and it is the longest lead item in the plan.

**36. Sideloading is closing.** Android Developer Verification enforcement began
30 Sep 2026 in Brazil, Indonesia, Singapore and Thailand, with global rollout
from 2027. Apps must be registered to an identity-verified developer, with the
package name and signing key registered, to install on certified devices —
*including direct APK sideload*. Consequence for this project: **Play is the
primary channel and the APK is the backup**, which is the reverse of how APEX ORV
started. Pick the package name now; it is permanent from first registration.

**37. Target API 36 from the first commit.** Mandatory for new Play submissions
and updates since 31 Aug 2026. Retrofitting API 36 behaviour — edge-to-edge
enforcement, predictive back, stricter photo permissions — after the UI is built
costs more than starting there.

**38. Use the Android Photo Picker, not `READ_MEDIA_IMAGES`.** Gallery import for
scanning from an existing photo needs no permission at all if the picker is used.
A permission not requested is a Data Safety line not written and a review question
not asked.

**39. A local-only app has an almost empty Data Safety form. Protect that.** No
account, no analytics, no telemetry. It is the easiest review path available and
it is a genuine selling point. A privacy policy URL is still required; GitHub
Pages serving `privacy.html` satisfies it, exactly as on APEX ORV.

**40. Camera preview in a WebView is not the same as camera access.** The
`getUserMedia` path, the Capacitor camera plugin path and the native ML Kit
plugin path have different permission prompts, different lifecycle behaviour on
fold/unfold, and different failure modes when the app is backgrounded. Which one
the scanner uses is agenda item A2 and it is UNKNOWN until measured on the Fold.
Config changes for `screenLayout|smallestScreenSize|screenSize` are required
regardless (A-7).

**41. The printed code identifies almost nothing. MEASURED take 2, and it is the
most important number in this repo.**

Take 1 assumed: OCR the code, get one to three candidates, hash picks between
them. Measured over all 6,860 cards:

| | resolves to ONE printing |
|---|---|
| card number alone | **8.9%** |
| card number + which set you are holding | **60.2%** |

Because a card number is not scoped to a set. **1,822 of 2,824 numbers (65%)
appear in more than one set** — reprints, promos, deck inclusions and
anniversary sets all carry the *original* number on the face. `OP01-016` is
twelve printings across eight sets, **$0.47 to $2,017.24, a 4,292x spread.**

And the spread is not a tail:

| price spread within one number | share of numbers |
|---|---|
| >= 2x | 98.6% |
| >= 10x | 78.0% |
| >= 100x | 23.2% |

Worst measured: `OP09-076`, six printings, $0.14 to $5,000.00.

**99.6% of catalogue value sits in numbers that the code alone cannot resolve.**

Three consequences, all of them structural:

1. **The picker is the primary surface, not a fallback.** It gets artwork,
   prices, set names and one-tap selection, and it is designed first.
2. **The confidence gate is economic, not visual.** Auto-accept only when being
   wrong is *cheap* — every candidate within 1.25x of every other. `number_group`
   and `number_group_in_set` are precomputed at build time so the scanner never
   does this arithmetic on the hot path.
3. **The set chip is worth 7x** and costs one tap before a batch. It is the
   single highest-leverage element in the scanner UI and it was not in the take-1
   design at all.

**42. A guard that cannot tell "not yet released" from "blocked" cries wolf.**
Landmine 5's fix — refuse any group returning zero products — fired on its first
real run against *The Dominance of God Release Event Cards*, `publishedOn`
2026-11-13. The service answered `{"success":true,"errors":[],"results":[]}`:
a correct empty answer for a set that is not out yet.

AGENTS rule 2 caught this ("a failing test is more often a wrong test"). The fix
is to know the difference, never to widen the guard. A zero is now allowed only
when the response was well-formed AND the set publishes in the future AND the
group had no products in the previous build; a group that *loses* products fails
hard, and more than three empty groups fails hard, because that is the shape a
throttle takes when every individual response still looks fine.

**43. A 64-bit unsigned hash does not fit SQLite's INTEGER.** SQLite integers are
*signed* 64-bit. `dhash()` returns an unsigned 64-bit value and any hash with the
top bit set raises `OverflowError: Python int too large to convert to SQLite
INTEGER` on insert. Roughly half of all hashes. Store via `to_sqlite()`, read via
`from_sqlite()`, and mask in `hamming()` so an XOR of a stored and a live value
cannot go negative.

**44. A LEFT JOIN onto prices fans out any printing sold in two finishes.**
The take-2 bundle emitted **6,880 rows for 6,860 cards**. Ninety printings carry
both a Normal and a Foil price row, and the join emitted each twice. Nothing
looked wrong — the app loaded, the grid rendered, search worked — and the only
thing that showed it was the count not matching. `build_app.py` now collapses to
the dearer sub-type and **asserts uniqueness before writing the bundle**. This is
APEX landmine 48 (a metric that flatters a broken build) with a different face:
a row count that is 0.3% wrong is invisible without something checking it.

**45. Catalogue-to-catalogue hash distance is NOT evidence about a photograph.**
MEASURED take 2 on the real thumbnails: the three `EB03-024` printings sit 30, 30
and 34 apart, and two genuinely identical `OP01-016` reprints sit **9** apart. So
the hashes are discriminative *between catalogue images*, and a threshold around
15 separates same-art from different-art.

That is not the comparison the scanner makes. The scanner compares **a phone
photo of a physical card** against a catalogue thumbnail — different lighting,
angle, resolution, foil glare and sleeve. Whether a photo of printing X lands
closer to X than to its siblings is **UNKNOWN** and is the single measurement
Phase 0 exists to produce. Do not quote the catalogue-to-catalogue numbers as if
they answered it.

**46. A disposable catalogue took the expensive derived data with it.**
`build_catalog.py` deletes and recreates `catalog.sqlite` on every run — correct,
per landmine 22, because the catalogue is disposable and the collection is not.
But the artwork hashes lived inside it, so every rebuild dropped all of them and
required re-downloading 6,860 images. MEASURED 8.3 images/second: **14 minutes of
network on every build**, for values that had not changed.

TCGplayer's `productId` is stable (landmine 23), so a hash computed once is valid
forever. Hashes now persist in `catalog/hashes.json` and are restored into the
fresh database. The general rule: **anything expensive to derive and keyed on a
stable id belongs outside the thing you delete.**

Caught by watching hash coverage go 4.5% -> 0.0% across a pipeline run. Nothing
failed; the build was green both times.


**47. A long derived-data job and a rebuild of what it writes to will race.**
The full hash pass ran for minutes against `catalog.sqlite` while
`build_catalog.py` deleted and recreated that file by design. The job died
mid-pass with nothing in the log and nothing saved. Landmine 46 is the same
lesson arriving from the other direction: expensive derived data does not belong
inside the thing that gets deleted. `hashes.py` now reads the catalogue once for
its work list, releases it, and writes the sidecar incrementally — crash-safe and
resumable, which is what saved the work the second time this happened.

**48. An ETA is not evidence of completion.** The pass printed
`200/6540 8.7/s eta 12.1 min` and was believed. Twice. Both times it had already
died, and the log's last line was the same optimistic estimate. A background job
started from one tool invocation does not survive into the next; more generally,
**a job is finished when its output says so, not when its progress line does.**
`hashes.py` now ends with an explicit count and fails if more than 5% of images
missed. MEASURED after the fix: 6,657 of 6,860 hashed, 97.0%, 203 missing.

**49. `same_art` was a keyword guess, and the measurement said it was wrong.**
Take 2 derived "these two printings share artwork" from the product name:
parallel, textured foil, pirate foil, jolly roger and reprint were assumed to
match the base. Measured over the whole catalogue at take 3:

| pair type (by the keyword) | within Hamming 6 |
|---|---|
| flagged same-art | 38.0% |
| flagged DIFFERENT art | **34.7%** |
| unrelated cards | 0.0% |

A third of the pairs the keyword called different were near-identical images,
because **a plain base card reprinted into a starter deck is `base` in both rows
and no keyword exists to catch it.** The keyword was answering a different
question than the one being asked.

Replaced with a measurement: at build time, each number's printings are clustered
by actual image distance (single linkage, threshold 8), and anything sharing a
cluster is flagged. Result:

| | p5 | median | p95 |
|---|---|---|---|
| pairs the hash may separate | 13 | 29 | 37 |
| pairs flagged indistinguishable | 0 | 3 | 33 |

**Zero overlap below 6**, where there had been 34.7%. And the headline number:
**3,918 printings — 57% of the catalogue — are visually indistinguishable from a
sibling.** The picker is not merely primary; for the majority of cards it is the
only honest answer. The scanner's thresholds (match ≤ 8, gap ≥ 13) now come from
that distribution rather than from taste.

**50. The signed-integer hash bug has a second face, in JavaScript, and it
HANGS.** Landmine 43 fixed the Python side. The app's `hamming()` did
`BigInt(a) ^ BigInt(b)` then `while (x) x >>= 1n`. BigInt shifts are arithmetic,
so `-1n >> 1n` is `-1n` — and roughly half of all stored hashes arrive negative
because SQLite INTEGER is signed. The loop never terminates. **The app would have
frozen on the first artwork comparison a collector ever triggered**, with no
error, no log line, and nothing to debug from.

Found because `smoke.mjs` stopped responding. A test that hangs is a test that
found something; do not shorten the timeout and move on. Mask to unsigned 64 on
both operands and on the XOR. There is now an assertion that `hamming(-1, 0)`
returns 64 and that every stored hash is self-comparable.


**51. A guard with no memory of what already failed becomes a nuisance and gets
disabled.** 203 of 6,860 card images answer **HTTP 403 Forbidden**, permanently —
verified individually while 6,657 others succeeded in the same run, so this is
per-image refusal, not a throttle. Three separate checks then fired wrongly, all
for the same reason: they measured a rate over a resumed batch whose remaining
work was entirely known-bad.

- `hashes.py` reported *100% of fetches failed* and stopped the pipeline, on a
  run where the only 203 rows left were the ones that always fail.
- `validate.py --strict` demanded 98% hash coverage against a ceiling of 97.0%,
  so the gate could never pass.
- Which is how a strict gate teaches people to run `--no-strict`, and then it is
  not a gate at all.

The fix in all three places is memory, not a looser threshold: the sidecar
records which ids are unavailable, they are excluded from the work list and from
the coverage denominator, and the failure rules apply to first-attempt work.
Coverage is now reported as **100.0% of reachable**, which is both true and
unable to drift quietly.

This is the third time this shape has appeared here — landmine 42 (unreleased set
read as a blocked fetch) and landmine 48 (an ETA read as completion) are the same
error. **A guard that cannot distinguish "known and expected" from "new and
wrong" will be widened, and a widened guard stops guarding.**


**52. A positional INSERT in a test is coupled to the schema, and it takes a
guard down when the schema grows.** Take 4 added a `life` column. A negative
control in `validate.py` used `INSERT INTO printing VALUES (…21 values…)` and
started raising `table printing has 22 columns but 21 values were supplied` —
so five guards stopped being exercised at all.

It failed loudly rather than silently, which is the right way round, but only
because `gate.py` runs the selftests as part of the contract. Without that the
controls would have sat broken and every one of them would have read as green in
any summary that only counted the checks that ran (APEX landmine 53).

Name your columns in fixtures. A test that knows the shape of the table is a
test that has to be maintained alongside it.

**53. A seed filename and the workflow glob that triggers on it must be renamed
together.** The take-4 rename moved `vault-seed-tNNN.zip` to
`optcghub-seed-tNNN.zip`. `ci/build.yml` matches `push.paths` on that pattern and
the seed job is the only thing that ever moves an uploaded zip into the tree. Had
the glob been left behind, an upload would not have started a run at all, and the
symptom is *nothing happening* — no failure, no log, no red X. This is APEX
landmine 202 arriving by a different route, and the workflow is the one file the
seed cannot fix for itself (APEX landmine 46), so the paste has to be right.


**54. `1fr` does not mean "half". A grid item's automatic minimum size is
min-content, and one nowrap string blew the collection grid off-screen.**

MEASURED in Chrome at take 5, at a 412px viewport:

```
grid width       380px
columns resolved 277.391px  277.391px      <- 554px of columns in 380px
tile 2           x=305  right=583          <- entirely off-screen
body scrollWidth 583                       <- the page scrolled sideways
```

`grid-template-columns: 1fr 1fr` sizes columns from the free space, but the
*minimum* is `auto`, which resolves to min-content. `.tile .s` carries
`white-space:nowrap` and the set name is `Extra Booster: One Piece Heroines
Edition` — so min-content was that entire unbroken string and the column
inflated to fit it. `overflow:hidden` and `text-overflow:ellipsis` did nothing,
because the box was never asked to be small.

The fix is `minmax(0, 1fr)` and `min-width: 0` on the item. Take 5 shipped both
plus `overflow-x:hidden`, and the negative control proved **each one fixes it
alone** — reverting only the grid rule still passed. That is fine, but it means
the guard, not the fix, is what will catch this next time.

**What matters more than the CSS:** `smoke.mjs` was passing all 45 of its
assertions while this was true, and every one of them was correct. It asserts
markup. A collection grid whose second column is off the side of the phone is
not a markup problem. **Layout needs a layout engine**, which is APEX landmine
69 arriving in this repo for real rather than as an inherited note. `render.mjs`
now measures resolved column widths, tile bounding boxes and body scroll width
across four viewports — 360, 412, 673 and 820 — because "tuned to one screen
size" is APEX landmine 95 and a Fold is two of them.

**55. A sabotage that silently no-matches proves nothing, and I did it twice in
one hour.**

Verifying landmine 54's new guards meant deliberately reintroducing the bug.
Three attempts:

1. `sed -i 's/minmax(0,1fr)/1fr 1fr/'` — pattern never matched the real rule.
   Render passed. It looked like the guard was broken.
2. Asserted the sabotage this time, but asserted on the substring
   `minmax(0,1fr)` — which also appears in the *comment* explaining the fix, so
   the assertion failed and the file was never written. Render passed again.
3. Asserted on the full CSS rule, landed it — and render *still* passed,
   because the fix was three independent changes and only one had been reverted.

Only the fourth attempt fired the guards. Three of those four rounds would have
been read as "the guard does not work" by anyone in a hurry.

This is APEX landmine 99 (a failed assert silently drops the whole patch) and
AGENTS rule 2 (verify the check before you believe it) applied one level up:
**the negative control is itself code, and it needs its own negative control.**
Assert that the sabotage LANDED, on text that appears exactly once, and never on
a substring that a comment might also contain.


**56. `ci/apk.sh` patched a Gradle property that lives in another file, and would
have broken the very first CI run.**

Written blind at take 4, executed for the first time at take 5. It ran a regex
for `compileSdk` over `android/app/build.gradle` — but Capacitor keeps SDK levels
in `android/variables.gradle` as `rootProject.ext` references, so the app file
contains only `compileSdk = rootProject.ext.compileSdkVersion`. The regex
produced:

```
compileSdk 36 rootProject.ext.compileSdkVersion
```

Broken Gradle. SDK levels now go to `variables.gradle`, versions to
`app/build.gradle`, both assert after (APEX landmine 99), and one assertion
specifically checks that the take-4 breakage has not returned.

Related, and worth stating because it removes work rather than adding it:
**Capacitor 8's manifest already carries `screenLayout|smallestScreenSize|
screenSize`.** The take-4 fold patch was solving a problem that no longer exists.
That step now *verifies* rather than patches, and fails loudly if a future
template drops one — a check is cheaper to keep correct than a patch.

**57. Android's asset merger treats `x.json` and `x.json.gz` as the same asset.**

```
Execution failed for task ':app:mergeReleaseAssets'.
> [public/bundle/catalog.json] … catalog.json
  [public/bundle/catalog.json] … catalog.json.gz: Error: Duplicate resources
```

`build_app.py` had been writing both into `www/bundle/` since take 2. The `.gz`
was only ever a size figure for the record — the catalogue ships inside the APK
(landmine 8) and Android compresses assets itself — so it bought nothing and
broke the build. It now goes to `catalog/`, outside `www/`.

**The fix did not work the first time, and that is the more useful half.**
Removing the line from `build_app.py` changed nothing, because the step created
its output directory but never cleaned it, so the stale `.gz` sat on disk and
Capacitor cheerfully synced it into the APK. **A build step that only ever adds
leaves every file it has ever produced.** `build_app.py` now removes `BUNDLE`
before writing it. Same family as APEX landmine 32.

**58. The ML Kit OCR plugin ships 41 MB of native libraries, most of them for
CPUs no phone has.** MEASURED on the first real APK:

| | |
|---|---|
| total APK | **51 MB** |
| `libmlkit_google_ocr_pipeline.so` × 4 ABIs | 41 MB |
| of which x86 + x86_64 | **23 MB** |
| `classes.dex` + `classes2.dex` | 14 MB |
| the entire card catalogue | 1.8 MB |

The x86 variants exist for emulators. Restricting the sideload APK to
`arm64-v8a` and `armeabi-v7a` took it to **29 MB**, a 43% cut, with the same
functionality on every real device. The Play AAB splits per-ABI on its own, so
this shapes only the artifact the owner actually installs.

**Not yet fixed, and recorded so it is not rediscovered:** the plugin also pulls
`text-recognition-chinese`, `-devanagari`, `-japanese` and `-korean`, and ships
their LSTM models (~0.9 MB each) plus their share of the pipeline. One Piece
codes are Latin (`EB03-024`) and constrained to `[A-Z0-9-]` (landmine 11), so
none of it is used. Excluding those Maven modules is the obvious win and it is
**UNVERIFIED** — the plugin's Java may reference the classes and fail at runtime
with `NoClassDefFoundError`, which cannot be established without a device. It is
agenda A14, not a change made blind on the last day of a take.

**59. This build needed SDK components nobody had listed.** A first real build
surfaced three environment facts that four takes of writing CI had not:
a Capacitor plugin pins **build-tools 35.0.0** while the app targets 36, so both
must be present; a JRE is not a JDK and Gradle fails with *"does not provide the
required capabilities: [JAVA_COMPILER]"*; and behind a TLS-intercepting proxy a
freshly downloaded JDK trusts nothing, so Maven resolution dies with
`certificate_unknown` until the system trust store is swapped in.

The third is an artefact of this container and will not occur on a GitHub
runner. The first two are real and `ci/build.yml` already gets them right by
using `actions/setup-java` with a `temurin` **jdk** and `ubuntu-latest`'s
preinstalled SDK. That is now PROVEN-adjacent rather than assumed: the build
works when those conditions hold, because it was made to hold here by hand.


**60. The card face names its own printing — and the signal is asymmetric, which
is the entire point.**

Takes 2, 3 and 5 all treated the printed strip as containing only the card
number. Take 6 looked at real card images at 600x838 and it contains more:

```
plain   OP13-014 [C]  (4)
star    OP04-030 *[R] (1)        a star above the rarity badge
sp   SP OP05-119 [SEC] (2)       a literal SP badge before the number
```

MEASURED, n=4 per treatment across twelve treatments. Mapping:

| face | treatments |
|---|---|
| `plain` | base, reprint, pirate foil, jolly roger, box topper |
| `star` | alternate art, parallel, manga, full art, textured foil |
| `sp` | SP, wanted poster |

**Presence is reliable; absence is not.** 16/16 plain-treatment samples had no
star. But `ST01-005`, an alternate art, had no star either. So:

- **star seen → the printing is special.** Safe to narrow.
- **no star seen → nothing follows.** Narrowing here would silently enter a $78
  alternate art as a $5 base card.

The tempting symmetric rule scores better on paper and is wrong:

| rule | printings | value |
|---|---|---|
| set chip only | 62.3% | 35.4% |
| narrow both ways *(unsafe)* | 83.7% | 47.5% |
| **narrow only on a sighting** | **73.0%** | **47.0%** |

The safe rule gives up half a point of value and all of the silent-error risk.
`smoke.mjs` has an assertion that symmetrising `candidates()` turns a 316x spread
into an auto-accept, because that is exactly the "improvement" a future session
will be tempted to make.

**61. Two signals that look like one signal are not one signal.**

The face class has two components and they are not equally trustworthy:

| | what it is | where | cost | risk |
|---|---|---|---|---|
| `SP` badge | **literal text** | inside CODE_BOX | free — the same OCR pass reads it | low |
| star | a **glyph** | its own small region | an extra crop and a detector | real |

Worth separating because their value differs too:

| | printings | value |
|---|---|---|
| set chip only | 62.3% | 35.4% |
| + SP badge | 62.7% | **38.6%** |
| + star glyph | 73.0% | 47.0% |

The SP badge moves only 0.4 points of *printings* and 3.2 points of *value*,
because SP cards are the expensive ones. It costs nothing — it is characters in a
crop the scanner already takes — so it ships.

The star is the bigger prize and it is not free. Take 6 cropped the star region
on six real cards: it is clean on plain and star printings, and on two ornate SP
cards it is **decorative background that a naive bright-ink test would call a
star**. Those two SP cards also had no star at all, so the region carries no
signal there and plenty of noise.

So the star detector is agenda A15 and is gated on the rig's Q4, not written
blind. Shipping the free half now and the risky half after measurement is the
same trade as landmine 58's ABI filter versus the language-model exclusion.


**62. A test that asserts a market price is a test with an expiry date.**

Take 2 wrote `Math.abs(vivi[0].market - 467.33) < 0.01` and three siblings like
it. They were true, precise and correct. At take 6, mid-session, TCGCSV published
a fresh catalogue: the Vivi SP moved to **$463.53**, one new card appeared
(6,860 -> 6,861), and three assertions went red on a correct catalogue and a
correct app.

In CI this fails **every time the market moves**, which is daily. Nothing is
learned from the red, so it gets muted, and then the assertion is worse than
absent because it is still there looking like coverage (APEX landmine 53).

Assert the **relationship**, never the number:

```js
ok('dearest is the SP',              vivi[0].treat === 'sp');
ok('the SP is worth 100x the base',  vivi[0].market / base.market > 100);
ok('total matches the catalogue',    shown === computedFromCatalogue.toFixed(2));
```

The last one is the pattern that generalises: **derive the expected value from
the same data the app read**, so the check tests the arithmetic rather than
memorising an answer. `render.mjs` had the identical bug twice — once in Chrome
mode and once in the DOM fallback — and fixing only the visible one left the
other to fail on the next run.


**63. A `\b` in the code regex made the instrument report that OCR reads
nothing. It reads fine.**

The first synthetic OCR measurement at take 7 came back **3% read**, across every
resolution. That looks like a dead end for the whole scanner. It was the regex.

OCR of the printed strip does not return a tidy `EB04-024`. It returns
**`EB04-024008`** — the rarity badge and the cost bubble are adjacent glyphs and
their digits run straight onto the number. There is no word boundary between
`024` and `008`, so `\b...\b` matched nothing, forever, on a perfectly legible
crop.

Same crops, anchors removed: **53% read**.

**The rig shipped this bug at take 4 and carried it through takes 5 and 6.** Had
The owner run his thirty cards, it would have reported that the camera could not read
a single code, and the honest conclusion from that would have been to re-plan the
architecture. A broken measuring instrument does not produce no answer; it
produces a confident wrong one, and this project's whole method rests on the
instruments.

AGENTS rule 2 is the rule that caught it: 3% across five resolutions is not a
degradation curve, it is a constant, and a constant means the thing under test
was never running.

**64. A crop box that "looks about right" can have zero margin and no way to
know.**

Take 6 eyeballed `STAR_BOX = {0.855, 0.912, 0.075, 0.030}` from card images and it
seemed fine. Take 7 measured it by differencing the mean of 200 star cards
against 254 plain ones:

| box | plain median | star median | zero-FP threshold | **margin over plain p95** |
|---|---|---|---|---|
| take-6 guess | +0.51 | +0.94 | 0.53 | **+0.01** |
| measured, tightened | +0.02 | +0.98 | 0.61 | **+0.36** |

The guess was five times too large, and the excess swallowed the rarity badge —
which every card has, star or not. So plain cards scored 0.51 against a threshold
of 0.53. It would have worked on clean renders and fired on a base card the first
time a real photo shifted a few pixels, and nothing in the code would have hinted
why.

**A margin is a measurement. "It works on my test images" is not.**

Two corollaries, both counter-intuitive and both measured:

- **Searching a window made it worse, not better.** Sliding the box ±2.5% in x
  and ±0.6% in y recovered **zero** additional stars and dropped the margin from
  +0.36 to +0.13, because every extra probe is another chance for a plain card's
  background to score high. The instinct that a wider search is more robust is
  backwards when the false-positive is the dangerous outcome.
- **The misses are mostly real.** Of six missed star cards inspected by eye,
  three genuinely have no star printed. Recall sits at ~65% and is not a tuning
  failure.

**65. Removing the last 2% of errors cost half the recall, and was the wrong
trade.**

The OCR operating point, MEASURED on 150 real cards:

| pipeline | read | correct | **wrong** |
|---|---|---|---|
| regex only | 59% | 51% | 8% |
| + must exist in the catalogue | 53% | 51% | **2%** |
| + no digit may follow the match | 27% | 27% | **0%** |

The catalogue check is free and excellent: we know all 2,825 valid card numbers,
so a read that is not one of them is a *no* read rather than a wrong one, and it
quartered the error rate at no cost to correctness.

The trailing-digit rule then removed the last three errors out of 150 — by
throwing away **26 points of recall**. That is not a safety improvement, it is a
different failure wearing safer clothes: a scanner that reads a quarter of cards
sends the collector to the picker constantly, and landmine 17 says a scan loop
slower than typing has already failed.

The residual 2% belongs to **temporal voting** (landmine 10), which the design
has always specified and which costs nothing here: the errors come from
single-frame noise, and three frames agreeing removes them without touching
recall. Ship the free filter, leave the expensive one to the mechanism that was
already going to run.


**66. Yesterday's prices are irreplaceable and were about to be overwritten.**

TCGCSV publishes today's prices and only today's. The pipeline's ingest step
overwrites `tcgcsv_cache/tcgcsv_payload.json` on every run. Through take 7 that
meant every nightly build **destroyed the only copy of the previous day** — and
the whole idea of a daily delta, which is on four of the owner's five screenshots,
depends on having it.

`tools/history.py` now appends each payload's prices to a committed sidecar,
`catalog/prices_daily.json`, keyed by the *source's* publication date (landmine 3:
a 03:00 UTC fetch carries yesterday's prices, and filing them under today would
corrupt every delta downstream). It is landmine 46's rule a third time —
irreplaceable derived data does not live in the thing that gets deleted — and it
is the rule this repo keeps relearning because each instance looks different.

On this very run, the capture had to happen **before** ingest, by hand, or the
1 September prices would have been gone. The pipeline order is now ingest ->
history, which is correct in steady state and would have been one day too late
today.

**67. A guard that compares a per-row value against a per-product aggregate
fires on data that did not move.**

The first real run of landmine 7's >10x check — which had never had a prior day
to compare against until take 8 — reported:

```
product 552138 moved $176.58 -> $9.41 (>10.0x) — upstream data glitch?
```

Nothing moved. `552138` has a Foil row at $176.58 and a Normal row at $9.41; the
sidecar stores one value per product, the dearer one; and the check iterated
every price *row* against that aggregate. Landmine 44's fan-out, arriving in the
validator instead of the bundle.

AGENTS rule 2 caught it: a guard's first-ever positive on real data is verified
before it is believed, and this one was wrong. Fixed with `MAX(market) GROUP BY
product_id`, and the planted-300x negative control still fires.

**68. The reference app's "0.00%" is two different things and only one of them
is true.**

Collectr's tile shows `$0.00 (0.00%)` for a card whose price did not move. It
would show the same for a card with no yesterday at all. Those are not the same
fact: the first is a measurement, the second is an absence, and rendering an
absence as a flat market is PROTOCOL §10.2 exactly — a modelled number presented
as a transaction.

`deltaHtml()` renders `—` with a title of *no prior day on file* when `d1p` is
null, and `0.00%` only when yesterday existed and equalled today. `smoke.mjs`
asserts the null case cannot render as a percentage. On day one of any install,
every card is in the first state; the app says so rather than pretending to a
calm market.


**69. A guard is only as strict as its weakest input.** `ci/apk.sh` patched
`versionCode {vc}` and asserted `f"versionCode {vc}" in text`. With `vc` empty
— which is exactly what happens when a shell variable is set but not exported —
it wrote `versionCode ` and the assertion `"versionCode " in text` passed on it.
Found at take 9 running the step by hand. Two fixes, both needed: assert the
*inputs* are well-formed before touching the file, and match the whole line so
a run that was interrupted (or this bug) can be repaired by the next run rather
than leaving the file permanently unpatchable.

**70. "No keystore" was never a blocker. It was a decision the repo kept
declining to make.** Eight consecutive DEFERRED lists ended with it. APEX made
the same decision at its take 20, wrote it down as A21, and committed the key.
The trade-off is real — anyone with the repo can sign as the app — and it is
the right trade for a private repo and a personal tool, which is what this is
until v1. The cost of not deciding was eight takes in which every APK was
`app-release-unsigned.apk` and every "packaging is proven" claim had an asterisk.
When a deferral survives three takes unchanged, it is not waiting on
information; it is waiting on a decision, and the ledger should say which.


**71. A harness without real pixels reports NaN as a score, and NaN passes
nothing and fails nothing until something compares it.** The scanner's pixel
stages — quad detection, warp, star correlation — ran green-looking in
`smoke.mjs` because its DOM mock returns a proxy for `getImageData`; every
arithmetic on it is `NaN`, and `NaN < threshold` is `false`, which read as "no
star seen", which is the safe answer. Seven assertions failed only once one of
them asked for a *positive* result. Pixel stages live in `render.mjs`, Chrome
mode, where a canvas is a canvas. The port was then checked against Python on
30 real cards: max score difference 0.175 from resampling, **30/30 threshold
agreement**.

**72. The WebView can ask for the camera; the manifest has to have offered it.**
Capacitor's `BridgeWebChromeClient.onPermissionRequest` turns a `getUserMedia`
video request into a runtime request for `Manifest.permission.CAMERA` and grants
the WebView only on success. The generated app manifest declares `INTERNET` and
nothing else — the camera *plugin* does not add it either. First real scan:
"Camera unavailable: permission denied", and nothing in JavaScript would have
said why. `ci/apk.sh` now adds `CAMERA` plus `android.hardware.camera
required=false`, with a grep-after, so a camera-less tablet can still keep a
collection by hand. Read from the Capacitor source at take 10, not assumed.

**73. The plugin takes a path.** `@capacitor-mlkit/text-recognition`'s
`processImage` wants `{ path, script }`, not base64 and not an ImageData — read
off `definitions.d.ts` at take 10. So a crop goes canvas -> base64 ->
`Filesystem.writeFile(CACHE)` -> `processImage({ path: uri, script: 'LATIN' })`
-> delete. Three plugin calls per read, and a temp file that must be cleaned
up in a `finally`. `script: 'LATIN'` is also the runtime half of A14: the other
four recognisers stay idle even though their models ship. Writing the seam from
memory would have produced code that compiled and failed on the first call.


**74. A keyword mentioned is not a keyword possessed, and naive matching
over-counts Rush by 4x.** For the deck builder, "how many Blockers are in this
deck" is a question about cards that HAVE [Blocker]. TCGCSV's card text uses the
same bracket for a card that *has* the keyword and a card that *refers* to it —
"your opponent cannot activate a [Blocker]", "this Character gains [Rush]". A
`LIKE '%[Rush]%'` count, MEASURED at take 12 over 6,862 printings:

| keyword | naive | actually has | references |
|---|---|---|---|
| Blocker | 381 | 287 | 94 |
| Rush | 94 | **22** | 72 |
| Double Attack | 32 | 10 | 22 |
| Banish | 24 | 10 | 14 |

The rule that separates them: a keyword the card HAS starts an effect line
(after any `[DON!! x2]`-style conditions); a keyword mid-sentence is a
reference. Conditional grants ("gains [Rush]" under a cost) are real gameplay
but are a *different fact*, and a builder that counts them as innate Rush will
tell someone their aggro deck has four times the reach it has.

**75. An absolutely-positioned placeholder stacks above the image that
replaces it.** The tile's text placeholder (`position:absolute; inset:0`) sat
above the hot-linked art once it loaded, ghosting "NamiOP01-016" across the
picture. Caught by looking at the screenshot, not by any assertion — the
render harness checked that the image *loaded*, which it had. Hide the
placeholder on `onload` rather than fighting z-index.


**76. A replace whose replacement contains the rest of the document
duplicates the rest of the document.**

```python
s = s.replace(heading, NEW_TEXT + s[s.index(heading) + len(heading):])
```

reads as "replace the heading with the new heading plus what followed it". It
does that — and the original "what followed it" is still in `s` after the
replaced heading, so the tail now appears twice. Done three times across takes
11–12 (A3, A12, A16), the agenda reached **three copies of A4–A12**, one carrying
a stale A12 heading that the later update never touched, and grew from 1,263
lines to 1,755. Found at take 13 only because `grep` returned a phrase four
times.

Two failures. The edit pattern, which is now banned in this repo: **a
replacement string never contains a slice of the document being edited.**
Insert with `s.replace(anchor, NEW + anchor)`. And the gate, which asserted
stamps, citations and DEFERRED sections and never once asked whether a ledger
had two of anything. `check_ledger_integrity()` now fails on any duplicate
agenda id, landmine number, inherited number or take entry, and its negative
control is the corrupt file this was found in.


**77. One module scope, fourteen takes of `const`.** `smoke.mjs` is a single
ES module and every take appended assertions with names like `vivi`, `sp`,
`eb`, `before`. Take 6 shadowed two, take 14 shadowed two more, each a
`SyntaxError` that stops the whole file before a single assertion runs — which
reads, at a glance, as "smoke is broken" rather than "a name is reused". Each
take's section is now a `{ }` block. The failure was cheap every time and
would have kept being cheap forever; the fix is cheaper.

**78. Capacitor's default launcher icon would have been the first thing the
first tester saw.** The placeholder SVG existed since take 12 and was wired to
nothing; `cap add android` ships Capacitor's own icon and splash. The icon is
now rendered from the committed SVG at build time in `ci/apk.sh` — mipmaps for
five densities, a round variant, and the adaptive foreground — and PNGs are
never committed, so replacing the icon is replacing one file (A16).

Verifying it was in the APK took three attempts, each a lesson: resource names
are obfuscated in release builds so `grep mipmap` finds nothing; a colour
heuristic tuned for the wrong image matched Capacitor's teal *splash*; and a
byte hash failed because AAPT2 crunches PNGs. Pixel statistics — transparent
58%, dark 25%, teal 42 — matched exactly. **Verify what the artifact contains
by decoding it, not by naming it.**


**79. Scan photos as base64 in localStorage would have broken the collection
around card 100.** A WebView's `localStorage` quota is 5–10 MB. A 500x700
JPEG at quality 0.7 is ~50 KB. `OWN.add(…, { photo: dataUrl })` had been
storing every scan there since take 10, so somewhere past a hundred scanned
cards `setItem` throws `QuotaExceededError`, the collection stops saving, and
nothing about the error says "camera". Found at take 15 while reading the
Filesystem plugin's `Directory` enum for the backup work, not by any test — the
harness's fake localStorage has no quota. Photos now go to `Directory.Data` via
`Filesystem.writeFile` and the item stores a `convertFileSrc()` URL. Data is
cleared on uninstall, which is correct for a derived image: the backup is the
data, the photo is a rescan away.

**80. "Export exists" is not "the collection is backed up", and the ledger let
that slide for fourteen takes.** PROTOCOL §9 and landmine 20 both say
auto-backup on every batch commit does not get cut for schedule. Export
shipped at take 2 and every DEFERRED list after it omitted backup entirely —
not deferred, just absent, because a related feature existed. A collector who
never taps Export has no backup. Now: `Documents/OPTCGHub/backup-latest.json`
plus a dated copy, on every batch commit, deck save and detail save; the folder
is public storage that survives uninstall on Android 11+ (read from the plugin's
definitions, not assumed); failure is toasted, never swallowed; restore is a
replace and the confirm says so. The lesson for the ledger: **a protocol
requirement should appear in DEFERRED until it is done, or the ledger is
reporting the absence of a note rather than the presence of a feature.**


**81. A guard with a magic column index fires on the next reorder.** The
gate's `check_variant_keying` read `r[0]` as the product id since take 2 —
correct for thirteen takes. Take 15 added `sealed` as column 0 and the guard
reported **7,518 duplicate printings** on a correct bundle. `build_app.py` had
already learned this at take 4 (`cat["cols"].index("hash")`, "not a magic
number"); the gate had not. Every consumer of the bundle now indexes by column
name. The check was right to exist and wrong to be brittle; both are true.


**82. `env(safe-area-inset-*)` is zero in an Android WebView. Capacitor 8
injects its own `--safe-area-inset-*` variables, in pixels.** Every screen in
The owner's first field test drew under the status bar and the gesture bar —
"Overview" behind the clock, the set chip behind the status icons, the picker's
Cancel behind the nav bar. Landmine 37 had named edge-to-edge as a retrofit
cost at take 1; the retrofit used the iOS/standard `env()` form, which evaluates
to 0px here. Read from `SystemBars.java` at take 16: the runtime calls
`document.documentElement.style.setProperty("--safe-area-inset-top", "%dpx")`
and the other three, by default (`insetsHandling: "css"`). One token per edge —
`--sat`, `--sab`, `--sal`, `--sar` — with `env()` as the browser fallback, and
every fixed element uses them. `render.mjs` sets the variables to 36/24px
before its geometry checks so a regression is a red assertion, not a
screenshot.

**83. A batch that lives in memory and commits only on a button is a batch
that a first-time tester loses.** "I don't think my collection saved." Two
cards scanned, the picker answered twice, collection empty after reopening.
Nothing was wrong with saving; the cards were never *committed*, because commit
was a button labelled Review that nothing pointed to, and closing the app
discarded the batch without a word. Now: every accept writes the batch to
storage, the Scan tab carries a count while one is waiting, reopening Scan
says "2 scanned cards waiting — tap Review to add them", and the batch
survives a force-close. The lesson is older than this repo: **a tester does
not know your flow, and anything that needs a second action to become real
needs to say so at the first.**

**84. The picker sorted dearest-first, and dearest is a promo half the time.**
"It gave me two options and it was always the cheaper card." MEASURED over
2,215 ambiguous numbers: the dearest printing is a promo-set base for
**49.8%** of them and the main-set base for 19.3%. A collector holding a
common — the overwhelmingly usual case — was shown the release-event printing
on top, highlighted, twice in two scans. The picker now orders by
*likelihood*: main set over starter deck over event promo (print runs are the
prior), base before special when no star was seen, and a face sighting still
overrides all of it. Price is the tie-break, not the sort. The take-2
assertion that candidates come dearest-first was asserting the bug.

**85. A 403 image is a blank box unless something says otherwise.** The
release-event printings in the picker are among the 203 images the CDN refuses
(landmine 51). `refArt()` fails silently, which is right for the tile — the
text placeholder is underneath — but the picker's `.oa` box had nothing under
it and rendered as an empty grey rectangle. "Broken icons." The placeholder
now names the printing and set.


**86. `display:block` on a generic `span` selector eats every inline span you
add later.** `.row .v span{display:block}` was written at take 2 for the
delta line under a price. At take 17 a ▼ triangle wrapped in `<span>` went to
its own line above the price on the card detail — the exact bug landmine 8's
tile fix solved at take 8 with a dedicated `.dl` class, and here it was again on
a different element because the *selector* was never narrowed, only the one
call site. A block rule on a bare element selector inside a component is a
trap that fires on the next person who adds an inline element there. The
triangle now lives inside the price text as an `<i>`, and `render.mjs` measures
the detail price block's height the way it measures the tile's.

*Third instance, take 18:* `.dkrow .n span{display:block}` caught the `.badge`
inside the trade row's name and drew "SP" as a full-width bar. The fix this
time is at the *selector*: every descendant-span rule inside a component is now
`> span`, direct child only. Three instances is a pattern, not a bug.


**87. "The docs are in the seed" was a habit, and a habit is not a guarantee.**
Seventeen takes shipped every ledger and runbook because the person doing it
remembered to. The owner asked for it as a rule; a rule the gate does not check is a
rule a session under pressure can break without noticing. `check_docs_complete()`
now names every required file — the ten in `docs/`, plus AGENTS, README, BUILD
and the four `ci/` files — and fails on absence or on a stub under 500 bytes.
Negative control: remove RULES.md, the gate names it. The same reasoning as
landmine 80: **a requirement the ledger does not enforce is reporting the
absence of a note, not the presence of a feature.**


**88. Copy outlives the design that made it true.** "No counter, no cap" was
written at take 2, when the founding premise was a scanner with no wall. A17
at take 13 put a credit gate on *saving*. Scanning stayed unlimited — that part
was still true — but the cap line was not, and it sat on the scan screen and in
the README for six more takes until the owner read it. `check_stale_copy()` holds a
list of phrases with the reason each is false under the current design, and
refuses them in any user-facing file. **When a design decision changes, its
old sentence goes on the banned list the same take** — the gate then finds the
copies the author's grep did not, which is exactly what happened here with the
README.

**89. The gate caught the author skipping PROTOCOL §6, nineteen takes in.**
Take 19 built the guide and the copy audit first, then ran the gate to try the
new stale-copy check, and read *"no HANDOFF entry for take 19 — write it
FIRST"* in the same output. Take 2 inverted §6 and confessed it in prose; take
19 was told by a check. Nothing about the discipline had weakened — the work
was good — and that is the lesson: **the takes where the rule gets skipped are
the ones where the work feels most obviously fine.** The check does not care how
the work feels.


**90. Two elements with one id fail silently in every browser.** The scanner's
viewfinder has been `id="guide"` since take 2. Take 19 added the first-run tour
as `id="guide"` too. `$('#guide')` returned the viewfinder; the tour's
`position:fixed; inset:0; z-index:60` CSS applied to *both*; the tour reported
`hidden=false` while painting a 0x0 box, and the viewfinder would have become
a fixed full-screen overlay on the scan screen. No error, no warning, from
anything. `check_duplicate_ids()` reads the built `index.html` and fails on any
repeated id — the tour is `#tour` now — and this is the kind of check that
should have existed at take 2, because ids are global and every take adds some.


**91. A record and an estimate on the same chart must never look the same.**
The portfolio chart was the collection's own nightly snapshots (A10) — a
*record* of what it was worth on days the app was open, purchases marked. On a
fresh install that is one point and no chart. The catalogue now carries every
day's prices it has on file, so today's holdings × each day's prices is a
legitimate *estimate* of what these cards would have been worth — but it is a
different fact, and drawing it in the same brass line would present a
reconstruction as a record, which PROTOCOL §10 names as the thing this app does
not do. The estimate draws **dashed**, the delta line says *"estimated from
today's cards at each day's prices"*, and three real snapshots take precedence
the moment they exist. The test asserts the history's arithmetic against the
catalogue's own deltas, not against a pinned price (landmine 62).

**92. A failed nightly build is silent by design and that is not the same as
harmless.** The app keeps its last catalogue when a night fails — correct, and
PROTOCOL §8's point — but through take 19 nothing told anyone a night had
failed, and a catalogue can be a week stale while every screen reports its
prices with confidence. Two halves: the app shows a banner on Home at three
days, naming the date so the collector knows what the numbers are numbers OF;
CI opens one labelled issue on failure and comments on it each further night,
so three bad nights are three comments on one thread rather than nothing.


**93. A patch script that dies on its last line has written nothing — which
is right — but the side effects that ran AROUND it have.** Take 21's prompt()
replacement had a quoting error in its final `print`; Python raised before
`open(p,'w').write(s)`, so `src/app.html` was untouched, exactly as the
assert-then-write pattern intends. The `sed` that lowered the gate's ratchet
ceiling to zero was a separate command *after* it and ran anyway. For one
command the repo asserted "zero prompts" while shipping six. Harmless here,
because the gate would have refused the seal; the rule is the one behind
landmines 55 and 76: **a change and its guard move in the same atomic step, or
the guard is set only after the change is verified.** Never before.


**94. The ads SDK adds `AD_ID` to the manifest on its own, and the Data Safety
form has to know before Play does.** MEASURED on the first AdMob build:
`com.google.android.gms.permission.AD_ID` and `ACCESS_ADSERVICES_AD_ID` appear
in the merged manifest with nothing in this repo declaring them — the Google
Mobile Ads SDK merges them in. APEX ORV was rejected at its take 166 for a Data
Safety declaration that did not match what the artifact requested; this app
now requests the advertising ID, and the form must say *Device or other IDs —
collected, shared, for advertising* before the first upload, not after the
rejection. RUNBOOK-play §F lists it. The near-empty form (landmine 39) is
gone the moment the plugin is in the build, whether or not an ad ever shows.

**95. The reward is an event, not a return value.** `showRewardVideoAd()`
resolves when the ad is *shown* — and a user who dismisses the ad at second
two gets the same resolved promise as one who watched it through. The credit
must land in the `onRewardedVideoAdReward` listener and nowhere else, or the
first tester learns that closing the ad is as good as watching it. Read from
the plugin's definitions at take 22; the smoke suite asserts that `CREDITS.earn`
is reachable from the listener and not from the `show()` continuation.


**96. The package name is the one thing a Play listing cannot change, and
it encodes a game.** `com.optcghub.app` — chosen at take 4, correct for a
One Piece app — becomes permanent at the first Play upload (landmine 36, A8).
Take 23's ask to add MTG, Pokémon and Lorcana, and the ask to start the Play
clock in days, collide exactly here: a multi-game app under a One Piece
package name is a display-name lie that can never be fixed, and renaming the
package after upload is a new app with a new tester gate. **A decision with a
deadline is a decision the ledger has to name as such** — D14 is written with
the date the cost goes from ten minutes to impossible.


**97. Check what a constraint actually constrains before writing a deadline
on it.** Landmine 96 (take 23) said the package name "encodes a game" and so
a multi-game future needed a rename *this week*. The package name is
`com.optcghub.app`; it cannot change after upload — true — and it appears
exactly once to a user, in the Play URL. The **display name** is the brand
and changes freely. So the "impossible next week" was a cosmetic URL, and D14
had no deadline at all. The ledger created urgency from a half-read fact.
**A permanent identifier is only a constraint on the things that read it**;
list those before calling it a deadline. Landmine 96 stands as a fact
(package names are permanent) with its urgency withdrawn.


**98. The `hidden` attribute loses to any author `display`.** The UA sheet's
`[hidden]{display:none}` has lower precedence than `nav{display:flex}` in the
app's own CSS, so `<nav id="navPlay" hidden>` drew anyway — both navs stacked
at the same fixed position and Collect's sat on top of Prep & Play's. The
measurement said `navPlay: true, navCollect: false` while the screenshot showed
Home/Search/Scan; both were telling the truth about different things. Any
element that gets a `display` rule and is ever toggled with `hidden` needs
`el[hidden]{display:none}` in the same sheet. The Chrome check now asks which
navs are *visible*, not which are *hidden*.

**99. A JS escape in HTML text renders as six characters.** `\\u2699` inside a
`<button>` shows the backslash. Take 19 did it on the portfolio switcher; take
24 did it again on the Decks settings button, both from Python heredocs that
write `\\u` the same way whether the destination is a `<script>` or markup.
`check_escapes_in_markup()` strips the script blocks from the built HTML and
refuses the pattern anywhere else. Markup takes `&#NNNN;`.


**100. An assertion that greps the source for a field name proves the code
mentions it, not that the data carries it.** Take 25 shipped "full-text search
over card text" and asserted it with `/p\.text/.test(js)` — green — while
`text` was not a column in the bundle at all. Every search silently matched
nothing on text and the preview line rendered empty; the screenshot showed the
gap, not the harness. This repo's smoke suite leans on source-pattern
assertions for *structural* claims ("the reward is earned from the listener"),
which is fine. For a *data* claim the test must touch the data: count the rows
that carry the field, search a real phrase, find the card. The bundle now
carries cleaned text (+1.3 MB raw, +0.1 MB gz), and the assertion finds a
Blocker by its own text.


**101. A set can contain cards numbered for other sets.** MEASURED at take 26:
TCGCSV's *Extra Booster: One Piece Heroines Edition* (EB03) holds 90 EB03-
numbered cards and one each of EB02-, OP05-, OP09- and ST18- — reprints
carrying their original numbers. Three consequences. A string sort of a set's
numbers puts them first (fixed: sort on the numeric suffix). Set completion
should count them — a collector finishing EB03 wants all 66 cards in the
box, whatever they are numbered — and it does. And the scanner's set chip
must not *exclude* a number whose prefix disagrees with the chip: `candidates()`
narrows by `number_group_in_set`, which is built from the printing's actual
group, so an OP05-numbered reprint scanned under the EB03 chip resolves to the
EB03 printing. Checked, not assumed; it would have been an easy place for a
"wrong prefix, wrong set" shortcut.


**102. "Nightly prices" meant nightly for the BUILD, not for the phone.** For
twenty-six takes the pipeline fetched TCGCSV every night, the catalogue in the
seed was a day old at most, and the installed app read the copy it shipped
with and nothing else — a collector on take 15 had take 15's prices until
take 16 was installed. Market Movers, the delta on every tile, the chart from
history and the stale banner were all true of the build and false of the
phone, and the banner's own copy said "Sync when you are online" for a Sync
that did not exist (landmine 88's shape again, caught this time by grepping
for the handler before wiring an alert to it). Take 27: `refreshCatalogue()`
fetches the nightly `manifest.json` from the Pages site, then `catalog.json`
if newer, writes both to `Directory.Data`, and `loadCatalogue()` takes the
newer of disk and bundle. Opt-in until `UPDATE_URL` is set; declared in
PROVISION; the app's first load-bearing network call, and it is idempotent by
source date so a flaky connection cannot double-apply.


**103. A gate piped through `tail` seals anyway.** Take 28's seal chain was
`python3 tools/gate.py 2>&1 | tail -1 && … zip …`. The gate found landmine 99
on the binder's page buttons and exited non-zero; `tail` exited zero; the
`&&` chain continued; the seed was zipped and its hash announced. The gate
had done its job and the plumbing threw the answer away. `tools/seal.sh` runs
the gate unpiped under `set -euo pipefail` and *is* the seal. **A guard whose
result is not on the path to the decision is a guard that prints and does not
gate** (landmine 55's rule, one level up).

*Same take, an hour later:* `bash tools/seal.sh | tail -1` — the script that
exists to keep the exit code on the path, piped. And `seal.sh` deleted
`catalog/manifest.json`, so the next gate run reported a broken validate
selftest on a tree the seal had just emptied. The seal keeps the manifest, and
is run bare: `bash tools/seal.sh`, nothing after the filename.

**104. The entry that was announced and never written.** This landmine, 103,
was described to the owner at the end of take 28 and again at take 29. It was not
in the file. The script that wrote it was chained with `&&` after a
`build_app.py` that failed on a missing manifest — the manifest `seal.sh` had
just deleted — so the write never ran, and the confirmation line I read as
"landmine 103, seal.sh, AGENTS" was not in the output; I saw what I expected.
The gate could not catch it: nothing in `tools/` cited 103, so nothing was
dangling. Two rules. **A ledger write is never chained behind an unrelated
step** — it is its own command, first. And **a claim in the session about a ledger is
checked against the file before it is made**: `grep -c '^\*\*103\.'` is one
line and it returned 0.


*Fired again at take 37 (landmine 112): four writes in one script, one assert, the rest never ran, and the seal line was read as if it meant them.*

**105. A workflow written at take 4 and a pipeline grown to take 29 had never
been read against each other.** Take 30, on the eve of the first real run,
found three things that would have failed silently or loudly on the second
night and one on the first:
- **The nightly never committed the price-history sidecar back.** `history.py`
  appended on the runner; checkout the next night started from the committed
  copy; history would never have accrued past the seed, and every 7d/30d
  delta would have stayed empty *forever*, with every screen reporting that
  as "not enough history yet" — true words, wrong reason. Landmine 66 on CI.
- **`gh release create` on an existing tag fails**, and the cron builds the
  same take every night. Create once, then `--clobber` the assets.
- **`build-tools/36.0.0` was pinned**; the newest present is used.
- **The signer was verified by hand in the session for eleven takes and never in
  the script.** It is a gate in `apk.sh` now.
The rule: **before the first run of anything on a machine you have never
seen, read the script against every tool it calls, in the current tree.** The
scripts were correct when written; the tools moved; nothing checked.


**106. A percentage guard with a sample of one.** The first run on a GitHub
runner: 6,657 hashes restored from the sidecar, 204 known-unavailable skipped,
**one** new printing to fetch (EB05-025, image not yet published — it 403s
from anywhere). One fetch failed; `miss > len(rows) * 0.20` read 1/1 as
100%; the pipeline stopped with 97% coverage already on file and the gate's
coverage check — the actual guard — never got to run. The sibling guard two
lines above already required twenty; this one had been written at take 3
against a full pass of 6,860 and never met a small denominator. Below twenty
attempts, a failure is recorded as unavailable and the run continues.
**A rate is not a rate until the denominator is one you would trust by eye.**

**107. `permissions:` grants what it lists and nothing else, and the failure
reporter was not on the list.** A9's "open an issue when a night fails" step
failed on the first failure with `Resource not accessible by integration
(createIssue)`: the workflow granted `contents`, `pages` and `id-token`, and
`issues: write` was never among them. The step that exists to make failure
visible was itself invisible on the one run that mattered. Added — and
because `build.yml` is hand-pasted, the owner pastes it once more; the runbook
says so and 2b's checks still apply.

*Measured on the same run:* TCGCSV ingest took **3 seconds** on the runner —
174 requests, no throttle. APEX 205's risk is absent for this source, and
A-205's note in §2 is updated to say so.


---

**108. A push made with `GITHUB_TOKEN` starts no workflow. INFERRED from
GitHub's own documentation, read at take 33 (docs.github.com, "Triggering a
workflow"): events created with the repository's `GITHUB_TOKEN` do not create
a workflow run — the rule against recursive runs — with exactly two exceptions,
`workflow_dispatch` and `repository_dispatch`.** `bootstrap.yml` said "that
push triggers build.yml" from take 9 to take 32, and the RUNBOOK repeated it.
It never had; the owner only ever used the upload-at-root path, where `build.yml`'s
own `seed` job commits and the `bundle` job follows in the *same* run, so the
claim was never tested. Fix: `permissions: actions: write` and a last step
`gh workflow run build.yml --ref "$GITHUB_REF_NAME"` — dispatch is the
exception, so the token may ask for the build by name. A hand-pasted file,
so the owner pastes it once more. The general rule: a workflow that pushes and
expects a `push:` workflow to follow is a workflow that runs once and reports
success.

**109. The nightly commit message dated the fetch, not the source.** The
sidecar keys prices by TCGCSV's own date (landmine 3), but the commit that
carried them said `nightly: prices $(date)` — the runner's day. Rehearsed at
take 33 against a bare remote: the commit that added 2026-09-02 said
`prices 2026-09-03`, on the exact line RUNBOOK §8 tells the owner to look for.
The message now reads the newest day in the file. Small, and the same
mistake as landmine 3 wearing a commit message: a date on a thing must be
the thing's date.

**110. A download link is a no-op in Capacitor's WebView, and a reinstalled
app cannot read its own old backups. Found at take 34 by reading, on the
feature PROTOCOL §9 says must exist first.** `exportCsv()` built a `blob:`
URL, clicked an `<a download>`, and toasted *Exported N rows*. In Chrome that
saves a file; in the Android WebView Capacitor installs no `DownloadListener`
and a `blob:` URL has no handler, so nothing happens after the toast — the
A-1 family (renders in the browser, not in the APK), on the one export the
whole project promised from take 1. It was verified by smoke and render for
thirty takes and never on a phone, because neither harness can see an intent
that did not fire. Fix: on a device the CSV is written to the app cache and
handed to `Share.share({ files })` (definitions read first, landmine 73), so
the collector picks Drive, Files or Gmail; the download stays for browsers;
smoke stubs both plugins and asserts the uri handed over, with the browser
path as the control. Companion, same take: `Documents/OPTCGHub` is readable
only by the install that wrote it — scoped storage on Android 11+ treats a
reinstalled package as a stranger to its old files — which is exactly the
landmine-34 case, sideload out, Play build in. Restore now falls back to the
system file picker, which sees whatever the phone does. The settings copy no
longer says the backup "survives uninstall" unqualified. INFERRED for the
device until the Fold shows it; the mechanics are plugin calls read from
their definitions. Rule: a feature that hands a file to the user is a feature
that must be seen to hand it over on the phone before it is called built.

**111. A harness assertion that matches prose is not measuring the product,
and a public repo is a published document. Take 35, both halves at once.**
Stripping comments from the shipped `app.js` (the scrubber) made exactly one
of 255 smoke assertions fail: *"the chart marks purchases separately"* was
matching the words `count changed` — in the comment explaining the tick, not
in the code drawing it. It had passed for fifteen takes on a sentence. The
scrubber now runs inside `build_app.py`, so smoke and render only ever see
the artifact with no comments in it; an assertion has to find code or fail.
Second half: the repo was public from its first commit (Pages on a free plan
needs it), and the ledgers named the owner 157 times, used a conversational
word for a working session 21 times, and carried the build container's
home path — none of it a secret, all of it a signature. `tools/scrub.py
--check --docs` is in the gate: first name, AI-vendor names, that word,
credential-shaped strings, container paths, leftover markers, across the
shipped files, the public text, the ledgers and the source. A planted
instance of each is shown to fire (`--selftest`). The one-time rewrite that
made the tree pass edited 196 lines and, in passing, rewrote the very line in
this take's own HANDOFF entry that recorded the count of the word it removes
— caught by grepping after (landmine 104's rule), fixed by describing the
word instead of using it. A scrubber that rewrites text will rewrite the
sentence that says what it rewrites.

**112. A seal that removes `node_modules` sends the next take's render into
DOM mode, and a seal read off its last line does not hear it. Take 37.**
`seal.sh` deleted `node_modules` before zipping — needlessly, the zip already
excludes it — so puppeteer was gone at the next `pipeline.py render`, which
fell back to the DOM check and printed *10 passed (mode: dom)*, exactly as
A-53 asks. Nobody read it; the entry already said "51 (Chrome)". Same take,
same shape as 104: four ledger writes in one script, the third assertion
aborted the rest, and the seal ran on two docs that still said the previous
take. Both were caught only when the outputs were grep-checked afterwards,
and both cost a take (A-203: a reseal is a new take). Fixes: the seal keeps
`node_modules`; the gate requires Chrome's receipt (`www/render.png` newer
than `www/app.js`) so a DOM-mode build cannot seal; PROTOCOL §0 gives the one
command that rebuilds a seed in full. Rule: a verifier that names its own
downgrade still needs a gate that refuses to ship on it.

**113. The source text has lost a minus sign, and two of my own actions
shared a name. Take 51, both found by the effect parser's fixtures.** Forty-
eight catalogue lines read *Give up to 1 of your opponent's Characters 2000
power during this turn* where eleven siblings read *−1000*; somewhere between
the card and TCGCSV the sign went. No card in this game raises an opponent's
Character, so the template reads the bare number as a reduction — the one
place the parser infers instead of reads, marked `sign_inferred` in the
data and said in A23. Second half: the search's "put the rest at the bottom"
step was named `rest`, and so was "rest an opponent's Character"; the engine
took the first branch and tried to rest a card that was a pile. A test that
happened to exercise both caught it; a new smoke assertion now checks every
action name the parser emits is one the engine handles, and a fixture that
looked for *Sanji-type* cards exposed a third thing: bracketed tokens are
names or types and the text does not say which — *[Sanji] or [Big Mom
Pirates] type card* is a named card OR a typed one. The parser now classifies
each token against the catalogue and refuses a line whose token is neither.
Rule: when the same word means two things, the data decides, not the
grammar; and every symbol the parser emits must have a consumer, checked.

## §2 — Inherited from APEX ORV

These fired on the sibling repo. They are cited by their APEX number and are
assumed to apply here until proven otherwise.

**A-1.** Renders in the browser but not in the APK — asset path and scheme
differences between `file://`, the Capacitor `https` scheme and a dev server.

**A-3, A-4.** Works on wifi, dead offline. One CDN reference passes every bench
test and dies where it matters. PROTOCOL §8 exists for this.

**A-7.** Folding is a configuration change. Without `android:configChanges`
covering `screenLayout|smallestScreenSize|screenSize` the activity is destroyed
and recreated — WebView reloads, camera state lost. Persist state regardless.

**A-32.** A clean checkout cannot rebuild the data. Artifacts on disk hide broken
producers. PROTOCOL §6b.

**A-33.** A gate check stops running for no reason. Every check needs a negative
control that proves it can fail.

**A-35, A-199.** CI builds an app you do not recognise, because an environment
override outranked the seed. Region/config authority lives in the seed, never in
the workflow file.

**A-39.** A verifier passes while the product fails. Measure the shipped
artifact, not a copy of it.

**A-40.** Build works in CI, dies locally — or the reverse. The sequence lives
in `tools/pipeline.py`, not in the workflow, so the two cannot diverge.

**A-46.** `GITHUB_TOKEN` cannot write `.github/workflows`. The seed carries
`ci/build.yml` for hand-pasting and never the workflow itself.

**A-53.** A check that skips instead of failing. A skipped assertion reads as a
pass in every summary. `render.mjs` falls back to a DOM-level check when Chrome
is absent and NAMES what it did not verify, rather than counting those as green.

**A-54.** A test fails but the product is fine — fired eight times on APEX. Verify
the check before believing it. This is PROTOCOL §1 and AGENTS rule 2.

**A-48.** A metric that flatters a broken build. A number that only ever moves
in the right direction is not measuring anything. Landmine 44 is this with a
different face: 6,880 rows for 6,860 cards, and every other signal green.

**A-49.** A detector that cries wolf. Landmine 42 is this one, firing on day one.
A guard that cannot distinguish "not yet" from "broken" gets widened, and a
widened guard stops guarding.

**A-69.** A source has data but no layer draws it. Smoke proves a code path
executed; only a render proves something appeared. Both are needed and they
measure different things on purpose.

**A-75.** `www/` stale, version stamp current. The stamp must be written into the
BUILT artifact, never the source, or a build reports a take it does not contain.

**A-74.** HTTP 200 with an empty body. See landmine 5, which is this one firing
here on day one.

**A-78.** Failure surfaces far from its cause. Fail plainly and early, with a
message naming the actual problem.

**A-83.** Every CI job is a fresh runner. A dependency installed in one job does
not carry to the next.

**A-84.** The gate blocks the seed carrying its own fix. Keep all changeable
logic in `ci/*.sh`, which the seed updates, not in the workflow.

**A-85.** `checkout` defaults to the commit that triggered the run. The seed job
pushes a newer one. Always `ref: ${{ github.ref_name }}`.

**A-95.** Tuned to one screen size. A Fold is two devices and the render harness
checks 360 / 412 / 673 / 820 for that reason.

**A-96.** User-facing text inside the workflow freezes at whatever take was last
pasted. Release notes live in `ci/RELEASE.md`, in the repo.

**A-98.** A document kept apart from the thing it describes drifts. Generate the
tester guide from the repo into Pages.

**A-99.** A failed assert silently drops the whole patch. `assert old in s`
before every replace, grep after.

**A-203.** Two seals under one take number. A reseal is a new take — bump BUILD,
bump the title, say what changed. The take number is the only handle the owner has
on what is on his phone.

**A-204.** `pkill -f` / `pgrep -f` match the calling shell's own command line.
Get the pid in a call that does not mention the file, kill it, edit in a
separate call. Symptom: a tool call returning -1 with no output right after a
kill.

**A-205.** A pipeline step that fetches from a third party will be throttled on
CI. APEX measured 12x slower on GitHub's cloud IPs than locally, and two builds
sat on one step until the 90-minute timeout. Rule over there: fetch HERE, ship in
the seed, CI consumes. **Applied here at take 9:** artwork hashes and daily prices
are already committed sidecars and CI only *restores* them. TCGCSV ingest is the
one fetch CI must do — it is 174 requests to a purpose-built mirror, it fails
loudly if throttled (landmine 5), and the app keeps running on its last catalogue
if a night is lost. That is the accepted exposure and it is now written down. *Measured take 31 on the first real run: 3 seconds, 174 requests, no throttle.*

**A-207.** A detached process does not outlive the turn. This repo hit it at
take 3 (landmines 47, 48) without knowing the sibling had already named it.
Rule: a long step completes inside the turn that started it, or is resumable
from disk. Corollary: never narrate a background job as done until its exit
line is in the log.

**A-208.** Two renderers on one box starve each other to all-zeros — the
signature of a broken app, produced by a healthy one. Count real node processes
before launching a render, with `ps -eo comm | awk '$1=="node"' | wc -l`, not
`grep`, which matches its own command line (A-204).

**A-210.** A silent detached-process death is DISK before it is anything else.
Every killed puppeteer run leaves a ~133 MB Chrome profile in /tmp. When a
background job produces an empty log after its full expected runtime, run it in
the foreground first, and `rm -rf /tmp/puppeteer_dev_chrome_profile-*` before
blaming the environment.

**A-211.** An idempotency marker that the OLD patch also carries never upgrades.
Version the marker and REPLACE an older block. `ci/apk.sh`'s signing step is
`OPTCGHUB-SIGNING v1` for this reason, and it strips any `v\d+` it finds before
writing. Companion: read the signer back off the artifact Play actually
receives, not a derived one.

**A-212.** A render that dies at the same check every run, process gone rather
than an error, is memory before anything else. Keep enough of a failure's stack
to read it; a 120-character truncation is not evidence.

**A-202.** A hand-pasted workflow rewrite dropped the seed job and every run
afterwards rebuilt the same stale take at full green for a week. If `ci/build.yml`
is ever rewritten, the `seed` job must survive and `optcghub-seed*.zip` must stay in
`push.paths`.
