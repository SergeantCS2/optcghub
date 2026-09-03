#!/usr/bin/env python3
"""Fetch the One Piece catalogue and prices from TCGCSV.

Landmine 5, and it fired on this project's very first real fetch: eight-way
parallel requests with Python's default urllib User-Agent returned ZERO products
for all 87 groups, raised nothing, and printed a tidy table of zeros that looked
like a finding. Declared User-Agent + sequential returned 7,518 in 11s.

So: one identity, one request at a time, and a hard assertion that a group which
exists in the group manifest returns products. A zero is never a valid answer.
"""
import json, os, sys, time, urllib.request, urllib.error
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from config import (TCGCSV, LAST_UPDATED, CATEGORY_ID, USER_AGENT, CACHE)


def _get(url, tries=3):
    last = None
    for a in range(tries):
        try:
            req = urllib.request.Request(url, headers={"User-Agent": USER_AGENT})
            with urllib.request.urlopen(req, timeout=45) as r:
                if r.status != 200:
                    raise RuntimeError(f"HTTP {r.status}")
                return r.read()
        except Exception as e:                     # noqa: BLE001
            last = e
            time.sleep(1.5 * (a + 1))
    raise SystemExit(f"tcgcsv: giving up on {url}: {last}")


def _json(url):
    d = json.loads(_get(url))
    if isinstance(d, dict) and "results" in d:
        if d.get("success") is False:
            raise SystemExit(f"tcgcsv: success=false for {url}: {d.get('errors')}")
        return d["results"]
    return d


def last_updated():
    """The service's own stamp. Landmine 3: it refreshes ~20:00 UTC daily, so a
    build scheduled before that ships a day-stale catalogue calling itself current."""
    return _get(LAST_UPDATED).decode().strip()


def fetch(verbose=True):
    os.makedirs(CACHE, exist_ok=True)
    stamp = last_updated()
    groups = _json(f"{TCGCSV}/{CATEGORY_ID}/groups")
    if not groups:
        raise SystemExit("tcgcsv: zero groups — refusing to build (landmine 5)")

    prev = _previous_group_counts()
    today = time.strftime("%Y-%m-%d", time.gmtime())
    products, prices, empty, t0 = [], [], [], time.time()
    for i, g in enumerate(groups, 1):
        gid = g["groupId"]
        P = _json(f"{TCGCSV}/{CATEGORY_ID}/{gid}/products")
        Q = _json(f"{TCGCSV}/{CATEGORY_ID}/{gid}/prices")
        # LANDMINE 5 / LANDMINE 9. A group with no products is either a set that
        # has not been released yet, or a blocked response wearing an empty body.
        # The first is normal; the second must stop the build. Take 2 shipped the
        # blunt form of this check and it cried wolf on its first run against an
        # unreleased set (landmine 42) — the fix is to know the difference, never
        # to widen the guard.
        if not P:
            pub = (g.get("publishedOn") or "")[:10]
            was = prev.get(str(gid))
            if was:
                raise SystemExit(
                    f"tcgcsv: group {gid} ({g['name']}) has ZERO products but had "
                    f"{was} in the last build.\n  That is a regression, not a release "
                    f"schedule. Refusing to build (landmine 5)."
                )
            if not (pub and pub > today):
                raise SystemExit(
                    f"tcgcsv: group {gid} ({g['name']}) returned ZERO products with "
                    f"no unreleased-set explanation\n  (publishedOn={pub or 'none'}, "
                    f"today={today}). Refusing to build (landmine 5)."
                )
            empty.append((gid, g["name"], pub))
            continue
        for p in P:
            p["_groupName"] = g["name"]
            p["_groupAbbr"] = g.get("abbreviation")
        products += P
        prices += Q
        if verbose and i % 20 == 0:
            print(f"   {i}/{len(groups)} groups, {len(products)} products")

    # A wave of empty groups is the shape a throttle takes when every individual
    # response still looks well-formed. One unreleased set is normal; five is not.
    if len(empty) > 3:
        raise SystemExit(
            f"tcgcsv: {len(empty)} groups came back empty. One unreleased set is\n"
            f"  normal, this many is a throttle. Refusing to build (landmine 5).")

    counts = {}
    for p in products:
        counts[str(p["groupId"])] = counts.get(str(p["groupId"]), 0) + 1

    out = {
        "fetched_at": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime()),
        "source_updated_at": stamp,
        "category_id": CATEGORY_ID,
        "groups": groups,
        "group_counts": counts,
        "empty_groups": empty,
        "products": products,
        "prices": prices,
    }
    with open(os.path.join(CACHE, "tcgcsv_payload.json"), "w") as f:
        json.dump(out, f)
    if verbose:
        for gid, name, pub in empty:
            print(f"   skipped {gid} '{name}' — unreleased (publishes {pub})")
        cards = sum(1 for p in products
                    if any(e["name"] == "Number" for e in p.get("extendedData", [])))
        print(f"   {len(groups)} groups  {len(products)} products "
              f"({cards} cards, {len(products)-cards} sealed)  {len(prices)} price rows")
        print(f"   source updated {stamp}  ·  {time.time()-t0:.0f}s")
    return out


def _previous_group_counts():
    """Last build's per-group product counts, for regression detection above.
    Absent on a first run, which is why 'was' is checked before it is trusted."""
    p = os.path.join(CACHE, "tcgcsv_payload.json")
    if not os.path.exists(p):
        return {}
    try:
        return json.load(open(p)).get("group_counts", {})
    except Exception:                                     # noqa: BLE001
        return {}


def cached():
    p = os.path.join(CACHE, "tcgcsv_payload.json")
    if not os.path.exists(p):
        raise SystemExit("tcgcsv: no cached payload — run tools/tcgcsv.py first")
    return json.load(open(p))


if __name__ == "__main__":
    fetch()
