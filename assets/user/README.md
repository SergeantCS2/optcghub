# assets/user — pictures Jacob supplies

Drop files here by these exact names. `build_app.py` copies whatever exists into
`www/bundle/user/` and the app uses it; a missing file falls back to the brass
compass on the night-sea gradient. Nothing here is required.

| file | used where | size | notes |
|---|---|---|---|
| `guide-bg.jpg` | behind the first-run guide | 1080×1920, portrait | dark-ish, or the parchment text won't read; the app overlays a navy gradient at 70% |
| `home-bg.jpg` | faint, behind the Home hero | 1080×800 | shown at ~10% opacity |
| `splash-bg.jpg` | the launch screen | 1080×1920 | replaces the icon-on-navy splash |
| `empty-collection.png` | the empty Collection state | 512×512, transparent | replaces the skull glyph |
| `guide-1.jpg` … `guide-5.jpg` | one per capability card in the guide | 1080×600 | Scan · Value · Decks · Trade · Offline, in that order |

**What is and is not safe to put here — the ledger's line, stated once
(landmines 26, 30; AGENDA A16):** your own photographs of your own cards, a
sleeve, a binder, a playmat, a table — fine, and honestly the most premium thing
this app can show, because they are real. Official artwork, character
illustrations, publisher logos, the franchise wordmark — those are Bandai /
Shueisha / Toei / Viz property, and with ads on (A17) this is a commercial app.
The app will not stop you. The Play listing is the exposure, and it is yours.

## Fonts — `assets/user/fonts/` (take 33, A26)

Four roles, four files. Drop a licensed face in under the ROLE's name and the
next build uses it for that role; nothing else changes.

| file | role | what ships when it is absent |
|---|---|---|
| `display.woff2` / `.ttf` / `.otf` | headlines, the hero, panel titles | Luckiest Guy (Apache-2.0) |
| `comic.*` | tabs, group labels, the mode slider | Bangers (OFL) |
| `body.*` | everything readable | Open Sans (OFL) |
| `heavy.*` | the big numbers | Nunito Sans (OFL) |

A face you buy an **app-embedding** licence for is fine here (Impress BT and
Avenir from Monotype; Anime Ace BB's commercial licence from Blambot). A copy
from a free-fonts site is not: this is a commercial app (A17) and a font file
inside the APK is redistribution. Trebuchet MS ships with Windows and cannot
be redistributed at all.

Keep originals elsewhere; this folder ships in the seed.
