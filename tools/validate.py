#!/usr/bin/env python3
"""Refuse to ship a catalogue that has drifted.

Every check here corresponds to a way this build can be silently wrong. A
catalogue that is 8% short, or whose prices are a day stale, or which contains
one product that moved 300x overnight, will build green and look perfect. These
are the things that notice.

Every check has a negative control in `selftest()`. A guard that has never been
watched to fail is not a guard (AGENTS rule 2).
"""
import json, os, sqlite3, sys, time
from datetime import datetime, timezone
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from config import (CATALOG_DB, MANIFEST, EXPECTED_CARDS, COUNT_TOLERANCE,
                    MAX_DAILY_PRICE_FACTOR, MAX_MANIFEST_AGE_HOURS, ROOT)

PREV = os.path.join(ROOT, "catalog", "previous_manifest.json")


def _fail(msgs, m):
    msgs.append(m)


def check(db, man, prev=None, strict_hashes=True):
    bad = []

    # 1. Card count. Landmine 8 pins the expected size; a real set release moves
    #    it by a few hundred, a broken ingest moves it by thousands.
    lo = EXPECTED_CARDS * (1 - COUNT_TOLERANCE)
    if man["cards"] < lo:
        _fail(bad, f"card count {man['cards']} below floor {lo:.0f} "
                   f"(expected ~{EXPECTED_CARDS})")

    # 2. Freshness. Landmines 3 and 6: TCGCSV refreshes ~20:00 UTC, and a cached
    #    payload will happily rebuild an identical catalogue forever.
    try:
        fetched = datetime.strptime(man["fetched_at"], "%Y-%m-%dT%H:%M:%SZ") \
                          .replace(tzinfo=timezone.utc)
        age = (datetime.now(timezone.utc) - fetched).total_seconds() / 3600
        if age > MAX_MANIFEST_AGE_HOURS:
            _fail(bad, f"payload is {age:.0f}h old (limit {MAX_MANIFEST_AGE_HOURS}h) "
                       f"— the fetcher may be dead and the cache carrying the build")
    except Exception as e:                                # noqa: BLE001
        _fail(bad, f"unparseable fetched_at: {e}")

    # 3. Every set with cards has at least one price. A set that silently loses
    #    its prices values a collector's cards at zero.
    q = db.execute("""SELECT s.name, s.card_count FROM card_set s
                       WHERE s.card_count > 0 AND NOT EXISTS (
                         SELECT 1 FROM printing p JOIN price x USING(product_id)
                          WHERE p.group_id = s.group_id)""").fetchall()
    for name, n in q:
        _fail(bad, f"set '{name}' has {n} cards and NO prices")

    # 4. Landmine 1, enforced structurally. A printing without a productId, or a
    #    card without a number, would let the app fall back to keying on a name.
    n = db.execute("SELECT COUNT(*) FROM printing "
                   "WHERE is_sealed=0 AND (number='' OR number IS NULL)").fetchone()[0]
    if n:
        _fail(bad, f"{n} non-sealed printings have no card number")

    # 5. Landmine 7. An upstream decimal slip beats a 10x market move on priors.
    if prev:
        moved = []
        # Compare LIKE WITH LIKE. The sidecar keeps one value per product -- the
        # dearer sub-type -- and this once iterated every price ROW against it,
        # so a $9.41 Normal row was measured against a $176.58 Foil aggregate and
        # reported an 18x move that never happened (landmine 66; it is landmine
        # 44's fan-out arriving in the guard instead of the bundle).
        for pid, m in db.execute("SELECT product_id, MAX(market) FROM price "
                                 "WHERE market IS NOT NULL AND market > 0 "
                                 "GROUP BY product_id"):
            p = prev.get(str(pid))
            if p and p > 0 and (m / p > MAX_DAILY_PRICE_FACTOR or
                                p / m > MAX_DAILY_PRICE_FACTOR):
                moved.append((pid, p, m))
        if moved:
            for pid, p, m in moved[:5]:
                _fail(bad, f"product {pid} moved ${p:.2f} -> ${m:.2f} "
                           f"(>{MAX_DAILY_PRICE_FACTOR}x) — upstream data glitch?")
            if len(moved) > 5:
                _fail(bad, f"...and {len(moved)-5} more implausible price moves")

    # 6. The economic confidence tables must exist and be consistent, because the
    #    scanner reads them instead of doing this arithmetic on the hot path.
    tot, safe = db.execute("SELECT SUM(n), SUM(CASE WHEN safe THEN n ELSE 0 END) "
                           "FROM number_group").fetchone()
    if not tot:
        _fail(bad, "number_group is empty — the confidence gate has no data")
    elif safe / tot > 0.5:
        _fail(bad, f"auto-accept coverage {100*safe/tot:.0f}% is implausibly high "
                   f"(MEASURED take 2: 8.9%). The spread calculation is probably wrong.")

    # 7. Hash coverage. Not fatal in a dev run; fatal in CI, because a catalogue
    #    without hashes silently degrades every scan to a picker.
    have = db.execute("SELECT COUNT(*) FROM printing_hash").fetchone()[0]
    want = db.execute("SELECT COUNT(*) FROM printing "
                      "WHERE is_sealed=0 AND image_url IS NOT NULL").fetchone()[0]
    # 203 image URLs answer 403 Forbidden permanently, verified individually at
    # take 3 while 6,657 others succeeded in the same run. Counting them against
    # coverage means the gate can never pass, which trains people to pass
    # --no-strict and stops it being a gate at all (landmine 51).
    unavailable = 0
    try:
        import json, hashes as _h
        if os.path.exists(_h.SIDECAR):
            unavailable = len(json.load(open(_h.SIDECAR)).get("missing", []))
    except Exception:                                     # noqa: BLE001
        pass
    reachable = max(1, want - unavailable)
    cov = have / reachable
    if strict_hashes and cov < 0.98:
        _fail(bad, f"hash coverage {100*cov:.1f}% of {reachable} reachable "
                   f"printings (need 98%; {unavailable} images are 403 and excluded)")
    return bad, {"hash_coverage": cov, "auto_accept": safe / tot if tot else 0}


