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
from config import (TCGCSV, LAST_UPDATED, CATEGORY_ID, USER_AGENT, CACHE, NEW_GROUP_GRACE_DAYS)


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


def _days(a, b):
    """Whole days from date a to date b (YYYY-MM-DD)."""
    import datetime
    return (datetime.date.fromisoformat(b) - datetime.date.fromisoformat(a)).days


def empty_refusal(gid, name, pub, was, today):
    """Why an empty group stops the build, or None when the source explains it (landmines 5, 42, 256). A group that
    had products in the last build and has none is a regression. One announced for a later day is a release schedule
    (take 2's landmine 42). Take 153 (landmine 256): one the source published today or up to NEW_GROUP_GRACE_DAYS
    before, that never had products, is listed and not yet stocked -- TCGCSV lists a group on its publish day and fills
    it with its evening update. Anything else -- an older group, or none with a date -- is a blocked response wearing
    an empty body, and stops the build. The wave guard in fetch() still refuses more than three empty groups."""
    if was:
        return (f"tcgcsv: group {gid} ({name}) has ZERO products but had "
                f"{was} in the last build.\n  That is a regression, not a release "
                f"schedule. Refusing to build (landmine 5).")
    if pub and pub > today:
        return None
    if pub and 0 <= _days(pub, today) <= NEW_GROUP_GRACE_DAYS:
        return None
    return (f"tcgcsv: group {gid} ({name}) returned ZERO products with "
            f"no unreleased-set explanation\n  (publishedOn={pub or 'none'}, "
            f"today={today}). Refusing to build (landmine 5).")


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
            why = empty_refusal(gid, g["name"], pub, prev.get(str(gid)), today)
            if why:
                raise SystemExit(why)
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
            print(f"   skipped {gid} '{name}' — " + (f"unreleased (publishes {pub})" if pub > today
                  else f"listed {pub}, no products yet (landmine 256)"))
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


def selftest():
    """Negative controls for the empty-group rule, through fetch() itself: the source's answers are stand-ins (no
    network), the cache a temporary directory, today the real day. Landmine 5's refusals each fire; landmine 256's
    publish-day listing ships, recorded in empty_groups."""
    import tempfile, datetime
    today = time.strftime("%Y-%m-%d", time.gmtime())
    ago = lambda k: (datetime.date.fromisoformat(today) - datetime.timedelta(days=k)).isoformat()   # noqa: E731
    def run(extra, prev=None):
        """88 groups would be the real shape; two stocked ones and the case under test are enough for the rule"""
        global CACHE, _json, last_updated
        groups = [{"groupId": 1, "name": "A", "publishedOn": "2024-01-01T00:00:00"},
                  {"groupId": 2, "name": "B", "publishedOn": "2024-02-01T00:00:00"}] + [dict(g) for g in extra]
        stocked = {1: 3, 2: 2}
        answers = {f"{TCGCSV}/{CATEGORY_ID}/groups": groups}
        for g in groups:
            gid, n = g["groupId"], stocked.get(g["groupId"], 0)
            answers[f"{TCGCSV}/{CATEGORY_ID}/{gid}/products"] = [{"productId": gid * 100 + k, "groupId": gid, "name": f"p{k}",
                                                                 "extendedData": [{"name": "Number", "value": f"X-{k:03d}"}]} for k in range(n)]
            answers[f"{TCGCSV}/{CATEGORY_ID}/{gid}/prices"] = []
        saved = (CACHE, _json, last_updated)
        with tempfile.TemporaryDirectory() as td:
            CACHE = td
            if prev is not None:
                json.dump({"group_counts": prev}, open(os.path.join(td, "tcgcsv_payload.json"), "w"))
            _json, last_updated = (lambda url: answers.get(url, [])), (lambda: today + "T20:05:00+0000")
            try:
                out = fetch(verbose=False)
                return None, out.get("empty_groups", [])
            except SystemExit as e:
                return str(e), None
            finally:
                CACHE, _json, last_updated = saved
    G = lambda pub, gid=9: {"groupId": gid, "name": "New", "publishedOn": pub + "T00:00:00" if pub else None}   # noqa: E731
    cases = [
        ("every group stocked builds", run([]), lambda r: r[0] is None and r[1] == []),
        ("an empty group announced for a later day is skipped, recorded (landmine 42)", run([G(ago(-5))]), lambda r: r[0] is None and [list(x) for x in r[1]] == [[9, "New", ago(-5)]]),
        ("take 153: one the source published today, never stocked, is skipped, recorded (landmine 256)", run([G(today)]), lambda r: r[0] is None and len(r[1]) == 1),
        ("...yesterday too", run([G(ago(1))]), lambda r: r[0] is None and len(r[1]) == 1),
        ("control: two days on, still empty, it stops the build", run([G(ago(2))]), lambda r: r[0] and "no unreleased-set explanation" in r[0]),
        ("control: an empty group with no date stops the build", run([G("")]), lambda r: r[0] and "publishedOn=none" in r[0]),
        ("control: a group that had products in the last build stops it, published today or not", run([G(today)], prev={"9": 75}), lambda r: r[0] and "had 75 in the last build" in r[0]),
        ("control: four empty groups are a throttle, even all published today", run([G(today, 9), G(today, 10), G(today, 11), G(today, 12)]), lambda r: r[0] and "throttle" in r[0]),
    ]
    width = max(len(n) for n, _, _ in cases)
    good = True
    for name, r, fine in cases:
        f = bool(fine(r))
        good &= f
        print(f"  {'ok  ' if f else 'FAIL'}  {name:<{width}}  {r[0].splitlines()[0][:70] if r[0] else 'built'}")
    return good


if __name__ == "__main__":
    if "--selftest" in sys.argv:
        print("tcgcsv.py negative controls:")
        raise SystemExit(0 if selftest() else 1)
    fetch()
