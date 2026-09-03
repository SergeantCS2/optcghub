#!/usr/bin/env python3
"""Keep a rolling daily price history OUTSIDE the disposable catalogue.

Landmines 46 and 47 in one sentence: expensive or irreplaceable derived data
does not live inside the thing that gets deleted. Yesterday's prices are
irreplaceable — TCGCSV publishes today's and only today's — so the moment a
payload is fetched, its prices are appended here, keyed by the source's own
publication date, and this file is committed alongside catalog/hashes.json.

The app never sees this file. build_catalog.py reads it to fill price_history
and to precompute per-printing deltas into the bundle, so the scan-time path
stays a lookup (landmine 8: the catalogue is small, keep it that way).

Rolling window: DAYS days. At ~7,300 priced products per day, a year would be a
few MB of JSON; a window keeps it a few hundred KB and still covers every
timeframe the reference app shows (1D, 7D, 1M, 3M, 6M) plus a MAX that is
honestly "since this app started tracking".
"""
import json, os, sys
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from config import CACHE, CATALOG_DB
import tcgcsv

SIDECAR = os.path.join(os.path.dirname(CATALOG_DB), "prices_daily.json")
DAYS = 200


def load():
    if not os.path.exists(SIDECAR):
        return {}
    return json.load(open(SIDECAR))


def save(h):
    days = sorted(h)
    for d in days[:-DAYS]:
        del h[d]
    json.dump(h, open(SIDECAR, "w"), separators=(",", ":"))
    return h


def append_from_payload(payload, verbose=True):
    """Record the payload's prices under the SOURCE date, not the fetch date.
    Landmine 3: TCGCSV refreshes ~20:00 UTC, so a fetch at 03:00 UTC on the 2nd
    carries the 1st's prices, and filing them under the 2nd would be a lie that
    corrupts every delta downstream."""
    day = payload["source_updated_at"][:10]
    best = {}
    for r in payload["prices"]:
        m = r.get("marketPrice")
        if m is None or m <= 0:
            continue
        pid = str(r["productId"])
        # One value per printing per day: the dearer sub-type, matching the
        # bundle's choice (landmine 44).
        if pid not in best or m > best[pid]:
            best[pid] = m
    h = load()
    fresh = day not in h
    h[day] = best
    save(h)
    if verbose:
        print(f"   {'recorded' if fresh else 'refreshed'} {len(best)} prices for {day}"
              f"  ·  {len(h)} day(s) on file: {min(h)} .. {max(h)}")
    return h


def deltas(h, today=None):
    """-> {pid: {'d1': (abs, pct) | None, 'd7': ..., 'd30': ..., 'max': ...}}

    Each delta is against the CLOSEST day on file at or before the horizon, and
    is None if no such day exists. Absence is reported as absence; a missing
    day is never interpolated, because a flat line invented across a gap reads
    exactly like a real flat market (PROTOCOL §10)."""
    if not h:
        return {}
    days = sorted(h)
    today = today or days[-1]
    cur = h[today]
    from datetime import date

    def at_or_before(n):
        y, m, d = map(int, today.split("-"))
        target = date(y, m, d).toordinal() - n
        cands = [x for x in days if date(*map(int, x.split("-"))).toordinal() <= target]
        return cands[-1] if cands else None

    horizons = {"d1": at_or_before(1), "d7": at_or_before(7),
                "d30": at_or_before(30), "max": days[0] if days[0] != today else None}
    out = {}
    for pid, now in cur.items():
        row = {}
        for k, day in horizons.items():
            then = h[day].get(pid) if day else None
            if then is None or then <= 0:
                row[k] = None
            else:
                row[k] = (round(now - then, 2), round(100 * (now - then) / then, 2))
        out[pid] = row
    return out


if __name__ == "__main__":
    h = append_from_payload(tcgcsv.cached())
    d = deltas(h)
    moved = sum(1 for v in d.values() if v["d1"] and v["d1"][0] != 0)
    with1 = sum(1 for v in d.values() if v["d1"])
    print(f"   {with1} printings have a 1-day delta; {moved} of them moved")
