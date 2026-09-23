# PROVISION

*Current as of take 90.*

Every host this project touches, in either phase, with its purpose, licence and
cadence. The gate refuses an undeclared host in `www/` or in `tools/`.

PROTOCOL §8 splits these into two phases. **Provisioning** happens at home on
wifi and may fetch. **Scanning** happens anywhere and may not.

---

## Build-time hosts — `tools/`

| Host | Purpose | Phase | Cadence | Licence / terms |
|---|---|---|---|---|
| `tcgcsv.com` | TCGplayer categories, groups, products, prices for `categoryId 68` | build | nightly, after 20:00 UTC | Free public mirror of TCGplayer data. Community-run (`CptSpaceToaster/tcgcsv`), Patreon-supported. Attribution required in-app. |
| `sergeantcs2.github.io` (Pages) | the nightly `bundle/manifest.json` and `bundle/catalog.json` | More → Sync, and once on open when online | **Yes** — written to `Directory.Data` as the live catalogue; the APK's bundled copy is the fallback. Take 27. `UPDATE_URL` set at take 33; empty disables it |
| `onepieceevents.com` | the static `data/evnt_us.json` — every US One Piece event with its store's name, address, city, zip (derived from Bandai TCG+, where stores register to run events) | the hourly `hunt` workflow, at most once a day | daily | Third-party aggregator, keyless, public static files (a `manifest.json` lists them). The roster ships as `hunt/stores.json` naming its source and fetch time (take 74) |
| `www2.census.gov` | the ZCTA gazetteer: a centroid per US zip | once, cached as `catalog/zcta.json` in the tree | never again unless removed | US Census, public domain. 758 KB compacted to two decimals; the app ships only the ~900 3-digit-prefix means (take 74) |
| local game stores' Shopify storefronts (`hunt/storefronts.json`, hand-verified: today `blackvaultgaming.com`) | `/products.json` and `/collections/…/products.json` — the store's own public listings: One Piece sealed product with price and availability | the hourly `hunt` workflow | hourly | Public by design on every Shopify store; keyless; ~20 requests a store at most. The feed names the shop, links into its store, and says a shop lists what it chooses (take 75) |
| `api.frankfurter.dev` | the day's ECB reference exchange rates, USD to seven currencies, for the display-currency option | build (nightly and hourly), keyless | daily | ECB data via a free public mirror; cached as `catalog/rates.json` so a failed fetch shows the last rates with their date. Every converted price carries ≈ and the picker names the rate's date (take 85) |
| `redsky.target.com` | Target's own product JSON: search, price, nearby stores, per-store availability for the configured zip (A32) | the hourly `hunt` workflow on the runner — **never the app** | hourly | Keyless; the key is the public constant in every Target page. The feed ships as `hunt/feed.json` with the fetch time on every source (take 71) |
| `tcgplayer-cdn.tcgplayer.com` | Card art, downloaded to compute dHash then **discarded** | build | on catalogue change; every known miss retried each run (take 89) | Bandai / Shueisha / Toei / Viz artwork. Never redistributed. Only the 64-bit hash ships (landmine 26). A 403/404 means the CDN has not published that id; a canary of known-good ids tells refusal from absence (landmine 124) |
| `registry.npmjs.org` | `puppeteer` and `acorn` for `ci/deps.sh` (the render receipt and the comment strip); the Capacitor packages for `ci/apk.sh` | build, on the runner and in the session's rebuild | every run | npm's public registry. A session whose environment closes it cannot render in Chrome or gate (take 89: it was closed, and named) |
| `pypi.org`, `files.pythonhosted.org` | `pillow` for `ci/deps.sh` (hashes, the star template) | build, on the runner and in the session's rebuild | every run | PyPI. Same note as npm |

`tcgcsv.com` is fetched with a declared User-Agent naming this project,
sequentially, with a non-empty assertion per group (landmine 5).

## Runtime hosts — `www/`

The allowlist is two entries. Both are user-tap-only, neither is load-bearing,
and the airplane-mode invariant in PROTOCOL §8 holds without either.

| Host | Role | Trigger | Load-bearing? |
|---|---|---|---|
| GitHub Releases | catalogue and price sync | user taps Sync, or once per 24 h on wifi | No — the app runs on its last catalogue and every price shows its date |
| `sergeantcs2.github.io` (Pages) | the nightly `bundle/manifest.json` and `bundle/catalog.json` | More → Sync, and once on open when online | **Yes** — written to `Directory.Data` as the live catalogue; the APK's bundled copy is the fallback. Take 27. `UPDATE_URL` set at take 33; empty disables it |
| `tcgplayer-cdn.tcgplayer.com` | reference image for a card the collector has **not** scanned | collection tiles, search rows, the picker, card detail — **live since take 12** | No — DISPLAY-ONLY. `loading="lazy"`, memory cache, never written to disk, fails silently to a text placeholder. A scanned card uses the collector's own photograph (landmines 27, 28). Every image carries the publisher's SAMPLE watermark, as the reference app's do |
| `www.tcgplayer.com` | a set's full listing, opened by the *Details ↗* link on every Releases row (take 82) — a search of the set's name on TCGplayer | the collector taps the link | No — the app never fetches it; the OS browser opens it. No affiliate or tracking parameter |
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
