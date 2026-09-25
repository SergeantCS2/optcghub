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
from hunt import target, roster, shops, gts, southern  # noqa: E402   (landmine 133: this is the package tools/hunt/, not this file)

OUT = os.path.join(ROOT, "www", "hunt", "feed.json")
HIST = os.path.join(ROOT, "www", "hunt", "history.json")
DB = os.path.join(ROOT, "catalog", "catalog.sqlite")
KEEP_RUNS = 24 * 14          # rows, not days: a fortnight at one run an hour, about 55 days at the measured ~4 h cadence (take 114)


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
    """The json, or None however it failed (take 115: the one request is fetch_json_why's)."""
    return fetch_json_why(url, timeout)[0]


def fetch_json_why(url, timeout=20):
    """Take 114: (json, None); (None, 404) when the host says there is no such file; (None, "<Type>: <msg>")
    otherwise -- fetch_json's None cannot tell a history that is not there from one that could not be read."""
    import urllib.request, urllib.error
    try:
        with urllib.request.urlopen(urllib.request.Request(url, headers={"User-Agent": "optcghub-hunt/1"}), timeout=timeout) as r:
            return json.loads(r.read().decode("utf8")), None
    except urllib.error.HTTPError as e:
        if e.code == 404:
            return None, 404
        return None, f"{type(e).__name__}: {str(e)[:80]}"
    except Exception as e:                                   # noqa: BLE001
        return None, f"{type(e).__name__}: {str(e)[:80]}"


FETCH_TRIES, FETCH_PAUSE_S = 3, 10   # take 114: a read of our own site -- the hourly's history, the nightly's carry-over


def fetch_tries(url, fetch, tries=FETCH_TRIES, pause=FETCH_PAUSE_S, sleep=time.sleep):
    """Take 115: the one retry loop read_history and carry_over share -- `tries` attempts, `pause` seconds
    apart; the first read or a 404 ends it. (json, None) | (None, 404) | (None, the last try's why)."""
    j, why = None, None
    for k in range(tries):
        j, why = fetch(url)
        if j is not None or why == 404:
            break
        if k < tries - 1:
            sleep(pause)
    return j, why


def is_history(h):
    return isinstance(h, dict) and isinstance(h.get("runs"), list)


def read_history(local_path, base=None, fetch=None, tries=FETCH_TRIES, pause=FETCH_PAUSE_S, sleep=time.sleep):
    """Take 114: the history this run appends to, and how it was had -- (history, "local" | "pages"); (None,
    "none") when Pages answers 404 (there is none: a new one starts); (None, "unread: <why>") when it could not be
    read in `tries` attempts, `pause` seconds apart, or is not a history. Read at its plain address: Pages' CDN
    keeps a copy up to ten minutes and ignores a query string, so a ?v= reads that same copy (MEASURED 24 Sept:
    random ?v= values, every one a HIT with one rising age); a deploy clears it (MEASURED: a deploy done
    22:23:55Z, the read at 22:24:06Z a MISS with the new file), so the file read is the last deploy's (INFERRED
    from that one deploy). Until this take a failed read started a one-row history and the deploy replaced the
    whole record with it (the reset: INFERRED, never seen -- 48 workflow runs, 48 rows)."""
    if os.path.exists(local_path):
        try:
            h = json.load(open(local_path))
        except Exception as e:                               # noqa: BLE001
            return None, f"unread: the local {os.path.basename(local_path)} is not JSON ({type(e).__name__})"
        return (h, "local") if is_history(h) else (None, f"unread: the local {os.path.basename(local_path)} is not a history (no runs list)")
    base = pages_base() if base is None else base
    if not base:
        return None, "none: no site address (UPDATE_URL) to read it from"
    h, why = fetch_tries(base + "hunt/history.json", fetch or fetch_json_why, tries, pause, sleep)
    if h is not None:
        return (h, "pages") if is_history(h) else (None, "unread: the deployed history is not a history (no runs list)")
    if why == 404:
        return None, "none"
    return None, f"unread: {why} ({tries} tries)"


def history_first(hist_path, from_fixtures=False, read=None, out=print):
    """Take 114: read the history BEFORE any source is fetched. Unreadable, the run stops here and writes
    nothing, so the workflow deploys nothing and the history on Pages stays whole -- one run's feed is lost (the
    app says how old a feed is), never the record. Landmine 130: a failure keeps what the success path replaces."""
    if from_fixtures:
        return None
    h, how = (read or read_history)(hist_path)
    if how.startswith("unread"):
        out(f"::error::history: {how} -- this run stops before any fetch and writes nothing, so nothing deploys and the history on Pages stays whole; the next run reads it again")
        raise SystemExit(3)
    if how == "none":
        out("   history: none on Pages (404) -- a new history starts with this run")
    elif how.startswith("none"):
        out(f"   history: {how} -- a new history starts with this run")
    return h


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
    g = feed["sources"].get("gts") or {}
    if g.get("ok") and not g.get("kept"):                    # take 94: each SKU's state, so a flip is dated from now on
        row["gts"] = {it["sku"]: it["status"] for it in g.get("items", [])}
    so = feed["sources"].get("southern") or {}
    if so.get("ok") and not so.get("kept"):                  # take 112: each item's state from its dates -- the timeline's input
        row["southern"] = {it["id"]: it["state"] for it in so.get("items", [])}
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


def gts_due(items, fetched_at):
    """Take 114 review: the app's gtsDue, the same rule -- by the dates over every item, never by the state (a
    product sold out before release has no 'coming' or 'preorder' state, and was counted in neither). The day is
    the GTS fetch's own, in UTC. Returns (with an order due date ahead, unreleased without one)."""
    day = (fetched_at or "")[:10]
    un = [i for i in items if i.get("release") and i["release"] > day]
    ahead = sum(1 for i in un if i.get("preorder") and i["preorder"] >= day)
    return ahead, len(un) - ahead


def keeps_past(before_runs, hist):
    """Take 114, the output guard: the rows written are the rows loaded plus this run's, cut at KEEP_RUNS. Returns
    the problems -- any, and the run writes no history, so a reset path the read-first guard misses is refused too."""
    new = hist.get("runs") if isinstance(hist, dict) else None
    if not isinstance(new, list):
        return ["the history to write has no runs list"]
    want = min(len(before_runs) + 1, KEEP_RUNS)
    if len(new) != want:
        return [f"{len(before_runs)} rows loaded, {len(new)} to write, not {want}"]
    if new[:-1] != before_runs[len(before_runs) - (len(new) - 1):]:
        return [f"the {len(new) - 1} rows kept are not the last {len(new) - 1} loaded"]
    return []

