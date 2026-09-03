# PROVISION

*Current as of take 41.*

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
| `tcgplayer-cdn.tcgplayer.com` | Card art, downloaded to compute dHash then **discarded** | build | on catalogue change | Bandai / Shueisha / Toei / Viz artwork. Never redistributed. Only the 64-bit hash ships (landmine 26). |

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
