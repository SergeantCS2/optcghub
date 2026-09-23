"""GTS Distribution (A32, take 94): the first distributor source. A
distributor sells to stores, not to collectors, and its public listing says
what a shelf will see weeks before the shelf does: the release date, whether
preorders are open, and whether the print run is already spoken for ("Sold
Out" months before release, with the allocation flag set).

MEASURED take 94, read off the real pages: a Website Pipeline storefront on
classic ASP. One faceted listing, pc_combined_results.asp, filtered to the
Brand facet ONE PIECE and the Manufacturer facet BANDAI JAPAN (ids read off
the facet panel's checkboxes), 49 products; rpp=60 returns them in one call.
There is no JSON endpoint, but every listing page embeds

    var productResults = {"count": N, "products": [...]};

-- the object the page's own view model renders. That is what is parsed,
never the HTML around it. The wholesale price sits behind a login
(mapPriceType require_login_for_price_and_atc); this project never logs in
and shows the MSRP as the MSRP. flags[1] is the allocation flag: the product
page's template shows "This product may be allocated" on it, and the
Allocated facet holds exactly the flagged products (32 of 49 on 2026-09-23).

A shape change is reported as the source being broken, never as "nothing
listed" (PROTOCOL §10, landmine 130). Rate: one call a run, a second between
pages if there are pages, a User-Agent naming the project.
"""
import html as _html, json, re, time, urllib.parse, urllib.request

UA = "optcghub-hunt/1 (+https://github.com/SergeantCS2/optcghub)"
BASE = "https://www.gtsdistribution.com/"
LISTING = "pc_combined_results.asp"
BRAND = "58A4E8A0A45E4D148A8808C9F94CC6D4"        # the Brand facet: ONE PIECE
MAKER = "D451193DC8F1445A85EF51A7B3F6D96D"        # the Manufacturer facet: BANDAI JAPAN
RPP = 60                                          # rows per page; the site offers 12/36/60/90/120/240
STATUSES = ("sold_out", "call", "in_stock", "preorder", "coming", "out", "unknown")
BLOB = re.compile(r"var productResults = (\{.*?\});\s*\n", re.S)
CODES = re.compile(r"\b(OP|EB|ST|PRB|PEB|DP|IB)[ -]?0*(\d+)\b", re.I)


def listing_url(page=1):
    q = {"pc_id": "", "search_keyword": "", "opts": "", "faceted_search_terms": f"Brand~{BRAND}|Manufacturer~{MAKER}", "rpp": RPP, "page": page}
    return BASE + LISTING + "?" + urllib.parse.urlencode(q)


def get(url, timeout=30):
    req = urllib.request.Request(url, headers={"User-Agent": UA, "Accept": "text/html"})
    with urllib.request.urlopen(req, timeout=timeout) as r:
        return r.read().decode("utf8", "replace")


def _text(s):
    """The site's stock message is HTML ('<span ...><strong>Sold Out</strong></span>')."""
    return re.sub(r"\s+", " ", _html.unescape(re.sub(r"<[^>]+>", " ", s or ""))).strip()


def _date(s):
    """'2026-11-20T00:00:00Z', '11/20/2026' or 'Jun  5 2026' -> '2026-11-20'.
    The site's placeholders (1/1/1900 for no restock, a 1924 preorder date on
    sleeves) are not dates: anything before 2000 is None."""
    s = (s or "").strip()
    if not s:
        return None
    for fmt in ("%Y-%m-%dT%H:%M:%SZ", "%Y-%m-%d", "%m/%d/%Y", "%b %d %Y"):
        try:
            t = time.strptime(re.sub(r"\s+", " ", s), fmt)
            return time.strftime("%Y-%m-%d", t) if t.tm_year >= 2000 else None
        except ValueError:
            continue
    return None


def codes_in(name):
    """The set codes a name carries, normalised: 'BOOSTER (OP 15-EB04)' -> ['EB04', 'OP15']."""
    return sorted({m.group(1).upper() + m.group(2).zfill(2) for m in CODES.finditer(name or "")})


def status_of(p, today):
    """The six states the site distinguishes, in its own words first: the stock
    message or the quantity label saying Sold Out or Call wins over
    inventoryStatus, which reads 'in' on six sold-out displays (measured)."""
    inv = p["inventory"]
    words = " ".join((_text(inv["stockMessage"]), str(p["qty_great_than_display"] or ""), str(inv.get("stock") or ""))).lower()
    rel, pre = _date(p["release_date"]), _date(p["preorder_date"])
    if "sold out" in words:
        return "sold_out"
    if "call" in words:
        return "call"
    if inv["inventoryStatus"] == "in":
        return "in_stock"
    if inv["inventoryStatus"] == "out":
        if rel and rel > today:
            return "coming" if (pre and pre > today) else "preorder"
        return "out"
    return "unknown"