STOP = {"one", "piece", "card", "game", "bandai", "tcg", "the", "of", "-", "english", "ver", "version", "sealed", "new",
        "trading", "cards", "packs", "with", "and", "edition", "official"}
CODE = re.compile(r"^(op|eb|st|prb|peb|dp|ib)\d{2,}$")


def tokens(s):
    """Set codes are normalised so 'EB-04', 'EB04' and 'eb 04' agree. Take 94,
    from the distributor's names: DP, IB and PEB numbers are codes too (a code
    pins the set, so DP-14 with no catalogue product matches nothing rather
    than Vol. 13 at 0.8 -- rule 4); 'Double Pack Set Vol. 11' and
    'Illustration Box Vol. 7' carry their code even when the name does not
    say DP-11 or IB-07; and 'Vol. 7' is one token, so Vol. 7 and Vol. 8
    differ by a whole word instead of by a digit the scorer ignores."""
    low = re.sub(r"\b(op|eb|st|prb|peb|dp|ib)[ -]?0*(\d+)\b", lambda m: m.group(1) + m.group(2).zfill(2), (s or "").lower())
    low = re.sub(r"\bdouble pack set vol(?:ume)?\.?\s*0*(\d+)\b", lambda m: m.group(0) + " dp" + m.group(1).zfill(2), low)
    low = re.sub(r"\billustration box vol(?:ume)?\.?\s*0*(\d+)\b", lambda m: m.group(0) + " ib" + m.group(1).zfill(2), low)
    low = re.sub(r"\bvol(?:ume)?\.?\s*0*(\d+)\b", lambda m: "vol" + m.group(1), low)
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
        # Landmine 134: 'Booster Box' and 'Booster Box Case' both score 1.0 for
        # every booster-box title. A tie breaks toward the product with fewer
        # words of its own -- the closer name -- never toward row order.
        if sc > score or (sc == score and best is not None and len(s["toks"]) < len(best["toks"])):
            best, score = s, sc
    bar = 0.5 if code else 0.7
    return (best["id"], round(score, 2)) if best and score >= bar else (None, round(score, 2))