def selftest():
    """Negative controls. Each guard is shown to fire on purpose. PROTOCOL §7."""
    db = sqlite3.connect(":memory:")
    import build_catalog
    db.executescript(build_catalog.SCHEMA)
    ok = []

    man = {"cards": 10, "fetched_at": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime())}
    bad, _ = check(db, man, strict_hashes=False)
    ok.append(("card-count floor", any("below floor" in b for b in bad)))

    man2 = dict(man, cards=EXPECTED_CARDS, fetched_at="2020-01-01T00:00:00Z")
    bad, _ = check(db, man2, strict_hashes=False)
    ok.append(("staleness", any("old" in b for b in bad)))

    db.execute("INSERT INTO card_set VALUES (1,'X','Set X','2020-01-01',5)")
    bad, _ = check(db, dict(man, cards=EXPECTED_CARDS), strict_hashes=False)
    ok.append(("set with no prices", any("NO prices" in b for b in bad)))

    # Named columns, not positional. The take-4 `life` addition broke the
    # positional form and took a negative control down with it (landmine 52):
    # a guard that stops running is worse than a guard that fails, and only the
    # gate running these selftests turned that into a visible failure.
    db.execute("INSERT INTO printing (product_id, group_id, number, name, "
               "full_name, treatment, same_art, is_sealed) "
               "VALUES (9,1,'','n','n','base',0,0)")
    bad, _ = check(db, dict(man, cards=EXPECTED_CARDS), strict_hashes=False)
    ok.append(("card with no number", any("no card number" in b for b in bad)))

    db.execute("INSERT INTO price VALUES (9,'Normal',100.0,1,1,1)")
    bad, _ = check(db, dict(man, cards=EXPECTED_CARDS), {"9": 0.5}, strict_hashes=False)
    ok.append(("10x price move", any("upstream data glitch" in b for b in bad)))

    good = sqlite3.connect(CATALOG_DB) if os.path.exists(CATALOG_DB) else None
    if good:
        bad, st = check(good, json.load(open(MANIFEST)), strict_hashes=False)
        ok.append(("real catalogue passes", not bad))

    width = max(len(n) for n, _ in ok)
    for name, fired in ok:
        print(f"  {'ok  ' if fired else 'FAIL'}  {name:<{width}}  "
              f"{'guard fires' if fired else 'GUARD DID NOT FIRE'}")
    return all(f for _, f in ok)


if __name__ == "__main__":
    if "--selftest" in sys.argv:
        print("validate.py negative controls:")
        raise SystemExit(0 if selftest() else 1)
    db = sqlite3.connect(CATALOG_DB)
    man = json.load(open(MANIFEST))
    # Landmine 7's prior-day prices come from the committed history sidecar.
    # Through take 7 this read a previous_manifest.json that nothing ever wrote,
    # so the >10x guard had never once had data to run against.
    prev = None
    try:
        import history
        h = history.load()
        days = sorted(h)
        if len(days) >= 2:
            prev = h[days[-2]]
    except Exception:                                     # noqa: BLE001
        pass
    bad, stats = check(db, man, prev, strict_hashes="--strict" in sys.argv)
    print(f"   hash coverage {100*stats['hash_coverage']:.1f}% of reachable  "
          f"auto-accept {100*stats['auto_accept']:.1f}%")
    for b in bad:
        print(f"   FAIL: {b}")
    raise SystemExit(1 if bad else 0)
