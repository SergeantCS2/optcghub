#!/usr/bin/env python3
"""The Hunt feed (A32, take 71): every source the runner can reach, fetched on
a schedule, written to www/hunt/feed.json and served by Pages beside the
catalogue. The app READS this; the Play build never scrapes a retailer itself.

    python3 tools/hunt.py --zip 48329 --radius 50       # fetch and write
    python3 tools/hunt.py --selftest                     # parsers against saved real responses, with controls

Every item is matched to a catalogue sealed product where the match is
confident; otherwise it is listed unmatched. A source that fails is recorded
as failed with the reason and the last good time stays in the feed.
"""
import argparse, json, os, re, sqlite3, sys, time
ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
sys.path.insert(0, os.path.join(ROOT, "tools"))
from hunt import target, roster, shops  # noqa: E402

OUT = os.path.join(ROOT, "www", "hunt", "feed.json")
HIST = os.path.join(ROOT, "www", "hunt", "history.json")
DB = os.path.join(ROOT, "catalog", "catalog.sqlite")
KEEP_RUNS = 24 * 14          # two weeks of hourly snapshots


def pages_base():
    """Where the last deploy lives. The runner starts from a fresh checkout every
    hour (take 73 finding), so its own previous output is fetched back from
    Pages: the feed for the rotation cursor, the history for the time series.
    Derived from UPDATE_URL, the one place the site's address is written."""
    try:
        sys.path.insert(0, os.path.join(ROOT, "tools")); import config  # noqa: E402
        u = getattr(config, "UPDATE_URL", "") or ""
        return re.sub(r"bundle/?$", "", u) if u else ""
    except Exception:                                        # noqa: BLE001
        return ""


def fetch_json(url, timeout=20):
    import urllib.request
    try:
        with urllib.request.urlopen(urllib.request.Request(url, headers={"User-Agent": "optcghub-hunt/1"}), timeout=timeout) as r:
            return json.loads(r.read().decode("utf8"))
    except Exception:                                        # noqa: BLE001
        return None


def load_previous(local_path, name):
    """The local file if a run wrote one; else the deployed copy from Pages."""
    if os.path.exists(local_path):
        try: return json.load(open(local_path))
        except Exception: pass                               # noqa: BLE001
    base = pages_base()
    return fetch_json(base + "hunt/" + name) if base else None


def snapshot(feed):
    """One run of the feed as a compact time-series row: per item the online
    status, per served zip per item the per-store quantity. ~2 KB a run."""
    t = feed["sources"]["target"]; row = {"t": feed["fetched_at"], "online": {}, "shelf": {}}
    if not t.get("ok"):
        return row
    for it in t.get("items", []):
        if it.get("online") and it.get("online_at") == feed["fetched_at"]:
            row["online"][it["tcin"]] = 1 if it["online"].get("status") == "IN_STOCK" else 0
    for z, zz in t.get("zips", {}).items():
        for tcin, at in (zz.get("checked_at") or {}).items():
            if at == feed["fetched_at"]:
                row["shelf"].setdefault(z, {})[tcin] = {sid: (v.get("qty") or 0) for sid, v in (zz.get("stock", {}).get(tcin) or {}).items()}
    return row


def append_history(prev_hist, feed):
    h = prev_hist if isinstance(prev_hist, dict) and isinstance(prev_hist.get("runs"), list) else {"runs": []}
    h["runs"].append(snapshot(feed)); h["runs"] = h["runs"][-KEEP_RUNS:]
    h["since"] = h["runs"][0]["t"]; h["stores"] = {z: zz.get("stores", []) for z, zz in feed["sources"]["target"].get("zips", {}).items()} if feed["sources"]["target"].get("ok") else h.get("stores", {})
    h["titles"] = {it["tcin"]: it["title"] for it in feed["sources"]["target"].get("items", [])} if feed["sources"]["target"].get("ok") else h.get("titles", {})
    return h

STOP = {"one", "piece", "card", "game", "bandai", "tcg", "the", "of", "-", "english", "ver", "version", "sealed", "new",
        "trading", "cards", "packs", "with", "and", "edition", "official"}
CODE = re.compile(r"^(op|eb|st|prb)\d{2,}$")


def tokens(s):
    """Set codes are normalised so 'EB-04', 'EB04' and 'eb 04' agree."""
    low = re.sub(r"\b(op|eb|st|prb)[ -]?0*(\d+)\b", lambda m: m.group(1) + m.group(2).zfill(2), (s or "").lower())
    return {t for t in re.findall(r"[a-z0-9]+", low) if t not in STOP}


