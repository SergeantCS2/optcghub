# OP TCG Hub marketing: ads, store screenshots, video, HTML5

This directory is the marketing project's own home. The repo's root `CLAUDE.md` and `AGENTS.md` still
bind (the contract, the scrubber, the record), but this file carries what a session needs for marketing
work. Read it before touching anything here. It is public: "the owner" and "session" are the words, and
no personal name, vendor name or the scrubber's other markers appear in it.

**Nothing here ships.** The app build never reads `design/`. The owner uploads everything to Google Ads,
the Play Console and YouTube; a session never touches those accounts.

## Ground rules

- **Branches only, never `main`.** Commit to the session's branch, push it, and open no PR unless the
  owner asks. Named paths only, never `git add -A`.
- **Commit text carries no vendor name or co-author trailer** (the repo is public; NSP and the scrubber).
- **Renders stay outside the tree** in `$ADS_OUT` (default `../ads-build`). They carry card art, which is
  never committed or bundled (landmines 26, 28). The owner receives renders directly from the session.
- **Every guard gets a negative control**: watched to refuse a planted bad case before it is trusted
  (AGENTS rule 2).
- **Before any push:** check the files here against `tools/scrub.py`'s markers (the scrubber scans
  `tools/`, `ci/` and `docs/`, not `design/`, so check by hand), and run
  `python3 tools/scrub.py --check --docs`.
- **The look before hand-off:** a session reads every PNG and frame it made, at full size and at
  thumbnail size, before sending it. The owner's picks gate the next wave.
- **App UI changes are not this project's.** If an ad needs the app to look different, that belongs to
  the UI/UX session (take 104). Marketing shows the app as it is.

## The brief (the owner, 27 Sept 2026)

- Google Ads **App campaign** for `com.optcghub.app` (Play, live since 24 Sept 2026; Tools; contains
  ads; 1+ downloads and no ratings on 27 Sept).
- Wave 1 was "not a bad start, but I want something fresh". The brief is **more premium**, and the owner
  did not yet know what that means, so it is chosen by looking at drafts.
- **Only the icon stays.** Fonts, colours, the waves and the comic lettering may all change.
- **Scope: ads and the Play listing.** The chosen style also replaces the listing's 8 screenshots and
  its feature graphic.
- **Audience: collectors and players first**, then sealed hunters and stores/events.
- **Video matters most for reach.** It starts from real screens; the owner has inspiration videos and
  possibly tools to load, and wants the session able to make video itself.

## Product truths

**May be claimed:**
- unlimited scanning, never gated;
- printing-level identification that asks when unsure;
- today's TCGplayer market price, with its date;
- works with no signal;
- no account, no subscription;
- a deck builder checked against the Comprehensive Rules;
- a trade analyzer;
- a Life and DON!! counter (in pictures only, never "DON!!" in ad text: Google refuses "!!");
- sealed-product Hunt with local stores and events (US);
- CSV export and a backup on every save;
- free, with short rewarded ads that unlock saves.

**Never:**
- "no ads" (landmine 88);
- per-condition value;
- Japanese coverage;
- any price or multiple in ad text. EB03-024's spread read 316×, 110× and 63× in one month, so a
  number goes stale within a week. Numbers appear only inside pictures, read from the day's capture,
  with "TCGplayer market prices, <day>".
- invented customers, ratings or rankings;
- a fake Install button (the ad unit draws its own);
- web-build copy that is false on the phone, such as the scan screen's "Saving to the collection is
  too, for now".

**Labelled:** the showcase collection is "A sample collection". A staged state says so in the report.

## The owner's rulings

- **Card art is on**, and may be the hero (27 Sept). The owner accepts the rights risk. `NO_ART=1`
  refuses the image CDN if ever needed.
- **The game is named only for what the app does**: "One Piece TCG card scanner", yes. Never as the
  app's name or in a brand lockup, never with "official", "licensed" or a publisher's name.
