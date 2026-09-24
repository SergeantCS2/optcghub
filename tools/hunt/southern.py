"""Southern Hobby (A32, take 112): the second distributor source. Like GTS
(take 94) it sells to stores, not to collectors, and its public pages say
what a shelf will see before the shelf does. Unlike GTS it publishes no
stock words and no MSRP: what it says is when stores must have ordered,
when the product releases, and whether it may only be sold in a shop.

MEASURED take 112, read off the real pages from the session VM (the record
had said "same shape as GTS"; it is not):
- an osCommerce-style storefront. The One Piece category,
  /ccg-s/one-piece-card-game/c13_1000991/, is ONE page whose footer says
  "20 items" over a table of 20 rows with the headings Product Name, Item #,
  Release Date, Order Due, Price (behind a login this project never uses)
  and Qty. (empty). Every row carries the presell ribbon.
- a product page, /<slug>/p<id>/, adds a Prerelease Date (on one of 20),
  "Sold As: BOX|Display|CASE|EACH", and two flags: "Subject to Allocation"
  (on all 20 -- boilerplate here, where GTS's flag separated 32 of 49) and
  "THIS PRODUCT IS BRICK AND MORTAR RESTRICTED" (on 2).
- robots.txt allows both kinds of page and disallows search, the quick-view
  popup and any URL with sort= -- none of which is ever asked for.
- the item number carries the set code more reliably than the name: the
  name "Double Pack Set 14 DP-15" is item BANTCGOPDP14.

The category page is read every run (one call); a product page when its item
first appears and again after a week, a few a run, 1.5 s apart. A shape
change is the source being broken, never "nothing listed" (PROTOCOL §10,
landmine 130), and the page must carry the count its own footer states
(AGENTS rule 8). A User-Agent names the project.
"""
import html as _html, json, re, time, urllib.request

UA = "optcghub-hunt/1 (+https://github.com/SergeantCS2/optcghub)"
BASE = "https://www.southernhobby.com/"
CATEGORY = BASE + "ccg-s/one-piece-card-game/c13_1000991/"
HEADINGS = ["", "Product Name", "Item #", "Release Date", "Order Due", "Price", "Qty."]
STATES = ("orders_open", "orders_closed", "released", "unknown")
PAGE_EVERY_DAYS = 7          # a product page is read again after a week
PAGES_PER_RUN = 25           # at most this many product pages in one run (a new category's worth)
PAGE_BUDGET_S = 90           # and no page is started this long after the run began: a host that hangs costs
                             # one run about two minutes, never the hourly job's fifteen (25 pages x 30 s would)
PAGE_TIMEOUT_S = 15
PREFIX = re.compile(r"^\s*Bandai\s*-\s*One Piece Card Game:?\s*", re.I)
ITEM_CODE = re.compile(r"^BAN(?:TCG)?OP(PRB|PEB|OP|EB|ST|DP|IB|SD)0*(\d+)$")
NAME_CODES = re.compile(r"\b(PRB|PEB|OP|EB|ST|DP|IB|SD)[ -]?0*(\d+)\b", re.I)


def get(url, timeout=30):
    req = urllib.request.Request(url, headers={"User-Agent": UA, "Accept": "text/html"})
    with urllib.request.urlopen(req, timeout=timeout) as r:
        return r.read().decode("utf8", "replace")


def _text(s):
    return re.sub(r"\s+", " ", _html.unescape(re.sub(r"<[^>]+>", " ", s or ""))).strip()


def _date(s):
    """'03/05/2027' -> '2027-03-05'; empty, malformed or before 2000 -> None."""
    m = re.fullmatch(r"(\d{1,2})/(\d{1,2})/(\d{4})", (s or "").strip())
    if not m:
        return None
    mo, d, y = int(m.group(1)), int(m.group(2)), int(m.group(3))
    return f"{y:04d}-{mo:02d}-{d:02d}" if y >= 2000 and 1 <= mo <= 12 and 1 <= d <= 31 else None