def catalogue_sealed():
    """Sealed products with their SET's name and code folded into the tokens:
    the catalogue says 'Romance Dawn - Booster Pack' where a retailer says
    'One Piece Card Game Romance Dawn OP-01 Booster Pack'."""
    if not os.path.exists(DB):
        return []
    db = sqlite3.connect(DB)
    q = """SELECT p.product_id, p.name, s.name, s.abbr FROM printing p LEFT JOIN card_set s ON s.group_id = p.group_id
           WHERE p.is_sealed=1 AND p.name NOT LIKE '%DON!! Card%'"""
    return [{"id": r[0], "name": r[1], "toks": tokens(r[1]) | tokens(r[2]) | tokens(r[3])} for r in db.execute(q)]


KINDS = ("box", "pack", "deck", "case", "collection")


def match(title, sealed):
    """Best catalogue sealed product for a retailer title. Score = the share of
    the title's informative tokens found in the product's (name + set) tokens;
    the product KIND must agree; 0.7 or better matches. Wrong is worse than
    unmatched (AGENTS §4), so the bar is high and unmatched items are shown."""
    t = tokens(title)
    # Take 71 finding: most One Piece product on Target's site is the JAPANESE
    # release ("(Japanese)"), whose set names are translated differently and
    # whose prices are a different product's. The catalogue is the English
    # game (TCGplayer category 68). A Japanese item is never matched to an
    # English product; it is shown as what it is.
    if "japanese" in t:
        return None, 0.0
    t = {x for x in t if not x.isdigit()}                    # "3 packs", "18 cards" are pack-size noise
    kind = next((k for k in KINDS if k in t), None)
    code = next((x for x in t if CODE.match(x)), None)
    if not t:
        return None, 0.0
    best, score = None, 0.0
    for s in sealed:
        if kind and kind not in s["toks"]:
            continue
        if not kind and any(k in s["toks"] for k in KINDS):
            continue
        if code and code not in s["toks"]:
            continue                                         # a set code in the title is unambiguous: stay inside that set
        words = t - {code} if code else t
        sc = len(words & s["toks"]) / max(1, len(words))
        if sc > score:
            best, score = s, sc
    bar = 0.5 if code else 0.7
    return (best["id"], round(score, 2)) if best and score >= bar else (None, round(score, 2))


def from_fixtures():
    """A feed built from the saved real responses, no network: what smoke tests
    against, and what a session without Target access can look at."""
    fx = os.path.join(ROOT, "tools", "fixtures")
    stores = target.parse_stores(json.load(open(os.path.join(fx, "target_stores.json"))))
    items = target.parse_search(json.load(open(os.path.join(fx, "target_search.json"))))
    ff = target.parse_fulfillment(json.load(open(os.path.join(fx, "target_fulfillment.json"))))
    for k, it in enumerate(items):
        it["online"], it["checked"] = (ff["online"], True) if k != 1 else (None, False)   # one unchecked, the matched one checked
    now = time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime())
    for it in items:
        it["online_at"] = now if it["checked"] else None
    eng = [i["tcin"] for i in items if "japanese" not in i["title"].lower()]
    zips = {"48329": {"ok": True, "stores": stores, "stock": {t: dict(ff["stores"]) for t in eng}, "checked_at": {t: now for t in eng}},
            "48201": {"ok": False, "stores": [], "stock": {}, "checked_at": {}, "error": "budget spent before this zip's turn"}}
    return {"ok": True, "fetched_at": now, "searched_at": now, "radius": 50, "items": items, "zips": zips, "calls": 5, "cursor": {"online": 3, "local:48329": 1}, "fixture": True}


def build(zips, radius, previous=None, fixtures=False):
    feed = {"fetched_at": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime()), "zips": list(zips), "radius": radius, "sources": {}}
    sealed = catalogue_sealed()
    t = from_fixtures() if fixtures else target.fetch(zips, radius, previous=(previous or {}).get('sources', {}).get('target'))
    if t.get("ok"):
        for it in t["items"]:
            it["catalog_id"], it["match_score"] = match(it["title"], sealed)
    elif previous and previous.get("sources", {}).get("target", {}).get("ok"):
        # keep the last good fetch, but say it is old
        last = previous["sources"]["target"]; last["stale_since"] = last.get("stale_since") or feed["fetched_at"]; last["error"] = t.get("error"); last["kept"] = True
        t = last
    feed["sources"]["target"] = t
    return feed


