# HANDOFF — through Take 118

## Take 118 — 2026-09-25 — Collect on Wano indigo and bright gold, Home's premium pass, Hunt in kraft

Opened before any code (PROTOCOL §6) by the UI/UX session, after take 117
merged and Release take-117 built its APK and AAB.

The owner, word for word, over three schemes for Collect and three for Hunt
drawn as real screenshots of the pre-built copy (every scheme measured for
contrast before it was drawn): "I'm leaning towards a wano indigo actually,
with a bright gold instead of the washed bronze. I also really like the
premium and the most valuable being a scroll of your top 5ish cards, nice
work there"; Hunt "H2 treasure map, kraft"; the premium pass "take it as
drafted"; then, between two golds on the indigo, "I like G1"; and earlier,
"make other parts more premium feeling".

### What this take changes

- **Collect is Wano indigo with the bright gold G1.** The token block:
  bg / card / card2 / line `#100D22 / #1A1633 / #231E43 / #37305C`; fg /
  dim / dim2 `#EFECF7 / #B3ACCF / #928AB0`; the fill `#F2C14E`, its shade
  `#C4962A`, the gold `#FFDF8C`; the ink `#F5CB5C`; the control's edge
  `#766D96`; up / down `#8FD19E / #F0806E`; the glow `rgba(242,193,78,.12)`
  at 50 % 18 %. Measured before drawing, in smoke on every build: fg 14.9 on
  the card, dim 8.1, dim2 5.4, the ink 11.3; the edge 3.6 on the card and 3.3
  on card2 (smoke reads both).
- **Hunt is the treasure map, kraft.** bg / card / card2 / line `#1A1410 /
  #26201A / #322A22 / #4A3E33`; fg / dim / dim2 `#F3E7D2 / #C9B79B /
  #A79579`; the fill `#D6A544`, its shade `#9A7628`, the gold `#EDCB78`; the
  ink `#E2B65A`; the edge `#857665` (3.7 / 3.2); the glow `#3A2C1E` in the
  Hunt shape. Hunt's selected tint is 8 % of the fill, like Collect's since
  take 115: at take 106's 12 % the gold lightens the kraft card until dim2
  reads 4.43 on it; 4.78 at 8 %. Zoro's green (take 76) is the record.
  Prep & Play's block is untouched: three modes, three grounds.
- **Home's premium pass.** The hero is a card on the dearest printing's own
  large art, blurred and scrimmed to the card (the owner's `home-bg.jpg`,
  when it exists, instead); the total wears a gold gradient (`--gold` ->
  `--brass` -> `--brass2`, `background-clip:text`); Overview / Performance
  is a pill switch; the range pills are one pill group, each pill 44 px
  wide; Home's panels are surfaces (the card2 -> card gradient, an inner
  top highlight, a soft drop shadow, 18 px) with caps labels and a fading
  rule; **Most valuable is a shelf** of the six dearest cards -- the
  picture with the printing's word as a badge on its corner, the value, the
  name with its count, and a second line (a product's kind and set, a
  card's condition and number), each a 100 px tap target that opens the
  card as the rows did (take 98); the card page's three cells wear the same
  surface. The reminders' tint and the charts' fallbacks follow the new
  gold; the old brass is nowhere in the page but the share page, a fixed
  page, dark by design.
- The harness pins today's hexes in twenty-four places (render, the look's
  steps, smoke): every pin re-measured for the new hexes, never loosened;
  smoke's per-palette contrast check parses the token blocks and is the
  guard; the words over art keep landmine 158's pixel probe.

### How it was built

- Pre-built on the take-117 copy while take 115 was reviewed, the schemes
  drawn first (`C1-C4` for Collect, `H1-H3` for Hunt, then two golds on the
  indigo) and measured, the owner's picks built as anchored scripts and
  proven with every new guard watched red on 117's build; ported as one
  diff over the take-117 port with `git apply --reject`; the five hunks
  take 115 had touched (the release title, Collect's ink line and the Hunt
  block, which carry take 115's tints; Home's top list, which reads a product
  with take 115's `SEALED.isGoods`; the look's step list) re-applied by
  hand, each anchored and asserted.
- Two of take 115's controls met on the way, re-planted rather than
  loosened: its Collect-tint control planted take 114's 12 % selected tint
  and 14 % bad tint and expected `--dim`, `--dim2` and `--down` under 4.5
  on the first and `--down` under it on the second -- on the indigo with
  the brighter gold only `--dim2` falls under at 12 % (4.20) and `--down`
  clears a 14 % bad tint (5.36), so the bad plant is 30 % (3.91), in smoke
  and in render alike; smoke's plant finds Collect's line by the warning
  tint that follows it, since the shipped stylesheet carries no comments
  and Hunt's tint reads 8 % too. The pin on the tint strengths knows Hunt's
  8 %.

### Measured

- The palettes, in smoke on every build (every pair on the card and on
  card2): Collect fg 14.9 / 13.5, dim 8.1 / 7.3, dim2 5.4 / 4.8, the ink
  11.3 / 10.1, the edge 3.6 / 3.3; Hunt fg 13.2 / 11.5, dim 8.2 / 7.2, dim2
  5.5 / 4.8, the ink 8.5 / 7.4, the edge 3.7 / 3.2; the selected tint's
  texts in every palette, the nav's labels, a chip's count: all at 4.5 or
  more; a count at .6 opacity caught in every palette (the control).
- In real Chrome: Collect's ground `rgb(16, 13, 34)`, Hunt's `rgb(26, 20,
  16)`, the headings' gold `rgb(245, 203, 92)`; the shelf's cards 100 px
  wide and more than 44 px tall, each a button; the total drawn in the
  gradient and the hero carrying the dearest printing's large art.
- The look for take 118 at the owner's MEASURED sizes: 20 steps, 20 ok at
  both -- Home seeded with nine dear cards and a month of readings, the
  shelf and the sets, Performance, the Collection grid, a card's page,
  Search, Sealed and Releases on the kraft, Decks untouched.
- Negative controls, this harness on the take-117 build: smoke red on 10
  lines (the two token blocks, kraft's AA, the old brass gone, the
  surfaces, the hero and the gradient, the pill switch and the cells, the
  shelf and its two button pins, the tint pin), then it stops at the
  hero-art line, which reads a style the old build's hero has not got;
  render red on 5 (Hunt's kraft ground, Collect's indigo, the headings'
  gold, the shelf, the gradient and hero art).

### What I got wrong

- A shelf card widened to its value: a flex item keeps its content's width
  until `min-width:0` (landmine 204).
- The control's edge was measured on the card alone; smoke reads card2 too,
  and both palettes needed a step lighter (`#766D96`, `#857665`). The
  pre-build's comment then called the indigo's edge 3.8 and 3.5; the WCAG
  formula gives 3.6 and 3.3 (both clear 3), and the comment says so now.
- The range pills lost their 44 px squares inside the pill group until each
  kept `min-width:44px`.
- The DOM stub gives the hero no `style.cssText`: the hero's art is set
  through a guarded assignment.
- The shelf's picture box first took the collection's `art` class, then
  `pic`, which the take-93 pin counts; the printing's word first rode the
  name and now sits on the picture's corner, where the take-19 check
  reads it.

### Ruled out

- Collect's other schemes as drawn: C1 the washed bronze on charcoal, C2 a
  navy with a paler gold, C3 a plum, C4 a green-black; and Hunt's H1 (a
  darker green) and H3 (a slate) -- the pair must not share a family, or
  the mode switch stops reading as a switch (Collect and Hunt were both
  gold on dark at take 114; kraft against indigo keeps them apart).
- The second gold G2 (a warmer sun gold): the owner chose G1.
- Most valuable as rows: the owner chose the shelf.
- A light skin or a tint per mode: take 120's question, not this take's.

### Tests

- On this branch (the take-117 merge plus the port, rehearsed first on a
  copy of the merged tree and then equal to it byte for byte), the whole
  pipeline in 368 s -- the catalogue ingested fresh, 6,766 artwork hashes
  restored from the sidecar, coverage 100 % -- then **smoke** 1300 passed,
  0 failed; **render** 225 passed, 0 failed, `(mode: chrome)`; **the look**
  20 of 20 at both sizes, the same figures as the port. `ci/icon.py
  --selftest` 33 ok; `scrub --check --docs` clean; `seal.sh --gate-only`
  as its last line says below the pull request.

### DEFERRED

- Take 119: the surface beyond Home (Search, the Collection grid's tiles,
  the card page's panels, Wants and Trade; Sealed's panels, Releases, Local,
  Events), the tiles' shape, whether Play's panels take it, and the mode
  swipe -- drawn as sheets for the owner, built only from the owner's
  picks; the literal radii and inline sizes onto the tokens.
- Take 120: light/dark.

## Take 117 — 2026-09-25 — the owner's polish list and the audit's fixes: strips, cells, the badge, the shutter row, the top bar, the note to More

Opened before any code (PROTOCOL §6) by the UI/UX session. Take 116 merged
as PR #41 at 16:08 UTC and Release take-116 built its APK and AAB at 16:20.
No after-merge note for take 116 is needed: its Release carries the scene.

The owner, word for word, over the take-114 look and this session's
rendered audit (sent as numbered sheets): on Sealed's set strips "B3 for
sure"; on the printing's badge "center it in the box better, so 1, but
polished"; on the top bar "1 probably - whatever makes the top bar look
seamless while scrolling taking into account the notification bar if the
user has it, and different android OS's"; on the release note leaving Home
for More, "move is good"; on a card's page, "ensure a card always has three
squares in some way, so they're all the same in some way ... Maybe we just
do Character/Leader/Whatever, Cost and Power ... Those three tiles sometimes
hit the box below", then "make power, type, and life on top, rather than
below the value".

### What this take changes

- **Sealed.** A starter-deck set's products -- the decks and their displays
  -- live under Starter decks and nowhere else; the by-set fold skips them
  ("77 products"; at take 114, 32 of 85 strips were deck sets listed twice).
  Every set strip is 104 px, centred on the card's face
  (`.setstrip .artbg.crisp img{object-position:50% 62%}`), the name at the
  title size with "Released Sep 18" or "Releases Nov 20" under it in the
  body face (B3, the owner's pick).
- **A card's page.** Three cells on every card, the same three -- **Type ·
  Cost (a Leader's Life) · Power** -- each label above its value, a dash
  where a card has none (an Event's power), no row on a product or a DON!!
  card, 14 px under the row so the cells never touch the panel below. The
  counter and the colour are read off the card. The printing's badge sits on
  the title's centre line (`.ab-title .badge{vertical-align:middle;
  line-height:1;padding:4px 6px 1px}`, measured at 4x: +0.1 px on the caps'
  centre; the owner: "finally looks great").
- **Scan.** The shutter row is a grid `minmax(0,1fr) auto minmax(0,1fr)`:
  torch, photo and undo as 44 px round icon buttons on the left, the shutter
  centred within 2 px, "Review ->" on one line on the right, the same at
  360, 411 and 749 px (landmine 203). The hint under the well sits in the
  column's flow, so a two-line "Camera unavailable: ..." takes its height
  from the well instead of running into the frame or the note (found in the
  port's look at the open Fold's 749 px).
- **The top bar** starts at the very top and carries the status-bar inset
  itself (`.modebar{top:0;padding-top:calc(var(--sat) + 6px)}`,
  `body{padding-top:0}`); once a page scrolls its ground covers every point
  of its band at insets 0, 24, 40 and 48 (`:root:not(.at-top) .modebar`
  wears a gradient from the page colour; 53 % at take 114 with a 40 px
  inset). The art still shows through behind the pill at the top of a hero
  screen.
- **The release note** leaves Home for More -> About as a closed
  `<details>`; `#whatsNew`, `#wnOk` and `vault.seenTake` go; the release-note
  pipeline stays.
- **The audit's fixes.** A tile whose picture is missing stacks the name
  pill over the number (the flex row ran them together: "Nefeltari
  ViviEB03-024"); the deck editor's bottom row wraps under 380 px instead
  of scrolling the page sideways (landmine 156); every stylesheet
  `font-size` is on the token scale (12.5 -> sm, 13.5 -> label, 14.5 ->
  body, 15.5 -> row, 17 -> title, 24 -> head, 46 -> total, the stepper's
  glyph on `--ic-md`; the three input rules keep a literal 16px, under which
  Android zooms on focus, pinned since take 81); the nav's label colour is
  one rule, the token; the placeholder rule is declared once; the
  distributor line's text is `--accent-ink`; the Sim says "in play" where it
  said "char".

### How it was built

- Pre-built in a scratch copy on the take-116 copy while take 115 was
  reviewed, proven there with every new guard watched red on 116's build,
  then ported: the copy's whole change as one diff over the take-116 port
  (a replay of its patch scripts on a fresh tree had shown two post-check
  counts patched by hand, so the scripts were not the record; the diff is),
  applied with `git apply --reject`; the fourteen hunks take 115 had touched
  -- the strips' white note, the sealed row helper, the release note's
  `saveJson`, the nav's opaque tint, the Sim's head, the font sizes take 115
  had already put on the scale, and the harness's Sealed lines -- re-applied
  by hand, each anchored and asserted.
- Three of take 115's checks met on the way, each answered rather than
  loosened: SPEC-106-31 wanted at least one class that sets the fill colour
  on text, to prove its detector had something to find -- this take moved
  the last one (`.dline`) to `--accent-ink`, so the list is empty by design
  and a planted class is the control; STAN-106-2's control stripped the chip
  count's size and expected four small texts under 12 px -- the stat cells'
  small label left with the cells, so three chip counts remain; the two
  strip controls planted a weak scrim at the strip's end, where the date
  sat -- since B3 the date sits under the name at the start, so the weak
  value is planted under the whole strip.
- Two look steps changed on purpose: the take-82 slider check reads the pill
  (`.modebar .mode`), since the bar itself starts at the top and carries
  the inset; the take-108 chip sweep opens the Starter decks section, where
  a deck set's products now live.

### Measured

- The shutter row in real Chrome at 360 and 411 px with the torch shown:
  three 44 px icon buttons, the shutter 74 px and centred within 2 px,
  Review on one line (at take 114: Undo stacked over its word, Review on two
  lines, the shutter 71 px and 29 px off centre).
- The mode bar with the page scrolled at a 24, 40 and 48 px inset: the bar
  alone answers every point of its band, the inset included (53 % at 114).
- The badge on the title's centre line: +0.1 px at 4x.
- Sealed with the live feed: 32 of 85 strips were deck sets listed twice at
  114; none now, and the Starter decks section says "77 products".
- The look for take 117 at the owner's MEASURED sizes: 18 steps, 18 ok at
  both, every picture read -- the strips, the Starter decks section open, a
  Character's and a Leader's cells, the shutter row with the torch, the bar
  at a 40 px inset, the release note open under About, a tile without a
  picture.
- Negative controls, this harness on the take-116 build: smoke red on 25
  lines (every take-117 line, the two re-planted controls), render red on 5
  (the shutter row at 360 and 411, the bar at 24, 40 and 48).

### What I got wrong

- The shutter row's first grid was `1fr auto 1fr`: a `1fr` column keeps its
  content's width when the content is wider than its share, and Review
  pushed the shutter 29 px off centre (landmine 203).
- The bar's height floor was written as 53 + the inset and measured 52.3.
- The scanner's hint was first anchored by its bottom 34 px under the well
  (a second line grew up into the frame), then hung from the well's edge (a
  second line ran into the note); it sits in the column's flow now.
- The pre-build copy's scripts had two post-check counts patched by hand
  after the fact (" in play" twice, the hero's margin twice); a replay on a
  fresh tree found them, which every pre-build gets from now on.

### Ruled out

- Five cells (Type, Cost, Power, Counter, Colour): they overflowed at 411 px
  and the owner asked for three.
- Captions under the scan row's icon buttons: the row keeps one shape on
  every phone with icons alone; captions are a one-rule rider if the owner
  wants them (DEFERRED).
- A whole-card thumbnail beside the strip name: the owner chose the taller
  strip on the card's face (B3).
- The hint above the well: the well's top is where the eye lands.

### Tests

- On this branch (the take-116 merge plus the port, its code files equal to
  the port byte for byte), the whole pipeline in 433 s -- the catalogue
  ingested fresh, 6,766 artwork hashes restored from the sidecar, coverage
  100 % -- then **smoke** 1289 passed, 0 failed; **render** 223 passed, 0
  failed, `(mode: chrome)`; **the look** 18 of 18 at both sizes, the same
  figures as the port. `ci/icon.py --selftest` 33 ok; `scrub --check
  --docs` clean; `seal.sh --gate-only` as its last line says below the
  pull request.

### DEFERRED

- The literal radii onto `--r-*` (12 -> md, 8/9 -> md, 5/7 -> sm; 2, 3 and 4
  stay) and the script's inline sizes onto the tokens, each checked in the
  look: take 119's riders.
- UI-AUDIT §9's open boxes that are not on the owner's list: the Sim's
  battle panel's glued power, the empty grey box for a refused picture, a
  deck row's second line cut at 411, set completion's names cut at 749, a
  Sealed row's plural kind, Releases' upcoming group with only a sealed
  listing, the strips over a white picture, the tokens nothing reads.
- Captions under the scan row's icon buttons, if the owner wants them.
- Take 118 (Collect on indigo and gold, Home's premium pass, Hunt in kraft)
  is ported onto this baseline and opens after this take's Release builds;
  take 119's previews (the surface beyond Home, the tiles, Play, the mode
  swipe) are with the owner.

## Take 116 — 2026-09-25 — the first-open experience: the opening screen and the guide in the store listing's frame

Opened before any code (PROTOCOL §6) by the UI/UX session, on take 115's
baseline: PR #40 merged at 14:32 UTC and Release take-115 built its APK and
AAB at 14:42. Take 115's after-merge note, if one is needed, goes under
take 115.

The owner, word for word, over the drafts this session sent as pictures
while take 115 was under review: "Tutorial is looking much better ... ensure
we refine this a bit more"; "D2, S1 for sure"; on the picks from the numbered
sheets, V5 (the band at 20vh, the card centred in the buff) and V3 (the app's
own card as a square tile on the last page); "there's a black line separating
the top from the bottom, the dot background gradient abruptly just cuts off,
maybe it should fade into/under the blue top ... The gradient should also
not go over the logo or any card/button ... Why don't we have a Hunt
tutorial, this should also talk about local events/stock"; and, on the
result, "Looks much better! Maybe some small refinement here or there, but
i'm a massive fan".

### What this take changes

- **One scene.** The opening screen and the first-open guide share the store
  listing's frame: a Prussian band with the word-mark and the three modes
  under it, a buff sky, the app's own card (the icon, `bundle/icon.svg`) on a
  calm sea. The grain of the icon's paper fades in under the sky and sits
  under every element; there is no line at the band's foot. Every colour is
  a literal of the scene, never the mode's (take 98's one splash colour,
  kept), so the launch image `ci/icon.py` paints and the page are the same
  picture, and the guide that follows is the same frame again.
- **The guide is four pages,** one per mode and one for what stays on the
  phone: Collect (the dearest card in the catalogue, with its picture), Prep
  & Play (the Decks hero's Leader), Hunt ("Sealed prices, what is in stock at
  stores near you, and the events and releases coming up." -- Sealed, Local
  stock, Events, Releases -- the newest set's top card), Yours offline (the
  app's own card as a square tile like the opening screen's). Each picture
  is a real printing looked up when the guide opens, never a pinned id
  (AGENTS rule 3); offline, the card's own colours with its name pill. Skip
  and Next on pages 1-3; Look around first and Scan a card on page 4 (the
  scanner, with Home under it).
- **Next pages the strip** -- it never did (landmine 202). **The phone's
  Back closes the guide unseen,** so it returns next launch -- it could not
  see it (landmine 201). The guide is a dialog: `role="dialog"`,
  `aria-modal`, a name, focus on the dialog itself so no button wears a ring
  at first paint; the dots are indicators and the page is read out
  (`#tourPage`, `aria-live`). A card is 100 % of the strip with a 16 px gap
  (the neighbours peeked at 32 px narrower); the band is `--gband:
  clamp(160px, 20vh, 232px)`; the card is centred in the buff up to 280 px;
  the foot is capped at 520 px on the open Fold. The key is
  `optcghub.guide.v3`, so everyone sees it once more; More keeps "Show the
  guide again".
- **The native launch image** is the same scene, painted by `ci/icon.py`:
  the word-mark traced from the app's own faces with fontTools (the heavy
  face is a variable font, instanced at 800; `fonttools brotli` join
  `ci/deps.sh` and `ci/apk.sh`), the sea read off the page's own splash,
  ground first, then the grain with the same fade, then the tile and the
  sea; `check()` refuses any other image. `SPLASH_BG` is the band's
  Prussian and `ci/apk.sh` writes it as `windowSplashScreenBackground` into
  the launch theme, so the system splash, the window's image and the page
  are one picture. The owner's `splash-bg.jpg` slot is retired (it was never
  used); `assets/icon.svg` is copied beside the bundle for the page.

### How it was built

- Drafted and pre-built in a scratch copy of the tree on take 114 while take
  115 was reviewed, as anchored patch scripts (every replacement asserts its
  anchor), and proven there: smoke, render, the look at both sizes, and every
  new guard watched red on take 114's build. Ported onto take 115's tree the
  hour PR #40 opened: an anchor checker (every long literal of every script,
  tested against the 114 and 115 trees) found five literals take 115 had
  moved -- the splash block gained `#splash .swords`, `closeAnyOverlay`
  answers the picker's prompt first, BUILD, the release title, render's
  viewport comment -- each re-based; two hand edits the pre-build copy
  carried outside its scripts, found by replaying the scripts on a fresh
  tree (icon.py's docstring named the refused file; render's routing of the
  bundle's own update check behind the proxy), became scripts of their own.
- Three of take 115's lines met on the way, each answered rather than
  loosened: every art template carries `loading="lazy"` (the guide's tile
  does now; the opening screen's tile is markup, not a template, and loads at
  first paint); SPEC-106-28 pinned the old splash's mark to Collect's brass
  -- the scene has no mark, so the line asserts that nothing reaches `#splash
  .swords` and no swords svg is in the markup, with a planted control; the
  look's offline-face step, at the open Fold's measured 749 px, took its
  picture while the strip was still sliding back to page 1 -- it waits for
  the strip to settle now.
- Take 115's landmines run to 200, so the two this take opens are 201 and
  202 (the pre-build had numbered them 176 and 177).

### Measured

- The look at the owner's MEASURED sizes (take 115: 411 x 960 and 749 x 832
  at 2.625): 18 steps, 18 ok at both, every picture read. The band, the card
  in the buff, the chips and the two buttons sit as drafted at both sizes;
  the offline face (the card's own colours with the name pill) centred on
  both once the step waited for the strip.
- The scene's contrast, measured before drawing: the word-mark's cream on
  the Prussian 9.9:1, the tagline's `--t-text` 7.6:1, the chips' ink on the
  buff 12.8:1, Next's cream on the green 4.6:1 (the button is 44 px and its
  text 650 weight).
- Negative controls, take 116's harness on take 115's build: smoke red on
  fifteen lines (the take-116 lines, the SPEC-106-28 line in its new form,
  the Hunt line that now refuses the swords), then it stops at the
  four-pages line, which reads `V.GUIDE` on a build that has none; render
  red on the two take-116 lines, then stops at the guide's Next. Recorded
  as what a control tree can and cannot show.

### What I got wrong

- The first strip card was `calc(100% - 32px)`: the neighbours peeked.
- The guide's last-page tile took the class `tile`, which the collection's
  tiles already own: render's "tiles are wide enough" read 0 width. It is
  `gsq`.
- Focus went to Next at first paint, so Next wore a ring before any key was
  pressed; the dialog takes focus itself.
- The pre-build copy carried two hand edits its scripts did not: found only
  by replaying the scripts on a fresh tree, which every pre-build gets from
  now on.
- The offline-face look step trusted a 400 ms wait for a smooth scroll.

### Ruled out

- Flipping `documentElement.dataset.mode` per guide page (the mode's
  palette under each page): the guide is one frame on purpose.
- A `<dialog>` element: the DOM stub has no `showModal`, and the phone's
  Back would need a second path; a div with the dialog's role and the
  existing overlay walk does the same.
- `role="tab"` on the dots: four 44 px targets seven pixels apart would sit
  on each other; the dots are indicators and the page is read out.
- Coach marks over the live screens, and a guided first scan (it needs a
  camera on first run).
- Keeping the `splash-bg.jpg` slot: the launch image is the scene, painted,
  and `check()` refuses any other; the owner's own pictures stay in
  `home-bg.jpg`, `hero-play.jpg`, `hero-hunt.jpg` and the fonts.

### Tests

- On this branch (take 115's tree plus the port), the whole pipeline in
  311 s -- the catalogue ingested fresh, 6,766 artwork hashes restored from
  the sidecar, coverage 100 % -- then **smoke** 1268 passed, 0 failed;
  **render** 217 passed, 0 failed, `(mode: chrome)`; **the look** 18 of 18
  at both sizes; the same figures as the port. `ci/icon.py --selftest` 33
  ok; `scrub --check --docs` clean; `seal.sh --gate-only` as its last line
  says below the pull request.

### DEFERRED

- The launch image is a plain bitmap the window stretches to its size
  (Capacitor's template): a layer-list drawable with the band, the tile and
  the sea placed by gravity would end the stretch; a small `ci/apk.sh`
  change, its own take.
- The guide's refinement as the owner sees it on the phone (the band's text
  block, the chips' wording per page).
- A guided first scan stays ruled out until a first run has a camera.
- Takes 117 (the owner's polish list and the audit's fixes) and 118 (Collect
  on indigo and gold, Home's premium pass, Hunt in kraft) are ported onto
  this baseline the same way and wait in the session's scratch trees, each
  its own pull request after this one merges.

## Take 115 — 2026-09-25 — the production baseline: a two-axis review of takes 106-114, every confirmed finding fixed or handed on, the record made whole for the next sessions

Opened before any code (PROTOCOL §6). Take 114 merged as PR #39 at 00:14
UTC; its after-merge note is under take 114.

The owner, word for word (the scrubber's one word in brackets):
- "Run `npx skills use "https://github.com/mattpocock/skills" --skill
  "code-review"` and follow the generated skill instructions now. ... wrap
  everything up remaining, tidy up your documentation and ensure there was
  no missing/split ends. I'd like to start a new [session] after we're all
  set, maybe in another take - where we'll do more fixes, UI adjustments
  and more. I want to harden this as production, update any open
  questions, issues etc."
- Asked where the review measures from and what to do with its findings:
  "take-105 (Recommended)" and "Fix small ones in take 115 (Recommended)".
- Then: "bundle all of your findings and fixes/optimizations based on your
  findings all within 115, 114 is already in production, but I want 115 to
  be the real prod baseline on the code side so any future
  changes/additions will be on a clean slate and picking up from the apps
  most optimal rendition and ensuring that the new UI/UX new [session] is
  aware, currently its awaiting your changes all bundled into 115 but we
  have been drafting in preparation, so it knows to wait and that you're
  doing code review. Publish your unfinished changes somewhere to tackle
  later, and if it's a massive change also note it here to likely tackle
  later. The new [session] will be improving collect, the loading screen,
  tutorial, hunt and much more, mostly UI changes."
- With it, the owner's Diagnostics and self-test from the Fold on take 114:
  17 pass, 0 fail; the cover screen `viewport: 411x960 @2.625`, the open
  screen `viewport: 749x832 @2.625`, `tz: America/New_York`.

### The review

The skill (`code-review`) reviews the diff since a fixed point on two axes,
kept apart on purpose: **Standards** (the repo's documented rules, plus a
fixed list of code smells as judgement calls) and **Spec** (what the take
was asked to do). The fixed point is tag take-105: 61 commits, 91 files.
The skill expects an issue-tracker file (`docs/agents/issue-tracker.md`)
that this repo does not have; the specs here are the record itself (each
take's HANDOFF plan and the owner's words, AGENDA, UI-AUDIT).

It ran one shard per take, 106 to 114, each with its own Standards and Spec
reviewer, and every finding was then given to independent reviewers told
to refute it at HEAD (two for a claimed defect, one for a smell). Three
more sweeps looked past the diff: the record's split ends, the owner's
Diagnostics, and production readiness. 175 agents in all.

- **Standards:** 66 findings; 26 confirmed, 39 refuted, 1 already recorded.
- **Spec:** 36 findings; 29 confirmed, 5 refuted, 2 split between the
  reviewers.
- **The sweeps** added about forty more, the worst of them in production
  code that no take's diff had touched.

### What this take changes (the plan)

Every confirmed finding is fixed here, each with a check watched to fail on
take 114's build, or handed on in the record with its reason. The worst
first:
- **A sync in a running app doubled every printing in the scanner's
  lookup** (`loadCatalogue` never reset `CAT.byNum`). After one sync, a
  unique artwork asked instead of auto-accepting and the picker listed
  every printing twice. The quiet sync runs most days.
- **A stored value that could not be read stopped the app at the splash**,
  and a full storage lost a collection save without a word.
- **A synced catalogue of the wrong shape locked the app at every launch.**
- **A price alert typed in a converted currency was stored as dollars.**
- **The picker's prompts leaked when closed**: the next pick answered twice
  (two graded slabs, two ads).
- **The binder's page turns counted from the wrong page.**
- **A distributor that failed after a good read looked fresh**: the feed
  keeps the last good copy with `ok` still true, and the app never said
  "not reached". It happened live at 01:28 UTC.
- **A backup did not run on every save**, and it left out the stock
  alerts, the release reminders, the Hunt notes and the trade lists.
- The rest: contrast under 4.5:1 in three places, a splash that took the
  mode's colour, text under 12 px, days still in ISO, keywords three ways,
  toggles without `aria-pressed`, a sealed-only set filed under "Other",
  guards whose controls could not fail, and the runner's hourly deploying
  a catalogue no validation had read.
- **The Fold's open screen is MEASURED**: 749 x 832 at 2.625, not the 840 x
  757 at 2 the look and render assumed. The 700-899 px two-pane rules
  hold at 749 (measured in Chrome); the harnesses move to the measured size.

What is too large for one take, or is the owner's, goes to AGENDA A43 with
its fix sketch, and the UI/UX session is told in the session prompt that
take 115 is the baseline it waits for.

### How it was built

Two lanes on files that never overlap, run by agents, each batch reading
the review's findings and fix sketches, verifying each claim at the current
code, fixing it the smallest way, and watching every new check fail on take
114's build in a scratch tree first. The app lane ran one batch after
another (A1 to A5) on `src/app.html`, `tools/build_app.py`, `tools/smoke.mjs`
and `tools/render.mjs`; the runner lane (B1, B2) ran beside it on the tools,
the scripts and the workflows. The container restarted during A4; the five
finished batches' reports were in the workflow's journal, their work was on
disk and green, and it was committed (8f7f75e) before the rest ran again.

### Built

**Production safety (A1):**
- **The scanner's index is rebuilt, not appended to.** `indexCatalogue`
  builds fresh maps and `loadCatalogue` swaps them in whole. MEASURED on
  take 114 through the real sync path: 6,987 entries became 13,974 after
  one sync and 20,961 after two; 100 of 100 artwork auto-accepts became
  asks; the picker for one number went from 3 printings to 6 (landmine 176).
- **A synced catalogue is checked before it is written.** Its shape is read
  against the bundled catalogue the build shipped (the lists, the columns,
  the row widths); additions from a newer take are accepted. Sync checks
  both files' HTTP status and never says "Prices updated" for a copy it set
  aside. At launch, a synced copy that fails falls back to the bundled one,
  and the reason goes to Diagnostics.
- **Every stored value is read through one reader** (`readJson`): a value
  that does not parse, or is the wrong kind, falls back and is recorded; for
  the collector's own data the unreadable text is kept aside first
  (`<key>.unreadable`). The error buffer and the splash fallback moved to
  the top of the script, before the first read. When the collection itself
  could not be read, every backup waits (`vault.backupHold`) until a
  restore, so an empty collection is never written over the file Restore
  reads (landmine 177); since the self-review, any list the backup carries
  (item 2 below).
- **Every write goes through one writer** (`saveJson`): a failed write is
  recorded once per key and shows one toast telling the collector to export.
  Diagnostics lists `vault.items` (it named a key, `vault.collection`, that
  never existed), any unreadable copies, the writes that failed and whether
  backups are held.
- **Every request has a deadline** (60 s; the catalogue 240 s, sized from
  the files' measured sizes at a slow phone link), and the five refresh
  buttons recover.

**The collection and money (A2):**
- **One function commits a change to the collection** (`commitOwn`): CSV
  import, bulk delete, move and condition, removing a collection, a cost
  basis, a graded copy, a restore, Save on a card's page and the pending
  tray now all save, take today's reading when the value can have moved,
  and schedule the backup. Seven of the ten ways never scheduled it
  (landmine 179). A change to the trade, want, alert, stock-alert, note or
  reminder lists schedules it too.
- **The backup carries the stock alerts, the release reminders, the Hunt
  notes and the trade lists**, and restore puts them back and re-arms the
  reminders. Restore checks the file first (this app's, every list a list,
  every line a printing) and refuses with a reason; it keeps what it
  replaces (`vault.beforeRestore`, and on the phone
  `Documents/OPTCGHub/backup-before-restore.json`), and Restore then offers
  "What the last restore replaced".
- **The picker's prompts settle every way the sheet closes** (landmine 178):
  on take 114 one grade pick after three closed prompts opened four grade
  prompts.
- **The binder turns from the page on screen** (take 114: from page 3,
  Next went to page 2 of 66). **The featured Leader is the newest deck's**
  (take 114 compared ISO strings as numbers and featured the oldest).
- **A price alert keeps the collector's currency**: the box shows the market
  in the currency on screen and the typed figure is stored in dollars
  through the same rate (take 114 stored 264 typed in euros as $264; "1,200"
  became $1). **An alert's fired day is the phone's day** (it was UTC).
- **One place decides which line a copy counts into** (`OWN.target`,
  `OWN.line`); on the way, CSV import's cost basis went to the printing's
  first line anywhere, a slab included, and now goes on the line it adds.

**Hunt, honestly (A3):**
- **A kept distributor reads "not reached since …"** on Sealed, a product's
  page, Releases and Diagnostics, and its kept copy is still shown; one
  predicate (`HUNT.unreached`), and a control built through `hunt.py`'s own
  code from the live 25 Sept timeout's shape (landmine 180).
- **Target's history line counts days** from the rows' own times ("N checks
  over D days so far"); take 114 said "20 hourly checks" for 20 checks over
  16 days and nothing at all for 48 runs over 7.7 days. The self-review
  found it counted runs that never read the product: item 8 below.
- **The sealed-only set One Piece Collection Sets (23304) is back**
  (`EXISTS` in `build_app.py`): its ten priced products move from "Other" to
  their own set; an empty group like 24834 stays out (landmine 181).
- **Diagnostics' counts say what they count**: "221 cards, 5 DON!! cards and
  19 sealed products have no picture …", "350 priced (675 rows filed as
  sealed: 254 DON!! cards, 71 unpriced)", "7662 printings (6987 cards, 675
  without a number), 86 sets (85 with cards)"; More says 85 sets, the sets
  the cards are in.
- One Southern Hobby state-to-date map; the Diagnostics distributor line
  built from the list of distributors; the local `G` that shadowed the glyph
  helper renamed; one sealed-product predicate, one sealed row template, one
  colour split; the card page's backdrop loads lazily (PROVISION's claim is
  now true); the test-credit label read from the credits it adds; the
  OP01-016 ratio and the no-flood guard's control made real (landmine 175's
  rule).

**The tools (B1):**
- `hunt.py`: one request function and one retry loop for the history and the
  carry-over; the `--out` refusal (landmine 166) tested, with its positive
  half. Hunt selftest 119 → 123 ok.
- `southern.py`: an unread Illustration Box, or an unread name that says
  Case, matches nothing (landmine 167's addendum); the fixture's four
  matches are unchanged.
- `hashes.py`: one list of the sidecar's carried keys, and a check that every
  key the build writes is carried (22 → 23 ok).
- `ci/icon.py`: controls for an empty foreground, an empty status glyph,
  reminders with no small icon, and an assets folder without the foreground
  (24 → 28 checks).
- `tools/gate.py`: the icon-character check decodes surrogate pairs and
  `\u{…}` escapes (17 → 20 probes).
- `tools/scrub.py` reads every text file at every level of `tools/` and
  `ci/` (64 → 85 files), and found the owner's first name in a take-4
  comment in `tools/phase0.html`, now "the owner" (landmine 182).
- `ci/apk.sh` runs Gradle in a subshell and stops with its own message,
  shredding the upload key on a failure (landmine 183; a new selftest, run
  by the gate); `ci/check.sh` fails when it cannot fetch main.

**The workflows (B2):**
- A **report** job needs every job of the nightly and files one
  `nightly-failure` thread for any failed job, closing it only when every
  job ran green; the hourly has its own under `hourly-failure`; the Pages job
  lost `continue-on-error` (landmine 184).
- **The nightly race is closed**: the Pages job reads the hourly's files
  again inside the `pages` group the hourly holds, then deploys.
- **The hourly validates** the catalogue it deploys (`validate.py`, with
  the nightly's cache for the per-group counts; the self-review took out
  `--strict`, whose hash coverage only the nightly can meet: item 10 below).
- **Every Release carries the Play icon** (`icon-512.png`).
- Seven new hunt selftest checks, each with a control, fail on take 114's
  workflows (124 ok / 11 FAIL there); 135 ok on this tree.

**The spec's own words, on screen (A4):** each of these was ticked done in
UI-AUDIT or claimed in a HANDOFF and was not, or not everywhere (landmine
187). MEASURED on take 114 in Chrome and smoke, then fixed:
- **Contrast.** Collect's secondary text on the selected tint read 4.24,
  and "not legal" 4.30: Collect's tints are now 8 % and 10 % (Prep & Play and
  Hunt keep 12 % and 14 %), and every text on a tint is computed per palette
  from the shipped rules (landmine 189). Prep & Play's active nav label read
  4.42 over a translucent mix: it sits on the opaque tint now (4.61). The
  Sim's "choose a target" and its given-DON pips read the accent as text.
- **The splash's mark** took the mode's colour (red in Prep & Play); it is
  Collect's brass in every mode.
- **Nothing under 12 px, as drawn:** the chip counts drew at 10 and 10.8 px
  through the browser's own `smaller` (landmine 188); they are 12 px at full
  strength.
- **One glyph, one meaning:** a trash glyph (Lucide's trash-2, ISC, byte for
  byte) for remove and discard -- the want list, a price alert, a stock
  watch, a note, the Sim's trash -- so `g-minus` is only "one fewer" and
  `g-close` only closes; the two remove buttons that drew the × character use
  it, and the gate now refuses a remove button drawn as ×.
- Local's Open and Events' Register carry the external-link glyph and a name;
  `aria-pressed` on the eleven toggles that lacked it, and `aria-selected` on
  the mode slider's tabs (render now counts the selected tab per tablist).
- A deck's Leader box in the card's own colours when its picture fails; the
  trade and want rows and the picker read the thumbnail sizes; days in words
  on Local's events and the release reminders (the .ics stays ISO); keywords
  one way ("Blockers", "no Rush", "an active Blocker", "a Trigger"); the Sim's
  buttons at three words, with what happens in a note beside them; four
  straight apostrophes curled; set completion through the one percentage
  rule (1 of 592 reads 0.2 %, it read 0 %; 590 of 592 reads 99.7 %, it read
  100 %); a badged name wraps in deck, trade, want and alert rows (6 of 6
  whole at 360 and 412 px; it was 0 of 6); a pointer only on a history
  header that opens something; the dead thumbnail tokens gone and `--fs-total`
  the size `.total` draws.

**Render at the Fold's measured sizes (A5):**
- Every Fold size in render is the MEASURED 411 x 960 and 749 x 832 at 2.625
  (landmine 186: its "Fold inner" 673 never reached the two panes), and the
  harness zone is America/New_York, MEASURED; no result changed (the same
  offsets as Detroit in 2026).
- **A real 44 px floor** (landmine 190): the probe reads the box, or the
  `::after` hit area, with a 43 px boundary control. It found the deck-name
  field at 338 x 43.6, now 44.
- **Sealed's strips measured over a white picture** (landmine 191): over the
  33 yellow Leaders' art, take 114's strip put the date under 4.5 for 14 of
  them (worst 3.12). The scrim holds 0.55 to the strip's right end and the
  date is white: 4.74 under white.
- Chrome checks for what smoke reads from the rules: the tints and the nav
  in all three palettes (minimums 4.53, 4.61, 4.64), the badged rows, the
  history header's cursor, the Leader box offline, a kept distributor "not
  reached"; the tab check per tablist; the Decks thumbnail check brings its
  own stand-in instead of racing the host's refusal (landmine 192). Render
  198 → 215 checks; take 114's build: 208 passed, 7 failed.

**The look (A40), take 115's list:** 18 steps at both sizes, 36 in all,
each with a measured ok: the four sheets take 111's tour never opened (the
Leader sheet, a deck's printing sheet, the ask sheet, the scanner's "Which
EB03-024?"), set completion, the binder's page turns, the "Restore from"
sheet through the app's own browser path, the badged deck rows, the Leader
box offline, the Sim's buttons, One Piece Collection Sets under its own name,
and a distributor that could not be reached on Sealed and on a product's
page. `VIEWPORTS` and the zone are MEASURED; take 106's three knob steps wait
for the knob at rest (one helper); the unused `DLINES` is gone; the look's
selftest needs a result per viewport from every control and probe (landmine
185's addendum). On take 114's build the list read 9 ok, 27 not ok.

**What the look found, fixed by the session:**
- **"Hand back" broke onto two lines at 411 px** (110 x 65), squeezed by the
  note A4 put beside it (landmine 193): Hand back, Apply and Skip are
  `flex:none` in rows that wrap.
- **A product's own Distributor info did not say GTS was not reached**, the
  one place A3's fix had missed: its summary now says "1 not reached since
  …", and the kept distributor's line "could not reach it since …; its last
  check, …, is shown".
- The mode slider's `aria-selected`, which A4 had to back out, went in once
  A5's per-tablist check made room; render now requires the Mode tablist to
  mark its tabs (watched: 214 passed, 1 failed with it taken out).
- The look: 36 of 36.

### The self-review: take 115's own diff

Before the PR the take's own diff (8f5034b against take-114) was reviewed the
same way: six finders by area (data safety, Hunt and data, the CSS, the
runner, the tests' honesty, runner parity), and every finding given to two
reviewers told to refute it at 8f5034b -- 36 agents. 8 confirmed, 6 split
between the two, 1 refuted (a copy of a split one). All fourteen were real
(one split finding is the seventh's other half); each is fixed here with a
check watched to fail on 8f5034b's build, or on a planted fault, in a
scratch tree:
1. **A full storage lost a scanned batch** (high; landmine 194). Take 115's
   `saveJson` returned false where take 114 threw, so a commit went on: the
   collection's longer write was refused and the batch's shorter clear went
   through. At 16 bytes under a quota, 8f5034b stored 0 batch rows and the 2
   old lines, and the next launch had the three cards nowhere (take 114
   threw and kept the batch); the pending tray the same. `OWN.moveIn` now
   adds the rows in memory and writes the collection once, and the batch or
   the tray lets them go only when that write returned true; `CREDITS.defer`
   takes back rows it could not store. Smoke's storage stub refuses by size,
   as Chromium does: three new checks (the commit, the tray drained, the tray
   deferred) fail on 8f5034b.
2. **The backup hold covered the collection alone** (177's addendum): an
   unreadable decks list started empty and the next commit wrote it over the
   backup's decks (1 -> 0). Every list the backup carries holds it now
   (`HELD`), and the launch toast, Back up's question and Diagnostics name
   what could not be read ("Your saved decks could not be read — use
   Restore from backup, under More"; "Your saved collection and 10 other
   lists …"). An unreadable batch, in no backup, holds nothing.
3. **A restore counted its file copy as kept.** On the phone
   `keepBeforeRestore` returned true when only
   `backup-before-restore.json` was written, but Restore offers only the copy
   in storage: a full storage restored with no second question, and an older
   copy passed for what the restore replaced. Kept means the copy in storage
   now, and on "Restore anyway" the older copy goes. A phone-path check (a
   disk, a quota that refuses only the copy) fails on 8f5034b: one question,
   the older copy still there.
4. **The Play counter was never read** by take 115's "no text in the fill's
   colour" check (landmine 196). It reads the four Play roots, changed or
   not, and needs the counter's panel: brass planted in its Life label
   passed 8f5034b's smoke and fails now.
5. **Back up's check read a throw as the Cancel** (landmine 195). It records
   the question and tells a throw apart, and a new check answers OK and sees
   the hold end: a planted throw and a planted refusal that never asks both
   passed 8f5034b's check and fail now.
6. **One wait for three lists** (landmine 197): one change per wait for six
   lists -- a want, a trade row, a stock alert, a price alert, a Hunt note, a
   release reminder. With five of the six lists' backups removed, 8f5034b's
   check passed; this one names the five.
7. **The deadline check** (landmine 198; 185's addendum). The catalogue is
   measured as sent -- gzip at its fastest level, 906,802 B, a bound on the
   739,429 B Pages sends (MEASURED, content-encoding gzip) -- and the Hunt
   files have a floor at Pages' `stores.json`, 1,099,659 B (MEASURED 25 Sept).
   A copy with 67 more history days (7.69 MB raw) turned 8f5034b's check red
   and passes this one, which still fails a 20 s long deadline; a 30 s default
   passed 8f5034b's check on a runner's `www/hunt` and fails now.
8. **Target's line counted the feed's runs as checks** (173's addendum): on
   the live history, "48 checks over 8 days so far" of a product no run had
   read. `restocks()` counts the runs that read the product (its online
   status, or its shelf at the served zip), and the shelf's words come from
   the shelf's own checks: "9 checks of it over 8 days" for one read in 9 of
   50 runs, nothing for one never read, as take 114.
9. **A source never read said "not reached since" the failed run's time**
   (180's addendum). A "since" comes only from a kept copy's `stale_since`;
   a panel says "Could not reach Southern Hobby when last tried, ...". The
   control is `hunt.py`'s own `build()` with the real fetch failing and no
   previous feed.
10. **The hourly's `--strict`** (landmine 200). The hourly runs
    `validate.py` between the catalogue and the app, without `--strict`;
    hash coverage is the nightly's refusal (MEASURED in the review: 138 new
    unhashed printings pass, the 139th refuses). `hunt.py`'s check needs
    that order and refuses take 115's first list, take 114's, `--strict` by
    hand, validate after the app, and a cache that saves.
11. **Checks the next listing would have turned red** (landmine 199).
    Sealed's collapse check takes the first set drawn with rows; Releases'
    checks count rows, not sets; the fixture's 17 read the fixture's own
    catalogue (its later sets set aside for that read, then put back). With
    two starter decks planted on one future day and an EB06 listed,
    8f5034b's smoke failed all four; this one passes them.
12. **The EUR alert's echo** is read without its thousands separator: a
    watched card past about $1,137 would have read red. The reviewer's
    control on take 114's build still fails it.

Two of the review's findings were the record's, put right here with no code
change: V1-STATE and AGENDA said a distributor's short line on Releases
opens the product's page -- on Releases the lines are text on the set's row,
whose tap opens the set, since a button cannot hold another (SPEC-112-55);
and, a note on take 111 (its entry stands as written): since take 111 the
card page's Graded panel lists the slabs of the collection on screen, as the
rest of the page does, and All lists every collection's -- take 110 listed
every collection's under any collection (SPEC-111-52).


### Tests

- **smoke** 1248 passed, 0 failed (1240 before the self-review); **render**
  215 passed, 0 failed, `(mode: chrome)`; **the look** for take 115, 36 of 36.
- **Selftests:** hunt 135 ok, hashes 23, icon 28, scrub 11, apk 7, check 6,
  shipped 8, signer 10, shrink 14; the gate's 21 probes, each guard fired;
  `scrub --check --docs` clean at 85 files; `ci/*.yml` equal to
  `.github/workflows/*.yml`; `seal.sh --gate-only`: GATE PASSED.
- **On take 114's build**, each batch's new checks: A1's section 46 of 51
  failed (smoke 1043 passed, 47 failed); A2 43 of 59 failed across seven
  areas; A3 32 of its checks failed (1066 passed, 123 failed in all); A4
  1078 passed, 156 failed; A5 render 208 passed, 7 failed; B1 every new
  selftest check failed on take 114's code (hunt 1, hashes 2, icon 1 per
  guard, gate 2, scrub 1, apk 3, check 1); B2 124 ok, 11 FAIL on take 114's
  workflows; the look's take-115 list 9 ok, 27 not ok.
- **The self-review's checks** failed on 8f5034b's build as listed above
  (its smoke there: 1233 passed, 15 failed -- fourteen of them the new
  checks, the fifteenth the ignore check, which needs the `.git` a scratch
  copy has not got); the rest failed on their planted faults.
- The runner's `check` on the PR is the seal: the whole pipeline from a
  clean clone, render in Chrome, the gate.

### What I got wrong

- **Take 115's first versions shipped the defects its self-review found**:
  a write that no longer throws needed every caller to act on false, and I
  changed the writer without reading its callers; the hold covered the one
  list I was thinking of; and five of my new checks could not fail. The
  self-review found them before the PR, not after.
- My A9 control read take 114's `build.yml` with `git show take-114:` and
  caught its error as a pass; the runner clones one commit with no tags
  (landmine 185).
- The mode slider's check asked the DOM stub for buttons it cannot select,
  and got an empty list; it reads the source now. A4's regexes pinned exact
  markup and broke on a harmless attribute.
- The editors turned typed `\u` escapes into literal characters three
  times; a non-ASCII grep of the diff caught each before a run.
- After the container restarted, the resume re-ran two finished batches
  because a parallel call's order changed; I stopped it before it changed a
  file.
- The first gzip figure was Node's default level, 710,403 B, under what
  Pages sends; the check uses the fastest level as a bound.
- The first commit of the self-review's fixes carried an attribution trailer
  this public repo's rules keep out; it was refused and made without it.

### Ruled out

- Counting the fixture's unlisted products with a second copy of the app's
  rule (the reviewer's sketch): it would pass whatever the app did. The
  fixture's own catalogue is read instead.
- The Hunt half of the deadline check in gzip too: `stores.json` is 210 KB
  sent, which lets the default fall to 7 s. The uncompressed size is the
  stricter measure, and it fits (34 s of 60).
- Removing the older undo copy before the "Restore anyway" answer: a Cancel
  would lose the previous restore's undo.
- Adding `hashes` to the hourly: it probes every image and the second host
  every hour.
- The CSV import's write per row (each `OWN.add` saves): slow only for a
  file of thousands of lines, not a finding; left in A43.

### DEFERRED

- **AGENDA A43** holds what the review and the self-review handed on: the
  large items and the owner's (ad consent, D11, reproducible builds,
  Android's automatic backup, the backup file after the sideload-to-Play
  switch, which takes reached production, the feed tied to TCGCSV), what
  only a phone can prove, the small items left on purpose, and the UI/UX
  session's list.
- **Only a phone can prove:** a commit and a drained tray on a full storage,
  the hold's words at launch, the restore's second question on a full
  storage, `backup-before-restore.json`, re-armed reminders, a real
  distributor timeout.
- **The UI/UX session's**, from take 116 on this baseline: UI-AUDIT's open
  boxes and A43's UI part.

## Take 114 — 2026-09-24 — A32's distributor state timeline, from the history rows

Opened before any code (PROTOCOL §6). Take 113 merged as PR #37 at 19:43
UTC. Release take-113 was decoded after the merge; its note is under take
113. The owner's Fold check of the icon is still open.

The owner, word for word: "Start take 114 with A32's distributor timeline
how many takes left until the UI overhaul is complete, what's left?"

- **The UI overhaul:** none left. A42, the UI series, closed when take 111
  merged. Its seven layers shipped at takes 106 to 110, and take 111 was
  the last look.
  - The UI-AUDIT boxes still open are the binder page on the open Fold and
    three words-and-rows items in §8. They belong to the UI/UX session.
  - The inner screen's width stays INFERRED until the owner's Diagnostics
    `viewport` line from the open Fold arrives.
  - Refinement from here is the owner's call, take by take.

### Measured before any code

- **The live history on Pages** (fetched 20:02 UTC): 48 runs from 17 Sept
  02:02 to 24 Sept 19:08 UTC. That is 7.7 days, so not hourly.
  - GTS states are in 8 runs, since 23 Sept 06:58.
  - Southern Hobby's are in 1 run, the 19:08 run on 24 Sept.
  - A row keys each distributor item by its own id. For GTS that is the
    SKU. For Southern Hobby it is the product-page number from `/p82337/`,
    not the item number. (The first version of this line said "item
    number", and that was wrong.)
  - The rows are kept by count: `KEEP_RUNS = 24 * 14`, 336 rows, a number
    written for hourly runs. At the measured cadence that is about 55
    days. (The first version said "a fortnight", which holds only at one
    run an hour.)
- **Why about 4 h, not hourly:** the Actions API lists exactly 48 hunt
  runs, all green: 45 scheduled and 3 started by hand. Each run matches one
  row within about a minute, so no row was lost. GitHub fired about 45 of
  the about 185 hourly slots (`17 * * * *`). The gaps are 1.0 h at least,
  4.03 h median and 6.34 h at most (MEASURED).
- **No state change has been seen yet.** All 8 GTS rows are identical,
  with 49 SKUs each: 37 sold out, 6 call to order, 4 out of stock, 1
  coming and 1 in stock. Southern Hobby has been read once. One run on 24
  Sept at 15:05 UTC has no GTS key: the fetch timed out and the last good
  copy was kept, and a kept copy writes no row (MEASURED).
- **Many states come from the calendar, not the site:**
  - Every Southern Hobby state is computed from its dates against the
    runner's UTC day (`southern.state_of`).
  - So are GTS's `coming`, `preorder` and `out` (`gts.status_of`). Only
    `sold_out`, `call` and `in_stock` are GTS's own words.
  - The rows keep the state word, not the dates (MEASURED from the code).
- **A hazard, INFERRED and not seen:**
  - If the hourly's fetch of the previous history fails, it starts a new
    history of one row, and the deploy replaces the old one. The nightly's
    carry-over has the same shape.
  - No run has lost its history so far: the 48 runs match the 48 rows.

### GTS's date, read off its own page

Take 94 recorded GTS's `preorder_date` as "when preorders opened". That was
inferred from the field's name. It is GTS's **Order Due Date**: the last
day stores can order (MEASURED).
- **The probe:** one request from the session VM for PEB-01's product page
  (SKU BJP2897699), at 20:20:20 UTC. The User-Agent named the project, and
  the answer was HTTP 200, 659,800 bytes.
- **What the page says:**
  - The value is labelled `<div class="title">Order Due Date:</div>`,
    bound to `preorder_date_display`.
  - Its countdown is headed `Order Due:`.
  - The site's menu groups products under "Orders Due Week of September
    20".
- **The data agrees:**
  - Every unreleased item whose date has passed shows "Sold Out".
  - PEB-01, whose date is still ahead, shows "24+" with add-to-cart on.
  - For the 17 products both distributors list, GTS's date is 0 to 4 days
    before Southern Hobby's "Order Due", and the release days match.
- **The listing is read correctly:** its `preorder_date` equals the
  displayed value on all 11 fixture items, and `gts.py` reads the listing.
  (A product page's raw `preorder_date` is the release day instead.)
- **Unknown:** whether stores can still order on the due day itself.

So the app's words were backwards: "preorders open on Oct 14" is the day
orders close. Landmine 172.

### The plan

Three designs were written and judged, for honesty, engineering, and the
collector with the owner's take-112 ruling. The build follows the
honesty-first design, with the judges' fixes.
- **The timeline, app-only, from the rows:**
  - It goes on a sealed product's page, inside each distributor's section
    of the closed "Distributor info". Nothing is added to a row, a short
    line, Sealed's panels or Releases.
  - It says how many checks read that distributor and over which days, and
    the state at the first check (never "since").
  - Each change is dated between the two checks it fell between, and says
    whether it was read off the distributor's page or worked out from its
    dates. A calendar change names the distributor's own day only when
    that day falls between those checks.
  - A run that could not reach the distributor is counted, never read as a
    state. There is no pattern and no forecast.
- **GTS's words, fixed because they were wrong:**
  - "stores order by Oct 14" in Distributor info and Releases;
  - "orders close Oct 14" on a row;
  - "orders were due Oct 14" once the day has passed.
  These are Southern Hobby's words for the same fact. The state keys stay,
  since the rows hold them. `gts.status_of` keeps the due day open
  (`>=`), as Southern Hobby's does. These words go to the owner as a
  question, with pictures, before the PR is ready.
- **The record the timeline rests on:**
  - the hourly reads the history before any source and stops (exit 3,
    nothing deployed) if Pages cannot be read three times;
  - a 404 starts a new history, and says so;
  - the history written must be the history read plus one row;
  - the nightly carries history.json only if it is a history;
  - both reads skip Pages' ten-minute cache. (Wrong, found by the review
    below: the CDN ignores the query. A deploy clears it, and that is what
    keeps each read fresh. The `?v=` is gone.)
- **Fixed because it was broken:** a day in a distributor's long words
  split across lines ("release Nov" / "20").
- **Questions for the owner:** the GTS words; whether the history shows as
  soon as Distributor info opens, or sits behind one line to tap; and
  whether the GTS stock alert should keep counting "orders were due" as
  available. The alert is not changed without an answer.

### The owner's answers to the three questions

The owner was sent the pictures from the look. They showed the history
open on the OP-18 box's page, the same on the open Fold, Sealed's rows
unchanged, before-and-after pairs for GTS's words and counts and for the
split day, and a mock-up of the history behind one tap. The answers, word
for word:
1. "For 1, exactly exactly right, that's fine" -- GTS's words stay as
   built. Southern Hobby's "stores' orders closed May 29" stays as it is:
   the answer asked for no change, and none is made.
2. "For 2, the latter, distribution stuff is generally only for stores but
   this info can still help the consumer - so it should be tucked away." --
   each distributor's history sits behind one line, "History · N checks on
   file, …", which opens on a tap. It is closed every time a product's page
   opens.
3. "For 3, your suggestion" -- the GTS stock alert counts only "in stock for
   stores" as available. It no longer counts the state after the order due
   date.

### Built

- **The timeline** (`src/app.html`):
  - `HUNT.distTimeline(d, id)` reads each row's map for that distributor,
    keyed by its own id (`HUNT.DIST_KEY`).
    - A row without the map is not a check. After the first check it
      counts as "could not reach it".
    - A value that is not a word is counted apart, "this version cannot
      read".
    - The rows are sorted on a copy.
  - `distKind` marks a change as read off the page or worked out from the
    dates.
  - `tlDay` names the distributor's own day for a calendar change, only
    when the current date puts that day between the change's two checks.
  - `distHistory` writes the words. `paintDetailDist` puts each
    distributor's history under its own words, inside the closed
    "Distributor info".
  - Each history is behind a one-line header, a 44 px button, until tapped
    (the owner's answer 2). The header is `distHistTap`, and every page opens
    with the histories tucked away.
- **GTS's words**, fixed because they were wrong (landmine 172):
  - "stores order by Oct 14" in the long words;
  - "orders close Oct 14" on a row;
  - "orders were due Oct 14" once passed;
  - "no order due date listed" when there is none.
  - Sealed's counts read "N with an order due date ahead, N unreleased
    without one". The hourly's log line says the same.
- **The GTS stock alert** counts only "in stock for stores" as available
  (the owner's answer 3).
- **A day in the long words never splits** ("release Nov" / "20"), fixed
  because it was broken. It was found by this take's look on Sealed's
  product page and on Releases.
- **Diagnostics:** "history on phone: N runs, gts in G, southern in S, ends
  <moment>".
- **The runner** (`tools/hunt.py`, `tools/hunt/gts.py`):
  - The hourly reads the history first, three tries ten seconds apart, at
    its plain address. It stops with exit 3, deploying nothing, when it
    cannot read it.
  - A 404 starts a new history, and the log says so.
  - `keeps_past` refuses to write a history that is not the one read plus
    one row.
  - The nightly's carry-over takes history.json only when it is a history.
    When it cannot read it for a passing reason (a timeout or a 5xx, three
    times), `--carry-over` exits 3. `ci/bundle.sh` then sets `pages=skip`,
    and build.yml's pages job does not deploy. The APK and the Release go
    ahead, the hourly's last deploy stays with its history whole, and
    Pages' catalogue waits for the next deploy.
  - Neither source accepts an empty listing (count 0, no rows): the last
    good fetch is kept, and the row gets no key.
  - The hourly's GTS log line counts by dates, as the app does (`gts_due`).
  - GTS keeps the due day open (`pre >= today`), as Southern Hobby does.
- **The fixture:** `tools/fixtures/hunt_history_2026-09-24.json`, the
  history on Pages at 20:02 UTC. Every count the tests take from it is
  read off its rows.

### Tests and the look

Every new check was watched to fail on the build before it.
- **smoke 1039/1039** (1038 before the SP check below and its control).
  - On take 113's build: 31 failed, the new checks and the 6 changed pins.
  - On the build before the owner's answers: 4 failed, the tucked checks
    and the alert.
  - Negative controls:
    - a hole read as "not on its list" makes one change two;
    - the history as first built (open, no button) is not tucked;
    - take 113's alert rule, put back for one sequence, fires on the due
      date passing.
- **render 198/198 in Chrome**, at 360 px in America/Detroit.
  - On take 113: 5 failed. Before the answers: 1 failed.
  - Controls:
    - `nowrap` makes the page scroll;
    - a 1 px column with the no-break spaces undone splits a day;
    - that instant in UTC reads otherwise;
    - a header squeezed to 18 px is caught.
- **`hunt.py --selftest` 119 ok**, up from 90. Five sabotages, each asserted
  as landed, failed as they should:
  - take 113's read;
  - take 113's main block;
  - `keeps_past` returning nothing;
  - `carry_over` without `is_history`;
  - take 113's `gts.py`.
- **Clean run:** `hunt.py --from-fixtures` into an empty directory writes a
  one-row history with "gts in 1, southern in 1".
- **The look, 22/22 at both sizes.** On take 113 it was 7 of 22. The
  pictures went to the owner twice: before the answers, and with the
  history tucked away.

### The review

An adversarial review of the whole diff ran four lenses: the app's logic,
the runner, the tests, and the words. It raised 14 findings, and two
independent skeptics checked each one. 13 were confirmed. One was rejected:
a Diagnostics line said to throw on an odd history, which the skeptics could
not reproduce.

Each confirmed finding is fixed, and each fix was watched to fail on the
build before it, or by a sabotage asserted as landed:
- **An empty listing** (count 0, no rows, "ok") made two false changes for
  every product, both "read off its page". The app now counts an empty map
  as not read, and both sources refuse an empty listing.
- **The nightly could still reset the history:** a carry-over that could
  not read it deployed Pages without it. It now skips that night's deploy
  (above).
- **The cache-bust did nothing.** The CDN ignores `?v=`, MEASURED by the
  reviewer and again by the fixer (the same etag, a HIT each time). It is
  removed, and the record is corrected above.
- **Sealed's GTS counts were false by their own words.** "0 unreleased
  without one" left out the sold-out unreleased products. They are counted
  by dates now, over every unreleased product: 1 and 3 on the fixture, 1
  and 19 live.
- **"release Nov 20 passed, out of stock"** showed on the release day
  itself. It now reads "released Nov 20, out of stock".
- **At the November fall-back hour,** a change's window could read
  "between Nov 1, 1:30 AM and 1:30 AM". When the offsets differ, both ends
  now carry their zone (`tlWindow`).
- **Tests:**
  - The timeline's own local-time code never ran outside UTC. Smoke's
    section now runs in America/Detroit.
  - Render compares the header's days and a window with strings built in
    the emulated zone, with a UTC control.
  - Seven pins would have gone red on 1 Jan 2027, when a day gains its
    year. They are built from the fixture's own dates now; four take-112
    pins had the same expiry.
  - `tlDay`'s upper bound, its from-state guard, and the list and empty-map
    guards each had no check. Each has one now.
- **The Release paragraph** was written before the owner's answers. It now
  names the tap and the alert change.

Not changed: "order due date ahead" on the due day itself. The owner
approved the words, "stores order by Oct 14" is true that day, and GTS's own
countdown hides on it (MEASURED).

### The check that went red on the market (landmine 175)

The PR's first `check` failed on one smoke line that is not this take's:
"the SP is worth at least 100x the base", 75x.
- Main's scheduled nightly had failed on the same line two minutes before,
  on take 113's code (run 36075219383, 987/988). It opened issue #38.
- It reproduced here on the same day's TCGCSV data.
- The catalogue is right. EB03-024 has three printings, the SP is the
  dearest and the base the cheapest. The base's market price rose from
  $1.11 (Sep 19) to $5.89 (Sep 24), and the SP held at $441.73. The ratio
  went from about 400x to 75x.
- I proposed the fix on the PR and did not push it, because it was outside
  this take. The owner ruled that take 114 carries it: "Carry it in 114".
- **The fix:** the line now asks for an order of magnitude, "at least 10x".
  What landmine 1 guards is that each printing carries its own price.
  Its negative control, one price keyed off the card number (every printing
  given the dearest's price, 1x), fails the same check.
- Watched to fail: the old line fails on this data (75x); the new one
  passes, and so does its control.

### What I got wrong

- **Take 94's reading of GTS's date, and this take's first two lines.**
  The HANDOFF said "item number" and "a fortnight"; both are corrected
  above (landmines 172 and 173).
- **A design prototype rewrote the repo's `catalog/rates.json`** through a
  symlinked `catalog/`. It was restored (landmine 174).
- **The implementers' tools wrote literal no-break spaces** into render's
  and the look's new lines. They were turned into `\u00a0` escapes, and
  only added lines carried them.
- **A fix agent's `build_app.py --help` ran a real build**, which rewrote the
  repo's `catalog/rates.json` (landmine 174's shape). It was restored.
- **My first control for the alert was a constant expression**, so it
  passed whatever the app did. It was replaced before any commit by the
  real one above.

### Ruled out

- **A second record of changes beside the rows:** a change log in git would
  be a third runner-owned file, and two records can disagree.
- **"Since" on any line;** a pattern or a forecast at any count (take 73).
- **Naming a calendar change's day from dates that do not put it between
  its two checks.**
- **The history on a row, a short line, Sealed's panels or Releases** (the
  owner's take-112 word). Also the history open by default (the owner's
  answer 2).
- **Southern Hobby's words changed to "orders were due":** the owner
  answered "that's fine" to the words as built.
- **Refusing on a 404,** which would stop the feed until someone acted.
- **Syncing the history when a product page opens,** a fetch racing the
  paint (landmine 166). "This phone's copy ends" says the edge instead.
- **Changing `KEEP_RUNS`.**

### DEFERRED

- **Date moves:** only a runner record of each change's dates can show
  "release moved Nov 20 → Dec 4", and a view longer than about 55 days.
  The next A32 item.
- **Delisted items:** a distributor's section disappears when the current
  feed drops its id. The rows carry no id → product map.
- **The history on Releases' not-in-the-catalogue list.** PEB-01's first
  real changes (GTS and Southern Hobby, 15 Oct UTC) have no product page.
- **The nightly race:** an hourly deploy between the nightly's carry-over
  and its Pages job loses a row (`build` and `pages` concurrency).
- **Target's line** still says "N hourly checks so far -- a pattern needs a
  fortnight". The runs are four-hourly, and it counts runs.
- **For the UI session:**
  - the history's look (`.dtl`);
  - a day in Releases' "mixed · release" group line without its no-break
    spaces;
  - Sealed's GTS counts. They overlap ("7 sold out, 8 allocated, 1 with an
    order due date ahead, 3 unreleased without one" adds up to more than
    11 products), and read like separate groups.
- **After the merge** (rides take 115): the first hourly's history line
  with its "gts in / southern in" counts, and the first change seen in the
  rows.
- **Still the owner's:** the Fold check of take 113's icon.

### After the merge (written at take 115)

- **PR #39 merged at 00:14 UTC on 25 Sept.** Build run 64 on main
  (d7d152b) was green in all four jobs: smoke 1039/1039, render 198/198 in
  Chrome, the gate passed. The nightly's carry-over, take 114's own code,
  carried 5 of 5 files from Pages, history.json among them, and the pages
  job deployed at 00:18:55 UTC.
- **Issue #38** (the red nightly of 24 Sept, landmine 175) was closed by the
  workflow itself at 00:18:32: "Green again".
- **Release take-114** was published at 00:24:48 UTC: the APK 26,972,466
  bytes, the AAB 20,155,074, the mapping 51,817,124.
- **The first hourly on take 114's runner** (hunt run 50, 01:28 UTC) was
  green. The deployed history went from 49 rows to 50, read and appended,
  not reset (MEASURED from Pages). GTS timed out on that run: the feed kept
  the 22:23 copy with `stale_since`, and the new row carries no `gts` key --
  a failed read is a hole, not "nothing listed" (PROVEN live). The app did
  not say so; take 115 fixes that.
- **The owner's self-test on take 114:** 17 pass, 0 fail, on the Fold.

## Take 113 — 2026-09-24 — the owner's icon (D7), folded in from the graphic design session's branch

Opened before any code (PROTOCOL §6). The owner merged take 112 (PR #36)
at 19:05 UTC after "The pictures look good, mark it ready". Its `check`
was green on its head a042246: smoke 988/988, render 187/187 in Chrome,
and the gate passed. build.yml run 61 on the merge commit 1d01cf0 built
Release take-112 at 19:13; its after-merge note is under take 112.

The owner, word for word, with the branch named without its platform
prefix (a vendor's name the scrubber refuses): "When take 112 is merged and
you start 113, fold in the icon hand-off from branch […]/compassionate-
mayer-acc24r (one commit on top of take 111, subject starts "d7: the
owner's icon"). Read design/d7-icons/SHIP.md first: it lists what changes,
what was verified and what wasn't, and draft ledger text for 113. My
decision: I chose the icon with Bandai's printed card-back emblem and it's
live on Play. Record it as my reversal of landmines 30 and 31 and A16 for
the icon's emblem only. The own-rose swap in SHIP.md is the fallback.
Before merge: vet it with the gate, smoke and python3 ci/icon.py
--selftest. After the Release builds: check the APK by decoding the icon
files (landmine 78). I'll check the launcher, themed icons, the splash and
a reminder's status-bar icon on the Fold. Cherry-pick or merge, your call.
Merging also brings the design/ sources for the Play listing and the
business card; none of it ships."

### The plan

- **Merge the design branch, not a cherry-pick of its icon commit 93481b3.**
  The own-rose fallback's SVGs came with an earlier commit, 81ea976, and
  93481b3 edits two `design/` READMEs that only the earlier commits add.
  Outside `design/`, the branch changes the same 12 files as 93481b3.
  `design/` is 45 files and 0.5 MB, and none of it ships.
- **Before the PR is ready:** the gate, smoke, render and
  `python3 ci/icon.py --selftest`, each run here. The hand-off's claims are
  read against the tree: every file it names, its 23 checks and 12
  controls, and its refusal of the previous build's icon step.
- **The record:** SHIP.md's drafts, adjusted and written one command each.
  The owner's reversal of landmines 30 and 31 and A16 covers the icon's
  emblem only. Its draft landmine "165" becomes 170.
- **After the Release:** decode the APK's icon files, not their names
  (landmine 78). The owner checks the launcher, themed icons, the splash
  and a reminder's status-bar icon on the Fold. (Themed icons were then
  taken out at the owner's word; see "One standard icon" below.)

### Built (merged, not written here)

The design branch merged cleanly onto take 112, with no conflicts. Outside
`design/` it changes 12 files, as SHIP.md says:
- **`assets/icon*.svg`:** the pick's five layers (the monochrome one was
  then deleted here, at the owner's word, below). The compass survives as
  `assets/icon-placeholder.old.svg`, and the jolly roger stays.
- **`ci/icon.py`:** the icon step, lifted out of `ci/apk.sh`'s heredoc. It
  writes:
  - the adaptive background, foreground and monochrome layers at 108 dp and
    five densities (the monochrome one then taken out here, below);
  - the launcher XMLs;
  - the legacy and round icons;
  - the reminders' `ic_stat_don` drawable, kept through `shrinkResources`;
  - the splash;
  - `play-assets/icon-512.png`.

  The hand-drawn feature graphic is retired.
- **`src/app.html`:** both reminders ask for `ic_stat_don` (landmine 170).
- **The gate, deps and smoke:** `tools/gate.py` runs `ci/icon.py
  --selftest` and requires the file. `ci/deps.sh` installs cairosvg. Smoke's
  splash assertion reads the icon step.

### Vetted here, before the PR

- **`python3 ci/icon.py --selftest`:** 23 ok, 12 of them controls. It runs
  on a fixture and on Capacitor's own template. The template's icons before
  the step are refused with 26 problems, as SHIP.md says.
- **Watched to fail:** one reminder put back to `ic_launcher` failed the
  selftest ("src/app.html's reminders ask for the drawable this step
  writes"). The gate refused it at `selftest`. The source was then restored.
- **Tests:** smoke 988/988; render 187/187 in Chrome.
- **No look step:** nothing in `www/` changes visibly, and the app's pages
  carry no favicon. The Fold is the look for this one.

### The owner's word on the icon sheet: one standard icon

The runner's `check` went green on 7f136ef, and the owner was sent a sheet
of what `ci/icon.py` writes into the APK. It showed the Play icon, the
launcher icon, the legacy square and round icons, the reminder's glyph and
the splash. It also showed the hand-off's monochrome layer, tinted dark and
light the way a phone with themed icons switched on draws it. The owner,
word for word: "I'm confused by the dark and light themes, nor do I really
like them. I just want the one standard icon. Continue".

- **What the two tiles were:** not variants the app chooses between. They
  showed what the phone's own themed-icons setting does with a monochrome
  layer, and the tints were this session's stand-in for the wallpaper's.
  The sheet did not say so (What I got wrong, below).
- **What changes here:**
  - the adaptive icon loses its monochrome layer, so the app offers no
    themed variant for a phone to recolour;
  - `ci/icon.py` writes the background and foreground only;
  - its check refuses a monochrome layer anywhere in the res tree;
  - `assets/icon-mono.svg` is deleted.
  The legacy and round icons stay. They are the same art, for Android 7
  and for launchers that ask for a round icon, not a choice anyone sees on
  the Fold.
- **What stays one colour:** the reminder's status-bar glyph,
  `ic_stat_don`. Android draws every status-bar icon from its alpha
  channel, in white. A full-colour icon there becomes a white silhouette
  (landmine 170).
- **Vetted here:**
  - `python3 ci/icon.py --selftest` passes 24 checks, 13 of them controls.
    Three controls are new: a monochrome picture put back, the hand-off's
    launcher XML with its `<monochrome>` line, and a `<monochrome>` line in
    `mipmap-anydpi-v33`, a place `check()` never names. Two old controls
    tested the monochrome layer's content and went with it. The template's
    own icons are now refused with 19 problems (26 before) and the fixture's
    with 29 (36): those were the monochrome problems.
  - **The previous build, refused:** 7f136ef's own `ci/icon.py` and SVGs,
    run on Capacitor's template, pass their own check. The new check
    refuses that output with 7 problems, all of them the themed layer: five
    monochrome pictures and two launcher XMLs.
  - **The guard sabotaged:** with its lines removed, the three new controls
    FAIL and the gate refuses at `selftest`. The file was restored byte for
    byte.
  - **The fallback:** SHIP.md's own-rose swap, now four files, passes all 24
    checks in a scratch copy.
  - **After the change:** smoke 988/988, render 187/187 in Chrome, the
    gate's own selftest, the scrubber clean, and `bash tools/seal.sh
    --gate-only` GATE PASSED for take 113.
  - **The second sheet** went to the owner. It shows the one icon on a home
    screen, on Google Play and on the opening screen, and the reminder's
    glyph in a status bar. It shows no phone-setting pictures (landmine
    171).

### Not verifiable here, for the runner and the Fold

- **The build:** the VM has no Android SDK. `build.yml` on the merge proves
  first:
  - aapt2 linking the new XMLs (background and foreground only, since the
    owner's word);
  - `shrinkResources` honouring `raw/keep.xml`;
  - the release APK's contents.
- **The APK, after the Release:** `aapt2 dump resources` must list
  `drawable/ic_stat_don`, and must not list `mipmap/ic_launcher_monochrome`.
  The launcher XMLs must carry a background and a foreground, and no
  `<monochrome>`. Then decode the pixels those resources point to: the
  glyph must be white on transparent (landmine 78). The decoder is ready,
  and take 112's APK is its control.
- **The owner, on the Fold:** the launcher on both screens, the splash, and
  a release reminder's status-bar glyph (ドン!!, not ⓘ). A launcher can hold
  the old icon until the update installs or the phone restarts.

### What I got wrong

- **The sheet drew a phone setting as if it were the app's design.** Its
  two themed tiles carried the monochrome layer in stand-in colours,
  labelled only "themed, dark" and "themed, light". The owner read them as
  two themes to choose between. A picture of what a phone setting does
  should say so, or not be sent (landmine 171).
- **The themed variant rode in without anyone asking the owner.** SHIP.md
  offered it and I carried it into the plan and the record. The owner had
  picked an icon, not a themed variant of one (landmine 171).
- **The first record commit carried an attribution trailer the repo does
  not use.** It was amended before the push.
- **NEW-SESSION-PROMPT's last line still said "take 112".** Take 112 left
  it as take 111 wrote it, and this take missed it at first. It names the
  next take, and now says 114.

### Ruled out

- **Keeping the monochrome layer and leaving themed icons to the phone's
  setting.** A layer that shows only when a setting is on is still a second
  icon, and the owner wants one.
- **Taking the status-bar glyph out with it.** Android draws a status-bar
  icon from its alpha channel alone. The reminders would go back to the
  system's info icon (landmine 170).
- **Cherry-picking the icon commit alone.** The fallback's SVGs would not
  come with it, and it edits two READMEs that only the earlier commits add.
- **As the icon:** the compass placeholder and the jolly roger, both kept
  in `assets/`; our own rose while the owner's pick stands, since it is
  the ready swap.

### DEFERRED this cycle

- **The APK decode and the owner's Fold check** above, after Release
  take-113. (The decode was done after the merge, below. The Fold check is
  the owner's.)
- **A favicon and a manifest icon for Pages from `assets/icon.svg`.** That
  is the UI session's call.
- **A32's next:** the distributor state timeline.

### After the merge

The owner merged PR #37 at 19:43:10 UTC. build.yml run 62 on the merge
commit 95b47e4 did the following:
- gated the app (GATE PASSED, take 113);
- deployed Pages at 19:47;
- published Release take-113 at 19:52:42, its body headed "take 113": the
  APK, 26,955,922 bytes; the AAB, 20,137,454; the mapping, 51,817,124.

The icon step's first real run printed "launcher icon: legacy, round and
adaptive (background, foreground; no themed layer) at 5 densities … the
reminders' glyph drawable/ic_stat_don, kept" and "splash screens rendered
(11)".

- **The APK, decoded (landmine 78),** with aapt2 2.20 fetched to the
  session VM. Take 112's APK is the control: it fails with 4 problems (no
  status glyph, no background layer).
  - `drawable/ic_stat_don` is in the resource table at all five densities.
    Each is a white glyph on transparent (140 of 576 pixels inked at mdpi).
  - `mipmap/ic_launcher_monochrome` is absent. Both launcher XMLs carry the
    background and foreground layers, and no `<monochrome>`.
  - The manifest's icon and round icon point at `mipmap/ic_launcher` and
    `mipmap/ic_launcher_round`.
  - 36 pictures were compared with what `ci/icon.py` writes on the session
    VM from the same template: the launcher layers, the legacy and round
    icons, the glyph and the 11 splashes.
    - 26 are identical, pixel for pixel.
    - The 10 legacy and round icons differ only in the hidden colour of 1
      to 11 fully transparent pixels each, which AAPT2's crunch rewrites.
      Their alpha and every visible colour are identical.
- **The size:** the APK is 501,240 bytes bigger than take 112's. The splash
  files grew by 282,682 and the launcher icons with the glyph by 216,368:
  the new icon's detailed art. Everything else changed by less than 2 KB.
- **Still the owner's, on the Fold:** the launcher on both screens, the
  splash, and a release reminder's status-bar glyph (ドン!!, not ⓘ).

This note rides take 114's pull request.

## Take 112 — 2026-09-24 — A32's second distributor: Southern Hobby, read off its real pages

Opened before any code (PROTOCOL §6). The owner merged take 111 (PR #35)
at 16:31 UTC: "Merged, continue - monitor and continue with 112". Take
111's `check` was green on its head 7b781dc (smoke 956/956, render 176/176
in Chrome, the gate passed); build.yml run 60 on the merge commit cc1f9ed
built and gated the app and deployed Pages by 16:35 (its Release is noted
under take 111 once published). The last nightly (build run 50, 23:50 UTC
on the 23rd) was green; the next is due at 23:50 tonight.

With A42 closed at that merge, the next of mine in the Priorities is A32
(A41 waits on the owner's list), whose take-94 entry ends: "**Next:**
Southern Hobby, same shape, its own take; the state timeline from the
history rows." This take is Southern Hobby; the timeline stays next.

### Measured before any code (the real pages, from the session VM, one request at a time)

- `https://www.southernhobby.com/` answers 200 (209 KB). **It is not GTS's
  shape.** The record's "same shape" (takes 69 and 94) was inferred from
  both sites answering: Southern Hobby is an osCommerce-style storefront
  (PHP, `productListing` tables, a quick-view popup) and embeds no product
  object.
- robots.txt allows the category and product pages and disallows search,
  quick view and any URL with `sort=`; the fetcher uses the first two
  kinds only. (One probe this take asked for `?page=2&sort=2a` before
  robots.txt was read; not again.)
- The One Piece category, `/ccg-s/one-piece-card-game/c13_1000991/`, is one
  page: its footer says "20 items" and its table carries 20 rows (the
  page-2 probe returned the same 20). Columns: Product Name, Item #,
  Release Date, Order Due, Price ("Log in to see prices"), Qty. (empty).
  Every row carries the presell ribbon.
- A product page (`/<slug>/p<id>/`) adds a Prerelease Date on one (OP-19,
  02/26/2027), Sold As (BOX, Display, CASE, EACH), the configuration (24
  packs per box, 12 boxes per case), "Pre-sell Product Subject to
  Allocation" on all 20 -- boilerplate here, where GTS's allocation flag
  separated 32 of 49 -- and "THIS PRODUCT IS BRICK AND MORTAR RESTRICTED"
  on 2 (the EB-05 pack, the SD-01 Set Sail Deck Set). No stock words, no
  MSRP, no UPC; prices sit behind a login this project never uses.
- Order-due dates: only PEB-01's (Oct 14) is still ahead; the rest closed
  between May 8 and Sep 12. SD-01, released Sep 18, is still listed six
  days on; OP-17 (Aug 28) is gone.
- One name disagrees with its item number: "Double Pack Set 14 DP-15" is
  `BANTCGOPDP14`.

### The plan

- **`tools/hunt/southern.py`:** the category page every run (one call), its
  footer count equal to its rows or the fetch fails (AGENTS rule 8); a
  product page read when an item first appears and again after a week, a
  few a run, 1.5 s apart; a strict parser (the six headings measured, or it
  is a changed page); the feed's keep-the-last-good path; fixtures from the
  saved pages; a selftest with controls, run by the gate.
- **The feed:** `sources.southern`, matched to the catalogue through its
  own retail-name normaliser; each item's state in the history rows (the
  timeline's input).
- **The app:** the distributor line under a Sealed row, Sealed's panel,
  Where to buy, and Releases' distributor lines (and "not in the catalogue
  yet") carry both distributors, each line naming its source and when it
  was read. Southern Hobby's words are its dates -- store orders open until
  a day or closed on one, the release, a prerelease -- and "in-store only".
  It has no stock words, so it is not a stock-alert source.
- **PROVISION:** the host's row.

### Built

- **`tools/hunt/southern.py`:**
  - The category page each run. Its footer's count must equal its rows, or
    the fetch fails (AGENTS rule 8). The six headings must be as measured,
    or the page has changed and the fetch fails.
  - A product page when its item first appears and again after a week: at
    most 25 a run, 1.5 s apart, and none started 90 s into the run. A host
    that hangs costs a run about two minutes, not the hourly job's fifteen.
  - A page is taken only if it names the listing's own item number.
  - It never raises. A failed fetch keeps the last good one and says since
    when.
- **`tools/hunt.py`:**
  - `sources.southern`, and each item's state in the history rows (the
    timeline's input).
  - A Southern Hobby name is matched through its own normaliser: the brand
    goes, the item number's set code stands in for the name's (DP-15 on
    item DP14), and the unit it is sold as decides.
  - There is no match while a starter deck's or a double pack's unit is
    unread. A CASE matches only a catalogue case, and nothing else matches
    one.
  - `--out` must name a feed file (landmine 166).
- **The app:**
  - Sealed shows both distributors' lines under a row and Southern Hobby's
    own panel.
  - Where to buy has a chip and a row for it.
  - On Releases, a set's row carries one line from each distributor. "At
    the distributors, not in the catalogue yet" lists both distributors'
    items, each distributor's starter decks folded on their own.
  - Its words are its dates: "stores order by Oct 14", "stores' orders
    closed May 17", "released Sep 18", the release and prerelease days, and
    "in-store only".
  - Every day on a distributor line is now in words (GTS's release and
    preorder days were ISO until now). Diagnostics names the new source.
- **Two faults the look found, fixed because they were broken** (refinement
  stays with the UI session):
  - A product with no photo yet showed an empty white card on its page
    (landmine 168). It now shows its set's code on the row tile's ground.
  - The Diagnostics report's feed address ran past its panel at 411 px.
    Long lines now break.

### Measured after the code

- **The live fetch, once from the VM, as the runner will make it:**
  - ok, 20 of 20, 21 calls in 45 s; 20 product pages read, 0 failed.
  - 1 still taking stores' orders (PEB-01, until Oct 14), 18 closed, 1
    released (SD-01).
  - Sold as: BOX 4, Display 12, CASE 2 (IB-09, IB-10), EACH 2.
  - 2 in-store only (EB-05, SD-01).
- **Matched: 4 of 20, the same on the live pages as on the fixtures.** They
  are the DP-13 Display, the OP-18 box, the EB-05 pack and the SD-01 Set
  Sail Deck Set. The other 16 are not in the catalogue yet; the Heroines
  Gift Collection scores 0.67 against Gift Collection 2023, under the bar.
- **Tests at the first push:** hunt.py selftest 90 ok; smoke 973/973; render
  182/182 in Chrome; the look 16 steps, 16 ok, at 411 and 840 px. The final
  numbers, after the owner's layout, are in the next section.
- **Watched to fail on take 111's build:**
  - smoke's take-112 section (15 of its checks);
  - render's 360 px lines, the not-in-the-catalogue panel, the product
    frame, and the Diagnostics wrap.
- **Watched to fail on this take's own drafts:**
  - the case checks, on the matcher before the case rule (an IB-08 case
    went to the single box, and an IB-04 case too);
  - the budget check, on a fetch with no budget (21 calls, 800 s of
    clock).

### The owner's word after the first pictures: distributor info never floods

The owner, on the pictures: "For distribution info under hunt, there's going
to be a lot of info for these, and I don't want them flooding the screen.
Make distribution under the TCG Player listing, one for each distributor if
necessary, with a link you can click to get more info. If there's a lot of
text within the app directly like there currently is for distribution it
should be under an expand screen. Such as "Distributor Info _____" and the
drop-down shows the info we currently do." Two choices went back to the owner
as questions with pictures, and the answers were: a short line per
distributor that opens the product's page at its Distributor info, and one
closed drop-down for the long text.

- **A sealed row:** each distributor is one short line under the buy chips,
  its name and its state ("GTS Distribution · sold out", "Southern Hobby ·
  orders closed May 29"). It is a 44 px target that opens the product's page
  with Distributor info open, scrolled to it. The row's name block carries
  none of it now.
- **A product's page:** Where to buy lists the sellers to collectors. The
  distributors moved to the page's own Distributor info, closed unless a
  distributor line opened the page. There each has its full words and its
  own page to open.
- **Sealed:** GTS's and Southern Hobby's panels sit under one closed
  "Distributor info", with a line saying what is inside ("2 distributors ·
  checked just now"; "1 not reached" or "out of date" when so).
- **Releases:** a set's row carries the short lines. The not-in-the-catalogue
  list is under its own closed "Distributor info" ("17 products not in the
  catalogue yet · …").
- **Days:** the day on a short line never breaks. The second look had "May" /
  "17" on Releases.
- **Tests:**
  - smoke 988/988; render 187/187 in Chrome, with real clicks on the
    drop-downs, on a row's distributor line and on the row itself;
  - the look, 22 steps, 22 ok, at 411 and 840 px.
- **Watched to fail on this PR's first head (f0ca3d0):**
  - smoke: 22 checks;
  - render: the 6 new checks and their 2 controls. On that app the render
    run needed stand-ins for the new functions, or it stopped at the first
    call; missing panels and targets now fail their checks instead of
    stopping the run.
  - The day checks failed on the build just before the no-break spaces
    (smoke 3, render 1).

### What I got wrong

- I took the record's "same shape" as a fact until the first page said
  otherwise (landmine 165).
- One probe used `sort=` before robots.txt was read.
- My first fixture cut took the empty results cell and made a 234-byte
  "listing". Two selftest checks passed on zero items; both now assert
  their counts.
- The first matcher would have put DP-13's display line on the single set
  before its unit was read.
- The same matcher took a case for the single box. Only reading all twenty
  live pages found it (landmine 167).
- The first fetch had no time budget, so a hanging host would have cost
  the whole hourly feed its run.
- My render check read nothing, twice over (landmine 166).
- One smoke assertion was `A && B && C || D`.
- My first real taps in render did nothing: the zip question, the splash and
  the fixed nav took them (landmine 169).
- The runner's check on `c164a12` failed where every VM run passed. Render
  stopped with "No element found" at a distributor line it had just marked.
  - The cause: the runner reaches Pages. A sync that the take-111 check
    started by entering Hunt with no feed landed mid-tap. It repainted
    Sealed and swapped in the served feed, which has no Southern Hobby yet.
  - Reproduced in the VM with a sync landed on demand: the same error.
  - Fixed by turning the page's own Hunt syncs off in render, as the look
    already did. The same probe then clicks (landmine 166).
- That fix failed on the runner too (`bfbe14b`). The tap reached no line,
  and the app stayed on Sealed.
  - The cause: render reloads its page twice mid-run, and a stub set once
    after the first load does not survive a reload. A probe showed it back
    to the real sync after the reload.
  - The stub is now set on every document the page loads, at the moment
    the app defines `VAULT`.
  - A tap in render now waits for the page to settle and taps only when its
    target is what the point hits. When it cannot, the check says what
    covered it.
- Two of the day controls could not fail. At 360 px the lines wrap before the
  day, and a 3.5em column still held "May 17" (42 px of 43.75). The rule of
  landmine 164 again: the control is now a 1 px column.
- I expected 11 products in the not-in-the-catalogue line. The look's 11 was
  rows; the products are 17 (3 GTS, 14 Southern Hobby).

### Ruled out

- **Southern Hobby as a stock-alert source.** It publishes no stock words;
  nothing flips.
- **Its allocation flag.** It is on every presell, so it says nothing about
  one product.
- **Its prices.** They sit behind a login.
- **One row per product across both distributors in "not in the catalogue
  yet".** Nothing but a set code joins them, and each keeps its own words
  (deferred below).

### DEFERRED this cycle

- **A32's next: the state timeline from the history rows.** GTS's states
  have been kept since take 94; Southern Hobby's begin with this merge.
- **Paging.** If the category grows past one page, the fetch fails on its
  count, by design. The page-2 probe returned the same 20, so how the site
  pages is unknown until it does.
- **Take 113 -- the owner's icon, and more, from the graphic design session.**
  The owner: "we'll be pulling in a new icon and more".
  - **The owner's ruling, verbatim:** "I chose the icon with Bandai's printed
    card-back emblem and it's live on Play. Record it as my reversal of
    landmines 30 and 31 and A16 for the icon's emblem only. The own-rose swap
    in SHIP.md is the fallback."
  - **Where:** the design branch `…/compassionate-mayer-acc24r`. Its platform
    prefix is a vendor's name, so the record leaves it off. The icon is one
    commit on top of take 111, `93481b3` ("d7: the owner's icon ships from
    assets/, ready for take 113 to vet and fold in"). Read
    `design/d7-icons/SHIP.md` first: what changes, what was verified and
    what was not, and draft ledger text.
  - **Merge the branch, not a cherry-pick of `93481b3`:**
    - the fallback's `design/d7-icons/v4/svg/own-purple*.svg` came with
      `81ea976`, an earlier commit;
    - `93481b3` edits two `design/` READMEs that only the earlier commits
      add;
    - outside `design/`, the branch changes the same 12 files as `93481b3`;
    - `design/` is 45 files and 0.5 MB, and none of it ships (the Play
      listing's and the business card's sources come with it).
  - **What it holds:** the pick as five SVG layers. `ci/icon.py` renders
    them, and its selftest joins the gate. The reminders ask for a drawable
    the plugin can find.
  - **Vetting before the merge:** the gate, smoke and
    `python3 ci/icon.py --selftest`.
  - **After the Release builds:** decode the APK's icon files (landmine 78),
    not their names. The owner checks the launcher, themed icons, the
    splash and a reminder's status-bar icon on the Fold.
  - **Its draft landmine is "165":** take 112 used 165 to 169, so it becomes
    170.
  - **Expected conflicts:** `ci/apk.sh`'s icon step, two `smallIcon` lines
    in `src/app.html`, one smoke assertion and one gate call.
- **For the UI session's refinement:**
  - the distributors' names verbatim in the unlisted panel ("Bandai - One
    Piece Card Game: …");
  - one product listed by both distributors shows as two rows there;
  - a product with no market price reads "— · market" on its page.

### After the merge

The owner merged PR #36 at 19:05 UTC. build.yml run 61 on the merge commit
1d01cf0 gated the app and published Release take-112 at 19:13:19 (the APK,
26,454,682 bytes; the AAB, 19,640,155; the mapping, 51,817,038), its body
headed "take 112". The first hourly Hunt on main after the merge (run 48,
on 1d01cf0) read Southern Hobby live: ok, 20 of 20 pages in 21 calls, 0
failed, 4 matched -- the VM's proof, repeated on the runner. This note
rides take 113's pull request.

## Take 111 — 2026-09-24 — the last look: every screen at both sizes after the UI series, and what it turned up

Opened before any code (PROTOCOL §6): the last take of A42 as planned
overnight. The owner marked take 110's PR (#34) ready at 14:05 UTC and
merged it at 14:07, then: "Merged, continue - monitor and continue with
111". Take 110 (PR #34: `check` green on its head 9b8ec1f -- smoke
916/916, render 161/161 in Chrome, the gate passed) merged at 14:07 UTC;
build.yml run 59 on the merge commit 9d601c7 published Release take-110
at 14:16:31 (the APK, 26,461,582 bytes; the AAB, 19,647,562; the mapping,
51,817,038), its body headed "take 110" -- the first Release under the
heading tripwire (landmine 154). The last nightly (run 50, 23:50 UTC the
night before) was green.

The answer given overnight to "how many takes do you think until we can
hit our end goal for this redesign": about four more after the art
layer's second half -- the voice, polish, the Fold's inner layout, and
one for what the last look turns up. Take 110 carried the first three at
the owner's word ("Ensure 110 has as many planned changes in it as
possible"); this is the fourth.

### The plan

- **The last look:** a tour of every screen (twenty) and the sheets, in
  all three modes, at the Fold's two sizes, over a seeded collection, a
  deck and a want -- every picture read. What it turns up is this take.
- **Seen already in take 110's pictures:** rows for a printing with no
  card number open with a bare "·" (a DON!! card, a sealed product, in
  Market movers); Home says "One reading so far — $0.00." beside an $808
  total when the day's only reading was taken before the cards went in.
- **The record:** the agenda's Priorities block, last rewritten at the
  take-88 audit, still names take 105 in flight -- rewritten to the live
  order; A42 marked done at the owner's merge; UI-AUDIT's one routed
  finding (bulk delete) marked fixed at take 110.

### What the look turned up, and what changed

The tour (`node tools/look.mjs 111`: 34 views, each at the cover screen,
411 x 960, and the open Fold, 840 x 757; 68 of 68 ran) was read picture by
picture twice: once on take 110's app, once on the fixes. Every row below is
something a picture showed or its reading led to.

*Home and Search*
- Set completion rows ended "· tap for the checklist" (the row is the
  button); the words went. The Performance tab now leads with its own panel
  ("Against what you paid"), which sat under Most valuable.
- Set completion counted a printing with no number as a held number: a
  starter deck still in its wrapper listed its set as "1 of 17 numbers ·
  6%", under a note that says sealed product is left out; and a set's value
  added every collection's copies while its count took the one on screen.
  Both fixed in `setProgress` (landmine 162).
- A sealed product in Most valuable read "NM · Normal · " -- a condition and
  a finish it has not got, and a dot left hanging -- and now reads its kind
  and set ("Box · OP01").
- A printing with no number opened its small line with a dot: " · OP01" in
  search, " · $55.49 each" in a trade, " · below $1.00" on an alert, " · OP01
  · $4,680.11" on the want list, and the same in Market movers and the scan
  result. `dotJoin` joins the parts a line has.
- The filter sheet said "Show 7,661 printings" beside "Search all 6,987
  cards" (the catalogue holds the sealed products too), and "N cards" over
  the collection, which counts lines as More does: now "results" and
  "lines".
- A name that carries its printing's badge was cut by the ellipsis on the
  phone: "Roronoa Zoro ..." hid "Alternate Art", "Donquixote Rosinante ..."
  hid "SP" -- the one word that tells two printings apart (AGENTS rule 3). A
  badged name now wraps (landmine 164).

*The collection*
- The bulk bar put four buttons on one line; at 411 px they ran off the
  phone and over the count. On a phone: what is selected and Done, then
  Condition, Move and Delete; one line on the open Fold.
- A sealed product's tile showed a lone "·" over "NM · Normal"; it says
  "Box" over "Sealed". A DON!! card's tile read "DON!! ·"; it reads "DON!!".

*A card's page*
- The Graded panel held Want and the two alerts; they have a Watch panel,
  and Graded holds the graded copies.
- A sealed product's page repeated its name under its name (the 40
  products named for their set, every starter deck), said "Normal" under
  "Ungraded", showed the day's triangle twice (on the price and on the
  move -- every page did), offered a Graded panel and "Want this card", and
  listed the 674 printings with no number as "Every printing of this
  number". It now says "Sealed", its kind ("Box", "Deck", ...), one
  triangle, and has none of the rest.
- The 253 DON!! cards are filed as sealed (they have no number) and take
  95's page treated each as a product: no condition, the stock alert,
  Where to buy. A DON!! card's page is a card's: its finish, a condition,
  Graded; with no number, no Want and no list of printings (landmine 162).
- "Want this card" on a printing with no number: the want list is kept by
  number, so `WANT.has('')` answered for every product and DON!! card once
  one was wanted. Hidden where there is no number.
- Save, the stepper, a condition tap and the cost basis took the
  printing's first line in any collection: on the Trade pile's page, Save
  set the main collection's count. The page's line is now the one in the
  collection it names ("Adding to …"), and the button says "Save" on a copy
  you have, "Add to collection" on one you have not (landmine 163).
- A second slab of one printing was counted into the first and wrote its
  grader, grade and cert over the first one's; a slab is now a line of its
  own (landmine 163). A cost basis set on a card not yet owned added it
  without the day's reading; it takes one.

*Collect's other screens*
- The binder opened a set at its first page -- nine empty pockets when the
  collector's cards sit further in. It opens at the page of the first held
  card, and a page the collector turned to is kept, the first one too.
- An alert's line was cut at "fired Sep 23 at …"; it wraps.
- The currency pill and picker said "CHF CHF" (the franc's sign is its
  code); now "CHF", while "$ USD" and "€ EUR" keep their sign.
- Scan's note under the camera ran edge to edge with the camera; it keeps
  the page's margins. More → About gave the prices' day as "2026-09-23";
  now "Sep 23", as every other day.

*Prep & Play*
- A ready-made deck's badge sat beside its name and took its width; it
  rides the line under the name, with the count.
- A deck's search prompt, "Add cards — search the catalogue", was 253 px of
  text in a 208 px box at 411 px; now "Add cards".
- A deck's value left its Leader out while the deck's history counted it
  (an empty deck read $0.00 beside a move of its Leader's price); the Leader
  is counted, and an empty deck says "no cards in it yet", not "you own
  every card in it".

*Hunt*
- Sealed and Releases rows sat askew: `.row{align-items:baseline}` put a
  textless picture's foot on the first line of text, 33 to 55 px off
  centre. A row that leads with a picture centres it; the Sealed row's
  bell, which then hung from the picture's foot, centres too (landmine
  161).
- Local, before the shop list was fetched: "From Bandai TCG+, ."; now
  "From Bandai TCG+.".

*The tour itself*
- Its seed asked for a printing with no number as `!p.sealed && !p.num`
  and found none (every one is filed as sealed); it seeds a DON!! card, and
  the tour gained the tiles and the DON!! card's page. It also took no
  day's reading (the app's own paths take one) and the zip sheet covered
  Hunt's first view; both fixed.
- Not the app's: Home's "One reading so far — $0.00" beside the total, seen
  in take 110's pictures, was the seed's reading taken before its cards
  went in.

### Tests

- smoke **956/956**: take 110's 916 with six changed on purpose (the
  filter's words, the deck's value, the sealed page's line and subtitle),
  and 40 new in "take 111 — the last look". render **176/176** in Chrome:
  161 with three changed on purpose (the filter's "lines") and 15 new.
- Watched to fail on take 110's app, built from `origin/main`: 41 in smoke
  and 10 in render -- every check of this take but those that hold on both
  builds by design: the controls, the fixtures, the binder keeping a page
  turned to, the open Fold's one-line bar, and landmine 16's merge.
- The harness: smoke's DOM stub gained `document.removeEventListener` (the
  ask sheet's cleanup calls it; a browser always has it).

### What I got wrong

- The first cut made a DON!! card's page a product's (landmine 162): it
  took `p.sealed` for "a sealed product", as take 95 had. A probe of the
  catalogue before the tests caught it -- 253 DON!! cards with a finish and
  a rarity.
- Centring the rows moved the Sealed bell; the second reading of the
  pictures found it (landmine 161).
- The badge check was first written at 411 px, where the look saw the
  fault; in the runner's Chrome the row fits with 6 px to spare, so the
  control could not fail. It reads 360 px now (landmine 164).

### Ruled out

- Fitting a binder page to the open Fold (three pockets of about 400 px
  across; a page of nine needs a scroll there) -- a page that fits is
  pockets near 110 px wide: a design trade-off for the UI/UX session, not a
  fault.
- Splitting a slab merged before this take: its first grade was written
  over, and nothing kept it.

### DEFERRED this cycle

- The binder on the open Fold, above -- the UI/UX session's.
- The Cards list shows "·" in the cost circle for the 16 of 2,712 playable
  numbers the feed gives no cost (Barrier Bulls OP15-019, OP12's Haki
  events, EB04-009 ...) and sorts them with the zeros. A data gap: the feed
  or the rules text would have to supply it.
- A want of a printing with no number saved before this take stays on the
  list (its row now reads without the dot); remove it by hand.
- Sealed's banner on the open Fold is the top card cut to 840 px wide, the
  face filling the band -- take 110's design, merged without a note.

### After the merge

The owner merged PR #35 at 16:31:55 UTC ("Merged, continue - monitor and
continue with 112"). build.yml run 60 on the merge commit cc1f9ed gated
the app, deployed Pages at 16:35 and published Release take-111 at
16:40:29 (the APK, 26,459,990 bytes; the AAB, 19,646,578; the mapping,
51,817,038), its body headed "take 111". A42 closes with it. This note
rides take 112's pull request.

## Take 110 — 2026-09-24 — the UI series' second half in one take, overnight: the art layer's second half, the voice, polish, the Fold's inner screen, and the planned leftovers

Opened before any code (PROTOCOL §6) by the UI/UX session: the fifth
take of A42. The owner, having seen take 109's look: "go, mark it ready
and start take 110". Take 109 (PR #33: `check` green on its head 3d470bd
-- a fresh ingest, the runner's own probe "large art (_in_1000x1000):
served 40 of 40, median 600x838, smallest width 408", smoke 817/817,
render 132/132 in Chrome, the gate passed) merged at 06:15 UTC; its
build published Release take-109 at 06:23 (the APK, 26,453,770 bytes;
the AAB, 19,639,891; the mapping, 51,817,038). That Release's body opened
"# OP TCG Hub — take 108" under the title "take 109" (measured below).
The nightly after the merge (06cf32d) measured the large size itself:
40 of 40.

The owner's words during the take, verbatim:

- On take 109's look, three texts: "While you're here, remove this text
  when you get the chance - all of it - it adds to the apps not so
  premium feel that we'll improve in the polish stage, and with what
  we're doing now. Continue" -- the credit line under the art, the
  paragraph under the ready-made decks' heading, the note under a card's
  conditions.
- On take 109's question (whole-card pictures and the stamp), and the
  hero: "It should show the whole card. I don't like the little peak we
  have - the blurred backround should also be zoomed out a bit where
  it's used so it's more focused on the center of the art. Continue"
- On the series: "I really like where we're headed from the preview
  screenshots and the testing i've done so far, but alot of work to do -
  this is the foundation - how many takes do you think until we can hit
  our end goal for this redesign. Can you run autonomously overnight on
  this project, minimizing the amount of approvals needed, and github
  pushes? You will check your work along the way then we will push to
  github as one massive take. Continue"

The answer given: about four more takes at the usual pace after the art
layer's second half -- the voice, polish, the Fold's inner layout (the
owner's "later"), and one for what the last look turns up. So this take
carries the series' remaining layers in order, each checked before the
next (smoke, render, the look, every PNG read), committed on the branch
and pushed once at the end. An hourly check-in to this session resumes
the run if it stops.

### The plan

1. **The art layer, second half** (Hunt first): Sealed's banner (A) --
   the most valuable card of the newest booster set out whose picture
   the runner fetched, sharp at the large size, cut above the stamp;
   every heading in Sealed a strip under its own set's top card; each
   Leader faint behind its side of the Play counter; the owner's own
   hero pictures. With the owner's three removals, the peek gone, the
   blur zoomed out, whole cards whole.
2. **The voice** (UI-AUDIT §5).
3. **Polish** (UI-AUDIT §6).
4. **The Fold's inner layout**, if the first three are done and checked
   (they were; and at the owner's "Ensure 110 has as many planned changes
   in it as possible", the planned leftovers after it).

### Measured first

- **The stamp under the blur** (the zoom-out's limit). ST02-001 is the
  one Leader looked at whose TCGplayer picture is clean while Bandai's
  is stamped, and the stamp band (43-55 % down the card) is the only
  difference between the two. Both, through the blurred layer, at
  Decks' hero (412x249), a card's page (412x419), a Play panel (380x190)
  and the Fold's inner hero (840x249): with the whole card in the frame
  (at the box's width, centred on the art) the stamped one differs by
  up to 29-38 levels of 255 on the hero, 71-80 on a card's page and
  65-72 on a panel -- a light band, plainly visible; with the band above
  the stamp, by 6 at every size, the two pictures' own noise. So the
  zoom-out stays inside the band.
- **The zoom.** The band (the thumbnail's top 200x117), cut to cover its
  box, was 2.54x on Decks, 3.99x on a card's page and 2.14x on a Play
  panel. Shown whole at the box's width it is 2.06x, 2.06x (at the top
  of the page) and 1.62x: 19 %, 48 % and 24 % further out. On the Fold's
  inner screen Decks' band is 426 px of 840, the card's colours either
  side.
- **The Play counter below 400 px.** Three steppers of two 44 px buttons
  (take 108) with their 16 px gap need 3 x 104 + 20 = 332 px; a 360 px
  phone's panel has 296 inside (390 px: 326; the Fold's cover: 348). The
  take-109 build scrolled sideways at 360 with both Leaders chosen; with
  this take's `overflow:hidden` on the panel (for the art) the third +
  was cut at the panel's edge instead -- render, in Chrome: "Given DON!!
  up" on both sides.
- **Release take-109's heading.** The title comes from BUILD; the body is
  `ci/RELEASE.md` as committed, whose first line is typed by hand. Take
  109 wrote its "New at take 109" paragraph (the build refuses without
  it) and left the line at 108. Nothing checked it.

### Built -- the art layer, second half

- **Sealed's banner** (A): `newestTop()` -- the newest set of kind `main`
  published on or before today with a card picture (today OP17; its top
  card OP17-079 Monkey.D.Luffy, $1,776.47), found through `setTop()`: a
  set's most valuable printing with a hash (a picture that served), by
  printing id, kept until the catalogue changes. Sharp at the large size,
  cut above the stamp, the thumbnail if the large one fails; the title in
  A's slot, where Decks' is. No picture in any set: the plain header.
- **The strips:** every heading in Sealed, the starter decks' too (the
  newest deck set's top card); a set with no picture yet (OP18, EB05
  today) keeps the plain ground; the name in white over a scrim from the
  left; a date never breaks at its hyphens (the look found "2026-10-"
  over "30"). Releases keeps its rows (ruled out below).
- **The Play counter:** each side's Leader, blurred and faint (0.6),
  behind its panel; none until a Leader is chosen. Its steppers' gaps
  give way below 412 px (`clamp`), the buttons keep 44 px; at 411 px and
  wider nothing moves.
- **The owner's own pictures:** `assets/user/hero-hunt.jpg` for Sealed,
  `hero-play.jpg` for Decks, shown uncut (they are not cards).
- **The owner's removals:** the credit line under the art (Decks and
  Sealed, with its style), the ready-made decks' paragraph, the card
  page's condition note (`#dCondNote` and both its texts). What stays
  said: the card page's line names the condition ("Condition · Near
  Mint"), a sealed product's says "Sealed — no condition"; the per-
  condition gap is in More's "What this app does not know", on the trade
  screen and in the bulk picker; the ready-made decks' heading and every
  row's badge say ready-made.
- **The owner's ruling on the hero and the blur:** no card rises from
  behind Decks' title; the blurred art shows the band above the stamp
  whole at the box's width (`object-fit:contain`), centred, and at the
  top of a card's page, where it shows beside the card; the sharp art
  still fills its band. Whole cards stay whole (the owner's ruling; no
  change).
- **The Release heading's tripwire:** the gate refuses a
  `ci/RELEASE.md` heading that is not BUILD's take (the V1-STATE
  heading's check, beside it), with a selftest probe; the heading reads
  take 110.

### Tests -- the art layer, second half

- **smoke** 847/847. On the take-109 build the checks fail 26 -- every
  take-110 check but the four that hold on both (the controls on the
  removed lines, the per-condition gap still said, the condition lines)
  plus the six older checks this take rewrote.
- **render** in Chrome: 142 checks, one failing here -- the Decks list's
  thumbnail, the proxy's certificate (landmine 152); the runner has it.
  On the take-109 build 12 fail; on this take's build before the
  steppers' gaps, the cut + at 360 px.
- **The look, take 110:** 16 of 16 at both sizes, with real pictures
  (170 fetched through Node, 37 refused by the host -- the ids TCGplayer
  refuses). Every PNG read.

### What I got wrong, and caught

- **Take 109's Release went out under take 108's heading:** I wrote the
  paragraph the build asks for and never read the line above it. The
  gate reads it now.
- **My first zoom-out put the whole card in the blur.** Measured before
  it shipped: the stamp comes through a blur as a light band, up to 80
  levels. The band above the stamp stays the frame.
- **The 360 px Play counter:** take 108's 44 px steppers overflowed it,
  and neither take 108's nor take 109's no-sideways check had the Play
  screen in it. This take's check found it on the take-109 build.
- **The look's first run showed the banner at the thumbnail:** this VM's
  build predated the move onto main, whose nightly had measured the
  large size; the manifest said "not measured" and the app, correctly,
  kept the thumbnail. Rebuilt and run again.
- **The look's second run had Hunt's zip sheet over every Hunt picture
  and a card's page:** my steps switched modes by script, which a person
  cannot do under the sheet. The steps close it, as render's do.
- **Smoke's starter-decks line** asked for the name within 400
  characters of the first fold -- a stand-in the heading's art broke. It
  asks what it meant now: the first fold is the starter decks', the name
  inside its heading.

- **A smoke log read stale:** a patch that stopped on its first missing
  anchor short-circuited the rebuild and smoke, and I read the earlier
  run's file as a new failure. The tree was right; the anchors now match
  without their indentation.
- **My empty-state helper named its glyph through a variable**, which take
  108's sprite check (landmine 142) refuses because it cannot read it; the
  glyphs go through `EMPTY_GLYPH` now, a map the check reads.
- **Two look steps undid their own subject** before the picture was taken
  (the search cleared, the zip sheet left open by a scripted mode switch);
  the harness photographs after the step returns.
- **I wrote "take 72" into landmine 153 before checking it;** the history
  starts at take 80 (a seed import), so the entry says "at take 80, the
  first take the repository holds".
### Built -- the voice (A42 layer 5, UI-AUDIT §5)

- **The developer's wording out:** the page's title is "OP TCG Hub" (the
  take lives in More's About); "(R6)", "(PROTOCOL §10)", "(landmine 25)"
  and "MEASURED:" gone from the screens (the set-chip note says "about 1
  card in 10; with the set chosen, about 6 in 10"); More's credits panel
  is "Save credits" in the collector's words, and its "+20 (dev)" button
  -- credits without an ad -- moved to Diagnostics as "+20 test credits";
  the tour's "Two faces" and "A simulator is on the roadmap" became
  "Three modes" (Collect, Prep & Play, Hunt) with the Sim that exists;
  Sealed's "Store stock and local shops come to this mode next",
  Releases' "store events come with the local view", More's "the field
  is offline by design" and "Sealed product is manual" rewritten to what
  is true now.
- **Sentence case** for every heading, button and chip the audit listed
  ("Most valuable", "View all", "Market movers", "Trade analyzer", "Bulk
  actions", "+ Add a graded card", "Starter decks", "Your scan", "Graded",
  "Backup failed", "This replaces", "Offline OK", "For this deck", "DON!!
  given", "Calendar"); a sweep of the shipped labels found no others.
- **One word per thing:** *Collection* for Portfolio everywhere on screen
  (D17; "Names a collector gave stay as given", and the CSV column and
  the backup keep the word `portfolio`, so any take's export imports);
  (D17 marked applied in DECISIONS-OPEN; PLAY-LISTING's feature bullet says
  "Separate collections" -- the owner pastes it into Play when they choose);
  *Refresh* for the three hourly feeds (it was Fetch on three screens and
  Refresh on one); *Export CSV* and *Back up* in Collection's grid as in
  More; *pass the phone* for the Sim as for the counter; the want list by
  its name in the toasts; *Blocker* as the game writes it. Home's
  Performance panel is "Against what you paid", Events' panel "Store
  events". Delete stays for what is destroyed and Clear for a list or a
  filter emptied -- two things, two words.
- **Money:** `signedMoney()` -- "+$12.50", "≈+C$12.50"; seven places had
  written `money(x).slice(1)`, which dropped the "$" in dollars and the
  "≈" of a converted currency. The range line says "in the last 7 days",
  "since the first day on file" (it said "in the last all time"). The
  price filter's bounds are typed and shown in the currency on screen,
  kept in dollars ("min $" said "$" in every currency).
- **Percentages:** one decimal, none from 100 % up (they were 0, 1 or 2
  by place).
- **Days and moments:** "Sep 23" (the year only when it is not this one)
  and "Sep 24, 6:23 AM" wherever a screen wrote an ISO date or a time with
  a literal T -- prices, backups, releases, a strip's date, alerts,
  staleness; ISO stays where a machine reads it (the diagnostics and
  self-test reports, file names, the calendar file). "×" for "x".
  186 straight apostrophes between letters curled, 11 in the markup's text
  and 175 in the script's strings (none in an attribute, a regex or the
  licence notices, which live in `assets/glyphs.svg`).
- **Labels:** every field has a name a screen reader says (13 had only a
  placeholder, which vanishes as typing starts); the Play counter's
  button is "Start", "Next turn" or "End turn" with what happens beside
  it; the Sim's setup is "New game". Home's update note starts with a
  capital (the release paragraph is written to follow "New at take N:").

### Tests -- the voice

- **smoke** 870/870. The voice's 15 checks each fail on the build before
  it (this take's part 1, 90efb0f): the developer's words, the credits
  in Diagnostics, the casing list, the word list, signed money (and in a
  converted currency), the percentage rule, the dates and moments, ISO
  only in the reports, Sealed's line, the filter's currency, every field
  named, the Play button. Each list has its control, and the data still
  says `portfolio`.
- **render** in Chrome: 141 of 142, the one the proxy's certificate
  (above).
- **The look:** five steps added (Home's collection and delta, More's
  credits, the filter's currency, the Play counter, Releases' days); 26
  of 26 at both sizes.

### Built -- polish (A42 layer 6, UI-AUDIT §6)

- **Motion from the tokens:** the six transitions that named their own
  duration (.12s to .35s) take --dur-press, --dur-ui or --dur-sheet. A
  sheet rises from the bottom edge as its scrim fades in (320 ms, eased
  out); a tap on the mode slider crossfades the new mode's screen and turns
  the page's colours with it (220 ms), and the class comes off after so a
  later screen change does not fade. Take 106's one reduced-motion rule
  stops them all: measured in Chrome, the sheet's animation takes 0 s
  under an emulated `prefers-reduced-motion: reduce`.
- **One empty state:** `emptyHtml()` -- the list's glyph (through a glyph
  map, so take 108's sprite check reads it), what is missing, what to do --
  on Decks, the card browse, the want list, alerts, Search and Sealed, the
  look Collection's, Decks' and the Binder's already had. **Found by the
  new check:** Sealed with a search that matched nothing showed nothing at
  all; the stock panels always filled the list, so the "Nothing matches"
  fallback never ran. It shows under the panels now.
- **Tabular figures** are the body's default, so every number lines up,
  not only the `.mono` ones.
- **Three thumbnail sizes** where there were seven (30 to 56 px):
  `THUMB` and `--thumb-s/-m/-l` -- 32 in the dense deck-building lists,
  44 in a list row (Search, Home, Trade, Releases, the decks, the Play
  counter), 56 for a sealed product. Two radii stay: a card's 6, a box's 8.
- **A card's copy row is two lines:** the finish and its condition beside
  the price, the quantity under them by the condition buttons. In one line
  the name had about 60 px of a 345 px row, and the look had "Near" over
  "Mint". `.nw` keeps a name, a date or an amount whole besides, and the
  card page's "as of" date uses it.

### Tests -- polish

- **smoke** 882/882: the tokens only (control: a take-109 literal), the
  sheet's rise, the crossfade's on-and-off, the reduced-motion rule, the
  empty states (control: the take-109 bare lines) and Sealed's painted,
  tabular figures, the three sizes (control: a call with its own size),
  the unbreakable condition name. Take 93's cardPic check follows the size
  (44x61).
- **render** in Chrome: 145 of 146 (the proxy's thumbnail): the sheet's
  animation is `sheetUp` at 0.32 s and 0 s under reduced motion; a real
  tap on the slider crossfades and the class comes off; a sealed
  product's picture is 56x70; the body's figures are tabular. Take 93's
  search-row check follows the size (44x61); take 82's palette check reads
  Prep & Play's charcoal once the colours have turned (220 ms).
- **The look:** four steps added; 34 of 34 at both sizes.

### Built -- the Fold's inner screen (the owner's "Fold layout later", brought into this take)

- **Between a phone and the desktop column:** under 700 px is a phone;
  from 900 px a desktop browser keeps take 60's centred 520 px column.
  Between them, the open Fold (about 840 px, INFERRED from the device's
  resolution until Diagnostics' viewport line comes from the open phone)
  had every screen stretched to 840 px -- a 196 px card in a field of
  backdrop, rows 800 px wide, two collection tiles of 400 px. It gets two
  panes where two fit:
  - **a card's page:** the card at 300 px on the left, its sub line,
    stats and panels beside it (`float` and `flow-root`, so the page keeps
    its order and the later panels run the full width under the card);
  - **Home:** the value and its chart across the top, Most valuable and
    Set completion side by side under them;
  - **lists of rows two to a line:** Search, the card browse, Sealed (its
    strips and panels span both), Releases, Decks and the ready-made decks
    (a line of deck panels at one height), Events and Local;
  - **the collection's tiles four across;**
  - **a sheet** centred at 640 px, still rising from the bottom.
  The Play counter, the Sim and a deck's editor keep one column (a second
  would not help), and nothing moves on the phone or on a desktop.

### Tests -- the Fold's inner screen

- **smoke** 885/885: the rules inside the 700-899 px range (control: a
  stylesheet without them), and the phone and the desktop column as they
  were.
- **render** in Chrome, at 840 px: the card is 300 px on the left with its
  page beside it; Home's two lists share a line; Search's and Releases'
  rows are two to a line; no sideways scroll at 700, 840 or 899 px on
  Home, a card, Sealed, Releases and Decks; on the phone the card is
  centred at 196 px as before. 151 of 151 (this run the proxy let the
  Decks thumbnail through as well).
- **The look:** every take-110 step at the inner size shows the two panes;
  34 of 34.

### Built -- the planned leftovers

- **Bulk delete keeps to the collection on screen** (landmine 155; the UI
  audit's finding in passing, a data-loss risk under AGENTS rule 5):
  `bulkLines()` takes the selected printings' lines in the active
  collection only, as Move and Condition already did; the confirm values
  them with their quantities.
- **A failed picture's label** is white on a dark pill: black at 65 % on
  the card's gradient measured 1.64 to 3.23:1 (the audit's last open box
  of §1); smoke measures the pill above 4.5:1 over all six game colours.
- **Home says "a snapshot is taken each day" once** (the chart's note
  repeated the line under the value).
- **Seven long notes on the main screens say the same in fewer words** --
  Where to buy, a graded copy, the stock alerts, the distributor's panel
  and releases, the shops, Releases' dates. No disclosure dropped: the
  referral, the ungraded price, when the alert runs, what sold out and
  allocated mean, the date's source. More's reference panels, the deck
  rules and the Sim's limits keep their length.

### The take, at the seal

- **The full pipeline, here:** a fresh ingest from TCGCSV, the hash step
  (the second host 1 of 244; the large size "served 40 of 40, median
  600x838, smallest width 408"), the build, smoke 890/890, render 151/151
  in Chrome, then the gate -- which stopped it once on a line I wrote
  tonight: More's credits said "shows no ads" in the browser copy, and the
  stale-copy check refuses that phrase (landmine 88: the app has rewarded
  ads). Reworded to what is true: credits and their ads apply only in the
  Android app.
- **smoke** 891/891 on this build; on the take-109 build it fails 72 -- 58
  of this take's checks and the 14 older ones this take rewrote (the
  copy row's check came after that count).
- **The gate** passed; its selftest 17/17, the new Release-heading probe
  among them; the scrubber clean over 63 files.
- **The look, take 110:** 34 steps at both sizes, 34 ok, with real
  pictures (727 fetched through Node, 99 refused by the host -- the ids
  TCGplayer refuses). Every PNG read; they go to the owner with the PR.

### After the first push: a review of the whole take

- **The runner's `check` on the first push** (16641e6): smoke 891/891,
  render 151/151 in Chrome, GATE PASSED, 2 min 28 s.
- **Two checks that could not fail**, both there since the take-88 seed:
  Sealed's starter decks "collapse on a tap like a set" and the Sim's
  [Double Attack] under DON!! each ended its condition `|| true`. Each
  now asks what its name says, with a control, and each was watched to
  fail on a build that breaks it (a fold that never folds; a DON!!
  condition that never holds). A guard refuses the shape in the file
  from now on; its control counts the two in take 109's file.
- **UI-AUDIT §6's last box** is ticked: the PR carries the pre-delivery
  checklist, item by item. smoke 895/895.
- **The runner's `check` on the review pass** (40c7d7f): smoke 895/895,
  render 151/151 in Chrome, GATE PASSED.
- **Two reviewers read the whole diff**, one the script and one the
  layout, in Chrome where it could be measured. What was real, and fixed:
  - *Bulk actions still took lines the screen hid* (landmine 155, whole
    now): with Near Mint filtered in, Delete took the graded copy of the
    printing tapped, and Move and Condition changed it; the bar valued a
    printing at the first line found in any collection (4 x where the
    confirm said 3 x). `shownLines()` is what the grid draws and what an
    action takes; the bar and the confirm count the same lines.
  - *A euro sign on a dollar figure* (landmine 157, from take 85): a saved
    currency with no rate in the build drew "€10.00" for $10, with no ≈.
    `sym()` reads the currency shown.
  - *Words over art* (landmine 158), measured from pixels over a yellow
    card: the Play counter's labels 2.0:1 (4.4 at best, black), now 5.1 to
    8.3 offline and 6.7 or better over three real pictures, under a 45 %
    shade in --dim; a card's line beside it on the open Fold 1.0:1, now
    5.1:1 on every colour with the art behind the card's column only; a
    Sealed strip's date 2.3:1 over bright art, now 5.1:1 or better with the
    scrim held to .55.
  - *The open Fold:* an empty "Where to buy" under every card (landmine
    136 again); Market movers' heading and the Decks and card-search empty
    states in half a line, a lone Events panel half the screen, Local's
    sixty shops beside 8,000 px of empty column (landmine 160, Local now one
    column); Performance kept Set completion beside a gap -- its list named
    Search's panel from take 64 on, so Search's set list was what it hid.
    Set completion has an id now, and Most valuable takes the line alone.
  - *A double tap closed the sheet it opened* (landmine 159): the second
    tap landed on the scrim while the sheet rose. A tap on a rising scrim
    waits.
  - *The art blinked on every repaint:* a keystroke in Sealed's search
    rebuilt every strip at opacity 0 and faded it in again, and a tap on the
    Play counter its Leaders. A picture that loaded once is drawn at once.
  - Smaller: "−0.0%" and "+0.0%" at one decimal (a sign only on a figure
    that is not zero), 99.96 as "100.0%", the owner's hero-play.jpg hidden
    on Decks with no Leader anywhere, the card search's divider rule aimed
    at a class its rows never have, Diagnostics' four buttons past the edge
    at 360 px.
  - *Days still in ISO on a screen*, seen in the look's pictures of the
    fixes: Market movers' heading ("2026-09-22 → 2026-09-23"), the range
    label over a gap, the rate's date in the currency picker, Where to buy,
    your own shop notes. All in words now; the shared collection page and a
    trade's text carry the year, since they are read later.
- **Checked and clean by the reviewers:** export, backup and import keep
  `portfolio`; the price filter stores dollars and round-trips; a day
  carries no timezone shift; nothing removed is still referenced; every
  inactive screen stays hidden under the Fold's grid; no sideways scroll at
  700, 840 or 899 px on twelve screens; no motion left half-run.
- **Tests:** smoke 916/916, render 161/161 in Chrome. On the review pass's
  build the new checks fail, 16 in smoke and 5 in render, and both runs go
  on past a helper that build lacks instead of stopping; each control
  passes on both builds.
- **Left as it is:** a width strictly between 899 and 900 px matches
  neither the Fold's query nor the desktop column's (no device is known to
  report one); a bulk tap still selects a printing, and the action takes
  that printing's lines on screen; an alert's "fired" day is the day in UTC
  (as it was before this take), a day early on a US evening. [Take 115: a
  day late -- the UTC date is already tomorrow on a US evening; and fixed:
  the fired day is the phone's own day.]
- **What I got wrong:** the first push measured the stamp under the art and
  not the words over it; the Fold's grid was written per container without
  going through what each holds; landmine 155's rule stopped at the
  collection; the session prompt's landmine count sat at 152 through four
  new ones.

### Ruled out

- **Strips on Releases:** its rows are mostly sets not out yet, with no
  card picture, and each row already shows its box.
- **Art in empty states:** Decks' hero already stands over its empty
  state, and Collect keeps its drawn glyphs (the owner's ruling on
  Collect).
- **The whole card in the blur** (measured above: the stamp shows).
- **A banner on Home** (the owner's ruling, unchanged).
- **Cropping whole cards above the stamp** (the owner: "It should show
  the whole card").

### DEFERRED this cycle

- **The owner's review of the whole take** (the look's pictures go with the
  PR): the blur's framing (zoomed out 19 % on Decks, 48 % on a card's page,
  inside the band above the stamp), and whether any other long note should
  go the way of the three.
- **The inner screen's real width:** Diagnostics' `viewport` line from the
  open Fold settles the 840 px the layout is INFERRED from.
- Outside the UI series, unchanged: A41 (the parts and the source), A32
  (retailers with the real page in hand), D20-D22, the AdMob unit IDs.

## Take 109 — 2026-09-24 — the art layer, part 1: the record corrected, the picture measured, Prep & Play's art, a card's own page

Opened before any code (PROTOCOL §6) by the UI/UX session: the fourth
take of A42, the first half of the art layer. The owner, having seen
take 108's look: "go, mark it ready and start take 109" -- the owner
marked PR #32 ready and merged it at 05:17 UTC (`check` green on its
head dcbedfa: a fresh ingest, smoke 786/786, render 122/122 in Chrome,
the gate passed); its build, run 57, went green and published Release
take-108 at 05:25 (the APK, 26,447,858 bytes; the AAB, 19,633,877; the
mapping). The last nightly (run 50, 23:50 UTC) is green. This take is
built on the merge (e634758).

### The owner's words (24 Sept, this session)

- On art, at the start of the series: "That wasn't a landmine set by
  me, if we can use official art, card art or anything we can leverage
  i'm more than okay with it. We should not be making our own images
  from scratch however. Likely Hot-Linked Card Art, Bold"
- The pick from the preview page: "Prep and Play/the first group of
  screenshots, I like C, but I also like A, A deck, one Level down, same
  with A sealed in Hunt. When you scroll down more info of course should
  be provided, and the color blur should match the color of whatever
  card you're looking at. I don't really like A in collect however, with
  the most valuable card showing above my Collection, I just know that
  art is going to look bad, weird, stretched etc."
- Asked this take whether the pictures carry a SAMPLE watermark: "Yes,
  some or all. Namely under the collection progress I see alot sample -
  not idea, of course. We should be pulling the highest quality images
  for the main cards. This is the only way using cards as a banner will
  work."
- Asked whether the session's VM may reach the image hosts: "I thought I
  set it to full access, yes - whatever we need."

### Measured first (this VM, 05:30-05:45 UTC)

- **The network changed during the take.** At 05:01 UTC the session VM
  reached none of TCGCSV and the two image hosts (no answer through the
  proxy; CLAUDE.md, take 102); by 05:32, after the owner's answer above,
  all of them and Bandai's card site answered HTTP 200. The session's
  browsers still refuse the proxy's certificate (their NSS store is
  empty), so the look fetches pictures through Node, which checks it.
- **Sizes TCGplayer serves** (4 cards, then 20 served ids): `_200w`
  200x279; `_400w` 400x559; `_in_1000x1000` 600x838 for most, 716x1000
  for five of twenty cards looked at (the uploads were larger), 500x700
  for one (ST04-001). **Bandai's own** card image
  (`en.onepiece-cardgame.com/images/cardlist/card/<number>.png`) is
  600x838 for all twenty. Nothing larger exists at either host.
- **The retry that never served.** `refArt()`'s onerror drops `_200w`
  and asks for `<id>.jpg`: 403 for all 221 ids the catalogue's host
  refuses and for 20 of 20 ids it serves. Since take 86 every failed
  picture has cost a second request that could not succeed.
  `_in_1000x1000`: 200 for 20 of 20 served ids, 403 for all 221 refused.
- **The SAMPLE stamp, looked at one by one** (the scratchpad's contact
  sheets): the ready-made decks' 15 Leaders and the top card of each of
  the five newest sets, at both hosts. **Stamped: 38 of 40 card
  pictures** -- Bandai's 20 of 20, TCGplayer's 18 of 20; clean: ST01-001
  and ST02-001 at TCGplayer only. The five newest booster boxes: clean
  product pictures. An earlier pixel difference (OP01-001) spelled the
  word out: Bandai's picture stamped, TCGplayer's clean. So the
  publisher's own picture is not the cleaner source, and no source is
  clean for most cards.
- **Where the stamp sits.** On every stamped picture the word is one
  band across the middle of the card: its letters start about 45 % down
  and end by 60 % (guides at 38/42/44/60/64 % on six cards of four
  kinds and colours; the first white row's median 46.8 % over 38
  pictures). **Everything above 42 % of the card is clean on every
  card** -- the frame, the cost and power, the character.

### The plan (and one change from the plan the owner approved)

The owner's pick, with what the measurement changed:

- **Decks (C):** the featured deck's Leader, its art blurred from the
  band above the stamp, fills a hero behind the mode slider; the Leader
  card itself rises from behind the title, crisp from the 600x838
  picture, and only its top 42 % shows -- the card's frame, power and
  character, never the stamp. The title, a line of counts and the
  actions sit in A's slot under it, where Sealed's will sit at take 110.
- **Changed from the plan:** it said that if a third of the Leaders
  looked at were stamped, the runner would measure the stamp per card
  and the hero would show its crisp card only when clean. 13 of 15
  are stamped at TCGplayer, so that rule would show the crisp card for
  two Leaders of fifteen. The stamp's place is fixed, so a crop above
  it is clean for every card: no detector, no threshold, and a render
  check pins the crop.
- **The ready-made decks back on Decks.** Take 61 put them "on the
  Decks screen" (its entry, below); since at least take 66 the markup
  has had `#dkStock` at the bottom of the deck editor, and the smoke
  line "Decks shows them" only checked that the id existed. Each row
  shows its Leader's picture now; the drawn cover is the picture's
  fallback.
- **A deck, one level down (A):** the Leader card at 96 px from the
  600x838 picture, its name in the display face, its number, Life and
  colours.
- **A card's own page (C's backdrop):** the card's own art, blurred
  from the band above the stamp, behind the top of the page; the card
  at up to 196 px from the 600x838 picture. The picture is the card as
  TCGplayer publishes it: for most cards, stamped (measured above).
- **Home:** no banner (the owner's ruling).
- **Offline, or a picture that fails:** the card's own colours, both
  of them for a two-colour card; nothing drawn, nothing bundled.
- **The runner** measures the 600x838 size on 40 fixed printings every
  build and the app uses it only when that build saw it served.
- **The record first:** landmines 26 and 28 marked superseded in part,
  30 and 31 standing; A6, A16, A29, A41, A42; the "may not" line; V1-STATE;
  PROVISION; RUNBOOK-play; the owner's folder README; the gate's list of
  sentences that are no longer true.

### Built

- **The picture's address** (`artUrl`, `largeOk`): the large picture
  (`_in_1000x1000`) is made from the printing's own stored URL, never a
  card number, and used only when this build's runner saw it serve
  (`manifest.images.large`; this VM's run: 40 of 40, median 600x838,
  smallest width 408). `refArt(p, {size, cls})`: a large picture that
  fails drops to its thumbnail; a thumbnail that fails is removed. The
  retry to `<id>.jpg` is gone (landmine 150).
- **The cut above the stamp:** `img.above{object-view-box:inset(0 0 58% 0)}`
  -- every picture shown as art rather than as the card (the blurred grounds,
  the rising card) is the card's top 42 %, whatever the box (landmine 151).
- **C's ground** (`artColours`, `artBack`, `paintBack`): the card's own
  colours (both of two, one and its shade, the mode's for a product), the
  blurred thumbnail over them, fading into the page by a mask.
- **Decks:** a 160 px hero (`--hero-h`) whose art reaches up behind the
  slider and the status bar while the hero keeps its height in the flow;
  the slider's fade steps aside at the top (`html.at-top`, a passive
  scroll listener). The featured Leader is the newest of the collector's
  decks with one, else the first ready-made deck's; the card rises from
  behind the title, its top 42 % showing (715x1000 for ST01-001, 716x1000
  for ST05-001 in the look); a credit names it; the line under the title
  counts the decks and the legal ones.
- **The ready-made decks back on Decks** (`#dkStock` out of the deck
  editor; `stockPic`): the Leader's picture over the drawn cover. The
  cover's 7 px name is gone; the row names the Leader.
- **A deck, one level down:** the Leader at 96 px from the large picture,
  its name in the display face, its number, Life and colours.
- **A card's own page:** `#dBack` behind the top, the card centred at
  `min(48vw,196px)` from the large picture; a product's photo fits whole
  on white.
- **The runner:** `tools/hashes.py` -- `large_url`, `large_jobs` (40 hashed
  first-host printings spread over the catalogue's ids), `measure_large`,
  the sidecar's `large`; `build_app.py` puts it in the manifest and says it.
- **The look behind the proxy:** pictures fetched in Node (landmine 152) --
  144 fetched, none refused.
- **The record:** as planned above, plus the gate's stale-copy list (its
  first negative control since take 8; five more present-tense files read;
  wrapped sentences matched) and the scrubber reading the owner's README.

### Tests

- **Smoke 817/817** on a fresh catalogue (this VM ingested TCGCSV itself,
  the first time since take 102). On the take-108 build the new checks
  fail 25 -- every take-109 check and the four rewritten older ones.
- **Render 131/132 in Chrome.** The one failure is the Decks list's Leader
  thumbnail: this VM's browser refuses the proxy's certificate (landmine
  152); on the runner it loads. On the take-108 build 8 fail: the seven
  art checks and that thumbnail.
- **The gate passed here in full** -- the catalogue checks ran on the fresh
  ingest -- and its selftest ran 16 of 16: both new stale-copy probes
  fire, the clean tree fires nothing. The widened stale-copy check, run
  on take 108's record, catches all three sentences this take corrected.
- **hashes.py's selftest:** the five new cases pass (the large URL from the
  printing's own URL; a second-host URL, a bare number and a non-URL
  refused; the median; a host that serves none measures 0; the sample
  only hashed first-host printings, spread evenly).
- **The scrubber:** clean over 63 files; on the take-108 README it refuses
  line 1's first name.
- **The look, take 109:** 20 of 20 at both viewports with real pictures,
  every PNG read.

### What I got wrong, and caught

- The first backdrop on a card's page ran 16 px past both edges: its
  `left/right:-16px` came from the hero, but the page is its own
  containing block and its padding box already reaches both edges.
  Render's sideways check caught it at 360, 412 and 820.
- The hero's art ended in a flat `--bg` and drew a seam across Prep &
  Play's textured page -- the look showed it; a mask fades the art into
  the page itself now.
- `.dklead span{display:block}` caught the colour chip too (a span) and
  stretched it across the column -- the look showed it.
- The stale-copy check matched plain substrings and missed a banned
  sentence wrapped across two lines (the NSP's "including / official
  product box shots"); it collapses whitespace now.
- The first render checks of the crop read the pictures themselves, which
  a refused picture removes; they read the rule from a probe in the same
  box now, and the markup straight after a paint.
- A product's square photo was cut at both sides in the card-shaped frame
  (since take 95 at 112 px; plain at 196) -- it fits whole now.
- The plan's pre-registered stamp detector: changed after measuring (above).

### Ruled out

- **Bandai's site as the cleaner source:** its pictures are stamped
  (20 of 20), and they are keyed by card number, not printing (AGENTS
  rule 3).
- **A per-card stamp detector:** the stamp's place is fixed, so a crop
  above it is cleaner and needs no threshold.
- **Covering or retouching the stamp:** that would be drawing on the
  publisher's card.
- **A banner on Home** (the owner's ruling).
- **Bundling or caching any picture** (landmine 26's part that stands).

### DEFERRED this cycle

- Take 110, the art layer's second half (Hunt first): Sealed's art
  banner (A) from the most valuable card of the newest set, cropped
  above the stamp; the set headers on Sealed and Releases as art strips;
  the Play board's Leader art; art in empty states; the owner's own hero
  pictures through `assets/user`.
- **The owner's call:** whole-card pictures -- every thumbnail, a deck's
  Leader, a card's own page -- show the SAMPLE stamp wherever the
  publisher's picture carries it (most do; no clean source exists,
  measured above). They could show the card above the stamp instead,
  as the hero does, at the cost of no longer showing the whole card.
- Then the voice take and the polish take (A42).

## Take 108 — 2026-09-24 — controls and icons: every icon from the sprite with one meaning each, a 44 px target for every control, a pressed and a disabled look

Opened before any code (PROTOCOL §6) by the UI/UX session: the third
take of A42, split from the header take. The owner, on take 107's look:
"go, mark it ready and start take 108". Take 107 (PR #31: `check` green
on its head -- a fresh ingest, smoke 769/769, render 115/115 in Chrome,
the gate passed) merged at 04:15 UTC; its build, run 56, went green and
published Release take-107 at 04:23 (the APK, 26,438,210 bytes; the AAB,
19,623,696; the mapping). This take was built on take 107's head while
the PR was open and moved onto the merge. The last nightly (run 50) is
green.

### Measured first (the take-107 build)

- **Icons that are characters:** 🔍 twice (the collection's and the
  Leader sheet's search), 📷 (Search's scan button), ⚙ twice (filter and
  sort), ☆/★ (favourites), ☐/☑ ("own"), ↶ (Undo), ⇄ (Play's first
  player), ↻ and − (a fired alert's watch-again and remove), ⋯ (the Sim's
  card menu), ▾/▸ (the collection switcher, the set chip, every fold),
  ↗ on three external links of many, ✓ (a reminder, the chosen
  currency), ○/● (the stock alert). Typography stays text: the minus of
  money, ×2, arrows inside a label, ▲▼ beside a price's colour, middle
  dots and dashes.
- **One glyph, several meanings** (the sprite's use map): `g-stage` is
  Sealed, Collection, Binder, scan-from-a-photo and the Stage card type;
  `g-life` Play, Events, Want list and Life; `g-counter` Releases, Backup
  and Counter; `g-blocker` Scan, Bulk and Blocker; `g-trigger` Movers,
  the torch and Trigger; `g-compass` Home and Local; `g-spyglass` Search
  and Cards (one meaning, find a card) and Export.
- **Targets, in Chrome at 412 px, every control on the twenty screens
  and three sheets:** 1,673 controls, 520 under 44 px in a dimension --
  349 of them Sealed's where-to-buy chips (31 px tall), then the chips
  (35), the plain buttons (the search bar's icons at 13-19 x 22, the
  steppers at 34, a deck's +/- ), the links (36), the fields and
  selects (39-41), the ghost buttons (33-42), Home's ranges (36), the
  currency pill (29), the set chip (38).
- **No pressed look anywhere** (the tap highlight is off and nothing
  replaces it) and **no disabled look** (a disabled button draws like a
  live one).

### The plan

- **Icons:** every character icon becomes a sprite symbol; new symbols
  where a glyph carries two meanings -- Scan, Collection, Sealed,
  Releases, Local (the existing pin), Events, Want list, Export, Import,
  Backup, Bulk, Movers, the torch, scan-from-a-photo, Binder -- so the
  game's own glyphs keep the game's meanings. The new interface symbols
  are Lucide's (ISC; the Feather-derived ones MIT), as the plan said:
  their notices ride inside the sprite, so they ship with every copy,
  and About credits them. Take 107's back, close and gear stay.
- **Targets:** 44 px for every control -- a real 44 where growing costs
  nothing (ghost buttons, links, fields, steppers, the search bar's
  buttons), a 44 px hit area around the drawn control where a dense row
  would grow (chips, the where-to-buy chips, pills, the ranges, the
  slider).
- **States:** a pressed look on every control, a disabled look on every
  disabled one; names for the icon buttons that have none, and
  `aria-pressed` on every toggle.
- **Guards:** the gate refuses an icon character in the app (a control
  plants 🔍); render measures every control's 44 px square on every
  screen (a control shrinks a stepper to 34 px).

### Built

- `assets/glyphs.svg`: 26 of Lucide's icons (lucide-static 1.47.0, fetched
  from the npm registry) as `g-scan`, `g-collection`, `g-box`,
  `g-calendar`, `g-trophy`, `g-bookmark`, `g-export`, `g-import`,
  `g-backup`, `g-select`, `g-trend`, `g-torch`, `g-photo`, `g-binder`,
  `g-filter`, `g-star`, `g-undo`, `g-swap`, `g-refresh`, `g-more`,
  `g-chevron`, `g-external`, `g-minus`, `g-plus`, `g-check`, `g-bell` -- at
  the sprite's 1.7 stroke, each commented with what it means here. Their
  licence (ISC, and MIT for the Feather-derived ones) is a `<metadata>`
  element in the sprite: an element, so it survives the build's comment
  strip and ships in every copy; More's About credits them in a line.
- `src/app.html`, icons: Scan, Collection, Sealed, Releases, Local (the
  pin it already had for a shop), Events, and the collection's actions
  (movers, bulk, export, import, backup, want list, binder) draw their own
  symbols; the game's glyphs keep the game's meanings. The torch, scan
  from a photo and Undo on the scanner; the search bars' spyglass, scan,
  star and filter; every caret and fold (one chevron, turned while
  closed); every link that leaves the app; the reminder's and the chosen
  currency's tick; the stock alert's bell (filled while it watches); the
  Sim's card menu and trash; Play's who-goes-first swap; every stepper's
  minus and plus. "☐ own" is a chip, "Owned only". A few painters name a
  local `G` for the distributor feed, so `chev`, `ext`, `tick` and `bell`
  are top-level helpers that close over the real one.
- `src/app.html`, controls: `button svg, a svg {pointer-events:none}`
  (handlers read `e.target`); a pressed look (every control lightens, the
  compact ones scale to 0.96) and a disabled look (0.45, not-allowed);
  names on every icon button (the Play, Trade and want-list minus, watch
  again, remove, the Sim's menu and trash) and `aria-pressed` on the
  favourites star, "Owned only" and "for this deck"; 44 px targets -- a
  real 44 for fields and selects, ghost buttons, links, the steppers, the
  condition buttons, the actions (`flex:0 0 auto` beside the minimum), the
  search bars' buttons in a 60 px bar; a 44 px hit area (`::after`) round
  the chips, the currency pill, the set chip, Home's ranges, the row
  steppers and the slider, with chip rows 44 px apart (a 10 px gap) and the
  Cards groups 10 px apart; checkboxes at 20 px inside their 44 px label
  rows. The deck's name field is 44 px to tap and keeps its title's place
  (`display:flow-root` on the title, so its margin cannot collapse
  through). **The scanner's height takes the sticky mode slider off**
  (`--modebar-h`, 53 px): its shutter row had sat 52 px under the nav at
  every size (PROVEN on the take-106 and take-107 builds, landmine 146).
  Every link drawn as a ghost button centres its words (an inline
  `display:inline-block` on five of them had pinned the words to the top).
- `tools/gate.py`: `check_icon_characters()` refuses an icon drawn as a
  character in `src/app.html` -- emoji, the symbol blocks, the arrows and
  shapes the app once used -- literally, as `&#NNNN;` or as `\uXXXX`, and
  leaves comments and typography alone; two selftest probes plant 🔍 and
  a `\u2699` escape.
- `tools/smoke.mjs`: six older assertions follow the glyphs instead of ↗
  and ✓ with the same intent; a take-108 section of 17. `tools/render.mjs`:
  every control's 44 px square on the twenty screens and three sheets
  (elementFromPoint at 21 px from the centre, the control brought on
  screen clear of the fixed bars first), a 34 px stepper as its control;
  the scanner's row above the nav; the pressed look during a held press;
  a disabled button's look. `tools/look/steps.mjs`: take 108's ten steps.

### Tests (local, on the take-104 release catalogue; the runner's `check` is the seal)

- Smoke 786/786 (17 new). **Watched to fail first:** over the take-107
  source and sprite, 21 fail -- 15 of the take-108 section (only its two
  controls pass) and the six rewritten from the characters to the glyphs.
- Render 121/122 in Chrome -- the CDN thumbnail, as on every VM. On the
  take-107 build the four take-108 checks fail: 497 of 1,537 controls
  without their own 44 px square, the scanner's row at 867 against the
  nav at 815, no pressed look, no disabled look.
- **The runner's first `check` on this PR failed one check**, with data
  this VM does not have: on the fresh hourly feed, two where-to-buy chips
  (TCGplayer and GTS Distribution) wrapped onto two lines 41 px apart --
  the chips were 31 px -- and their 44 px squares overlapped. Reproduced
  here with the fixture feed and the strip narrowed until it wraps; fixed
  with a 34 px floor on every chip; render now builds the fixture feed on
  every run, forces the wrap, and reads every chip's square, with the
  floor removed as its control.
- The gate's icon check passes the take-108 source and fires on take
  107's (16 icons); both planted probes fire; an icon inside a comment
  does not.
- The targets probe, 1,673 controls on the twenty screens and three
  sheets: 520 under 44 px at the start, none without its own 44 px square
  at the end.
- **The look, take 108: 10 of 10 at both viewports**, every PNG read:
  Play's steppers at 44 px with the sprite's minus and plus and the swap
  beside the first player; Cards' chips each with its own square; Hunt's
  nav (box, calendar, pin, trophy), the bells, the external glyph on every
  where-to-buy chip, the fold chevrons; a reminder set with its tick;
  Collect's nav and the eight actions each their own symbol, the search
  bar's star and filter at 44 px; the star filled while on; the scanner's
  row wholly above the nav; a card's steppers and conditions at 44 px;
  Run held down (lighter, smaller) beside Copy and Share switched off;
  About's credit.

### What I got wrong, and caught

- `min-width:44px` on the collection's actions replaced each item's own
  minimum: the row squeezed every label to 44 px and two sat on top of
  each other. The targets probe found it; `flex:0 0 auto` beside the
  minimum, pinned in smoke (landmine 147).
- The first 44 px stepper rule sat above the original 34 px one in the
  stylesheet and lost to it; the original rule is the one that changed.
- The deck's 44 px name field pulled its title 6 px up through a
  collapsing margin; take 107's own title-height check caught it.
- The look's favourites step read the outer svg's fill, passed, and the
  picture showed a hollow star: a symbol's own `fill="none"` beats
  whatever the outside sets (landmine 148). The star and the bell leave
  their fill open now; the step reads the symbol.
- The first targets and look passes measured controls that were off
  screen or under the fixed nav: a probe gap, not the app's; both bring a
  control on screen, clear of the bars, before reading its square.
- The chip rows' 10 px gap assumed a 34 px chip; the where-to-buy chips
  were 31, and only a strip that wraps shows it -- no strip wrapped in
  this VM's data. The runner's live feed did (see Tests).

### Ruled out

- Growing every chip to 44 px tall: the dense rows (Cards' filters,
  Sealed's where-to-buy) would lengthen by a fifth; a hit area round the
  drawn chip gives the same target.
- Bundling an icon font: the sprite already inlines; 26 symbols add
  about 14 KB to the page and draw in the palette.
- Changing Home's compass, Search's spyglass, the Decks card back, Play's
  heart and the Sim's DON!!: each already means one thing.

### DEFERRED this cycle

- The art layer (the record's art policy corrected first), the voice
  (copy, one date and money format, Collection for Portfolio), polish
  (A42's last three takes).
- The Fold's inner layout (the owner: later).

## Take 107 — 2026-09-24 — one header on every screen: the same title in the same place, a back arrow one level down, the More gear on every main screen

Opened before any code (PROTOCOL §6) by the UI/UX session: the second
take of A42. Take 106 merged at 03:32 UTC (PR #30, `check` run 39 green
on its head: a fresh ingest, smoke 742/742, render 106/106 in Chrome,
the gate passed); the merge's build, run 55, went green and published
Release take-106 at 03:39 UTC (the APK, 26,437,538 bytes; the AAB,
19,623,403; the mapping). The branch starts from that merge. The owner's go, after
take 106's look: "go, start take 107 on top of 106".

### The plan

- **One header, written into every screen's markup** (smoke's DOM sees
  only static ids — landmines 128, 135): a `header.appbar` holding the
  title (`h1`, the display face, one size, one baseline, the mode's
  accent as text), an optional line under it, and the actions at the
  right. Three kinds: a mode's main screen and the other screens in the
  nav (no back), and the screens one level down (a back arrow at the
  left). The header decides where a title sits; nothing else does.
- **The More gear** — a real button that opens More — at the right of
  every main screen in all three modes (A37, the owner's answer).
- **Home's Overview and Performance** become one segmented control (a
  tablist with exactly one selected tab) under Home's title.
- **The sheets** (which printing, filter, ask, Leader, printing pick)
  get the header's title face and a close button.
- **Hunt's titles lose the swords.** The mode is its palette and its
  nav; a mark in only one mode's titles is what made them differ.
- **Split:** icons from the sprite only, 44 px targets and pressed and
  disabled states become take 108, so each take is one thing to look
  at. The art banners (C on Decks, A on Sealed) go into this header at
  the art take; the header is built to take them.

### Measured first (Chrome, 412 px, on the take-106 build)

- **Back over a sheet, PROVEN broken:** the filter sheet opened by its own
  button on Search stayed open after Back while the screen under it went
  to Home; the Leader sheet opened over a new deck stayed open while the
  screen went to Decks. The probe's control: the printing picker, which
  is on `closeAnyOverlay()`'s list, closed and the screen stayed. The
  filter, Leader and printing sheets were never on the list (landmine
  144); the audit had it as unconfirmed.
- **Where the titles sat,** all twenty screens, reached the way a person
  reaches them: fifteen titles in the comic face at 21 px, at three
  heights (14, 16.4 and 17.9 px from the screen's top, moved by whatever
  sat beside them); five screens with no title at all -- Search opened
  with its search box, Scan with a set chip, Collection with its action
  row, a card with "Adding to...", a deck with a 17 px name field at
  x = 84.

### Built

- `src/app.html`: a `header.appbar` in the markup of all twenty screens
  (More's too: `paintSettings()` paints `#setBody` under it). The title is
  an `h1.ab-title` -- the display face at `--fs-head` (26 px) in the mode's
  `--accent-ink`; one line may sit under it (`.ab-sub`: Sealed's prices
  date, Sim's rules line, the binder's page, the collection a card is
  added to); the actions sit at the right (`.ab-act`). The title's first
  line is centred on the 44 px row of Back and the actions, so a line
  under it moves nothing. The gear to More (`g-gear`, a real
  `data-go="settings"` button) is the last action on the twelve screens in
  a nav; the back arrow (`g-back`) opens the eight one level down (a deck,
  a card, a set's checklist, the binder, the want list, Trade,
  Diagnostics, More). `backArrow()` is the phone's Back: the back
  button's own path in the app, never out of it; `history.back()` in a
  browser. A deck's name field is its title; a card's name is its title.
  Hunt's titles lose the swords (the splash keeps them). Scan's own head
  and its inert gear pill, and Decks' unlabelled gear, give way to the
  header. Home's Overview and Performance are a tab row under the title
  (a tablist of two buttons, one tab stop, the arrow keys move between
  them). The five sheets have a head: the title in the display face at
  `--fs-title` and a close button (`closeSheet()`: the ask sheet answers
  no, the others close). `closeAnyOverlay()` and the watchdog name the
  filter, Leader and printing sheets. Home: the release note draws no
  second rule under the tab row, and "Got it" keeps to one line (both
  seen at take 106 and left for this take).
- `assets/glyphs.svg`: `g-back`, `g-close`, `g-gear` -- a chevron, a
  cross and an eight-tooth gear, drawn in the sprite's own style (24 x 24,
  stroke, currentColor) under a third family in its header, INTERFACE.
  The plan said Lucide's (ISC, credited in About); three plain shapes
  drawn here keep the sprite one provenance with no licence to carry.
- `tools/smoke.mjs`: six older assertions follow the header with the same
  intent (take 83's one height, take 66's real headings, take 64's
  Overview, take 70's Hunt palette with the swords on the splash only,
  take 91's More rows under the header, take 98's overlay list with the
  three sheets); a take-107 section of 27. `tools/render.mjs`: the face
  check loads each face before reading it (landmine 145); the checks
  that read the first `h2`, `.tab.on` or `#settings .bar .tab` read the
  screen's `.ab-title`; the heading count includes `h1`; a take-107
  block of nine. `tools/look/steps.mjs`: take 107's eleven steps.

### Tests (local, on the take-104 release catalogue; the runner's `check` is the seal)

- Smoke 769/769 (27 new). **Watched to fail first:** the same smoke over
  the take-106 source and sprite on the same catalogue fails 23 -- 17 of
  the take-107 section (only its four controls pass; its six checks of
  the handlers are not reached, and the check that the handlers exist
  fails) and the six older assertions rewritten to the header.
- Render 114/115 in Chrome -- the CDN thumbnail, as on every VM. The
  take-106 build fails 13: all nine take-107 checks, the three older
  checks rewritten to the header, the thumbnail. The face check fails
  with `OPH Comic: error` when the comic file is moved aside (the control
  for its change).
- The title probe, twenty screens, after: one height (19.7 px), one size
  (26 px), one face; two lefts (16 px in a nav, 58 px beside the arrow);
  the gear in one spot on all twelve screens in a nav, in all three
  modes; nothing clipped, overlapping or off the screen.
- **The look, take 107: 11 of 11 at both viewports**, every PNG read:
  Decks (the title in `#E5705C`, "+ New deck", the gear); a new deck
  named "Red Shanks" as its title, the arrow back to Decks; Cards and Sim
  with their titles and gear in the same place (Sim's line under it moves
  nothing); Sealed with its prices line, the currency and the gear, no
  swords; Local's distance and gear; Home's title, badge, currency and
  gear with the tab row (Performance taken and given back, one rule under
  it, "Got it" on one line); Search and Scan opening with their titles; a
  card (Nami) with the arrow, its name and "Adding to One Piece", the
  arrow back to Home; the gear to More and More's arrow back; the filter
  sheet's title and cross, closed by Back with Collection staying, and by
  its cross; OP01's checklist with "Want the 121 missing".

### What I got wrong, and caught

- The first header centred its row, so a line under a title (Sealed,
  Sim, a card) lifted that title about 8 px above the others -- the
  owner's complaint again, in a new place. The probe measured it before
  any picture was taken; the title's first line is now pinned to the
  44 px row, and render compares all twenty heights.
- Render's face check failed with nothing broken once Home's tabs left
  the comic face: it had only ever proved the faces the first screen
  used (landmine 145).
- A length limit on the deck's name crept into the patch; taken out
  before any test ran -- this take changes no behaviour of a field.
- The look's filter step first ran without its context and failed on
  both viewports; a harness slip, fixed and rerun.

### Ruled out

- An arrow on Market Movers: it is a state of Search, a screen in the
  nav; the phone's Back returns to Collection as before.
- A header that stays on screen as the page scrolls: the mode slider
  already does, and a second fixed band would cost every screen about
  64 px on the cover display.
- Save in the deck's header: it stays in the row where a deck is
  finished; this take moves titles, not actions.
- The duplicate panel titles ("Performance" under its own tab, the
  Events panel on Events): copy, the voice take's.
- Lucide's icons (see Built).

### DEFERRED this cycle

- Take 108: every emoji and symbol icon to the sprite, one meaning per
  glyph, 44 px targets, pressed and disabled states. The art layer, the
  voice and polish after it (A42).
- The Fold's inner layout (the owner: later).

## Take 106 — 2026-09-24 — the UI series begins with its foundation: one set of design tokens, Prep & Play's red readable on its cards, no text under 12px, colours that follow the mode, the two blank icons gone

Opened before any code (PROTOCOL §6) by the UI/UX session, which owns
design and refinement from take 104 on (the owner, 24 Sept; NSP). The
take opened on take 104 (merged 02:13 UTC; Release take-104 02:19 with
the APK, the AAB and the mapping; build run 53 green; the last nightly,
run 50, green) while take 105 was the other session's PR #29. Take 105
merged 03:01 UTC and is merged into this branch before the PR; the tests
below were run again on the merged tree. This is the first of five UI takes (A42): the
foundation (this), one header on every screen, the art layer, the voice,
polish. The order is by layer, app-wide, because a header converted mode
by mode would leave the app less uniform in between; inside each take
Prep & Play comes first, then Hunt, then Collect (the owner's order).

### The owner's rulings for the series (24 Sept, this session)

- Art: official and card art are welcome, "Hot-Linked Card Art, Bold";
  "We should not be making our own images from scratch". Applied at the
  art take with the record corrected first (landmines 26, 28), not here.
- The three palettes stay: "I like the different themes for different
  modes." Uniformity is the complaint, not colour.
- Priority: Prep & Play, then Hunt, then Collect, then overall
  uniformity. The Fold's inner layout: "not really a priority" (later).
- D17: **Collection** replaces Portfolio (applied at the voice take).
  A37: the same gear to More on every main screen, in all three modes.
- The pick from the preview page (three headers mocked in the app's own
  fonts and palettes): C on Decks (the Leader's art blurred behind the
  crisp card, the title in A's slot), A's art banner on Sealed, A's
  compact bar with a back arrow one level down, no banner on Collect's
  Home ("that art is going to look bad, weird, stretched"), and the blur
  always the colour of the card being looked at.

### Measured first

- **This VM cannot ingest:** `tcgcsv.com` answers "Tunnel connection
  failed: 403" (PROVEN, `pipeline.py ingest`). The release assets host
  answers, and the take-104 APK carries the built `www/`; for this
  session's local runs that `www/` is the catalogue (7,661 printings) and
  `src/app.html` is assembled over it the way `build_app.py` does. Every
  local number below is on that catalogue; **the runner's `check` (a full
  fresh ingest) is the seal.** Baseline on untouched take-104 code: smoke
  697/697; render 104/106 in Chrome — the CDN thumbnail (every VM), and
  the Hunt knob measured at 350 ms while the Sealed repaint was still
  holding its 220 ms slide (MEASURED: at 600 ms it sits 1 px off centre).
- **An audit of the app** (four read-throughs, line numbers in
  `docs/UI-AUDIT.md`): 28 font sizes from 9 to 46 px, 25 rules under
  12 px, 14 radii, 299 inline styles, about 20 raw colours beside the
  tokens; no shared header (13 screens use the tab style, 7 open with
  something else); emoji mixed with the glyph set; no pressed or disabled
  state anywhere; 44 px missed by the Play steppers (34), deck +/- (28)
  and the search-bar buttons (about 15 x 22).
- **Contrast, computed per palette (WCAG):** Prep & Play's accent
  `#E0553D` is 4.25:1 on its card and 3.79 on card2 — it colours 16 px
  panel titles, links and chips; its knob label `#F1EFE6` on the accent
  is 3.29 and its nav label 3.25; `--brass2` as text (the Portfolio
  caption, 11 px) is 2.68 to 4.40 by mode; Collect's `--dim2` on card2 is
  4.07. Everything else clears 4.5.
- **Two icons draw nothing:** the skull left the sprite at take 63 (the
  owner's ask), but the empty collection (`G('roger', 64)`) and the
  Banish keyword (`KW_GLYPH`) build that id at runtime; smoke's take-63
  check greps for the literal and passes (landmine 142).
- The deck chart is brass in red mode (both canvases hard-code Collect's
  colours); `.range` is defined twice and the filter sheet's price inputs
  inherit 14 px (landmine 119's zoom); the toast (z 50) is hidden under
  the tour and the curtains (z 60); `.empty::before` stacks an invisible
  64 px block over every empty state; the splash's glow and text follow
  the mode while its ground is Collect's.

### This take changes

- `:root` carries the tokens every later take uses: type roles
  (`--fs-*`, 12 to 44), spacing (`--sp-*`, 4 to 32), radii, icon and
  thumbnail sizes, motion durations and a z scale; and semantic colours
  per palette — `--on-accent`, `--accent-ink` (the accent as text:
  Collect and Hunt keep their brass; Prep & Play `#E5705C`, 5.22 on its
  card, 4.66 on card2; the red fill stays `#E0553D`), `--line-strong`,
  `--accent-bg`, `--warn-bg`, `--ok-bg`, `--bad-bg`, `--scrim`. Collect's
  `--dim2` moves to `#9D8E74` (4.58 on card2).
- Accent text reads `--accent-ink`; fills and borders keep the accent.
  The knob's label is `--on-accent` in every mode. Captions stop using
  `--brass2`. No text is under 12 px. The raw colours become tokens and
  follow the mode; the charts read the palette from the page.
- The slider's buttons are equal thirds under the knob; `.range` is one
  rule (the price inputs are 16 px again); the toast sits above the
  curtains; the ghost block is gone; the splash is wholly Collect's.
- The empty collection shows the scan card it tells you to use; Banish
  borrows no missing glyph.
- Guards, each watched to fail on the take-104 build first: every glyph
  a call names exists in the sprite; no font size under 12 px in the
  shipped app; the contrast check covers `--accent-ink`, `--on-accent`
  and card2; the knob check waits for the slide to end.

### Built

- `src/app.html`: the tokens in `:root` and per palette as planned;
  every accent used as text or icon reads `--accent-ink` (headings,
  panel titles, links, chips, badges, the nav's active item, the
  steppers' glyphs, the total), fills and focus keep `--brass`; the
  knob's and the primary buttons' label is `--on-accent`; 25 CSS rules
  and 8 inline sizes under 12 px are at 12 or a `--fs-*` token (the
  picture labels are `max(12, w/4)`); 20 raw colours are tokens or
  palette mixes (the selected tint, the warnings, legal/illegal, the
  scrims, the neutral surfaces, the tracks); Prep & Play's `--brass2`
  moves to `#B64731` (3.02:1 on its card; the selected chip's edge was
  2.41); form fields take `--line-strong`; the deck curve's bars are a
  tint of the accent; `TOK()` hands a canvas the page's palette and both
  charts use it (Collect's literals when there is no browser); the
  slider is a grid of three equal columns as wide as its widest label,
  one rule, labels that never wrap; `.frange` is the filter's price row
  at 16 px; the toast sits at z 70 over the curtains (60); the ghost
  block is gone; the splash's glow and text are literals; one
  reduced-motion rule for every transition, and the tour's scroll
  honours it; the empty collection draws `g-scancard`; `KW_GLYPH` names
  no glyph for Banish.
- Fields: every text field's edge is `--line-strong` in the one field
  rule (a second rule placed after the focus rule would have outranked
  the brass focus edge, found on re-reading the diff); the filter's price
  boxes get their own focus rule (the take-104 `.range input` rule had
  the same order problem); the ask sheet's text box drops its inline
  border and colours for the field rule and moves from 13.5 to 16 px
  (landmine 119's zoom); the search pills take `--line-strong` too.
- `tools/smoke.mjs`: three take-60-to-86 assertions follow the tokens
  (headings, the caption, the nav) with the same intent; a take-106
  section of 36: every glyph a call names resolves in the sprite, and
  every computed name comes from a form the check reads; no font size
  under 12 px in the CSS, the markup or the templates; the type scale;
  per palette the accent as text on card and card2, the label on the
  accent, the text tokens on card2, the selected text on its tint, a
  control's edge at 3:1; the slider, the price row, the toast, the
  ghost block, reduced motion, the charts, the splash, the empty
  collection's picture. `tools/render.mjs`: the Hunt knob is measured
  after its slide ends (`transitionend`, 2 s cap), landmine 143.
  `tools/look/steps.mjs`: take 106's seven steps.

### Tests (local, on the take-104 release catalogue; the runner's `check` is the seal)

- Smoke 733/733 (36 new). **Watched to fail first:** the same smoke
  run over the take-104 source assembled on the same catalogue fails
  32 — 29 of the new take-106 assertions (only their synthetic
  controls pass) and the three older ones rewritten to the tokens.
- Render 105/106 in Chrome — the CDN thumbnail, as on every VM. The
  knob check passes where it failed on untouched take-104 code, and
  still fails (offset -101 px) when the Hunt knob is moved one column
  in the built page: the control for the timing fix.
- **The look, take 106: 7 of 7 at both viewports**, every PNG read:
  Prep & Play's rules title in `#E5705C` and its knob label `#1A1408`,
  the knob centred (offset 0); a copy of a ready-made deck, its curve
  bars a visible tint of the red and its value chart drawn in red;
  Sealed's selected chip gold on Hunt's own tint, the knob 1 px off
  centre; the empty collection's scan card; the filter's price boxes at
  16 px; OP01's checklist, smallest text 12 px; Home's nav and caption
  at 12 px, the caption in `--dim`.

### What I got wrong, and the look caught

- Equal flex thirds squeezed "Prep & Play" (106 px of text into 99)
  onto two lines inside the knob, in every mode. Smoke passed; only the
  pictures showed it. The fix is the grid, sized by the widest label;
  the assertion now pins the grid and the no-wrap.
- The first look step for the empty collection pictured the knob in
  mid-slide, the same trap as landmine 143; the step now waits for the
  slide to end.
- The plan said the missing skull glyph would be added back. The sprite
  lost it at the owner's ask (take 63), so the calls moved instead.
- Seen and left for the header take: Home's "Got it" wraps to two
  lines beside the long release note; a blanket no-wrap on buttons
  would push Play's sentence-long labels off the screen, which the
  voice take shortens first.

### Ruled out

- Putting the skull back: the owner removed it at take 63.
- Changing a palette's character, or the fonts (D16 open).
- Headers, icons, art and copy in this take: they are the next four,
  and the header waits on nothing now that the owner has picked.

### DEFERRED this cycle

- One header on every screen with back and the More gear (U2); the art
  layer with the record's art policy corrected first (U3); the voice,
  D17 applied (U4); polish (U5). `deckCover`'s 7 px name inside its SVG
  goes with the covers at U3 (the Leader's art replaces the drawing).
- The Fold's inner layout (the owner: later).

## Take 105 — 2026-09-24 — the Fold's first run of the shrunk build: A14 PROVEN; Back from a card on a fresh launch minimized the app (the boot never pushed Home); the notifications permission came back undefined (R8 stripped the plugin's permission annotation); the guide's flag came back with the restored data

Opened before any code (PROTOCOL §6). The owner installed take 104 on
the Fold (Android 16, SM-F966U1, "a fresh install") and pasted
Diagnostics at 02:30 UTC with two notes: "major regression in back
button" — open the app, tap a card under Collect from the top-value or
set-completion rows, press Back, "the app minimizes then reopens"; it
"did start to work properly" after closing and reopening a few times —
and "the tutorial didn't popup for me".

### Measured first (his report, read line by line)

- **A14 PROVEN on the Fold:** `PASS OCR reads a code the app drew (ML
  Kit) — read "OP01-016"` on the R8 + Latin-only build; camera 1; Backup
  round-trip, Share, Ads (Google test units), Sync — 16 of 17 PASS, 0
  skipped. `native: true`, six plugins.
- **The one FAIL:** `Notifications permission — Cannot read properties of
  undefined (reading 'display')`. Capacitor's `Plugin.checkPermissions`
  resolves with *no data* when `getPermissionStates()` is empty (its own
  comment: "if no permissions are defined on the plugin, resolve
  undefined"), and that map is built from the plugin class's
  `@CapacitorPlugin(permissions = [@Permission(strings = [POST_NOTIFICATIONS],
  alias = "display")])`. The take-104 mapping (a Release asset, read on
  this VM): `com.getcapacitor.annotation.Permission -> w2.c`,
  `CapacitorPlugin -> w2.b` — R8 renamed the annotation classes, so
  nothing kept them; R8 drops annotation instances whose annotation
  class is not kept, and the plugin classes still register because
  Capacitor's own keep rule names `@CapacitorPlugin` on them, while the
  nested `@Permission` values go. INFERRED from the mapping and the
  source; the Fold's next self-test is the proof. **Consequence on takes
  103 and 104:** `notifyPermission()` catches the TypeError and returns
  `denied`, so every reminder toasts "notifications are off" and falls
  back to an in-app note. A real regression the size take introduced and
  the phone's self-test caught — exactly what it is for.
- **Back, the cause:** the report's stack line begins `detail > home > …`.
  On a fresh launch in Collect, `boot()` calls `MODE.set(cur, false)` and
  skips `go('home')` for Collect (take 81's guard against Hunt reopening
  on Collect's Home), so Home is never on the stack; opening a card
  pushes `detail` alone; the hardware Back finds nothing below,
  `NAV.back()` returns false and the handler calls `APP.minimizeApp()`.
  "It started working" once a tab or mode tap had pushed Home. Every
  back test in smoke and the look seeded `V.go('home')` first (ten
  places), so the harness never met an empty stack — landmine 140. The
  "reopens" after the minimize is not in the code (Android 16's
  predictive-back peek is the likely picture); the minimize is, and the
  fix removes it.
- **The guide:** the "fresh install" came back with the zip (48329), 71
  collection items and 44 Hunt runs — Android restored the app's data
  with the reinstall (`allowBackup`, and by rule 5 the collection is
  meant to survive), and the guide's seen-flag came back with it. Not a
  defect; "Show the guide again" is on More. **Ruled out:** turning
  backup off (rule 5); showing the guide on every install regardless
  (APEX A129: an extra tap beats a first-timer with no explanation, but
  a returning collector with his data is not a first-timer).
- **LIVE ON GOOGLE PLAY (24 Sept, 02:42 UTC report):** the owner: "I'm
  finally approved on Google play and it's listed!" —
  `play.google.com/store/apps/details?id=com.optcghub.app`. He installed
  from Play (take 101's bundle, the production release) and saw the guide
  on the first open — a Play install is a fresh data state. Its
  Diagnostics: 17 pass, 0 fail, 0 skipped; `catalogue copy: synced on
  this phone` (the take-101 app pulled the take-104 bundle from Pages,
  build stamp 02:14:32Z, so the pictures line and the 12 history days
  are current while the effects line still reads `2187/7697` — the
  take-104 wording lives in the app, not the bundle).
- **Landmine 141 MEASURED by contrast, same phone, same hour:** the Play
  install of take 101 (built before R8) reads `PASS Notifications
  permission — display: prompt`; the sideloaded take 104 (R8) read the
  undefined answer twelve minutes earlier. The attribution to the shrink
  is no longer inferred.
- **The proof path changes with the launch:** the phone now carries the
  Play build, which the sideload key cannot install over (landmine 34).
  Take 105 is proven on the Fold either through the production track
  (upload `optcghub-take-105.aab`, the owner's step under RUNBOOK-play's
  per-take section) or by export → uninstall → sideload → import. The
  Play route is the one that matters now.
- **The cover viewport, MEASURED:** 411×960 @2.625 (the take-98 ask,
  answered by the report's device block); the inner screen stays
  INFERRED until a report from the open phone.
- **Ruled out:** a Capacitor or Android-16 back-handling fault — the App
  plugin's `OnBackPressedCallback` survived R8 (its `handleOnBackPressed`
  is in the mapping) and fires the JS listener; the minimize is the
  app's own `minimizeApp()` on an empty stack.

### Built

- `src/app.html`: `boot()` pushes the mode's home for every mode
  (`go(MODE.home[cur])`, which is what take 81's guard was reaching for);
  `NAV.back()` with one entry that is not the mode's home goes home and
  returns true — the app minimizes only from Home; `notifyPermission()`
  returns `unknown` when the plugin answers without a state and still
  asks; the reminder toasts on `unknown` say the reminder is set and to
  check the phone's notification settings if none arrives; the self-test's
  Notifications line names an empty answer instead of throwing.
- `ci/shrink.py` v2: keeps Capacitor's annotation classes and the whole
  Capacitor and plugin layer unshrunk and unrenamed (the bulk of the dex
  was play-services, ML Kit and AndroidX, which keep their own rules);
  `check_mapping()` refuses a release mapping that renamed
  `com.getcapacitor.annotation.Permission` — watched to fail against the
  real take-104 mapping; `ci/apk.sh` runs it on the build's mapping.
- `tools/look/steps.mjs`: `VIEWPORTS.cover` measured; take-105 steps: a
  fresh open, a card from Home's top-value row, the back handler's
  sequence → Home and no minimize, pictured.
- `tools/smoke.mjs`: the fresh-boot stack holds Home; back from a lone
  `detail` goes home; back from a lone Home returns false (that is the
  minimize); `notifyPermission` on an undefined answer; the mapping check
  on a renamed and on a kept line.
- Tests: smoke 706 (9 new, four of them watched to fail on the take-104
  build — the fresh-boot stack empty, the lone card's Back unhandled
  `back=false top=detail`, `notifyPermission` answering `denied` with no
  ask, no `unknown` toast); shrink.py 15 controls (+4: a renamed
  annotation refused, a kept one passes, a stripped one refused, and the
  REAL take-104 mapping refused — watched to fail with a NameError before
  `check_mapping` existed); render 105 of 106 in local Chrome; local
  smoke's two history assertions fail on the sidecar mismatch, the
  runner's check counts. Two harness things found on the way: the stub
  defined `scrollTo` only in later sections, so a boot that navigates
  crashed it (defined from the start now — a browser always has it);
  the take-81 assertion pinned the old boot line as a source regex and
  was rewritten to pin the new push and refuse the old guard.
- **The look, take 105 (4 of 4 at both viewports, the cover now 411×960
  @2.625 as measured, the PNGs to the owner):** a fresh open has Home on
  the stack (`boot: home`); a card from Home's top-value row, then
  history Back — the same handler as the phone's button — lands on Home
  with no error record. The take-98 step seeded `V.go('home')` first;
  this one does not, on purpose.

### DEFERRED this cycle

- The "reopens" after the minimize: named, not reproduced here; the fix
  removes the minimize, and the owner's next Back is the proof.
- The Fold's self-test on take 105: Notifications permission PASS is the
  proof of the keep rules (the pin, the OCR line and the rest stay).
- D11 the day the unit IDs arrive; A41 his list; A32 a new session.

## Take 104 — 2026-09-24 — three fixes from the owner's own Diagnostics run: a browser without a camera skips with its reason, the effects line says what it counts, the size table keeps the R8 map out of the bundle's raw total

Opened before any code (PROTOCOL §6). Take 103 merged 01:20 UTC and
Release take-103 published 01:28 with three assets (the post-merge note
under take 103 carries the numbers). The owner did not install; he ran
the Pages build on his PC (`#diag`, 01:32 UTC, take 103, `native:
false`, `plugins: none`) and pasted the report. **UI design and
refinement now belong to a separate UI/UX session (the owner, 24 Sept):
this session changes UI only when something is broken or off course.**
The three fixes are his ask, verbatim: "Go, take 104 with those three
fixes."

### Measured first (his report, read line by line)

- The web build of take 103 deployed (build stamp 01:21:34Z); catalogue
  6,987 cards / 7,661 printings; prices dated 23 Sept; 12 history days;
  sync answering (manifest 200); every Hunt feed 200; no errors.
- Self-test 11 pass, 1 fail, 5 skipped. The FAIL: "Camera reachable — 0
  camera(s) listed" on a Windows PC with no webcam. The check returns
  `ok: devices.length > 0` whatever the platform, so a desktop without a
  camera reads as a failure of the app. On the phone that verdict is
  right; in a browser with no camera the honest line is SKIP with the
  reason. The five SKIPs are the native plugins, as expected of a browser.
- `effects scripted: 2187/7697` (Diagnostics) beside `1926 cards
  scripted` (the self-test): the first counts effect lines (the
  manifest's `effects.scripted` / `effects.lines`), the second cards with
  any scripted effect (`Object.keys(CAT.effects).length`). Both right,
  neither says its unit, and 7697 sits beside 7661 printings as if it
  were the same thing.
- `pictures: 221 cards and 23 sealed products have no picture at the first
  host; 1 served by the second, 1 shipped that way` — the A41 count, now
  on a line the owner can read; his list of where in the app is still what
  A41 needs.
- His viewport was 1920×991 @1, a desktop; the look covers the Fold's two.
  Nothing in the report shows a UI problem.
- From take 103's release table: `shipped.py` printed the bundle as 90.5
  MB raw with a 52.8 MB "other" group — `BUNDLE-METADATA/…/proguard.map`,
  the R8 map Play reads for crash reports and never installs. A raw total
  that counts it is wrong by a factor of two.
- **What his run cannot prove:** R8 and the Latin-only model live in the
  APK; the ML Kit line skipped. A14 stays BUILT + MEASURED until the
  take-103 (or later) APK's self-test passes on the Fold.
- **Ruled out:** softening the camera line everywhere (on a phone, no
  camera is a real failure); counting cards instead of lines on the
  Diagnostics line (the lines are the honest denominator for "how much
  of the game is scripted"; the cards are added, not substituted).

### Built

- `src/app.html`: `cameraVerdict(devices, native)` lifted out of the
  self-test (landmine 135's rule: a named function the stub can call):
  no camera and not native → SKIP "no camera listed on this device — the
  scanner needs one"; no camera on the phone → FAIL; a camera → PASS
  with the count. The self-test's `check` learns a `skip` result with
  its own note (before, only `null` skipped, always as "not available
  here"). `effectsLine(effects, cards)` → "2187 of 7697 effect lines
  (1926 cards)"; the Diagnostics line uses it.
- `tools/shipped.py`: a `BUNDLE-METADATA` group ("the R8 map Play reads;
  never installed"); the bundle's raw total excludes it and says so; a
  control plants a `proguard.map` and expects the group and the smaller
  total — watched to fail first.
- `tools/smoke.mjs` take-104 section: the three camera verdicts, the
  skip result through the self-test's own `check`, the effects line's
  text, the Diagnostics line calling it. `tools/look/steps.mjs`
  `take104`: Diagnostics opened in real Chromium (no camera there), the
  self-test run, the camera line and the effects line read off the
  screen and pictured for the owner.
- The record: A14's proof line; the UI/UX session rule in the AGENDA's
  priorities, the NSP and the root session file.
- Tests: smoke 697 (6 new, watched to fail on the take-103 build — the
  stub reproduced the owner's line, `FAIL "0 camera(s) listed"`, before
  the fix); shipped.py 8 controls (+2, watched to fail: the second
  crashed with a NameError before `installed_raw` existed, which is a
  failure, not a pass); the take-103 bundle now reads "37.9 MB raw …;
  the R8 map (52.7 MB raw) left out of that"; render 105 of 106 in local
  Chrome (the CDN thumbnail, as before); local smoke's two history
  assertions fail on the sidecar mismatch (the root session file's
  note), the runner's check counts.
- **The look, take 104 (4 of 4 at both viewports, the PNGs to the
  owner):** the first camera step clicked `#stRun` and timed out — the
  Run button lives on More's self-test panel, not on the Diagnostics
  screen — so the step took the owner's own route instead: the
  Diagnostics report, which runs the self-test and prints it. In real
  headless Chromium the line reads `SKIP Camera reachable — no camera
  listed on this device — the scanner needs one`; the effects line reads
  `2186 of 7694 effect lines (1925 cards)` (the VM's cached 22 Sept
  catalogue; the owner's 23 Sept numbers were 2187/7697 and 1926).

### Merged — run 53 green, Release take-104 published (post-merge note, rides the next PR)

The owner's "go" on the four pictures at 02:01 UTC; PR #28 marked ready
on a head verified green from its log (697 smoke, 106 render in Chrome,
GATE PASSED); merged 02:13; run 53's `apk` job 02:15–02:19; Release
take-104 published 02:19:52 with three assets. MEASURED from the log:
APK 26.4 MB file, AAB 19.6 MB, the mapping 52.7 MB — identical to take
103, as a text-only app change should be. The size table's fix is in
that log for the first time: the bundle reads "37.9 MB raw, both ABIs —
a phone installs one; the R8 map (52.7 MB raw) left out of that", with
`BUNDLE-METADATA (the R8 map Play reads; never installed)` as its own
group instead of a 52.8 MB "other". A14 still waits on the Fold.

### DEFERRED this cycle

- A14 PROVEN: the Fold's self-test on an installed APK (the owner's).
- D11 the day the unit IDs arrive; A41 his list; A32 a new session.
- The 32-bit ABI and the gzipped catalogue: listed in A14, unpicked.

## Take 103 — 2026-09-24 — optimize: R8 shrinks the code, only the Latin OCR model ships, the mapping rides the Release, the upload key's fingerprint pinned

Opened before any code (PROTOCOL §6). Take 102 merged 01:05 UTC by the
owner (PR #26; its check verified from the log, not the badge: 691 smoke,
106 render in Chrome, GATE PASSED, the pipeline 70 s on a warm cache).
The owner: "mark it ready when green — then start take 103." The build on
`main` for take 102 runs as this is written; its `apk` job prints the
upload key's SHA-256 for the first time, and its size table is this
take's *before*. The take-102 PR body came back with a vendor footer the
posting tool appends on its own; it was edited off after the merge. The
owner's rule stands: no vendor trailer on a commit or a PR.

### Measured first

- **From Release take-100's files** (the Android side is unchanged through
  102): the non-Latin OCR models are 3.81 MB raw / 2.39 MB packed (Hani
  1.00, Jpan 0.96, Kore 0.87, Deva 0.49, Beng 0.49 with their label maps);
  Latin 0.35 MB; the shared detector, layout and script-id models about
  1.2 MB; dex 23.0 MB raw / 8.7 packed in three files; the OCR engine
  11.1 + 6.8 MB is one library for every script, so no saving there.
- **The plugin** (`@capacitor-mlkit/text-recognition` 8.2) declares the
  five `com.google.mlkit:text-recognition*` artifacts as `implementation`
  and its Java imports the four non-Latin option classes inside a switch
  on the script; the app asks for `LATIN` only (landmine 11). Capacitor's
  Android template ships `minifyEnabled false` with an empty rules file;
  Capacitor core carries consumer keep rules for every plugin class and
  AGP's defaults keep `@JavascriptInterface`; none of the eight plugins
  carries consumer rules of its own.
- **Run 51 (the take-102 build on `main`, 01:05–01:12 UTC)** published
  Release take-102 with both assets and printed, for the first time, `AAB
  signer SHA256: 32:8E:60:A5:CE:9C:A9:93:97:25:EE:61:D7:11:F9:2A:1C:D6:A0:
  C4:00:0C:71:09:E4:32:F9:DD:C6:F3:28:95` under the upload DN — the pin.
  Its size table is this take's *before*, identical to take 100's: APK
  34.9 MB file / 58.0 raw; AAB 23.8 / 59.1; dex 23.0 raw / 8.7 packed;
  the OCR models 5.5 raw / 3.7 packed (APK) and 3.5 (AAB); res 2.8 raw
  (APK), 3.6 (AAB). A stray `18` printed after the table (a count the
  group echoes on its own line) — read, harmless, cleaned here.
- **This VM** has Gradle and Java but no Android SDK and no route to
  Maven: the shrunk build is proven on the runner only, on the merge. A
  red `apk` job on `main` is this take's known risk; the `-dontwarn` rules
  pre-empt the one failure R8 is known to raise here (the four option
  classes the plugin references and the build no longer carries).
- **Ruled out:** `aaptOptions` / `packagingOptions` for the model assets
  (they scope Java resources and the app's own assets, not a library's —
  the dependency exclude drops the AARs and their assets together);
  patching the plugin's sources under `node_modules`; a `-printusage`
  rule (AGP already writes `usage.txt`, `mapping.txt` and `seeds.txt`
  beside the release outputs when R8 runs); pinning the fingerprint from
  anything but run N's printed line; the 32-bit ABI and the gzipped
  catalogue (listed in A14, unpicked by the owner).

### Built

- `ci/shrink.py` (new) — the patch and its controls in the tree, not a
  heredoc run by hand (the take-102 lesson): an `OPTCGHUB-SHRINK v1`
  block (versioned and replaced, not skipped — landmine A-211) sets the
  release build type to `minifyEnabled true`, `shrinkResources true` and
  the optimize defaults; a top-level `configurations.all` excludes the
  four non-Latin ML Kit modules; `proguard-rules.pro` gets `-dontwarn` for
  the four option packages the plugin still names; every step asserts it
  landed. `--selftest`, which the gate runs: against a fixture of the
  template's release block and against Capacitor's own template tarball
  when `node_modules` has it — flips the build type, places the block
  before `android {`, a second run changes nothing, four rules once; and
  a control: a `build.gradle` with no release block is refused. Watched
  against a patch that does nothing: every positive and the refusal
  control FAIL. Found on the way: a re-run grew a blank line each time
  until the removal consumed it (the "second run changes nothing" check
  caught it).
- `ci/apk.sh`: runs `ci/shrink.py android/app`; after the build the APK is
  refused if any non-Latin model entry remains or the Latin one is
  missing; refused if R8 left no mapping; `mapping.txt` is copied to
  `optcghub-take-N-mapping.txt` and output for the Release; the usage
  file's line count is printed; the what-shipped group's bare count is
  labelled.
- `ci/build.yml` and its twin: the mapping is a Release asset — Play's
  crash reports de-obfuscate with it and nothing else.
- `ci/signer.sh`: `UPLOAD_SHA256` pinned from the take-102 build's printed
  line; `fingerprint_ok` refuses a bundle whose signer carries the upload
  DN but another fingerprint (a regenerated key would be refused by Play
  and burn the versionCode — landmine 33); two controls watched to fail
  first.
- The record: A14 to take 103; A21's fingerprint row; V1-STATE's sizes
  line points at the take-103 build log for the *after*.
- Tests: signer.sh 10 controls (the pinned fingerprint passes; the upload
  DN with another fingerprint and an empty line are refused — the
  positive arm watched to fail with the pin pending); the shrink patch
  run twice against a copy of Capacitor's own template (one block, one
  rules block, `minifyEnabled true`); gate 12 probes; render 105 of 106
  in local Chrome (the CDN thumbnail, as at 102). **Local smoke 689 of
  691:** after the branch reset onto `main`, the sidecar carries the
  nightly's 23 Sept day while this VM's catalogue is the cached 22 Sept
  ingest (TCGCSV is refused here), so the two history assertions — the
  days end on the source date, the last point equals today's deck value
  — compare two different days. Not a defect: the runner ingests fresh
  and its check is the seal (691 at take 102's check). Noted in the root
  session file so the next session does not chase it. No app change, so
  no look; the proof is the Fold's.

### Merged — run 52 built the shrunk release green on the first try (post-merge note, rides the next PR)

PR #27 merged 01:20 UTC by the owner (the check verified from its log:
691 smoke, 106 render in Chrome, GATE PASSED). Run 52 on `main`: the
`apk` job 01:22–01:28, Release take-103 published 01:28:21 with three
assets. The R8 build needed no rule beyond the four `-dontwarn` lines.
**MEASURED, from the log's table and again from the released files on
this VM (identical):**

| | take 102 | take 103 | |
|---|---|---|---|
| APK file (the download) | 34.9 MB | **26.4 MB** | −24% |
| APK raw (what the phone reports installed) | 58.0 MB | **36.9 MB** | −36% |
| AAB file (the upload) | 23.8 MB | **19.6 MB** | −18% |
| dex | 23.0 raw / 8.7 packed, 3 files | **6.4 / 3.0, 1 file** | −72% raw |
| OCR models | 5.5 raw / 3.7 packed, 66 files | **1.5 / 1.3, 26 files** | the four scripts gone |
| res | 2.8 raw, 943 files | 2.3 raw, 660 files | shrinkResources |
| OCR engine (.so) | 11.1 + 6.8 | 11.1 + 6.8 | unchanged, as predicted |

The readback held on the real artifact: non-Latin model entries 0, Latin
entries 4 (measured here on the released APK as well); the mapping
present. The pinned fingerprint passed on a real bundle for the first
time (`AAB signer SHA256: 32:8E:…:28:95`, run 52) — the positive arm is
now PROVEN in CI, not only in the control. Play's AAB carries the same
map inside `BUNDLE-METADATA/com.android.tools.build.obfuscation/
proguard.map` (52.7 MB raw, 4.0 packed), which is what Play reads for
crash reports; the Release asset `optcghub-take-103-mapping.txt` is the
same map for a sideload crash. That map is why `shipped.py` now prints
the bundle as "90.5 MB raw" with a 52.8 MB "other" group: the metadata
is never installed and should sit in its own group outside the raw
total — a `shipped.py` fix for take 104, recorded in DEFERRED.
**PROVEN on the Fold: pending** — the self-test's ML Kit line on take
103 is the proof; until it passes, A14 stays BUILT + MEASURED.

### The proof, on the Fold (the owner's)

Install take 103's APK (export first if the phone is on a Play build —
landmine 34). More → About, five taps → Diagnostics → self-test: every
line PASS, "OCR reads a code the app drew (ML Kit)" included; one real
scan; the rewarded ad (Google's test unit) shows; a reminder notification
fires; Share; Export, then Import. Send the self-test text. The `apk`
job's size table beside take 102's is the measurement; the Fold is the
proof.

### DEFERRED this cycle

- D11 the day the owner sends the two unit IDs; A41 his list; the 32-bit
  ABI and the gzipped catalogue stay listed in A14; A32 a new session.
- `tools/shipped.py`: a group for `BUNDLE-METADATA/` (the R8 map Play
  reads, never installed) kept out of the bundle's raw total, with a
  control — take 104.

## Take 102 — 2026-09-24 — harden, clean up, tie up: the take-101 review's thirteen findings, the record moved to production, a CLAUDE.md

Opened before any code (PROTOCOL §6). Take 101 merged 17:39 UTC on the
23rd; Release take-101 landed 17:46. **The owner uploaded take 101 to the
closed track and Play approved the app for production** ("any day now
we'll be live"); he asked to harden, clean up and optimize what exists
and tie up the open items, ran `/code-review` on take 101 (two passes,
thirteen distinct findings, every one real and small), and asked for a
CLAUDE.md built through the `claude-md-improver` skill from AGENTS.md
and the project's history. His two answers to the plan: the production
release is created now from take 101's bundle, the real AdMob rewarded
unit IDs (D11) ride the take after he sends them; the CLAUDE.md imports
AGENTS.md and adds only the session notes.

### Measured first

- **The accepted upload of take 101 closes the oldest Play unknown:** Play
  took an upload-key-signed bundle (the build log's `AAB signer: CN=OP
  TCG Hub upload`), so the sideload key was never the registered upload
  key. A21 rows 3–4, the take-101 entry's "risk on paper" and the
  optional fingerprint check are closed PROVEN.
- **After the container restart (read-only probes):** `registry.npmjs.org`
  and `pypi.org` answer 200 (they are on the proxy's direct list), so
  `ci/deps.sh` can install puppeteer, acorn and pillow here — the Chrome
  render and the gate's receipt reachable in the session for the first
  time since take 89. Every other host is still refused (TCGplayer and
  its two image hosts, TCGCSV, Southern Hobby, GTS): the hash step's
  canary would refuse a full local pipeline, so the local run is
  `app smoke render` and the gate; A32 still needs a new session.
- Issue #12 (the 22 Sept scheduled nightly, red on the image guard: 20 of
  77 new images failed) was closed by the owner 00:46 on the 23rd; every
  main build since is green.
- **The review's findings, consolidated:** (1) the AAB signer guard was
  negative-only — any third key passed; (2) RUNBOOK-play §2's reset
  conflated a lost key folder with a wrongly registered key, and its
  keytool line was a placeholder; (3) the "unreadable" arm's control was
  run by hand, not kept in the tree; (4) three docs commits landed after
  the merge with no rule saying where such notes go; (5) the AGENDA still
  told the owner to upload take 100 and carried the UNKNOWN the upload
  answered; (6) `shipped.py`'s native pattern was unanchored; (7) its
  "download" was the entry sum, not the file, and "installed" was printed
  for a bundle; (8) the size table could fail a release; (9) the readback
  read `*.RSA` only; (10) V1-STATE's H1 said take 100 under a take-101
  stamp, the take-101 title said one guard, RELEASE overstated, and
  apk.sh printed "sideload APK limited" under a corrected comment; (11)
  an open ZipFile and a leaked temp dir; (12) the gate dropped a
  selftest's stderr; (13) zero arguments to shipped.py passed silently.
- **A fourteenth, found while doing the twelfth — mine, and the largest
  (landmine 139):** the gate's own negative controls had proved nothing
  since take 35. The probe copied `docs/`, `tools/`, `www/` and `ci/`
  into a temp tree and called a guard proven when any failure appeared;
  `check_secrets` ran in that copy too, found neither the keystore nor the
  star template, and every copy failed before the mutation was read.
  Found because the new heading probe "fired" before its check existed;
  my first explanation (the copied docs were stamped a take behind) was
  wrong and only partial — after the stamp, the probe still fired, and
  listing every failure in the copy showed why. Two probes were dead
  underneath it: the stale-stamp probe replaced the literal `take 2.*`,
  which no stamp has carried since take 2. Landmine 54 applied to the
  controls themselves; the fix is the control of the controls.
- **Ruled out:** pinning the upload key's fingerprint blind (printed
  first this take, pinned next); a CLAUDE.md that copies AGENTS.md
  (landmine 88's stale copy); a size change here (103's, on the Fold);
  A32 from this session.

### Built

- `ci/signer.sh` (new): the bundle readback and its classification as
  functions — `read_signer` over `*.RSA`, `*.DSA` and `*.EC` with the
  certificate's SHA-256, `classify_signer` → `upload` only for the DN
  `tools/play-key.sh` writes, else `sideload`, `unreadable` or `other` —
  and `--selftest` with the controls the gate now runs: no signature
  block → unreadable; a zip signed with the committed sideload keystore
  → sideload; the upload DN → upload; a debug DN → other.
- `ci/apk.sh`: sources it; anything but `upload` fails the build and the
  fingerprint is printed for the record; the size table is a report
  (`::warning` on failure, never a red release); the print line says
  "APK and AAB".
- `tools/shipped.py`: the native pattern anchored (with a control), the
  file size as the download, "entries packed" for the sum, the raw label
  by extension, closed handles and a cleaned temp dir, `.get` in the
  checks, usage on zero arguments.
- `tools/gate.py`: selftest stderr travels with a failure (ten subprocess
  sites); V1-STATE's H1 checked against BUILD with a probe; `ci/signer.sh
  --selftest` in the block. **The self-test rebuilt** (landmine 139): the
  first probe is the unmutated copy, which must fire nothing; every probe
  names the failure category it expects and is refused, with the stray
  failures printed, if the copy fails outside it; the copy carries the
  keystore and the star template; the stale-stamp mutation is a pattern.
  Watched in order: the clean control failed on the old copy ("guard
  fires"), passed on the fixed one; the stamp probe then read GUARD DID
  NOT FIRE until its literal became a pattern; the heading probe read
  GUARD DID NOT FIRE until the check was written; the stray guard itself
  fired once for real when the gate cited landmine 139 before the ledger
  carried it.
- `tools/scrub.py`: the two literal file names — the root file the owner
  asked for by name and the skill that made it — pass as whole tokens
  only; the vendor word beside them, alone, or as a longer token still
  fires (three controls, the positive one watched to fail first). The
  root file is scanned as public text like AGENTS.md; its branch line
  lost the prefix the scrubber refuses.
- `docs/RUNBOOK-play.md`: §2's two reset cases, the keytool command in
  full; §8 approved; a production-release paragraph; the per-take
  section points at the production track.
- `docs/PROTOCOL.md` §6 and the NSP: notes written after a merge ride the
  next take's PR from the same branch.
- `CLAUDE.md` (root): `@AGENTS.md` plus the session notes, made through
  the skill the owner named; the record of what the skill advised and
  where AGENTS.md won is below.
- The record: A21 to production; V1-STATE's H1 and Play line; the
  take-101 title and RELEASE sentence; the AGENDA's dead line removed.
- `.gitignore`: `www/render-sim.png`, the render's second receipt (the
  sim view, written by `render.mjs` beside `render.png`), was never
  ignored and sat untracked after every local Chrome render; `www/` is
  never committed (nothing under it is tracked on main).
- Tests: smoke 691 (no app change); gate 12 probes with the clean control;
  signer.sh 7, shipped.py 6, scrub.py 9 controls; render 105/106 in Chrome
  on the session VM (the Leader thumbnail wants the CDN this VM is refused;
  106 on the runner is the number that counts); the gate PASSED locally on
  the local receipt. No app change, so no look. The runner's numbers: the
  PR's check.

### DEFERRED this cycle

- **Take 103 — optimize:** R8 and the non-Latin OCR models, proven on the
  Fold; the upload key's fingerprint pinned from the printed line.
- D11 the day the owner sends the two unit IDs; A41 his list; the look's
  "tiny bit of work"; the take-98 steps and Diagnostics lines; D7, D16.
- A32 Southern Hobby and the distributor timeline: a new session.

## Take 101 — 2026-09-23 — the Play upload of take 100: the bundle's signing verified from the build's own log, the record corrected, two guards

Opened before any code (PROTOCOL §6). Take 100 merged at 10:00:48 UTC
(PR #24, merge commit 1af6cb1, every commit included); **Release
take-100 published 10:07:40 with both assets** (APK 34.9 MB, AAB
23.8 MB) on build run 48's first try. The owner is installing it and
asked: *"is the aab good? … I want to get this version on google play
if the aab is good. The apk is over 30 MB, it's 56."*

### Measured first

- **The bundle is signed with the Play upload key — PROVEN by the
  runner's own readback.** Run 48's `apk` job printed `AAB signer:
  Owner: CN=OP TCG Hub upload, OU=play, O=OP TCG Hub` after
  `bundleRelease -Pupload=1`, and the file is `optcghub-take-100.aab`
  with no `DEVKEY-DO-NOT-UPLOAD` suffix (`ci/apk.sh` 289–301: the suffix
  and the dev key are the path taken only when the four
  `PLAY_UPLOAD_*` secrets are absent). So the secrets exist and have
  for some time; `docs/V1-STATE.md` still said the bundle was dev-signed
  "until the upload-key secrets exist" — stale, corrected this take.
- `versionCode` 100 (`VAULT_TAKE`), `versionName` 1.0.100,
  `compileSdk`/`targetSdk` 36 (`android/variables.gradle`, landmine 37),
  `applicationId com.optcghub.app`. Play's floor is met; the code is
  above the last upload (35).
- **The sizes, MEASURED from the release files themselves** (both
  downloaded from Release take-100 and broken down by component; raw =
  as installed, packed = as downloaded):

  | component | APK raw | APK packed | AAB packed |
  |---|---|---|---|
  | dex — the app, Capacitor, AdMob, Play services, ML Kit client (3 files) | 23.0 MB | 8.7 MB | 8.7 MB |
  | `libmlkit_google_ocr_pipeline.so` arm64-v8a — the scanner's OCR engine | 11.1 MB | 11.1 MB (stored) | 4.4 MB |
  | the same `.so` for armeabi-v7a (32-bit phones) | 6.8 MB | 6.8 MB | 3.5 MB |
  | `assets/public` — the app, `catalog.json` 5.07 MB, hunt files 2.7 MB, fonts | 8.6 MB | 1.8 MB | 1.8 MB |
  | ML Kit OCR models — Hani 0.89, Jpan 0.89, Kore 0.80, Deva 0.44, Beng 0.44, Latn 0.31, detectors | 5.5 MB | 3.7 MB | 3.5 MB |
  | res | 2.8 MB | 2.5 MB | 1.5 MB |
  | **total** | **58.0 MB** | **34.7 MB** | **23.6 MB** |

  **The owner's 56 MB is the unpacked APK (58.0 MB raw)** — Android
  installs the archive extracted and reports that; the 34.9 MB file is
  the same bytes compressed. **The bundle is smaller than the APK**
  because a bundle compresses the native libraries (11.1 → 4.4 MB)
  where an APK must store them, and Play serves each phone its own ABI:
  an arm64 phone downloads about 20 MB and installs about 51 MB. The
  levers, measured: R8 (dex 23 MB raw, typically halves; the riskiest —
  reflection in the plugins, each of which ships consumer ProGuard
  rules), the non-Latin OCR models (3.5 MB raw — A14's "~10 MB" was an
  estimate, this is the number), the 32-bit ABI in the sideload APK
  (6.8 MB), the catalogue gzipped (~4.4 MB installed). **The owner
  picked R8 and the non-Latin models for take 102**; the other two
  stay listed. The apk job now prints this table on every build
  (`tools/shipped.py`), so 102 is measured against a log line.
- **The owner on the upload key (13:5x UTC):** *"not sure we need to do
  this new cert work — I don't think that's an issue. I was more
  concerned with the file size differences."* So nothing is asked of him
  about keys; the reset steps written into RUNBOOK-play §2 stay as the
  reference the record had promised, and the fingerprint check is
  optional.
- **A risk on paper, UNKNOWN since take 35 and not the owner's concern:** which bundle registered
  the upload key at Play. If a DEVKEY bundle went first, Play expects
  the sideload key (`CN=OP TCG Hub, OU=sideload`, SHA-1
  `8A:17:C1:B9:8C:44:4F:AE:36:12:54:0E:1A:E5:95:92:45:5C:65:68`) and
  refuses take 100 as "wrong key". The owner settles it in Play
  Console → App signing → the upload key certificate's SHA-1: that
  fingerprint means a reset; any other means the upload key, and
  take 100 uploads cleanly. Optional, by his word — and **closed PROVEN
  at take 102: Play accepted the upload-key-signed take 101.**
- Landmine 34 applies to his own phone: the Play build cannot install
  over the sideload (same id, different signer) — export first.
- Two gaps the review found in `ci/apk.sh`: the signer readback passes
  when it is *unreadable* (only the sideload key fails it), and the
  comment at line 212 says `abiFilters` shapes the sideload APK only —
  it sits in `defaultConfig`, so the bundle is ARM-only too (phones
  unaffected; x86 excluded). `docs/RUNBOOK-play.md` §2 promised reset
  steps it did not contain, and its "wrong key" row named one cause of
  two.
- **Ruled out:** uploading the APK (Play takes bundles); changing the
  key or the id (A8); shrinking or trimming ML Kit here (a size change
  is its own measured take).

### Built

- `ci/apk.sh`: an unreadable AAB signer fails the build; the
  `abiFilters` comment tells the truth. Negative control: the readback
  against a zip with no signature block.
- `docs/V1-STATE.md`: the Play-bundle line reads the measured state.
- `docs/RUNBOOK-play.md`: §2 gains the upload-key reset steps; the
  "wrong key" row names both causes and the fingerprint check; "Every
  take after the first" carries the export-first line (landmine 34)
  and the nightly-rebuild note (landmine 33).
- `docs/AGENDA.md`: A21 addendum; the ".aab filename before
  production" item closed by the log line; A14 and R8 named as the size
  items.
- `tools/shipped.py`: the component breakdown of an APK or bundle (raw =
  installed, packed = downloaded, the biggest files), with controls the
  gate runs (`--selftest`: both dex spellings, a stored `.so`, the app's
  assets apart from the OCR models, the totals, and a stray name landing
  in `other` rather than vanishing). The apk job prints it for both
  artifacts in `what shipped`; the numbers above are its first run.
- No app change, so no look: nothing the collector sees moves.
- **The runner (check run 32, head b32f373, first run): green** — smoke,
  Chrome and the gate unchanged by a docs-and-guards take; shipped.py's
  controls ran inside the gate. The PR was marked ready without a look
  (no app change) and the owner told.
- **Merged 17:39:41 UTC (PR #25, merge commit fc5db93); Release take-101
  published 17:46:13 with both assets** (APK 34,894,938 B, AAB
  23,826,966 B) on build run 49's first try. The apk job's `what shipped`
  group printed, for the first time in CI, `AAB signer: Owner: CN=OP TCG
  Hub upload, OU=play, O=OP TCG Hub` and the breakdown for both artifacts
  — identical to the table above to the tenth of a megabyte (APK 34.7 MB
  packed / 58.0 raw; AAB 23.6 / 59.0). Take 102 is measured against that
  line.

### DEFERRED this cycle

- The owner's upload-key fingerprint and the upload itself (his).
- A14 and R8 (size); A41 (the owner's list); Southern Hobby (a new
  session with the opened domain list); the take-98 report's answers
  from the take-100 install; tonight's nightly writes the 23 missing
  sealed ids (read at 22:05 UTC).

## Take 100 — 2026-09-23 — A39 item 3: the missing pictures, measured on the runner — the sealed images and TCGplayer's second host

Opened before any code (PROTOCOL §6). Take 99 merged at 09:41 UTC (PR
#23, merge commit 00132d1) after the owner reviewed the look's eight
pictures ("Screenshots look good, go") — the first take through A40's
loop; check runs 26–28 green, smoke 685, render 106 in Chrome. Release
take-99's build was running when this entry opened: **Release take-99
published 09:47:12 UTC with both assets** (APK 34.9 MB, AAB 23.8 MB) on
its first build run.

**The item:** the owner's "still some missing pictures, namely releases
and some newer packs — these 100% have pictures on TCG or elsewhere"
(A39 item 3, from the take-97 answers), left at take 98 as a two-URL
question because nothing but GitHub is reachable from this session. The
runner has open network and already fetches every card image nightly; it
can measure the question instead of the owner.

### Measured first

- Every one of 7,659 printings carries `img` = TCGCSV's `imageUrl` on
  `tcgplayer-cdn.tcgplayer.com` (`…/product/<pid>_200w.jpg`; 674 of 674
  sealed products have one). The app has no URL builder: `refArt()` draws
  `p.img`, retries once without `_200w`, then removes the image — the
  label box the owner calls a missing picture.
- The hash step (`tools/hashes.py`) fetches **cards only** (`is_sealed=0`),
  hashes and discards, and records every miss in the runner-owned
  sidecar `catalog/hashes.json` under `missing` — 219 today, retried
  every run, 0 recovered (check run 25's log). A miss there is any miss
  (a timeout too), not only a 403/404; only `tally()` tells them apart.
  **Sealed images have never been probed**, so the boxes and packs the
  owner sees blank are unmeasured. Newest sealed: EB05 711383–711386
  (2026-10-30), OP18 712901–712904 (2026-11-20).
- The second host's URL pattern is INFERRED
  (`https://product-images.tcgplayer.com/fit-in/200x279/<pid>.jpg`, what
  TCGplayer's own pages use) and unverifiable from here: the VM's proxy
  and the harness's fetch tool both answer `EGRESS_BLOCKED` for it. The
  runner's probe is the measurement; the owner's phone check of the two
  URLs (asked in the take-98 report) is the independent one.
- `tools/gate.py check_offline()` scans `www/app.js` and `www/index.html`
  for undeclared hosts and never the bundle's `img` column: a host carried
  in the catalogue would ship past the gate unseen (the Plan review's
  finding). Closed this take with a probe.
- Pipeline order: catalog → hashes → validate → app, so the app build can
  read what the hash step measured; `tools/validate.py` reads the
  sidecar's `missing` to exempt cards from the 98% coverage check, so
  sealed misses must live under their own key or they would widen the
  exemption.
- **Ruled out:** fetching from this session; mirroring or caching any
  image (landmine 26); a second host on a guess in the app (only a URL
  the runner saw serve is exported); committing the sidecar from the
  branch (landmine 116 — the nightly writes its new keys); hashing sealed
  images (the scanner is for cards; the sealed probe is availability
  only).

### Built

- `tools/config.py`: `ALT_IMAGE_CDN`, one source of truth.
- `tools/hashes.py`: the 674 sealed images probed every run (fetched and
  discarded, never hashed) → sidecar `missing_sealed`; the second host
  probed for every pid in `missing ∪ missing_sealed`, a 200 whose bytes
  decode as an image = served → sidecar `alt` (recomputed each run) and
  `alt_host`; `_save()` carries the new keys (it also runs mid-pass);
  the "nothing to fetch" early return ends only the card pass; the dead
  `save_sidecar()` removed; two log lines with source totals; neither
  probe enters `verdict()`. Selftest controls for each pure piece.
- `tools/build_app.py`: `img` rewritten through `hashes.export_url()`
  for pids in `alt` only; the manifest gains `images` (counts).
- `tools/validate.py`: the exemption pinned as `exempt(raw)` — cards
  only — with a control.
- `tools/gate.py`: `check_offline()` also reads the hosts in the bundle's
  `img` column; a probe fires on an undeclared one.
- `src/app.html`: one Diagnostics line, `pictures:`, from the manifest.
- PROVISION rows; smoke section take 100; the look's step list for 100.
- **The runner (check run 29, head 8167e71, first run; smoke 691, render
  106 in Chrome, GATE PASSED; the hash step 32 s with the probes) — the
  measurement, verbatim:**
  `sealed images: 23 of 674 unavailable at the first host (recorded, not
  counted)` and `second host (product-images.tcgplayer.com): serves 1 of
  242 missing (cards 1 of 219, sealed 0 of 23; 404×241 served×1)`; the
  app step: `images: 1 rows carry the second host`. **Read plainly:** 23
  sealed products have no picture at TCGplayer's CDN — the newest boxes
  and packs the owner sees blank — and the second host, at the pattern
  its pages use, has an image for one of the 242 missing ids and answers
  404 for the other 241. The host and the pattern are real (one served);
  the missing pictures are not there either. INFERRED: an unreleased
  product has no image at TCGplayer yet, whatever the listing page shows
  (a placeholder), or the site draws it from a third address. The next
  measurement is the owner's: the image address from TCGplayer's own page
  for 712901 (long-press the picture → copy its address) — one constant
  changes and the probe measures the new pattern the next run. Nothing
  shipped unmeasured: one id's `img` moved to the second host.
- **The sidecar's new keys landed on main at the take-100 merge build**
  (run 48's `bundle` job commits the sidecars on every main build, not
  only the scheduled night — commit 9a157fe, 10:02:48 UTC). Read at
  22:05: `missing_sealed` 23, `alt` `['599838']` (Crocodile, a card),
  `alt_host product-images.tcgplayer.com`. **The 23 sealed products with
  no picture at the CDN, by set:** OP18 (2026-11-20) — 712901 Booster
  Box, 712902 Box Case, 712903 Sleeved Pack, 712904 Pack, 712907 Double
  Pack Set Vol. 13, 712909 its Display; EB05 (2026-10-30) — 711383 Pack,
  711384 Sleeved Pack, 711385 Box, 711386 Box Case; ST31 712853 Starter
  Decks 31–36; OP15-EB04 686290 Dash Pack; EB03 677570, 677571, 710745,
  710746 DON!! Cards and 679503 Sleeved Pack; ST29 672894 Bonus Pack;
  OP-PR 657218 Tin Pack Set Vol. 2 Display, 657219 its Case, 711511
  Illustration Box Vol. 7 Case, 711512 Vol. 8 Case, 717406 Judge Pack
  Vol. 8. Ten of the 23 are the two unreleased sets — the owner's
  "releases and newer packs"; the rest are displays, cases, DON!! cards
  and promo packs TCGplayer never photographed. Re-measured every build.
- **The owner's answer (09:5x UTC), which closes A39 item 3 with the
  measurement:** he opened TCGplayer's own page for 712901 — *"they have
  no image"* — so the newest boxes and packs have no picture anywhere
  TCGplayer serves, and the label box is the honest picture. He reviewed
  the two look screenshots ("overall very good", with "a tiny bit of
  work" he has not yet named) and said go; the PR was marked ready. He
  will not install 98 or 99: the take-98 report's answers (his steps,
  the `viewport` line) come from take 100's install. He raised a new
  question — *"there may be other parts of the app we can source images
  for that are missing"* — which needs his list of the parts and the
  source before anything is built (landmine 26: display-only, never
  hosted; PROVISION per host). Opened as A41.

### DEFERRED this cycle

- Hashing card art from the second host (its geometry is unmeasured
  against the crop); a canary for it (no baseline, landmine 106);
  `img = null` for a pid no host serves.
- Southern Hobby (A32) and the distributor timeline: a new session with
  the opened domain list.

## Take 99 — 2026-09-23 — the look: a click-and-screenshot review in the session's own browser, run before a take ships (A40)

Opened before any code (PROTOCOL §6). Take 98 merged at 09:08:51 UTC (PR
#22, merge commit d4bf525) on its second runner cycle — run 24 was red on
one wrong Chrome test, run 25 green: smoke 680, render 106 in Chrome, gate
passed; Release take-98 published 09:13:57 with both assets. The runner's
numbers commit landed after the merge; it is rebased onto main and rides
here. The take-98 release report went to the owner with four numbered
questions (his steps; the `viewport` line from the open Fold; the two
picture URLs; where the guide lives).

**The owner's ask, mid-take:** a way for the session to test new features
and bug fixes itself — "not directly in the app build … in fact it prob
shouldn't be" — by clicking and screenshotting, findings run by him for
input, before a take is finished; he floated an Android emulator. His two
answers to the plan: the harness first (take 99), the pictures probe next
(take 100); the screenshots and findings sent to the owner, every take.

### Measured first

- **An emulator cannot run in this environment:** no `/dev/kvm`, no
  `vmx`/`svm` flag in `/proc/cpuinfo` (4 CPUs, 15 GB), no Android SDK or
  `adb`, and the proxy refuses every host but GitHub (the SDK could not be
  downloaded; the harness's own fetch tool answers `EGRESS_BLOCKED` for
  TCGplayer and Southern Hobby too). RULED OUT here, MEASURED.
- **A real browser is already here and proven:** Playwright is installed
  globally (`/opt/node22/lib/node_modules/playwright`; ESM ignores
  `NODE_PATH`, so it is imported by absolute path) with Chromium under
  `/opt/pw-browsers`. At take 98 the back-path bug was reproduced and its
  fix verified in it at phone size — real clicks, the app's `window.VAULT`
  surface, `history.back()` running the same handler chain as the phone's
  Back, `page.screenshot`. The session can read a PNG (the Read tool shows
  images) and send it to the owner.
- **The CI harness is not a review:** `tools/render.mjs` takes one
  screenshot per run (`www/render.png`, the `render` artifact) and is
  pass/fail by design; the artifact's blob host is refused from here.
- **Limits, so nobody mistakes the look for the phone:** no camera, no
  notifications, no share sheet, no native Back (history Back is the same
  handler chain); no pictures from the CDN in this VM (egress), so every
  picture is its label box in the look and the phone stays the proof for
  A39 item 3. The Fold's inner viewport is INFERRED (~840×757 CSS px at
  DPR 2) until the owner pastes Diagnostics' `viewport` line from the open
  screen; the cover screen is the harness's 412×915.
- **A39 item 4 answered by reading:** More → *How it works* → *Show the
  guide again* exists (`#guideAgain` → `guideOpen`).
- **Ruled out:** the emulator, as above; testing inside the app build (the
  owner's word and PROTOCOL §8); the look in CI for now (a puppeteer port
  and an artifact gallery — deferred, the owner's call); a pass/fail-only
  look (the point is the picture he reviews, so every step writes one).

### Built

- `tools/look.mjs` — serves `www/` on a local port, opens the built app in
  Chromium through the global Playwright at two viewports (cover, inner),
  walks a take's step list, and after every step writes
  `look/<take>/<viewport>/NN-<name>.png` and a line of
  `look/<take>/report.json` (`{step, expect, measured, ok}`); prints a
  summary. `--selftest` runs a knowingly-wrong expectation (must FAIL) and
  a blank-page PNG-size control (must FAIL) — the harness watched to fail
  before it is trusted. Never in CI; `look/` is gitignored — the PNGs
  go to the owner.
- `tools/look/steps.mjs` — the step lists as data, one per take; take 98's
  is the first: the splash colour in the first 100 ms; Home → a
  most-valuable row → the sheet; a condition tap moving the segment, the
  line and the quantity in place; Back from the sheet → Sealed with no
  blank record; the folded Starter decks; a long toast wrapping.
- PROTOCOL §6 gains the step; the NSP carries it; AGENDA A40 records it.
- **The first look, on take 98's changes (20 steps, both viewports, all
  measured ok; 24 PNGs read here):** the splash is one colour; a
  most-valuable row opens the sheet; LP then MP move the segment and the
  line in place; Back from a sealed sheet lands on Sealed with no record;
  Starter decks start folded and open on a tap; Releases carries the
  bands and the buttons; the guide's row reopens the tour. **Three
  findings from the pictures, not the numbers** — which is the point:
  1. The harness screenshotted Home before the splash lifted (the splash
     lingers, take 86): `open()` now waits for it to go.
  2. **The long toast wrapped into a tall half-width pill** at cover
     width (206 px wide, seven lines): `left:50%` halves the available
     width of a fixed box, so `max-width` never applied. Fixed with
     `width:max-content` — 380 px wide, three lines now. Take 98's
     measurement ("inside the screen, more than one line") was true and
     not enough; the picture was.
  3. **A sealed sheet's subtitle read "The Dominance of God · ·"** —
     the line joined rarity and number a sealed product does not have.
     Built from the parts it has now.
  Both fixes have smoke assertions watched to fail on the take-98 build
  (smoke 684).
- **Landmine 138, from the first commit attempt:** the unanchored
  `look/` ignore also matched `tools/look/`, `git add` refused the step
  list and the `&&` chain stopped before the commit — the push pushed
  nothing and only the log's last line showed it. Anchored to `/look/`;
  smoke asserts `git check-ignore` refuses the step list (smoke 685).
- **The runner (check run 26, head e15382a, first run): smoke 685, render
  106 in Chrome, GATE PASSED** — 45 s with the catalogue cache warm; run
  27 green on the numbers commit. The owner reviewed the eight pictures
  ("Screenshots look good, go") and the PR was marked ready — the first
  take shipped through A40's loop.

### DEFERRED this cycle

- **Take 100 — the pictures** (A39 item 3): the sealed images and
  TCGplayer's second host measured on the runner; the design is in the
  plan and in A39.
- The look on the runner as a PR-check artifact gallery.
- **Southern Hobby** (A32) and the distributor timeline: a new session
  with the opened domain list.

## Take 98 — 2026-09-23 — the take-97 look: Back from a sheet goes back (landmine 137), and six small things the third install named

Opened before any code (PROTOCOL §6). Take 97 merged at 08:18 UTC (PR
#21, merge commit 15e65eb) on its first runner cycle; Release take-97
was published at 08:23 with the APK and the AAB (GitHub's tag view lists
a release's assets a minute late; the assets endpoint had both at once —
not a failure). The owner installed 97 over 96 in place (the same signing
key; that is what A8 is for) and answered the release report (08:41 UTC):
**takes 95–97 PROVEN on the Fold** — the release tap lands on Sealed with
the query, the chips draw under every row (three on Set Sail, two on the
starter decks, wrapping to a second line), the sealed sheet reads "Sealed
— no condition" with its Where-to-buy panel, the card sheet reads
"Condition · Near Mint", the countdown and the Remind/Calendar buttons
draw. **Local and Events fill** (3,395 stores, 19,369 rows on the phone);
notifications are granted; 17 of 17.

**The paste answered the oldest open question.** *Last errors* carries
eight watchdog records in one hour, every one `blank: no screen on after
hardware back; stack …>detail`. That is the blank-after-Back (A33 item
5, "closed" at the owner's word at take 94 and reopened here by its own
record) and his note today — *"I click back and it takes me to Collect's
home instead of the previous page"* — is the same fault seen from the
other side: the watchdog healed the blank by putting Home back.

### Measured first

- **The cause (PROVEN by reading the code against the record):**
  `closeAnyOverlay()` lists `#detail` among the overlays it closes; the
  card sheet has been a *screen* (`<section id="detail" class="screen">`,
  opened through `go('detail')`) since take 83. The hardware back turns
  the sheet off and returns before `NAV.back()` runs, so no screen is on
  and the stack still ends in `detail` — exactly the record. Since take
  81's overlay list; the take-86 watchdog healed the symptom on every
  press and the record could not be read until take 91. Landmine 137.
- **Home's most-valuable rows** are `<div class="row">` — nothing to tap;
  every other list's row is a `<button data-open>`.
- **The splash** paints `var(--bg)`, which is the mode's colour, so it
  jumps from Collect's blue to the last mode's palette when that mode is
  restored. The owner wants one constant colour.
- **The toast** is `white-space:nowrap` in a pill; the take-97 reminder
  toast ran off both sides of the screen.
- **The Starter decks section on Sealed** is open by default (take 87);
  the owner wants it folded.
- **The condition segment** on a card's sheet repaints the whole sheet on
  a tap (`openDetail(dCur.id)`), which reads as "the page refreshes", and
  nothing says what a tap does: it chooses the condition recorded with the
  copy you add.
- **The pictures still missing on Releases and some newer packs:** the
  catalogue carries a CDN URL for each; the CDN answers 404 for them from
  the runner's side (take 95's reading). The owner is sure TCGplayer shows
  them — TCGplayer's own pages use a second image host
  (`product-images.tcgplayer.com`), which this session cannot probe. Two
  URLs go to the owner as a question; a second host is a PROVISION and
  landmine-29 decision, not a quiet fallback.
- **The guide** shows once per install (`GUIDE_KEY`), and there is no row
  to reopen it — an answer, and an item for later.
- **Ruled out:** treating the sheet as an overlay again (it navigates);
  a second image host without the owner's measurement; a background
  check.

### Built

- `closeAnyOverlay()` no longer touches `#detail`: the back button pops
  the stack and lands on the screen the sheet came from. Smoke drives the
  handler's exact sequence and a control with the picker open; Chrome
  runs it for real and asserts no blank record is written.
- Home's most-valuable rows are buttons that open the card.
- The splash is one colour in every mode (Collect's, as literals).
- The toast wraps within the screen.
- The Starter decks section on Sealed starts folded.
- A condition tap updates the segment, the line, the quantity and the
  cost basis in place; the card note says what the tap does.
- Tests: smoke 680 (14 new, every one watched to fail on the take-97
  build first: the overlay list, the sheet-on control, the picker control,
  the most-valuable rows twice, the splash, the toast, the decks fold, the
  condition handler, the tap on an unowned card, the tap on an owned copy
  with quantity and cost basis, the refused sixth condition, the note);
  the DOM render 10 here; **the runner (check run 25, head 74bf3c6):
  smoke 680, render 106 in Chrome, GATE PASSED** — run 24 was red on
  one Chrome assertion, below. The same run's hash step says what the
  picture question is worth: **219 images known to be unavailable at
  the catalogue's CDN, retried every run, 0 recovered** (MEASURED) —
  those are the blanks on Releases and the newest packs. Two tests were
  wrong before the product was: `OWN.add()` takes no cost
  basis (it is set on the sheet), so the smoke test sets it on the
  returned copy; and the Chrome back-path test opened Sealed with no zip
  set, so the zip prompt sheet was open when the history event fired and
  Back closed the prompt first, rightly (take 81) — check run 24 read
  that as the sheet staying (`after: detail`, no record). Reproduced
  here in a real Chrome (playwright is installed globally on this VM,
  `/opt/node22/lib/node_modules/playwright`, with Chromium under
  `/opt/pw-browsers` — the first real browser this session has had; the
  harness still wants puppeteer, which npm refuses). The test now closes
  every overlay before the Back and reports the ones it found, and the
  prompt case is its control.
- **The condition buttons had never worked** (PROVEN by reading, then by
  the test): the tap set the condition and the repaint reset it to the
  owned copy's, or to NM. The owner's "I click them and the page seems to
  refresh" was exact.

### DEFERRED this cycle

- **The pictures on Releases and the newest packs** — the owner's two-URL
  measurement decides whether a second image host is worth its own take.
- A row in More to reopen the guide.
- **Southern Hobby** (A32); the distributor state timeline; the package
  hosts in this session.

## Take 97 — 2026-09-23 — A38 items 1 and 5: Releases — starter decks grouped, the countdown coloured, a release reminder and the calendar

Opened before any code (PROTOCOL §6). Take 96 merged at 08:01 UTC (PR
#20, merge commit d0e6bba) on its first runner cycle; its build (run 44)
was in progress when this take opened. The owner's items, in his words:
*"we really need to move starter decks to their own section, they flood
the release page"* and *"make days change from through different colors
as it gets closer, add the ability to add an alert. or to add an event to
my phone's cal of choice."*

### Measured first

- **The flood is not Upcoming:** the catalogue has three upcoming sets
  today (EB05 10-30, OP18 RE 11-13, OP18 11-20). It is **Recent**, where
  ST31 to ST36 are six rows for one release day (07-31), and the
  distributor's list, where ST-37/38 (12-18) and ST-39 to ST-44 (2027-04-23)
  are eight rows for two days. A starter-deck set is one whose name starts
  "Starter Deck"; a run of two or more on one day is what floods.
- **The calendar path exists** (take 78): `icsFor(e)` and
  `addEventToCalendar(e)` take an event with a store; a release has no
  store, so `icsFor` learns to omit LOCATION and the store suffix when
  there is none, and a release becomes an all-day event on its date with
  the TCGplayer listing as its URL.
- **The notification path exists** (take 27): `PLATFORM.notify()` fires at
  once through `LocalNotifications.schedule()`. The same plugin schedules
  for a future time with `schedule: { at }` and cancels by id — INFERRED
  from the plugin's public API (the session cannot read its definitions
  here: npm is closed), so the reminder rides **two** paths: a scheduled
  notification at 09:00 local on the day before the release, and an
  on-open check that fires once on or after that day if the scheduled one
  never did. The on-open path is the tested one; the scheduled one is the
  owner's to see on the Fold.
- **The countdown's colour:** the palette's own tokens, in every mode —
  within a week `--up` and bold, within a month `--brass`, within three
  months `--fg`, further or past `--dim2`. No new colour.
- **Ruled out:** a background check (D22, the owner's); a second alert
  store (the release reminder is its own small list, `vault.relAlerts`,
  beside price and stock alerts, because it keys on a set and a date, not
  a printing); grouping anything but starter decks (a booster set is the
  release).

### Built

- **Grouped starter decks** on Upcoming, Recent and the distributor's
  list: a run of two or more on one day is one row — "Starter Decks
  ST31–ST36", the count, the date and countdown — with *Show the 6 decks*
  to unfold them (`RELF.open`, the house fold pattern); a single starter
  deck stays a row. The group's tap opens Sealed searched for "Starter
  Deck".
- **The countdown coloured by nearness** (`relBand(days)`: `cd1` within a
  week, `cd2` within a month, `cd3` within three months, `cd4` further or
  past).
- **Remind me** on every upcoming row and group (`RELALERTS`): a
  notification the day before the release — scheduled, and checked on
  open — toggled off by the same button; **Calendar** hands the release
  to the phone's calendar as an all-day event through the take-78 path.
- **Watched fail first:** on the take-96 build the new smoke section died
  at its first `relBand` call; on the rebuild two older assertions were
  red because their anchors had moved with the take — take 86's footer
  markup (the line now carries Remind me and Calendar beside Details) and
  take 95's regex on the tap handler's call (it passes the row's query
  now); both were re-pointed at the new truth, neither weakened. Then
  **666 passed, 0 failed** (652 before, 14 new): the four bands, the run
  of ST31–ST36 as one row with its fold and the single deck left alone,
  the fold opening to six rows, the group's tap searching every starter
  deck, every upcoming countdown carrying its band and a recent one the
  past band, Remind me and Calendar on every upcoming row and none on a
  recent one, the reminder stored and shown, the on-open check firing
  once on the day before and never before or again, the same button
  removing it, the calendar event on the date with no location, the two
  reminder paths in the shipped code, the distributor's two unlisted
  displays folding into one row and opening. The DOM render 10, the
  scrubber clean. Three Chrome assertions for the runner: the fold opens
  on a real click, an upcoming countdown's colour differs from a past
  one's, Remind me draws, sets and clears. **PROVEN on the runner, first
  run (check run 22, head 1a0a7bc, 08:10 UTC): render 101 passed, 0
  failed (mode: chrome)** — 98 before, the three new green — smoke **666
  passed, 0 failed**, **GATE PASSED**, hash coverage 100.0%, pipeline
  31 s. One runner cycle for the take.

### DEFERRED this cycle

- **Southern Hobby** (A32), its own take; the distributor state timeline.
- The scheduled notification's proof is the owner's (the day before EB05,
  2026-10-29, if he sets one).
- The three package hosts in this session; More in the nav.

## Take 96 — 2026-09-23 — A38 item 4: where to buy, under each sealed listing and on its sheet

Opened before any code (PROTOCOL §6). Take 95 merged at 07:49 UTC (PR
#19, merge commit a94ed5b) after two runner cycles (the second earned
landmine 136); its build (run 43) went green on the first attempt and
Release take-95 was published at 07:55 UTC.
The owner's fourth item, in his words: *"Add links to where I can buy
these under each listing with a picture representing where such as the
TCGplayer logo, online or local link/address/phone whatever."*

### Measured first

- **Every printing's TCGplayer URL carries the catalogue's own product
  id** (MEASURED: 7,659 of 7,659 `tcg_url` rows match
  `/product/<product_id>/`), so the app builds
  `https://www.tcgplayer.com/product/<id>` from what the bundle already
  has — no new column, no bundle growth, and no parameter on the link
  (take 82's rule: no affiliate or tracking).
- **The other three sources already carry a URL per item:** Target's
  `it.url` (take 71), a shop's `it.url` into its own storefront (take 75),
  the distributor's `it.url` (take 94). The roster (`hunt/stores.json`)
  carries `addr`, `city`, `state`, `zip`, `phone` and a point per shop, and
  `shopLines()` already finds the roster entry by name and zip for the
  distance — the address and phone ride the same lookup.
- **"A picture representing where":** four small glyphs in the house
  sprite (`assets/glyphs.svg`, one file, inlined at build), one per kind
  of seller — a cart for an online marketplace, a pin for a local shop, a
  truck for the distributor, a handset for a call. A brand logo is ruled
  out (below); the seller's name says which one.
- **Where a link can live:** a Sealed row is a `<button data-open>` beside
  the alert button inside a flex row; an anchor inside a button is invalid
  HTML and its tap would open the sheet. The chips go in the outer row on
  their own line (`flex-wrap`), outside the button.
- **This VM:** as at take 95 — smoke and the DOM render here, Chrome on
  the runner; the seller hosts are data in the feed, never fetched.
- **Ruled out:** brand logos (a trademark in a Play-listed app is a
  rejection ground, landmine 29's family); any affiliate or tracking
  parameter (PROVISION, take 82); the app fetching a seller's page
  (PROTOCOL §8: the OS browser opens it); calling any source "the
  cheapest" (A32's standing rule: source, price, fetched-when); a chip
  inside the row's button.

### Built

- **`buySources(p)`** — TCGplayer always (the market price and its date
  as the note), then each Target listing (price, shipping status, age),
  each shop listing (price, in stock or sold out online, age, the
  roster's street address, phone and distance), each distributor listing
  (the state, allocated, "to stores", age).
- **`buyChips(p)`** — the strip under each Sealed row, in both row
  templates: a glyph, the seller's name and ↗ per source, opening the
  seller's own page in the OS browser; a *Call* chip when the roster has
  the shop's phone. Outside the row's button.
- **The sealed sheet's *Where to buy* panel** — a row per source with its
  note, address and distance, *Open ↗* and *Call*; hidden on a card's
  sheet (`.panel[hidden]`, landmine 136's rule); a note that every link
  opens the seller's own page, nothing is bought or fetched in the app,
  and no link carries a referral.
- **PROVISION:** the `www.tcgplayer.com` row gains the product page; a row
  says the feed-carried seller links are data the OS opens, never fetched.
- **Watched fail first:** on the take-95 build the new smoke section died
  at its first `buySources` call; on the rebuild **652 passed, 0 failed**
  (642 before, 10 new) — TCGplayer first at the catalogue id with no
  parameter, the distributor "to stores", a shop with the roster's
  address, phone and distance (a synthetic roster entry makes that path
  deterministic), a strip per row and every strip after the row's buttons,
  the glyphs and ↗ per chip, the `tel:` Call chip, the sheet's panel and
  the card control, the four glyphs in the sprite, the literal-host rule.
  The DOM render 10, the scrubber clean. Three Chrome assertions for the
  runner: the strip inside the row at 412 and 673 px, and the sheet's
  panel drawn for a sealed product and not for a card. **PROVEN on the
  runner, first run (check run 20, head fc6f4d8, 07:58 UTC): render 98
  passed, 0 failed (mode: chrome)** — 95 before, the three new green —
  smoke **652 passed, 0 failed**, **GATE PASSED**, hash coverage 100.0%,
  pipeline 33 s. One runner cycle for the take.

### DEFERRED this cycle

- **Take 97 — Releases:** starter decks grouped (one row per release
  day), the countdown coloured by nearness, a release alert and
  add-to-calendar (the take-78 `.ics`).
- Then **Southern Hobby** (A32); the distributor state timeline.
- The three package hosts in this session; More in the nav.

## Take 95 — 2026-09-23 — the take-94 look: a Releases row that does something, a sealed sheet without card conditions, an alert you can find

Opened before any code (PROTOCOL §6). Take 94 merged at 06:56 UTC (PR
#18, merge commit f2626e9). Build run 42's `apk` job failed on Maven
Central answering 429 to Gradle for thirty artifacts and passed on one
re-run of the same commit (07:05 UTC: Release take-94 with the APK and
the AAB) — RUNBOOK carries the row. The first hourly on the merged code
(run 40, 06:58 UTC, dispatched by hand) printed
`gts: 49 of 49 products (20 matched), 37 sold out, 32 allocated, 0
preorders open, 1 coming, 1 in stock, 6 call; 1 call(s)` — **take 94
PROVEN live** — and then **PROVEN on the Fold** by the owner's five
screenshots and paste (07:26 UTC): the panel's six numbers equal the
runner's; the distributor line fits on the starter-deck display rows and
on the booster box; the Booster Box Case carries no line (landmine 134's
fix, visible); Releases lists IB-10, IB-09, ST-37, ST-38, EB-06, DP-14 and
OP-19 by date; Diagnostics reads `gts 49 products`, 17 of 17, no errors.
**The owner closed the blank-after-Back** ("Back arrow improved … call it
fixed") — A33 item 5. His answers name eight things (AGENDA A38); this
take does the three that are a bug or a control nobody could find.

### Measured first

- **A Releases row did nothing when tapped** (PROVEN by reading the
  handler; the owner: "I can't click on the release"). `[data-browse-set]`
  sets the Search filter, paints the Search screen and scrolls to the top
  — and never calls `go('search')`. In Collect the set browse already
  lives on Search, so it looked right; in Hunt the row painted a screen
  the mode keeps hidden. Since take 70, through four looks. Landmine 135.
- **Card conditions on a sealed product.** The sheet's `#dCondSeg` (NM /
  LP / MP / HP / DMG) draws for every printing. A sealed box has no
  condition — the market price is a factory-sealed copy's — and the
  segment carried no label, so on a card it read as five unexplained
  buttons ("really not sure what these are").
- **The stock alert was a circle.** `○` at the right of a Sealed row and
  no word; the detail sheet, where the owner looks (his screen stack shows
  `sealed > detail`), had a price alert and no stock alert.
- **The pictures "still missing" (Dominance of God, Starter Decks
  31-36):** every one of those printings carries a CDN URL in the
  catalogue (712901–712909, 712853). The photo is not on the CDN yet;
  `refArt()` removes a failed image and the drawn tile stands (landmine
  85). INFERRED from the URLs and the app's path — the CDN is refused from
  this VM today. Nothing to build: the tile is the honest state until
  TCGplayer has the photo, and a set's tile appears on its booster box.
- **This VM (MEASURED 07:00 UTC):** after the owner opened all domain
  access, this session's proxy refuses every host it allowed at 05:50
  (GTS, Pages, TCGCSV, Target, the events source); only the GitHub API
  answers. The setting reaches a new session (INFERRED). Smoke and the DOM
  render here; Chrome on the runner, as at takes 89–94.
- **Ruled out:** brand logos on the buy links the owner asked for (take
  96) — a trademark in a Play-listed app is a rejection ground (landmine
  29's family); a text chip per source says the same thing. Grouping
  starter decks, the coloured countdown and the release alert in this
  take — one mechanism per take (take 97).

### Built

- **A Releases row (any `[data-browse-set]`) shows a screen.** In Hunt:
  Sealed, searched for the set's name (every fold open, the query in the
  box so it can be cleared); in Collect: the set browse on Search — each
  through `go()`. Smoke drives the tap in both modes and asserts the
  screen is on; the control on the take-94 build failed first.
- **The sealed sheet:** the condition segment is hidden for a sealed
  product and its line reads "Sealed — no condition"; on a card the line
  reads "Condition · Near Mint" (the abbreviation expanded once, in
  `COND_NAMES`, shared with the bulk picker).
- **The alert you can find:** *Alert me when in stock* on the sealed
  sheet beside *Alert me at a price* — the same take-77 watch, reading
  "Watching for stock — stop" when on — and the row's circle carries the
  word under it (alert / watching).
- **Watched fail first:** on the take-94 build the new smoke section died
  at its first line (no `browseSet`); on the rebuild two assertions were
  red because the DOM stub's class toggle is not what `go()` is judged by
  — earlier sections read the navigation stack `go()` records, and these
  now do too (the class and the drawn height are Chrome's to measure).
  Then **641 passed, 0 failed** (634 before, 7 new), the DOM render 10,
  the scrubber clean. Two Chrome assertions for the runner: a real click
  on a Releases row lands on Sealed with that set's products drawn, and
  the sealed sheet draws no condition segment and draws the stock alert
  while the card sheet does the reverse.
- **The runner's first run (check run 17, head 0b678fd) was red on
  exactly that second assertion:** smoke 641 green, Chrome 94 passed and
  one failed — `{"segH":0,"stH":36,"segH2":39,"stH2":36}`: on the card's
  sheet the stock button still drew at 36 px. `.linkish{display:block}`
  outranks the browser's `[hidden]{display:none}`; the DOM stub treats
  `hidden` as a property and cannot see it. The house pattern already
  existed (`.stale[hidden]`, `#tour[hidden]`, `nav[hidden]`) and the fix is
  one rule beside the display rule, `.linkish[hidden],.seg[hidden]
  {display:none}`, with a smoke line that reads it in the shipped page.
  Landmine 136 — the Chrome measurement earned its keep again (landmine
  69). **PROVEN on the runner (check run 18, head d539e64, 07:45 UTC):
  render 95 passed, 0 failed (mode: chrome)** — 93 before, the two new
  green — smoke **642 passed, 0 failed**, **GATE PASSED**, hash coverage
  100.0%, pipeline 42 s. Two runner cycles for the take; the first one
  found a landmine the stub never could.

### DEFERRED this cycle

- **Take 96 — where to buy**, under each sealed listing: TCGplayer (the
  catalogue's own product link), Target, the shop, the distributor, as
  text chips; a local shop's address and phone from the roster.
- **Take 97 — Releases:** starter decks grouped (one row per release
  day), the countdown coloured by nearness, a release alert and
  add-to-calendar (the take-78 `.ics`).
- Then **Southern Hobby** (A32); the distributor state timeline.
- The three package hosts in this session; More in the nav.

## Take 94 — 2026-09-23 — A32: GTS Distribution, the first distributor source

Opened before any code (PROTOCOL §6). Take 93 merged (PR #17, merge
commit 1a523d1); the owner's take-93 paste read 17 of 17 self-test PASS,
`build:` filled, pictures on every list, no blank-screen record.
**Take 92 is PROVEN on the runner:** the owner hand-ran the `hunt`
workflow (run 38, 03:27 UTC, green); Pages serves `stores.json` fetched
2026-09-23T03:28:16Z with 3,395 stores and `events.json` (200) with
19,369 rows over 31 days — the first roster rebuild since 09-17. The
owner chose A32's next source, **GTS Distribution**, and opened the hosts
in the environment's network policy: `www.gtsdistribution.com`,
`www.southernhobby.com` and `southernhobby.com` answer 200 from this VM
now (the apex `gtsdistribution.com` and the three package hosts still
403; none of them is needed).

### Measured first: what GTS publishes, read off the real pages

- **The platform:** Website Pipeline on classic ASP. One faceted listing,
  `pc_combined_results.asp`, takes `faceted_search_terms=Brand~<id>|
  Manufacturer~<id>`, `range=release_date~[~from~to~]`, `page=N` and
  `rpp=N` (12/36/60/90/120/240; `pagesize` belongs to the ERP pages and is
  ignored here). There is no JSON endpoint — but every listing page embeds
  `var productResults = {"count": N, "products": [...]}`, the object its
  own view model renders. The parser reads that object and never the HTML
  around it; the product page embeds the same shape as `var product`.
- **The facets:** Brand `ONE PIECE` and Manufacturer `BANDAI JAPAN`, ids
  read off the facet panel's checkboxes. **49 products; `rpp=60` returns
  all 49 in one call** (PROVEN: count 49, 49 on the page). The keyword
  search "one piece" gives 92 — sleeves, puzzles, a board game — so the
  brand-and-maker pair is the list.
- **Per product:** name, SKU, UPC(s), link, MSRP (`SRetailPrice`; the
  wholesale price sits behind a login — `require_login_for_price_and_atc`
  — and the project never logs in), `inventoryStatus` in/out, a stock
  message in HTML ("Sold Out", "Call to Order", "in stock" or empty), the
  stock label ("50+", "24+", "99+", "Sold Out", "call"), `release_date`,
  `preorder_date` (when preorders opened; a 1924 placeholder on sleeves) [take 114: GTS's own page labels this date its Order Due Date, the last day stores order -- "preorders open" was inferred from the field's name; landmine 172],
  `approximate_restock` (1/1/1900 = none), an "Early Release Date" field,
  the case configuration, and `flags[1]`.
- **`flags[1]` is the allocation flag, PROVEN two ways:** the product
  page's template shows "This product may be allocated" exactly when
  `flags()[1]` is set; and the Narrow By → Allocated facet (59 products
  across the brand, two pages) holds exactly the 32 of the 49 Bandai
  products whose flag is set and none of the 17 whose flag is clear.
  Today every booster from OP-16 to OP-19, EB-05, EB-06, the ST-31 to
  ST-38 displays, DP-11 to DP-14 and the gift collection are sold out and
  allocated, months before release: **OP-19 releases 2027-03-05 and is
  sold out at the distributor on 2026-09-23.** That is the signal A32
  named at take 69 — the print run spoken for before a shelf sees it.
- **The states the site distinguishes, and the feed's words for them:**
  sold out (the message or the label says so; `inventoryStatus` reads
  `in` on six sold-out displays, so the words win), call (Call to Order),
  in stock (`in` with a quantity label), preorder (`out`, releases in the
  future, preorders open), coming (`out`, releases in the future,
  preorders open on a later date — PEB-01 opens 2026-10-14 for
  2027-04-23), out (`out`, already released), else unknown. [take 114: GTS's own page labels this date its Order Due Date, the last day stores order -- "preorders open" was inferred from the field's name; landmine 172]
- **Terms:** robots.txt answers a 500 (none published); the terms page
  names no automation or scraping clause. One call a run, a second's
  pause between pages if there are pages, a User-Agent naming the
  project, no account, no cart — Target's footing (take 71).
- **The matcher would match 2 of 49 (MEASURED):** the distributor names
  case packs. "BOOSTER (OP-16) (24CT)" is the retail Booster Box (24
  packs); "STARTER DECKS DISPLAY (ST-31) (6CT)" is the catalogue's "…
  Display"; "DOUBLE PACK SET VOLUME 11 (DP-11) (8CT)" is "Double Pack Set
  Vol. 11 Display". A normaliser on the GTS side turns the wholesale name
  into the retail one before the shared `match()` sees it, and `match()`
  learns three things every source needs: DP, IB and PEB numbers are set
  codes (a code pins the set, so DP-14 with no catalogue product matches
  nothing instead of Vol. 13 at 0.8 — rule 4); "Vol. 7" is one token, so
  Vol. 7 and Vol. 8 differ by a whole word; and **a tie is broken toward
  the product with fewer extra words** — "Booster Box" and "Booster Box
  Case" have both scored 1.0 for every booster-box title since take 71,
  and the Box won by row order (landmine 134). Loading the script for
  that measurement found landmine 133 first.
- **Not in the catalogue yet** (TCGplayer lists nothing): OP-19, EB-06,
  PEB-01, ST-37 to ST-44, DP-13/14, IB-09/10, TS03. Those go on Releases
  as *at the distributor, not in the catalogue yet* — the earliest list
  there is, dated by the distributor.
- **Ruled out:** the app fetching GTS (PROTOCOL §8: the runner fetches,
  Pages serves); an account or key; showing the MSRP as a price the
  collector can pay (it is the suggested retail for the case pack, and the
  line says MSRP and the pack count); Southern Hobby in the same take
  (one source per take, the take-69 rule).

### This VM (MEASURED 03:5x UTC)

The three package hosts answer 403 as at takes 89–93: smoke and the DOM
fallback here, the runner's `check` as the gate in Chrome, a draft PR
marked ready on green, no vendor trailer. The live fetch runs from here
before it ships, against the opened host.

### Built, and proved where it could be

- **`tools/hunt/gts.py`** — the constants (the two facet ids, `rpp` 60),
  `listing_url(page)`, `get`, `parse_listing(html)` (the embedded object
  or `ValueError`; count and products), `parse_product(p, today)` (the
  fields above, the six states, `allocated`, the set codes in the name,
  the URL), `retail_title(name)` (the wholesale name as a retail one),
  `fetch(max_pages, pause)` that never raises and refuses a page set that
  carries fewer products than the count promised (AGENTS rule 8), and a
  selftest against `tools/fixtures/gts_listing.html` — the real page
  trimmed to eleven products with descriptions cut, `count` kept at the
  49 the site said — with controls: no object, a product without its
  inventory block, a short page set.
- **`tools/hunt.py`** — `feed["sources"]["gts"]` beside `target` with the
  same keep-the-last-good path; every item matched through
  `retail_title()` and `match()`; `--from-fixtures` builds it from the
  saved page at a fixed date so its states are stable; the run log prints
  `gts: 49 products (N matched), N sold out, N allocated, N preorders
  open, N coming; 1 call`; the history row records each SKU's state so
  a flip is dated from now on (read in a later take). `tokens()` and
  `match()` as above, with named expectations and controls.
- **The app** — `distLine(it, G)` under a Sealed row: `GTS Distribution
  · sold out · allocated · MSRP $119.76 (24 packs) · release 2026-11-20 ·
  checked 2 h ago`, in the distributor's own words; a GTS panel under
  Target's with the counts and what a distributor is (sells to stores;
  sold out here months early means the run is spoken for), and `Could not
  reach GTS Distribution since …` when the source is down; Releases: a
  status line under a set the distributor lists, and *At the distributor,
  not in the catalogue yet* — every coded product no set matches, by
  release date; `STOCK.sourcesFor()` gains `gts:<sku>`, available when
  the distributor shows stock or an open preorder, so the flip fires the
  take-77 alert; Diagnostics prints the distributor's count and age.
- **Tests** — smoke: the feed carries the source, the eleven states
  read as measured, allocation true and false where the page says,
  OP-16 → the Booster Box and not the Case, ST-36 → the Display, DP-11 →
  Vol. 11 Display, IB-07 → Vol. 7, PEB-01 and OP-19 and DP-14 → nothing
  (controls), the panel, the row line, the dead-source text, the Releases
  panel and line, the alert firing once on a flip and not again; render
  (Chrome): the Sealed row with a distributor line and the Releases panel
  draw without sideways scroll, and the control without the source.
- **Watched fail first:** on the take-93 build the new smoke section died
  at its second line (`distByCatalogId` is not a function) after one FAIL;
  on the rebuild two assertions were red — the Releases panel's row count
  (the regex assumed no whitespace between panels: the test's fault) and
  the set rows' distributor line, which I had added to the starter-decks
  row template and not to the per-set one: the harness caught a half-done
  edit before a phone did. Then **634 passed, 0 failed** (615 before, 19
  new), the DOM render 10, `hunt.py --selftest` 61 lines (39 before), the
  scrubber clean. **PROVEN on the runner, first run (check run 15, head
  f773f83, 06:53 UTC): render 93 passed, 0 failed (mode: chrome)** — 90
  before, the three new green — smoke **634 passed, 0 failed** there too,
  **GATE PASSED**, hash coverage 100.0%, pipeline 31 s. One runner cycle
  for the take, against take 93's three.
- **The live run from this VM:** the host answered 200 for the twelve
  pages saved between 05:50 and 06:25 UTC — the fixture is one of them,
  fetched with the module's own URL shape — and the proxy has refused
  CONNECT since 06:43 UTC (403: the environment's policy, per its README
  not retried). `fetch()` is PROVEN end to end against the saved page in
  the selftest (the count check, the short-page control, the refused-host
  control) and runs live first on the runner's next hourly after the merge,
  whose log prints the `gts:` line; the `check` workflow does not fetch it.

### DEFERRED this cycle

- **Southern Hobby** — the next source, its own take; Alliance (503 at
  take 69); the residential-IP sources (GameStop, Walmart, Meijer, eBay)
  wait for the sideload build.
- **The state timeline** — recorded per SKU in the history rows from this
  take; the app reads it (sold out since, preorder opened on) later.
  [take 114: built, without "since" -- the first check on file is only
  its left edge -- and GTS's date is when orders were due, not opened]
- **The blank-after-Back** — no record yet since take 91's install. More
  in the nav (design, the owner's). The three package hosts.

## Take 93 — 2026-09-23 — A33 item 6: a picture beside every card and set in the lists that had none

Opened before any code (PROTOCOL §6). Take 92 merged at 02:36 UTC (PR
#16, merge commit b5626aa); build run 40 green, Release take-92
published. No hourly has run since 00:31 UTC, so Pages still serves the
09-17 roster and a 404 for `events.json` until the first run after the
merge — read, not assumed. The owner chose the next Priorities item and
its scope: A33 item 6, **all of the rows that lack a picture**.

### Measured first: what has art, what has none

- **Has art already (PROVEN by reading the code):** Collect's grid tiles
  (the scan photo, else reference art over a name-and-number
  placeholder), the card sheet's hero, the binder pockets, the checklist
  cells, the Decks list's Leader, the deck header, the Leader and printing
  pickers, and everything in Hunt since take 83.
- **Has none:** Collect's search hits, Market Movers, Home's top list, the
  set browse and Home's set progress, the card sheet's other-printings
  list, a deck's card rows and its add-card results, the Cards browse in
  Prep & Play, Trade's search results.
- **Four thumbnails draw unsized (INFERRED from the CSS, measured in
  Chrome below):** the Decks list's Leader box, the Trade and Wants rows'
  `.oa` boxes and the Play board's Leader button carry `refArt()` but none
  of the classes that size an `<img>` (`.art`, `.pic`, `.opt .oa`,
  `.dkhead .lead`, `.pocket`, `.ck`), so the image draws at its natural
  size, clipped to the box. Since takes 20–29; no test ever measured an
  image's box. Landmine 132.
- **One image path, already guarded:** every picture goes through
  `refArt(p)` — the bundle's `img` (TCGCSV's `imageUrl`, `_200w`), lazy,
  hides its placeholder on load, retries once without the size suffix,
  removes itself on failure (take 86). The CDN host is data, not code;
  PROVISION declares it; the gate refuses an undeclared host in `www/`.
  Nothing new is fetched, stored or bundled (landmines 26, 27, 28, 85).
- **A ledger claim without code, corrected (landmine 129's shape):**
  PROVISION said the allowlist is "two entries" (its table has five rows)
  and that the CDN is "DISPLAY-ONLY in the gate"; `check_offline()` checks
  that a host in `www/` is declared and nothing about purpose. The purpose
  is prose, and now says so.
- **Ruled out:** bundling any art (26); a second image path (one function,
  one set of failure rules); product box shots on the ready-made decks
  (A29 — the drawn cover stays); counting `<img>` loads in the NET badge
  (they are not fetches and never load-bearing, PROTOCOL §8).

### This VM (MEASURED 02:45 UTC)

The three package hosts answer 403 as at takes 89–92; the same route:
smoke and the DOM fallback here, the runner's `check` as the gate in
Chrome, a draft PR marked ready on green, no vendor trailer.

### Built, and proved where it could be

- **One box, three callers.** `picBox(p, w, h, label, radius)` is the box
  Hunt's rows had since take 83 (the gradient in the card's first colour, a
  label in the display face, `refArt(p)` over it); `productPic()` now calls
  it with the set code at the product ratio, byte-for-byte what it returned
  before (the take-83 smoke assertions are the control); `cardPic(p, w = 36)`
  calls it at the card ratio (36 × 50) with the number's last part as the
  label; `setPic(s, w)` is Releases' local `picFor` hoisted — the set's
  booster box through `productPic`, else the drawn abbreviation tile.
- **Where they went:** search hits, Market Movers, Home's top list, the set
  browse and Home's set progress (set boxes), the card sheet's other
  printings, `deckRow` (so a deck's card list and its add-card results,
  at 30 px between the cost pip and the name), the Cards browse rows, and
  Trade's results. Nothing else changed shape; `.pic img.ref` sizes every
  image; no new CSS rule.
- **The four unsized thumbnails** — the Decks list's Leader, the Trade and
  Wants rows, the Play board's Leader button — carry the `pic` class now
  (and `position:relative` where the inline style lacked it), so the same
  rule sizes them. Landmine 132.
- **Watched fail first:** on the unchanged take-92 build the new smoke
  section went red at its first line (no `cardPic`) and died at
  `V.paintSearch` (not exported), then the rebuild: **615 passed, 0
  failed** — cardPic's shape and its no-image control, setPic on a set with
  a box and on one without (the control), a picture per search hit, a box
  per set in the browse, a deck row's picture between cost and name, a
  picture per other printing on the card sheet, Home's top list and set
  progress, the Decks list's box, the re-classed thumbnails in the shipped
  source. The DOM render: 10 passed.
- **In Chrome, on the runner:** nine assertions — a box per search hit
  with every image inside its box, the 36 × 50 box and a one-line row, no
  sideways scroll on the Search screen at 360/412/673/820, the Decks
  list's Leader image filling its box exactly (the landmine-132
  measurement), a deck's card rows with a picture each and no sideways
  scroll, and the control: a printing with no image draws the labelled tile
  and no `<img>`. **The first run (check run 11, head e1e1dce) was red on
  exactly one: the search row drew 117 px tall.** Every hit had its box, every
  image fit; but `.row` aligns its items on the *baseline*, so a 50 px box
  with no text put the name's baseline at the box's bottom and the row
  stretched under it. The measurement caught what the markup assertions
  could not — landmine 69's lesson again. The seven rows that gained a
  picture are centred now (`align-items:center` on the row, as `.dkrow`
  always was); Hunt's rows, seen and accepted on the Fold, are untouched.
  **The second run (check run 12, head c766977) was red on the same line at
  83 px** — and that was the assertion's fault, not the row's: the first
  hit's subtitle (a long set name and a provenance) wraps to three lines,
  65 px of text beside a 50 px picture. A fixed "≤ 72" pinned a number to
  text the test does not control — landmine 62's shape. The assertion now
  says the honest thing: the row is no taller than its tallest child plus
  its own padding, so the picture sits beside the text, never under it.
  **PROVEN on the runner (check run 13, head 3eaf2eb, 02:58 UTC): render
  90 passed, 0 failed (mode: chrome)** — 81 before, the nine new green,
  the landmine-132 measurement included; smoke **615 passed, 0 failed**
  there too; **GATE PASSED**, hash coverage 100.0%, pipeline 29 s with the
  hashes step this VM could not run. Three runner cycles for one take: two
  of them the harness learning what a row is, which is what a harness is
  for (landmine 69).
- **The ledger corrected:** PROVISION's "two entries" and "in the gate",
  PROTOCOL §8's control 1, and a parenthetical on landmine 28 — the gate
  checks that a host is declared; the purpose is prose.

### DEFERRED this cycle

- **How the sizes and the set-box choice look on the Fold** — the owner's,
  after installing; the next look decides the sizes.
- **The blank-after-Back** — no record yet since take 91's install.
- The three hosts; More in the nav (design, the owner's); the rest of the
  Priorities order.

## Take 92 — 2026-09-23 — the first paste: the events source changed shape six days ago, and the self-test's one FAIL was its own

Opened before any code (PROTOCOL §6). Take 91 merged at 02:11 UTC (PR
#15, merge commit aa3c885); build run 39 green, Release take-91
published; the owner installed it and **the first Diagnostics report ever
arrived** (take 91, 02:19 UTC — screen stack `settings > diag`, so More
and Diagnostics open on the Fold: PROVEN). Read as data, it named three
things. The blank-after-Back has not recurred since the install (*last
errors: none*) — still UNKNOWN, now recordable.

### What the paste said, and what each line turned out to be

- **`events.json: HTTP 404` and `stores.json … 6 days ago`; events and
  stores on the phone: none.** MEASURED live from this VM: the roster on
  Pages carries `fetched_at 2026-09-17T02:02:42Z`; `events.json` is 404.
  **The hourly's own log (run 37, 00:31 UTC) says why:** `stores: FAILED
  KeyError: 'events' (kept the last roster)`. **PROVEN by a live probe:**
  `onepieceevents.com/data/evnt_us.json` is now a 1.1 KB chunk index —
  `format: chunked-events-v1`, `metadata`, `chunks` — where it used to be
  `{"events": [...]}`; `roster.fetch_events()` indexes `["events"]` and
  raises. Every run since 09-17 has failed there and kept the 09-17 roster.
  **And the failure branch drops the events table:** it rewrites the kept
  roster only, so the first deploy after the change lost `events.json`
  and, with no live copy to carry, nothing could bring it back. Six days
  of Local on a stale roster and an empty Events screen under a **green**
  workflow. Landmine 130.
- **`FAIL OCR reads a code the app drew (ML Kit) — read "OP01-016"`.**
  ML Kit read the drawn code exactly. The check asserts `m.num ===
  'OP01-016'`; `parseRead` returns `{ number, raw, sp }` — no `num`. A
  false FAIL on every phone since take 45, and smoke marks that check
  SKIP in node, so the comparison never ran in the harness. Landmine 131.
- **`build: ?`.** The manifest's key is `built_at`; About and Diagnostics
  read `built`. About has shown *built* followed by nothing.
- **Also in that log, not this take's:** the one verified Shopify storefront
  answered 503 to the runner; Target 48329 returned 435 after 7 calls (the
  take-71 throttle rule, handled). And **the "hourly" workflow ran six
  times in the last day** (04:53, 09:56, 14:51, 18:53, 22:07, 00:31 UTC):
  GitHub delays a public repo's cron; the app's *checked N ago* labels
  stay honest, the word "hourly" in the ledgers is the schedule, not the
  cadence.
- **Ruled out: the roster fetch being blocked** — the host answers 200
  from the runner (the log shows a KeyError, not an HTTPError) and from
  this VM. **Ruled out: an app-side cause for the empty Events** — the
  app fetches `events.json` when it has none; the file is not there.

### This VM (MEASURED 02:25 UTC)

The three package hosts answer 403 as at takes 89–91; no pillow, no
puppeteer; acorn linked. Same route: smoke and the DOM fallback here, the
runner's `check` as the gate, a draft PR marked ready on green, no vendor
trailer. `onepieceevents.com` is reachable from here, so the new parser
can be proved against the live index before it ships.

### Built, and proved where it could be

- **`tools/hunt/roster.py`:** `parse_index()` accepts the two shapes the
  source has had — `{"events": [...]}` and the chunk index — and raises on
  anything else; `join_chunks()` concatenates in index order and refuses a
  chunk that carries fewer events than the index promised (AGENTS rule 8);
  `fetch_events()` walks the chunks one call a second. Fixtures: the real
  index of 2026-09-22 (1.1 KB) and the real first chunk trimmed to three
  events (2.4 KB). Selftest: the index parses to its three files with their
  counts; the old shape still parses; chunks join and a real chunk's records
  build a roster; controls — a third shape, a chunk entry without a file, an
  empty chunk list, a chunk short of its count — all refused.
- **`tools/hunt.py`:** the roster step is `roster_step()`, a function the
  selftest can drive. A rebuild happens when the live roster is a day old
  **or the live events table is missing** (a lost table heals on the next
  run); a failed rebuild keeps the roster *and* the events table and says
  which roster it kept, by date. Selftest with a fetch that raises: both
  files kept; control — with no previous table nothing is kept and it says
  so; control — a fresh roster with no live table is rebuilt, not carried;
  a rebuild writes both files.
- **PROVEN against the live source, from this VM:** `fetch_events()` read
  the chunk index and its three chunks — **50,300 events in 6 s** — and
  `build()` made a roster of **3,395 stores, 108 in Michigan, 19,369 event
  rows in the next 31 days, 13 titles** (take 74 measured 12,334 events
  and ~50 Michigan stores; the source covers more now). The hourly's first
  run after the merge rebuilds the roster and restores `events.json`; the
  phone fetches a day-old table when Events opens.
- **`src/app.html`:** the self-test compares `m.number`; About and
  Diagnostics read `built_at`. Smoke: the OCR check PASSES an injected
  correct read and FAILS a wrong one (the control); the diagnostics build
  line equals the manifest's `built_at`. **603 passed, 0 failed** here.
- `hunt.py --selftest` green, all 39 lines; the gate runs it.
- **PROVEN on the runner (check run 9, head ff0ff68, 02:33 UTC):** smoke
  **603 passed, 0 failed**; render **81 passed, 0 failed (mode: chrome)**;
  **GATE PASSED**, hash coverage 100.0%, pipeline 26 s with the hashes
  step this VM could not run.

### DEFERRED this cycle

- **The blank-after-Back** — no record since take 91's install; the next
  paste that shows one names it.
- **The Shopify storefront's 503 from the runner** — one store, one
  observation; watch the next runs before calling it a block.
- The cadence of the hourly — GitHub's, not ours; the labels are honest.
- The three hosts; the rest of the Priorities order.

## Take 91 — 2026-09-23 — More opens again: unreachable since take 83; the diagnostics survive a restart

Opened before any code (PROTOCOL §6). Take 90 merged at 01:33 UTC (PR
#14, merge commit fa85758); build run 38 green, Release take-90 published.
The owner's message was to carry the diagnostics paste and carried one
sentence instead, on what he believes is take 88: *"more, settings, export,
and etc buttons do nothing … clicking more takes me back to the top of the
main page."* That sentence was enough.

### The cause, read off the code twice (INFERRED, line-exact; PROVEN below)

- **No mode's bottom nav has a More button.** The ways in are Home's
  bottom link — `<button data-go="settings">More · settings, export,
  sources</button>` — which is the label the owner was reading out, and
  the gear on Decks. Hunt has no way in at all.
- **`<section id="settings">` is not in the markup.** `paintSettings()`
  creates it on its first run. Since take 83, `go()` checks that the id
  names an existing `<section>` *before* it paints anything; a missing one
  is refused: a `nav` record, `id = MODE.home[MODE.cur]`, Home toggled on,
  `window.scrollTo(0, 0)`. The owner's words exactly. `paintSettings` is
  never reached, the section is never built, every tap repeats it.
- **So More has been unreachable on every build since take 83** — eight
  takes, in Chrome as much as on the Fold — and with it Export, Backup,
  Restore, Sync now, Currency, the self-test, About and the ×5 gesture to
  Diagnostics. The ledger asked the owner for a paste three takes running
  from a screen he could not open; `ci/RELEASE.md` sends every tester to
  *More → Self-test* in its first lines. Nobody could have followed it.
- **The error buffer is memory-only.** Every record — the watchdog's
  included — dies at restart, so a paste after a relaunch would have said
  *none* anyway.
- **The take-86 entry is wrong against the code.** It says the watchdog
  runs "after any navigation, hardware back or history back"; the code runs
  it in the `finally` of the hardware-back and `popstate` handlers only.
  Landmine 129. The entry stands as written; this one corrects it.
- **No test drives that link.** Smoke taps the Diagnostics gesture directly
  (`V.DIAG.tap()`); render clicks nav buttons only. A section that builds
  itself is invisible to any sweep over `.screen`. Landmine 128.
- **Ruled out:** an Android-only cause (Chrome bounces the same way); a
  boot exception (Home paints and the `data-go` delegate works); a plugin
  chain throwing (`PLATFORM.plugin` null-checks and try-wraps); WebView
  syntax (one `||=`, three lookbehinds; a current WebView parses them).

### This VM (MEASURED 2026-09-23 01:45 UTC)

The three package hosts answer 403 as at takes 89 and 90; no pillow, no
puppeteer; acorn is the global copy linked at take 90. Same route: smoke
and the DOM fallback here, the runner's `check` as the gate in Chrome, a
draft PR marked ready on green, no vendor trailer.

### Reproduced, then fixed (PROVEN in this VM, on the shipped app.js)

- **The reproduction, before the fix — smoke on the built take-91 app:**
  `go('settings')` left the screen stack at `sealed>home` and wrote
  `go() called with no screen for 'settings'` into the buffer; `#settings`
  did not exist; the gear on Decks did the same. Eight assertions red, 592
  green. Watched fail on purpose (AGENTS rule 2). The take-83 assertion
  (an id with no screen lands on Home with a record) is this block's
  negative control and stays green on both sides of the fix.
- **The fix:** `<section id="settings" class="screen"></section>` is markup
  beside the other screens; `paintSettings()` no longer builds it (the
  create-on-demand branch is gone). `ERRS` keeps its twenty records in
  `vault.errs` — written on every push, read at creation, a corrupt value
  loads empty. `DIAG.report()` prints them as before, so a paste after the
  relaunch that follows a blank screen carries what happened before it.
- **After the fix:** smoke **600 passed, 0 failed** — the eight new: More
  is reached from Home and from the Decks gear with no record, the section
  is a `<section>` in the markup, its rows paint (About, Export CSV,
  Sync), a pushed record lands in storage, a fresh load reads it back, a
  corrupt buffer loads empty (the control). Render's DOM fallback: 10
  passed, markup only.
- **In Chrome, on the runner only:** five assertions — Home's More link
  opens `#settings`, the heading and the About line carry the take, the
  Self-test, Sync and Export rows exist, five taps on About reach
  Diagnostics, and the take-83 guard still bounces an unknown id with a
  record (the control). **PROVEN on the runner (check run 7, head
  caf547f, 02:06 UTC): render 81 passed, 0 failed (mode: chrome)** — 76
  before, the five new all green on the first run; smoke **600 passed, 0
  failed** there too; **GATE PASSED**, hash coverage 100.0%, pipeline 34 s
  with the hashes step this VM could not run. The receipt is the run's
  `render` artifact. More opens in a real DOM for the first time since
  take 83.
- **The build here** as at take 90: acorn linked from the global copy, no
  `hashes` step (no pillow), no Chrome; `www/ take 91`.

### DEFERRED this cycle

- **The blank-after-Back cause** — still UNKNOWN. Take 91 makes the
  diagnostics reachable and persistent; the first paste names it.
- **A More button in the nav** — Hunt mode has no way to More at all; a
  design question for the owner, not this fix.
- The full rebuild and Chrome render in the session VM — the three hosts.
- The rest of the Priorities order.

## Take 90 — 2026-09-23 — the set chips return their cards; the VM still cannot rebuild

Opened before any code (PROTOCOL §6). The first product change of the
branch flow: one bug, A36, the first item in the session's Priorities
block. No diagnostics paste has arrived, so nothing else moved.

### Read first, on the runner's own record

- **Release take-89 exists (PROVEN, read off the API):** APK and AAB
  published 2026-09-23 00:22 UTC by the merge build (run 37, green).
- **The 09-22 scheduled nightly was red — on the tree BEFORE the merge
  (PROVEN, run 36, 23:41 UTC, head d0b2c91):** `hashes: 20/77 images
  failed (26.0%)`, landmine 124's exact shape on the unfixed guard. The
  merge build on the same night's data passed twenty minutes later and
  committed the sidecar (60358dc, `catalog/hashes.json` only; run 36 had
  already pushed the prices before it died). Zero open issues: #8–#12 are
  closed. **The first true post-merge nightly is tonight, 21:30 UTC** —
  unread until it runs; the owner's item to confirm.
- **The tree at 60358dc is the take-89 tree plus one sidecar commit**, so
  the runner's green at run 37 is the "green before any change" of
  PROTOCOL §0 step 3 for this take. This VM could not repeat it (below).

### This VM (MEASURED 2026-09-23 00:50 UTC)

`registry.npmjs.org`, `pypi.org` and `files.pythonhosted.org` answer 403
again — they sit on the proxy's no-proxy list and the direct route is
refused; `npm view` and `pip index` fail the same way. No pillow on any
python here, so `hashes.py` refuses to run; no puppeteer, so `render.mjs`
can only run in DOM mode and the gate's render receipt (landmine 112)
cannot pass here by design. What is here: `acorn 8.16.0` in the npm cache
(an offline install), Chromium under `/opt/pw-browsers` with nothing to
drive it, and `tcgcsv.com`, the image CDN, the rates mirror and Pages, all
reachable. The owner's item 1 — open the three hosts — stands.

**The owner's decisions, asked before any code:** the take ships as a
**draft PR** whose `check` run on the runner is the gate in Chrome —
nothing is marked ready for review until that run is green — and commits
carry no vendor trailer (AGENTS; the scrubber's marker; take 89's own
commits).

### A36 — the cause, read then run

- **The chip handler pushes a string; the filter compares an int.** A
  `dataset` value is a string whatever went in: `c.dataset.fv` is `"17675"`,
  `p.set` is `17675` (the bundle emits `group_id`; `CAT.sets` is keyed by
  int), and `f.set.includes(p.set)` is strict. So every row failed the set
  test, the sheet said *0 cards*, and on reopening the chip drew unlit
  because its `on` test compared the same string with the int from
  `bySet`. Tapping the lit chip again could not un-select it either:
  `indexOf` of the string found the string only if the string was what
  was stored — and the browse-set path (`+b.dataset.browseSet`) stores
  ints, so a saved filter could hold either or both.
- **`set` is the only numeric facet.** `rarity`, `color`, `type`, `treat`,
  `cond` are strings on both sides; `min`/`max` go through `parseFloat`.
- **No test drove the chip.** Smoke built its filters by hand since take
  11 (the right type, always); render opened the sheet and never clicked
  a chip. Seventy-eight takes. Landmine 126.
- **Ruled out: comparing as strings on both sides** (take 89's sketch).
  It leaves two writers with two types and the toggle-off `indexOf` still
  wrong for one of them. Ints are the set's identity everywhere else in
  the file (`+st.dataset.bnset`, `+b.dataset.setpick`), so the chip
  coerces at the DOM boundary and a saved filter is normalised to ints
  when it loads.

### Reproduced, then fixed (PROVEN in this VM, on the shipped app.js)

- **The build that could run:** `acorn 8.16.0` linked from the global
  eslint copy into `node_modules` (the offline `npm install` refused —
  it wants the whole package tree from the cache and the cache holds only
  acorn), then `pipeline.py ingest history catalog validate app`:
  TCGCSV still serving 09-22, 6,766 hashes restored from the sidecar,
  coverage 100.0% of reachable, `www/ take 90`. No `hashes` step (no
  pillow), no Chrome.
- **The reproduction, before the fix — smoke on the built app:** the real
  `#filters` click handler, handed a chip whose `dataset.fv` is the string
  a DOM gives, stored `["3188"]`; `applyFilter` returned **0 of 1**; the
  sheet's count read *0 cards*. Four assertions red — those three and
  the not-yet-exported `loadFilter` — 586 green. Watched fail on purpose
  (AGENTS rule 2).
- **The fix:** the chip handler coerces the set facet at the DOM boundary
  (`NUMERIC_FACETS`, one entry; `+c.dataset.fv`); `loadFilter(scope)`
  replaces the two inline parses, guards the parse, merges over the blank
  filter and normalises the set ids to ints — so a filter saved by the
  chip before this take and one saved by the browse-set rows meet one
  comparison; a corrupt one loads blank. `applyFilter` is unchanged.
- **After the fix:** smoke **592 passed, 0 failed** — the eight new: the
  tap stores a number, the set shows its one card, the count line says
  so, a second tap un-selects, the DOM string still matches nothing (the
  control), `loadFilter` normalises `["3188","x"]` to `[3188]` keeping
  the rarity, a corrupt string loads blank (the control). The always-true
  take-11 persistence assertion (`a || true`-shaped) now reads the saved
  JSON back.
- **In Chrome, on the runner only:** seven render assertions in the
  filter-sheet block — a tapped chip's count line equals the chip's own
  count, the stored id is a number, the chip is lit, Show draws exactly
  that many tiles in `#colGrid`, the chip is still lit when the sheet
  reopens, a second tap un-selects with every card back, and the string
  shape as the control. **PROVEN on the runner (check run 4, head
  9d74309, 01:20 UTC): render 76 passed, 0 failed (mode: chrome)** —
  69 before, the seven new all green on the first run; smoke **592
  passed, 0 failed** there too; **GATE PASSED**, hash coverage 100.0%,
  pipeline 26 s with the hashes step this VM could not run. The receipt is
  the run's `render` artifact.
- **Found on the way — render's DOM fallback was dead (landmine 127):**
  it threw on `window.addEventListener` at boot, the error buffer's
  registration from take 82, because the DOM context never had the stub
  smoke's has. Eight takes of Chrome hid it. One line; **10 passed, 0
  failed (mode: dom)** here — markup only, and it says so; the gate still
  refuses that as a receipt (landmine 112), correctly.
- **`.gitignore` gains the rest of `www/`** — the subset fonts, `hunt/`,
  `privacy.html`, `render.png`: `build_app.py` writes them and only
  `bundle/`, `app.js` and `index.html` were listed, so the first build
  in a git checkout left six untracked files a careless `git add` would
  have shipped. Named paths are the rule; the ignore is the guard.
- **The scrubber** is clean over the ledgers; `catalog/rates.json`, which
  the app build refreshes, is restored — only the seed drops ever
  committed it and it is not this take's.

### DEFERRED this cycle

- **The full rebuild, the Chrome render and a bare green gate in the
  session VM** — the three hosts, the owner's item 1; until then the
  runner's `check` is the only place the gate runs whole.
- **Tonight's nightly** (21:30 UTC) — the first since the merge; read it
  if the session is still up, otherwise the owner's.
- The Priorities order, unchanged: whatever the diagnostics paste names,
  A33 item 6, A32's remaining sources, A23's tail, A31.

## Take 89 — 2026-09-22 — the repo works on a branch and a PR; four red nights read; the gate green again

Opened before any code (PROTOCOL §6). The first take made with git rather
than a seed zip: the session works on a branch, opens a PR titled *take N —
…*, the owner merges, and the merge to `main` runs `build.yml`, which
publishes Release take-N and deploys Pages. No product changes.

### Read first, on the runner's own record

- **Four red nights, not one (MEASURED, Actions runs 32–35).** 09-18, 09-19
  and 09-20 died in `smoke`: the Events fixture carries only 09-16 and 09-17
  dates, `hunt.py --from-fixtures` builds it with `now="2026-09-01"`, and
  smoke ran the app on the real clock (the host `Date` handed to the vm
  context), so from 09-18 `EVENTS.rows()` was empty and `icsFor(undefined)`
  threw. 09-21 died one step earlier, in `hashes`: 18 of 69 new images
  failed, 26.1%, over the 20% guard — so smoke never ran and the fixture's
  expiry hid behind it. Landmines 123 and 124.
- **The prices are safe (PROVEN in the run-35 log):** `bundle.sh` records
  and pushes the day's prices before the pipeline; 10 days on file on
  `main`, 11 on the live Pages manifest, which the hourly `hunt` workflow
  keeps fresh (take 88, source 2026-09-22). What stalled since 09-17: the
  Release assets and the nightly's own Pages deploy.
- **Four open issues for one failure (MEASURED, #8–#11).** The label
  `nightly-failure` never existed, so `gh issue create --label` failed, the
  fallback created an unlabelled issue, and the next night's `gh issue list
  --label` found nothing to append to. Landmine 125.
- **`branches: [ main ]` is live (PROVEN):** the owner's commit d0b2c91 on
  09-22, before anything here. `ci/build.yml` lacked the line (drift; fixed,
  and the gate now compares the copies). Landmine 122 records the hazard.
- **Node 20 (PROVEN from the logs):** the `v4`/`v5` actions already run
  "forced to Node 24" with a warning; nothing broke. The bump is hygiene.
- **The image CDN still refuses id 718642 (MEASURED 23:14 UTC from this
  VM):** the guard would fire again tonight without the fix below.
- **AGENTS named `signing/vault.keystore`;** the file, `ci/apk.sh` and the
  gate say `signing/optcghub.keystore`. Fixed.
- **The set chips in the filter sheet return zero cards (INFERRED from the
  code, unreproduced):** a chip pushes `dataset.fv`, a string, and
  `applyFilter` asks `f.set.includes(p.set)` with `p.set` an int; the chip's
  `on` state and the saved filters share the mismatch. A product change, so
  not this take — A36.

### This VM

`registry.npmjs.org`, `pypi.org` and `files.pythonhosted.org` answered 403
(MEASURED with curl and `npm view`), and the proxy denied
`storage.googleapis.com` (puppeteer's Chrome download). Reachable:
`tcgcsv.com`, the image CDN, `api.frankfurter.dev`, Pages. The owner opens
the first three; Chromium is preinstalled and puppeteer takes it through
`PUPPETEER_EXECUTABLE_PATH`, so the fourth is not needed. The Ubuntu
archives answered 403 too, so no `apt` route either. Until the hosts are
open there is no rebuild, no Chrome render and no gate — and nothing ships
on an unrun gate. What could run here, ran: every new guard's controls
(`hashes.py --selftest`, `check.sh --selftest`, `gate.py --selftest` with
the two new probes, the seal's refusal of an output folder inside the
tree, `git check-ignore` on a seed zip), the scrubber over the ledgers, and
every gate check that needs no build.

**The push of `.github/workflows/*` from the session was accepted
(PROVEN, 23:40 UTC):** the GitHub App holds the Workflows permission, so
the workflow files travel in the PR and the paste in RUNBOOK §5b is the
fallback only. The branch push started no workflow run (PROVEN on the
Actions tab) — landmine 122's fix holds.

### The runner as the clean run (PROTOCOL §6b)

The owner opened PR #13 from the app and its first `check` run (00:08
UTC, 09-23) was the clean run this VM could not do: a fresh checkout, only
`ci/deps.sh`'s installs, the pipeline from ingest. What it PROVED:

- **The hashes guard, on the real night's data:** *220 images known to be
  unavailable — retrying 220; canary: served (3 known-good images); new
  77: hashed 57, unpublished 20 (recorded), failed 0; retried 220: hashed
  21; 6 s.* The 20 unpublished ids no longer stop the pipeline — and **21
  of the 220 "known unavailable" images were there all along**; nothing had
  asked since the night they first failed. Coverage 98.8% of reachable.
- **The runner-owned-files guard** ran on the merge commit and passed.
- **The Events block under the pinned clock passed on the runner** — the
  three-night failure is gone — and so did the rest: **582 passed, 1
  failed.** The one: the take-35 assertion that read `bundle.sh` for the
  literal install line, which take 89 moved into `ci/deps.sh`. My miss: I
  had read `smoke.mjs` for the events block and not for every assertion
  that reads a CI script. The assertion now reads `deps.sh`, and a second
  one asserts that `bundle.sh` and `check.sh` both call it and that
  `hunt.yml` installs the parser itself — the guard take 84 deferred.
- **The rerun (check run 2, 00:11 UTC, head 852fd64) is green:** smoke **584
  passed, 0 failed**; render **69 passed (mode: chrome)** with the receipt
  uploaded as the run's artifact; **GATE PASSED** — 23 checks, hash
  coverage 98.8%; `pipeline complete in 24s`. The runner's hashes pass
  also warmed the sidecar by 78 images (57 new + 21 retried); the nightly
  on `main` commits that, the PR check never does.

**smoke.mjs 584, render.mjs 69 (Chrome), gate 23 checks — on the runner.
Gate green; PR #13 open, its check green.**

### Built

- **The smoke clock.** The Events and calendar block runs under a `Date`
  pinned to the fixture's own window and restores the real one after.
  Control: the same rows under the real clock are empty once the fixture's
  last date has passed — the runner's exact failure, asserted live against
  live.
- **The hashes guard.** A canary of three already-hashed images proves the
  CDN is serving us before the batch; an HTTP 403 or 404 is *not published*
  — recorded as missing, not counted toward the 20% rate; timeouts, 5xx and
  undecodable bytes still count; and every missing id is retried each run,
  so a printing whose image arrives later is hashed later. Controls in
  `hashes.py --selftest`, run by the gate.
- **The failure issue.** The label is created before it is used, so one
  thread carries every red night; a green night closes it.
- **The seal.** `seal.sh --gate-only` for the PR flow: stamp, the gate
  unpiped, no zip. The zip path refuses an output folder inside the tree
  (control: pointing it at `.` exits non-zero), and `.gitignore` carries
  `optcghub-seed*.zip` so a stray zip can never be committed and unpacked
  over the tree by the seed job.
- **The gate** compares each `ci/*.yml` with its live copy under
  `.github/workflows/` when that directory exists (an unpacked seed has
  none). Control: the one-line drift found today.
- **CI.** `ci/deps.sh` holds every install once; `bundle.sh` (the nightly)
  and the new `ci/check.sh` (the PR check) both source it — landmine 121.
  `check.yml` runs the whole pipeline on every PR to `main` with
  `contents: read`, its own concurrency group, no commit, no Pages, no
  release, and refuses a PR that carries `catalog/prices_daily.json` or
  `catalog/hashes.json` (landmine 116: the runner is the record). Action
  majors moved to the lowest major whose `action.yml` says `node24`, each
  read at its tag (PROVEN): checkout v5, setup-node v5, setup-python v6,
  setup-java v5, cache v5, upload-artifact v6 (v5 is still node20),
  download-artifact v7 (v5 and v6 still node20), deploy-pages v5, and
  upload-pages-artifact v5 — a composite whose inner upload-artifact is
  v7.0.0 (v4's inner is v4.6.2, node20); its new `include-hidden-files`
  default drops dotfiles, and `www/` has none. The `action.yml` diffs from
  the tags in use to these carry only the runtime line, apart from added
  optional inputs (setup-node's `package-manager-cache` is a no-op here:
  `package.json` has no `packageManager` field). Newer majors exist and
  were not taken: their changes are unread.
- **The ledgers** say the branch flow: AGENTS, PROTOCOL §0, RUNBOOK §5b/§6,
  NEW-SESSION-PROMPT, V1-STATE, PROVISION. The seed path stays documented
  as the recovery route.

### DEFERRED this cycle

- **A36, the set chips** — reproduce in Chrome first, then compare as
  strings on both sides and migrate the saved filters.
- **Closing issues #8–#10 by hand** — the owner's; #11 is the live thread.
- **The Priorities block**, in its order, once the diagnostics paste is in.
- The vendor-name question for git metadata (branch name, trailers) is the
  owner's; the scrubber cannot see git metadata.

## Take 88 — 2026-09-17 — the audit the owner asked for

Opened before any code (PROTOCOL §6). No code changed.

### The clean run

The take-87 seed, unpacked into an empty directory, every pipeline step from
`ingest` to `gate`: 5 price days on file, 17 stock decks, 2,172 effect lines
scripted, smoke 580, render 69 in Chrome, gate green. The tree does what
the record says it does.

### The record, read against the tree

- **AGENDA** leads with a *Priorities* block now: the owner's items that
  gate everything (push, the diagnostics paste, D20–D22, shop URLs, D7,
  D16, the `.aab`), then mine in order (the diagnostics' answer, A33 item 6,
  A32's remaining sources, A23's tail, A31, the two standing offers), then
  what closed since take 57 and what is marked stale. Thirty-five items
  below it are the history of each.
- **LANDMINES** gains three that had lived only in HANDOFF entries: 119
  the sub-16px input that zooms the page and hides a sheet; 120 two
  workflows deploying one site; 121 a workflow depending on the other's
  installs. The index and the session prompt's count follow.
- **V1-STATE, RUNBOOK, PROVISION, NEW-SESSION-PROMPT** were re-read; each
  says what the tree does at take 87. PROVISION names every host the app or
  the runner touches, including the four added since 57 (Target, the events
  file, the Census gazetteer, the rates mirror, the storefronts).

### What the audit did not do

It did not re-verify the device-side claims (export share sheet, ads,
notifications, the camera on the Fold) — those are the owner's and are
marked INFERRED where they stand. It did not shorten HANDOFF (5,100 lines);
the record does not edit itself.

**smoke.mjs 580, render.mjs 69 (Chrome). Gate green, sealed bare.**

### DEFERRED this cycle

- Everything in the Priorities block, in that order.

## Take 87 — 2026-09-17 — the fourth look, part two: decks, events by store, MAX behind an ad, and two more notes

Opened before any code (PROTOCOL §6).

### The owner's further notes, checked

- **"Can't collapse EB03 or Dominance of God; pictures update when I tap."**
  The take he holds (85) force-opened the two newest sets whatever was
  tapped, so a tap repainted and nothing closed. Take 86 replaced that
  logic; verified in Chrome: a header tap on the newest set removes its
  rows. Fixed before it was reported, by luck of order.
- **"Sim boxes run off the screen."** Verified: the deck select's right edge
  at 464 px on a 396 px panel — the take-82 control styling let a select
  take its intrinsic width. `select{max-width:100%}`.
- **"Back to a blank page under any sub-menu, not always, better under
  Collect and Play."** The take-86 watchdog now heals it and writes the
  trigger, stack, overlays and mode to the error buffer; Diagnostics is
  reachable since 86. The next paste names it.

### Built

- **MAX behind a rewarded ad.** The badge reads *AD*; tapping MAX offers
  *Watch an ad · about 30 seconds* / *Not now*; the reward unlocks MAX for
  **24 hours** (the owner's duration unasked; a day is the default until he
  says otherwise); any rewarded unit serves; where there is no ad plugin —
  the browser, a dev build — MAX simply opens. The reward listener routes a
  max ad to the unlock, not to scan credits.
- **Starter decks, their own section** at the top of Sealed: every deck
  product newest set first, with pictures, prices, the Target line and the
  stock bell; collapses like a set.
- **Events by store.** Each store once, nearest first, with address, miles
  (exact — no tilde — where the file gives the point), a **Call** button and
  a Note; its next events beneath with fee, seats, Register and +cal; a
  horizon of 7 / 14 / 31 days, two weeks the default.
- **Phones and exact points for all 2,967 stores**, from the events' raw
  records (`phone_number`, `place_geo` as `{x: lat, y: lng}` — MEASURED on a
  Nebraska store before trusting it). Local's shop rows get the Call button
  and the exact distance too.

**smoke.mjs 580, render.mjs 69 (Chrome). Gate green, sealed bare.**

### DEFERRED this cycle

- **The audit take (88)**: a clean run from an empty directory, every
  ledger read against the tree, landmines checked for currency, the agenda
  reordered — the owner's ask, after this cycle of fixes.
- The MAX duration, if a day is wrong.
- The owner's list: push t87; the diagnostics paste; shop URLs; D20–D22.

## Take 86 — 2026-09-17 — the fourth look, part one: what hid, what wrapped, what went blank

Opened before any code (PROTOCOL §6). A35 filed with all thirteen first.

### Measured first

The Events list the owner called insane is **real**: every one of the ten
distinct titles in the source is a One Piece event, twelve of 12,334 name
another game (Bandai Card Fest retail slots), and Michigan's 96 stores run
3.9 events a month each — the weekly store tournament. So the Events fix
(take 87) is grouping, not filtering. The same records carry a **phone
number and exact coordinates per store**, which answers the Call button and
the ±10-mile distance at once.

### Built (items 1, 3, 4, 5, 6, 8, 9, 11, 12, 13)

- Every screen ends with room for the bar (66 + 34 px + the safe area), so
  the last control on Home, More, Sealed — Diagnostics included — is never
  behind it. This is what kept the owner out of Diagnostics.
- The opening screen lingers 1.6 s (from 0.6).
- Sealed opens every set; the header is a title with a chevron, the count
  gone; a tap collapses one.
- The Target panel: *Checked 10 min ago · 56 One Piece products online, 0
  in stock to ship · 9 are the Japanese version. Target limits how often it
  can be asked; the next hourly check continues where this one stopped.*
- A photo that fails is retried once without the `_200w` size suffix, then
  removed to the tile (the owner's EB03 packs).
- Releases rows: the title wraps, date and countdown at the right, Details
  on its own line inside the row.
- The Portfolio caption in the heavy face, spaced, in the darker accent.
- Pills never wrap ("4 requests" was on two lines).
- **The blank page, again, and a watchdog.** The take-83 guard did not
  fire, so the path is not `go()`. The watchdog watches the DOM: after any
  navigation, hardware back or history back, if no screen is on it puts the
  mode's home back and records the trigger, the stack, the overlays and the
  mode in the error buffer. Heals the symptom; names the cause next time.
- Diagnostics adds: screens on, overlays on, whether the splash is gone, the
  currency and its rate date, stores in the collector's zip area.

### Findings

- The DOM stub answers every class selector with a dummy element, so "no
  screen on" was invisible to it until the test made `.screen.on` answer
  null. Twice now the stub's shape has decided how a guard is asserted.
- The splash check in render measured from wherever the run had left the
  page; it now reloads first. A timing assertion needs its own clock.

**smoke.mjs 574, render.mjs 69 (Chrome). Gate green, sealed bare.**

### DEFERRED this cycle

- **Take 87**: starter decks as their own section in Hunt (2); Events
  regrouped by store with phone and exact position (7); MAX behind a
  rewarded ad, the FREE badge gone (10).
- The Back cause — read from the diagnostics when it recurs.
- The owner's list: push t86; shop URLs; D20–D22.

## Take 85 — 2026-09-17 — a display currency, and an opening screen

Opened before any code (PROTOCOL §6).

### The owner's asks

Currency options for Hunt and Collect, fewer than the reference app's
fifteen if space is a cost; and a very quick loading screen for a premium
feel — short and sweet.

### Built

- **Rates.** `tools/rates.py` fetches the ECB reference rates USD→CAD, EUR,
  GBP, AUD, JPY, MXN, CHF at build time, keyless (frankfurter.dev, PROVEN:
  `2026-09-16`, EUR 0.867), caches them as `catalog/rates.json`, and they
  ride in the manifest with their date; a failed fetch ships the sidecar's
  rates marked stale; no rates means USD only with the other choices greyed.
- **The converter.** `money()` converts at the day's rate and marks every
  non-USD figure **≈**; yen shows no cents; an unknown or unrated code falls
  back to USD; the choice is kept on the phone. `moneyUSD()` stays for
  anything that must say the price. The picker says what a conversion is —
  the ECB rate of a named date, an estimate, not a quote (PROTOCOL §10).
- **Where.** A currency pill on Home's bar and on Sealed's bar (the
  reference app's *$ USD* spot), and a row in More.
- **The opening screen.** In the markup, so it is the first paint: the
  three-stroke mark, the word-mark in the display face, *Collect · Prep &
  Play · Hunt* — no art. The app fades it once it has drawn, never before
  600 ms (so it reads, not flickers), never after 2.5 s whatever the boot
  does. Asserted in Chrome: gone within 1.2 s.

### Findings

- Two guards fired on the seal: the markup guard (landmine 99) caught a JS
  escape in the splash's HTML text, and the scrubber caught a placeholder
  code in a test. Both correct; both fixed at the source.

**smoke.mjs 565, render.mjs 68 (Chrome). Gate green, sealed bare.**

### DEFERRED this cycle

- **More currencies** if asked — the list is one line in `rates.py` and one
  in `CUR.list`.
- **A currency on the collection's own snapshots** — history stays USD; a
  converted chart would need a rate per day. Not asked; noted.
- The owner's list: paste `hunt.yml` (take 84's), run it, push t85, test.

## Take 84 — 2026-09-17 — the hourly workflow could never have run: one install it forgot

Opened before any code (PROTOCOL §6).

### What the owner showed

Actions → hunt: *This workflow has no runs yet*, a workflow_dispatch button.
So the paste is right and the cron has not fired — GitHub often delays a
new schedule's first run by an hour or more. But reading what the first run
would do: the `app` step strips comments through `acorn`
(`scrub.py --strip`), which `bundle.sh` installs and `hunt.yml` never did.
The first run would have gone red at `app` and the owner would have been
told to paste again anyway. Landmine-shaped: a workflow that depends on a
tool the *other* workflow installs.

### Fixed, rehearsed

`hunt.yml` sets up Node and installs `acorn` itself. **Rehearsed as the
runner will see it** — the take-83 seed unpacked into an empty directory,
no `node_modules`, only the workflow's own two installs, then its exact
commands: the app built, the roster rebuilt (2,960 stores), 11,148 events,
Black Vault listing seven sealed products in stock, the Target feed written.
The only difference from the runner: my IP's Target quota is spent from a
day of probing, the runner's is not.

**smoke.mjs 555, render.mjs 67 (Chrome). Gate green, sealed bare.**

### DEFERRED this cycle

- **A guard for this class**: a smoke assertion that every `npm`/`pip`
  package `bundle.sh` installs is also installed by any workflow that runs
  `pipeline.py app`. Next take.
- The owner's list: paste `hunt.yml` once more, run it by hand, push t84.

## Take 83 — 2026-09-17 — the third look: one bar, level titles, a caption, pictures, and a Back that cannot blank the screen

Opened before any code (PROTOCOL §6). A33 filed with all six first.

### The blank page after Back

The owner's screenshot: Hunt's slider and nav, no screen, no nav item
lit. That is exactly what `go(id)` does with an id that matches no section
— every `.on` removed, nothing put on. `go()` now refuses such an id: it
falls back to the mode's home and records the id in the error buffer, and
`NAV.back()` pops until it finds a real screen. **The cause is not yet
known** — no path in the code passes a bad id that I can see — so the
guard is also the instrument: the next time it happens, Diagnostics → last
errors will carry *go() called with no screen for '…'* and name it.

### Built

1. **The Portfolio line** — a small spaced caption above the name; the
   display face carries the name alone at 24px.
2. **The bottom bar** — one height (66px) in every mode; a near-black bar
   apart from all three palettes, a border tinted with the mode's accent,
   items stretching equally so four or five look the same, the accent only
   on the active item.
3. **Screen titles** — every `.bar` has one minimum height, so the title
   sits at the same level in every mode.
4. **Pictures** — `productPic()`: TCGplayer's product photo through the
   take-12 display-only path (lazy, hot-linked, silent on failure), over a
   drawn tile in the set's colours carrying the set code, which stands
   alone when there is no photo. On every Sealed row and every Releases row
   (the set's booster box). 343 of 343 sealed products have a photo.
5. **Fold headers** show a chevron, and rows shrink instead of pushing the
   stock-alert bell off the right edge — both seen in the screenshot.

### Findings

- The DOM stub built every element as a `div`, so "is this a screen" had to
  be asked of the tag (every screen is a `<section>`); the stub now keeps
  each element's tag. A guard that the harness could not see would have
  been a guard untested.
- The sandbox cannot reach the image CDN, so the screenshots show the tiles,
  not the photos; the phone will show the photos. Not asserted as a picture
  for that reason — asserted as the markup and the fallback.

**smoke.mjs 555, render.mjs 67 (Chrome). Gate green, sealed bare.**

### DEFERRED this cycle

- **A33 item 6** — pictures on Collect's rows and Decks in the same way,
  once Hunt's are seen on the phone.
- **The Back cause** — read from the diagnostics when it recurs.
- The owner's list: push t83; Actions → hunt; a diagnostics paste; shop
  URLs; D20–D22.

## Take 82 — 2026-09-17 — the 404 explained, the diagnostics the owner asked for, and the second look

Opened before any code (PROTOCOL §6).

### The 404 (PROVEN live)

Pages served `bundle/manifest.json` at 200 and `hunt/feed.json` at 404.
Two workflows deploy one site: the hourly writes the feed; the nightly
rebuilds `www/` from the tree — which has no feed — and deploys it, wiping
the hourly's files until the next :17. Fixed where the seed can carry it:
`hunt.py --carry-over` copies whatever is live under `hunt/` on Pages into
`www/hunt/` and `bundle.sh` runs it before the nightly's upload. Tried live:
*0 of 5 files carried — none live yet (has the hourly workflow run?)*,
which is itself the second half of the diagnosis: as of now the hourly has
never deployed. RUNBOOK §5c says what to check.

### Built

- **Diagnostics**, the owner's APEX-style tool, behind a secret gesture:
  five taps within 1.5 s on the *About* line in More. Runs the self-test
  and adds: app (mode, screen stack, plugins), device, catalogue (counts,
  dates, days on file), sync (the update URL and a live probe of the
  manifest), Hunt (zip, served match, radius, feed URL, **a live HTTP probe
  of every feed file with its age**, what is on the phone), storage sizes
  per key, counts never contents, the **last twenty page errors** from a
  ring buffer wired at boot, and the self-test inline. Copy, or Share as a
  text file.
- **Prep & Play is charcoal and red** — measured first (fg 14.0, dim 8.5,
  dim2 5.9, the red 4.3:1 on the card, an accent).
- **Every native control themed** — select and text fields take the card,
  the line and the accent on focus, 16px, an owned dropdown arrow.
- **The zip placeholder** is nobody's zip.
- **Releases** rows carry a visible *Details ↗* link to the set's listing.

### Findings

- The DOM stub has no `.screen` elements (`querySelectorAll('.screen')` is
  empty there), so a screen change cannot be seen by class in smoke; the
  gesture is asserted through the screen stack instead. The render suite
  sees the real thing.
- An old render assertion still expected Play's body to be felt green;
  retired with the palette.

**smoke.mjs 545, render.mjs 67 (Chrome). Gate green, sealed bare.**

### DEFERRED this cycle

- **Proving the hourly runs** — only the Actions tab can; the owner's.
- The owner's list: push t82; check Actions → hunt; shop URLs; D20–D22.

## Take 81 — 2026-09-17 — the owner's first impressions of Hunt on the Fold: one bug, three symptoms, and six fixes

*This entry was written after the code: a first pass at this take was made
and its record lost before the entry existed; the tree carried the code,
the ledgers did not. Reconstructed by diffing the tree against the sealed
take 80, then finished. PROTOCOL §6 says the entry comes first; twice now
the record has caught up to the code.*

### What the owner saw

The zip pop-up "super enlarged, couldn't see, bugging out"; after a
relaunch Hunt's colours over Collect's Home; the bottom nav "only pops up
when you click into a product"; the search bar a generic white strip; the
tour swiping two cards at a time; *Hunt* on the slider too small to read;
the phone's back button leaving the app; the screen overwhelming.

### The finding

**One bug, three symptoms.** Android zooms the page when an input smaller
than 16px takes focus. The zip sheet's input was smaller, the page zoomed,
the sheet sat off-screen and unreadable — and being a fixed sheet at
z-index 40, it also *covered the nav* for as long as it was open. Measured
in Chrome at phone size: `elementFromPoint` at the nav's centre returned
`button#askOk` inside `#askSheet.on`. The "missing nav" was the zip sheet;
tapping a product opened the detail sheet over it, which is why the nav
seemed to "pop up" then.

### Fixed

1. **The zoom**: `maximum-scale=1, user-scalable=no` on the viewport and
   every text input at 16px. 2. **Relaunch**: boot navigates to the saved
   mode's own home. 3. **Back**: `go()` keeps a screen stack; the hardware
   button (App plugin, read from its definitions) closes any open sheet
   first — the zip sheet through its own Cancel, so the pending ask resolves
   — then walks the stack, then minimises rather than exits; the browser's
   Back does the same through history state. 4. **The zip ask** is once per
   launch, not once forever, since the first ask was unreadable. 5. **The
   search bar** is themed with an icon and a brass focus border. 6. **Mode
   labels** 14px. 7. **The tour** stops on every card (`scroll-snap-stop`).
   8. **Overwhelm**: Sealed folds by set — a header with a count per set,
   the two newest open, the rest on tap, a search opens what it matches —
   and *Near you* folds into a details line.

Ten smoke assertions, one render check updated for the folded list.

**smoke.mjs 534, render.mjs 65 (Chrome). Gate green, sealed bare.**

### DEFERRED this cycle

- **The rest of "overwhelming"** — the owner asked for better filtering and
  organisation across Hunt; folding is the first cut. What to fold or
  filter next is his call after seeing this one.
- The owner's list unchanged: paste `hunt.yml`, shop URLs, D20–D22.

## Take 80 — 2026-09-16 — a focus ring, and the lint that would have saved five nights

Opened before any code (PROTOCOL §6).

### Chosen

The last two items that need neither the device nor the owner: the
keyboard focus ring A30 deferred at take 66, and the pinned-count lint
deferred at takes 56 and 58 — the guard against the class of assertion that
cost five nights of price history at take 58.

### Built

- **`:focus-visible`** — a 2px accent ring with an offset, on keyboard focus
  only; a tap or click shows nothing. Asserted in Chrome by focusing a nav
  button and reading its computed outline.
- **The smoke lint in the gate:** any assertion that compares
  `history_days`, `.days.length`, `source_updated_at`, `.market`, `.low` or
  `.high` to a literal number fails the gate, with the line named. A
  comparison between two live values passes; a deliberate exception carries
  `lint-ok`. **Control:** the two assertions that actually broke (takes 56
  and 58, reconstructed) are caught; a live-vs-live comparison is not.
  Today's smoke has none.

**smoke.mjs 525, render.mjs 65 (Chrome). Gate green, sealed bare.**

### What is left, honestly

*Mine, without the device:* nothing of size. The sim's tail (modal, ordering,
protection, opponent choices) is a take per mechanism whenever wanted; the
RELEASE.md trim and the seed-on-releases `build.yml` are standing offers.
*Mine, with the device:* national sellers from a residential IP; whatever
the first solo game and the first Hunt session show.
*The owner's:* below, in the reply.

### DEFERRED this cycle

- Everything above under "what is left".

## Take 79 — 2026-09-16 — exact distances on request; the background question filed, not built

Opened before any code (PROTOCOL §6).

### Chosen

Background stock checks were next by the list, and they are a new native
plugin, a permission and a Play review question — the kind of thing that
fails on the runner overnight if added blind at the end of a long session.
Filed as **D22** with the three honest options instead. Built in its place:
the exact-distance upgrade deferred at take 74, small and safe.

### Built

`catalog/zcta.json` (758 KB, 33,791 zips) is copied to Pages beside the
feed at build time, never into the bundle. On Local, the note that
distances are *about ±10 mi* carries *make them exact*: one tap fetches the
table once (kept on the phone when localStorage takes it, else for the
session), and from then on the collector's own zip is placed at its
centroid — within a mile or two — with the note saying so. Events use the
same placement. Four smoke assertions, including that the exact and the
area placements of 48329 agree within a few miles.

### Findings

- The area estimate for 48329 and the exact centroid put Ann Arbor at
  nearly the same distance — the 3-digit mean happens to sit close to
  Waterford. Other zips will not be so lucky; that is what the upgrade is
  for.

**smoke.mjs 523, render.mjs 64 (Chrome). Gate green, sealed bare.**

### DEFERRED this cycle

- **D22** — the owner's.
- **National sellers from a residential IP** in the sideload build — needs
  the device.
- The owner's list: push t79; paste `hunt.yml`; shop URLs; D20, D21; the
  tour check.

## Take 78 — 2026-09-16 — an event onto the phone's calendar, with no new plugin

Opened before any code (PROTOCOL §6).

### Chosen

The calendar tap deferred at take 76. No calendar plugin — a new dependency,
a permission, an Android build change — when a plain `.ics` handed to the
share sheet lets the phone's own calendar take the event, offline, with the
Filesystem-and-Share path take 34 already proved. In a browser the same
file downloads.

### Built

`icsFor(e)`: a VCALENDAR with one all-day VEVENT (the source gives a date,
not a time) — the store's address as the place, the fee, seats and
registration link in the notes, the TCG+ URL as the URL, the event's TCG+
id as the UID, commas and semicolons escaped and CRLF line ends per RFC
5545. A *+cal* button on every Events row beside *Register*. Four smoke
assertions, including that the handed-off text is byte-identical to the
generated file.

### Findings

- The first assertion looked for the store's raw name inside the file and
  failed on *DX Games & More, LLC* — the comma is escaped in the file, as it
  must be. The file was right; the test compared against the wrong form.
- The debug harness reused a stale path and fell over before the probe;
  a clean probe found the answer in one run. Debug tooling accumulates the
  same debt as anything else.

**smoke.mjs 519, render.mjs 64 (Chrome). Gate green, sealed bare.**

### DEFERRED this cycle

- **Event times.** The source has only dates; the store page on TCG+ has
  the time. Fetching per event is 11,000 requests; a time in the calendar
  entry waits for a source that carries it.
- **Background stock checks** (take 77's deferral).
- The owner's list: push t78; paste `hunt.yml`; shop URLs; D20, D21; the
  tour check.

## Take 77 — 2026-09-16 — stock alerts, named for what they do

Opened before any code (PROTOCOL §6).

### The owner's note

He is not sure about "anti-scalper alert", or at least the name. Renamed
by its use: a **stock alert** — tell me when this product is in stock at
any source the feed watches. That is what it does; the scalper is who it
beats, not what it is.

### Measured first

Seven national volume sellers probed for a Shopify `products.json`:
Game Nerdz 404, Steel City 403, Dave & Adam's 403, Collector's Cache 404,
TCG Unlimited 503, Premium Bandai 200 but not JSON, GameStop 403. From a
cloud IP, none of them is readable keylessly today. So the alert ships over
the sources that exist — Target online, a Target shelf in the served zip, a
local shop's storefront — and is source-agnostic by construction: whatever
the feed learns to read next plugs into `sourcesFor()`.

### Built

`STOCK`: a watch per sealed product, toggled from a bell on every Sealed
row; `sourcesFor(id)` lists every place the feed knows the product and
whether it is available there now; `check()` runs after every feed refresh
and **fires on the flip only** — once per source when it goes from
not-available to available, again only after it has gone out and come back
— through the same local-notification path as price alerts, or a toast where
notifications are off. A *Stock alerts* panel at the top of Sealed lists
each watch with where it is in stock and when it last fired, and says
plainly that the check runs when the app is opened.

### Findings

- The first test assumed one product would be known to both Target and a
  local shop; none was (the shop lists two sealed products, Target matched
  a third). Two watches, one per source, was the honest test.
- The smoke insertion consumed a closing brace again (take 73's slip). A
  block appended before another block's `}` needs its own — noted twice
  now, so it is a pattern: append after the brace, not before it.

**smoke.mjs 515, render.mjs 64 (Chrome). Gate green, sealed bare.**

### DEFERRED this cycle

- **Background checks.** The alert fires when the app opens and the feed
  refreshes; a check while the app is closed needs a background task
  (Capacitor's background runner) and is its own take with its own battery
  question.
- **National sellers** — retry from a residential IP in the sideload build,
  or with the store's collection endpoint once its name is known.
- The event-to-calendar tap; the owner's list: push t77; paste `hunt.yml`;
  shop URLs; D20, D21.

## Take 76 — 2026-09-16 — Events near you, and Hunt in Zoro's colours

Opened before any code (PROTOCOL §6).

### The owner's asks

Events matter to him — some give rewards, and he wants to play in one. And
Hunt should be Zoro-themed: a green tinge, elements of his palette.

### Built

- **Events.** The roster now also emits a compact table of every event in
  the next month — `[store index, date, title index, TCG+ id, fee, seats,
  release]`, titles interned (11,564 rows use 11 strings; 484 KB raw, 94 KB
  gzipped) — as `hunt/events.json` beside `stores.json`, carried over
  between runs from Pages like the rest. The **Events** screen: the
  distance dropdown, events grouped by day, each with title, store and city,
  ~miles, fee or *free*, seats, a *release* badge, and a **Register** link
  to the event on Bandai TCG+ — registration is theirs; this only points.
- **The palette.** Forest-green ground, cream text, the gold of three
  earrings as the accent, the sash's red only for a fall; MEASURED first:
  fg 13.5, dim 8.0, dim2 6.1, gold 7.4 to 1 on the card, all AA. A
  three-stroke mark of original geometry on Hunt's screen titles. No
  likeness, no art (landmine 26).

### Findings

- The events file *is* the next month: 11,342 of 12,334 events fall in the
  31-day window, so the table is the whole file made small, not a slice.
- `stores.json` is 816 KB raw and the app keeps it in localStorage beside
  the events table; under any limit today, worth a second look when the
  roster grows.
- The first Hunt screenshot looked dimmed: the zip pop-up had fired on
  first entry, as designed. Read the screenshot before reading into it.
- **`pkill` in the same command as a ledger write killed the shell before
  the write, for the second time** (take 63 was the first). Nothing landed;
  the grep-after-write rule caught it. The screenshot server now gets its
  own command.

**smoke.mjs 507, render.mjs 64 (Chrome). Gate green, sealed bare.**

### DEFERRED this cycle

- **A "your event" reminder** — a tap that puts an event on the phone's
  calendar (the Capacitor calendar path, or an .ics share).
- **Store phone numbers and hours** for the Events rows — not in the source.
- **The preorder watch** (the anti-scalper alert), still next by value.
- The owner's list: push t76; paste `hunt.yml`; shop URLs; D20, D21.

## Take 75 — 2026-09-16 — the shops' own storefronts: sealed stock and price, hourly, from the ones we can name

Opened before any code (PROTOCOL §6).

### Measured first

- **OSM (Overpass) was 503 for the fourth time today** — not a source to
  lean on for discovery.
- **Guessed domains for seven Michigan roster stores: one right.** Black
  Vault Gaming answers `/products.json`; the rest were 503s, 404s and
  connection failures — guessed wrong, or not Shopify, and no way to tell
  which from here. So discovery is a **hand-verified list**, not a guess.
- **Black Vault, paged fully: 5,000 products over twenty pages, 405 One
  Piece, only 2 sealed** — an OP16 pack ($8.99, in stock) and ST-32
  ($34.99). `product_type` ("One Piece Card Game Sealed" / "… Singles") is
  the clean filter; this store brackets its sealed titles too, so a title
  regex alone would have misfiled them. `/collections/one-piece-card-game/
  products.json` exists on this store and is tried first.

### Built

`tools/hunt/shops.py` — classify a site, fetch a store's One Piece listings
(collection first, whole catalogue second, twenty pages at most), sealed
told from singles by the store's own filing, five checks with two controls
in the gate; `hunt/storefronts.json` — the verified list, one entry today,
each with a `verified` date; the hourly run polls every Shopify entry and
matches sealed listings to the catalogue with the same matcher; the app's
Local screen lists each shop with sealed/in-stock/singles counts, its first
listings and a link into the store, and every matched product in Sealed
carries the shop's line — *Black Vault Gaming ~110 mi $8.99 · in stock
online · 12 min ago*.

### Findings

- **A store's online listing is not its shelf.** 405 One Piece products
  online and two of them sealed says the sealed stock is behind the counter,
  not on the site. The screen says so, and the owner's notes are the layer
  for it. The storefront layer is still worth having: the two it lists are
  real prices at a real shop, refreshed hourly.
- The control that assumed "bracketed number means single" was wrong for
  this store; the store's own `product_type` decides.

**smoke.mjs 501, render.mjs 64 (Chrome). Gate green, sealed bare.**

### DEFERRED this cycle

- **Growing the list.** The owner knows the shops; each needs one URL and a
  `--probe` to classify it. Crystal Commerce and TCGplayer Pro storefronts
  need their own parsers when a listed shop runs one.
- **Distance for a listed shop** comes from matching it to the roster by
  name and zip; a shop not on the roster gets none until the list carries
  its own point.
- **The volume-seller preorder watch** — the same module, pointed at the
  national retailers' Shopify stores (Game Nerdz and friends), with a *coming
  soon → preorder* flip as the alert.
- The owner's list: push t75; paste `hunt.yml`; D20, D21; the tour check.

## Take 74 — 2026-09-16 — Local: the shops that actually carry One Piece, by distance from your zip

Opened before any code (PROTOCOL §6).

### Proven before building

- **The roster is keyless and static.** onepieceevents.com publishes
  `data/evnt_us.json` (10.8 MB): 12,334 US events, each with its store's
  name, address, city, zip and state, derived from Bandai TCG+ — the system
  a store must register with to run One Piece events. Built into stores:
  **2,967 in the US, 96 in Michigan**, 2,963 with a centroid.
- **Zip centroids from the Census ZCTA gazetteer**, public domain: 33,791
  zips, 758 KB compacted, cached as `catalog/zcta.json` in the tree. The
  app ships only the 896 three-digit-prefix means (~15 KB) to place a
  collector's zip within about ten miles; the roster carries each store's
  exact point.
- Bandai TCG+'s own site is a JavaScript shell over `api.bandai-tcg-plus.com`
  (needs a session); not used.

### Built

`tools/hunt/roster.py` (fetch, build, five checks with two controls) run at
most daily inside the hourly job, carried over between runs from Pages like
the feed; `hunt/stores.json` on Pages with source and fetch time. The
**Local** screen: the distance dropdown (10/25/50/100/Any, kept), the shops
within it sorted by distance with address, ~miles and their next two events
(a release event flagged), the Target stores the feed checked for the served
zip, and **your notes** — store, what you saw, price, date, a phone that
becomes a Call link — with a *Note* button beside every shop. The screen
says what the roster means: registered to run events, not proof of shelf
stock.

### Findings

- **No release events exist in the file today** — the next set is two
  months out and Bandai lists release events about a fortnight ahead. The
  fixture carries a synthesised one, marked as such, so the flag is
  exercised; the first real one will appear on the roster in November.
- **The centroid table went into the bundle after the bundle was written**
  — three assertions red until the line moved above the serialisation.
  Order of operations, again.

**smoke.mjs 496, render.mjs 64 (Chrome). Gate green, sealed bare.**

### DEFERRED this cycle

- **Exact distances** — the full ZCTA table fetched on demand from Pages
  when the collector wants better than ±10 mi; a 200 KB download once.
- **The storefront layer** — mapping each roster store to its Shopify /
  Crystal Commerce / TCGplayer Pro storefront and polling stock (A32's next
  step; the roster is the list it needs).
- **Store phone numbers** — the roster has none; OSM and the store's own
  site do. Your notes carry them for now.
- The owner's list: push t74; paste `hunt.yml`; D20, D21; the tour check;
  D16; D7.

## Take 73 — 2026-09-16 — the runner reads its own last deploy; the time series begins

Opened before any code (PROTOCOL §6).

### The hole in take 72

The rotation cursor lived in `www/hunt/feed.json`, read as *previous* at the
start of a run. On the runner every hourly run is a fresh checkout: there is
no previous file, so the cursor would have restarted at zero every hour and
the same two products would have been checked forever. Found by asking
where the state lives; not by a test, because the tests run in one tree.

### Built

- **Pages is the state store.** `hunt.py` fetches its previous `feed.json`
  and `history.json` back from Pages (the address derived from
  `UPDATE_URL`, the one place the site is written) when no local copy
  exists. A failed deploy costs one hour of state, nothing more.
- **`history.json`** — one compact row per run (~2 KB): the online status
  of every item checked that run, and per served zip per item the
  per-store quantity. Capped at 336 rows, a fortnight of hours. Written
  beside the feed; a fixture run keeps the fixture suffix.
- **The app** syncs the history beside the feed and, per product, says what
  the runs saw: *last seen shipping 5 days ago · restocked 2× in 14 d:
  Auburn Hills Fri 9 AM, Auburn Hills Fri 9 AM*. Under 24 checks it lists
  what it saw and says *a pattern needs a fortnight*; with none it says
  nothing. **No prediction is made** — a dated list of restocks is what
  the data supports today; the pattern language comes when there is a
  fortnight to stand on.
- Smoke builds a synthetic fortnight — one product shipping until day 9,
  one store restocking on two Fridays — and proves the arithmetic and the
  honesty on thin data. Fixtures now live in a temp dir so the nightly's
  Pages deploy, which runs after smoke, can never ship one.

**smoke.mjs 486, render.mjs 64 (Chrome). Gate green, sealed bare.**

### DEFERRED this cycle

- **The pattern sentence** ("restocks Fridays, 3 of the last 4 weeks") once
  a real fortnight exists on Pages.
- **Local** — the TCG+ roster, the distance dropdown, own store notes.
- The owner's list: push t73; paste `hunt.yml`; D21; the tour check; D16; D7.

## Take 72 — 2026-09-16 — all of the US online, your zip for the shelf, and a quota that shapes the feed

Opened before any code (PROTOCOL §6).

### The owner's ask

Increase the radius to all of the US: the online/shipping view loads fully;
a pop-up asks for a zip and local prices are then included.

### Built

Two layers in one feed. **National:** every product with its price and
online (shipping) stock, no store, no radius. **Local:** for each *served*
zip (a repository variable, `HUNT_ZIPS`, default 48329), the nearby stores
and per-store stock. The app asks for the collector's zip once (kept on the
phone, changeable from the panel), then matches it to a served area
honestly: exact, or the same three-digit prefix (roughly one metro, said as
*using the 48329 check, same area*), or **none** — said as none, with the
covered areas named and the online layer still complete.

### Measured, and it changed the fetch

**RedSky throttled after 33 calls even at one call a second.** The quota is
per run from one IP, not a burst rule. So a run is a *budget* of 28 calls,
spent in order: the product list only when the last one is six hours old;
the local layer, two English items per zip in a round-robin; the national
layer, online status in a round-robin over every item. A cursor rides in
the feed so the next run continues where this one stopped, and **every
check carries its own time** — one item's online status can be an hour
older than its neighbour's and the line says so. Nothing unchecked is ever
zero.

**smoke.mjs 480, render.mjs 64 (Chrome). Gate green, sealed bare.**

### DEFERRED this cycle

- **The quota's window is UNKNOWN** — thirty per run is what held; whether it
  is per minute, per ten minutes or per IP-day is not measured. The hourly
  cadence at 28 calls will tell within a day of the paste.
- **Per-user zips beyond the served list** need the phone-side fetch in the
  sideload build or a Data Safety update for the Play build (a zip sent to a
  retailer): named as **D21**, the owner's.
- **The restock time series** — the runner keeping every hourly feed, not
  overwriting it.
- **Local** — the TCG+ roster, the distance dropdown, own store notes.
- The owner's list: push t72; paste `hunt.yml`; the tour check; D16; D7.

## Take 71 — 2026-09-16 — the Hunt feed: Target, hourly, with what is on the shelf near 48329

Opened before any code (PROTOCOL §6).

### Proven before building

Target's `nearby_stores_v1` returns eight stores within 17 miles of 48329
(Auburn Hills 5.1, Bloomfield Township 7.6, Commerce 11.0, Rochester 13.6,
Troy 14.2, Southfield 14.7, Novi 15.7, Farmington Hills 16.5) and
`product_fulfillment_v1` returns a per-store `location_available_to_promise
_quantity` with pickup and in-store status, plus online stock. Keyless,
from a cloud IP.

### Built

- **`tools/hunt/target.py`** — stores, search over five keywords,
  per-store availability; never raises, records a failure as a failure.
- **`tools/hunt.py`** — builds `www/hunt/feed.json`, matches each item to a
  catalogue sealed product by the share of the title's tokens found in the
  product's name plus its set's name and code, kind agreeing, a set code
  pinning the set; keeps the last good fetch when a fetch fails and says so;
  `--from-fixtures` builds a feed from saved real responses; `--selftest` runs
  ten checks including four controls, in the gate.
- **The app** — `HUNT` syncs the feed from Pages (derived from the sync URL,
  never a second literal), caches it, shows the Target panel with fetch age,
  store count and how many items are the Japanese release, calls a feed
  older than three hours stale and a failed source *unreachable since*, and
  puts a Target line — price, online status, shelf state per store — on
  every matched product. Refresh on tap; a quiet sync on entering Hunt when
  the feed is stale.
- **`ci/hunt.yml`** — hourly at :17, rebuilds `www/` and deploys it with the
  feed; one paste (landmine 46). `vars.HUNT_ZIP` / `HUNT_RADIUS` override
  48329 / 50.
- PROVISION declares `redsky.target.com` as a runner-side source.

### Findings — three, each a rule

- **Most One Piece product on Target's site is the Japanese release.** 12 of
  62 items say *(Japanese)*; their set names are translated differently
  (*The Seven Heroes of the Blue Sea* is OP-14, *The Azure Sea's Seven*) and
  their prices belong to a different product. The catalogue is the English
  game. **A Japanese item is never matched to an English product** — the
  first matcher scored it 0.5 and was right to refuse; the fixture that
  expected a match was wrong.
- **RedSky throttles availability calls: HTTP 435 after roughly forty in a
  burst.** 120 of 160 store calls failed on the first live run. Now one call
  a second, at most 64 a run, stop at the first throttle, English and dearer
  items first; whatever is left is marked *not checked*, never zero. My own
  probes then throttled the next fetch, which surfaced the second bug: a
  kept feed printed as if fresh. It says *kept* now.
- **Smoke must not need the network.** The first version asserted the live
  feed; it tests a fixture-built feed now, and `build_app` deletes that
  fixture from `www/` so it can never ride to Pages as real.

**smoke.mjs 471, render.mjs 64 (Chrome). Gate green, sealed bare.**

### DEFERRED this cycle

- **The paste**: `ci/hunt.yml` → `.github/workflows/hunt.yml`, once.
- **Per-user zips.** The feed is for one zip; a collector elsewhere sees
  stock near 48329 with the zip named. Serving a set of zips, or the
  phone-side fetch in the sideload build, is the next decision.
- **The restock time series** — the feed is one snapshot; the runner keeping
  hourly snapshots is the prediction layer's raw material (A32 step 3).
- **Local** — the TCG+ roster, the distance dropdown, own store notes.
- The owner's list: push t71; the tour check; D16; D7; the `.aab` filename.

## Take 70 — 2026-09-16 — Hunt, the third mode: Sealed and Releases from data already on the phone

Opened before any code (PROTOCOL §6).

### The owner's go, and the last question

The plan vibed: restock prediction from the runner's hourly time series, the
TCG+ roster for discovery, POS-storefront mapping, a Google Form as the
crowd inbox. Then: *dealers with direct Bandai supply who sell just over
MSRP in bulk — can we locate them, list contact info or stock?* Answered in
A32 this take: **businesses yes, private individuals no.** Bandai's US
supply moves through distributors to businesses with accounts; the
"dealers" are volume retailers with public storefronts, and the thing that
beats a scalper is a **preorder at MSRP** the week it opens — so a preorder
watch across those storefronts, Premium Bandai and the big-box sites is the
feature, not a contact list. Publishing private sellers' contact details is
the one thing this app will not do.

### Built this take

The mode slider takes a third entry — **Collect · Prep & Play · Hunt** — with
its own palette, nav and home. **Sealed**: every sealed product in the
catalogue (boxes, packs, decks, cases, other), searchable, grouped by kind,
with market/low/high, the nightly delta and the horizon label, a chart on
tap through the existing detail sheet, and a price alert per product through
the existing alert mechanism. **Releases**: every set with a publish date,
upcoming first with a countdown, then recent, with the card count once
published — from the group dates the ingest already reads.

### Findings

- **TCGCSV files 232 DON!! cards as sealed product** because they carry no
  card number. They are single cards. Left in, they were two thirds of the
  Sealed list; the screen keeps them out by name and smoke has the control.
- **The palette was measured before it was written** (the take-60 rule):
  dim2 5.42:1 on the card, and the contrast assertion now covers all three
  modes.
- **The knob measured mid-animation.** The first render assertion asked
  where the knob was the instant the mode changed and it was still moving;
  the screenshot showed it correctly under Hunt. The assertion now waits 350
  ms for a 220 ms transition. Geometry has a time axis.
- **`window.scrollTo` was missing from the DOM stub** — the first time a
  smoke test opened the detail sheet directly. Added to the stub, not
  removed from the app.
- **The Dominance of God booster box is $399.55 on the marketplace two
  months before release** — the scalper premium the owner is fighting,
  visible on the first screen of the mode built to fight it.

**smoke.mjs 459, render.mjs 64 (Chrome). Gate green, sealed bare.**

### DEFERRED this cycle

- **The runner's feed** — Target hourly for 48329 with store stock, the
  start of the time series (A32 step 2).
- **Local** — the TCG+ roster, the distance dropdown, the collector's own
  store notes, then POS-storefront polling.
- **The volume-seller and preorder watch** — the anti-scalper alert.
- **The form** for crowd reports (D20, if it vibes).
- The owner's list: push t70; the tour check; D16; D7; the `.aab` filename.

## Take 69 — 2026-09-16 — nine probes, the distance filter, and what to do about stores that publish nothing

Opened before any code (PROTOCOL §6). Ledgers only.

### Measured

Nine more sources from a cloud IP in one pass: GameStop captcha; Best Buy
503; B&N 404 on two paths; TCGplayer's listings endpoint 404 at the guessed
shape; **GTS Distribution and Southern Hobby both return rendered catalogue
pages** (GTS's carries "release" 43 times and "allocation" 4) though the
search paths guessed were wrong; Alliance 503; Bandai's news path 404;
Overpass 503 for the third time today. The finding is about method: a
guessed URL from a cloud IP proves little either way, so each source is a
take with its real page structure in hand and a saved response in smoke.

### Filed

The distance dropdown (10/25/50/100 miles, 50 the default, a filter over
any list); the five options for stores with no feed, ranked — own notes,
a Call button with a script, the AI caller (feasible, not now, not in the
app), crowd reports (the real prize, needs a server: **D20**), and social
pages (unscrapable).

### DEFERRED this cycle

- **A32's first build take**: Sealed, then Target via the runner.
- **One session per source** for the eight that need their real structure.
- **D20**, the owner's.
- The owner's list unchanged.

## Take 68 — 2026-09-16 — Hunt redesigned around what a keyless request actually gets

Opened before any code (PROTOCOL §6). Ledgers only.

### The owner's redirection

No accounts, no keys. Scrape as much as possible — stock, releases, prices,
as real-time as reasonable — from every supplier including eBay and
Facebook; into prod if there are no concerns; local scope Michigan 48329,
fifty miles.

### Measured, seven probes

Target's RedSky JSON: **200, 24 products with prices for a store near
48329, keyless, from a cloud IP** — the backbone. Walmart: a captcha page.
Meijer: 403. eBay: 403 robot check. B&N: 404 on the search path. Overpass:
503 twice, overloaded. Facebook: not probed; it is login-walled and its
automation bans accounts, which is a measured outcome from elsewhere, not a
rule of ours.

### The design that follows

Two scrapers, one feed. The runner — one cloud IP, hourly, cached with the
minute of fetch — publishes `hunt/feed.json` to Pages and **the Play build
reads it and never scrapes a retailer from the phone**: that is what "no
concerns" has to mean for a store-distributed app on the owner's developer
account. The sideload build adds phone-side scrapers for the sources that
serve a residential browser and block a cloud one (eBay, Walmart, Meijer).
The Michigan local half is Overpass for discovery plus the fact that most
LGS storefronts are Shopify, whose `/products.json` is public by design —
stock and price for every store without touching HTML. TCGplayer's own
seller lists are the other "one source, many suppliers" unlock. A32 carries
the full supplier list with a status on each, and the order.

### DEFERRED this cycle

- **A32 in the order written**, starting with Sealed (data on the phone) and
  Target via the runner.
- **Probes owed before their sources ship**: GameStop, Best Buy, B&N at the
  right URL, TCGplayer listings JSON, the distributors, Bandai's news page,
  Overpass off-peak — each with a saved real response for smoke.
- The owner's list unchanged.

## Take 67 — 2026-09-16 — Hunt goes on the agenda, measured, not built

Opened before any code (PROTOCOL §6). Ledgers only.

### The owner's ask

A price tracker for sealed product across every retailer and local store, a
third mode called Hunt, upcoming release dates from the OPTCG site, and
reprint information. Not to be built now.

### Measured before filing

660 of 667 sealed products already carry a TCGplayer market price and 590 of
them are in the nightly sidecar today — the sealed tracker's first half is
data the app has and does not show. TCGCSV's groups carry publication dates;
four upcoming releases are known today. A32 carries the mode, the screens in
the order they earn their place, the sources tiered by what can be done
honestly, and what is ruled out before anyone is tempted (scraping, a
server, "cheapest", affiliate links). D19 asks the one thing only the owner
can answer: which retailer accounts he will open.

### DEFERRED this cycle

- **A32 in full**, in the order written: Sealed → Releases → Reprints → D19
  → retailer feeds → Near me.
- The owner's list unchanged: the tour check, D16, D7, the `.aab` filename,
  the opt-in link, a Collectr export, a TalkBack listen, D15, D17, D18.

## Take 66 — 2026-09-16 — names for everything a screen reader reaches

Opened before any code (PROTOCOL §6).

### What was measured

2 `aria-label`s across 171 buttons; ten screen titles marked up as selected
tabs; the network badge styled as a pill with no role. The tester report said
"consider accessibility" and stopped there; this is the specific version.

### Built

Names on every control a reader would announce as nothing: the favourites
star, both filter gears, the torch, the gallery, the shutter, the scan
shortcut, both Leader slots, and every +/− stepper in Decks, Trade and the
Play counter — each named from its own context (*One more Nami*, *Life up*,
*DON!! down*). Screen titles are `role="heading" aria-level="1"`; the two
real tabs keep `role="tab"` with `aria-selected`; the network badge is a
`role="status" aria-live="polite"` region; decorative glyphs inside labelled
controls are `aria-hidden`. **20 labels now, from 2.**

### Findings — the assertion was wrong twice before it was right

- First rule: *text ≤ 2 characters means nameless*. It flagged `OK`, which a
  reader announces perfectly well. Narrowed to **letters**, not length.
- Second rule flagged three buttons whose label is `${...}` — computed text,
  which is still text. Narrowed again: an interpolation in the label is a
  name. Each narrowing was made because the assertion found something real
  and then something false; the rule that survives says exactly what it
  means — *a button whose whole label is punctuation or empty*.
- **Seven buttons the first sweep missed** were only found because the
  assertion ran over the template strings as well as the static markup. A
  grep of the markup alone would have called it done.
- The render check walks every VISIBLE control in a real DOM and asks for an
  accessible name, which is the thing TalkBack will ask.

**smoke.mjs 444, render.mjs 61 (Chrome). Gate green, sealed bare.**

### DEFERRED this cycle

- **A real TalkBack session** — the machine proves a name exists; only a
  person hears whether the order and wording make sense. The owner's.
- **Focus order and focus-visible styling** — not touched; a keyboard user
  on the Pages build still has no visible focus ring in places.
- A31 waits on a real export. The owner's list: the tour check, D16, D7,
  the `.aab` filename, the opt-in link, D15, D17, D18.

## Take 65 — 2026-09-16 — the sweep's result, and the two rows the report was right about

Opened before any code (PROTOCOL §6).

### The sweep (take 64's deferral), done first

Every non-button element carrying an interactive class was listed: 27 of
them — 11 `badge`, 10 `tab on`, 3 `chip`, 2 `pill`, 1 `tab`. Then every
`.bar` with more than one tab: **Home was the only one in the app**, and it
is fixed. The ten remaining `tab on` spans are single screen titles
(Decks, Binder, Trade, Sim, Play, Cards, Want list, Set, More) — decoration
by design, nothing to click beside them. They are not a second landmine 118;
they are a TalkBack problem, because a screen reader will call a heading a
tab. That goes in the accessibility pass, next take.

### Built

- **More → Rate this app on Google Play** — `market://details?id=…` where
  the Play app is there, the https listing otherwise.
- **More → Tell someone about the app** — the listing URL and one plain
  sentence to the share sheet (`Share.share({title, text, url})`, read from
  the plugin's definitions, landmine 73), clipboard as the fallback.
- **The link carries nothing but the app id.** No referral parameter, no
  campaign tag; asserted in smoke, because A30 ruled referral promotions out
  and the listing claims no analytics.
- The app id rides in the manifest from `capacitor.config.json`, so it is
  not a literal in two files.

### The gate caught the take

Sealing failed first time: *undeclared remote host 'play.google.com' in
www/* (PROTOCOL §8). Correct — the offline guard cannot tell a link from a
fetch, and the rule is that every host in the shipped app is declared with
its purpose. `PROVISION.md` now carries it in the runtime table, saying
plainly that the app never fetches it and that the URL has no referral,
campaign or tracking parameter. That is the guard doing the job it was
written for at take 8.

**smoke.mjs 438, render.mjs 59 (Chrome). Gate green, sealed bare.**

### DEFERRED this cycle

- **The accessibility pass** — the ten title tabs, the status pill, the
  icon-only buttons, a real TalkBack session. Next take, then the owner
  pushes.
- **Whether Rate opens the Play app on the Fold** — `market://` through
  `window.open` is the documented path but is unproven on a device; the
  https fallback always works.
- A31 waits on a real export; the owner's list: the tour check, D16, D7,
  the `.aab` filename, the opt-in link, D15, D17, D18.

## Take 64 — 2026-09-16 — the Overview tab was never a control

Opened before any code (PROTOCOL §6).

### The owner's report

*"I've only tested on desktop at my .io, but when you click Performance,
Overview stays highlighted."* True, and worse than it looks: Overview was
`<span class="tab on">` with no id and no handler — hard-coded selected,
unclickable, with no way back to the overview but a reload. Landmine 118.

### Why neither harness saw it

smoke and render both test what draws and what handlers do. This element had
no handler, so there was nothing to test; the markup that made it look
selected was never questioned. A control with no listener is invisible to a
suite that tests listeners.

### Built

`setHomeTab(perf)` owns both: exactly one `on`, `aria-selected` on each, the
performance panel shown or hidden, and the overview blocks (`hero`,
`setPanel`, the new `srcPanel`) giving way so the tab means something. Both
tabs answer Enter and Space as well as a click. Six smoke assertions with the
old toggle as the negative control, and **a render assertion that clicks both
tabs in real Chrome** — the place the owner saw it.

### Findings

- **The DOM stub had no `setAttribute`.** The app had never needed one until
  this take added `aria-selected`; the stub grew the method rather than the
  app dropping the attribute, because the attribute is the accessible part.

**smoke.mjs 431, render.mjs 59 (Chrome). Gate green, sealed bare.**

### DEFERRED this cycle

- **A sweep for other decorative controls** — grep every `class="tab on"`,
  `.pill`, `.chip` and `.badge` for a matching listener. This one reached a
  closed test; there may be siblings.
- Rate and Share rows, then the TalkBack pass; A31 waits on a real export.
- The owner's list: the tour check, D16, D7, the `.aab` filename, the
  opt-in link, D15, D17, D18.

## Take 63 — 2026-09-16 — the skull goes, the Decks tab becomes a card back

Opened before any code (PROTOCOL §6).

### The owner's ask

*"Remove this skull icon, it looks awful. For the Decks, change this to a
picture of an actual card back."*

- The skull was `g-roger`, drawn at take 17 and used in exactly one place:
  the empty-collection state. Removed from the sprite entirely, and the
  empty state now shows the scan-card decal it is actually telling you to
  tap.
- The Decks tab was `g-leader` — a card with a small crown. It is now
  `g-cardback`: a card with the inset border and diamond lattice a card back
  reads as. **Drawn, not reproduced:** the real One Piece card back is
  Bandai's design and is no more shippable than the box art (landmines 26,
  30). The shape is the thing the owner wanted; the artwork is theirs.

### Findings

- **An apostrophe inside an XML comment** — *Bandai's design* — broke
  `glyphs.svg`'s parse. Reworded. The sprite is XML, not HTML.
- **`pkill` on a background server killed the shell it ran in**, so a patch
  in the same command silently never wrote and smoke reported the old count
  as green. Caught by grepping for the assertion afterwards, which is
  landmine 104's rule doing its job on a tool, not a ledger.

**smoke.mjs 424, render.mjs 58 (Chrome). Gate green, sealed bare.**

### DEFERRED this cycle

- **The empty-collection decal on a phone** — it draws in Chrome; whether
  the scan card at 64×88 sits well in that space is an eye question.
- Rate and Share rows, then the TalkBack pass; A31 waits on a real export.
- The owner's list: the tour check, D16, D7, the `.aab` filename, the
  opt-in link, D15, D17, D18.

## Take 62 — 2026-09-16 — the one request declined, and the covers built instead

Opened before any code (PROTOCOL §6).

### The owner's ask, and why it is not built as asked

*"For starter decks, I'd like to get preview images. You can find these from
a ton of places online, but they're also published officially"* — with a
photograph of the ST-36 box.

Declined, and the reasons are all on the record already:

- **Landmine 26.** Card art is copyrighted and this app never hosts it. The
  pipeline fetches images inside the runner, hashes them and discards them;
  what ships is derived data three orders of magnitude removed from the
  work. A box shot is that work uncropped — Oda's character art across the
  whole face.
- **Landmine 30 / A16.** Publisher trademarks stay out. The box carries the
  ONE PIECE logo, BANDAI and BANDAI NAMCO marks. The app's icon has been
  kept original for sixty takes precisely to avoid this.
- **Bandai's own terms**, on the page the owner linked: *all images, text
  and data on this website may not be reproduced without permission.*
  "Published officially" means published by them, on their site, under that
  line. Widely available is not licensed.
- **The store listing says so.** The full description states no character
  art and no publisher marks, and the Data Safety and content answers were
  approved against that app. Shipping box shots would make the listing
  false, in a commercial app that carries ads, during a closed test.

What is NOT declined: the owner's own build. `assets/user/` has carried a
picture slot since take 25 and takes his own photographs; a folder for deck
covers there is his call about his own copy and ships with no defaults.

### Built instead

Generated covers: each ready-made deck draws its own, from data the app
already has — the Leader's colours as a field, the set code in the display
face, the Leader's name. Inline SVG, no file, no request, no IP.

### Built

`deckCover(d)` — the Leader's colour or colours as a diagonal field, the set
code in the display face, the Leader's name, a plain ring; inline SVG with a
`role="img"` label. On every ready-made deck row. Four smoke assertions: it
is an `<svg>` with no `<image>`, no URL and no publisher word; it carries the
set code and Leader from the catalogue; it has a screen-reader label; and no
fetched artwork URL appears anywhere in the shipped page.

### DEFERRED this cycle

- **A licensed image** — if the owner asks Bandai and is granted permission
  in writing, `deckCover()` is one function and the covers become real
  images with the licence recorded in PROVISION. Nothing else changes.
- **A deck-cover slot in `assets/user/`** for the owner's own photographs of
  his own boxes, on his own build, shipping no defaults — offered, not built,
  because it is his decision and not an app feature.
- **Rate and Share rows**, then the TalkBack pass (A30's order); A31 waits
  on one real exported file.
- The owner's list: the tour check, D16, D7, the `.aab` filename, the opt-in
  link, D15, D17, D18.

## Take 61 — 2026-09-16 — A29: decks by default, without pretending they are Bandai's

Opened before any code (PROTOCOL §6).

### Measured first, and it changed the design

The owner: *"include the starter decks you can find — they should all be
posted online."* Three sources checked:

1. **The catalogue.** ST printings are all there — 36 ST sets — but a
   printing is not a deck: ST01 carries 113 printings and a deck is 51 cards
   with quantities. No contents anywhere in TCGCSV.
2. **Bandai's own product page** (`/products/decks/st01-04.php`, fetched).
   It publishes the rarity counts (1 Leader, 2 SR, 14 C), the contents line
   (51 cards), and a correction notice for ST-02's misprinted quantities —
   **but not the per-card quantities themselves.** The cardlist page lists
   the 17 numbers, not how many of each. Its footer: *all images, text and
   data on this website may not be reproduced without permission.*
3. **Fan sites** carry full lists with quantities, unverified, mostly for
   the early sets, and scraping one into a shipped product is the kind of
   confident wrong answer this project exists not to give (AGENTS §4).

So a faithful reproduction of the products is **not available honestly**
today, and inventing quantities to fill the gap would be the same class of
error as a made-up condition multiplier (PROTOCOL §10).

### What the owner actually asked for, underneath

*"Included by default so users can play/test the sim or other features."*
That is a legal, ready-to-play deck on a fresh install — not a replica of a
retail product. So the mechanism ships and the data is swappable: stock
decks are **built from each ST set's own printings**, deterministically,
validated against `legality()` at build time, and labelled for what they are
— *Red Luffy — built from ST01*, never *Starter Deck ST-01*. If the true
quantities ever arrive (the owner owns decks; a paid Collectr export; a
licensed list), they drop into the same slot and the labels change.

### Built

- **`tools/stockdecks.py`** — one deck per ST set from that set's own base
  printings: the set's Leader, the cheapest printing of each in-colour
  number, four of each ordered by type, cost and number until fifty.
  Deterministic, `legality()`-validated, nine guards with two controls, in
  the gate. **17 decks from 36 ST sets;** the 19 skipped are named in the
  build output with the reason (no Leader, or fewer than fifty legal cards).
- **In the app:** they ride in the bundle, list under *Ready-made decks* on
  the Decks screen with one line stating they are not in the collection, and
  the sim's picker draws from `DECKS.all()`, so a tester with nothing
  scanned can deal a game immediately.
- **The guard, tested:** reading every stock deck leaves `OWN` empty and the
  total at zero; no stock id enters the collection; none is written to the
  saved deck list — with a control proving the collection does move when a
  card is genuinely added.
- **A31** opened for importing from Collectr and similar, with the reason it
  cannot start: no real exported file, and a guessed format mis-keys
  printings the way a guessed price misprices a card.

### Findings

- **Nineteen ST sets cannot make a deck from themselves** — several have no
  Leader at all (ST15, ST16 among them: they are promo or reprint sets that
  carry ST numbers), and some carry too few legal in-colour cards. Skipping
  them with a printed reason is right; filling them from other sets would
  make a deck nobody could buy and nobody asked for.
- **The build refused the take again** for a missing release note (take 53's
  guard), which is the second time it has caught me writing code before the
  note. Working as designed.

**smoke.mjs 417, render.mjs 58 (Chrome). Gate green, sealed bare.**

### DEFERRED this cycle

- **Real starter-deck quantities**, if a licensed or owner-supplied list
  ever arrives — the slot is built and the names would lose "built from".
- **A31** until one exported file exists; the shape-tolerant CSV importer is
  the part that can be done without one.
- **Rate and Share rows**, then the TalkBack pass (A30's order).
- The owner's list: the tour check, D16, D7, the `.aab` filename, the
  opt-in link, D15, D17, D18.

## Take 60 — 2026-09-16 — the gold the owner missed, the contrast nobody measured, and the desktop nobody looked at

Opened before any code (PROTOCOL §6).

### Measured first (A26 step 4: measure, then change)

- **Headings.** Before take 33, `h2`, the hero's `em` and panel titles were
  the serif at `--brass` by inheritance. Take 33 added `h1, h2 {
  font-family: var(--display) }` and no colour, so they fell back to
  `--fg`. The share page still hard-codes `#C9A24A`, which is why it looks
  right and the app does not.
- **Contrast, computed from the tokens.** `--dim2` — the secondary line on
  every card row — is **2.64:1** on the card background in Collect and
  **3.20:1** in Prep & Play. WCAG AA wants 4.5:1 for body text and 3:1 even
  for large. It has failed since take 1 and no one looked; the tester report
  said "consider accessibility" and did not find it. `--fg` 12.49:1, `--dim`
  5.19:1, brass 6.88:1 — those are fine.
- **Width.** `render.mjs` checks 360, 412, 673 and 820. The Pages build is
  the same file and the owner reads it on a desktop at 1200–1900, where a
  display face at 28px sits alone in a wide column.
- **Labels.** 171 buttons, 2 of them icon-only with no text, 1 `aria-label`.
  Smaller than the report implies; a TalkBack pass is still owed.

### Built

- **The colour on the role.** `h1, h2`, `.panel h3` and the tour heading
  carry `var(--brass)`, so the accent follows the palette into Prep & Play
  instead of being lost when an element moves (landmine 117).
- **`--dim2` raised to a measured 4.58:1 (Collect) and 4.77:1 (Prep &
  Play)**, and smoke now computes every text token's WCAG ratio from the
  shipped tokens — with the old `#6B5F4B` as the negative control, so the
  check is known to be able to fail.
- **A phone-width column on wide screens:** 520px centred at ≥900px, the
  fixed bottom nav pinned to the same width, asserted in Chrome at 1440px
  along with the heading colour.
- **A30** on the agenda: the tester report assessed claim by claim, with
  what is true, what is false, what is rejected and why, and the agreed
  order of work.

### Findings

- **Two faults the assertions could not see, and a screenshot did.** The
  media query sat above `body{margin:0}` and lost on order, so the column
  was pinned left while every assertion passed; and the *Got it* button wrapped
  to two lines. render.mjs measures geometry, not layout intent — looking at
  the picture is still part of the job (landmine 69's other half).
- **`file://` cannot fetch the catalogue**, so the first desktop screenshot
  was an empty shell reading *Catalogue failed to load*. Served over http it
  was fine. Worth remembering before reading anything into a local capture.

**smoke.mjs 407, render.mjs 58 (Chrome). Gate green, sealed bare.**

### DEFERRED this cycle

- **D16, the faces themselves** — the owner's "weird / out of place" may
  survive the colour fix; cleaner to ask now that the palette is right.
- **A29 stock decks**, next by the agreed order, then Rate and Share rows,
  then a TalkBack pass.
- **The tour check** on the owner's device — the one thing that decides how
  seriously to read the rest of the report.
- The owner's standing list: which `.aab` was uploaded first, the icon (D7),
  the opt-in link, D15, D17, D18, and the two offers (seed attached to
  releases, release-notes trim).

## Take 59 — 2026-09-16 — the seed was about to delete six days of prices

Opened before any code (PROTOCOL §6).

### Found while laying out take 58

The runner's sidecar has ten days (2026-09-01..09, and 09-15). This
container's has four: 09-01, 09-02, 09-03, 09-15 — the nights between were
fetched by the runner and never came back here, because a seed is a
snapshot of the session's tree. The seed job unpacks with `unzip -o` and
commits, so **dropping take 58 would have replaced the runner's ten days
with four and lost 09-04 to 09-09 for good.** TCGCSV publishes one day at a
time; a deleted day is not re-fetchable.

The same thing would happen on every future seed drop, and had been true
since take 9. It has not bitten because the runner's history was younger
than the session's until now.

### Fixed, without a paste

`build.yml` is hand-pasted and cannot be changed cheaply, so the repair
lives where the seed can carry it: `tools/history.py --merge-git` reads the
last twenty committed versions of `catalog/prices_daily.json` out of git and
unions them into the working copy — a day present in any of them survives —
and `ci/bundle.sh` runs it before the fetch. Any seed drop now *adds* to the
history instead of replacing it, and the repair is retroactive: the first
build after take 58's drop restores 09-04..09-09 from the commit the seed
overwrote.

### Built

- **`tools/history.py --merge-git`** — unions the working sidecar with the
  last twenty committed versions of itself; a day already on file is never
  overwritten by an older copy; a no-op with a printed reason outside a git
  checkout. **`ci/bundle.sh` runs it before the fetch**, so the order is now
  merge → fetch → commit the day → everything that can fail.
- **Rehearsed on the exact case:** a ten-day repo, a four-day seed
  committed over it, the merge restoring all six missing days. Controls: a
  second merge restores nothing, and a tree with no `.git` is a no-op.
- Five smoke assertions on the mechanism and the ordering, including that
  the merge runs before the fetch and the price commit before the pipeline.

### Findings

- **The three sidecars are not alike.** `prices_daily.json` is the only one
  the runner extends and the session cannot reconstruct — a price day is
  fetchable once. `hashes.json` and `star_template.json` are recomputable
  from sources that stay available, so a thin seed costs runner time, not
  data. Only the first needed the merge; the other two are named in landmine
  116 as the thing to prove rather than assume.

**smoke.mjs 400, render.mjs 55 (Chrome). Gate green, sealed bare.**

### DEFERRED this cycle

- **Proving the hashes and star-template sidecars survive a thin seed** —
  named in 116, not tested.
- **A26 typography and A29 stock decks** — still the owner's two named
  items, still next.
- The pinned-count lint; the owner's list: the seed drop, the opt-in link,
  the `.aab` filename, the icon, D16, D15, D17, D18, and the two standing
  offers.

## Take 58 — 2026-09-16 — five silent nights, and a six-day move the app was calling "since yesterday"

Opened before any code (PROTOCOL §6).

### What the owner brought

The repo tree at take 56, the nightly's last commit 2026-09-09 (*9 day(s) on
file*) and today the 16th — five nights with no commit — plus the red log:

```
FAIL  the SP carries a low well under its market  445.99 vs 448.29
FAIL  manifest records the history days ... consecutive ...
      ["2026-09-01"..."2026-09-09","2026-09-15"]
```

### The chain, read off the log

1. **The spread assertion (take 1) was pinned to one card's numbers.**
   EB03-024 SP was $467.33 market against $400 low when it was written — a
   17% spread, the README's own example. Prices converged; on the night the
   gap fell below the threshold the assertion failed, the bundle job
   stopped **before the sidecar commit**, and that night's prices were lost.
   It failed again the next night, and the next: five nights, no history.
2. **My take-56 fix then failed on the hole those nights left.** I replaced
   a frozen count with *at least two, consecutive, ending on the source
   date* — and consecutive is exactly what a missed night is not. A shape
   assertion that forbids the gaps the system can actually have is the same
   error one layer up.
3. **Underneath both, a real one.** `history.deltas()` defines d1 as *the
   closest day at or before today−1* — correct, and its docstring says a gap
   is never interpolated. But the app labels that number **"since
   yesterday"**, the tour says **"what shifted overnight"**, and the runner
   printed *4485 of 7135 moved* where a night is 34% (take 8). Those were
   six-day moves wearing a one-night label: a money claim the data does not
   support (PROTOCOL §10).

### Built

- **`ci/bundle.sh` records the night first.** The price fetch is the one
  irreplaceable thing the job does — TCGCSV publishes today once — so
  `ingest history` runs alone, the sidecar is committed and pushed, and only
  then does the full pipeline run. **Rehearsed against a bare remote with a
  deliberately failing assertion planted in smoke: the commit lands, the
  build still goes red.** A red night now costs the build, not the history.
- **The app names its horizon.** `sinceLabel()` reads the last two days on
  file: *since yesterday* when the gap is a day, *over 6 days (2026-09-09 →
  2026-09-15)* when it is not, *no prior day on file* when there is none.
  Three sites carried the old wording; the tour's "shifted overnight" is now
  "shifted since the last catalogue".
- **Four assertions rewritten to derive from the data:** the spread over the
  population rather than one card's numbers; history days ascending and
  unique rather than consecutive; the moved-share ceiling following the
  horizon (10–70% over a night, 10–95% over more); 7d/30d existence as a
  calendar question rather than a count of days.

### Measured

69% of printings over $5 carry a low at least 5% under market. Market sits
outside `low..high` on 427 of 6,551 printings — it is an average of recent
sales while low and high are live listings, so that ordering must never be
asserted. Twelve days of fresh catalogue: 6,906 cards (+44), 7,573 products,
219 images known unavailable, hash coverage 99.6%.

### Findings

- **A9 was open for five nights and nobody looked.** The issue is a notice,
  not a safeguard; the safeguard had to be ordering. Recorded in A9.
- **My own take-56 fix was the second failure.** A shape assertion is only
  better than a pinned number if the shape is one the system can actually
  produce. "Consecutive" was a wish about the calendar.

**smoke.mjs 395, render.mjs 55 (Chrome). Gate green, sealed bare.**

### DEFERRED this cycle

- **A26 typography and A29 stock decks** — the owner's two named items,
  still unbuilt and still next.
- **The five lost nights are lost.** TCGCSV publishes one day at a time;
  2026-09-10 to 09-14 cannot be fetched now. The history has a hole and the
  app now says so rather than averaging across it.
- The pinned-count lint (take 56's deferral) — landmine 115 raises its
  value: a lint over smoke for constants that came from a measurement.
- The owner's list: the seed drop, the opt-in link, the `.aab` filename, the
  icon, D16, D15, D17, D18, and the two standing offers (seed attached to
  releases, release-notes trim).

## Take 57 — 2026-09-03 — two of the owner's observations onto the agenda, unbuilt on purpose

Opened before any code (PROTOCOL §6).

### The owner's ask

*"The font looks a little weird / out of place compared to what it was
before, and it's not gold any more, or poorly in some places — maybe that's
because I'm viewing on desktop."* And: *"For decks, include the starter
decks you can find — they should all be posted online. Included by default
so users can play the sim or test other features. They shouldn't be added to
the portfolio or anything."* Explicitly: **do not work on these; put them on
the agenda for the next session.**

### Done

A26 carries the typography report with what to check first (the brass on
headings went to the display face's own colour at take 33 and the desktop
metrics were never looked at — the render checks four phone widths). A29 is
opened for stock decks: what they are, where they come from, and the two
rules the owner gave — available by default, never in the collection.
Nothing built; no code touched beyond the ledgers.

### DEFERRED this cycle

- **A26's typography report** — the gold, the fit on desktop.
- **A29 — stock decks** in full.
- Everything on take 56's list: the pinned-count lint, the seed-attachment
  `build.yml` change and the RELEASE.md trim (both offered, neither
  accepted yet), the opt-in link, the `.aab` filename, the icon, D16, D15,
  D17, D18.

## Take 56 — 2026-09-03 — the runner went red on the third night of prices; a count that grows was frozen at two

*Opened after the fix, not before — the owner pasted a red CI log and I
reproduced and repaired first. PROTOCOL §6 says the entry comes first; this
one records the slip as well as the bug.*

### What the runner said

`smoke — 378 passed, 1 failed; pipeline stopped` on the bundle job, with the
section headers but not the failing line. Reproduced here in one command:
a fresh ingest — TCGCSV had published 2026-09-03 at 20:05 UTC — gave the
sidecar its third day, and *manifest records two history days* failed on
`["2026-09-01","2026-09-02","2026-09-03"]`. Written at take 20 with two days
on file; true for thirty-five takes and false the first night it could be.
Its sibling, *7d and 30d are absent with two days on file*, would have gone
red on the eighth night. Landmine 114.

### Consequences on the runner

The bundle job stopped before the sidecar commit, so the runner's history
still ends at 2026-09-02 and A9's failure issue is open. The seed carries
the local sidecar with 2026-09-03 recorded, so dropping t56 repairs the
runner's history as well as the test; the next nightly then appends
2026-09-04 and the issue can be closed.

### DEFERRED this cycle

- **A guard against frozen counts** — a lint over smoke.mjs for `=== <n>`
  against `history_days`, `days.length`, `source_updated_at`: worth its own
  take with a control, not a patch under a red light.
- The owner's list unchanged.

## Take 55 — 2026-09-03 — A23 step (3): an opponent that plays legally and stupidly, so one tester can play alone

Opened before any code (PROTOCOL §6).

### Why this now

The hot-seat board needs two people and testers mostly have one phone and
no second player at hand. A23 scoped step (3) as *"a simple opponent that
plays legally and stupidly, honest about being a script."* Built as that:
the same engine, the same rules, one policy — play the dearest affordable
Character, give DON!! to the Leader, attack with everything that may,
block when a Character would die, counter when the Leader would take
damage at low Life, apply an offered effect to its first target. No
lookahead, no bluffing, no hidden knowledge (it never reads the human's
hand or deck). It says what it is on the setup screen.

### The invariant this buys

A bot-versus-bot game in smoke is the first test that plays whole games:
every turn, every card is in exactly one zone and the count is fifty-one
per player; DON!! sum to ten; never six Characters; the game ends. Failure
class 4 (limits unchecked) as a running assertion rather than a fixture.

### Built

- **`BOT`** — `step()` (one action: play, DON!!, an attack, or end),
  `defend()` (block, counter), `offers()` (first legal target, declining a
  trash cost that would empty the hand), `mulligan()` (keeps). Wired into
  the board: *Opponent: the app* on setup; no curtain against it; the
  human's screen always shown; the app's block and counter shown before the
  human resolves; the app's whole turn runs on *End turn*, pausing only
  when it attacks, which is the human's window.
- **Smoke:** two whole bot-versus-bot games (deterministic shuffles) under
  a running conservation invariant; a render assertion that the board names
  the app.

### Findings

- **The first policy never ended a game.** Characters attacked rested
  Characters they could beat, Leaders included, and the two seats traded
  Characters forever — sixty turns, no defeat. The Leader now always attacks
  the Leader; games end in 10–19 turns. A stupid policy still has to be a
  policy that finishes.
- **Five games in a row to seat 0 looked like an asymmetry** and was not:
  twenty games split 8–12 with attacks 329–339 by seat. Measured before
  believed.

**smoke.mjs 393, render.mjs 55 (Chrome). Gate green, sealed bare.**

### DEFERRED this cycle

- **The app as an opponent on the Fold** — the first solo game report.
- **Step (4), two phones** (D18); a stronger opponent, if ever, as its own
  promise.
- The owner's list: the seed drop; the opt-in link; the `.aab` filename; the
  icon; D16, D15, D17, D18.

## Take 54 — 2026-09-03 — one paragraph PROTOCOL §6 was said to have

Opened before any code (PROTOCOL §6).

### What happened

Take 53's entry says *PROTOCOL §6 says the note is part of opening a take*.
The write that would have made that true failed on an anchor (the section
is headed `## 6. Ordering`, not `## §6`) and the seal ran on the sentence.
A reseal is a new take (A-203); this is it. The paragraph is in §6 now, and
take 53's claim is true one take late — noted here rather than edited there
(the record does not edit itself, `stamp.py`'s rule).

### DEFERRED this cycle

- Take 53's list, unchanged: the first game report and self-test report from
  a tester; the sim's tail when a report says which part mattered; the owner's
  seed drop, opt-in link, the `.aab` filename, the icon, D16, D15, D17, D18.

## Take 53 — 2026-09-03 — feel: what's new on Home, a deck's sim-readiness and a way in, the board's colours and DON!! as pips

Opened before any code (PROTOCOL §6).

### The owner's ask

Anything productive — fonts, sim, feel. Testers are arriving.

### Chosen, for testers

1. **What's new, in the app.** Testers get a Play update every seed drop
   and nothing tells them what changed; the release notes live on GitHub.
   The build now lifts the *New at take N* paragraph from `ci/RELEASE.md`
   into the manifest, and Home shows it once per take, dismissible.
2. **A deck's sim-readiness.** The Decks screen says how many of a deck's
   cards are fully scripted, partly, or by hand, so a player picks a deck
   the sim can mostly run — and a **Play in Sim** button takes that deck
   straight to the board as Player 1.
3. **The board's feel.** Card lines carry their colour dots; DON!! reads as
   pips (active bright, rested dim) rather than "4/5"; the attacker's row
   is marked while a target is being chosen.

### Built

- **What's new on Home:** `build_app.py` lifts the *New at take N*
  paragraph from `ci/RELEASE.md` into the manifest and refuses a build
  whose note is missing or for another take; Home shows *New in this
  update* once per take with *Got it*. PROTOCOL §6 says the note is part of
  opening a take.
- **Sim-readiness on the deck screen:** `simReadiness(d)` sorts every card
  into runs-itself / partly / by hand / no text, names the by-hand ones, and
  **Play this deck in Sim** preselects it on the board.
- **The board:** colour dot on the name, DON!! as pips with a title that
  spells the counts, the chosen attacker outlined, refusal reasons on their
  own line, no stray separator on the Leader's line.

### Findings

- The first cut put the colour dot as a sibling of the name and the `.nm`
  layout stacked it on its own line; the Leader's line began with a
  separator because cost and power were both empty. Both seen in the render
  screenshot, not in an assertion — the picture is still worth looking at.

**smoke.mjs 386, render.mjs 54 (Chrome). Gate green, sealed bare.**

### DEFERRED this cycle

- **The first game report and self-test report** from a tester.
- **Sim tail** (modal, ordering, protection, opponent's choices) when a
  report says which mattered.
- The owner's list: the seed drop; the opt-in link; the `.aab` filename; the
  icon; D16, D15, D17, D18.

## Take 52 — 2026-09-03 — Play approved the closed test; the tester guide becomes the Play guide; the sim learns the opponent's choices

Opened before any code (PROTOCOL §6).

### The owner's report

*"It's been approved on Play and we're ready for testing in prep for prod."*
The closed-testing release passed review. The 14-day clock starts when the
twelfth tester is opted in (A21 step 8; landmine 35). PROVEN by the owner's
report; the console is his.

### Chosen

First the thing the testers will read: `ci/RELEASE.md`'s guide was written
for sideload testers at take 22 — *installs over any earlier take* is false
for anyone who sideloaded and now installs from Play (landmine 34), and it
does not say to run the self-test or to stay installed for two weeks. Then
the sim's next mechanism by count: effects where the OPPONENT chooses
(*your opponent trashes 1 card from their hand*), which on one phone means
the curtain and a hand-over mid-effect; and protection flags.

### Built

- **`ci/RELEASE.md`** opens with the Play tester's page: the opt-in link,
  the sideload-to-Play switch (export → uninstall → import), stay installed
  two weeks, run the self-test once and share it; the five-minute script
  starts with that self-test and ends with a sim game.
- **Share the game log** on the board — a tester's "an effect fired when it
  shouldn't" arrives with the turn-by-turn record.
- **Self-test:** a fifteenth check — the effects bundle loaded and a plain
  [On Play] draw offers and applies on the phone, against a throwaway game
  state, the real one restored after.
- **A21** approved; RUNBOOK-play's state block; V1-STATE; the session
  prompt tells the next session that every seed is now a Play update.

### Measured, and a decision

The unparsed tail after take 51: *Choose one:* 37, ordering choices 27,
protection flags ~25, the opponent's hidden choices ~25 — each below forty
lines and each its own mechanism. **Template-chasing pauses at 28.6%** until
a game has been played; the next measurement is a person's.

**smoke.mjs 379, render.mjs 54 (Chrome). Gate green, sealed bare.**

### DEFERRED this cycle

- **The first game report** — with its log.
- **The tail** above, when the report says which of them mattered.
- The owner's list: the opt-in link and testers; the `.aab` filename; the
  icon; the self-test report; screenshots; D16, D15, D17, D18.

## Take 51 — 2026-09-03 — step (2): searches in every phrasing, keyword grants, cost changes, and a sign the source text lost

Opened before any code (PROTOCOL §6).

### Measured first

Unknown sentences by count, in any position of a line, with the leading
condition stripped: *Place the rest at the bottom of your deck in any
order* 354 and *Trash the rest* 60 — the tails of searches whose reveal
filter is not the one form the template knew (a named card 19, two types
14, a quoted type, a cost line); a DON!! cost *after* a condition 172; *Add
up to 1 DON!! from your DON!! deck and rest it* 69; *Give … Characters N
power during this turn* 48; *−N cost during this turn* 47; *This Character
gains +N power* as a step 46; *Trash N cards from the top of your deck*
42; *This Character gains [Rush]* (and Double Attack, Blocker, Banish) 84
across timed and continuous forms; *Set this Character as active* 24;
*Add N card from Life to hand* 35; *deck to Life* 24.

### A finding in the source

The 48 lines that read *Give up to 1 of your opponent's Characters 2000
power during this turn* have lost their minus sign somewhere between the
card and TCGCSV; 11 sibling lines still carry it. No card in this game
gives an opponent's Character more power. The template treats the bare
number as a reduction and says so — the one place in the parser where a
sign is inferred rather than read, recorded as landmine 113.

### Built

- **Parser:** `search_steps()` — a type, two tokens classified against the
  catalogue as names or types, a quoted type, a named card, a cost line,
  *other than*; *place the rest at the bottom* / *trash the rest* as steps;
  a cost after a condition; N-sentence chains; keyword grants timed and
  continuous; cost changes; mill; Life moves; *set this Character as
  active*; permanent *+N power*; the inferred sign. Thirty-eight controls.
- **Engine:** `inst()` gives every Character in play an id and `keyOf()`
  keys modifiers by it; `kwOf()`/`has()` read printed, continuous and timed
  keywords and the four rules that care use them; `effCost()` reads timed
  cost changes and every cost filter uses it; `mod()` carries `kw` or
  `cost` beside `n`; `P.looking` holds the cards a search revealed until the
  next step decides where they go, bottomed by default when the offer ends.
- **Board:** granted keywords show beside the printed ones with a mark.

### Measured

**2,161 of 7,553 lines (28.6%); 1,130 cards fully, 772 partly** — from 1,774
/ 824 / 772.

### Findings — three, all from fixtures

- **The source text lost a minus sign** on 48 lines (landmine 113); the
  parser infers a reduction there and nowhere else.
- **Two of my actions shared the name `rest`**; the engine ran the wrong
  one. A smoke assertion now checks every action name the parser emits is
  one the engine handles; `restcards` is the search's.
- **Bracketed tokens are names or types**, and *[Sanji] or [Big Mom Pirates]
  type card* means a named card or a typed one. The parser asks the
  catalogue which is which and refuses a token that is neither. The fixture
  that found it was looking for Characters of the "Sanji" type: zero.

**smoke.mjs 377, render.mjs 54 (Chrome). Gate green, sealed bare.**

### DEFERRED this cycle

- **Modal effects** (*Choose one:* 37), *look at N and place them at the top
  or bottom in any order* (an ordering choice), *cannot be K.O.'d by
  effects* (protection flags), the opponent's hidden choices (*your
  opponent trashes 1 card from their hand*) — each a mechanism.
- **The whole of it on the Fold, two people.**
- The owner's list unchanged.

## Take 50 — 2026-09-03 — step (2): two sentences, "that card", and durations done right

Opened before any code (PROTOCOL §6).

### Measured first

1,569 unparsed lines are two sentences. Splitting them at the sentence
boundary and parsing each half with the existing templates: **62 have both
halves known today**, 216 know only the first, 162 only the second. The
unknown second halves are led by *that card gains an additional +N power
(during this turn/battle)* under a condition — a reference to the first
sentence's target — so a chain needs a "the card you just chose" target
and conditions evaluated at the step, not only at the trigger.

### A correctness finding on the way

*During this turn* on an opponent's Character was expiring at the
opponent's next refresh, not at the end of the current turn, because the
engine cleared modifiers only in `startTurn`. And *until the start of your
next turn* was being treated as *during this turn*. Both fixed by giving a
modifier its expiry: end of this turn, or the source player's next refresh.

### Built

- **Parser:** a two-sentence line is parsed as two templates in order, the
  second sentence's leading condition attached to its steps; *that card
  gains an additional +N* as a `prev`-target step; *until the start of your
  next turn* as its own duration; *Trash up to N*; two conditions.
  Twenty-eight controls — a three-sentence line and a two-sentence line
  with an unknown half must both stay manual.
- **Engine:** modifiers are timed — `mod(i, key, n, dur)` with an expiry
  of `endturn` (cleared for both players in `endTurn`) or `refresh:i`
  (cleared in that player's `startTurn`); `power()` sums them beside the
  untimed tray; step-level conditions are read at the step; `offer.prev`
  remembers the last chosen target for the next step; an up-to trash may
  choose none.
- **Board:** *Trash none* on an up-to step.

### Measured

**1,774 of 7,553 lines (23.5%); 824 cards fully, 772 partly** — from 1,627
/ 712 / 788. Of the 1,569 two-sentence lines, 62 have both halves known
today; 216 know the first half only and 162 the second, so every future
template pays twice.

### Findings

- **The duration bug was real and was mine.** A *−2000 during this turn* on
  the opponent's Character had been living until *their* refresh, one full
  turn too long — the kind of thing OPTCG Sim's patch notes call "is
  buffing for the turn" (class 5). The fix is an expiry on the modifier,
  not a clearing pass in the right place; the test now asserts the power on
  the opponent's card before and after `endTurn`.
- **No card in the catalogue carries a bare *until the start of your next
  turn* sentence** — the phrase always comes with a *Then* or an *up to 1
  of your Leader*. The parser control keeps the phrase; the engine test
  drives the timer directly.

**smoke.mjs 357, render.mjs 54 (Chrome). Gate green, sealed bare.**

### DEFERRED this cycle

- **Three-sentence lines**, *Up to 1 of your Leader gains +N* (a choice
  with one legal target), *None of your Characters can be K.O.'d by
  effects* (a protection flag), cost modifiers — next by count.
- **The whole of it on the Fold, two people.**
- The owner's list unchanged.

## Take 49 — 2026-09-03 — step (2): costs before actions, and Events at their two timings

Opened before any code (PROTOCOL §6).

### Measured first

After take 48 the unparsed pile is led by things a template cannot reach
without two new mechanisms. **Costs as a prefix:** *You may trash N card(s)
from your hand:* 346 lines, *DON!! −N (…):* 192, *You may rest this
Character:* 140 — "pay, then do", where declining is declining the whole
effect. **Event timings:** 580 Event lines begin [Main] and 385 begin
[Counter]; the parser refused every one at the tag, because the engine had
no moment to fire them — an Event is played from hand in Main, or in the
counter step for its cost, and its effect *is* the play. Smaller: *If your
Leader is [X],* 28; the DON!!-count comparison 36; *Play up to 1 Character
card with a cost of N or less from your hand* (a control that refused it
until the engine could do it).

### Built

- **Parser:** a cost prefix becomes the first step (`cost_trashhand`,
  `cost_returndon`, `cost_restself`); [Main] and [Counter] are triggers
  (`evmain`, `evcounter`); *If your Leader is [X]* and the DON!!-count
  comparison as conditions; typed play-from-hand under a cost or a power
  line; *Activate this card's [Main] effect*. Twenty-four controls.
- **Engine:** `canPay` decides whether a cost step can be paid and an
  unpayable effect is never offered; `apply` pays trash (a hand target),
  DON!! (active first, then rested, then given), or rests the source;
  `playCounterEvent` pays from the defender's active DON!! in the counter
  step and hands the effect on; `playfromhand` is free and keeps the five
  limit; two conditions.
- **Board:** an Event played in Main offers its [Main] effect; the counter
  step lists affordable [Counter] Events beside the Counter cards; the offer
  panel names a cost step as a cost and says that skipping it declines.

### Measured

**1,627 of 7,553 lines (21.5%); 712 cards fully, 788 partly** — from 1,143
/ 498 / 607. The three fixtures that came back empty during the test were
each the parser being right: a rest-self card whose condition was a Leader
the deck did not have, a *DON!! −5* card the fixture had not given five
DON!! for, and play-from-hand lines that exist only in the typed,
power-limited form. Each fixture now finds a card by shape and pays what
that card asks.

**smoke.mjs 348, render.mjs 54 (Chrome). Gate green, sealed bare.**

### DEFERRED this cycle

- **Cost modifiers for the turn** (40 lines) and *Then, if …* mid-sentence
  conditions (42) — next by count, each a mechanism.
- **Effects with two sentences** — the ordered-actions parse of *X. Then,
  Y.* where both halves are templates.
- **The whole of it on the Fold, two people.**
- The owner's list unchanged: the `.aab` filename, the icon, review,
  testers, screenshots, the self-test report, D16, D15, D17, D18.

## Take 48 — 2026-09-03 — step (2) grows by whole templates: chains, statics, the defender's window, the end of the turn

Opened before any code (PROTOCOL §6).

### Measured first

The unparsed lines, by shape, after take 47 (numbers and bracketed names
generalised): *Activate this card's [X] effect* 153; *Play this card* 126;
*K.O. … with N power or less* 79; *Return up to 1 Character with a cost of
N or less to the owner's hand* 60; *Add up to 1 DON!! from your DON!! deck
and set it as active* 60; *Draw N cards and trash N* 93 across two shapes;
*Place … at the bottom of the owner's deck* 51; *Give … -N power during this
turn* 48; *Your Leader gains +N power during this battle* 47; *Look at N …
reveal up to 1 [X] type card … add it to your hand* 45; *K.O. … rested
Characters …* 44; *This Character gains +N power* (a continuous effect under
a condition) 35. The two largest, 575 and 84, are the Blocker and Rush
reminder texts, already keywords.

### Chosen

Each of those becomes a whole template with its control, in count order,
which needs three things the engine did not have: an effect as a **list of
steps** (draw, then trash), **continuous** effects evaluated inside
`power()` while their condition holds, and **follow-on** offers (a
[Trigger] that activates the card's own [On Play]). Then the timings the
board did not surface: [Trigger] and [On K.O.] on the defender's result
screen, [On Block] at the block, [End of Your Turn] at the end.

### Built

- **Parser:** effects are lists of steps; eleven templates added in count
  order; a conditioned line with no trigger and the sentence *This
  Character gains +N power* is a continuous effect; eighteen controls (five
  new sentences that must parse, two more that must be refused — a static
  with no condition, a cost change).
- **Engine:** `targetsFor` names targets as strings the board can put on a
  button (`L`, `mK`, `oK`, `hK`, `dK`) on either side; `offers` carries the
  steps; `apply` runs the current step, computes the next step's targets,
  returns `done` and `follow` (a [Trigger] that activates the card's own
  [On Play]); `power()` adds continuous effects whose conditions hold, read
  live; a [Trigger] card that was activated goes to the trash after (§10-2);
  *Play this card* respects the five-Character limit and pays nothing.
- **Board:** [On Block] offered at the block; [End of Your Turn] offered
  before the turn ends and the turn ends when the offers are done; after
  Resolve the defender keeps the phone, sees the result, takes the
  [Trigger] and [On K.O.] offers, then *Done — hand back*.

### Measured

**1,143 of 7,553 lines (15.1%); 498 cards fully scripted, 607 partly** — up
from 462 / 201 / 261 at take 47, by whole templates. By trigger: 563
[Trigger], 309 [On Play], 113 [When Attacking], 73 [On K.O.], 34 continuous,
25 [End of Your Turn], 15 [On Block], 11 [Activate: Main]. Next by count in
the unparsed pile: cost changes (40, ruled out for now), *You may trash 1
card from your hand: Play this card* (33, a cost-then-action chain), the
DON!! −N cost prefix (55 across two shapes).

**smoke.mjs 332, render.mjs 54 (Chrome). Gate green, sealed bare.**

### DEFERRED this cycle

- **Costs as a prefix** — *You may trash 1 card from your hand:* and *DON!!
  −N:* before an action are the next largest shapes and need "pay, then
  do" as a step type with a refusal when the cost cannot be paid.
- **Cost modifiers** for the turn (40 lines) — their own mechanism.
- **Event timings** — [Main] and [Counter] Events from hand.
- **The whole of it on the Fold, two people.**
- The owner's list unchanged: the `.aab` filename, the icon, review,
  testers, screenshots, the self-test report, D16, D15, D17, D18.

## Take 47 — 2026-09-03 — A23 step (2) begins: an effect is data, parsed from the card's own text, and only when the whole sentence is understood

Opened before any code (PROTOCOL §6).

### The design, from take 45's requirement

Class 1 said card data must never be typed by hand. So the effects are not
written at all: `tools/effects.py` reads each printing's text from the
catalogue, splits it into effect lines, and claims a line only when the
**entire sentence** matches one of a small closed set of templates and every
bracket tag is one the engine can evaluate. Anything less is *manual* — the
board shows the text and the ⋯ tray — because a half-understood effect
executed confidently is the sim's version of entering the $1.48 printing
(AGENTS §4). Coverage is measured, not promised, and printed by the build.

### Built

- **`tools/effects.py`** — seven triggers, six conditions, twelve
  whole-sentence templates; `build()` from the bundle; `--selftest` with six
  sentences that must parse and six that must be refused (two actions in
  one sentence, two triggers on one line, a keyword's reminder text, an
  action the engine lacks, an Event timing, a second sentence). In the gate.
- **The bundle** carries `effects` and the manifest counts them; the build
  prints coverage every time.
- **The engine** — `fx`, `condOk`, `targetsFor`, `offers`, `apply` — the
  conditions evaluated by the engine, the targets computed by the engine
  from the same filters the rules use, Once Per Turn tracked per card
  instance per turn, every application logged with the sentence.
- **The board** — an offer panel at the trigger's timing: after a play,
  in the attack step before the defender's window (§7-1-1), on a Main
  button, with targets as buttons, Apply and Skip.

### Measured

**462 of 7,553 effect lines (6.1%); 201 cards fully scripted, 261 partly;**
by trigger: 200 [Trigger], 132 [On Play], 45 [When Attacking], 43 [On K.O.],
22 [End of Your Turn], 11 [Activate: Main], 9 [On Block]. The number is
small on purpose: every one of the 462 is a whole sentence the engine can
run, and every refused line is honest. Growth is a template at a time,
each with a control.

### Findings

- The first run of the duration test compared against the wrong baseline:
  refresh returns the attached DON!! as well as clearing the turn's
  modifier, so a card that had +1000 from a DON!! *and* +2000 from its
  effect goes back to its base, not to base+1000. The test was wrong, the
  engine right — §6-2 in one line.

**smoke.mjs 321, render.mjs 54 (Chrome). Gate green, sealed bare.**

### DEFERRED this cycle

- **More templates**, in order of count: "play a card with a cost of N or
  less from your hand", "K.O. ... with a cost of N or less" on the [Trigger]
  line (already parsed), chained "Then, ..." sentences as ordered actions,
  [On K.O.] and [Trigger] resolution wired into the battle result on the
  defender's screen (the offers exist; the board does not yet show them at
  that moment), [End of Your Turn] at end turn, [On Block] at block.
- **Event timings** — [Main] and [Counter] Events as a hand action and a
  counter-step action, so their scripted lines can be offered.
- **The whole of it on the Fold**, two people.
- The owner's list unchanged: the `.aab` filename, the icon, review,
  testers, screenshots, the self-test report, D16, D15, D17, D18.

## Take 46 — 2026-09-03 — A23 step (1): the hot-seat board, rules enforced, effects by hand

Opened before any code (PROTOCOL §6).

### Why now

The owner asked for autonomous work by priority. The agenda's order is core
→ scanner → collection → deck builder → Phase 8 → other games → simulator.
Of Phase 8, every open item needs a plugin measured on a device (8.9), a
data source that does not exist (8.10, 8.11), a second catalogue (8.14), a
Drive account (8.16) or the Play clock (8.13). The simulator is the one
item left whose next step is pure code against data the app already
carries, and the owner has called it the draw. A23's "not before the clock
is running" was written at take 24 to protect the closed test; the closed
test is now a review queue and a tester list on the owner's side, and
nothing here touches it. So: step (1), the hot-seat board, with the
rule-conformance requirement of take 45 as the design.

### What step (1) is, exactly

Two players, one Fold, the curtain between them. The engine owns the
things RULES.md §3 lists: setup, mulligan, Life from the deck, the five
phases with the first-turn exceptions, paying cost with DON!!, the
five-Character limit, giving DON!! on your own turn, who may attack and
whom, the four battle steps with Blocker and Counter, damage with Double
Attack and Banish, K.O., and the two defeats. **Effects are played by
hand** — a manual tray for the things a card's text does — because that is
the honest sequence and the alternative is the months-per-hundred-cards
language. No art: a card on the board is its name, cost, power, counter,
colour and keywords, from the catalogue.

### Built

- **`SIM`, the engine** — 118 lines, every rule with its section: `new`,
  `mulligan`, `placeLife`, `startTurn` (refresh, draw, DON!! with the
  turn-one exceptions), `endTurn`, `canPlay`/`play` (cost, the five limit,
  Stage replaces, Event to trash), `giveDon`, `canAttack`/`targets`/
  `attack` (first-turn ban, Rush, Leader-or-rested-Character), `blockers`/
  `block`/`noBlock`, `counters`/`counter`, `battlePowers`, `resolve`
  (ties to the attacker, Double Attack, Banish, K.O., both defeats), and a
  `manual` tray that logs every act as an effect.
- **The screen** — setup from the legal decks in Decks, mulligan one player
  at a time behind the curtain, the board (opponent, you, hand with Play
  buttons and the refusal reason inline, end turn), the battle window on
  the defender's side (block, counter, resolve with the powers named), the
  result card with Life cards shown and [Trigger] flagged, the ⋯ effect
  tray per card, a log.
- **Verified:** twenty-two smoke assertions walk a game on the showcase
  deck against RULES.md §3; Chrome deals a deck built in the page and draws
  the board (three panels, five Play buttons, real height).

### Findings

- **The catalogue's numbers are strings.** `power`, `counter` and `life`
  arrive as `"5000"`, `"1000"`, `"4"`; the first battle computed
  `"5000" + 1000` as a string and the test caught it. The engine parses at
  its edge (`num()`), once. Not a landmine on its own — the deck builder's
  analysis already parses — but the board is the third consumer, so it is
  written here.
- **Chrome's first-run tour covers a screenshot.** The board assertions
  passed while the picture showed the tour; the render now skips the tour
  before shooting. The assertion was right and the picture was still worth
  looking at (PROTOCOL §1: observe, then believe).

**smoke.mjs 308, render.mjs 54 (Chrome). Gate green, sealed bare.**

### DEFERRED this cycle

- **The board on the Fold, two people** — whether the curtain rhythm and the
  defender's window feel like a game. The only measurement that matters.
- **Step (1) polish once it has been played:** a Stage's effect, [Trigger]
  resolution, [Counter] Events, "DON!! x" conditions, Unblockable, effect
  durations beyond the turn, the rested state of returned DON!!.
- **Step (2)** — the effect language, to the take-45 requirement.
- The owner's list unchanged: the `.aab` filename, the icon, review,
  testers, screenshots, the self-test report, D16, D15, D17, D18.

## Take 45 — 2026-09-03 — an on-device self-test, and card-rule conformance on the agenda

Opened before any code (PROTOCOL §6).

### The owner's ask

Two things. For the sim, later: a way to make sure cards follow their rules
— OPTCG Sim's latest patch notes are thirteen fixes and nearly every one is
a card doing something its text does not say (a keyword always on, the
wrong colour, an effect reaching a zone it should not, a limit unchecked, a
combat state broken). On the agenda, not built. And now: a test/debug mode
like APEX ORV's self-test, so the app checks itself on the phone instead of
him tapping every feature — it will miss things, and it will still help.

### Chosen

**More → Self-test.** Fourteen checks that run on the device against the
real catalogue and the real plugins: what smoke.mjs proves in node, proven
where it matters, plus the things no harness here can reach — the OCR
plugin reading a code the app draws itself, the Filesystem backup
round-trip, the camera, notifications, ads, the sync URL, the fonts. Each
check is PASS / FAIL / SKIP with one line, the whole thing shareable as
text so a tester can paste it. smoke runs it in node, where the plugin
checks SKIP, with a control that breaks the catalogue and watches the
first check fail.

### Built

- **`SELFTEST`** — fourteen checks, `run()` and `text()`, More → Self-test →
  Run with a shareable report; smoke runs it in node: the six catalogue and
  gate checks PASS against the real bundle, the five plugin checks SKIP, the
  sync check SKIPs offline, and a truncated catalogue makes the first check
  FAIL (the control). A28 on the agenda with what it does not cover.
- **A23** carries the rule-conformance requirement for scripted effects:
  the owner's thirteen reference fixes sorted into five failure classes,
  each with the guard this app would build first, and the consequence that
  an effect is data validated against the catalogue and the engine's
  invariants, shipped with a test of what it does and does not do.
- RELEASE.md asks testers to run the self-test once and send the report.

**smoke.mjs 287, render.mjs 51 (Chrome). Gate green, sealed bare.**

### DEFERRED this cycle

- **The first self-test report from the Fold** — the OCR-on-a-drawn-code
  check is the one worth reading first: it is the scanner's OCR half with
  no card in hand.
- **A28's blind spots** — the camera stream, quad detection, the star
  detector, an ad showing, a notification arriving. Those stay the owner's
  eyes.
- **Step (2) of the sim** is not started; the requirement is the design.
- The owner's list unchanged: the `.aab` filename, the icon, review,
  testers, screenshots, D16, D15, D17, D18.

## Take 44 — 2026-09-03 — the first hot-seat primitive: pass the phone; the sim's transport measured on paper

Opened before any code (PROTOCOL §6).

### The owner's ask

Continue with an open item. For the sim: when a player ends the turn, the
screen blanks and asks for the phone to be handed over; or two phones connect
by QR and each plays on their own, the deck arriving when the game loads.
"The sim would be a huge draw." And Play should be fixed now (the one
checkbox).

### Chosen

A23 step (1) is the hot-seat board and the owner just described its first
primitive: a hand-over curtain. The Play counter is the board's seed (take
24), so the curtain goes there: a *Pass the phone* mode where only the
active player's panel shows, and *End turn* drops a curtain naming who gets
the phone next. The QR idea is not built; it is measured on paper in A23,
because the transport decision is the whole cost of step (4).

### Built

- **Pass the phone** on the Play counter: `PLAY.hotseat`, `who()`, `label()`;
  one upright panel, the opponent's Life and DON!! on a line, *End turn —
  pass the phone*, a full-screen curtain naming the next player, dismissed
  by a tap, the mode remembered per phone. The table layout is untouched and
  is the smoke control (two panels, one rotated). Eight assertions.
- **A23** carries both transports the owner described, measured on paper:
  hot-seat now; two phones by QR-signalled WebRTC on the same wifi or a
  hotspot, no server, with the QR-capacity and WebView caveats named as
  INFERRED; across the internet it is a relay — D18, not now.
- **D17** — the word *Portfolio* invited the Play checkbox that flagged the
  app; rename or keep is the owner's.
- Landmine 104 fired once more in this take: RELEASE.md's header was left
  at 42 by take 43's chained script and this take's chain stopped on it.
  Written one file per command from here.

**smoke.mjs 280, render.mjs 51 (Chrome). Gate green, sealed bare.**

### DEFERRED this cycle

- **The curtain on the Fold** — a hot-seat game between two people is the
  only real test of whether the hand-over feels right.
- **Step (1) proper** — a board with zones, hands and the rules enforced;
  the curtain is its first piece, not the board.
- **8.9 QR trade matching** shares the barcode plugin with the sim's QR
  path; measure the plugin once, on the Fold, for both.
- D17, D18, and the owner's list unchanged: the `.aab` filename, the icon,
  review, testers, screenshots, D16, D15.

## Take 43 — 2026-09-03 — Play's "organisation only" flag, and what it actually keys on

Opened before any code (PROTOCOL §6).

### What Play said

*Violation of Play Console Requirements — some types of apps can only be
distributed by organisations. You have selected an app category or declared
your app offers certain features that require an organisation account.*
Enforced Sep 3; app not available. The owner had chosen the category
**Game → Card** and asked whether that was it.

### What the policy actually keys on (read at the link, take 43)

Section 1 lists exactly four organisation-only kinds: **financial products
and services** (banking, loans, trading, investment funds, crypto), **health
apps**, **VPN**, **government**. Category is not on the list. So the trigger
is almost certainly an **App content declaration** — the *Financial
features* card is the one a "portfolio value" app can mis-answer, and the
flag says "declared your app offers certain features". The fix is in the
declarations, and the category goes to **App → Tools** at the same time
because a collection tracker is not a game (PLAY-LISTING has said so since
take 23).

### Recorded

RUNBOOK-play §5's table and its *If something goes wrong* row for this exact
message; nothing in the tree changes.

### DEFERRED this cycle

- Whether the flag clears on resubmission; if not, the appeal path is on the
  issue page.
- Take 42's list, unchanged.

## Take 42 — 2026-09-03 — back to the build: 8.12 the share page, and the simulator reference

Opened before any code (PROTOCOL §6).

### The owner's ask

Back to the build — anything to continue with? And for the agenda: the
simulator he wants in future is like OPTCG Sim (optcgsim.com), which he has
used; its zips are ~600 MB.

### Chosen

The next Phase 8 item that needs no device and no new data source: **8.12 —
a collection share page**, a single self-contained HTML file the collector
hands to anyone through the share sheet (landmine 110's mechanism, already
built): totals, top ten, set completion, the full list by set. No art in it
— it leaves the phone. A23 gets the reference and what it measures.

### Built

- **8.12 — `collectionPage()` / `shareCollectionPage()`.** One HTML file, the
  app's own tokens inlined, no script, no image, no request: the portfolio's
  total and card count, the ten most valuable, set completion with bars,
  then every line by set. More → *Share as a web page*: the share sheet on a
  device, a download in a browser. Six smoke assertions, one of which is that
  every field goes through `esc()` so a card named `<b>` cannot inject.
- **`www/render.png` no longer deploys to Pages** — removed in `bundle.sh`
  after the gate has read it.
- **A23** carries the OPTCG Sim reference, what it is (read off the site),
  what it measures for this app, and what is ruled out because of it.
  ROADMAP 8.12 done.

**smoke.mjs 272, render.mjs 51 (Chrome). Gate green, sealed bare.**

### DEFERRED this cycle

- **The share page on the Fold** — same device half as landmine 110.
- **Reference art on the page** — ruled out on purpose; the collector's own
  scan photos could go in later as data URIs, at the page's size cost.
- **8.9, 8.10, 8.11, 8.16** — each needs a plugin, a data source or a
  decision the ledger names.
- The owner's list, unchanged: the `.aab` filename, the icon, roll out and
  review, testers, screenshots, two ad units, D16, D15.

## Take 41 — 2026-09-03 — the real AdMob app ID, with the test ad units kept

Opened before any code (PROTOCOL §6).

### The owner's ask

He added OP TCG Hub in AdMob by name and got an app ID
(`ca-app-pub-6243777967151950~1538944343`, "Requires review", "Limited ad
serving — add store to lift limit", no package name). Did it find the app or
make a random one?

### The answer

It made the entry — AdMob's store lookup only finds apps *published* on the
store, and a closed test is not published, so "Add app" by name is the
correct path and the entry is the right one. The package name fills in when
the app is linked to Play after production; "Limited ad serving" is the
unlinked state and does not matter for a closed test running on Google's
test units. "Requires review" is AdMob's own app review and happens on its
side.

### What changes in the tree

`ADMOB_APP_ID` is the real one now. Google's own guidance for development is
a real app ID with the sample ad units, so the two rewarded units stay
Google's test units until the closed test is real users (A17, D11).
`ADMOB_IS_TEST` was derived from the app ID and would have flipped to false
on a build that still loads test units; it is derived from the units now,
which is what the SDK's `isTesting` flag is about. Smoke asserts the pair:
real app ID, test units, `test: true`.

### The scrubber fired on it

The take-35 credential pattern treated a real AdMob ID as a secret and
refused the seal — four hits, the config and three ledgers. It is not one:
every APK carries its app ID in the manifest, readable by anyone who installs
it. Pattern narrowed to the things that are secrets (API keys, tokens,
private keys); the scrubber's own controls still fire.

### DEFERRED this cycle

- **Two rewarded ad-unit IDs** (D11) — created in AdMob when the testers
  are real people, then two lines in `config.py`.
- Take 40's list, unchanged.

## Take 40 — 2026-09-03 — app-ads.txt live; the root site explained; audit and seal

Opened before any code (PROTOCOL §6).

### The owner's ask

Does the app-ads.txt work belong in the stack? Audit again and seal.

### What happened, and what the docs learn from it

The owner put the one line at the root of his domain: a new public repo
named `SergeantCS2.github.io`, one file, and `https://sergeantcs2.github.io/app-ads.txt`
serves it — PROVEN by his browser. The confusion on the way was fair and is
now written down in RUNBOOK-play §9: the root of `<user>.github.io` is a
separate repo from any project site, the repo's *name* is the switch, and a
README plus the one file is a complete site. AdMob's crawler reads the
listing's website, drops the path, and fetches `/app-ads.txt` from the root;
it will not look under `/optcghub/`. Nothing in the app or the pipeline
touches this, so nothing in the tree changes but the ledgers.

### The audit

App rebuilt with the scrubber, **smoke 265, render 51 in Chrome**, the
scrubber clean across the public tree, the gate's seven controls firing,
the gate green with Chrome's receipt. `node_modules` survived the take-39
seal (landmine 112's fix, seen working).

### DEFERRED this cycle

- **AdMob's verification of the file** — within a day of the listing's
  website being set; the AdMob app-ads.txt tab is the proof.
- Take 39's list, unchanged: the first `.aab`'s key, the icon, roll out and
  review, testers, export/restore on the Fold, `build.yml` versions, D16,
  D11, D15.

## Take 39 — 2026-09-03 — the audit after Play: the stack walked, the docs told, ground zero

Opened before any code (PROTOCOL §6).

### The owner's ask

Play is mostly set: audit the stack, tell every doc what Play now knows, and
return the tree to a clean starting state for whatever comes next.

### Where Play stands, as reported this session (PROVEN by the console
screenshots, not remembered)

Personal account; the app created as `com.optcghub.app`; version code 35
accepted into internal testing with two optional warnings (no R8 map, no
native symbols); the advertising-ID declaration and the Data Safety form
completed as landmine 94 says; the listing copy from take 36 pasted; the
closed-test track at 4 of 5 with roll-out and *Send for review* left; the
opt-in link and 16–18 testers next. UNKNOWN: which bundle file was uploaded
(the upload-key one or the DEVKEY one) — asked three times, not yet
answered; the fix if it was the wrong one is written in RUNBOOK-play.

### The audit

- **The stack, from nothing:** a copy with no artifacts — ingest 7 s, history,
  catalog, hashes (0 to fetch), validate, app with the scrubber (135 comments,
  177 → 146 KB), **smoke 265, render 51 in Chrome**, gate. `www/` is 484 KB.
  `bundle.sh`, `apk.sh`, `seal.sh`, both key scripts parse; both workflows
  parse; the scrubber reports 48 public files clean; the gate's seven
  negative controls fire.
- **Landmine 112 fired during the audit itself:** the take-38 seal had
  removed `node_modules`, so the clean run stopped at the strip (acorn gone)
  — one command earlier than take 37's DOM-mode render, same cause. The
  seal keeps `node_modules` now, and the gate demands Chrome's receipt
  (`www/render.png` newer than `app.js`), shown to fire in `--selftest`.
- **PROTOCOL §0 step 3** now gives the command that actually rebuilds a
  seed: modules first, then the full pipeline — this session's first turn
  found out the hard way that a seed has no TCGCSV cache and no Chrome.

### Told to the docs

A21 rewritten row by row to what the console shows; A8 registered; D1, D2,
D3 answered; RUNBOOK-play opens with the take-39 state and what is still
open; V1-STATE has a Play line under PROVEN and the two open items under
DEFERRED; the session prompt's in-flight block is the clock; landmine 112
and a note on 104; RELEASE.md at 39.

### DEFERRED this cycle

- **Which `.aab` was uploaded first** — UNKNOWN; asked, not answered. The
  next session asks before anything else Play-related.
- **The listing icon** — the console shows the jolly roger, the tree ships
  the compass (D7); one of them changes.
- **Roll out, Send for review, the opt-in link, 16–18 testers** — the clock.
- **`SergeantCS2.github.io` + `app-ads.txt`**, real unit IDs later (D11).
- **Export/restore on the Fold** (landmine 110's device half).
- **`build.yml` action versions** — warnings, one paste when they turn.
- D16, D15, A2's field half, 8.9 QR trade matching, the binder's
  pocket-per-printing toggle, the delta download (A25).

## Take 38 — 2026-09-03 — the reseal that had to be a new take

Opened before any code (PROTOCOL §6).

### What happened

Take 37's ledger writes ran as one script. The third assertion (V1-STATE's
header, which take 36 had not bumped) failed and aborted the rest, so
V1-STATE and NEW-SESSION-PROMPT still said take 35/36 when the seal ran; the
gate reads the stamp line, which `stamp.py` had fixed, so it passed. And
`seal.sh` removes `node_modules`, so render fell back to DOM mode at take 37
while the entry already said "51 (Chrome)". Neither was caught before the
seal line was read. A-203 says a reseal is a new take; landmine 104 says a
ledger write is its own command and is grep-checked, not read off the
terminal. This take is the price of both: the two docs corrected, puppeteer
reinstalled, render run in Chrome, the take-37 entry's harness line made
true, one write per command.

### DEFERRED this cycle

- Nothing new; take 37's list stands — screenshots, the frames kit's eighth
  subhead, graded copies and photos by hand, export/restore on the Fold,
  `build.yml` deprecations, D16, D11, D7, D15.

## Take 37 — 2026-09-03 — a showcase collection and deck to import for the listing screenshots

Opened before any code (PROTOCOL §6).

### The owner's ask

A cool collection and a deck to import so the eight listing screenshots
(his `optcghub-shots` kit) show a full app rather than empty states. Both
importers already exist (CSV at take 11, deck lists at takes 13/29); what did
not exist was a generator that composes them from the real catalogue, keyed
by productId (landmine 1), legal by the app's own rules, and re-runnable as
prices move.

### Where the importers are (they exist)

- **Collection:** Collect → Collection → the action row → **Import** → the
  system file picker → a CSV with a `product_id` column (the app's own export
  shape; a number without a product id is refused when it is ambiguous,
  landmine 41). Get the file onto the Fold through Drive or Files.
- **Deck:** Prep & Play → Decks → a deck → **Import** → paste lines like
  `4 OP01-016 Nami`; a Leader line sets the Leader; five list shapes (take 29).

### Built

- **`tools/showcase.py`** → `showcase/collection.csv` (51 lines, 92 cards,
  $16,227.64 at today's market: the dearest Nami and the SP Vivi the ledger
  keeps citing, six alternate arts from six sets with a cost basis, an OP01
  run 001–036 with six gaps so the binder and checklist read, playsets from
  four sets, a five-card trade pile) and `showcase/deck.txt` (Red Zoro, thirteen
  numbers, fifty cards, built from the Leader's era and base printings only so
  it reads like a deck someone owns). Deterministic from the catalogue; the
  files ship in the seed and re-generate as prices move.
- **Verified:** smoke imports both through the app's own parsing — every row
  a known productId, the deck **legal by `legality()`** with fifty cards,
  four per number, one Leader.
- The first cut of the deck was three promo Luffys and a starter-deck event
  with a sentence for a name: the cheapest-printing pool reached into
  promos. Restricting to main sets and starters of the Leader's era fixed it
  without touching the rules.

**smoke.mjs 265; render 10 in DOM mode at the seal (puppeteer gone after the take-35 seal — take 38 re-ran it in Chrome: 51). Gate green, sealed bare.**

### DEFERRED this cycle

- **Screenshots are the owner's**; the frames kit's eighth subhead still says
  a backup "survives an uninstall" — that promise was withdrawn at take 34
  (landmine 110); the corrected line is in the reply, not in this tree.
- **Graded copies, favourites, alerts and photos** are not in a CSV — set a
  few by hand before shooting the detail and binder frames.
- Export/restore on the Fold; `build.yml` deprecations; D16, D11, D7, D15.

## Take 36 — 2026-09-03 — the listing copy, in the console's shape

Opened before any code (PROTOCOL §6).

### The owner's ask

The store listing form: short description (80) and full description (4000),
in the shape the sibling app's listing used — disclaimer first, a tagline,
WHAT IS IN IT, WHAT IT DOES NOT DO, HONEST LIMITS, WHERE THE DATA COMES FROM
with links, and the note that the same list is inside the app. Play had just
accepted version code 35 into internal testing with two optional warnings
(no R8 mapping — the app is not obfuscated; no native symbols — ML Kit's).

### Done

`docs/PLAY-LISTING.md` rewritten as plain text the console renders as-is (no
markdown bold), in that shape. The take-23 short description was 84
characters; it is 75 now. The old copy promised the backup "survives
uninstalling" — withdrawn (landmine 110). Every URL in it was requested
first (RUNBOOK-play §C): TCGplayer 200, TCGCSV 200, the privacy policy on
Pages **200 — PROVEN live**, Google's ads policy 200; Bandai's rules page
returned 404 and is cited at its root instead. The gate's disclaimer check
still passes on the new opening line.

### DEFERRED this cycle

- Screenshots are the owner's; nothing here can take them.
- If Play objects to the game's name in the short description (landmine 30's
  line, deliberately crossed at take 23 with the disclaimer opening the full
  text), the fallback is written in the file.
- Export/restore on the Fold; `build.yml` deprecations; D16, D11, D7, D15.

## Take 35 — 2026-09-03 — the scrubber: what ships and what the public repo says

Opened before any code (PROTOCOL §6).

### The owner's ask

APEX ORV has a scrubber — comments, AI-vendor names, the owner's first name,
credentials — that runs before a release. Does this repo? It did not. Build
it before the Play upload.

### Measured first

The shipped `app.js` carried the first name 4 times and `index.html` 3, the
sibling project's name 3 times, 40 landmine explanations in comments; no
vendor names, no credential-shaped strings, no container paths. The public
text (README, RELEASE, privacy, listing) was clean apart from the README's
deliberate link to the sibling repo. The ledgers — a public repo since the
first commit — named the owner 157 times, used the conversational word for a
working session 21 times, and carried
the build container's home path twice.

### Findings

- **One smoke assertion was passing on a comment.** Stripping comments from
  the artifact made exactly one of 255 fail — the purchase tick on the chart
  was asserted by the words in the comment above it, not the `fillStyle` and
  `arc` below. Fifteen takes green on a sentence. Landmine 111; it asserts
  the code now.
- **The rewrite rewrote its own record.** The docs pass turned the count of
  the conversational word in this entry into a count of the replacement.
  Caught by grepping after (landmine 104), fixed by describing the word.
- **`npm install --no-save` prunes.** Adding acorn removed puppeteer from
  this container twice; render fell back to DOM mode and said so (A-53 did
  its job). `bundle.sh` installs both in one command so the runner cannot
  do the same.

### Built

- **`tools/scrub.py` + `tools/strip_comments.mjs`** — strip on build, check
  in the gate, six negative controls, a one-time docs pass. 135 comments and
  30 KB out of `app.js`; the source keeps every word.
- **The tree, scrubbed once:** 196 lines. The first name is "the owner", the
  conversational word is "session", the container home is `~`,
  the session prompt file is renamed `NEW-SESSION-PROMPT.md` and the gate's
  list says so. The GitHub handle stays where it must (the repo, the Pages host).
- **A27** on the agenda with what was ruled out, and the session prompt now
  tells the next session which words the gate refuses.

**smoke.mjs 260, render.mjs 51 (Chrome). Gate 21 checks, green, sealed bare.**

### DEFERRED this cycle

- **Nothing of the owner's has moved since take 34:** the steps in
  RUNBOOK-play are unchanged and the seed to drop is now t35.
- **Export and restore on the Fold** (landmine 110's device half).
- **`build.yml` action versions** — warnings, one paste when they turn.
- **Older release notes on GitHub still say take 29** until the next drop.
- D16, D11, D7, D15, A2's field half.

## Take 34 — 2026-09-03 — Windows, and what the repo actually shows

Opened before any code (PROTOCOL §6).

### The owner's ask

He ran `./play-key.sh` in PowerShell — *not recognized as the name of a
cmdlet* — and asked for Windows steps. The Play Console screenshot shows a
**personal** account with APEX ORV already in closed testing, so the console
is not new to him: *"I have most play things setup, ensure the app is ready."*

### Method

Read the repo, the run, the release and the Pages site before saying anything
is ready (PROTOCOL §0: verify where the person reaches it). Then a native
PowerShell script for the key, tested here under `pwsh`, not written blind.

### Findings — the repo, read rather than remembered

- **Three runs, one full.** #1 (16 s, the workflow paste itself), #2 (42 s,
  the take-30 seed, landmine 106), #3 **green end to end on take 31**: seed
  6 s, bundle 42 s — puppeteer install included — apk 4 m 36 s, **pages 14 s
  with the URL** `https://sergeantcs2.github.io/optcghub/`, which serves the
  take-31 app. The Release is take-31 with the APK and the DEVKEY bundle.
  So the phone has take 31, not 32 as I wrote last take; the take-32 APK in
  the uploads was the previous session's container build. Corrected in A21 and
  V1-STATE. Nothing newer than 31 has been dropped in yet.
- **Warnings on the run, not errors:** every action is Node 20 and is being
  forced onto Node 24; `setup-java@v4` is deprecated in favour of v5. Both
  live in the hand-pasted `build.yml`; both still work. Deferred, below.
- **16 KB page size — MEASURED on the take-32 APK.** Play requires it of new
  apps targeting Android 15+. Every arm64 library — ML Kit's 11 MB OCR
  pipeline included — loads at `0x4000`, and the zip stores all six `.so`
  files uncompressed at 16 KB-aligned offsets. The 32-bit copy is `0x1000`,
  which is fine: the rule is for the 64-bit ABIs. Nothing to change.
- **Export CSV does nothing on the phone — landmine 110.** Found by reading
  `exportCsv()` while writing the landmine-34 instructions: a `blob:` URL
  and an `<a download>`, which the Capacitor WebView drops on the floor
  after the toast. And `Documents/OPTCGHub` is readable only by the install
  that wrote it, which is exactly what a signer switch is. Both are INFERRED
  for the device and both were fixed from the plugin definitions rather than
  left: the share sheet for export, the file picker for restore, the settings
  copy made true. `hasFragileUserData` was considered and ruled out (A21).

### Built

- **`tools/play-key.ps1`** — the Windows twin of the key script, run here
  under PowerShell 7.4: keytool found in the four places it lives on Windows,
  keystore made, read back, base64 identical to the `.jks` when decoded the
  way `apk.sh` decodes it, second run refuses to overwrite, and a damaged
  keystore is refused (the control). Native calls go through a helper because
  Windows PowerShell 5.1 turns keytool's stderr into a terminating error —
  INFERRED for 5.1, which this container cannot run.
- **Export through the share sheet, restore through a file picker**, with
  five smoke assertions and the browser download path as the control.
- **RUNBOOK-play** now opens with what the repo shows, gives the one
  PowerShell line, and makes the landmine-34 dance export → import.

**smoke.mjs 255, render.mjs 51 (Chrome). Gate green, sealed bare.**

### DEFERRED this cycle

- **Export and restore on the Fold.** Both are plugin calls read from the
  definitions; neither has been seen on a phone. The first *Export CSV* that
  opens a share sheet closes landmine 110's device half.
- **`build.yml` action versions.** Node 20 actions are being forced onto
  Node 24 and `setup-java@v4` is deprecated. The run is green; the paste is
  the owner's; do it when a warning becomes an error, with one file, once.
- **The take-31 release notes say take 29** — RELEASE.md was stale on the
  runner at the time; the next seed drop replaces them.
- **`gh` on Windows** — the script prints the four values if it is absent;
  `winget install GitHub.cli` is the one-liner if he wants the script to set
  them.
- Everything of the owner's in RUNBOOK-play, D16, D11, D7, D15, A2's field half.

## Take 33 — 2026-09-03 — the runner, rehearsed here: the pipeline's last six steps, the sidecar commit, the APK job, and one trigger that could never fire

Opened before any code (PROTOCOL §6).

### Where this session started

A fresh session, from the take-32 seed and NEW-SESSION-PROMPT. PROTOCOL §0 in
order: seed unzipped, `BUILD` said 32; the outputs directory was empty (a new
session starts that way — the take-32 seed and APK were the uploads, sha256
`6b6b915c…` and `2fda1fab…`); the state document, the handoff back to take
27, the landmine index, the agenda; then the rebuild — ingest 6 s, history,
catalog, hashes (0 to fetch, 205 known unavailable), validate, app, smoke
235, render 48 in Chrome after installing puppeteer, stamp, gate green on
take 32 before anything changed.

### The owner's ask

None yet this session. The in-flight item is A21: read `ci/build.yml`,
`ci/bundle.sh`, `ci/apk.sh` against the tools *before* the next run
(landmine 105), because pipeline steps 5–10, the sidecar commit-back, Pages
and the APK job have never executed on a runner.

### Method

A reading found four things at take 30 and the first run found two more the
reading missed (take 31). So this take does not only read; it **executes
what a runner would**, as far as this container allows:

1. `bash ci/bundle.sh` in a real git checkout with a bare remote standing
   in for GitHub — every pipeline step and then the sidecar commit and push.
2. `bash ci/apk.sh` with the Android SDK stood up here the way `ubuntu-latest`
   carries it — the packaging steps, the signer readback, the AAB branch.
3. The workflow files against GitHub's own documentation for the one
   mechanism no local run can exercise: what triggers what.

### The owner's ask, when it arrived mid-take

He had the take-32 APK on the Fold from the runner's own build — *"GitHub
worked, app downloaded"* — and liked the look. Then, in order: change the
fonts (Impress BT + Anime Ace BB for the loud parts; Trebuchet MS, Avenir
Black, Open Sans Semibold for the plain); his AdMob app-ads.txt line;
revert to the old icon; get the app on Play and the 14-day clock started,
with the package signing as a script, like APEX.

### Findings

**The rehearsal (before his message).** The `seed` job's script and
`ci/bundle.sh` ran verbatim against a bare git remote standing in for
GitHub, on a fresh clone the way the bundle job checks out: all ten pipeline
steps green, the sidecar commit made and pushed by `optcghub-nightly`.
Two things it found:

1. **The nightly commit dated the fetch, not the source.** `prices
   2026-09-03` on a commit that added 2026-09-02 — the line RUNBOOK §8 tells
   the owner to look for. Landmine 109; the message now reads the newest day in
   the file.
2. **A push rejected by a moved remote lost the night.** Negative control
   first — a bare `git push` against a branch that moved mid-build was
   refused — then the fix, rebase once and push again, landed on top of the
   browser edit. In `bundle.sh`.

**The reading found the third.** `bootstrap.yml`'s push uses `GITHUB_TOKEN`,
and GitHub's own documentation says events from that token create no
workflow run except `workflow_dispatch` and `repository_dispatch`. "That
push triggers build" was never true; the owner only ever used the upload-at-root
path, where `build.yml`'s own `seed` job commits and `bundle` follows in the
same run. Landmine 108: `actions: write` and `gh workflow run build.yml` as a
last step. A hand-pasted file — `bootstrap.yml` is in the outputs and RUNBOOK
§5b says so.

**Then the runner answered the rest itself.** the owner's report that the APK
built and installed makes steps 5–10, the sidecar commit-back and the whole
`apk` job PROVEN on a runner — including `cairosvg` on `ubuntu-latest`, which
I had flagged as the one INFERRED risk. The container-side SDK stand-up is
ruled out in A21: the runner's build is the one he installs.

### Built

- **A26 — typography.** Four roles, resolved at build time, every file
  bundled, 232 KB after subsetting to Latin and woff2: Luckiest Guy
  (Apache-2.0) in Impress BT's job, Bangers (OFL) in Anime Ace BB's, Open
  Sans (OFL) as named, Nunito Sans 900 (OFL) in Avenir Black's. The CSS names
  the role, never the face, so a licensed file in `assets/user/fonts/` takes
  the role over at the next build. The four he named are not shipped as
  downloaded and A26 says why, face by face; D16 asks whether files are
  coming. Chrome reports all four LOADED and `h2` resolved to the display
  face; the control points a face at a missing file and gets `error`. Every
  layout check at four widths passed on the new metrics first time.
- **The icon**, reverted to the take-16 compass placeholder as asked; the
  jolly roger kept as `assets/icon-jollyroger.svg`. Play graphics rendered
  from it into the outputs.
- **A25 — the cellular guard**, after four DEFERRED lists (landmine 70):
  the quiet sync holds on `navigator.connection.type === 'cellular'` unless
  the new switch under More → Sync is on; an absent API proceeds; Sync now
  never asks. Four smoke controls, one the guard firing.
- **`UPDATE_URL`** set to the Pages host. INFERRED until the first *Sync
  now* on the Fold reports a date.
- **`tools/play-key.sh`** — the upload key and the four secrets in one
  command: keytool, read back before trusted, base64 round-tripped the way
  `apk.sh` decodes it, `gh secret set` when the CLI is logged in, the four
  values printed when not, refuses to overwrite. Proven here end to end.
- **RUNBOOK-play** rewritten as the whole ordered procedure — ten steps,
  landmine 34's export/uninstall/restore warning first, the Data Safety
  answers, app-ads.txt on the root user site with his line, the 12/14 rule
  re-checked against Google's current wording (unchanged).
- **`ci/bundle.sh`**: landmine 109, the push retry, a `du` that counted the
  bundle twice. **`ci/bootstrap.yml`**: landmine 108.

**smoke.mjs 248, render.mjs 51 (Chrome). Gate green, sealed bare.**

### DEFERRED this cycle

- **The APK for this take is the runner's.** No container build; drop the
  seed at the repo root and install from the Release (A21, ruled out).
- **The first Sync on the Fold.** `UPDATE_URL` and the cellular guard are
  INFERRED until a date appears under More → Sync.
- **The named fonts as files** — D16. Impress BT, Anime Ace BB and Avenir
  Black need app-embed licences; Trebuchet MS cannot ship. The slot is built.
- **Fira Sans** as a third plain face if the owner wants Trebuchet's shape.
- **Real AdMob unit IDs** (D11) — not until the closed test is real users.
- **`www/render.png` deploys to Pages** with the site; harmless, untidy.
  Exclude it from the artifact next pass.
- **8.9 trade matching via QR**, the binder's pocket-per-printing toggle,
  D15, D7's motif, A2's field half — all unchanged.
- **Everything in RUNBOOK-play** is the owner's, and the next real event is his
  first upload.

## Take 32 — 2026-09-03 — the audit, and the handoff to a new session

Opened before any code (PROTOCOL §6).

### The owner's ask

Update all documentation; audit the entire application; make it ready for
handoff; prepare a new-session handoff and every file he needs for the project
and the next conversation.

### Method

The audit runs before the state document is written, so V1-STATE describes
what is true rather than what is remembered:

1. **The app, walked.** Every screen in both modes opened in Chrome with the
   console listening; any `pageerror` is a finding.
2. **The docs, grepped.** Stale take numbers, stale counts, stale phrases,
   missing stamps, every agenda status against the roadmap.
3. **The pipeline, seal and build**, end to end, one more time.

Then `docs/V1-STATE.md` (what exists, with numbers, sorted into PROVEN /
BUILT / DEFERRED), `docs/NEW-SESSION-PROMPT.md` (what a fresh session reads
first and in what order), and PROTOCOL §0 rewritten for a session that
starts from a seed.

### The audit

- **The app, walked in Chrome with the console listening:** fourteen screens
  across both modes, the card detail, the filter sheet, three chart ranges,
  the counter's turn and life buttons — **zero errors**.
- **The docs, grepped:** no stale phrase outside the ledgers that record
  them; every living doc stamped; the parity matrix has no open row that is
  not a Phase 8 item; the ROADMAP's take-1 phase plan now sits beside a table
  of where each phase actually landed.
- **The pipeline, seal and build:** green, bare, below.

### Written for the handoff

- **`docs/V1-STATE.md`** — the inventory: PROVEN on a device / BUILT and
  verified / DEFERRED with the reason, and the measured numbers a new session
  must not re-derive.
- **`docs/NEW-SESSION-PROMPT.md`** — what a fresh session reads and in what
  order, the discipline the gate enforces, what is in flight, what it may and
  may not do. Paste it into the new session.
- **PROTOCOL §0** extended for a session that starts from a seed.
- The gate now requires both new docs in the seed.

### DEFERRED this cycle

- **Nothing new.** The DEFERRED lists of takes 27–31 are the work, and
  V1-STATE collects them.
- **The next real event is the owner's re-run of CI** with the take-31 fixes;
  steps 5–10 have never run on a runner and the next session should expect
  the next red job to teach something.

## Take 31 — 2026-09-03 — the first run on a runner: two things the reading missed

Opened before any code (PROTOCOL §6).

### The run

The owner dropped the take-30 seed at the repo root; the `seed` job unpacked and
committed it; `bundle` ran. **Ingest took 3 seconds** — TCGCSV did not
throttle a GitHub runner, which measures APEX landmine 205's risk as absent
for this source. History and catalogue built. Then:

```
restored 6657 artwork hashes from the sidecar
skipping 204 images known to be unavailable
hashes: 1/1 images failed (100.0%) — too many to be dead links
hashes failed (1) — pipeline stopped
```

One new printing since the sidecar was built; its one fetch failed; the
dead-link guard read one-of-one as a hundred percent and stopped everything.
Then the A9 failure-issue step failed: `Resource not accessible by
integration (createIssue)` — the workflow grants `contents`, `pages`,
`id-token`, and never `issues`.

### What this take does

- **`hashes.py`** — a percentage needs a sample. Below twenty attempted
  fetches the guard does not apply; a failure is recorded as unavailable and
  the pipeline continues, because the sidecar already covers 97% and the
  gate's coverage check is the real guard. Landmine 106.
- **`build.yml`** — `issues: write`. Landmine 107. This is a hand-pasted file,
  so the owner replaces it once more; the runbook says so.
- **The seed** is re-sealed as take 31 with both.

### Verified here

The exact case from the runner — one new printing, unavailable at source —
now prints *"1 of 1 new image(s) unavailable — recorded, not fatal"* and the
pipeline continues to the gate. The decision table (1/1 continue; 5/20 stop;
25/25 stop-all-failed) is asserted.

**smoke.mjs 235, render.mjs 48 (Chrome). Gate green.**

### DEFERRED this cycle

- **Running the rest.** Hashes was the fourth of ten pipeline steps; validate,
  app, smoke, render, stamp, gate, the sidecar commit, Pages and the APK job
  have still not run on a runner. Each may teach something. That is the
  deal.
- **The failure-issue step** is now permitted but has not fired successfully;
  the next red night will tell.
- **Everything of the owner's.**

## Take 30 — 2026-09-03 — the repo, for real: the workflows read against the tools, and the runbook rewritten

Opened before any code (PROTOCOL §6).

### The owner's ask

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
   hand in the session. It is a gate in `apk.sh` now: not the committed sideload key,
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
  run is the owner's, and the first red job is expected to teach something the
  reading did not — that is what the "if something goes wrong" table is for.
- **The Play side** (RUNBOOK-play) is unchanged since take 22 and correct.
- **A2's remaining half, D11, D15, D7, pictures, the cellular guard.**

## Take 29 — 2026-09-03 — import formats, the workflows checked, and "is it in a good spot"

Opened before any code (PROTOCOL §6).

### The owner's question

*"Let me know when you think it's in a good spot."* The honest answer, written
here so it is on the record:

**The core is in a good spot for a closed test, and has been since take 22.**
Every row of the reference app's parity matrix is built or disclosed;
scanning is proven on the device; the deck builder follows the official
rules; backup survives uninstall; ads are wired against test units; the tour
explains it. What stands between this seed and a running fourteen-day clock
is not code: it is the repo (A21 step 2 — `build.yml` has never run on a
runner), the Play console, screenshots from a phone, sixteen testers, and one
config line for live prices. All of it is the owner's, none of it is hard, and
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

Landmine 103 (the seal piped through `tail`) was told to the owner at take 28 and
was not in the file: the script that wrote it was chained behind a failing
build. Landmine 104 is that. Both are in the file now — grep-checked, not
read off a terminal — and AGENTS carries the two rules: the seal runs bare,
and a ledger write is its own command.

### DEFERRED this cycle

- **Cellular guard on the quiet sync.** One line; next.
- **8.9 trade matching via QR** — needs the ML Kit barcode plugin for the
  scanning half; the sharing half already exists as text.
- **Everything of the owner's** — and the assessment above says the next real
  step is his.

## Take 28 — 2026-09-03 — the colour question on the agenda; binder view; deck price history

Opened before any code (PROTOCOL §6).

### The owner's ask

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
- **D15** and everything of the owner's.

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

- **`UPDATE_URL` is empty** until the repo and Pages exist — The owner's step.
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
- **Everything of the owner's, no deadline.**

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
- **A2's remaining half, D7, D11, pictures, the repo** — The owner's.

## Take 24 — 2026-09-03 — two modes, a game-day counter, and a correction to landmine 96

Opened before any code (PROTOCOL §6).

### The owner's answers and asks

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
  repo** — The owner's, no deadline.

## Take 23 — 2026-09-03 — multi-game measured, an ideas backlog, and the road to Play

Opened before any code (PROTOCOL §6).

### The owner's three asks

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
  The repo has never built on a runner; that is step 2 and it is the owner's.

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

### The owner's answer, in effect

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
- **A2's remaining half, D7, pictures** — The owner's, no deadline.

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
- **A2's remaining half, D7, the picture slots** — The owner's.
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
   night fails; nothing tells the owner a night failed. Three nights should.
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
- **A2's remaining half, D11, D7** — The owner's.

## Take 19 — 2026-09-02 — the guide, the picture slots, and the gate catching me

**Opened AFTER the code, and the gate is what made me write this line.** the owner
asked for a tutorial and a copy audit; I built both and ran the gate to check
the new stale-copy guard, and it reported *"no HANDOFF entry for take 19 —
write it FIRST (PROTOCOL §6)"* alongside the copy it had found. Take 2 inverted
§6 and said so; take 19 did it again, nineteen takes in, and this time a check
said so instead of me. That is the whole point of the check. Landmine 89.

### The owner's ask

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
- **A2's remaining half, D11, D7** — The owner's.

## Take 18 — 2026-09-02 — portfolios, the Trade Analyzer, and a gate for the docs

Opened before any code (PROTOCOL §6).

### The owner's standing instruction, now a rule

Every take: the agenda in the session, the docs in the seed, the ledgers and gate
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
- **A9 — nightly failure alerting.** Nothing tells the owner when a build has failed
  three nights running.
- **A2's remaining half, the ad SDK (D11), D7.**

## Take 17 — 2026-09-02 — the game's own iconography, and one thing declined

Opened before any code (PROTOCOL §6).

### The owner's ask

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
  motif the owner wants that nobody owns. A sketch would settle it.
- **The splash** still renders from the icon at 30% — fine, but it could carry
  the compass at full bleed.
- **A2's remaining half, the ad SDK, Trade Analyzer, multiple portfolios** —
  unchanged.

## Take 16 — 2026-09-02 — first field data: A2 answers YES, and four things it showed

Opened before any code (PROTOCOL §6). The owner ran take 15 on the Fold at
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
- **A2.** the owner's.

## Take 14 — 2026-09-02 — the first device test approaches; make it informative

Opened before any code (PROTOCOL §6).

The owner wants to test tonight, and said not to alter priorities for it — work
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

### The owner's ask

Ad revenue, probably Google's. Two starting ideas: 20 scans free, 20 more per
short rewarded ad, repeating; and 1 free deck build, one more per ad, repeating.
APEX stays free and ad-less; that is irrelevant here.

This is his app and his decision. The job of this take is to put it on the
agenda *with the ledger's honesty intact*: three things this repo has written
down as principles are touched, and one data-source term has to be checked
before the idea is viable at all. Then to design the mechanism so it does not
recreate the thing the app was built to replace, and to ask the questions only
The owner can answer.

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

Starting numbers (20 / +20 / 1 / +1) are the owner's and live in config.
`@capacitor-community/admob` 8.1.0 is on npm at `latest`; its API is read from
`definitions.d.ts` at the integration take, not now. README and landmine 31 no
longer say "no ads" — a doc that lies is worse than none. D10–D13 ask the
questions only the owner can answer, starting with whether an AdMob account exists.

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

### The owner's ask

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
  the owner says what he wants — and this take asks.

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

### The owner's clarification, and what it changes

APEX ORV was sent for its *process* — the ledgers, the gate, the harnesses, the
take discipline — not to bind this app to its stack. The build process and core
are free to change for this repo. And he is following the same Play route, which
worked: APEX ORV is in closed testing now.

Two things follow.

**A3 gets re-examined.** The take-1 stack decision rested on two legs: the
governance toolchain (which transfers regardless of stack) and the phone-only
constraint (which no longer applies — The owner has a PC). With both removed, does
Capacitor still hold? Answered in A3 below: yes, and the reason is no longer
"because APEX" but because the scanner was designed as one OCR call per *card*
on a stable quad, not per *frame* through the bridge, which was the only place
native would have clearly won. Ten takes of harnesses and a proven signed APK
would be thrown away for a benefit the design already avoided needing.

**A35's question is answered.** the owner has a Play developer account and it has
passed or is passing the closed-testing gate. Landmine 35's calendar risk is
known, not unknown.

### This take

By the owner's order: the collection with proper filtering and sorting. The
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

### The owner's reordering

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

ROADMAP now carries the owner's order: scanner (done), then filtering and sorting
proper (take 11), then the deck builder with the rules understood first (12+).
A2's field half and A14 are marked as closing only on a device, by
construction, so nobody reads them as unfinished work.

### DEFERRED this cycle

- **The camera.** Every stage but the sensor. Unchanged and unchangeable here.
- **Torch and exposure lock** (landmine 10's foil mitigation) — `getUserMedia`
  track constraints, not written; the rig has torch, the app does not yet.
- **Filtering and sorting proper** — next take, by the owner's order.
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

**The owner asked how to use this in a new GitHub repo.** The honest answer is that
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

The owner asked how to use this in a new repo. **`docs/RUNBOOK.md`** — four screens,
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
- **The Play upload key does not exist.** It is the owner's to generate, on the
  Fold or the PC, and it must never enter a session. RUNBOOK-play §A.3.
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

Re-reading the owner's five screenshots against what is built, the most visible thing
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
(−5.1%), now $1,996.94. The Vivi SP from the owner's screenshot: +$0.00 (+0.00%),
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

**The Phase 0 rig has carried that regex since take 4.** Had the owner run his thirty
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

- **A2 is still open and still only the owner can close it.** Take 6 answered the
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

The owner's call: **OP TCG Hub**. Package `com.optcghub.app`, permanent from first
registration. A8 closed after blocking the first commit for three takes.

A deck builder is wanted eventually and explicitly not a priority. It goes on the
roadmap at Phase 7 and this take checks only whether the catalogue could feed one
— a feasibility answer costs minutes, and discovering at Phase 7 that a required
field was never ingested costs a rebuild.

### What this take set out to close

A2 has been the top blocker since take 1 and has survived three takes untouched,
for the honest reason that a camera cannot be measured from here. So the
deliverable is the *instrument*: something the owner can open on the Fold that runs
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

- **A2 is still UNKNOWN and only the owner can close it.** The rig exists; nobody has
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
The owner's screenshots that the data layer could already serve but the UI did not.

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
- **App** — every screen in the owner's screenshots: portfolio hero with sparkline
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
No CI, no APK. `optcghub-seed-t2.zip`, sha256 printed beside it in the session.

---

## Take 1 — 2026-09-01 — the data question, answered before anything was built

Project opened. No code this take; the deliverable is the governance seed and one
measurement that decided the architecture.

**The question that mattered.** the owner's budget is $0 and he asked to lean on
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

Then the check that closed the question. The owner's most valuable card, from his own
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
behind that stack on the same Capacitor major APEX already ships. The owner now has PC
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
