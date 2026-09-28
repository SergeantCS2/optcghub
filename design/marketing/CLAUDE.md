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
| `directions2.py` | Round 2 drafts: pull, jump, episode, pullmulti, pull3-5 (the record). |
| `style_pull.py` | **The production style** (the contract below): six concepts at three sizes; `--tune` for the aura presets. |
| `heroes.mjs` / `heroes.json` | Hero candidates per character (a contact sheet), and the picks per concept. |
| `listing_pull.py` | The Play listing in the Pull style: eight screenshots and the feature graphic, with Play's word guard (`--selftest`). |
| `accent.mjs` | Each saved scan's own accent colour -> `art/accents.json` (a 45-degree hue window, the edges counted twice); the aura's colour comes from it. `--selftest` checks the split-hue case both ways. |
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

- **Hero printings (now, since Pull v3):** EB04-007 Roronoa Zoro: 685303 (base, $14.32), 685304 (alternate
  art, $73.28), 705991 (SP, $456.94), all SR and none a promo; three printings, 32× apart on 26 Sept prices.
- **Hero printings (round 2, second pass):** OP09-076 Roronoa Zoro: 597016 (base, $0.20), 654099 (alternate art, $60.26)
  and 619217 (the Championship Regionals prize, $5,000.00), on 26 Sept prices. `HERO=NUM:id,id,id` overrides.
