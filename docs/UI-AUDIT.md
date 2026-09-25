# UI-AUDIT — the UI series' checklist (A42)

*Current as of take 117.*

The audit behind the UI series, taken on the take-104 source by four
independent read-throughs (headings and copy; components, icons and
contrast; the harnesses and the record; the session's own). Line numbers
are `src/app.html` **at take 104** unless a file is named; they drift as
takes land, so search for the quoted text. Each take ticks what it
closed and names the take beside the box. The rubric is the
ui-ux-pro-max checklist (accessibility, touch, layout, type and colour,
motion, forms, navigation, charts), applied to this app's own design:
four font roles, three palettes, one sprite.

The owner's rulings for the series are in A42. The short form: art used
boldly, hot-linked, nothing drawn from scratch; the palettes stay;
Prep & Play, then Hunt, then Collect; C on Decks, A on Sealed, A's
compact bar one level down, no banner on Collect's Home.

---

## 1. Foundation — take 106

**Tokens**
- [x] One set of tokens in `:root`: type roles `--fs-*` (12 13 14 15 16 18 26 34 44), spacing `--sp-*` (4 8 12 16 24 32), radii `--r-sm/md/lg/pill`, icon `--ic-*`, thumbnails `--thumb-*` (36 52 112), motion `--dur-*`, z scale `--z-*`. *(take 106)* *Take 115: the take-106 thumbnails `--thumb-sm/md/lg` (36 52 112) were never read and are gone; take 110's `--thumb-s/m/l` (32 44 56) are the sizes. `--fs-total` names `.total`'s 46 px.*
- [x] Semantic colours per palette: `--on-accent`, `--accent-ink`, `--line-strong`, `--accent-bg`, `--warn-bg`, `--ok-bg`, `--bad-bg`, `--scrim`. *(take 106)*

**Contrast (WCAG, computed per palette on take 104)**
- [x] Prep & Play accent as text: `#E0553D` is 4.25:1 on card (#1E2128) and 3.79 on card2 (#262A33) — panel h3 (161), `.linkish` (172), `.chip.on`, `.tile .c` 12 px (219), the steppers. Text moves to `--accent-ink` `#E5705C` (5.22 / 4.66); the fill stays. *(take 106)*
- [x] The Prep & Play knob label `#F1EFE6` on `#E0553D` is 3.29 (423); `#1A1408` gives 4.82. *(take 106)*
- [x] Nav active label in Prep & Play: 3.25 (447). *(take 106)* *Take 115's review: 4.42 still, over a translucent mix; the active item sits on the opaque selected tint now, 4.61 as painted.*
- [x] `--brass2` as text fails in every mode: the "PORTFOLIO" caption (147), 11 px, 2.68 to 4.40. *(take 106)*
- [x] Collect `--dim2` on card2 4.07: placeholders (68, 185), `.art .ph` (212), `.opt .op span` (293), the `setPic` fallback (3450), the Sealed chip counts (3456). *(take 106)*
- [x] Brass on `#2A2414` in Prep & Play 4.07: `.badge`, `.chip.on`, `.seg.on`. *(take 106)*
- [x] `.ck` rarity on the "have" cell in Collect 3.45; `.ck.have b` 3.17 (Prep & Play) and 4.42 (Hunt). *(take 106)*
- [x] The deck `.curve` bars (#1d2a2e) about 1.1:1 against the card: nearly invisible (393). *(take 106)*
- [x] `picBox` fallback labels (black at 65 % on a colour gradient) 1.64 to 3.23 — the face of every picture that fails (about 203 ids answer 403). *(open: the art take replaces the fallback)* *(take 110: white on a dark pill, above 4.5:1 over any card's ground; measured below by smoke)*

**Text under 12 px** (25 rules)
- [x] nav 10.5 (446); `.kwtag` 9.5 (410); `.art .own` "YOUR SCAN" 9 (214); `.free` "AD" 9 (156); `.hero .who .cap` 11 (147); `.art .ph` 11 (212); `.tile .px .dl` 10.5 (225); `.badge` 10 (226); `.opt .op span` 11 (293); `.prov` 11.5 (303); `.fcount` 10 (354); `.pocket .tag` 9.5 (365); `.pocket .n` 9 (367); `.ck` 10 (374); `.ck .qty` 9 (379); `.curve` labels 10 (395-396); `.dkrow .n > span` 11.5 (403); `.dkrow .cost` 11 (409). *(take 106)*
- [x] Inline and JS: the "Leader" placeholder 10 (1590); card-text preview 11 (2213); `picBox` label `w/4` → 8-11 (3435); `setPic` fallback 11 (3450); "alert"/"watching" captions 10 (3463, 3505); the picker placeholder 9 (4532); the detail art number 10 (4567). *(take 106)*
- [x] `deckCover`'s 7 px name inside its SVG (1550) — goes with the covers at the art take. *(take 109: the name is gone; the row names the Leader)*

**Hard-coded colours → tokens**
- [x] `#1A1408` (155, 263, 354, 422, 429) → `--on-accent`; the Prep & Play override `#F1EFE6` (423) goes. *(take 106)*
- [x] `#2A2414` (227, 310, 346), `#1C1E1A` (279), `#1F1B12` (250), `#101a1a` (3022) → `--accent-bg`. *(take 106)*
- [x] `#2E2410` (142), `#231c10` (273) → `--warn-bg`; their text `#E9C46A` → `--gold`. *(take 106)*
- [x] `#1E2A1C` / `#2E1C18` (391) → `--ok-bg` / `--bad-bg`. *(take 106)*
- [x] `#1d2426` (411, 456), `#1a1e20` (281), `#151a1c` (351), `#182A3A` (1883, 2032) → `--card2`. *(take 106)*
- [x] `#1d2a2e` (393), `#1c2225` (305), `#333c40` (272), `#39424766` (237) → `--line`. *(take 106)*
- [x] Scrims `rgba(0,0,0,.82/.72/.5/.45)` (266, 366, 368, 438) → `--scrim`. *(take 106: the sheet's .82 is `--scrim`. Take 115's review: the pocket label's fade (.72), the count pill (.5) and the nav's shadow (.45) stayed black literals. They sit over art or the near-black nav and need not follow the mode, like take 110's measured strip scrims; this line said more than shipped.)*
- [x] Legacy `--teal` (156, 297, 3022) → `--brass`. *(take 106)*
- [x] Canvas: `#26394B`, `#C9A24A`, `#A08E70` and the brass rgba (2724-2754) and `sparkOn` (4365, 4369) → read the palette with `getComputedStyle`; the deck chart is brass in red mode today. *(take 106)*

**Small bugs**
- [x] `g-roger` is not in the sprite (removed take 63), but `G('roger', 64)` (3016) and `KW_GLYPH` Banish (1091) build it at runtime: two blanks (landmine 142). *(take 106)*
- [x] `.range` defined twice (154, 350): the filter's min/max price inputs inherit 14 px and zoom the page (landmine 119). *(take 106)*
- [x] `.mode button` defined twice (420-428: min-width 118 then 96, the comic face then the heavy); the buttons are 96/106/96 px under a knob of one third. *(take 106)*
- [x] `.empty::before` (452) stacks an invisible 64 px block over every empty state. *(take 106)*
- [x] The toast (z 50) sits under the tour and the curtains (z 60). *(take 106)*
- [x] The splash: its ground is Collect's `#0B1622` (take 98) but its glow and text follow the mode. *(take 106)* *Take 115's review: its mark (the swords) still took the mode's colour; it is Collect's brass in every mode now.*
- [x] Reduced motion covers only the knob (430): not the tour's smooth scroll (2008) nor the splash fade (97). *(take 106)*
- [x] The render knob check measures mid-slide on a busy machine (landmine 143). *(take 106)*

## 2. One header — take 107

- [x] No shared header: 13 screens use `.bar` + `span.tab.on role=heading` (the tab style); Collection (539), Search (607), Scan (622), Detail (654), Deck (738), Home (495, a tab pair) and More (built at 4744) open with something else. *(take 107: a `header.appbar` in all twenty screens; the title an `h1` in one place, face and size -- one height across all twenty, measured in Chrome)*
- [x] Hunt titles carry the swords (two different SVGs, 573 vs 582); the other modes carry none. The swords SVG is pasted five times. *(take 107: no title carries a mark; the splash keeps the swords, now the only copy)*
- [x] The right slot differs on every screen: a pill, a select, ghost buttons, a note, an unlabelled gear (727), nothing. *(take 107: one actions slot, the gear to More always last on a screen in a nav)*
- [x] No visible back on any screen one level down (deck, checklist, binder, wants, trade, detail, More, Diagnostics, Market Movers). *(take 107: the arrow on all eight; Market Movers stays a state of Search, a nav screen, ruled out in HANDOFF)*
- [x] No `h1`; sheet titles are `h3` in the body face (no `.sheetbody h3` rule); duplicate titles "Performance" (518) and "Events" (3710). *(take 107: the header's `h1`; the sheets' titles in the display face with a close button; the two duplicate panel titles are copy and move to the voice, below)*
- [x] Hunt has no route to More (A37): the gear on every main screen. *(take 107: the gear on every screen in all three navs)*
- [x] Home's Overview/Performance: `role=tab` with no tablist. *(take 107: a tablist of two buttons, one tab stop, the arrow keys)*
- [x] Back over an open `#filters`, `#leaderPick` or `#printPick` (landmine 137's overlay list) — unconfirmed; verify in Chrome. *(take 107: PROVEN in Chrome -- the filter sheet stayed over Home, the Leader sheet over Decks -- and fixed; landmine 144)*

## 3. Controls and icons — take 108

- [x] Emoji and symbols as icons: 🔍 (550, 951), 📷 (608), ⚙ for filter (553, 610), settings (727) and nothing (624), ☆★ (552), ☐☑ (757), ↶ (645), ⇄ (2119), ↻ (2373), ⋯ (5180), ▾▸, ↗ on some external links and not others, − × ✕ for remove. *(take 108: every one a sprite symbol; the gate refuses an icon drawn as a character -- literally, as an entity or as an escape)* *Take 115's review: two remove buttons still drew ×, and Local's Open and Events' Register had no external glyph; the removes draw a trash glyph and the gate refuses a remove drawn as ×; every link that leaves carries the glyph.*
- [x] One glyph, several meanings: `g-life` Play/Events/Want list; `g-stage` Sealed/Collection/Binder/scan-from-photo; `g-counter` Releases/Backup; `g-blocker` Scan/Bulk; `g-trigger` Movers/Torch; `g-compass` Home/Local; `g-spyglass` Search/Cards/Export. *(take 108: new symbols for Scan, Collection, Sealed, Releases, Events, the actions, the torch and scan-from-a-photo; Local takes the pin; the game's glyphs keep the game's meanings; smoke holds the map as a table)* *Take 115's review: g-minus also meant remove and g-close the Sim's trash; a trash glyph (Lucide's trash-2) now means remove or discard, g-minus one fewer and g-close close.*
- [x] Touch under 44 px: steppers 34 (301), deck +/- 28 (405), the search-bar icon buttons about 15 x 22, chips 35, `.linkish` 36, the slider 36, the currency pill 29, Releases buttons 33, "+20 for a short ad" 27, `#dkName` 34. *(take 108: 520 of 1,673 controls to none -- a real 44 where growing costs nothing, a 44 px hit area round the drawn chip where a row would grow; render reads every control's square in Chrome)*
- [x] No pressed state (`-webkit-tap-highlight-color:transparent`, 59) and no disabled style (25 `disabled` buttons look live). *(take 108: every control lightens when pressed, the compact ones give a little; a disabled button is at 0.45 and says not-allowed)*
- [x] Icon buttons with no name: the gear (727), the "−" steppers (1886, 2102, 2107, 2112), "⋯" (5180), "✕" (5213); toggles with no `aria-pressed` (552, 757). *(take 108: every icon button named; aria-pressed on the favourites star, "Owned only" and "for this deck")* *Take 115's review: eleven more toggles had no `aria-pressed` (the filter chips, sort, ranges, the binder's sets, the checklist's mode, the condition) and the mode slider's tabs no `aria-selected`; every one has it now.*
- [x] Found by the 44 px sweep: the scanner's shutter row sat 52 px under the nav at every size -- its height never took the sticky mode slider off. *(take 108, landmine 146)*

## 4. The art layer

- [x] The record first: landmines 26 and 28 corrected (display-only, hot-linked, used boldly; nothing bundled; offline falls back to the colour tile); 30 and 31 stand; NSP's "may not ship" line; A6, A16, A29, A41; V1-STATE; PROVISION's runtime rows; PLAY-LISTING; `assets/user/README.md` (whose first line also names the owner and is outside the scrubber's list); the comments in the Hunt palette, `deckCover`, `refArt` and More's data sources. *(take 109; More's data sources stayed true -- display is not storage)*
- [x] `artUrl()` from the stored URL only (never a card number, AGENTS §3); the large size measured on the runner (`_in_1000x1000` served 600 x 838 at take 6; `{id}.jpg` unmeasured; the SAMPLE watermark unmeasured). *(take 109: measured every build, 40 of 40, median 600x838; `{id}.jpg` 403 for 241 of 241, the retry gone; the stamp on 38 of 40 card pictures, one band at 45-60 %, so art is cut above 42 %)*
- [x] Decks: C (the Leader's art blurred behind the crisp card; the title in the shared slot). Sealed: A (an art banner). Home: no banner. The card sheet: the backdrop from the card's own art. Offline: the card's game colours. *(take 109: all but Sealed's banner, which is take 110's)* *(take 110: Sealed's banner, the newest set's top card; at the owner's word the card no longer rises from behind Decks' title, and the blur shows the band above the stamp whole)*
- [x] Leader-art deck covers (user decks show the Leader at 44 px, ready-made decks a drawn SVG: one idea, two treatments). *(take 109: the Leader's picture over the drawn cover)*
- [x] Set headers in Sealed and Releases with an art strip; the Play board's Leader art; art empty states. *(take 110: every heading in Sealed a strip, the Play counter's Leaders; Releases' rows and art in empty states ruled out with reasons in the HANDOFF)*
- [x] The runner's look: `check` runs the look and keeps the PNGs, since this session's VM reaches no image host. *(take 109: not needed -- the VM reaches the image hosts, and the look fetches its pictures in Node behind the proxy, landmine 152)*
- [x] Thumbnails: seven widths (30 34 36 44 48 52 56), five radii, three ratios → the three `--thumb-*`. *(take 110: THUMB / --thumb-s, -m, -l -- 32 a dense deck-building list, 44 a list row, 56 a sealed product; two radii stay, a card's 6 and a box's 8)* *Take 115's review: the trade and want rows (34 px) and the picker (52 px) did not read them; they do now (32 and 56).*
- [x] The ready-made decks drawn at the bottom of the deck editor since take 66 at the latest, though take 61 put them on Decks, and a smoke line named for the place that never checked it (landmine 149). *(take 109: back on Decks; smoke reads the section)*
- [x] The picture retry to `<id>.jpg` never served (403 for 241 of 241, landmine 150). *(take 109: gone)*
- [x] Whole-card pictures (thumbnails, a deck's Leader, a card's own page) show the SAMPLE stamp wherever the publisher's picture has it -- the owner's call whether they show the card above the stamp instead. *(asked at take 109)* *(take 110, the owner: "It should show the whole card")*

## 5. The voice

- [x] Casing: sentence case for every heading, button and chip (outliers: "Most Valuable" 512, "View All" 514, "Market Movers" 540, "Trade Analyzer" 541, "Bulk Actions" 542, "+ Add a Graded Card" 702, "Starter Decks" 3767/3774); literal caps ("YOUR SCAN" 3024, "GRADED" 2902, "FAILED" 4752, "REPLACES" 3206, "MEASURED" 3894); lowercase states ("offline ok" 498, "☐ own" 757, "for this deck: off" 809, "given" 2110, "+cal" 3724). *(take 110: every one, and a sweep of the shipped labels found no others)*
- [x] Duplicate panel titles: "Performance" under Home's own Performance tab, and an "Events" panel on Events (moved here from the header section at take 107). *(take 110: "Against what you paid", "Store events")*
- [x] One word per thing: collection (D17: Collection for Portfolio — 504, 2506, 2508, 2519); card vs printing ("Search all N cards" 5435 vs "N printings" 2915); Refresh (#huntSync says Refresh at 3482 and Fetch at 3484; Sync now 4777); Remove (Delete, Clear, − × ✕); Sim (simulator, hot-seat, pass the phone); Export (Export CSV); Back up; Want list (wants, wanted); keywords one way (blockers, Blocker, [Blocker]). *(take 110: Collection (D17; the CSV column and the backup keep "portfolio"), Refresh, Export CSV, Back up, pass the phone, the want list, Blocker; Delete stays for what is destroyed and Clear for a list or a filter emptied -- two things, two words)* *Take 115's review: the deck's stats chips, the Sim's toasts and the tour still wrote keywords three ways; one way now (Blockers, no Rush, an active Blocker, a Trigger), and the checklist's toast names the want list.*
- [x] Formats: one date formatter (eight styles today, ISO with a literal T at 3206, 3474); one percentage rule (0, 1 and 2 decimals); × not x (3155, 4811, 5347); curly quotes and apostrophes. *(take 110: dayText and momentText -- "Sep 23", "Sep 24, 6:23 AM" -- ISO only in the diagnostics and self-test reports; one decimal for a percentage, none from 100 %; x as ×; 186 apostrophes curled in the markup and the script's strings)* *Take 115's review: four straight apostrophes, set completion's whole percent, and the ISO day on Local's events and in the release reminders remained; each is fixed (the .ics stays ISO).*
- [x] Money: `money(Math.abs(d)).slice(1)` (1621, 1904, 2574, 2665, 2670, 4684) drops the "$" in dollars and the "≈" in a converted currency; "in the last all time" (2574); the min/max placeholders say "$" in every currency (898, 900). *(take 110: signedMoney keeps "$" and "≈"; "since the first day on file"; the price filter typed and shown in the currency on screen, kept in dollars)*
- [x] The developer's voice out of the UI: `<title>` "take __TAKE__" (6); "(R6)" (963); "(PROTOCOL §10)" (2993); "MEASURED:" (3894); "(landmine 25)" (4721); "Credits (A17 — ads not wired; gate OFF)" and "+20 (dev)" (4789-4795); the tour's "Two faces" and "A simulator is on the roadmap" (1981-1983); "Store stock and local shops come to this mode next" (578); "store events come with the local view" (3782); "Sealed product is manual." (4812); "the field is offline by design" (4800). *(take 110: every one; the test credits moved to Diagnostics; smoke refuses the list in the shipped app)*
- [x] Button labels of three words at most (the Play Start/Next/End buttons 2120, the Sim buttons 5163-5214); labels for the inputs that have only a placeholder (551, 609, 741, 756, 811, 848, 855, 898, 900, 952, 2521; the Sim selects 5161-5164). *(take 110: the Play counter's Start / Next turn / End turn with what happens beside it; every field named; the Sim's setup "New game"; More's link rows stay sentences)* *Take 115's review: the Sim's in-game buttons still ran past three words; each is three at most now, with what happens in a note beside it, and a button beside a note keeps its width (landmine 193).*

## 6. Polish

- [x] Motion tokens applied (sheet slide, crossfade on mode switch, press feedback), reduced motion honoured everywhere. *(take 110: every transition on --dur-press, --dur-ui or --dur-sheet; a sheet rises as its scrim fades; a tap on the slider crossfades the new screen and turns the palette; take 106's one reduced-motion rule stops them all, measured in Chrome)*
- [x] Loading, empty and error states per list; tabular figures on every number. *(take 110: one empty state -- glyph, what is missing, what to do -- on every list that fills a screen, and Sealed's empty search, which had shown nothing since the stock panels arrived; loading and error were already there (a Refresh disables, a failure toasts); tabular figures are the body's default)*
- [x] The ui-ux-pro-max pre-delivery checklist, item by item, in the PR. *(take 110: the take's pull request carries it -- accessibility, touch, layout, type and colour, motion, forms, navigation, charts, content -- each item with what was measured)*

## 7. The last look — take 111

Every screen and sheet at both of the Fold's sizes (`node tools/look.mjs 111`, 34 views each), read twice. The HANDOFF's take-111 entry has each finding with its before and after.

- [x] Lines and words: a leading "·" on a printing with no number (search, movers, trade, wants, alerts, the scan result); the filter's "printings" and "cards" (now results and lines); "· tap for the checklist"; "CHF CHF"; About's ISO day; "From Bandai TCG+, ."; the deck prompt cut at 411 px; a badged name cut by the ellipsis on the phone (landmine 164). *Take 115's review: the badge still cut in deck, trade, want and alert rows (`.dkrow`); it wraps there too.*
- [x] Layout: the bulk bar off a 411 px phone; Scan's note edge to edge; the Performance tab's panel under Most valuable; rows askew on a textless picture, then the Sealed bell (landmine 161); the ready-made deck's badge beside its name.
- [x] A card's page: Want and the alerts out of Graded (a Watch panel); a sealed product's page (its kind, one triangle, no Graded, Want or list of printings); a DON!! card's page a card's (landmine 162); Save and the cost basis on the collection the page names, and a slab its own line (landmine 163).
- [x] Figures: Set completion counting products and every collection's value; a deck's value without its Leader; the binder opening on empty pockets; a cost basis added without the day's reading.
- [ ] A binder page on the open Fold: a page of nine needs a scroll there. *Take 115, at the MEASURED 749 x 832: pockets of 226 x 316 px, the page ending at 1151 px on an 832 px screen (at the old INFERRED 840 x 757 it was 257 x 358, ending at 1278).* A design choice, left to the UI/UX session.
- [ ] Sealed's banner on the open Fold: the top card cut to the screen's width with its face filling the band (take 111's look, at the INFERRED 840). Its crop at the MEASURED 749 has not been looked at. The UI/UX session's.

## 8. Distributor info — take 112, the owner's word

After the first pictures of Southern Hobby beside GTS: "I don't want them flooding the screen." Two choices were put to the owner and answered: a short line per distributor, and one closed drop-down for the long text.

- [x] A sealed row carries each distributor as one short line under its buy chips ("GTS Distribution · sold out", "Southern Hobby · orders closed May 29"), a 44 px target that opens the product's page with its Distributor info open. The row's name block carries no distributor text.
- [x] The distributor panels on Sealed, and Releases' not-in-the-catalogue list, sit under one closed "Distributor info" each, with a line saying what is inside ("2 distributors · checked just now", "17 products not in the catalogue yet · …").
- [x] A product's page: Where to buy lists sellers to collectors only; the distributors, each with its full words and its own page, are under the page's Distributor info.
- [x] A day on a short line never breaks ("May" / "17" on Releases, the second look).
- [ ] The distributors' names verbatim in the not-in-the-catalogue list ("Bandai - One Piece Card Game: …").
- [ ] One product listed by both distributors shows as two rows in that list.
- [ ] A product with no market price reads "— · market" on its page.

Take 114, the owner's answers to its pictures (HANDOFF take 114):
- [x] GTS's words for its Order Due Date. They are Southern Hobby's words for the same fact: "stores order by Oct 14", "orders close Oct 14" on a row, and "orders were due Oct 14" once passed. The owner: "exactly exactly right, that's fine".
- [x] Each distributor's history on a product's page is tucked behind one "History · …" line, a 44 px button with its arrow at the right edge, closed whenever a page opens. The owner: "it should be tucked away".
- [x] A day in a distributor's long words never breaks ("release Nov" / "20", found by take 114's look), fixed because it was broken.
- [ ] A day in Releases' "mixed · release" group line has no no-break spaces. Found in passing; the UI session's.
- [ ] The history's own look (`.dtl`): size, colour, the spacing of a one-line header. The UI session's.
- [ ] Sealed's GTS counts overlap ("7 sold out, 8 allocated, 1 with an order due date ahead, 3 unreleased without one" adds up to more than its 11 products) and read as separate groups (take 114's look). The UI session's.

## 9. Take 115's look and review -- for the UI/UX session

Take 115 (the production baseline) fixed what was broken or off its own spec and left design to this session. Its look (`node tools/look.mjs 115`, 36 views at the Fold's MEASURED sizes) and its review found these, each there before take 115:

- [ ] The Sim's battle panel reads "5000attacks with": the power is glued to the words, and `.row .nm b{display:block}` catches the `<b>` inside the sentence.
- [ ] The Leader sheet and a deck's printing sheet draw an empty grey box when the picture host refuses a picture (the four unreleased OP18 Leaders; Nami's OP-DD and LT-01 printings); the scanner's picker puts the printing's name in the same box.
- [ ] At 411 px a deck row's second line is cut before its keyword tags ("ST01-006 · Red · 1,000…" hides "Blocker").
- [ ] At 749 px set completion's set names are cut short ("Extra Booster: Anime 25t…").
- [ ] A Sealed row names its kind in the plural for one product ("Boxes", "Collections").
- [ ] Releases now lists an upcoming group whose only listing is its sealed product ("card list not published yet"); none today.
- [ ] Text on Sealed's strips must clear 4.5:1 over a white picture (landmine 191): a lighter scrim needs a heavier text treatment.
- [ ] The tokens nothing reads (take 115, A43): `--teal --fs-label --fs-row --sp-1 --sp-4 --sp-5 --sp-6 --r-sm --r-md --r-lg --ic-sm --ic-md --ic-lg --thumb-s --thumb-m --z-screen` -- use them or remove them.


## 10. Take 117 -- the owner's polish list and this session's rendered audit

The UI/UX session's audit of take 114 (the scratch look at three sizes, the
sheets to the owner) and the owner's own screenshots. Each box is closed by
take 117 unless it says otherwise.

- [x] Sealed's set strips: taller, on the card's face, the release date in words under the name (B3).
- [x] A starter-deck set's products listed twice: once, under Starter decks; the by-set fold skips them.
- [x] A card's page: three cells on every card (Type, Cost or Life, Power), labels above values, a dash for none; 14 px under the row.
- [x] The printing's badge off the title's centre line: on it (measured at 4x).
- [x] The scanner's bottom row: Undo stacked over its word, Review on two lines, the shutter off centre -- a grid that keeps one shape (landmine 203).
- [x] The scanner's hint under the well ran into the frame, then the note, when it took two lines: in the column's flow.
- [x] The mode bar under the status-bar inset once a page scrolled (53 % covered at a 40 px inset): the bar carries the inset.
- [x] The release note on Home: under More -> About, closed.
- [x] A tile whose picture is missing ran the name into the number: the pill stacks over the number.
- [x] The deck editor's bottom row scrolled the page sideways under 380 px: it wraps.
- [x] Off-scale font sizes in the stylesheet (25 at take 114): on the token scale; the three input rules keep 16px (Android zooms under it).
- [x] The nav's label colour set by two rules; the placeholder rule twice; the distributor line in the fill colour: one rule, once, the ink token.
- [ ] The literal radii onto `--r-*` and the script's inline sizes onto the tokens (take 119's riders).
- [ ] Captions under the scan row's icon buttons, if the owner wants them.

## Found in passing, routed elsewhere

- A favicon and a web-manifest icon for Pages, from `assets/icon.svg` (take 113). The UI session's call.

- Bulk delete removes a card's lines in every portfolio and condition, and its confirm values the selection without quantity (2966-2972). A data-loss risk (AGENTS rule 5), outside the UI series: offered to the owner as its own task. *(Fixed at take 110, landmine 155: Delete, Move and Condition take the lines on screen -- the collection, the star, the filter, the search -- and the bar and the confirm count them with their quantities.)*
