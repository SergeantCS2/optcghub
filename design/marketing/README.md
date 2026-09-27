# Marketing: the App campaign's and the listing's creatives

**Start with `CLAUDE.md` here**: the brief, the rulings, the specs, the styles and what is in progress.
This file is the short reference.

A design source for the App campaign that promotes the Play listing. **Nothing here ships.** The build
never reads this directory. The owner uploads to Google Ads, and the owner uploads videos to YouTube.
The renders go outside the tree, like the listing's (`design/play-listing`), because they carry card art,
which is never committed (landmines 26, 28).

## What the owner decided (27 Sept)

- **Card art is on**, as in the listing, and some creatives use it as the hero. The owner accepts the
  rights risk for this project. `NO_ART=1` still refuses the image CDN.
- **The game is named only for what the app does**: "One Piece TCG card scanner", never as the app's
  name, never with "official" or a publisher's name.
- **Video first from real screens.** The motion pipeline (next) takes the owner's footage and reference
  videos later.

## The rules every creative keeps

- **No price or multiple in the text.** EB03-024's spread was 316× in the README, 110× on the listing and
  63× in the app on 27 Sept. Prices appear only inside images, read from the day's capture
  (`report.json`), with the footnote "TCGplayer market prices, <day>".
- **Never "no ads".** Rewarded ads unlock saves (landmine 88). "Free" is true, and Ads allows it.
- **A sample is labelled.** The collection is `showcase/`'s, and its images say "A sample collection".
- **No fake Install button.** The ad unit draws its own.
- **Google's App-campaign guidance:** overlay under 20 % of the image, nothing upside-down (so no
  Game-day screen), and tight UI crops rather than a whole phone.
- **Web-build copy that is false on the phone stays out of frame.** The scan screen's "Saving to the
  collection is too, for now" is the browser build's; on Android saves need credits.

## Specs (Google Ads Help, 27 Sept 2026)

| Asset | Limits |
|---|---|
| Headlines | 1–5, 30 characters |
| Descriptions | 1–5, 90 characters |
| Images | up to 20, .png/.jpg at most 5 MB: 1200×628, 1200×1200, 1200×1500 |
| Videos | up to 20, on YouTube: 16:9, 9:16, 1:1, 10–60 s |
| HTML5 | up to 20 (AdMob only): .zip at most 5 MB and 512 files, `ad.orientation` meta, `ExitApi.exit()` |

## Run

```bash
export ADS_OUT=../ads-build                    # outside the tree (the default)
python3 design/marketing/copy_assets.py --selftest   # the text guard, watched to refuse each planted line
python3 design/marketing/copy_assets.py              # the five headlines and five descriptions -> copy.txt
node design/marketing/capture.mjs                    # the live build's screens and the hero art -> shots/, art/, report.json
python3 design/marketing/style_listing.py           # style v1's compositions -> images/*.html
bash design/marketing/fetch_fonts.sh                # the premium drafts' OFL typefaces -> fonts/
python3 design/marketing/directions.py              # the four premium drafts -> directions/*.html
node design/marketing/render.mjs --selftest          # the image guard, watched to refuse each planted frame
node design/marketing/render.mjs [--dir directions]  # NAME/out/*.png, report.json, NAME/thumbs.png
```

## The files

| File | What it does |
|---|---|
| `copy_assets.py` | The text assets and their guard: length, "!" and "!!", capitals, prices and multiples, "no ads", affiliation, superlatives, emoji, the game's name. |
| `capture.mjs` | Seeds the live build as the listing does, then shoots the ads' states (the picker, Home, the binder, the card, the deck, Home offline, the Fold's open screen) and the hero printings' own scans. Every number and position goes to `report.json`. |
| `style_listing.py` | Four concepts at three ratios, in the listing's scheme (it imports `design/play-listing/frames.py`). |
| `render.mjs` | Shoots them and refuses a wrong size, over 5 MB, an overlay of 20 % or more, anything within 24 px of an edge, a missing font or a broken image. |
| `directions.py` | Round 1 premium drafts (vault, wano, guide, launch): premium, and too far from the franchise (the owner). |
| `directions2.py` | Round 2 drafts (pull, jump, episode): gacha, manga and the anime, kept premium. |
| `fetch_fonts.sh` | Their typefaces, OFL-1.1, from npm's @fontsource packages; nothing committed until a pick. |
| `paths.mjs` | Where the renders go. |

## The concepts

| Concept | Caption | Proof |
|---|---|---|
| printing | One number. Every printing. | OP01-120's three printings (base, parallel, manga parallel) with their prices, and on 4:5 the picker's own "N printings share …" line |
| value | Know what it's worth. | Home's total and its month |
| binder | Your binder, priced. | The open Fold's row of four, each card at its printing's price |
| offline | Works with no signal. | Home with its "Offline OK" pill |

**The hero printings** are OP01-120 454664, 454665 and 454666. Of the 30 numbers with the widest spread
on 27 Sept, these were the three scans of one number without TCGplayer's "SAMPLE" mark (read by eye).

**The offline pill is staged, and the report says so.** On the phone the catalogue ships in the APK, so a
session in airplane mode makes no request, and Home's pill reads "Offline OK". The web build fetched its
catalogue at load, so the capture zeroes the session's count and paints the pill as `paintNet()` paints
a zero count.

**Card art offline:** reference art is hot-linked and memory-cached only, so the offline creative shows
the value, not the art.
