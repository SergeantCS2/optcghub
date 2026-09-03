# OP TCG Hub

**Your One Piece collection, scanned without a cap, valued honestly, and yours to keep.**

Unlimited card scanning, a portfolio that works with no signal, and a collection
that lives in a file on your phone with a one-tap CSV export. No account, no
subscription. Supported by short rewarded ads that unlock new saves — scanning
itself is never gated, and nothing already in your collection ever is.

**Install:** the signed APK is on the latest [Release](../../releases/latest).
Android 8+.

> [!IMPORTANT]
> **A price is an estimate, not an offer.** All catalogue and price data comes
> from TCGplayer via [TCGCSV](https://tcgcsv.com), refreshed daily. Every figure
> in the app shows the date it was fetched. On the day this was written,
> Nefeltari Vivi EB03-024 (SP) had a market price of $467.33 against a low of
> $400.00 — a 17% spread on the same printing on the same day. The app shows you
> the spread instead of hiding it.
>
> **Condition is your call, not the app's.** The free data source publishes no
> per-condition pricing, so OP TCG Hub records the condition you tell it and does
> **not** silently adjust value for it. A made-up multiplier would be a confident
> wrong answer about your money.

> [!NOTE]
> **Not affiliated with, endorsed by, or sponsored by** Bandai, Shueisha, Toei,
> Viz Media, TCGplayer or Collectr. One Piece and the One Piece Card Game are
> their owners' trademarks. This is an independent collection tracker.

---

## What it does

**Scan as many cards as you want.** Scanning is free and unlimited — the app it
replaces stops at 25, and a Constructed deck is 51 cards. Saving to the
collection is supported by short rewarded ads, once they are wired in; nothing
already in your collection is ever gated.

**Know which printing you actually own.** `EB03-024` is three different cards:
a $1.48 base, a $23.36 Alternate Art, and a $467.33 SP. Same number, same set,
same rarity, 316× apart. The scanner reads the printed code, then compares the
artwork to tell the printings apart — and when it can't be certain, it asks you
instead of guessing. A wrong guess here is a silently mispriced collection.

**Works with no signal.** Catalogue and prices download at home over wifi. After
that, scanning, identifying, valuing and saving all run on the phone. The standard
is a cold start in airplane mode: scan a card, see its value, commit it, with the
network badge green throughout.

**Your binder shows your cards.** The thumbnail for a card you've scanned is your
own photograph of it — your foiling, your sleeves, your copy. Not a publisher
sample image.

**Your collection is a file you own.** SQLite on the phone, CSV export from the
first release, automatic backup on every batch you commit. No account to lose
access to, nothing to cancel.

## What it doesn't do

No social feed, no shop, no affiliate links, no subscription, no analytics, no
account. Ads are rewarded-only and gate new saves, never the camera, never
your existing collection, never export. Sealed product and graded slabs are manual entry — the
scanner would guess and guessing is worse than asking. Japanese printings are out
of scope for v1; the scanner detects them and says so rather than matching them to
the English card that shares their number.

Per-condition valuation is a **gap**, and the app says so where it matters. The
free data source doesn't publish it.

---

## Building it

The repo is a seed: source, tools and governance docs. GitHub Actions rebuilds the
catalogue from public sources and produces the signed APK and the Play bundle.
Every host is declared in `docs/PROVISION.md` with its purpose, licence and
cadence.

```bash
python3 tools/pipeline.py    # ingest -> join -> hash -> build -> smoke -> render
node   tools/smoke.mjs       # executes the SHIPPED app
node   tools/render.mjs      # real Chrome, real pixels
python3 tools/gate.py        # the contract
```

**The paper trail is the point.** This project is a sibling of
[APEX ORV](../../../apex-orv) and inherits its governance wholesale.
`docs/HANDOFF.md` is an append-only record of every take. `docs/LANDMINES.md`
numbers known failure modes so they are stepped around instead of rediscovered —
40 of this project's own plus the transferable findings from APEX ORV's 200+.
`docs/AGENDA.md` carries every decision with what was *ruled out* and why. The
build gates on all of it.

The whole One Piece catalogue — 87 sets, 7,518 products, every price — rebuilds
in 11 seconds. There is nothing here worth optimising, so the complexity budget
goes to the scanner instead.

## Credit

Catalogue and pricing data: **TCGplayer**, mirrored by **[TCGCSV](https://tcgcsv.com)**,
a free community service run by one person and funded on Patreon. This app would
not exist without it. If you get value from OP TCG Hub, support them.
