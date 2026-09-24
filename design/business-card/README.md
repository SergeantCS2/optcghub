# Business card: the trading-card frame

This is a design source for a business card the owner prints at home and hands to players and store
owners. **Nothing here ships.** The build never reads this directory.

The stock is a 3.5 × 2 in card on a 10-up perforated Letter sheet: double-sided, heavyweight matte, for
laser or inkjet.

## The card

**How it got here:**
1. The owner picked the first round's draft A, the portrait trading-card layout.
2. The next round made it a Leader card: a power number, keyword effects, a LEADER tab, a card number.
3. He liked the creativity, but not the parody. It was hard to tell what the card was for. He asked for
   it "a bit more professional and clear that this is a card for a new app that's like Collectr but for
   One Piece".

`leader.py` builds that card. The frame stays, because the style is what he liked. The card says what the
app is in its own words, not a competitor's.

**Front**, in reading order:
1. **The art:** the icon's own scene from its bleed layers.
2. **The name plate:** OP TCG HUB, "One Piece TCG collection tracker".
3. **Three plain lines**, each with a line icon drawn here:
   - Scan a card: its exact printing and price.
   - Track what your collection is worth.
   - Build decks and hunt sealed product.
4. **Google's own "Get it on Google Play" badge**, 0.32 in tall and centred at the bottom.

**Why the badge and not the logo.** The owner asked for "Available on" with the Play logo, to save space.
Google's badge page (Partner Marketing Hub, lockups-icons-badges) rules this out:
- "Don't use the icon in marketing materials."
- Download promotion uses the badge.
- The badge is at least 0.3 in tall in print, with a quarter of its height clear all round.
- "Don't change the badge color", and "Don't remove or rearrange badge elements".

He chose the official badge at the bottom. `leader.py` fetches Google's hosted artwork at build time
(`play.google.com/.../en_badge_web_generic.png`, carrying the current 2022 logo). It crops only the
transparent margin and never commits the file. `--badge` takes the Partner Marketing Hub's download
instead.

