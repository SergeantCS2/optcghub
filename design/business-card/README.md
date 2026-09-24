# Business card: drafts

This is a design source for a business card the owner prints at home and hands to players and store
owners. **Nothing here ships.** The build never reads this directory.

The stock is a 3.5 × 2 in card on a 10-up perforated sheet: double-sided, heavyweight matte, for laser or
inkjet.

## The drafts

| Draft | Front | Back | For |
|---|---|---|---|
| A: Leader card | portrait, laid out like a trading card of our own design: the icon as the art, two keyword lines | QR, five one-line features | players |
| B: One number | "One number. 110× apart.": EB03-024's three printings at $4.02, $27.56 and $441.73, dated | the light back | collectors and store owners |
| C: ドン!! | the icon's word, big, with the name on the sand | the dark back | the one people remember |

Everything comes from the product's own system: the icon, its ドン!! word (drawn by `design/d7-icons/v3`),
the listing's colours, and the app's brass for prices. B's prices are the catalogue's, and the card
carries their date.

## Run

```bash
export CARD_OUT=../business-card-build             # outside the tree (the default)
python3 design/business-card/cards.py [icon.svg]   # html/; the icon defaults to v4 own-purple
node design/business-card/render.mjs               # png/ at 300 dpi
python3 design/business-card/verify.py             # the QR and edge checks, and preview.png
```

The run needs `segno` (the QR) and `zxing-cpp` (the decoder that checks it), from pip.

## What is held, and how

- **The QR.** It points at the live listing, `play.google.com/store/apps/details?id=com.optcghub.app`.
  It is level Q, version 6, about 0.95 in, with its quiet zone on a light tile. `verify.py` decodes it
  from every back at 300 dpi and again at 90 dpi, about a phone at arm's length. A copy with one finder
  pattern painted over must fail to decode, which proves the decoder is looking.
- **The safe zone.** `render.mjs` refuses text, the QR, the icon or the word inside 0.125 in of a cut.
- **The type.** No size under 6.5 pt. `text-rendering: geometricPrecision`, because hinting spaced the
  small type unevenly.
- **Overlap.** `render.mjs` refuses type that runs into other type, and the word or the QR covering
  type. It was watched to refuse the first drafts, whose A back ran its list into the disclaimer and
  whose C word covered the name.
- **The cut edges.** A keyline near an edge shows every millimetre a home printer is off, so each edge
  is one ground colour. `verify.py` measures the ink on every line parallel to an edge within 0.1 in,
  and refuses a keyline drawn 0.05 in inside the cut.
- **The disclaimer.** Every back says "Independent app. Not affiliated with Bandai."

## Not yet

- **The print sheet**, 10-up with an alignment test page, comes after the owner picks a draft.
- **The owner's icon pick** (the printed back's emblem) stays out of this public repository.
  `cards.py` takes it as an argument.