- **The icon is fixed** (take 113, the owner's pick; `assets/icon.svg`).
- **No generated-looking scenery.** The owner turned down a scaled-up sea and a beach for the feature
  graphic.
- **Card art is hot-linked and display-only in the app, never drawn from scratch** (A42). Marketing
  shows real scans, never redrawn cards.

## Specs (Google Ads Help and Play policy, read 27 Sept 2026)

| Asset | Limits |
|---|---|
| Headlines | 1–5, 30 characters. No "!" in a headline, no "!!", no words in capitals except acronyms, no "#1" or "best". |
| Descriptions | 1–5, 90 characters |
| Images | up to 20, .png/.jpg at most 5 MB: 1200×628, 1200×1200, 1200×1500. Overlay under 20 % of the image, blank space at most 80 %, nothing upside-down or skewed. |
| Videos | up to 20, uploaded to YouTube by the owner: 16:9, 9:16, 1:1, 10–60 s. Hook in 2–3 s, 2+ cuts in the first 5 s, captions burned in, brand early and throughout. |
| HTML5 | up to 20, AdMob only: .zip at most 5 MB and 512 files, `<meta name="ad.orientation">`, `exitapi.js` and `ExitApi.exit()`, only Google-hosted libraries outside the zip. Check with Google's HTML5 validator. |
| Promotions | skipped: there is no offer, and inventing one breaks the honesty rule |
| Play screenshots | at least 4, 1080 px or more (the listing uses 1080×1920). Caption at most 20 %, no "Free", no call to action, no ranking, no device frame. |
| Feature graphic | 1024×500 |

Optimise the campaign for **installs**. "In-app actions" needs an SDK, and the app promises no analytics.

## Pipeline

```bash
export ADS_OUT=../ads-build                          # outside the tree
python3 design/marketing/copy_assets.py --selftest   # the text guard: planted lines refused first
python3 design/marketing/copy_assets.py              # headlines and descriptions -> copy.txt
node design/marketing/capture.mjs                    # live build -> shots/, art/, report.json
bash design/marketing/fetch_fonts.sh                 # OFL typefaces from npm's @fontsource -> fonts/
python3 design/marketing/style_listing.py            # style v1 compositions -> images/*.html
python3 design/marketing/directions.py               # round 1 drafts -> directions/*.html
python3 design/marketing/directions2.py              # round 2 drafts -> directions2/*.html
node design/marketing/render.mjs --selftest          # the image guard: planted frames refused first
node design/marketing/render.mjs [--dir directions]  # PNGs, report.json, thumbs.png per folder
```

| File | What it does |
|---|---|
| `capture.mjs` | Seeds the live Pages build (showcase deck and collection through the app's importers; the month rebuilt from real nightly prices). It shoots each ad state and the hero printings' own scans, and writes every number and element position to `report.json`. |
| `copy_assets.py` | The ad text and its guard. |
| `render.mjs` | Shoots a folder of compositions. It refuses a wrong size, over 5 MB, an overlay of 20 % or more (text measured by its lines), anything of class `safe` within 24 px of an edge, a font that did not load, or a broken image. |
| `style_listing.py` | Style v1 (wave 1). |
| `directions.py` | Round 1 premium drafts (not taken). |
| `directions2.py` | Round 2 drafts: pull, jump, episode. |
| `fetch_fonts.sh` | The drafts' fonts. Only the chosen style's are committed later, under `fonts/` with their licences. |
| `paths.mjs` | Where the renders go. |

**Environment notes:**
- Playwright is global (`/opt/node22/lib/node_modules/playwright`).
- Chromium does not trust the session VM's proxy CA. Every request is fetched by Node
  (`design/play-listing/lib.mjs`), never with TLS verification off.
- Chromium can't load `file://` images into a `setContent` page, so compositions embed everything as
  data URLs.
- There is no system ffmpeg. For video, a static binary via `pip install imageio-ffmpeg` in a venv
  outside the tree.
- Composition classes: `ov` marks overlay (text, badges), `txt` measures a text block by its lines,
  `safe` must stay 24 px off every edge.

## Data facts

- **Hero printings:** OP01-120 Shanks, product ids 454664 (base), 454665 (parallel) and 454666 (manga
  parallel). Of the 30 numbers with the widest spread on 27 Sept, these were the one number whose scans
  carry no TCGplayer "SAMPLE" mark. Most large scans carry it.
- The two parallels look almost identical, and one is about 46 times the other (26 Sep prices). That is
  the product's sharpest truth.
- **Picker:** the app's own line, e.g. "7 printings share OP01-120, $3.34 to $3,998.74 — 1197× apart",
  is live text and may appear in a picture.
- **Offline:** on the phone the catalogue ships in the APK, so Home's pill reads "Offline OK". The web
  build fetches its catalogue, so the capture zeroes the session's count and paints the pill as
  `paintNet()` would. The report marks it staged.
- **Reference art is memory-cached only**, so an offline creative shows value, not art.
- **The Fold's two sizes** (MEASURED): the cover screen is 411×960 and the open screen 749×832, both at
  2.625. At the open width, Collection's eight tools all show; at the cover width they scroll.
- **Showcase:** a 51-line, 92-card collection (46 lines and 87 cards in the main binder) and a legal Red
  Zoro deck (`showcase/`).

## Audit of the app and listing (27 Sept, ui-taste `audit.md`)

1. Prices drift daily, so ad text never carries one (above).
2. The listing is the landing page and has no social proof yet. Start small and optimise for installs.
   Ratings come without incentives.
3. The listing's screenshots are strong on captions and weak at thumbnail size (the whole phone small),
   and "SAMPLE" watermarks look cheap. Ads use tight crops.
4. The web build's scan screen has no camera, so the picker is the scan proof.
5. The Play title is now "OP TCG Hub: Collect, Hunt, SIM", but `docs/PLAY-LISTING.md` still says "OP
   TCG Hub": record drift for a take.
6. Not checked: the real camera, the light theme, anything on the device.

## Style v1: the listing style (wave 1, 27 Sept). Superseded.

- **What:** the listing's comic D7 scheme carried into ads. A Prussian band, a cream Luckiest Guy
  caption with an ink stroke and green offset, a buff sky, the icon's waves, and screens in an ink
  keyline with a green offset print. Four concepts (printing, value, binder, offline) at three ratios:
  12 images, plus 5 headlines and 5 descriptions (`copy_assets.py`). Committed as `69d394b`.
- **What worked:**
  - the printing concept (the Shanks trio and live prices) is the strongest idea, and it carries into v2;
  - tight crops read at thumbnail size;
  - the Fold's four-across binder row is sharp;
  - honest footnotes;
  - the "Offline OK" pill as proof.
- **What bit:**
  - the sea drawn last covered the lockup and footnotes (draw scenery first);
  - the sea band at the wrong aspect showed a fragment (use the view's own ratio);
  - text boxes measured as boxes overstated the overlay (measure lines);
  - the web build's "for now" copy nearly entered a frame;
  - "Export (" looked clipped (it is a scroll row);
  - the cover-width grid blew thumbnails past their pixels (use the open width).
- **The owner's verdict:** not a bad start; wants something fresh and more premium.

## Style v2: premium (in progress)

Four rough drafts, sent 27 Sept for the owner to choose between by looking (`directions.py`; each shows
the Shanks trio at 4:5 and Home's value at 1:1):

| Direction | Character | Tradeoff |
|---|---|---|
| **Vault** | Dark gallery. The dear card lit centre with a reflection, the two others dimmed; Cormorant Garamond and Inter small caps; auction-lot labels; a great deal of black. | Quietest at thumbnail size; loses the franchise's playfulness. |
| **Wano Gold** | Indigo, a gold-hairline seigaiha, a hand-laid gold-leaf mount, lacquer price plates, a vermilion seal; Shippori Mincho. | The strongest brand link (the icon's wave, the app's Wano indigo and gold) and the most flavoured: cliché risk, can read as Japanese-market. |
| **Price Guide** | Paper and ink, a masthead with the price date, cards like photos on a desk, mono figures, a red pen's loop on the number that matters; Fraunces and IBM Plex Mono. | The most trustworthy and distinct; a light ground is quieter in dark feeds. |
| **Launch** | Near-black studio light, cards floating in depth with a foil sheen, a big tight Inter, figures as a spec sheet. | Instantly "premium app", and the most generic. Glow and glass tip into the common look, so it stays spare. |

**Round 1 verdict (the owner, 27 Sept):**
> "While more premium, we lost the anime/manga/video game vibe along with it, I don't really vibe with
> any of these."

None of the four is taken. Premium must not cost the franchise's energy.

**Round 2 brief (the owner's answers, 27 Sept):**
- **World:** Gacha/JRPG, shonen manga, and the anime itself. Not the card-game-client look, and not
  auction, editorial or tech.
- **Energy:** stylish to start: bold and game-like but controlled, one or two big effects per frame.
  "We may change this."
- **What makes it premium:** all four of rarity and reward (the SP/SEC pull moment, foil, gold, a
  reveal), high polish, cinematic (key-art composition, dramatic light, a hero moment), and value and
  trust (money shown precisely and honestly).

**Round 2 drafts, sent 27 Sept** (`directions2.py`, `render.mjs --dir directions2`; same content, stylish energy):

| Draft | World | Character |
|---|---|---|
| **Pull** | Gacha / JRPG | A result screen. The SEC pull (the rarity from the catalogue) lit by gold rays and a holo rim, the two other printings dimmed behind, a chamfered HUD reading out the three market values, a condensed italic headline ("Which one did you pull?"). |
| **Jump** | Shonen manga | A manga page: panels, gutters, screentone, speed lines, the icon's own ドン!! sound effect breaking the frame, one spot red for the money, the cards the only full colour, the app's picker as the last panel ("The scanner asks."). |
| **Episode** | The anime itself | Title-card energy: a bright sky, a sunburst behind the hit, the card breaking out of its frame, a fat outlined italic title ("One number, 7 cards!"), a "Next time on your binder" tag, "Your binder's bounty!" for the value. |

What bit in round 2: the overlay measure counted a styled word twice (a Range over a block also returns
each inline element's box). It now measures text nodes only, and its selftest plants a caption with and
without a `<span>` and requires the same share, watched to fail on the old measure. Also, a class shared
between a card and a table row gave the row the card's holo shine.

**Design contract:** written here once the owner picks or mixes a direction. It will cover purpose
(persuade), composition per ratio, type/colour/material roles, how the app's UI sits inside the style,
the listing frames, motion, and a verifiable finish condition.

## Process

- **Waves:** a wave is rendered, read by the session, sent with one line each, and picked by the owner
  before the next wave starts.
- **Order after the pick:**
  1. the chosen style across the collector and player concepts × three ratios (within 20 images);
  2. the listing's 8 screenshots and the feature graphic in it, with the listing guards from
     `design/play-listing`;
  3. the motion pipeline (storyboards as data, frame-exact Chromium renders, ffmpeg to H.264) and
     Video 1 at 9:16, then 1:1 and 16:9;
  4. HTML5 last.

## Open questions and the owner's inputs

- The premium direction, or a mix of directions (drafts sent 27 Sept).
- Inspiration videos: the owner has some. They go through `study` (frames at every cut, a timing sheet)
  so their structure, not their content, shapes the storyboards.
- Music or voice-over: none licensed yet. Silent with burned-in captions until the owner supplies a track.
- Tools the owner may load (video, design or voice). They slot in behind the same storyboards.
- Phone footage of a real scan on the Fold would be the strongest scan proof when the owner can record it.