def southern_match(name, codes, sold_as, sealed):
    """Take 112: a Southern Hobby name through its own normaliser -- or no match
    while the unit it is sold as is unread and the name cannot say it. The unit
    is part of the identity: a CASE matches only a catalogue case, and anything
    else never matches one (the live pages sell IB-09 and IB-10 as cases, and
    the tie-break of landmine 134 took the single box for a case)."""
    if southern.unit_unknown(name, sold_as):
        return None, 0.0
    case = (sold_as or "").upper() == "CASE"
    return match(southern.retail_title(name, codes, sold_as), [s for s in sealed if ("case" in s["toks"]) == case])


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
    # take 94: the distributor. Matched through the retail name (the site names
    # case packs); a failed fetch keeps the last good one and says since when.
    g = gts.from_fixture(os.path.join(ROOT, "tools", "fixtures", "gts_listing.html")) if fixtures else gts.fetch()
    if g.get("ok"):
        for it in g["items"]:
            it["catalog_id"], it["match_score"] = match(gts.retail_title(it["name"]), sealed)
    elif previous and previous.get("sources", {}).get("gts", {}).get("ok"):
        last = previous["sources"]["gts"]; last["stale_since"] = last.get("stale_since") or feed["fetched_at"]; last["error"] = g.get("error"); last["kept"] = True
        g = last
    feed["sources"]["gts"] = g
    # take 112: the second distributor. The unit a product page says it is sold
    # as decides the match (a Display, a Box); a failed fetch keeps the last good
    # one and says since when; a page read rides forward from the previous feed.
    fx = os.path.join(ROOT, "tools", "fixtures")
    prev_s = (previous or {}).get("sources", {}).get("southern")
    so = southern.from_fixture(os.path.join(fx, "southern_listing.html"), fx) if fixtures else southern.fetch(previous=prev_s)
    if so.get("ok"):
        for it in so["items"]:
            it["catalog_id"], it["match_score"] = southern_match(it["name"], it.get("codes"), (it.get("page") or {}).get("sold_as"), sealed)
    elif prev_s and prev_s.get("ok"):
        last = prev_s; last["stale_since"] = last.get("stale_since") or feed["fetched_at"]; last["error"] = so.get("error"); last["kept"] = True
        so = last
    feed["sources"]["southern"] = so
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
        # take 94: the match names its product, and a control names the one it must not pick (landmine 134)
        name = lambda mid: next((s["name"] for s in sealed if s["id"] == mid), None)   # noqa: E731
        check("a booster-box title matches the Booster Box, not the Booster Box Case (landmine 134)", name(mid3) == "Romance Dawn - Booster Box", str(name(mid3)))
        g1 = match(gts.retail_title("ONE PIECE TCG: TIME OF BATTLE BOOSTER (OP-16) (24CT)"), sealed)
        check("the distributor's 24-count booster matches the set's Booster Box", name(g1[0]) == "The Time of Battle Booster Box", str(name(g1[0])))
        g2 = match(gts.retail_title("ONE PIECE TCG: (TITLE TBA) STARTER DECKS DISPLAY (ST-36) (6CT)"), sealed)
        check("the distributor's 6-count starter deck display matches the Display, not the single deck", (name(g2[0]) or "").startswith("Starter Deck 36") and (name(g2[0]) or "").endswith("Display"), str(name(g2[0])))
        g3 = match(gts.retail_title("ONE PIECE TCG DOUBLE PACK SET VOLUME 11 (DP-11) (8CT)"), sealed)
        check("DP-11 matches Double Pack Set Vol. 11 Display", name(g3[0]) == "Double Pack Set Vol. 11 Display", str(name(g3[0])))
        g4 = match(gts.retail_title("ONE PIECE TCG: ILLUSTRATION BOX VOLUME 7 (IB-07)"), sealed)
        check("IB-07 matches Illustration Box Vol. 7 -- not Vol. 8, not the case", name(g4[0]) == "One Piece Card Game Illustration Box Vol. 7", str(name(g4[0])))
        g5 = match(gts.retail_title("ONE PIECE TCG: EXTRA BOOSTER (EB-05) (24CT)"), sealed)
        check("EB-05 matches its Booster Box", name(g5[0]) == "Extra Booster: One Piece Heroines Edition Vol.2 - Booster Box", str(name(g5[0])))
        for title in ("ONE PIECE TCG: (TITLE TBA) BOOSTER (OP-99) (24CT)", "ONE PIECE TCG DOUBLE PACK SET VOLUME 99 (DP-99) (8CT)", "ONE PIECE TCG: PREMIUM EXTRA BOOSTER (PEB99) (12CT)", "ONE PIECE TCG: ILLUSTRATION BOX VOLUME 99 (IB-99)"):
            mm = match(gts.retail_title(title), sealed)
            check(f"control: a code the catalogue has no set for matches nothing ({title.split('(')[1].rstrip(') ')})", mm[0] is None, f"score {mm[1]} -> {name(mm[0])}")
        g6 = match(gts.retail_title("ONE PIECE TCG: GIFT COLLECTION: NOBODY"), sealed)
        check("control: a collection the catalogue lacks is not matched to an older namesake", g6[0] is None, f"score {g6[1]} -> {name(g6[0])}")
        g7 = match(gts.retail_title("ONE PIECE TCG: OFFICIAL SLEEVE DISPLAY ASSORTMENT 13 (12CT)"), sealed)
        check("control: a sleeve display (no box, pack or deck) is not matched to a box, pack or deck", g7[0] is None or not any(k in (name(g7[0]) or "").lower() for k in ("box", "pack", "deck")), str(name(g7[0])))
    else:
        print("  skip  no catalogue here; match checks run where catalog.sqlite exists")
    ok &= gts.selftest(open(os.path.join(fx, "gts_listing.html"), encoding="utf8").read())
    ok &= southern.selftest(open(os.path.join(fx, "southern_listing.html"), encoding="utf8").read(),
                            {k: open(os.path.join(fx, v), encoding="utf8").read() for k, v in southern.FIXTURE_PAGES.items()})
    if sealed:
        # take 112: Southern Hobby's names, through its own normaliser; the unit it is sold as picks Display from single
        sm = lambda n, codes, sold: name(southern_match(n, codes, sold, sealed)[0])   # noqa: E731
        check("Southern Hobby's DP-13, sold as a Display, matches the Display", sm("Bandai - One Piece Card Game: DP-13 Double Pack Set 13", ["DP13"], "DISPLAY") == "Double Pack Set Vol. 13 Display",
              str(sm("Bandai - One Piece Card Game: DP-13 Double Pack Set 13", ["DP13"], "DISPLAY")))
        check("...and with the unit not read yet, nothing: the name alone cannot tell the single set from the display (rule 4)", sm("Bandai - One Piece Card Game: DP-13 Double Pack Set 13", ["DP13"], None) is None,
              str(sm("Bandai - One Piece Card Game: DP-13 Double Pack Set 13", ["DP13"], None)))
        check("...control: a name that carries its count is a display without the page", southern.retail_title("Bandai - One Piece Card Game: ST-37 Starter Deck 37 6CT", ["ST37"]) == "ST37 STARTER DECK 37 DISPLAY"
              and not southern.unit_unknown("Bandai - One Piece Card Game: ST-37 Starter Deck 37 6CT") and southern.unit_unknown("Bandai - One Piece Card Game: DP-13 Double Pack Set 13"))
        check("Southern Hobby's OP-18 box, EB-05 pack and SD-01 match their catalogue products",
              sm("Bandai - One Piece Card Game: OP-18 Booster Box", ["OP18"], "BOX") == "The Dominance of God Booster Box"
              and sm("Bandai - One Piece Card Game: EB-05 Extra Booster Pack 05", ["EB05"], "EACH") == "Extra Booster: One Piece Heroines Edition Vol.2 - Booster Pack"
              and sm("Bandai - One Piece Card Game: SD-01 Set Sail Deck Set", ["SD01"], "EACH") == "Set Sail Deck Set")
        check("control: the Heroines Gift Collection the catalogue lacks is not matched to Gift Collection 2023", sm("Bandai - One Piece Card Game: Heroines Gift Collection 6CT", [], "DISPLAY") is None,
              str(sm("Bandai - One Piece Card Game: Heroines Gift Collection 6CT", [], "DISPLAY")))
        # the unit is the identity: a case to a case, never to the one box
        ib8 = "Bandai - One Piece Card Game: IB-08 Illustration Box 08"
        check("a product Southern Hobby sells as a CASE matches the catalogue's case, never the single box (IB-08, an OP-12 box case, an ST-19 display case)",
              sm(ib8, ["IB08"], "CASE") == "One Piece Card Game Illustration Box Vol. 8 Case" and sm("Bandai - One Piece Card Game: OP-12 Booster Box", ["OP12"], "CASE") == "Legacy of the Master Booster Box Case"
              and sm("Bandai - One Piece Card Game: ST-19 Starter Deck 19", ["ST19"], "CASE") == "Starter Deck 19: BLACK Smoker Display Case",
              str([sm(ib8, ["IB08"], "CASE"), sm("Bandai - One Piece Card Game: OP-12 Booster Box", ["OP12"], "CASE"), sm("Bandai - One Piece Card Game: ST-19 Starter Deck 19", ["ST19"], "CASE")]))
        check("...control: with no case in the catalogue a case matches nothing -- IB-04 (the single box is there)", sm("Bandai - One Piece Card Game: IB-04 Illustration Box 04", ["IB04"], "CASE") is None,
              str(sm("Bandai - One Piece Card Game: IB-04 Illustration Box 04", ["IB04"], "CASE")))
        check("...control: a box or a display never matches the case beside it", sm(ib8, ["IB08"], "BOX") == "One Piece Card Game Illustration Box Vol. 8"
              and sm("Bandai - One Piece Card Game: ST-19 Starter Deck 19", ["ST19"], "DISPLAY") == "Starter Deck 19: BLACK Smoker Display", str([sm(ib8, ["IB08"], "BOX"), sm("Bandai - One Piece Card Game: ST-19 Starter Deck 19", ["ST19"], "DISPLAY")]))
        # take 115: the unit unread -- an illustration box may be the case (IB-09, IB-10), and a name that says Case is matched as a case only by its page
        unread = {"IB-08": sm(ib8, ["IB08"], None), "IB-08 ... Case": sm(ib8 + " Case", ["IB08"], None), "OP-12 Booster Box Case": sm("Bandai - One Piece Card Game: OP-12 Booster Box Case", ["OP12"], None)}
        check("with its unit unread an illustration box matches nothing, nor does a name that says Case -- each took the single box at take 114 (rule 4, landmine 167)",
              all(v is None for v in unread.values()), json.dumps(unread))
        check("...control: an unread booster box, pack or deck set whose name says its unit still matches (the fixture's OP-18 box and SD-01 set)",
              sm("Bandai - One Piece Card Game: OP-18 Booster Box", ["OP18"], None) == "The Dominance of God Booster Box" and sm("Bandai - One Piece Card Game: SD-01 Set Sail Deck Set", ["SD01"], None) == "Set Sail Deck Set"
              and sm("Bandai - One Piece Card Game: EB-05 Extra Booster Pack 05", ["EB05"], None) == "Extra Booster: One Piece Heroines Edition Vol.2 - Booster Pack",
              str([sm("Bandai - One Piece Card Game: OP-18 Booster Box", ["OP18"], None), sm("Bandai - One Piece Card Game: SD-01 Set Sail Deck Set", ["SD01"], None)]))
    ev = json.load(open(os.path.join(fx, "events_us.json")))["events"]
    ok &= roster.selftest(ev, roster.zcta())
    # take 92, landmine 130: a failed rebuild keeps the roster AND the events table
    import tempfile
    with tempfile.TemporaryDirectory() as td:
        sp = os.path.join(td, "stores.json")
        old_st = {"fetched_at": "2026-09-01T00:00:00Z", "source": "x", "stores": [{"name": "A"}]}
        old_ev = {"fetched_at": "2026-09-01T00:00:00Z", "window_days": 31, "titles": ["t"], "rows": [[0, "2026-09-02", 0, 1, "0", 8]], "url": "u"}
        def boom(): raise ValueError("the source changed shape")
        r = roster_step(sp, fetch=boom, load=lambda p, n: old_st if n == "stores.json" else old_ev, out=lambda *_: None)
        check("a failed rebuild keeps the roster and the events table", r["how"] == "failed" and os.path.exists(sp) and os.path.exists(sp.replace("stores", "events")) and r["events"] == 1, str(r))
        os.remove(sp); os.remove(sp.replace("stores", "events"))
        r = roster_step(sp, fetch=boom, load=lambda p, n: old_st if n == "stores.json" else None, out=lambda *_: None)
        check("control: with no previous events table there is nothing to keep, and it says so", r["how"] == "failed" and os.path.exists(sp) and not os.path.exists(sp.replace("stores", "events")) and r["events"] is None, str(r))
        fresh_st = {"fetched_at": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime()), "source": "x", "stores": [{"name": "A"}]}
        r = roster_step(sp, fetch=boom, load=lambda p, n: fresh_st if n == "stores.json" else None, out=lambda *_: None)
        check("control: a fresh roster with no live events table is rebuilt, not carried (a lost table heals)", r["how"] == "failed", str(r))
        good = json.load(open(os.path.join(fx, "events_us.json")))["events"]
        r = roster_step(sp, fetch=lambda: good, load=lambda p, n: None, out=lambda *_: None)
        check("a rebuild writes both files", r["how"] == "rebuilt" and r["stores"] and os.path.exists(sp.replace("stores", "events")), str(r))
    ok &= shops.selftest(json.load(open(os.path.join(fx, "shopify_products.json"))))
    # take 114: the history rows the app's distributor timeline reads -- a source's key only on a run that read it
    import copy, subprocess
    fd = {"fetched_at": "2026-09-24T19:08:56Z", "sources": {"target": {"ok": False}, "gts": gts.from_fixture(os.path.join(fx, "gts_listing.html")),
                                                          "southern": southern.from_fixture(os.path.join(fx, "southern_listing.html"), fx)}}   # no catalogue needed: the rows key by the distributor's own id
    row = snapshot(fd)
    check("a run that read both distributors writes both keys, each item by its own id (GTS the SKU, Southern Hobby the page number)",
          set(row.get("gts", {})) == {i["sku"] for i in fd["sources"]["gts"]["items"]} and set(row.get("southern", {})) == {i["id"] for i in fd["sources"]["southern"]["items"]}, f"{len(row.get('gts', {}))} + {len(row.get('southern', {}))}")
    for k in ("gts", "southern"):
        kept = copy.deepcopy(fd); kept["sources"][k]["kept"] = True; dead = copy.deepcopy(fd); dead["sources"][k] = {"ok": False, "error": "HTTP 503", "items": []}
        check(f"a kept or failed {k} writes no {k} key -- 'not read', never 'nothing listed' (the timeline's hole)", k not in snapshot(kept) and k not in snapshot(dead) and k in snapshot(fd))
    # the hourly reads the history before any source is fetched, and stops rather than start it over
    hist = {"runs": [row]}; calls, naps, said = [], [], []
    def answers(*a):
        it = iter(a)
        def f(url): calls.append(url); return next(it)
        return f
    with tempfile.TemporaryDirectory() as td:
        nowhere = os.path.join(td, "history.json")
        rh = lambda p, *a: read_history(p, "https://x/", answers(*a), sleep=naps.append)   # noqa: E731
        r = rh(nowhere, (hist, None))
        check("the deployed history is read from Pages at its plain address -- no ?v=: the CDN ignores a query, a deploy clears its copy (MEASURED)",
              r == (hist, "pages") and calls == ["https://x/hunt/history.json"], f"{r[1]} {calls}")
        calls.clear(); r = rh(nowhere, (None, 404))
        check("Pages answering 404 is no history -- a new one starts, after one try", r == (None, "none") and len(calls) == 1, str(r))
        calls.clear(); naps.clear(); r = rh(nowhere, *[(None, "TimeoutError: timed out")] * 3)
        check("a history that cannot be read is tried three times, ten seconds apart, and said unread -- not started over", r[0] is None and r[1].startswith("unread: TimeoutError") and len(calls) == 3 and naps == [10, 10], str(r))
        calls.clear(); r = rh(nowhere, (None, "HTTPError: HTTP Error 503: Service Unavailable"), (hist, None))
        check("...a second try that reads it keeps it", r == (hist, "pages") and len(calls) == 2, str(r[1]))
        r = rh(nowhere, ({"feed": 1}, None))
        check("...a file that is not a history is unread, loudly -- a new shape is refused, not replaced", r[0] is None and r[1].startswith("unread: the deployed history is not a history"), str(r))
        try:
            history_first(nowhere, read=lambda p: rh(p, *[(None, "TimeoutError: timed out")] * 3), out=said.append); stopped = False
        except SystemExit as e:
            stopped = e.code == 3
        check("an unread history stops the run with exit 3, loudly, before any source is fetched", stopped and said[:1] and said[0].startswith("::error::history: unread"), (said or ["nothing said"])[0][:90])
        said.clear(); h = history_first(nowhere, read=lambda p: rh(p, (None, 404)), out=said.append)
        check("...a 404 is no history: a new one starts, and the run says so", h is None and any("none on Pages (404)" in x for x in said), str(said))
        # by behaviour, not by reading this file's source (landmine 100): the hourly itself, handed a history it cannot read
        open(os.path.join(td, "history.json"), "w").write("not json")
        dead_net = "http://127.0.0.1:9"                      # a regression that fetches fails fast and offline
        env = dict(os.environ, HTTPS_PROXY=dead_net, https_proxy=dead_net, HTTP_PROXY=dead_net, http_proxy=dead_net, NO_PROXY="", no_proxy="")
        try:
            pr = subprocess.run([sys.executable, os.path.abspath(__file__), "--out", os.path.join(td, "feed.json")], env=env, stdout=subprocess.PIPE, stderr=subprocess.STDOUT, text=True, timeout=60)
            rc, told = pr.returncode, pr.stdout.strip()
        except subprocess.TimeoutExpired:
            rc, told = None, "still running after 60 s"
        wrote = [f for f in ("feed.json", "stores.json") if os.path.exists(os.path.join(td, f))]
        check("the hourly, handed a history it cannot read, exits 3 and writes no feed and no roster -- nothing to deploy over the record",
              rc == 3 and not wrote, f"exit {rc}, wrote {', '.join(wrote) or 'nothing'}; {(told.splitlines() or [''])[-1][:100]}")
    # the output guard: the rows written are the rows loaded plus one, cut at KEEP_RUNS
    live = json.load(open(os.path.join(fx, "hunt_history_2026-09-24.json")))["runs"]   # the real history on Pages, 24 Sept
    cap = [{"t": str(i), "online": {}, "shelf": {}} for i in range(KEEP_RUNS)]
    check("the output guard passes a good append, and a full history cut at KEEP_RUNS",
          keeps_past(live, append_history({"runs": list(live)}, fd)) == [] and keeps_past(cap, append_history({"runs": list(cap)}, fd)) == [],
          str(keeps_past(live, append_history({"runs": list(live)}, fd)) + keeps_past(cap, append_history({"runs": list(cap)}, fd))))
    reset = keeps_past(live, append_history(None, fd))
    check(f"...and refuses take 113's reset ({len(live)} rows loaded, 1 written)", reset != [], str(reset))
    gap = keeps_past(live, append_history({"runs": live[:3] + live[4:]}, fd)); gap_cap = keeps_past(cap, append_history({"runs": cap[:100] + cap[101:]}, fd))
    check("...and a dropped middle row -- below the cap, and at the cap, where the count alone would pass", gap != [] and gap_cap != [], str(gap + gap_cap))
    # the nightly's carry-over: three tries a file; a history.json only if it is a history
    with tempfile.TemporaryDirectory() as td:
        served = {"feed.json": [(fd, None)], "history.json": [({"feed": 1}, None)], "stores.json": [(None, "TimeoutError: timed out")] * 3,
                  "events.json": [(None, 404)], "shops.json": [({"shops": []}, None)]}
        asked, naps, said = [], [], []
        def site(url):
            asked.append(url); return served[url.split("/hunt/")[1].split("?")[0]].pop(0)   # a query answers too, so the check below says it, not a KeyError
        got = carry_over(td, base="https://x/", fetch=site, sleep=naps.append, out=said.append)
        named = lambda f: [u for u in asked if u.endswith("/hunt/" + f)]   # noqa: E731
        check("the nightly's carry-over drops a history.json that parses but is not a history, and says why -- carried, every hourly would refuse it; this build still deploys",
              not os.path.exists(os.path.join(td, "history.json")) and any(x.startswith("   hunt carry-over: history.json NOT carried (not a history: no runs list) -- this deploy leaves Pages without it") for x in said) and got == 2,
              next((x.strip() for x in said if "history.json" in x), "said nothing of history.json") + f"; returned {got}")
        check("...a feed.json is carried, read at its plain address (no ?v=)", os.path.exists(os.path.join(td, "feed.json")) and named("feed.json") == ["https://x/hunt/feed.json"] and not any("?" in u for u in asked),
              str(named("feed.json")))
        check("...a file that times out is tried three times, ten seconds apart, and not carried", len(named("stores.json")) == 3 and naps == [10, 10] and not os.path.exists(os.path.join(td, "stores.json")), f"{len(named('stores.json'))} tries, naps {naps}")
        check("...a 404 is tried once, and said", len(named("events.json")) == 1 and any("events.json NOT carried (404)" in x for x in said), str(len(named("events.json"))))
    # take 114 review: a history.json the nightly could not read means no Pages deploy -- Pages holds the only copy of the record
    def carry(*answers):
        srv = {f: [(None, 404)] for f in HUNT_FILES}; srv["history.json"] = list(answers); told = []
        with tempfile.TemporaryDirectory() as td:
            r = carry_over(td, base="https://x/", fetch=lambda u: srv[u.split("/hunt/")[1].split("?")[0]].pop(0), sleep=lambda s: None, out=told.append)
            return r, os.path.exists(os.path.join(td, "history.json")), next((x.strip() for x in told if "history.json" in x), "")
    t_out, t_5xx = carry(*[(None, "TimeoutError: timed out")] * 3), carry(*[(None, "HTTPError: HTTP Error 503: Service Unavailable")] * 3)
    check("a history.json the nightly cannot read (three timeouts, or three 5xx) is CARRY_UNREAD, carried nowhere, and said: this build must not deploy Pages",
          t_out[0] == CARRY_UNREAD and t_5xx[0] == CARRY_UNREAD and not t_out[1] and not t_5xx[1] and "must not deploy Pages" in t_out[2], f"{t_out[0]}, {t_5xx[0]}: {t_out[2][:110]}")
    ctl = {"404": carry((None, 404)), "not a history": carry(({"feed": 1}, None)), "a history": carry((hist, None)), "second try": carry((None, "TimeoutError: timed out"), (hist, None))}
    check("...control: a 404 (none yet), a file that is not a history, a history, and one read on the second try let the build deploy -- the last two carry it",
          all(v[0] >= 0 for v in ctl.values()) and [v[1] for v in ctl.values()] == [False, False, True, True], json.dumps({k: v[:2] for k, v in ctl.items()}))
    # ...by behaviour: the command itself, its network faked beneath urllib -- exit 3 on a history.json that times out, 0 on a 404
    probe = ("import runpy, sys, time, urllib.error, urllib.request\n"
             "path, out, how = sys.argv[1:4]\n"
             "def urlopen(req, timeout=None):\n"
             "    if req.full_url.endswith('/hunt/history.json') and how == 'timeout': raise TimeoutError('timed out')\n"
             "    raise urllib.error.HTTPError(req.full_url, 404, 'Not Found', None, None)\n"
             "urllib.request.urlopen = urlopen; time.sleep = lambda s: None\n"
             "sys.argv = [path, '--carry-over', '--out', out]\n"
             "runpy.run_path(path, run_name='__main__')\n")
    codes = {}
    for how in ("timeout", "404"):
        with tempfile.TemporaryDirectory() as td:
            codes[how] = subprocess.run([sys.executable, "-c", probe, os.path.abspath(__file__), os.path.join(td, "feed.json"), how], env=env,
                                        stdout=subprocess.PIPE, stderr=subprocess.STDOUT, text=True, timeout=60).returncode
    check("...and --carry-over exits 3 on it, 0 on a 404", codes == {"timeout": 3, "404": 0}, str(codes))
    # ...and the nightly acts on the 3: ci/bundle.sh's carry-over step, run with a stand-in python3 that exits as the command would
    step = re.search(r'\necho "::group::carry the hourly feed forward[^\n]*\n(.*?)\necho "::endgroup::"', open(os.path.join(ROOT, "ci", "bundle.sh"), encoding="utf8").read(), re.S)
    wrote = {}
    with tempfile.TemporaryDirectory() as td:
        open(os.path.join(td, "python3"), "w").write("#!/bin/sh\nexit $STANDIN_RC\n"); os.chmod(os.path.join(td, "python3"), 0o755)
        for rc in ("3", "1", "0"):
            gho = os.path.join(td, "output-" + rc); open(gho, "w").close()
            subprocess.run(["bash", "-c", "set -euo pipefail\n" + (step.group(1) if step else "exit 9")], env=dict(os.environ, PATH=td + os.pathsep + os.environ.get("PATH", ""), STANDIN_RC=rc, GITHUB_OUTPUT=gho),
                           stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL, timeout=30)
            wrote[rc] = open(gho).read().strip()
    yml = open(os.path.join(ROOT, "ci", "build.yml"), encoding="utf8").read()
    jobs = {k: "\n" + v for k, v in re.findall(r"(?m)^  ([a-z]+):\n((?:(?:    .*)?\n)*)", yml)}   # each job's lines, as a block that starts on a newline
    sid = re.search(r"(?m)^    outputs:\n      pages: \$\{\{ steps\.(\w+)\.outputs\.pages \}\}$", jobs.get("bundle", ""))
    runs = [s for s in jobs.get("bundle", "").split("\n      - ") if "\n        run: bash ci/bundle.sh" in s]
    wired = bool(sid and runs and f"\n        id: {sid.group(1)}\n" in runs[0]) and "\n    if: needs.bundle.outputs.pages != 'skip'\n" in jobs.get("pages", "") \
        and "\n    continue-on-error: true" in jobs.get("pages", "") and "\n    needs: bundle\n" in jobs.get("apk", "")
    check("...and the nightly does not deploy on it: ci/bundle.sh writes pages=skip on a failed carry-over (3, or any failure) and nothing on 0; the bundle job exposes it, "
          "the pages job is skipped on it, and the apk job waits on bundle alone (the APK and the Release go ahead)",
          wrote == {"3": "pages=skip", "1": "pages=skip", "0": ""} and wired, f"{wrote}; build.yml wired: {wired}")
    # the due day: GTS keeps it open as Southern Hobby does (take 113's GTS closed it a day early)
    gh = open(os.path.join(fx, "gts_listing.html"), encoding="utf8").read()
    peb = lambda day: next(i["status"] for i in gts.parse_listing(gh, day)["items"] if i["sku"] == "BJP2897699")   # noqa: E731
    sh = {"due": "2026-10-14", "release": "2027-04-23"}                                                             # PEB-01 at Southern Hobby
    days = [peb("2026-10-14"), southern.state_of(sh, "2026-10-14"), peb("2026-10-15"), southern.state_of(sh, "2026-10-15")]
    check("the two distributors agree on the due day: on PEB-01's order due date both still take orders, the day after neither does",
          days == ["coming", "orders_open", "preorder", "orders_closed"], str(days))
    # take 114 review: the GTS counts by the dates over every item, as the app's gtsDue -- a product sold out before release counts too
    gi = gts.parse_listing(gh, gts.FIXTURE_TODAY)["items"]
    by_state = (sum(1 for i in gi if i["status"] == "coming"), sum(1 for i in gi if i["status"] == "preorder"))
    check("the GTS counts go by the dates, as the app's gtsDue: on 24 Sept, 1 with an order due date ahead (PEB-01) and 3 unreleased without one -- the three sold out, which a count by state left out",
          gts_due(gi, "2026-09-24T19:08:56Z") == (1, 3) and by_state == (1, 0), f"dates {gts_due(gi, '2026-09-24T19:08:56Z')}, by state {by_state}")
    moved = [dict(i, preorder="2026-10-30") if i["sku"] == "BJP2884797" else i for i in gi]
    check("...control: a sold-out product with its order due date ahead counts as ahead; the day after PEB-01's due date it is without one; once all are released, neither",
          gts_due(moved, "2026-09-24T19:08:56Z") == (2, 2) and gts_due(gi, "2026-10-15T00:00:00Z") == (0, 4) and gts_due(gi, "2027-05-01T00:00:00Z") == (0, 0),
          str([gts_due(moved, "2026-09-24T19:08:56Z"), gts_due(gi, "2026-10-15T00:00:00Z"), gts_due(gi, "2027-05-01T00:00:00Z")]))
    with tempfile.TemporaryDirectory() as td:                # by behaviour: a fixture run's gts line against its own feed's dates
        pr = subprocess.run([sys.executable, os.path.abspath(__file__), "--from-fixtures", "--out", os.path.join(td, "feed-fixture.json")], env=env,
                            stdout=subprocess.PIPE, stderr=subprocess.STDOUT, text=True, timeout=120)
        line = next((x.strip() for x in pr.stdout.splitlines() if x.startswith("   gts: ")), "no gts line")
        fed = json.load(open(os.path.join(td, "feed-fixture.json"))) if pr.returncode == 0 else {}
        g = fed.get("sources", {}).get("gts", {})
        says = "{} with an order due date ahead, {} unreleased without one".format(*gts_due(g.get("items", []), g.get("fetched_at")))
        beside = sorted(os.listdir(td))
        hist_beside = is_history(json.load(open(os.path.join(td, "history-fixture.json")))) if "history-fixture.json" in beside else False
    check("...and the hourly's gts line says those counts", pr.returncode == 0 and says in line, line[:170])
    # take 115: the --out refusal (landmine 166) -- the sidecars are named by replacing "feed" in --out, so a name without it wrote each over the feed
    check("an --out that names a feed writes its history, stores, events and shops beside it, each under its own name (feed-fixture.json -> history-fixture.json)",
          pr.returncode == 0 and "sources" in fed and hist_beside and {"feed-fixture.json", "history-fixture.json", "stores-fixture.json", "events-fixture.json", "shops-fixture.json"} <= set(beside), str(beside))
    with tempfile.TemporaryDirectory() as td:
        pr2 = subprocess.run([sys.executable, os.path.abspath(__file__), "--from-fixtures", "--out", os.path.join(td, "fixture.json")], env=env,
                             stdout=subprocess.PIPE, stderr=subprocess.STDOUT, text=True, timeout=120)
        left = sorted(os.listdir(td))
    check("...control: an --out without \"feed\" is refused with exit 2 and nothing written -- take 111 wrote the history over the feed (landmine 166)",
          pr2.returncode == 2 and "--out must name a feed file" in pr2.stdout and left == [], f"exit {pr2.returncode}, wrote {', '.join(left) or 'nothing'}")
    check("control: take 113's path on a failed read -- append_history(None, ...) -- is one row: the whole record replaced by the next deploy", len(append_history(None, fd)["runs"]) == 1)
    # controls: a changed shape is a failure, not a quiet empty
    for name, fn, bad in (("stores", target.parse_stores, {"data": {}}), ("search", target.parse_search, {"data": {"search": {}}}), ("fulfillment", target.parse_fulfillment, {"data": {"product": {}}})):
        try:
            fn(bad); check(f"control: a changed {name} shape is refused", False)
        except (KeyError, TypeError):
            check(f"control: a changed {name} shape is refused", True)
    return ok