def codes_of(item, name):
    """The set code: the item number's when it carries one (BANTCGOPOP19 -> OP19,
    BANOPSD01 -> SD01); else the codes the name carries; sleeves and gift
    collections have none."""
    m = ITEM_CODE.match((item or "").upper())
    if m:
        return [m.group(1) + m.group(2).zfill(2)]
    return sorted({m.group(1).upper() + m.group(2).zfill(2) for m in NAME_CODES.finditer(name or "")})


def state_of(it, today):
    """From the distributor's own dates, never from stock (it publishes none)."""
    rel, due = it.get("release"), it.get("due")
    if rel and rel <= today:
        return "released"
    if due and due >= today:
        return "orders_open"
    if due:
        return "orders_closed"
    return "unknown"


def parse_row(row):
    tds = re.findall(r"<td[^>]*>(.*?)</td>", row, re.S)
    if len(tds) != len(HEADINGS):
        raise ValueError(f"a listing row has {len(tds)} cells, not {len(HEADINGS)}")
    link = re.search(r'href="(https://www\.southernhobby\.com/[^"]+/p(\d+)/)"', tds[1])
    if not link:
        raise ValueError("a listing row without its product link")
    name, item = _text(tds[1]), _text(tds[2])
    if not name or not item:
        raise ValueError("a listing row without a name or an item number")
    ribbons = re.findall(r"ribbons/([\w-]+)\.png", tds[0])
    return {"id": link.group(2), "url": link.group(1), "name": name, "item": item,
            "release": _date(_text(tds[3])), "due": _date(_text(tds[4])),
            "presell": "presell-list" in ribbons, "codes": codes_of(item, name)}


def parse_listing(html):
    """The category page: {"count": the footer's number, "items": [...]}, or
    ValueError -- a page without the six headings, the footer or its rows is a
    changed page."""
    heads = [_text(h) for h in re.findall(r'<td[^>]*class="productListing-heading"[^>]*>(.*?)</td>', html or "", re.S)]
    if heads != HEADINGS:
        raise ValueError(f"the listing's headings changed: {heads}")
    m = re.search(r'class="pageresults">\s*(\d+)\s+items?\s*<', html)
    if not m:
        raise ValueError("no item count in the listing's footer")
    rows = re.findall(r'<tr class="productListing">(.*?)</tr>', html, re.S)
    return {"count": int(m.group(1)), "items": [parse_row(r) for r in rows]}


def parse_product(html):
    """A product page's facts, read from its own block (the ribbons, the title,
    the item line, the red date lines, Sold As and the flags under it), or
    ValueError when the block is not there."""
    a = (html or "").find('class="product-info-left"')
    b = html.find("More Products from", a) if a >= 0 else -1
    if a < 0 or b < 0:
        raise ValueError("no product block on the page")
    blk = html[a:b]
    item = re.search(r'<td class="gray-text">\s*Item #\s*([^<]+?)\s*</td>', blk)
    if not item:
        raise ValueError("no item number in the product block")
    txt = _text(re.sub(r"<script.*?</script>|<style.*?</style>", " ", blk, flags=re.S))
    sold = re.search(r"Sold As:\s*(\w+)", txt)
    pre = re.search(r"Prerelease Date:\s*([\d/]+)", txt)
    rel = re.search(r"(?<!Pre)(?<!pre)Release Date:\s*([\d/]+)", txt)
    ribbons = re.findall(r"ribbons/([\w-]+)\.png", blk)
    return {"item": item.group(1).strip(), "release": _date(rel.group(1)) if rel else None,
            "prerelease": _date(pre.group(1)) if pre else None, "sold_as": sold.group(1).upper() if sold else None,
            "allocation": "allocation-big" in ribbons or "subject to allocation" in txt.lower(),
            "restricted": "brick and mortar restricted" in txt.lower()}


