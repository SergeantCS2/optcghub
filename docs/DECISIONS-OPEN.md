# OPEN DECISIONS — needed from the owner

*Current as of take 89.* Everything else is decided and recorded in AGENDA.

**D1 — App id and name. ANSWERED: registered with Play at the take-35 upload as `com.optcghub.app` / "OP TCG Hub", permanent.** *(original)* Proposed `com.optcghub.app` / "OP TCG Hub". Permanent
once registered under developer verification and fixed from first Play upload
(A8, landmine 36). Blocks the first commit.

**D2 — Play account. ANSWERED take 39: personal, so the 12-tester / 14-day gate applies (landmine 35).** *(original)* Personal or organisation, and created when? If personal
and after 13 Nov 2023, Phase 6 carries a 12-tester / 14-continuous-day gate that
is pure calendar time (landmine 35). This answer decides whether tester
recruitment starts this week or never happens.

**D3 — Sideload applicationId. ANSWERED take 39: no — one id, registered; the switch is export → uninstall → import (landmine 34).** *(original)* Does the sideload build get its own applicationId? APEX ORV ships two so
both can sit on the phone. Recommended yes. Decide before there is a collection
worth keeping — WebView storage is per-app and does not carry across (landmine 34).

**D4 — Is the collection English-only?** v1 assumes yes (A11). If there are
Japanese cards in the binder, the detect-and-refuse path in Phase 3.9 moves from
a nicety to a requirement, because a JP card silently matched to its EN twin is
a 10× error.

**D5 — Sealed product: in the collection or not?** 658 of 7,518 products are
sealed and cannot be scanned (A7, landmine 9). Manual entry is planned for
Phase 5.6. If sealed is a large share of the collection's value, it moves earlier.

**D6 — PC or phone for the Phase 0 spike?** The measurement must run on the Fold
regardless (PROTOCOL §1), but the harness can be written on either. PC access
makes a native Capacitor plugin a realistic fallback if A2 fails.

---

*Added take 12.*