HUNT_FILES = ("feed.json", "history.json", "stores.json", "events.json", "shops.json")


def roster_step(stores_path, from_fixtures=False, fetch=None, load=None, out=print):
    """The store roster and its events table (takes 74, 76). Rebuilt when the
    live roster is a day old or the live events table is missing; else both
    are carried over. Take 92, landmine 130: a failed rebuild keeps BOTH files
    -- the failure path used to keep the roster and drop the events table, so
    one bad night made Events a 404 that no later night could heal. Returns
    what happened, for the selftest."""
    fetch = fetch or roster.fetch_events; load = load or load_previous
    ev_path = stores_path.replace("stores", "events")
    prev_st = None if from_fixtures else load(stores_path, "stores.json")
    prev_ev = None if from_fixtures else load(ev_path, "events.json")
    have_ev = bool(prev_ev and prev_ev.get("rows") is not None)
    fresh = bool(prev_st and prev_st.get("fetched_at") and (time.time() - time.mktime(time.strptime(prev_st["fetched_at"], "%Y-%m-%dT%H:%M:%SZ"))) < 24 * 3600)
    carried = fresh and have_ev
    result = {"stores": None, "events": None, "how": None}
    try:
        if from_fixtures:
            ev = json.load(open(os.path.join(ROOT, "tools", "fixtures", "events_us.json")))["events"]
            st = roster.build(ev, roster.zcta(), now="2026-09-01")
        elif carried:
            st = prev_st
            st["events"] = {k: prev_ev[k] for k in ("window_days", "titles", "rows", "url") if k in prev_ev}
        else:
            st = roster.build(fetch(), roster.zcta())
        ev_tab = st.pop("events", None) if isinstance(st, dict) else None
        json.dump(st, open(stores_path, "w"), separators=(",", ":"))
        if ev_tab:
            json.dump({"fetched_at": st["fetched_at"], "stores_fetched_at": st["fetched_at"], **ev_tab}, open(ev_path, "w"), separators=(",", ":"))
            out(f"   events: {len(ev_tab['rows'])} in the next {ev_tab['window_days']} days, {os.path.getsize(ev_path) // 1024} KB")
            result["events"] = len(ev_tab["rows"])
        result["how"] = "carried" if carried else "rebuilt"; result["stores"] = len(st["stores"])
        out(f"   stores: {len(st['stores'])} with events on file ({'carried over' if carried else 'rebuilt'}), {os.path.getsize(stores_path) // 1024} KB")
    except Exception as e:                                   # noqa: BLE001
        result["how"] = "failed"; result["error"] = f"{type(e).__name__}: {str(e)[:100]}"
        out(f"   stores: FAILED {result['error']}" + (f" (kept the roster of {prev_st.get('fetched_at')})" if prev_st else " (no roster to keep)"))
        if prev_st:
            json.dump(prev_st, open(stores_path, "w"), separators=(",", ":")); result["stores"] = len(prev_st.get("stores", []))
        if have_ev:
            json.dump(prev_ev, open(ev_path, "w"), separators=(",", ":")); result["events"] = len(prev_ev["rows"])
            out(f"   events: kept the table of {prev_ev.get('fetched_at')}, {len(prev_ev['rows'])} rows")
        else:
            out("   events: nothing to keep -- the Events screen stays empty until a rebuild succeeds")
    return result