def retail_title(name, codes=(), sold_as=None):
    """What the catalogue would call it: the brand prefix goes, the item
    number's set code replaces the codes the name carries (the name can
    disagree -- DP-15 on item DP14), a count goes, and a Display the site
    sells as one ("Sold As: Display") says so, as the catalogue's
    '... Display' does. A booster with neither box nor pack is the box."""
    t = PREFIX.sub("", name or "")
    ct = re.search(r"\b(\d+)\s*CT\b", t, re.I)
    display = (sold_as or "").upper() == "DISPLAY" or (ct is not None and int(ct.group(1)) > 1)
    t = re.sub(r"\(?\b\d+\s*CT\b\)?", " ", t, flags=re.I)
    if codes:
        t = re.sub(r"\(\s*\)", " ", NAME_CODES.sub(" ", t))
        t = f"{' '.join(codes)} {t}"
    t = t.upper()
    if display and "DISPLAY" not in t and re.search(r"\b(STARTER DECK|DOUBLE PACK SET)\b", t):
        t += " DISPLAY"
    if re.search(r"\bBOOSTER\b", t) and not re.search(r"\b(BOX|PACK|CASE)\b", t):
        t += " BOX"
    if (sold_as or "").upper() == "CASE" and "CASE" not in t:
        t += " CASE"                                  # take 112: the live pages sell IB-09 and IB-10 as cases
    return re.sub(r"\s+", " ", t).strip()


def unit_unknown(name, sold_as=None):
    """A starter deck and a double pack set are sold singly and by the display.
    Until the product page says which (or the name carries 'Display' or a
    count), the listing cannot tell them apart, and a match to the wrong one
    is worse than none (AGENTS rule 4)."""
    return not sold_as and bool(re.search(r"\b(STARTER DECK|DOUBLE PACK SET)\b", name or "", re.I)) and not re.search(r"\bDISPLAY\b|\b\d+\s*CT\b", name or "", re.I)


def _age_days(iso, now):
    try:
        return (time.mktime(time.strptime(now, "%Y-%m-%dT%H:%M:%SZ")) - time.mktime(time.strptime(iso, "%Y-%m-%dT%H:%M:%SZ"))) / 86400
    except (TypeError, ValueError):
        return 9e9


def fetch(previous=None, now=None, getter=None, today=None, pause=1.5, max_pages=PAGES_PER_RUN, budget=PAGE_BUDGET_S, clock=time.monotonic):
    """Never raises. The category page must carry exactly the count its footer
    states (AGENTS rule 8); short is an error, and the caller keeps the last
    good fetch. So is an empty one (take 114 review): a footer of 0 over no
    rows carries its own count, and taken as read it would say every product
    left the list -- the run's history row gets no key instead, a hole, not
    'not on its list'. A product page is read for an item never read and for the
    oldest read more than a week ago, max_pages a run; what a page read found
    rides forward from the previous feed, and a page that fails keeps it. No
    page is started once `budget` seconds have passed since the run began; the
    rest wait for the next run, oldest first as ever."""
    t0 = clock()
    now = now or time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime())
    today = today or now[:10]
    page_get = getter or (lambda u: get(u, timeout=PAGE_TIMEOUT_S))
    getter = getter or get
    out = {"ok": False, "fetched_at": now, "calls": 0, "pages_read": 0, "pages_failed": 0, "pages_skipped": 0}
    try:
        r = parse_listing(getter(CATEGORY)); out["calls"] += 1
        if len(r["items"]) != r["count"]:
            raise ValueError(f"the footer says {r['count']} items and the table carries {len(r['items'])}")
        if not r["items"]:
            raise ValueError("the listing is empty (footer 0, no rows): a broken page, not nothing listed")
        prev ={it["id"]: it for it in ((previous or {}).get("items") or [])} if (previous or {}).get("ok") else {}
        for it in r["items"]:
            it["state"] = state_of(it, today)
            old = prev.get(it["id"]) or {}
            if old.get("page"):
                it["page"] = old["page"]
        due = sorted((it for it in r["items"] if not it.get("page") or _age_days(it["page"].get("read_at"), now) >= PAGE_EVERY_DAYS),
                     key=lambda it: (it.get("page") or {}).get("read_at") or "")
        for n, it in enumerate(due[:max_pages]):
            if clock() - t0 >= budget:
                out["pages_skipped"] = len(due[:max_pages]) - n; out["budget_spent"] = True
                break
            if pause:
                time.sleep(pause)
            out["calls"] += 1
            try:
                pg = parse_product(page_get(it["url"]))
                if pg["item"] != it["item"]:                  # a page for another product (a redirect, a reused id) is not this one's
                    raise ValueError(f"the page names item {pg['item']}, the listing {it['item']}")
                pg["read_at"] = now; it["page"] = pg; it.pop("page_error", None); out["pages_read"] += 1
            except Exception as e:                            # noqa: BLE001
                it["page_error"] = f"{type(e).__name__}: {str(e)[:80]}"; out["pages_failed"] += 1
        out.update({"ok": True, "items": r["items"], "count": r["count"]})
    except Exception as e:                                   # noqa: BLE001
        out["error"] = f"{type(e).__name__}: {str(e)[:120]}"
    return out