- **Hero printings (round 1 and round 2's first pass):** OP01-120 Shanks, product ids 454664 (base),
  454665 (parallel) and 454666 (manga parallel). Of the 30 numbers with the widest spread on 27 Sept, these were the one number whose scans
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

**Round 2 verdict (the owner, 27 Sept):** still off on all three, but **Pull is the closest yet** to the
owner's image; the energy is about right. Two changes:
- **Zoro instead of Shanks**: "whatever the most expensive Zoro card is with three cards". That is OP09-076
  (the capture's `HERO` default since then):
  - 619217, the Championship 25-26 Regionals Season 1 prize: $5,000.00 market on 26 Sept, its only
    listing $8,000, a thin market;
  - 654099, the alternate art: $60.26;
  - 597016, the Emperors in the New World base: $0.20.
  Six printings share the number ("35714× apart" in the app's own picker line).
- **Home needs more than the number and the graph.** Show the Most valuable and Set completion panels in
  the screenshot, without naming them in the text. The capture's `open-home-tall` is the open Fold's
  Home as a long screenshot for this.

**Round 2, second pass (sent 27 Sept):** Pull rebuilt on the Zoro:
- **pull (4:5):** the prize card as the pull, badged with its own provenance.
- **pull (1:1):** the open Fold's Home with the Most valuable and Set completion panels, fading out at the
  foot, unnamed in the words.
- **pullmulti (4:5):** a new variant, every printing of OP09-076 as a multi-pull result grid ("Same number.
  Every pull priced."), the dearest glowing.

**Pull v2 verdict (the owner, 27 Sept):** "it all feels very AI like": the font, the formatting, the
rays, the sparkles, the table. Wanted:
- bigger card art, more colour, more app on screen;
- manga, not sparkles ("his signature demon aura");
- **never hands in pictures**;
- the single pull leads;
- **EB04-007** and its two other printings.

The owner's references: PokeScreener, Dragon Shield's Poké TCG Scanner, TCG Card Scanner for Pokémon,
CardValuePro, Collectr (iOS), and any app that helps. Not a fan of Pokémon TCG Pocket.

**What the references teach** (their App Store and Play screenshots, 27 Sept). PokeScreener, Collectr and
Robinhood share one grammar:
- a clean, bold, sentence-case headline in two lines, with one accent word;
- one real device with the real UI;
- one or two real UI pieces lifted out and enlarged, breaking the frame;
- one accent colour, used sparingly;
- a charcoal ground with soft light, not pure black;
- no stock effects.

**The not-AI rules (every style from now on):**
- no repeating-conic rays, no four-point sparkles, no glass HUD tables the app doesn't have;
- no all-caps italic headlines, and no italic used as decoration;
- sentence case with one accent word;
- effects come from the content: the ground is the hero's own art, blurred; an aura takes the art's own
  accent colour (`accent.mjs`); prices appear only as the app's own rows;
- the art large;
- no hands.

**Pull v3** (`pull3` in `directions2.py`, sent 27 Sept), on EB04-007:
- the SP $456.94, the alternate art $73.28 and the base $14.32; "3 printings share EB04-007 … 32× apart";
- **4:5:**
  - "Same Zoro. *Three* prices." (the name and the count from the data);
  - the three printings fanned, with the SP in front in a rising demon aura (red, the SP art's accent);
  - one white sword-cut stroke behind;
  - a phone (a punch-hole camera, as the owner's Samsung has) showing the app's own picker, bleeding off
    the frame;
  - the SP's own picker row lifted out as the callout;
- **1:1:**
  - "Your binder, valued *nightly*.";
  - the open Fold with its hinge (no camera dot: its inner camera is under the screen) showing Home with
    Most valuable and Set completion;
  - Home's total panel lifted out as the callout;
  - the SP in its aura behind the device.
- **What bit:**
  - the aura drawn after the fan painted over the other cards (draw it first);
  - a coloured sword stroke across the card's face competed with the art (keep strokes behind);
  - the phone opened on the web build's empty camera (start the crop at the picker sheet);
  - a camera dot over a tab label read as a defect.

**Pull v3 verdict (the owner, 27 Sept):** "getting there". The subtext was hard to read, and the aura was
off: stronger, more manga. "A real phone, not whatever that is. A real phone, a real foldable/tablet."
More manga inspiration.

**The references added:**
- **MANGA Plus** (Shueisha's own app): a real, detailed phone, the art bursting out in front of it, a
  bold red ground, heavy headlines.
- **PokeScreener, Collectr and Robinhood**, as before.

**Pull v4** (`pull4`, sent 27 Sept):
- **Subtext:** larger and near-white, with a shadow.
- **A real phone:** a metal frame, side keys, a punch-hole, glass and a status bar.
- **The Fold open:** squarer corners and the crease, with no camera on the inner screen.
- **The aura is a drawn manga contour:** an ink layer, a colour layer with an ink outline in the art's
  own accent, and a hot core, rising into curved tongues, tallest over the top.
- **The slash kanji behind the fan:** the card's own attribute, as brushed outline (Yuji Boku, OFL).
- **The square** is the Fold and its lifted total only. The small card was hidden behind the device, so
  it went.

**What bit:**
- the first flame pass (independent spikes) went wild and covered the headline and the logo; one
  contour per layer holds its shape;
- the app's crop bled under the status bar without `overflow:hidden`.

**Pull v4 verdict (the owner, 27 Sept):**
- too much on the subtext;
- the phone and UI still looked bad, and the fold line was unwanted;
- the drawn flame contour was a "massive downgrade": an aura only works if it blends seamlessly into the
  card.

The device: Google's official frame in a modern style, with no front camera and seamless thin bezels
like the Fold 7. The aura: try one pixel-based pass, or go back to v3's soft red.

**Pull v5** (`pull5`, sent 27 Sept):
- **Device rules (from here on):**
  - an ultra-thin, even black bezel (9 px) and a thin titanium rim with one soft highlight;
  - no camera hole, no crease, no side keys;
  - a real Android status bar: the time plus signal, Wi-Fi and battery glyphs drawn as SVG, in the
    app's own top colour;
  - nothing in the scene covers the status bar;
  - the same slab for the phone (19.5:9) and the Fold 7 open.
  - Google's Device Art Generator frames stop at the Pixel 4 era, so they aren't usable as they are.
- **Aura rule:**
  - `pull5pixel` built the aura from the card's own pixels (its scan, blurred and displaced upward). It
    met the card's edge softly, but the streaks smeared the black-and-white art into a grey band, so it
    was not clearly better and was rejected.
  - v3's soft rising glow in the art's accent leads.
  - Never drawn flame contours.
- **Subtext:** 28 px, `#d4d7d2`, a light shadow. The kanji is gone.

**Pull v5 verdict (the owner, 27 Sept):** "Closer! The aura is closer as well." The owner then ruled:
- **The aura is the pixel-built one** (`pull5pixel`), exactly as it rendered, to be tuned from there. A
  recoloured variant, its luminance mapped onto the art's accent to remove the grey streaks, was tried and
  was not what the owner meant.
- **Heroes are varied fan favourites.**
- **Order:** ad images first, then the listing, then video, then HTML5.

## Design contract: Style v2, "Pull" (locked 27 Sept; `style_pull.py`)

- **Purpose:** persuade. One claim per frame, proven by the app's real screen.
- **Composition, per frame:**
  - a sentence-case headline in two lines with one accent word (in the hero art's accent colour), and a
    subline;
  - a device (ads) or a frameless screen (listing) showing the app's real screen;
  - the hero card, large and tilted, in its pixel aura, with any related printings fanned behind it;
  - one real UI piece lifted out as the callout;
  - a footnote naming the price source and date, and "A sample collection/deck/trade" where it applies;
  - the icon and name small (top right; top left in 1200×628).
- **Ground:** the hero's own art, blurred and darkened (`.ground` + `.shade`). The palette comes from the
  card.
- **Type:** Inter 800 for the headline (88/80/56 px by size); Inter 500 for the subline at 28 px `#d4d7d2`
  with a light shadow; the footnote at 17 px `#a9ada8`. No italics, no all caps except micro-labels.
- **The aura:** `flame_aura()`, refined (below). Its first form (`AURA`, `pixel_aura()`), kept for the record:
  - the card's own scan blurred (16), saturated (2.2), displaced upward by vertical fractal noise (0.018 /
    0.004, scale 190) and brightened (1.5), in a masked body 1.36× wide rising 0.32× above the card;
  - a halo of the card itself (blur 28);
  - a rim light in the art's accent (`accent.mjs`).
  - `original` is the owner's pick. `softer` and `stronger` turn the same knobs, and `--tune` renders all
    three.
- **Device** (ads): a seamless slab with a 9 px even bezel, a thin titanium rim with one highlight, no
  camera, no crease and no keys, and a real status bar that nothing covers. The phone is 19.5:9; the Fold
  7 open is about 1.08:1.
- **Callout:** one real crop of the app with an accent rim, at most 290 / 220 / 132 px tall by size. It sits
  bottom right with the footnote under it (portrait and square), or under the subline (1200×628).
- **Per size (`LAYOUT`):**
  - 4:5 and 1:1: the headline top left, the device at bottom left bleeding off the frame, the hero at right;
    a single hero is larger and further left (`SOLO`);
  - 1200×628: the name top left, then the headline, the subline and the callout on the left, with the
    device and the hero on the right.
- **Words:** image captions pass `check_caption()`, which is `copy_assets.py`'s rules. A card number is not
  a word in capitals, and a footnote may credit TCGplayer as the source.
- **Finish condition:** `render.mjs` passes (size, 5 MB, overlay under 20 %, 24 px edges, fonts, images),
  and the session has read every frame at full and thumbnail size before sending.

**The aura, refined (the owner, 27 Sept):** "I like this aura, but it needs refinement ... it looks cheap and
AI like, needs to be more specific to the card / color matched / blended better." A polish pass (ui-taste
`polish.md`) on close-ups of three heroes found:
- the rising streaks took the art's greys;
- the enlarged blurred copy lit a soft rectangle round the card;
- colours from every part of the art smeared side by side;
- the glow was even on every side with a neon rim;
- the ground washed the light out.

`flame_aura()` (`AURA2`, `AURA_MODE = "refined"`) replaces it:
- **Shape:** real flame tongues. A white field hugs the card, widened at the sides, with a dome over the
  top. Fractal noise with long vertical streaks is added and the sum thresholded, so the edge breaks into
  tongues that are tallest in the middle, lick up the sides and stay quiet at the foot. A tighter second
  threshold is the hot core.
- **Colour:** the card's own pixels, stretched upward and blurred, mixed 74/30 with a ramp of the card's
  dominant colour (`accent.mjs`). The ramp runs from the deep colour lifted toward the accent, through the
  accent, to hot. Blacks rise as deep flame, never smoke.
- **Seam:** the card's own edge colours, a few px out, fading toward the foot, instead of a neon rim.
- **Ground:** darker (`GROUND_CSS`).

`--tune` renders the presets on three heroes. `AURA_MODE = "original"` still draws the first pixel aura,
for the record.

**Pass 2 (the owner, 27 Sept):** "too tall, in Luffy you can see the top is just flat and cut off. The
colour matching / blending needs to be better. Like the card is giving off a seamless aura", then "toned it
back too far ... the blending is looking better". What changed:
- **Height and the flat top.** The field had no room above it, so the tallest tongues met the edge of their
  own box and were cut straight. The box now has headroom (`T = rise x 1.45`), and the dome fades to
  nothing before the top, so every tongue ends in its own tip. At the same `rise` (.48) the flames render
  about 30 % shorter than pass 1, which is the new `refined`. `softer` (.43) and `taller` (.54) sit either
  side; pass 1's `softer` (.38) is the owner's "too far".
- **The seam.** The colour starts as the card's own edge: its top slice (the top 110 of 838 px) is
  stretched up into the flame, and its side slices (70 px each) out to the sides, so just past the border
  the light is the border's colour. A tight emission (the card 2 % larger, lightly blurred) joins card and
  light.
- **The dark ring.** The hero card's drop shadow sat between the card and its light; it now casts only
  at its foot, where the aura is quiet.
- **The colour reader** (`accent.mjs`) scores a hue with its two neighbours and counts the card's top and
  side edges twice. Yamato's blue fell across two bins (0.24 + 0.17) and lost to a 0.30 red, so her aura
  came out red on a blue card; she is now blue.
  - Its `--selftest` builds a synthetic card where a split blue must beat a larger single red, and the
    same card with the window off must pick red: the bug reproduced, then fixed.
  - The other heroes' readings stayed put or firmed up. Ace moved from his flames' orange toward his
    frame's red-orange, since the edge is where the aura leaves the card.

**Pass 3 (the owner, 27 Sept):** "not there yet, we need to find an in-between, it needs to be more
consistent -- the aura looks to just have jagged pillars of flame, rather than a gentle aura."
- **Why the pillars:** the shape, not the colour. Fine, strongly vertical noise (0.017 across, 0.0055 up)
  went through a hard threshold (slope 1.9), so every gap between tongues dropped to nothing.
- **One knob for the shape: `flicker`** (`aura_params()`). 0 is a smooth glow hugging the card; 1 is
  pass 2's flame, number for number. Everything the shape depends on moves together along it:
  - the noise's weight and scale (broader and rounder toward 0);
  - the threshold's hardness and the softening after it;
  - faint vertical wisps inside the body instead of at its edge;
  - the dome, which holds the light up when the noise no longer lifts it.
  The side margin holds three blur radii, so no glow meets its box.
- **The presets** (`AURA2`): `gentle` (flicker .20, rise .40), **`between`** (.45, .44, the lead,
  `AURA_LEVEL`) and `flame` (1.0, .48; pass 2).
- **Colour, kept from pass 2 and made to hold at every flicker:**
  - the body's ramp tops out near the accent, with white-hot kept for the core at the card;
  - above the card, the light turns from the edge's own colours into the card's accent, deepening toward
    the tip, as a flame does;
  - the body's colour is made more vivid (`_vivid`), because the aura is screened onto the ground, which
    pales every colour toward pastel on a grey ground. Zoro's black-and-white art blurs to grey, and his
    aura had risen as a pink-grey haze.
- **What bit:**
  - at low flicker the aura collapsed to a rim, because the noise had been doing the lifting (hence the
    dome);
  - the body sat at about 65 % opacity, so it read as haze (hence the steeper slope);
  - the ramp's white top made the body smoke (hence `top`, `tint` and `vivid`).

**The aura's setting:** the owner first said "between is good", then, looking at the Luffy comparison,
"I like the third": `flame` (`AURA_LEVEL`). The scale stays, so any preset is one line.

**The Play listing (Phase D, 27 Sept; `listing_pull.py`, `render.mjs --dir listing`):**
- **Eight 1080×1920 screenshots:** printing, value, binder, detail, deck, trade, sealed, offline. Game
  day is left out because its opponent side is upside down. Plus the 1024×500 feature graphic.
- **The same style as the ads,** except the app's screen is a frameless panel: Play asks listings to avoid
  device imagery.
- **Heroes:** as the ads', plus **Boa Hancock OP07-038 SP** for the detail page
  (`heroes.json`, `detail`). Nami's manga was tried first, but her set, "Premium Booster -The Best-", puts
  "Best" on the page. Sealed has no hero; its ground is the sealed list itself, its accent the app's brass.
- **Play's rules, enforced:**
  - `render.mjs` refuses a tagline block (class `tl`) over 20 % of a listing or feature image, and writes
    the feature graphic as a JPEG (no alpha). Its selftest plants a 24 % tagline and passes a 16 % one,
    watched to fail with the rule removed.
  - `listing_pull.py` refuses a frame whose own words carry "Free", "Best", "Top", "New", sale, discount,
    "#1" or a call to action. It also refuses a screen crop that would show one, using `capture.mjs`'s
    per-screen word positions (words under a sheet do not count). Hancock's page says "not a sale" at
    814 px, so its crop stops at 800. The selftest plants each case, watched to fail when covered words are
    counted.
- **New captured screens:** `sealed` (Hunt's sealed list at a set with pictures, ported from the
  listing's capture) and the detail page of `heroes.json`'s `detail` hero.
- **Not yet done:**
  - the listing text in `docs/PLAY-LISTING.md` belongs to a numbered take, and still carries the title
    drift;
  - the owner uploads the images by hand.

**The ad set (Phase C, 27 Sept):** 6 concepts × 3 sizes = 18 images (`render.mjs --dir pull`).

| Concept | Headline | Hero (`heroes.json`) | Screen | Callout |
|---|---|---|---|---|
| printing | Same Zoro. *Three* prices. | EB04-007 Zoro and its two others | the picker on the phone | the SP's own row |
| value | Your binder, valued *nightly*. | OP05-119 Luffy, the gold SP | Home on the Fold | Home's total |
| binder | Every card, *priced*. | EB02-006 Yamato | the collection on the Fold | Most valuable |
| offline | Works with *no signal*. | OP01-120 Shanks, the manga | Home on the phone | the "Offline OK" row |
| deck | Built to *the rules*. | OP01-013 Sanji (in the Red Zoro deck) | the deck | the legality line |
| trade | Trade at *the table*. | OP02-013 Ace, with the showcase's OP01-016 Nami | Trade | the verdict (+$32.76 on 26 Sept) |

**What bit in Phase C:**
- the caption guard refused the source credit and the card number (both now scoped);
- lifted panels taller than the frame allowed (capped);
- the aura covering the name in 1200×628 (moved);
- the offline callout repeating the phone (now the status row);
- empty space beside a single hero (`SOLO`). It will cover purpose
(persuade), composition per ratio, type/colour/material roles, how the app's UI sits inside the style,
the listing frames, motion, and a verifiable finish condition.

### Phase E: motion (27 Sept)

**The owner, on the listing:** "fix the phone edge sliver and the wifi/battery icon, smaller and more uniform.
then start the video."

**Fixes:**
- **Status icons.** They are one family now: signal, a filled Wi-Fi fan and a battery, all 12 units tall on
  one baseline. They are drawn at 28 % of the status bar's height and the time at 36 %, so a small phone gets
  small icons.
- **Picker panel.** It starts at the sheet's edge (`ty - 48`). At `ty - 60` the dimmed page behind showed as a
  sliver.

**The pipeline (`motion/`):**
- **`storyboards/video1.json`** holds the scenes as data: times and on-screen words. Prices, the total, the
  date and the heroes come from the capture and `heroes.json`.
- **`build.py`** lays the storyboard out and writes `$ADS_OUT/motion/<name>-<ratio>.html`.
  - Every element rests at its spot, and a keyframe timeline (opacity, offset, scale and rotation, eased per
    segment) moves it through `window.__frame(t)`.
  - Impacts flash manga speed lines and shake the stage for 0.16 s.
  - The count-up eases the capture's own total from zero.
  - Every image is written once to `assets/` beside the page. Inlined at every use, the page was 56 MB.
- **`style_pull.flame_aura(..., motion=seconds)`** makes the tongues rise: an `feOffset` under each noise,
  driven by SMIL, scrolls the outline at 0.16 and the wisps at 0.34 card-heights a second. Stills pass `None`
  and are unchanged.
- **`engine.mjs`** is frame-exact and never reads the clock. For each frame at t it:
  - sets every Web Animation and every outer SVG's SMIL clock to t, then calls `__frame(t)`;
  - screenshots the frame as a JPEG and pipes it to ffmpeg: H.264 at CRF 17, yuv420p, 30 fps, faststart, and
    a silent AAC track.
  - `--stills a,b` writes PNGs instead of a video.
  - ffmpeg is the static binary from `imageio-ffmpeg` in a scratch venv (`FFMPEG_PY`), not a repo dependency.
- **`check.py`** reads the encoded file back: 10–60 s, h264 yuv420p, 30 fps, an allowed size, AAC audio, at
  most 1 GB. `--frames` pulls PNGs from the MP4. `--selftest` plants a 4 s clip, which must be refused, and a
  12 s one, which must pass.

**Video 1, "Same Zoro" (20 s, 9:16):**

| Time | Scene |
|---|---|
| 0–5 s | The fan lands and the SP ignites. "Same Zoro." then "*Three* prices." with the three real prices as pills. |
| 5–10 s | The phone rises with the real picker; the SP row lifts out. |
| 10–14 s | Luffy slams in, the phone shows Home, and "Collection value" counts up to $16,054.93. |
| 14–17 s | Three one-second beats: "Scan with *no cap*." (Yamato), "*No* account." (Sanji), "Works *offline*." (Shanks). |
| 17–20 s | The end card: the icon, the name, "Scan it. Value it. Build it.", the descriptive line, and Google's official "Get it on Google Play" badge, with Google's trademark line at the foot. |

It is silent until the owner supplies audio. A 20 s render takes about 4.5 minutes and comes out at 11.7 MB.

**How it was verified:**
- 14 frames were read from the MP4 itself, in a contact sheet.
- Aura crops at 3.9, 4.3 and 4.7 s differ: the tongues rise.

**The cuts (the owner: "Pacing's fine, make the square and landscape cuts"):**
- `build.py --ratio 9x16|1x1|16x9` renders 1080×1920, 1080×1080 and 1920×1080. All three share one timeline,
  so the pacing is identical; only `LAYOUT` differs.
- **Square:** the fan leaves when the phone rises; there is no room beside it.
- **Landscape:** the fan steps aside to the far right, the prices stack under the headline, and the callout
  and total sit in the left column.
- `zoom` scales the UI pieces, so a smaller frame keeps their proportions.
- Speed lines reach the frame's diagonal.
- `.sub` wraps balanced, so the landscape sub-line no longer leaves a single word on its last line.

**What bit in the cuts:**
- In the square cut, the phone overlapped the brand mark; it moved down.
- In the square beats, the word crowded the card; the word is smaller and the card sits further right.

**The Google Play badge (the owner, 28 Sept: "say available on google play at the end with the actual google
play logo"):**
- Google's badge guidelines (Partner Marketing Hub, read 28 Sept) allow two badges only: "Get it on Google
  Play" and "Pre-register on Google Play". The badge must not be altered in any way, including its text or
  colour.
- The Play icon may not be used on its own in marketing. So "Available on" with the logo is not allowed,
  and the end card carries the "Get it on" badge exactly as Google ships it.
- `fetch_badge.sh` downloads it to `$ADS_OUT/badge`, never committed, and refuses a file that is not
  Google's 646×250 PNG. The CSS adds no shadow, filter or radius.
- The badge is at least 28 px tall, and its file carries its own clear space.
- The trademark line, "Google Play and the Google Play logo are trademarks of Google LLC.", is pinned
  verbatim in `build.py` rather than run through the caption guard, whose all-caps rule would refuse "LLC".

**Sound (the owner, 28 Sept: "Let's add some audio ... maybe we can leverage Freesound.org API -- adding sounds
to transitions, card popups and etc"):**
- **The cue sheet.** `build.py` places each sound cue beside the motion it belongs to (`cue(t, kind)`;
  `impact()` cues itself) and writes `<name>-<ratio>.cues.json` beside the page. Sound and picture share one
  timeline, so they cannot drift apart. There are 27 cues in Video 1:
  - swishes as the fan flies in, a whoosh then an impact and an ignite on the SP's slam;
  - pops on the price pills and a cash hit on the SP's price;
  - a whoosh at each scene change and a rise under each phone;
  - a tick train through the count-up, then a cash hit on the total;
  - an impact on each beat (the ignite there was dropped with the fire, below);
  - a chime on the end card.
- **The source: Kenney's audio packs (the owner, 28 Sept: "Is there any free alternatives? I don't want to
  request credentials").** Freesound was dropped: its API needs a key. Kenney (kenney.nl) publishes CC0
  packs with no account and no key, and each pack carries its own `License.txt`: "Creative Commons Zero,
  CC0 ... personal and commercial projects. Credit ... is not mandatory".
  - `kenney.py` fetches the packs `sounds.json` names into `$ADS_OUT/sfx/kenney/`. Nothing is committed.
  - It keeps a pack only if its own licence file names CC0 and no other licence; otherwise the pack is
    deleted and the run refused.
  - `--selftest` plants five licence files. A guard without the "no other licence" condition fails it.
- **The palette.** `sounds.json` gives each kind one or more layers, each with a gain and an offset:
  - Kenney files: the casino pack's card slides and chips, which suit a card app; punches with a
    low-frequency boom under the slams; coins with chips on a price;
    ticks for the count-up; a heavy bell with a confirmation on the end card.
  - Sounds made here from filtered noise: the whoosh, the rise and the aura's swell. Kenney has no true whoosh, and
    filtered noise is how whooshes are made; they are ours, with no licence at all.
  - A layer with `every` repeats through the cue: the count-up's ticks, every 70 ms.
- **The mix (`mix.py`).**
  - Each cue's file is trimmed to its kind's maximum (the count-up to the count's own length), faded out
    over 60 ms, set to its gain and delayed to the millisecond. The cues are summed without normalising.
  - Loudness is set in two passes (loudnorm measured, then applied linearly) to -16 LUFS with a true peak
    under -1.5 dBTP, and laid under the picture: the video is copied untouched to `<stem>-sound.mp4`. It
    takes 3 s, with no re-render.
  - `--synth` plays every kind as an ffmpeg-made placeholder, to prove the timing on its own.
- **The guard.** `check.py --audio` requires -20 to -12 LUFS and a true peak of at most -1 dBTP, because a
  silent track passes every other check.
  - Its selftest adds a silent clip, which must be refused, and a tone at about -16 LUFS, which must pass.
  - On its first run the guard read the tone as silent: `-map` with `-filter_complex` made ffmpeg refuse
    the graph, and the empty output parsed as -inf. The negative control is what caught it.
- **Verified with the placeholders:** a waveform of the mix on a 1 s grid, with every onset on its cue:
  - the SP's slam at 0.9 s and the cash hit at 3.55 s;
  - the callout at 7.45 s and Luffy at 10.55 s;
  - the ticks from 11.3 s and the beats at 14.12, 15.12 and 16.12 s;
  - the chime at 17 s.
  The result was -16.0 LUFS with a true peak of -1.1 dBTP.
- **Delivered with Kenney's sounds:** 27 cues as 63 sounds. All three cuts measure -16.8 LUFS with a true
  peak of -1.2 dBTP; the -1.5 dBTP ceiling holds the linear pass just under -16. On the waveform, every
  onset is on its cue, as with the placeholders.

**Sound, pass 2 (the owner, 28 Sept: "The fire of the cards sound weird, the timing in some audio needs to be
more consistent and I wouldn't mind a backing music track, like a low volume generic house music"):**
- **The fire.** The aura's thruster roar (Kenney's `thrusterFire_000`) is gone. The aura now breathes in on
  a low swell made here: brown noise under 420 Hz, a quarter-sine in and out. It plays on the two hero
  slams only; the three beats keep their punch alone.
- **Why the timing felt uneven, measured.** Each layer's onset and peak were read from its own file:
  - the punches, pops and ticks peak within 50 ms of their start;
  - the card slide peaks at 0.16 s, the whooshes at 0.41 and 0.49 s, and the rise at 0.65 s.
  So the slams hit on the frame, while every whoosh, slide and rise trailed its motion by up to two thirds
  of a second.
- **The fix, in two parts.**
  - `mix.py` lands each layer by its loudest moment: it measures each file's peak (loudest 5 ms, decoded
    at 8 kHz), then delays the file, or trims its head, so the peak falls on the cue.
  - `build.py` cues each whoosh or rise where its motion arrives or is fastest: the first card landing at
    0.6 s, the SP dropping into 0.86 s, the fan at 5.3 s, the phone arriving at 5.62 s, the exits at 10.1
    and 13.98 s, and Home's phone at 10.72 s.
- **The picture on the beat.** `beat_grid()` fits a house tempo (118–128 BPM, in 0.1 steps) and phase to
  the slams, minimising the worst miss: 119.2 BPM, phase 0.46 s, worst miss 70 ms.
  - The picture is then warped, piecewise-linear between the slams (`WARP`, applied inside `__frame`), so
    each slam lands exactly on a beat. The largest move is 70 ms, about two frames; the slopes stay within
    about 5 % of real time.
  - The cue sheet is written in video time through the same warp, with the grid, the drop (the first
    slam) and the end card's time.
  - The warp asserts that it stays monotonic and that no hit moves more than 80 ms.
- **The music (`music.py`, ours).** A generic house groove made from oscillators and noise with numpy
  (the venv's python, `FFMPEG_PY`): no licence, no download, no account. It runs on the cue sheet's grid,
  in A minor (Am F C G, a bar each):
  - a filtered pad swelling in, with the hats a bar early;
  - the kick drops on the SP's slam;
  - four-on-the-floor with a clap on 2 and 4, offbeat hats, an offbeat bass and pumped chord stabs;
  - a noise riser bar, without the kick, into the three beats;
  - the drums stop on the end card's downbeat and the last chord rings out.
  In the mix it sits at `MUSIC` = -15 dB against the effects, and ducks under them through a sidechain keyed
  by the effects (ratio 5, 4 ms attack, 260 ms release). `--no-music` leaves it out.
- **What bit:**
  - the first beat lost its kick: the cue sheet rounds to the millisecond, and a 1 µs comparison put the
    beat at 14.0508 s inside the riser bar that ends at 14.051 s. The grid is now compared a quarter-beat
    wide.
  - Checked afterwards: the low band peaks at about 0.48 at every slam, 14.05 s included.
  - The last bar's pad stopped dead under the final chord, leaving a step on the waveform at 19.1 s. The bar
    the end card falls in now fades its pad over 1.2 s.
  - One mix stalled in ffmpeg for five minutes and did not reproduce: the same command finished in 7 s. Every
    ffmpeg call in `mix.py` now has a 120 s timeout, so a stall fails loudly.
- **Delivered:** all three cuts re-rendered on the warp and mixed over the bed: -16.6 LUFS, true peak
  -1.1 dBTP, in spec. Frames either side of the 0.963 s and 14.051 s slams were read from the MP4: the card
  is still falling 33 ms before and has landed, with its speed lines, 34 ms after.

**Sound, pass 3: the music (the owner, 28 Sept: "I don't like this song, it sounds like a children's song or
what you would see in a mobile game ad that's false advertising. I want something you find in a cigar
lounge/coffee shop"):**
- **The brief:** lounge and lo-fi jazz, meaning warm electric piano, jazz chords, a soft kit and a slow
  tempo. Oscillators made here cannot play that convincingly (the house bed's saws were part of what read
  as childish), so the bed is now a real recording.
- **The source: OpenGameArt, CC0 only (`oga.py`).** No account, no key.
  - A page is kept only if its own License(s) field lists CC0 alone, linked to the CC0 deed.
  - `--selftest` plants five cases: CC0 alone passes; BY, CC0 dual-licensed with BY, a CC0 label on a BY
    deed, and a page with no licence field are refused. A guard loosened to "any CC0 label" fails it.
  - FreePD, the first choice, has closed.
- **Left out by hand:**
  - chiptune and 8-bit pieces: the mobile-game sound the owner named;
  - "Samurai Champloo inspired loop" and "Giant Steps but smooth": a recording's CC0 does not clear a song
    someone else wrote.
- **Screened by measurement.** The candidates' spectral centroid (warm under about 1,400 Hz), tempo and
  length were measured, since the session cannot listen.
- **Seven auditions**, each the ad's real soundtrack (the effects over the bed, ducked, loudness-set) as a
  20 s MP3:
  1. Holizna, "First Snow";
  2. Holizna, "So Broke";
  3. Holizna, "Laundry On The Wire";
  4. Holizna, "2 Hour Delay" (all four from "Lo-Fi and Chill (Collection)");
  5. Spring Spring, "(Basically not) Fusion Jazz";
  6. OatCog, "Coffee House Bump";
  7. Spring Spring, "Jazz".
- **`mix.py --bed TRACK --start S [--audio-only]`** plays a recording from S: faded in over 0.8 s, and out
  from 0.6 s after the end card.
- **The mixer, rebuilt.**
  - The ffmpeg graph mixing 59 inputs (`amix` with `adelay`) stalled for minutes several times, with and
    without the bed. Splitting it into two passes did not cure it: it stalled again in the effects-only
    pass.
  - The effects are now placed sample by sample in numpy, and the ducking is a numpy compressor keyed by
    the effects (5 ms blocks, 4 ms attack, 260 ms release, ratio 5). ffmpeg keeps only single-input jobs.
  - Six mixes in a row then took 35 s, with no stall. `mix.py` re-runs itself under `FFMPEG_PY` when the
    system python has no numpy.
  - `check.py --audio` then caught a true peak of -0.9 dBTP (the AAC encoder overshoots a -1.5 ceiling).
    The loudness pass now aims at -2.0 dBTP, and all seven auditions measure -1.3 to -1.9 dBTP.
- **The beat grid.** The picture's warp is fitted to the house bed's 119.2 BPM. A lounge bed does not need
  its hits on the beat; once the owner picks, the grid can be fitted to that track's own tempo (a
  re-render).

**Round 2 of the bed (the owner, 28 Sept: "I like Jazz the most, but kinda curious what else you might be
able to come up with, also think samurai champloo"):**
- **The lead:** Spring Spring's "Jazz" (`jazz-1`, CC0). "Samurai Champloo" points to Nujabes-style jazz-hop:
  a warm jazz record over dusty, laid-back boom-bap. The loop titled after it on OpenGameArt stays out, since
  it imitates a copyrighted song; the style is the reference, never a tune.
- **"Jazz" measured:** 90.02 BPM in 4/4, a four-beat bar (onset autocorrelation 0.98 at 2.667 s), and the
  first downbeat at 1.853 s (the beat with the most low-band onsets). It already carries a light kit.
- **The rework made here (`jazzhop.py`):** the recording unchanged, plus drums synthesised here on its own
  grid:
  - kick on 1, a ghost kick on the "a" of 2, kick on the "and" of 3;
  - snare on 2 and 4, 18 ms late;
  - hats swung 58 %, with a ghost rim before the bar line.
  The record is rolled off above 4.5 kHz and lightly driven, as a sampled record would be. It ducks 22 %
  under each kick, over vinyl crackle and hiss.
  - **Checked:** the cross-correlation of low-band onsets between the original and the rework peaks at 0 ms
    offset, so the added kicks sit in the record's own groove.
- **Also auditioned, all CC0 through `oga.py`:**
  - omfgdude, "Funky Hip Hop Lofi Jam" (its lowpassed version, 84.7 BPM);
  - omfgdude, "lofi hip hop";
  - Umplix, "Jazz" (`jazz-2`);
  - Zane Little Music, "Freeway Fumes".
- **Left out:**
  - Emma_MA, "Jazz n' brass loop": the author calls it 90s PC-game music;
  - Spring Spring, "Icy Cold Blues": bright, with a centroid of about 2,600 Hz.

**Next:**
- the owner's pick of the bed, then the three cuts mixed with it;
- the owner's ear on the sound: any kind is swapped in `sounds.json` and remixed in seconds;
- `study.mjs` for the owner's inspiration videos;
- Phase F (HTML5).

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
- Music: a CC0 lounge or lo-fi recording from OpenGameArt (`oga.py`, `mix.py --bed`), picked by the owner from
  auditions; the house bed made here (`music.py`) was turned down. Voice-over: none.
- Tools the owner may load (video, design or voice). They slot in behind the same storyboards.
- Phone footage of a real scan on the Fold would be the strongest scan proof when the owner can record it.