CARRY_UNREAD = -1   # carry_over's answer when history.json could not be read: --carry-over exits 3 and the nightly does not deploy Pages


def carry_over(out_dir, base=None, fetch=None, sleep=time.sleep, out=print):
    """Take 82. Two workflows deploy the same Pages site: the hourly feed and
    the nightly build. The nightly rebuilds www/ from the tree, which has no
    feed, so its deploy WIPED the hourly's files until the next :17 -- the
    owner's 404. Before the nightly uploads, it copies whatever is live on
    Pages into www/hunt/. No retailer is touched; this reads our own site.
    Take 114: three tries a file, 10 s apart, at the plain address (a ?v=
    reads the CDN's same copy; a deploy clears it -- read_history says what
    was measured); a history.json is carried only if it is a history -- one
    the hourly refuses, carried every night, would stop every hourly;
    dropped, Pages answers 404 and the next hourly starts a new history and
    says so. What is not carried says why. Take 114 review: a history.json
    that could not be read -- a timeout, a 5xx, a body that is not JSON; not
    a 404, not a file that is not a history -- returns CARRY_UNREAD. Pages
    holds the only copy of the record, and a deploy without it is the next
    hourly's reset, so --carry-over exits 3 and ci/bundle.sh skips this
    build's Pages deploy; Pages keeps the hourly's last one, history whole."""
    base = pages_base() if base is None else base
    if not base:
        out("   hunt carry-over: no UPDATE_URL, nothing to carry"); return 0
    fetch = fetch or fetch_json_why
    os.makedirs(out_dir, exist_ok=True); n = 0; unread = False
    for name in HUNT_FILES:
        j, why = fetch_tries(base + "hunt/" + name, fetch, sleep=sleep)   # take 114: a missed history.json here is the next hourly's reset
        if name == "history.json" and j is not None and not is_history(j):
            j, why = None, "not a history: no runs list"
        elif name == "history.json" and j is None and why != 404:
            unread = True
        if j is not None:
            json.dump(j, open(os.path.join(out_dir, name), "w"), separators=(",", ":")); n += 1
        else:
            out(f"   hunt carry-over: {name} NOT carried ({why})" + ("" if name != "history.json" or why == 404
                else " -- this build must not deploy Pages: a deploy without it is the next hourly's reset (exit 3)" if unread
                else " -- this deploy leaves Pages without it; the next hourly starts a new history"))
    out(f"   hunt carry-over: {n} of {len(HUNT_FILES)} files carried from Pages" + ("" if n else " -- none live yet (has the hourly workflow run?)"))
    return CARRY_UNREAD if unread else n


