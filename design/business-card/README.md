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
1. **The art:** the icon's own scene from its bleed layers, with a NEW APP badge.
2. **The name plate:** OP TCG HUB, "One Piece TCG collection tracker".
3. **Three plain lines**, each with a line icon drawn here:
   - Scan a card: its exact printing and price.
   - Track what your collection is worth.
   - Build decks and hunt sealed product.
4. **The one action:** "Scan the back to get the app".

**Back:** our own card back, as he approved it: the white field, the purple border, and our compass rose
(inner ring off, as the icon's risk panel ruled).
- **The QR** is the rose's hub, 1.08 in on its tile, and leads to the live listing.
- **Below it:**
  - the search fallback
  - ANDROID · NO ACCOUNT · WORKS OFFLINE
  - the disclaimer: independent, not affiliated with Bandai
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
the PDF checks), from pip.

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

**`checksheet.py`, on the PDFs rasterised at 300 dpi:**
- **Page size and fonts.** Two pages, each exactly Letter. Every font is embedded or drawn as Type3
  glyphs, never left to the printer to substitute.
- **Test sheet.** The cut lines sit on the perforation positions to within a pixel, and the 1 in scale
  measures 1.000 in.
- **Cell orientation.** Each of the 40 cells matches its face turned the right way. The worst mean
  difference was 2.6 of 255 on the first imposition. The control is the same cell against the wrong
  turn, which differed by 45 or more.
- **QRs.** All 20 on the back pages decode to the listing.
- **Bleed.** It shows 0.03 in past the grid, and paper shows at 0.10 in.
- **The back preview's QR.** It is level Q, version 6, about 0.9 in without its quiet zone. It decodes
  at 300 and 90 dpi, and a copy with one finder pattern painted over is refused.

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

- **The owner's icon pick** (the printed back's emblem). It stays out of this public repository until
  he says to ship it, and the card's art defaults to our own rose (`own-purple`).
- **Anything rendered.** PNGs and PDFs are generated, and they stay outside the tree.
