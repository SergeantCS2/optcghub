# PROVISION

*Current as of take 136.*

Every host this project touches, in either phase, with its purpose, licence and
cadence. The gate refuses an undeclared host named in the built `www/` or
carried in the bundle's picture column (`check_offline`); it does not read
`tools/` (corrected take 109).

PROTOCOL §8 splits these into two phases. **Provisioning** happens at home on
wifi and may fetch. **Scanning** happens anywhere and may not.

---

## Build-time hosts — `tools/`

| Host | Purpose | Phase | Cadence | Licence / terms |
|---|---|---|---|---|
| `tcgcsv.com` | TCGplayer categories, groups, products, prices for `categoryId 68` | build: the nightly, and the hourly `hunt` workflow's rebuild of `www/` (about six a day in practice, take 114) | TCGCSV refreshes daily around 20:05 UTC | Free public mirror of TCGplayer data. Community-run (`CptSpaceToaster/tcgcsv`), Patreon-supported. Attribution required in-app. |
| `sergeantcs2.github.io` (Pages) | the nightly `bundle/manifest.json` and `bundle/catalog.json` | More → Sync, and once on open when online | **Yes** — written to `Directory.Data` as the live catalogue; the APK's bundled copy is the fallback. Take 27. `UPDATE_URL` set at take 33; empty disables it |
| `onepieceevents.com` | the static `data/evnt_us.json` — since 2026-09-22 a chunk index (`chunked-events-v1`) naming `evnt_us_part_NNNN.json` files, three today, ~108 MB raw, ~50,300 US One Piece events with each store's name, address, city, zip and point (derived from Bandai TCG+, where stores register to run events); the take-74 shape `{"events": [...]}` is still accepted (landmine 130) | the `hunt` workflow (scheduled hourly; GitHub runs it every 4–5 h in practice), at most once a day | daily | Third-party aggregator, keyless, public static files (a `manifest.json` lists them). The roster ships as `hunt/stores.json` naming its source and fetch time (take 74) |
| `www2.census.gov` | the ZCTA gazetteer: a centroid per US zip | once, cached as `catalog/zcta.json` in the tree | never again unless removed | US Census, public domain. 758 KB compacted to two decimals; the app ships only the ~900 3-digit-prefix means (take 74) |
| local game stores' Shopify storefronts (`hunt/storefronts.json`, hand-verified: today `blackvaultgaming.com`) | `/products.json` and `/collections/…/products.json` — the store's own public listings: One Piece sealed product with price and availability | the hourly `hunt` workflow | hourly | Public by design on every Shopify store; keyless; ~20 requests a store at most. The feed names the shop, links into its store, and says a shop lists what it chooses (take 75) |
| `api.frankfurter.dev` | the day's ECB reference exchange rates, USD to seven currencies, for the display-currency option | build (nightly and hourly), keyless | daily | ECB data via a free public mirror; cached as `catalog/rates.json` so a failed fetch shows the last rates with their date. Every converted price carries ≈ and the picker names the rate's date (take 85) |
| `redsky.target.com` | Target's own product JSON: search, price, nearby stores, per-store availability for the configured zip (A32) | the hourly `hunt` workflow on the runner — **never the app** | hourly | Keyless; the key is the public constant in every Target page. The feed ships as `hunt/feed.json` with the fetch time on every source (take 71) |
| `www.gtsdistribution.com` | GTS Distribution's public listing of One Piece × Bandai Japan (one faceted page, `rpp=60`, and the product object it embeds): name, SKU, UPC, MSRP, release and order-due dates (landmine 172), the stock words, the allocation flag (A32, take 94). *Take 114: GTS's `preorder_date` is its "Order Due Date", read off one product page by hand from the session VM (one request, a User-Agent naming the project); the runner and the app read the listing only.* The wholesale price sits behind a login the project never uses | the hourly `hunt` workflow on the runner — **never the app** | hourly, one call a run (a second page only past 60 products) | Public storefront pages, keyless, no account, a User-Agent naming the project. No robots.txt is published (500) and the terms name no automation clause. The feed names the distributor, the fetch time, and calls the MSRP what it is |
| `www.southernhobby.com` | Southern Hobby's public One Piece category page (`/ccg-s/one-piece-card-game/c13_1000991/`: name, item number, release date, order-due date) and each listed product's page (prerelease date, sold-as unit, configuration, "subject to allocation", "brick and mortar restricted") (A32, take 112). Prices sit behind a login the project never uses | the hourly `hunt` workflow on the runner -- **never the app** | hourly: the category page once a run; a product page when its item first appears and again after a week: at most 25 a run, 1.5 s apart, none started 90 s into the run (a host that hangs costs a run two minutes, not the hourly job) | Public storefront pages, keyless, no account, a User-Agent naming the project. robots.txt (read take 112) allows both kinds of page and disallows search, quick view and `sort=` URLs, which the fetcher never asks for |
| `www.walmart.com` | Walmart's own item pages (`/ip/<id>`: the product in the page's JSON -- price, availability, the marketplace seller, the fulfillment options) for a committed list of One Piece items (`tools/hunt/walmart_items.json`, matched to the catalogue by the feed's matcher and read over by the session; A32, take 130). MEASURED on a GitHub-hosted runner (probe run 1, 2 Oct): the item page is served whole to a plain request with a phone's user agent; the search page is served too but **robots.txt disallows `/search`**, so the runner never fetches it -- the list is refreshed by hand (`walmart.py --discover`, a person's pace, never the workflow). The store finder's own query (`/orchestra/home/graphql/storeFinderNearbyNodesQuery`) is probed, not read, until measured | the hourly `hunt` workflow on the runner -- **never the app** | hourly: at most 12 item pages a run, 2 s apart, round-robin with a cursor, so every item is read a few times a day | Public product pages, keyless, no account. robots.txt (read 2 Oct) allows `/ip/` and `/store/finder`, disallows `/search` and the store AJAX paths, none of which the source asks for. Walmart's Terms of Use name automated access; the volume here is a dozen page reads an hour, and the feed names Walmart, the seller and the fetch time on every line |
| `tcgplayer-cdn.tcgplayer.com` | Card art, downloaded to compute dHash then **discarded** | build | on catalogue change; every known miss retried each run (take 89) | Bandai / Shueisha / Toei / Viz artwork. Never redistributed. Only the 64-bit hash ships (landmine 26). A 403/404 means the CDN has not published that id; a canary of known-good ids tells refusal from absence (landmine 124). Take 109: 40 fixed printings are also fetched at `_in_1000x1000` for availability and size, then **discarded**; the count and the median size ship in the manifest, and the app uses that size only when the build saw it served |
| `product-images.tcgplayer.com` | TCGplayer's second image host (take 100): one probe per product id the first host refuses — the 674 sealed images are probed for availability too — fetched and **discarded**, never hashed; the ids it serves are recorded in the sidecar's `alt` and exported as that product's `img` | build | every run, only the ids the first host refuses | Same artwork, same terms as the row above. Never redistributed; a URL that served is the only thing that ships |
| `en.onepiece-cardgame.com` | the official Comprehensive Rules PDF (`/pdf/rule_comprehensive.pdf`, the url in `tools/rules/digest.json`): `tools/rules.py` reads only its version line and date, for `bundle/rules.json`'s `official` (take 122) | build | every run; one request | Bandai's own site. Nothing of the PDF ships but its version and date; a failed fetch writes `official: null` with the reason and never stops a build |
| `registry.npmjs.org` | `puppeteer` and `acorn` for `ci/deps.sh` (the render receipt and the comment strip); the Capacitor packages for `ci/apk.sh` | build, on the runner and in the session's rebuild | every run | npm's public registry. A session whose environment closes it cannot render in Chrome or gate (take 89: it was closed, and named) |
| `pypi.org`, `files.pythonhosted.org` | `pillow` and `cairosvg` for `ci/deps.sh` (hashes, the star template; `ci/icon.py`, whose controls the gate runs; cairosvg needs the system libcairo) | build, on the runner and in the session's rebuild | every run | PyPI. Same note as npm |

`tcgcsv.com` is fetched with a declared User-Agent naming this project,
sequentially, with a non-empty assertion per group (landmine 5).

## Runtime hosts — `www/`

The table below is the allowlist: the gate (`check_offline`) refuses any host
named in `www/` that is not declared here, and that is all it checks —
"DISPLAY-ONLY" and "user-tap-only" below describe purpose, which is prose,
not a gate (corrected take 93; the earlier "two entries … in the gate" wording
described takes 12–26). Only Pages is load-bearing, and only for the sync;
the airplane-mode invariant in PROTOCOL §8 holds without every one of them.

| Host | Role | Trigger | Load-bearing? |
|---|---|---|---|
| GitHub Releases | catalogue and price sync | user taps Sync, or once per 24 h on wifi | No — the app runs on its last catalogue and every price shows its date |
| `sergeantcs2.github.io` (Pages) | the nightly `bundle/manifest.json` and `bundle/catalog.json` | More → Sync, and once on open when online | **Yes** — written to `Directory.Data` as the live catalogue; the APK's bundled copy is the fallback. Take 27. `UPDATE_URL` set at take 33; empty disables it |
| `tcgplayer-cdn.tcgplayer.com` | reference image for a card the collector has **not** scanned | collection tiles, the picker, card detail (take 12); Hunt's rows (take 83); every card and set row that lists a printing — search, movers, Home, the set browse, a card's other printings, deck rows, the card browse, Trade (take 93) — through one `refArt()` and one box; used boldly from take 109 (the owner's ruling, A42): the Decks hero, the ready-made decks, a deck's Leader, a card's own page and its backdrop, at `_in_1000x1000` (600x838, up to 716x1000) where the build measured it | No — DISPLAY-ONLY by design, not by a gate check. `loading="lazy"`, memory cache, never written to disk, falls back to the card's own colours. A scanned card uses the collector's own photograph (landmines 27, 28). Most card pictures carry the publisher's SAMPLE stamp — 18 of 20 looked at here, and 20 of 20 at Bandai's own site — always in one band at about 45-60 % of the card; a banner shows only the card above 42 % (landmine 151) |
| `product-images.tcgplayer.com` | reference image for a product the first host does not serve — the runner measured it serving, and the catalogue carries that URL as the product's `img`; through the same `refArt()` and box | the same rows and sheets as the row above | No — DISPLAY-ONLY; a failure removes the image and the label box stays. Carried in `bundle/catalog.json`, never a literal in `www/`; the gate reads the bundle's hosts since take 100 |
| `sergeantcs2.github.io` (Pages), `bundle/rules.json` | the rules digest and the official PDF's version, for the Rules sheet's *Check for updates* (take 122) | the collector taps Check for updates | No — the app keeps the digest it was built with; a newer one from Pages replaces it on the phone, an older one never does |
| `en.onepiece-cardgame.com` | the official rules PDF, opened by the Rules sheet's link (take 122) | the collector taps the link | No — the app never fetches it; the OS browser opens it |
| `www.tcgplayer.com` | a set's full listing, opened by the *Details ↗* link on every Releases row (take 82) — a search of the set's name on TCGplayer; and a sealed product's own page, `…/product/<id>` with the catalogue's product id, from the chip under its Sealed row and the *Where to buy* panel on its sheet (take 96) | the collector taps the link | No — the app never fetches it; the OS browser opens it. No affiliate or tracking parameter |
| the sellers the feed names — Target, a shop's Shopify storefront, the distributor | the *Where to buy* chips and panel (take 96): each item's own link as the feed carries it, plus the roster's address and phone for a shop (a `tel:` link) | the collector taps a chip | No — data in `hunt/*.json`, never a literal in the app and never fetched by it; the OS browser or dialler opens it |
| the match relay (take 131, D18): the owner's Worker at `optcghub-relay.<subdomain>.workers.dev` -- its literal host is declared on its own row here the take `BUILD` gains `VAULT_RELAY` (RUNBOOK §9) | *Play online*: `POST /new` for a room code, then one WebSocket per seat; what crosses is the code, a token per seat, the two deck lists and the moves; the relay forgets a room a day after its last frame | the collector hosts or joins a match | No — with no `VAULT_RELAY` in `BUILD` the entry is not painted; the app never speaks to it otherwise |
| `play.google.com` | the app's OWN Play listing, handed to the OS by More → *Rate this app* and *Tell someone about the app* (take 65) | the collector taps one of those two rows | No — the app never fetches it. The URL is `…/details?id=com.optcghub.app` and carries no referral, campaign or tracking parameter (A30) |

## Citation hosts — displayed, never requested

Named in the About screen and in the Play listing, per landmine 29 and the APEX
ORV take-167 rejection. These are links a person may tap; the app never fetches
them.

| Host | What it is |
|---|---|
| `tcgplayer.com` | Source of all catalogue and price data |
| `tcgcsv.com` | The mirror this app actually reads |
| `en.onepiece-cardgame.com` | Bandai's official card game site |

Every URL is checked with a request before it is written down. Play requires
them to be valid and functional, and a dead link is another rejection.

## Not used, and why

| Source | Why not |
|---|---|
| TCGplayer developer API | Closed to new applicants (A1) |
| Scraping TCGplayer HTML | Terms, Cloudflare, Play removal ground (landmine 32) |
| eBay Browse API | Live asks only; sold data gated behind approval. Not needed |
| JustTCG / tcgapi.dev / PriceCharting | Paid. $0 budget, and TCGCSV covers One Piece completely (A1) |
| Any analytics or crash SDK | Landmine 39. Nothing is collected, so nothing is declared |