**Back:** our own card back, as he approved it: the white field, the purple border, and our compass rose
(inner ring off, as the icon's risk panel ruled).
- **The QR** is the rose's hub, 1.24 in on its tile. It leads to the live listing, tagged so the
  installs it brings can be counted (see Counting the card's installs).
- **Below it:** the search fallback, then ANDROID · NO ACCOUNT / WORKS OFFLINE.
- **No disclaimer.** The owner took it off: it matters to Google Play, not to the card.
- **Texture:** manga screentone in the corners, knocked out behind the lettering. There are no radiating
  chart lines: the v3 panel cut them for echoing the Rising Sun flag.

`cards.py` keeps the first round's drafts A, B and C for the record.

## Run

```bash
export CARD_OUT=../business-card-build                     # outside the tree (the default)
python3 design/business-card/leader.py [icon-layers]       # icon-layers: the base path of -bg/-fg.svg (default: v4 own-purple)
node    design/business-card/render.mjs leader             # the two faces at 300 dpi, with the print rules checked
node    design/business-card/sheet.mjs                     # the test sheet, and front.pdf and back.pdf at trim + bleed
python3 design/business-card/impose.py                     # optcghub-cards.pdf and optcghub-cards-short-edge.pdf
python3 design/business-card/checksheet.py                 # the PDFs, checked as the printer will read them
```

The run needs `segno` (the QR), `zxing-cpp` (the decoder that checks it) and `pymupdf` (imposition and
the PDF checks), from pip. It also needs play.google.com, for the badge (or `--badge` with a local copy).

**Calibration.** `leader.py --front-dx --front-dy --back-dx --back-dy` (inches) moves a whole side. Use
it when the test sheet's lines miss the perforations. The sheet is assumed to have 0.75 in side margins
and a 0.5 in top margin, two columns by five rows, with no gutters (the common 10-up layout). The test
sheet is how to confirm it.

## How it is imposed, and why

Each face is printed on its own page at trim plus bleed (2.125 × 3.625 in). PyMuPDF places it ten times
on Letter, as vectors, turned a quarter into each 3.5 × 2 in cell:
- **Fronts** face the card's top east.
- **Backs** face it west, so a long-edge flip, the usual duplex, lands each back upright under its front.
- **The short-edge variant** turns the backs like the fronts.

Each face keeps its 1/16 in bleed only on the sides that meet the sheet's margins. Between neighbours
the cut is shared, and one card's bleed would eat the other's edge.

Two HTML impositions failed first, and `checksheet.py` refused both:
- **Turning each card inside its cell.** Each card's upright layout box ran past the page on the bottom
  row, and Chromium's print pagination split it.
- **Turning a whole 11 × 8.5 in board onto the page.** The board overflowed the page's width, and
  Chromium shrank the page by 8.5/11 to fit.

## What is held, and how

**`render.mjs`, on each face at 300 dpi:**
- No type under 6.5 pt. Nothing that matters inside the 0.125 in safe zone.
- No type running into other type, measured on each line's real font box. It refused both Leader-card
  first layouts: the name plate's rows touched, and the back's list ran into the disclaimer.
- **Google's badge rule.** The badge renders at least 0.3 in tall, loaded, with a quarter of its height
  clear of every line of text and of the panel's edge. It measures 0.32 in and 0.083 in clear, printing
  at about 525 dpi. It was watched to refuse the badge shrunk to 0.25 in.

**`checksheet.py`, on the PDFs rasterised at 300 dpi:**
- **Page size and fonts.** Two pages, each exactly Letter. Every font is embedded or drawn as Type3
  glyphs, never left to the printer to substitute.
- **Test sheet.** The cut lines sit on the perforation positions to within a pixel, and the 1 in scale
  measures 1.000 in.
- **Cell orientation.** Each of the 40 cells matches its face turned the right way. The worst mean
  difference was 2.6 of 255 on the first imposition. The control is the same cell against the wrong
  turn, which differed by 45 or more.
- **QRs.** All 20 on the back pages decode to the card's tagged URL (`qr_url` in `build.json`). It was
  watched to refuse the untagged PDF printed before the tag: 0 of 20 matched.
- **Bleed.** It shows 0.03 in past the grid, and paper shows at 0.10 in.
- **The back preview's QR.** It is level Q, version 9 (the tagged URL is 123 characters), on a 1.24 in
  tile. It decodes at 300 and 90 dpi, and a copy with one finder pattern painted over is refused.

## Counting the card's installs

The QR carries Google's Play URL-builder format, the one Play Console's help links to for "Tracked
channels (UTM)":

```
https://play.google.com/store/apps/details?id=com.optcghub.app&referrer=utm_source%3Dbusiness_card%26utm_campaign%3Dcard_qr
```

**Where to read it:** Play Console → **Grow users → Store performance → Conversion analysis**, with the
traffic source filtered to ads and referrals. Then filter by **UTM source `business_card`** or **UTM
campaign `card_qr`** for the card's store listing visitors and installs.

What it counts:
- **What reaches it:** scans that open the listing in the Play Store app, which is the usual path on
  Android. A scan that opens in a browser, or on an iPhone, doesn't reach the Play Store app.
- **What it doesn't count:** people. Figures are visits and installs from the card.
- **When:** figures arrive a day or two later.

The app itself reads no referrer, and has no analytics SDK.

A second print run can carry its own campaign (say, separate cards for players and for stores). That
means a new `CARD_URL` and its own print file.

## Printing it

1. Print `optcghub-cards-test.pdf` on plain paper at **100 % / Actual size**, both pages, duplex, flip on
   the long edge.
2. Hold page 1 over a card sheet. Every line should sit on a perforation. Then hold the test to the light:
   each back arrow should lie over its front arrow.
3. If the lines miss, measure the offset and rebuild with the calibration flags. If the arrows disagree,
   use `optcghub-cards-short-edge.pdf`.
4. Print `optcghub-cards.pdf` on the card stock, at the same settings.

Home printers drift by about a millimetre, so the frame's purple border shows it the way a real card
shows its centring.

## Not here

- **The owner's icon pick** (the printed back's emblem) as the default. It now ships as
  `assets/icon*.svg` (`design/d7-icons/SHIP.md`). `python3 design/business-card/leader.py assets/icon`
  builds the card he prints with it, and the default stays our own rose (`own-purple`).
- **Anything rendered.** PNGs and PDFs are generated, and they stay outside the tree.
- **Google's badge.** It is fetched at build time into the output directory, and never committed.