if __name__ == "__main__":
    ap = argparse.ArgumentParser(); ap.add_argument("--zips", default="48329", help="comma-separated served zips for the local layer"); ap.add_argument("--radius", type=int, default=50)
    ap.add_argument("--out", default=OUT); ap.add_argument("--selftest", action="store_true"); ap.add_argument("--from-fixtures", action="store_true")
    ap.add_argument("--carry-over", action="store_true", help="copy the live hunt files from Pages into www/hunt (the nightly, before it deploys)")
    a = ap.parse_args()
    if a.carry_over:
        raise SystemExit(3 if carry_over(os.path.dirname(a.out)) == CARRY_UNREAD else 0)   # take 114 review: ci/bundle.sh skips Pages on any non-zero
    if a.selftest:
        print("hunt.py parsers against saved real responses:"); raise SystemExit(0 if selftest() else 1)
    if "feed" not in os.path.basename(a.out):   # take 112: the sidecars below are named by replacing "feed", so any other name wrote the history over the feed
        ap.error(f"--out must name a feed file such as feed.json or feed-fixture.json, not {os.path.basename(a.out)}: its stores, shops, events and history are named from it")
    hist_path = os.path.join(os.path.dirname(a.out), os.path.basename(a.out).replace("feed", "history"))   # feed.json -> history.json; a fixture feed keeps its fixture suffix
    prev_hist = history_first(hist_path, a.from_fixtures)   # take 114: before any source is fetched -- unreadable, the run stops here
    prev = None if a.from_fixtures else load_previous(a.out, "feed.json")
    if prev:
        print(f"   previous feed: {prev.get('fetched_at')} (cursor {prev.get('sources', {}).get('target', {}).get('cursor')})")
    feed = build([z.strip() for z in a.zips.split(",") if z.strip()], a.radius, prev, fixtures=a.from_fixtures)
    os.makedirs(os.path.dirname(a.out), exist_ok=True)
    json.dump(feed, open(a.out, "w"), separators=(",", ":"))
    # the store roster: rebuilt when the last one is a day old, else carried over (take 74)
    stores_path = os.path.join(os.path.dirname(a.out), os.path.basename(a.out).replace("feed", "stores"))
    roster_step(stores_path, a.from_fixtures)
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
    before = list(prev_hist["runs"]) if is_history(prev_hist) else []
    hist = append_history(prev_hist, feed)
    lost = keeps_past(before, hist)
    if lost:                                                 # take 114: the output guard, before the history is written
        print(f"::error::history: this run's history would lose its past ({'; '.join(lost)}); nothing is deployed (landmine 66)")
        raise SystemExit(3)
    json.dump(hist, open(hist_path, "w"), separators=(",", ":"))
    print(f"   history: {len(hist['runs'])} run(s) on file since {hist.get('since')}, "
          + ", ".join(f"{k} in {sum(1 for r in hist['runs'] if k in r)}" for k in ("gts", "southern")) + f", {os.path.getsize(hist_path) // 1024} KB")
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
    g = feed["sources"]["gts"]
    if g.get("kept"):
        print(f"   gts: this fetch FAILED ({g.get('error')}); kept the last good fetch from {g.get('fetched_at')} (stale since {g.get('stale_since')})")
    elif g.get("ok"):
        n = g["items"]; st = lambda s: sum(1 for i in n if i["status"] == s); ahead, without = gts_due(n, g.get("fetched_at"))   # noqa: E731
        print(f"   gts: {len(n)} of {g.get('count')} products ({sum(1 for i in n if i.get('catalog_id'))} matched), {st('sold_out')} sold out, {sum(1 for i in n if i['allocated'])} allocated, "
              f"{ahead} with an order due date ahead, {without} unreleased without one, {st('in_stock')} in stock, {st('call')} call; {g.get('calls')} call(s)")
    else:
        print(f"   gts: FAILED {g.get('error')}")
    so = feed["sources"]["southern"]
    if so.get("kept"):
        print(f"   southern: this fetch FAILED ({so.get('error')}); kept the last good fetch from {so.get('fetched_at')} (stale since {so.get('stale_since')})")
    elif so.get("ok"):
        n = so["items"]; st = lambda s: sum(1 for i in n if i["state"] == s)   # noqa: E731
        print(f"   southern: {len(n)} of {so.get('count')} products ({sum(1 for i in n if i.get('catalog_id'))} matched), {st('orders_open')} open to orders, {st('orders_closed')} closed, {st('released')} released, "
              f"{sum(1 for i in n if (i.get('page') or {}).get('restricted'))} in-store only; pages: {so.get('pages_read')} read, {so.get('pages_failed')} failed, {sum(1 for i in n if i.get('page'))} on file; {so.get('calls')} call(s)"
              + (f"; the budget was spent, {so.get('pages_skipped')} page(s) wait for the next run" if so.get("budget_spent") else ""))
    else:
        print(f"   southern: FAILED {so.get('error')}")
    print(f"   feed: {os.path.relpath(a.out, ROOT)} {os.path.getsize(a.out) // 1024} KB")
