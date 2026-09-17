"""The store roster (A32, take 74): every store that runs One Piece Card Game
events, from the static JSON onepieceevents.com publishes (derived from Bandai
TCG+, where stores must register to run events). Keyless, PROVEN take 74:
12,334 US events, ~50 Michigan stores.

Distances need a point per zip: the US Census ZCTA gazetteer (public domain),
compacted to two decimals (~1 km) and cached as a sidecar. The roster ships
with each store's centroid so the app computes miles from the collector's zip.
"""
import json, os, re, time, urllib.request, zipfile, io, collections

ROOT = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
EVENTS_URL = "https://onepieceevents.com/data/evnt_us.json"
GAZ_URL = "https://www2.census.gov/geo/docs/maps-data/data/gazetteer/2024_Gazetteer/2024_Gaz_zcta_national.zip"
ZCTA = os.path.join(ROOT, "catalog", "zcta.json")
UA = "optcghub-hunt/1 (+https://sergeantcs2.github.io/optcghub/)"


def zcta():
    """zip -> [lat, lon]. Fetched once, kept in the tree (the seed carries it)."""
    if os.path.exists(ZCTA):
        return json.load(open(ZCTA))
    req = urllib.request.Request(GAZ_URL, headers={"User-Agent": UA})
    with urllib.request.urlopen(req, timeout=90) as r:
        z = zipfile.ZipFile(io.BytesIO(r.read()))
    lines = z.read(z.namelist()[0]).decode("utf8", "replace").splitlines()[1:]
    tab = {}
    for row in lines:
        c = row.split("\t")
        if len(c) >= 3 and c[0].strip():
            tab[c[0].strip()] = [round(float(c[-2]), 2), round(float(c[-1]), 2)]
    json.dump(tab, open(ZCTA, "w"), separators=(",", ":"))
    return tab


def prefix_centroids(tab):
    """3-digit prefix -> mean centroid: the small table the app ships to place
    a collector's zip without the 758 KB full one (about ten miles of error)."""
    acc = collections.defaultdict(lambda: [0.0, 0.0, 0])
    for z, (la, lo) in tab.items():
        a = acc[z[:3]]; a[0] += la; a[1] += lo; a[2] += 1
    return {k: [round(v[0] / v[2], 2), round(v[1] / v[2], 2)] for k, v in acc.items()}


def fetch_events():
    req = urllib.request.Request(EVENTS_URL, headers={"User-Agent": UA})
    with urllib.request.urlopen(req, timeout=120) as r:
        return json.loads(r.read().decode("utf8"))["events"]