def selftest():
    fx = os.path.join(ROOT, "tools", "fixtures")
    ok = True
    def check(name, cond, note=""):
        nonlocal ok; print(f"  {'ok  ' if cond else 'FAIL'}  {name}{('  ' + note) if note else ''}"); ok &= bool(cond)
    st = target.parse_stores(json.load(open(os.path.join(fx, "target_stores.json"))))
    check("nearby stores parse: ids, names, miles", len(st) >= 3 and all(s["id"] and s["name"] and s["miles"] >= 0 for s in st), f"{len(st)} stores, first {st[0]['name']} {st[0]['miles']} mi")
    se = target.parse_search(json.load(open(os.path.join(fx, "target_search.json"))))
    check("search parse: tcin, title, price", len(se) >= 3 and all(x["tcin"] and x["title"] and x["price"] for x in se), f"{len(se)} items, first ${se[0]['price']}")
    ff = target.parse_fulfillment(json.load(open(os.path.join(fx, "target_fulfillment.json"))))
    check("fulfillment parse: online status and a per-store quantity", ff["online"]["status"] and len(ff["stores"]) >= 1 and all("qty" in v for v in ff["stores"].values()), json.dumps(ff)[:100])
    sealed = catalogue_sealed()
    if sealed:
        mid, sc = match("One Piece Trading Card Game: The Three Brothers Ultra Deck", sealed)
        check("a retailer title matches a catalogue sealed product when it should", mid is not None and sc >= 0.7, f"score {sc}")
        mid3, sc3 = match("Bandai One Piece Card Game Romance Dawn OP-01 Booster Box - 24 Packs", sealed)
        check("a set code in the title pins the match inside that set", mid3 is not None, f"score {sc3}")
        mid2, sc2 = match("Bandai One Piece Card Game Protective Sleeves - Official", sealed)
        check("control: sleeves match nothing (no box/pack/deck kind, low overlap)", mid2 is None, f"score {sc2}")
        mid4, sc4 = match("Bandai One Piece Card Game The Best Vol.2 (PRB-02) Booster Box (Japanese) - 10 Packs", sealed)
        check("control: a JAPANESE release is never matched to the English catalogue", mid4 is None, "different product, different price")
    else:
        print("  skip  no catalogue here; match checks run where catalog.sqlite exists")
    ev = json.load(open(os.path.join(fx, "events_us.json")))["events"]
    ok &= roster.selftest(ev, roster.zcta())
    ok &= shops.selftest(json.load(open(os.path.join(fx, "shopify_products.json"))))
    # controls: a changed shape is a failure, not a quiet empty
    for name, fn, bad in (("stores", target.parse_stores, {"data": {}}), ("search", target.parse_search, {"data": {"search": {}}}), ("fulfillment", target.parse_fulfillment, {"data": {"product": {}}})):
        try:
            fn(bad); check(f"control: a changed {name} shape is refused", False)
        except (KeyError, TypeError):
            check(f"control: a changed {name} shape is refused", True)
    return ok