def parse_product(p, today=None):
    today = today or time.strftime("%Y-%m-%d", time.gmtime())
    inv = p["inventory"]
    msrp = float(p["uomPrice"][0]["SRetailPrice"]) if p["uomPrice"] else 0.0
    upc = re.search(r"\b(\d{12,14})\b", p.get("opt5") or "")
    sf = p.get("searchfields") or {}
    msg = _text(inv["stockMessage"])
    return {"sku": p["sku"], "name": _text(p["name"]), "url": BASE + p["link"], "key": p["key"],
            "upc": upc.group(1) if upc else None, "msrp": round(msrp, 2) if msrp > 0 else None,
            "config": _text((sf.get("searchfield7") or {}).get("value") or ""),
            "release": _date(p["release_date"]), "preorder": _date(p["preorder_date"]), "early": _date(p.get("searchfields_searchfield22") or ""),
            "status": status_of(p, today), "status_text": (msg or str(p["qty_great_than_display"] or "")).strip(),
            "allocated": bool(p["flags"][1]), "codes": codes_in(p["name"])}


def parse_listing(html, today=None):
    """The embedded object, or ValueError: a page without it is a changed page."""
    m = BLOB.search(html or "")
    if not m:
        raise ValueError("no productResults object in the page")
    d = json.loads(m.group(1))
    return {"count": int(d["count"]), "items": [parse_product(p, today) for p in d["products"]]}


def retail_title(name):
    """The distributor names case packs; the catalogue names retail products.
    'ONE PIECE TCG: (TITLE TBA) BOOSTER (OP-16) (24CT)' is the retail Booster
    Box (24 packs); 'STARTER DECKS DISPLAY (ST-31) (6CT)' is the catalogue's
    '... Display'; 'DOUBLE PACK SET VOLUME 11 (DP-11) (8CT)' its Display.
    Measured take 94: the shared matcher found 2 of 49 without this."""
    t = (name or "").upper()
    t = re.sub(r"^ONE PIECE TCG:?\s*", "", t)
    t = re.sub(r"\(?\s*TITLE TBA\s*\)?", " ", t)
    m = re.search(r"\((\d+)\s*CT\)", t)
    ct = int(m.group(1)) if m else 0
    t = re.sub(r"\(\d+\s*CT\)", " ", t).replace("[", "(").replace("]", ")")
    t = re.sub(r"\bDECKS\b", "DECK", t)
    if re.search(r"\bBOOSTER\b", t) and not re.search(r"\b(BOX|PACK)\b", t):
        t += " BOX"
    if ct > 1 and re.search(r"\b(STARTER DECK|DOUBLE PACK SET)\b", t) and "DISPLAY" not in t:
        t += " DISPLAY"
    return re.sub(r"\s+", " ", t).strip()


def fetch(max_pages=4, pause=1.0, now=None, getter=None, today=None):
    """Never raises. The pages must carry exactly the count the site promised
    (AGENTS rule 8); short is an error and the last good fetch is kept."""
    now = now or time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime())
    getter = getter or get
    out = {"ok": False, "fetched_at": now, "calls": 0}
    try:
        items, seen, count = [], set(), None
        for page in range(1, max_pages + 1):
            r = parse_listing(getter(listing_url(page)), today); out["calls"] += 1
            count = r["count"]
            new = [i for i in r["items"] if i["sku"] not in seen]
            if not new:
                break
            items += new; seen |= {i["sku"] for i in new}
            if len(items) >= count:
                break
            time.sleep(pause)
        if len(items) != count:
            raise ValueError(f"the listing promised {count} products and the pages carried {len(items)}")
        out.update({"ok": True, "items": items, "count": count})
    except Exception as e:                                   # noqa: BLE001
        out["error"] = f"{type(e).__name__}: {str(e)[:120]}"
    return out


FIXTURE_TODAY = "2026-09-23"                      # the day the page was saved: its states are read as of then


def from_fixture(path):
    """The saved page as a source, dated the day it was saved, so smoke sees
    the same states every run."""
    r = parse_listing(open(path, encoding="utf8").read(), FIXTURE_TODAY)
    return {"ok": True, "fetched_at": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime()), "items": r["items"], "count": r["count"], "calls": 0, "fixture": True}


