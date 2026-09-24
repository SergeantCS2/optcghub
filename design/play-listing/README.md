# The Play listing: screenshots and feature graphic in the D7 scheme

This is a design source for the store listing. **Nothing here ships.** The build never reads this
directory, and the Play console upload is the owner's.

The listing uses the icon's scheme, D7 v4 (`design/d7-icons/v4`):
- the Prussian ichimonji band over a buff sky
- the icon's own bottom waves
- the ink keyline and the green offset print the card wears

The frames show the app's real screens from the live Pages build, filled with the showcase collection
and deck. The collection is the fake one in `showcase/`, generated at take 37 for exactly this: 51 lines,
92 cards, and a trade pile. The deck is a legal fifty-card Red Zoro. Both go in through the app's own
importers, the way a collector would bring them in.

## The files

| File | What it does |
|---|---|
| `capture.mjs` | Opens the live build at the Fold's cover viewport (411 × 960 at 2.625), imports the showcase deck and collection, and shoots eight screens. |
| `frames.py` | Writes eight 1080 × 1920 frames and the 1024 × 500 feature graphic as HTML, and holds the guards. |
| `render.mjs` | Shoots the frames and measures each caption. |
| `lib.mjs` | Holds what the scripts share: Playwright, the request route and the output directory. |

## Run

```bash
export LISTING_OUT=../play-listing-build          # outside the tree (the default)
node design/play-listing/capture.mjs              # shots/ and report.json
python3 design/play-listing/frames.py --selftest  # the guard, watched to fail first (below)
python3 design/play-listing/frames.py [icon.svg]  # frames/*.html; the icon defaults to v4 own-purple
node design/play-listing/render.mjs               # frames/out/*.png
```

`node design/play-listing/capture.mjs x` runs only the negative control's step.

## What is held, and how

Google's listing rules:
- a caption at most 20 % of the image
- no "Free", no call to action, no rankings
- no device frame
- no third-party characters (see card art, below)
- at least four screenshots at 1080 px or more

**Captions.** `render.mjs` measures each caption block and refuses one over 20 % or a headline that
wraps past two lines. The measured shares are 16.5 % to 18.8 %. `frames.py` refuses a restricted word
in any headline or subline.

**The app's own words.**
- **The check.** `capture.mjs` records every restricted word visible in each screen and where it sits.
  `frames.py` maps each one into its frame and refuses a frame that shows one above the sea.
- **Why it exists.** The web build's copy says "free" in several places: the first-run guide, Save
  credits, the data sources, the graded note. The first draft framed Settings at Data sources and
  showed two of them.
- **The negative control.** `--selftest` runs the guard against that first-draft framing (the
  `x-settings-first-draft` step) and must see it refuse before it passes the frames as they stand.

**Card art.** It is on, and that is the owner's call (24 Sept). Without it the pictures were plain,
since the art is the collection's own cards. Every request goes through Node, and each shot waits until
the art on screen has loaded. The run's report counts the art fetched and whether each screen finished.
`NO_ART=1` refuses the image CDN, for a set with no character art: Google restricts third-party
characters in listing images, so a review could ask for that set. Many of TCGplayer's scans carry a
"SAMPLE" mark. That is what the app shows too.

**Prices.** Home's chart is the collection's value on each night of the app's own price history
(`CAT.hist`). A fresh import has only today, so this reconstructs the month from real prices; it is not
an invented line.

## Not here

- **Rendered PNGs and HTML.** They are generated, and they stay outside the tree.
- **The owner's icon pick** (the printed back's emblem). It stays out of this public repository until he
  says to ship it, as `design/d7-icons/README.md` says. `frames.py` takes it as an argument; by default
  it uses the public `own-purple`.
- **The listing text** (`docs/PLAY-LISTING.md`). That belongs to a take.