if __name__ == "__main__":
    ap = argparse.ArgumentParser(); ap.add_argument("--zips", default="48329", help="comma-separated served zips for the local layer"); ap.add_argument("--radius", type=int, default=50)
    ap.add_argument("--out", default=OUT); ap.add_argument("--selftest", action="store_true"); ap.add_argument("--from-fixtures", action="store_true")
    a = ap.parse_args()
    if a.selftest:
        print("hunt.py parsers against saved real responses:"); raise SystemExit(0 if selftest() else 1)
    prev = None if a.from_fixtures else load_previous(a.out, "feed.json")
    if prev:
        print(f"   previous feed: {prev.get('fetched_at')} (cursor {prev.get('sources', {}).get('target', {}).get('cursor')})")
    feed = build([z.strip() for z in a.zips.split(",") if z.strip()], a.radius, prev, fixtures=a.from_fixtures)
    os.makedirs(os.path.dirname(a.out), exist_ok=True)
    json.dump(feed, open(a.out, "w"), separators=(",", ":"))
    # the store roster: rebuilt when the last one is a day old, else carried over (take 74)
    stores_path = os.path.join(os.path.dirname(a.out), os.path.basename(a.out).replace("feed", "stores"))
    prev_st = None if a.from_fixtures else load_previous(stores_path, "stores.json")
    age_ok = prev_st and prev_st.get("fetched_at") and (time.time() - time.mktime(time.strptime(prev_st["fetched_at"], "%Y-%m-%dT%H:%M:%SZ"))) < 24 * 3600
    try:
        if a.from_fixtures:
            ev = json.load(open(os.path.join(ROOT, "tools", "fixtures", "events_us.json")))["events"]
            st = roster.build(ev, roster.zcta(), now="2026-09-01")
        elif age_ok:
            st = prev_st
            prev_ev = load_previous(stores_path.replace("stores", "events"), "events.json")
            if prev_ev and prev_ev.get("rows") is not None:
                st["events"] = {k: prev_ev[k] for k in ("window_days", "titles", "rows", "url") if k in prev_ev}
        else:
            st = roster.build(roster.fetch_events(), roster.zcta())
        ev_tab = st.pop("events", None) if isinstance(st, dict) else None
        json.dump(st, open(stores_path, "w"), separators=(",", ":"))
        if ev_tab:
            ev_path = stores_path.replace("stores", "events")
            json.dump({"fetched_at": st["fetched_at"], "stores_fetched_at": st["fetched_at"], **ev_tab}, open(ev_path, "w"), separators=(",", ":"))
            print(f"   events: {len(ev_tab['rows'])} in the next {ev_tab['window_days']} days, {os.path.getsize(ev_path) // 1024} KB")
        print(f"   stores: {len(st['stores'])} with events on file ({'carried over' if age_ok and not a.from_fixtures else 'rebuilt'}), {os.path.getsize(stores_path) // 1024} KB")
    except Exception as e:                                   # noqa: BLE001
        print(f"   stores: FAILED {type(e).__name__}: {str(e)[:100]}" + (" (kept the last roster)" if prev_st else ""))
        if prev_st:
            json.dump(prev_st, open(stores_path, "w"), separators=(",", ":"))
    # local shops' online stock (take 75): every verified Shopify storefront, hourly
    shops_path = os.path.join(os.path.dirname(a.out), os.path.basename(a.out).replace("feed", "shops"))
    sealed_cat = catalogue_sealed(); shop_out = {"fetched_at": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime()), "shops": []}
    for st in shops.load_list():
        if st.get("platform") != "shopify":
            continue
        if a.from_fixtures:
            r = {"ok": True, "items": shops.parse_products(json.load(open(os.path.join(ROOT, "tools", "fixtures", "shopify_products.json"))), st["url"]), "pages": 1}
        else:
            r = shops.fetch_store(st["url"])
        for it in r.get("items", []):
            if it["kind"] == "sealed":
                it["catalog_id"], it["match_score"] = match(it["title"], sealed_cat)
        shop_out["shops"].append({"name": st["name"], "zip": st.get("zip"), "url": st["url"], "ok": r.get("ok", False), "error": r.get("error"),
                                  "sealed": [i for i in r.get("items", []) if i["kind"] == "sealed"], "singles": sum(1 for i in r.get("items", []) if i["kind"] == "single"), "pages": r.get("pages", 0)})
    json.dump(shop_out, open(shops_path, "w"), separators=(",", ":"))
    for sh in shop_out["shops"]:
        print(f"   shop {sh['name']}: " + (f"{len(sh['sealed'])} sealed ({sum(1 for i in sh['sealed'] if i['available'])} in stock, {sum(1 for i in sh['sealed'] if i.get('catalog_id'))} matched), {sh['singles']} singles, {sh['pages']} pages" if sh["ok"] else f"FAILED {sh['error']}"))
    hist_path = os.path.join(os.path.dirname(a.out), os.path.basename(a.out).replace("feed", "history"))   # feed.json -> history.json; a fixture feed keeps its fixture suffix
    hist = append_history(None if a.from_fixtures else load_previous(hist_path, "history.json"), feed)
    json.dump(hist, open(hist_path, "w"), separators=(",", ":"))
    print(f"   history: {len(hist['runs'])} run(s) on file since {hist.get('since')}, {os.path.getsize(hist_path) // 1024} KB")
    t = feed["sources"]["target"]
    if t.get("kept"):
        print(f"   target: this fetch FAILED ({t.get('error')}); kept the last good fetch from {t.get('fetched_at')} (stale since {t.get('stale_since')})")
    elif t.get("ok"):
        matched = sum(1 for i in t["items"] if i.get("catalog_id")); ja = sum(1 for i in t["items"] if "japanese" in i["title"].lower())
        online = sum(1 for i in t["items"] if (i.get("online") or {}).get("status") == "IN_STOCK"); checked = sum(1 for i in t["items"] if i.get("checked"))
        print(f"   target national: {len(t['items'])} items ({ja} Japanese), {matched} matched, online stock known for {checked}, {online} in stock to ship; {t.get('calls')} calls" + (f", THROTTLED after {t['throttled_after']}" if t.get("throttled_after") is not None else ""))
        for z, zz in t.get("zips", {}).items():
            shelf = sum(1 for tc, st in zz.get("stock", {}).items() if any((v.get("qty") or 0) > 0 for v in st.values()))
            print(f"   target {z}: " + (f"{len(zz['stores'])} stores within {a.radius} mi, {len(zz.get('checked_at', {}))} items with a shelf check on file, {shelf} on a shelf" if zz.get("ok") else f"FAILED {zz.get('error')}"))
        print(f"   cursor: {t.get('cursor')} (the next run continues from here)")
    else:
        print(f"   target: FAILED {t.get('error')}" + (" (kept the last good fetch)" if t.get("stale_since") else ""))
    print(f"   feed: {os.path.relpath(a.out, ROOT)} {os.path.getsize(a.out) // 1024} KB")