def build(events, tab, now=None, days=31):
    """Stores with their location and next two events; and a compact table of
    EVERY event in the next month -- [store index, date, title index, TCG+ id,
    fee, capacity] -- for the Events screen (take 76). Titles are interned:
    eleven thousand events use a few dozen strings."""
    now = now or time.strftime("%Y-%m-%d")
    end = (time.strftime("%Y-%m-%d", time.gmtime(time.mktime(time.strptime(now, "%Y-%m-%d")) + days * 86400)))
    stores = {}; rows = []; titles = []; tidx = {}
    for e in events:
        s = e.get("store") or {}
        if not s.get("name") or (s.get("country_code") and s["country_code"] != "US"):
            continue
        z = str(s.get("postcode") or "")[:5]
        key = (s["name"].strip().lower(), z)
        st = stores.setdefault(key, {"name": s["name"].strip(), "addr": (s.get("address") or "").strip(), "city": (s.get("city") or "").strip(),
                                     "state": (s.get("pref_code") or "").replace("US-", ""), "zip": z, "ll": tab.get(z), "events": []})
        raw = e.get("raw") or {}
        if isinstance(raw, dict):
            ph = str(raw.get("phone_number") or "").strip()
            if ph and not st.get("phone"):
                st["phone"] = ph[:24]
            geo = raw.get("event_place_geo") or raw.get("place_geo")
            try:
                if geo and not st.get("exact"):
                    # the source spells the point {x: lat, y: lng} (MEASURED take 87: x 42.03, y -97.42 for a Nebraska store)
                    la, lo = (float(geo.get("x", geo.get("lat"))), float(geo.get("y", geo.get("lng")))) if isinstance(geo, dict) else (float(geo[0]), float(geo[1]))
                    if -90 <= la <= 90 and -180 <= lo <= 180 and (la or lo):
                        st["ll"] = [round(la, 4), round(lo, 4)]; st["exact"] = True
            except Exception:                                # noqa: BLE001 -- a malformed point keeps the zip centroid
                pass
        d = str(e.get("start_date") or "")[:10]
        if d >= now:
            title = (e.get("title") or "")[:60]
            kind = "release" if re.search(r"release|pre-?release|launch", title, re.I) else "event"
            st["events"].append({"d": d, "t": title, "k": kind})
            if d <= end:
                if title not in tidx:
                    tidx[title] = len(titles); titles.append(title)
                m = re.search(r"/event/(\d+)", e.get("url") or "")
                try: fee = float(e.get("fee") or 0)
                except Exception: fee = 0.0                      # noqa: BLE001
                try: cap = int(e.get("capacity") or 0)
                except Exception: cap = 0                        # noqa: BLE001
                st.setdefault("_rows", []).append([d, tidx[title], int(m.group(1)) if m else 0, fee, cap, kind == "release"])
    out = []
    for st in stores.values():
        st["events"] = sorted(st["events"], key=lambda x: x["d"])[:2]
        pend = st.pop("_rows", [])
        idx = len(out); out.append(st)
        for r in pend:
            rows.append([idx] + r)
    # stores are appended in insertion order so row indexes hold; sort rows by date
    rows.sort(key=lambda r: r[1])
    return {"fetched_at": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime()), "source": "onepieceevents.com (from Bandai TCG+)", "stores": out,
            "events": {"window_days": days, "titles": titles, "rows": rows, "url": "https://www.bandai-tcg-plus.com/event/"}}


def selftest(sample_events, tab):
    ok = True
    def check(name, cond, note=""):
        nonlocal ok; print(f"  {'ok  ' if cond else 'FAIL'}  {name}{('  ' + note) if note else ''}"); ok &= bool(cond)
    r = build(sample_events, tab, now="2026-09-01")
    mi = [s for s in r["stores"] if s["state"] == "MI"]
    check("stores are deduplicated by name and zip, with address, city, state", len(r["stores"]) >= 2 and all(s["name"] and s["city"] and s["state"] for s in r["stores"]))
    check("a Michigan store gets a centroid from its zip", any(s["ll"] for s in mi), str(mi[0]["ll"] if mi else None))
    check("a store carries its phone and an exact point when the event record has them (take 87)", any(s.get("phone") for s in r["stores"]) and any(s.get("exact") for s in r["stores"]), f"{sum(1 for s in r['stores'] if s.get('phone'))} phones, {sum(1 for s in r['stores'] if s.get('exact'))} exact")
    check("a store's upcoming events are kept, sorted, past ones dropped", all(all(e["d"] >= "2026-09-01" for e in s["events"]) for s in r["stores"]) and any(s["events"] for s in r["stores"]))
    r_all = build(sample_events, tab, now="2020-01-01")       # every event counts as upcoming, so the release ones are visible
    check("a release event is flagged as one", any(e["k"] == "release" for s in r_all["stores"] for e in s["events"]))
    ev = r["events"]                                          # the month from 2026-09-01: the fixture's real events fall in it
    check("the events table is compact rows with a store index, date, interned title, TCG+ id, fee and capacity, sorted by date",
          ev["rows"] and all(len(x) == 7 and 0 <= x[0] < len(r["stores"]) and 0 <= x[2] < len(ev["titles"]) for x in ev["rows"]) and ev["rows"] == sorted(ev["rows"], key=lambda x: x[1]), f"{len(ev['rows'])} rows, {len(ev['titles'])} titles")
    check("an event's TCG+ id rebuilds its registration link", any(x[3] > 0 for x in ev["rows"]) and ev["url"].endswith("/event/"))
    check("control: with today after every event, no store has an upcoming one", not any(s["events"] for s in build(sample_events, tab, now="2099-01-01")["stores"]))
    check("control: a non-US store is left out", not any(s["name"] == "Not Here" for s in r["stores"]))
    return ok