**D7 — Icon and splash motif.** *Take 33: reverted to the take-16 compass placeholder at the owner's ask; the jolly roger is kept as `assets/icon-jollyroger.svg`. The motif question stays open.* `assets/icon-placeholder.svg` is a compass rose
behind a card silhouette on the six-colour hexagon. Options that stay clear of
landmine 30: a compass / log pose; a treasure chest with cards in it; a generic
jolly roger (skull and crossed bones — *not* the Straw Hats' hat-wearing one); a
ship's wheel; rope and parchment. Which direction, or send a sketch.

**D8 — How much colour?** Today: teal on black, the reference app's palette,
with the game's six colours as accents (tile bar, colour dots). Alternative: a
warmer nautical palette — parchment, brass, deep navy — with the six as accents.
The first matches Collectr; the second is more One Piece and less Collectr.

**D9 — Decals.** "Decals" could mean: set logos on set headers (those are
Bandai's — no); a rarity glyph beside the rarity letter (fine, original); a
treatment ribbon on alt-art / SP tiles (fine); a small compass watermark on
empty states (fine). Which of these, and any screenshots of what you have in
mind, would settle it.

---

*Added take 13 — ads (A17).*

**D10 — The numbers.** 20 free credits on install, +20 per rewarded ad, 1 free
deck save, +1 per ad. Confirm or change; they are constants.

**D11 — AdMob account.** *Take 33: it exists — publisher `pub-6243777967151950`, and the app-ads.txt line is in RUNBOOK-play §9. Take 41: the app ID `ca-app-pub-6243777967151950~1538944343` is in `config.py`; the two rewarded ad units are still Google's test units.* Still needed, when the closed test is real users and not before (A17): the AdMob **app ID** (`ca-app-pub-6243777967151950~…`) and **two rewarded ad-unit IDs** (`…/…`), one for scan credits and one for deck saves. Three values into `tools/config.py`.

**D12 — Banners.** None on Scan is proposed as fixed. One on Search, yes or no?

**D13 — Ad-free purchase.** A one-time IAP for unlimited credits, or not for v1?

---

*Added take 23 — the one with a deadline.*

**D14 — One game or many? ANSWERED take 24: One Piece is the app; other games are a future maybe (A19). The package name stays. The take-23 deadline was overstated — landmine 97.** *(original text follows)* If OP TCG Hub is One Piece, ship as-is. If it is
the first of several games under one listing, pick a non-franchise name THIS
WEEK — the package name `com.optcghub.app` cannot change after the first Play
upload, and I re-cut it in ten minutes today. See A19.

---

*Added take 79.*

**D22 — Stock checks while the app is closed.** Today a stock alert fires
when the app is opened and the feed refreshes. A check with the app closed
needs a background task: a Capacitor background runner (a new native
plugin, an Android WorkManager job at fifteen-minute minimum, JavaScript
in a separate context with no DOM), which costs battery, adds a permission
prompt on newer Android, and is one more thing Play reviews. The
alternative costs nothing: the hourly feed already runs on the runner, so
the *runner* could decide "this watched product flipped" — but the runner
does not know what any phone watches, and telling it would mean a phone
sending its watch list somewhere (§9). So: (a) background runner in the
app, (b) open-the-app-to-check as it is, or (c) a daily scheduled local
notification that simply says "open Hunt to check your watches"? Nothing
is built until this is answered; (b) is the default.

*Added take 72.*

**D21 — Local stock for a zip the runner does not serve.** The hourly feed
carries shelf stock only for the zips in `HUNT_ZIPS`. A collector elsewhere
sees the online layer and *no local check for your area yet*. Two ways to
close that: (a) the sideload build fetches Target's store stock from the
phone for any zip, on tap only — the owner's own device, his own IP, at most
a dozen calls; or (b) the Play build does the same, which sends a typed zip
to a retailer and must be declared in Data Safety (data shared with third
parties: approximate location). (a) needs no decision from Play; (b) needs
the form updated and re-reviewed. Which, and when?

*Added take 69.*

**D20 — Crowd reports for stores with no online stock (A32).** The most
valuable signal for the local half — *"three boxes at Pandemonium, $130, this
morning"* — is one collector telling the others, and that needs somewhere
shared to write it: a server, however small. This project has refused a
server since take 1 and the listing says the collection never leaves the
phone. A reports store is not the collection, and it can be a public
append-only file that the runner folds into the feed — but it is still a
place data from users goes. Yes to a minimal reports endpoint for Hunt only,
with nothing personal in a report (store, product, price, time), or no and
the local half stays notes-only? This is the decision that sets the ceiling
on Hunt's local value.

*Added take 67.*

**D19 — Retailer price sources for Hunt (A32). ANSWERED take 68: no accounts, no keys — keyless sources only, the runner as the scraper for the Play build, phone-side extras in the sideload build.** *(original)* TCGplayer via TCGCSV
ships first and needs nothing from you. Beyond that, every retailer feed is
a key in a repository secret that only you can obtain: a Walmart affiliate
or marketplace API account is the one with a documented price API; Target,
Meijer and Barnes & Noble have none, so for those the choice is *no feed*
or *your own notes*. Which accounts will you open, and is an affiliate
account acceptable given the listing says no affiliate links? (A key is not
a link; the fetch would carry no tracking and the app would show no
affiliate URL — but say so before I build on it.)

*Added take 44.*

**D17 — "Portfolio" in the app's own vocabulary.** The Home hero and the
portfolio sheet say *Portfolio*; that word is what led the Play declaration
to *Stock trading and portfolio management*, the organisation-only trigger
(take 43). A reviewer reads the same word. *Binder* or *Collection* say the
same thing for cards. Rename, or keep and accept the reviewer's second look?

**D18 — A relay for two-phone play across the internet (A23 step 4).** Same
wifi or a hotspot needs no server; the internet does — a STUN server and a
signalling relay. The ledger has said no server since take 1. Not now; on
the record so the sim's transport is a decision and not a surprise.

*Added take 33.*

**D16 — The named fonts (A26).** Luckiest Guy, Bangers, Open Sans and Nunito Sans ship as the four roles. If you want Impress BT, Anime Ace BB or Avenir Black themselves: buy the app-embed licence, drop the file into `assets/user/fonts/` as `display`, `comic` or `heavy` with its extension, and the next build uses it. Trebuchet MS cannot be shipped at all; Fira Sans is its free twin if you want a third plain face. Yes to the defaults as they are, or which files are coming?

---

*Added take 28.*

**D15 — Colour direction (A24).** Parchment-light, straw-and-sky, ink-and-
paper, or a photo of your own behind the hero (drop `home-bg.jpg` into
`assets/user/` and it is done). One word, or a picture of a thing whose colours
you like, and I do the pass. Not urgent.