FIXTURE_TODAY = "2026-09-24"                      # the day the pages were saved: states are read as of then
FIXTURE_PAGES = {"81327": "southern_product_op19.html", "78743": "southern_product_eb05.html", "79312": "southern_product_dp13.html"}


def from_fixture(listing_path, product_dir):
    """The saved pages as a source, dated the day they were saved, so smoke sees
    the same states every run. The three saved product pages stand for the
    items whose pages were read; the rest have no page read yet."""
    import os
    pages = {k: open(os.path.join(product_dir, v), encoding="utf8").read() for k, v in FIXTURE_PAGES.items()}
    now = time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime())
    r = fetch(getter=lambda u: open(listing_path, encoding="utf8").read() if u == CATEGORY else pages[re.search(r"/p(\d+)/$", u).group(1)],
              now=now, today=FIXTURE_TODAY, pause=0, max_pages=0)
    for it in r.get("items", []):
        if it["id"] in pages:
            it["page"] = parse_product(pages[it["id"]]); it["page"]["read_at"] = now
    r["fixture"] = True
    return r


def selftest(listing_html, product_pages, out=print):
    """product_pages: {id: html} for the saved product pages."""
    ok = True
    def check(name, cond, note=""):
        nonlocal ok; out(f"  {'ok  ' if cond else 'FAIL'}  {name}{('  ' + note) if note else ''}"); ok &= bool(cond)
    r = parse_listing(listing_html); by = {i["id"]: i for i in r["items"]}
    check("southern listing parse: the footer's count and the rows it promises", r["count"] == 20 and len(r["items"]) == 20, f"count {r['count']}, {len(r['items'])} rows")
    check("every item: an id, its page on the distributor, a name, an item number, a presell ribbon",
          all(i["id"] and i["url"].startswith(BASE) and i["url"].endswith(f"/p{i['id']}/") and i["name"] and i["item"] and i["presell"] for i in r["items"]))
    check("dates: release and order-due as ISO (OP-19: out 2027-03-05, stores' orders due 2026-08-26)", by["81327"]["release"] == "2027-03-05" and by["81327"]["due"] == "2026-08-26")
    states = {k: state_of(by[k], FIXTURE_TODAY) for k in ("82337", "81327", "78742", "78743")}
    check("the states from the dates, on the day the page was saved: PEB-01 open to orders (due Oct 14), OP-19 closed, SD-01 released, EB-05 closed",
          states == {"82337": "orders_open", "81327": "orders_closed", "78742": "released", "78743": "orders_closed"}, json.dumps(states))
    check("the set code comes from the item number: OP19, SD01, PEB01, and DP14 where the name says DP-15; none on sleeves or a gift collection",
          by["81327"]["codes"] == ["OP19"] and by["78742"]["codes"] == ["SD01"] and by["82337"]["codes"] == ["PEB01"] and by["81328"]["codes"] == ["DP14"] and by["79305"]["codes"] == [] and by["80216"]["codes"] == [],
          json.dumps({k: by[k]["codes"] for k in ("81328", "79305", "80216")}))
    p19, p05, p13 = (parse_product(product_pages[k]) for k in ("81327", "78743", "79312"))
    check("a product page: its item number, its release and a prerelease day where it has one, the unit it is sold as",
          p19["item"] == "BANTCGOPOP19" and p19["release"] == "2027-03-05" and p19["prerelease"] == "2027-02-26" and p19["sold_as"] == "BOX" and p05["prerelease"] is None and p13["sold_as"] == "DISPLAY", json.dumps([p19, p13]))
    check("the flags: brick-and-mortar restricted on the EB-05 pack and not on OP-19; allocation on both (every presell here)",
          p05["restricted"] is True and p19["restricted"] is False and p19["allocation"] is True and p05["allocation"] is True)
    check("retail_title: the prefix and the count go, the item's code leads, a Display sold as one says so, a lone booster is the box",
          retail_title("Bandai - One Piece Card Game: OP-19 Booster Box", ["OP19"], "BOX") == "OP19 BOOSTER BOX"
          and retail_title("Bandai - One Piece Card Game: DP-13 Double Pack Set 13", ["DP13"], "Display") == "DP13 DOUBLE PACK SET 13 DISPLAY"
          and retail_title("Bandai - One Piece Card Game: Double Pack Set 14 DP-15", ["DP14"]) == "DP14 DOUBLE PACK SET 14"
          and retail_title("Bandai - One Piece Card Game: ST-37 Starter Deck 37 6CT", ["ST37"], "Display") == "ST37 STARTER DECK 37 DISPLAY"
          and retail_title("Bandai - One Piece Card Game: Premium Extra Booster (PEB-01)", ["PEB01"]) == "PEB01 PREMIUM EXTRA BOOSTER BOX",
          retail_title("Bandai - One Piece Card Game: Premium Extra Booster (PEB-01)", ["PEB01"]))
    # controls: a changed shape is a failure, not a quiet empty
    for label, bad in (("a page without the listing's headings", "<html><body>nothing here</body></html>"),
                       ("a listing whose headings changed", listing_html.replace(">Order Due<", ">Ships<")),
                       ("a listing without its footer count", re.sub(r'class="pageresults">\s*\d+ items', 'class="pageresults">', listing_html))):
        try:
            parse_listing(bad); check(f"control: {label} is refused", False)
        except ValueError:
            check(f"control: {label} is refused", True)
    try:
        parse_product("<html><body>no product here</body></html>"); check("control: a product page without its block is refused", False)
    except ValueError:
        check("control: a product page without its block is refused", True)
    short = fetch(getter=lambda u: re.sub(r'class="pageresults">\s*20 items', 'class="pageresults">21 items', listing_html), pause=0, max_pages=0, today=FIXTURE_TODAY)
    check("control: a table that carries fewer rows than its footer promises is a failed fetch, not a short list", short["ok"] is False and "footer says 21" in short.get("error", ""), short.get("error"))
    # take 114 review: an empty table under a footer of 0 carries its own count, so the count check alone passes it
    bare = re.sub(r'class="pageresults">\s*20 items', 'class="pageresults">0 items', re.sub(r'<tr class="productListing">.*?</tr>', "", listing_html, flags=re.S))
    landed = parse_listing(bare)
    empty = fetch(getter=lambda u: bare, pause=0, max_pages=0, today=FIXTURE_TODAY)
    real = fetch(getter=lambda u: listing_html, pause=0, max_pages=0, today=FIXTURE_TODAY)
    check("control: an empty listing (footer 0, no rows) is a failed fetch, not every product off the list -- the real page still reads",
          landed == {"count": 0, "items": []} and empty["ok"] is False and "empty" in empty.get("error", "") and real["ok"] and real["count"] == len(real["items"]) == 20,
          f"emptied page parses to {landed}; fetch: {empty.get('error')}")
    pages = {k: v for k, v in product_pages.items()}
    def getter(u):
        if u == CATEGORY:
            return listing_html
        k = re.search(r"/p(\d+)/$", u).group(1)
        if k not in pages:
            raise OSError("HTTP Error 404")
        return pages[k]
    whole = fetch(getter=getter, pause=0, max_pages=25, today=FIXTURE_TODAY, now="2026-09-24T12:00:00Z")
    read = sorted(i["id"] for i in whole.get("items", []) if i.get("page"))
    check("a whole fetch: one listing call and a page call per unread item; the three saved pages read, the other 17 failed and said so",
          whole["ok"] and whole["count"] == 20 and whole["calls"] == 21 and whole["pages_read"] == 3 and whole["pages_failed"] == 17 and read == sorted(FIXTURE_PAGES)
          and all(i.get("page_error") for i in whole["items"] if i["id"] not in FIXTURE_PAGES), json.dumps({k: whole.get(k) for k in ("calls", "pages_read", "pages_failed", "error")}))
    later = fetch(previous=whole, getter=getter, pause=0, max_pages=0, today=FIXTURE_TODAY, now="2026-09-25T12:00:00Z")
    carried = sorted(i["id"] for i in later.get("items", []) if i.get("page"))
    check("the three page reads ride forward to the next run with no second read", later["ok"] and carried == read and later["calls"] == 1, f"{carried}, {later.get('calls')} call(s)")
    week = fetch(previous=later, getter=getter, pause=0, max_pages=3, today="2026-10-02", now="2026-10-02T12:00:00Z")
    order = [i["id"] for i in sorted(week.get("items", []), key=lambda i: (i.get("page") or {}).get("read_at") or "") if i.get("page") and i["page"]["read_at"] == "2026-10-02T12:00:00Z"]
    check("a week on, the unread come first and the cap holds: three calls a run past the listing", week["ok"] and week["calls"] == 4 and not order, f"{week.get('calls')} calls, re-read {order}")
    stale = fetch(previous=later, getter=getter, pause=0, max_pages=25, today="2026-10-02", now="2026-10-02T12:00:00Z")
    check("...and with room, the week-old pages are read again beside every unread one", stale["ok"] and stale["calls"] == 21 and stale["pages_read"] == 3, str(stale.get("calls")))
    wrong = fetch(getter=lambda u: listing_html if u == CATEGORY else product_pages["81327"], pause=0, max_pages=2, today=FIXTURE_TODAY)
    check("control: a page that names another item is not taken as this item's", wrong["ok"] and wrong["pages_read"] == 0 and wrong["pages_failed"] == 2
          and "names item BANTCGOPOP19" in (wrong["items"][0].get("page_error") or ""), str(wrong["items"][0].get("page_error")))
    tick = [0.0]
    def slow(u):                                      # every page takes 40 s of the clock: a host that hangs
        if u != CATEGORY:
            tick[0] += 40
        return getter(u)
    hung = fetch(getter=slow, pause=0, max_pages=25, today=FIXTURE_TODAY, clock=lambda: tick[0])
    check("a host that hangs spends the budget, not the hourly job: no page is started 90 s in, and the rest wait for the next run",
          hung["ok"] and hung["calls"] == 4 and hung.get("budget_spent") is True and hung["pages_skipped"] == 17 and tick[0] == 120,
          json.dumps({k: hung.get(k) for k in ("calls", "pages_skipped", "budget_spent")}))
    tick[0] = 0.0
    calm = fetch(getter=getter, pause=0, max_pages=25, today=FIXTURE_TODAY, clock=lambda: tick[0])
    check("...control: with the clock standing still every due page is tried and nothing is skipped", calm["calls"] == 21 and calm["pages_skipped"] == 0 and "budget_spent" not in calm,
          json.dumps({k: calm.get(k) for k in ("calls", "pages_skipped")}))
    dead = fetch(getter=lambda u: (_ for _ in ()).throw(OSError("HTTP Error 503")), pause=0)
    check("control: a refused host is a failed fetch with the reason, never a raise", dead["ok"] is False and "503" in dead["error"])
    return ok
