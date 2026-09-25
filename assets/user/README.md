# assets/user — pictures the owner supplies

Drop files here by these exact names. `build_app.py` copies whatever exists into
`www/bundle/user/` and the app uses it; without a file, that place stays as the
app draws it. Nothing here is required.

| file | used where | size | notes |
|---|---|---|---|
| `home-bg.jpg` | faint, behind the Home hero | 1080×800 | under the page colour at 88 %, fading to solid |
| `hero-play.jpg` | behind Decks' title, in place of the featured Leader's blurred art (take 110) | 1080×640, landscape | shown sharp and uncut, filling the band behind the mode slider; the slider and the status bar read over its top, so keep the top third quiet |
| `hero-hunt.jpg` | Sealed's banner, in place of the newest set's top card (take 110) | 1080×640, landscape | shown sharp and uncut, as above |

**What goes here — the owner's ruling (A42, take 106):** "if we can use
official art, card art or anything we can leverage i'm more than okay with
it. We should not be making our own images from scratch however." The app
itself shows card art hot-linked from TCGplayer from take 109 and bundles
none (landmines 26, 28). A picture put here is different: it is copied into
the build and ships inside the APK, so it is the owner's own choice and the
owner's exposure. Your photographs of your own cards, sleeves, binders and
playmats are the safest thing to put here. What the icon, the opening
screen and the Play listing show is where Play acts on a complaint first:
keep characters and publisher marks out of those three (landmines 30, 31).
Since take 116 the opening screen and the first-open guide are one painted
scene -- the listing's frame with the app's own card -- and take no picture
from here; the guide's pages show card art hot-linked, as the app does.

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