def selftest(html, out=print):
    ok = True
    def check(name, cond, note=""):
        nonlocal ok; out(f"  {'ok  ' if cond else 'FAIL'}  {name}{('  ' + note) if note else ''}"); ok &= bool(cond)
    r = parse_listing(html, FIXTURE_TODAY); by = {i["sku"]: i for i in r["items"]}
    check("gts listing parse: the site's count and the trimmed products", r["count"] == 49 and len(r["items"]) == 11, f"count {r['count']}, {len(r['items'])} items")
    check("every item: sku, name, url on the distributor, a named state, allocation as a boolean",
          all(i["sku"] and i["name"] and i["url"].startswith(BASE) and i["status"] in STATUSES and isinstance(i["allocated"], bool) for i in r["items"]))
    want = {"BJP2884797": "sold_out", "BJP2873812": "sold_out", "BJP2850164": "sold_out", "BJP2897699": "coming", "BJP2855988": "sold_out",
            "BJP9056341": "in_stock", "BJPBAS69321": "call", "BJP2835333": "out", "BJP2850166": "sold_out", "BJP2904577": "sold_out", "BJP2864562": "sold_out"}
    got = {k: by[k]["status"] for k in want}
    check("the states read as measured on the page (six sold out including two the site marks 'in', a coming preorder, one in stock, one call, one out)", got == want, json.dumps({k: v for k, v in got.items() if v != want[k]}) if got != want else "")
    check("allocation: the OP-19 booster is flagged, the ST44 display is not (the facet agreed on all 49)", by["BJP2884797"]["allocated"] is True and by["BJP2904577"]["allocated"] is False)
    check("the set codes in a name: OP-19, DP-11, PEB01; none on a sleeve display", by["BJP2884797"]["codes"] == ["OP19"] and by["BJP2850166"]["codes"] == ["DP11"] and by["BJP2897699"]["codes"] == ["PEB01"] and by["BJP9056341"]["codes"] == [])
    check("MSRP is the display's suggested retail, and a call-to-order figure at $0 has none", by["BJP2884797"]["msrp"] == 119.76 and by["BJPBAS69321"]["msrp"] is None)
    check("dates: release and preorder-opened as ISO; a 1924 placeholder is none; the coming preorder opens after the saved day",
          by["BJP2884797"]["release"] == "2027-03-05" and by["BJP2884797"]["preorder"] == "2026-08-26" and by["BJP2835333"]["preorder"] is None and by["BJP2897699"]["preorder"] == "2026-10-14")
    check("status_text is the site's own words", by["BJP2884797"]["status_text"] == "Sold Out" and by["BJPBAS69321"]["status_text"] == "Call to Order" and by["BJP2897699"]["status_text"] == "24+")
    check("retail_title: a 24-count booster is the Booster Box, a 6-count starter decks display is the Display, TITLE TBA and the count go",
          retail_title("ONE PIECE TCG: (TITLE TBA) BOOSTER (OP-19) (24CT)") == "BOOSTER (OP-19) BOX"
          and retail_title("ONE PIECE TCG: (TITLE TBA) STARTER DECKS DISPLAY (ST-38) (6CT)") == "STARTER DECK DISPLAY (ST-38)"
          and retail_title("ONE PIECE TCG: TITLE TBA STARTER DECK [ST44] (6CT)") == "STARTER DECK (ST44) DISPLAY"
          and retail_title("ONE PIECE TCG DOUBLE PACK SET VOLUME 11 (DP-11) (8CT)") == "DOUBLE PACK SET VOLUME 11 (DP-11) DISPLAY"
          and retail_title("ONE PIECE TCG: SET SAIL DECK SET (SD01)") == "SET SAIL DECK SET (SD01)",
          retail_title("ONE PIECE TCG: TITLE TBA STARTER DECK [ST44] (6CT)"))
    # controls: a changed shape is a failure, not a quiet empty
    try:
        parse_listing("<html><body>nothing here</body></html>"); check("control: a page without the object is refused", False)
    except ValueError:
        check("control: a page without the object is refused", True)
    try:
        parse_listing('var productResults = {"count":1,"products":[{"sku":"X","name":"Y","link":"z"}]};\n'); check("control: a product without its inventory block is refused", False)
    except (KeyError, TypeError, IndexError):
        check("control: a product without its inventory block is refused", True)
    short = fetch(getter=lambda u: html, pause=0, today=FIXTURE_TODAY)
    check("control: pages that carry fewer products than the count promised are a failed fetch, not a short list", short["ok"] is False and "promised 49" in short.get("error", ""), short.get("error"))
    whole = fetch(getter=lambda u: html.replace('{"count":49,', '{"count":11,'), pause=0, today=FIXTURE_TODAY)
    check("a fetch whose pages carry the promised count is ok, in one call", whole["ok"] and whole["count"] == 11 and len(whole["items"]) == 11 and whole["calls"] == 1, whole.get("error"))
    dead = fetch(getter=lambda u: (_ for _ in ()).throw(OSError("HTTP Error 503")), pause=0)
    check("control: a refused host is a failed fetch with the reason, never a raise", dead["ok"] is False and "503" in dead["error"])
    return ok
