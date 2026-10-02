#!/usr/bin/env python3
"""tools/hunt/walmart.py -- Walmart, read from its item pages (A32, take 130).

MEASURED on a GitHub-hosted runner (probe run 1, 2 Oct 2026): an item page,
`/ip/<id>`, is served whole to a plain request with a phone's user agent, and
the page's own JSON carries the product -- price, availability, the marketplace
seller, the fulfillment options, the store the site assumed from the IP. The
search page is served too, but Walmart's robots.txt disallows `/search`, so
the runner never asks for it: the items read here are a committed list
(walmart_items.json), refreshed by a person running `--discover` over a page
they saved themselves, never by the workflow.

What ships is what the page said and when: a price with its time, a status
with its time, the seller's name. A price the page did not carry is None,
never zero (PROTOCOL §10). A shelf for a zip of the collector's choosing is
NOT here: the site's store-finder query answered "Access Denied" to a plain
request (take 130), so the local layer waits on a measured way to ask.

    python3 tools/hunt/walmart.py --discover saved-search.html [--write]
"""
import json, os, re, sys, time, urllib.request, urllib.error

UA = "Mozilla/5.0 (Linux; Android 14) AppleWebKit/537.36 Chrome/128 Mobile Safari/537.36"   # the phone's; measured served (take 130)
BASE = "https://www.walmart.com"
HERE = os.path.dirname(os.path.abspath(__file__))
ITEMS_FILE = os.path.join(HERE, "walmart_items.json")
SKIP = re.compile(r"(?i)japan|mystery|\blot\b|bundle|graded|sound loader")   # not a catalogue product, or not the English game


def get(url, timeout=25):
    req = urllib.request.Request(url, headers={"User-Agent": UA, "Accept": "text/html,application/xhtml+xml", "Accept-Language": "en-US,en;q=0.9"})
    try:
        with urllib.request.urlopen(req, timeout=timeout) as r:
            return r.status, r.read().decode("utf-8", "replace")
    except urllib.error.HTTPError as e:
        return e.code, ""


def next_data(html):
    m = re.search(r'<script[^>]*id="__NEXT_DATA__"[^>]*>(.*?)</script>', html or "", re.S)
    if not m:
        return None
    try:
        return json.loads(m.group(1))
    except Exception:
        return None


def _price(pi):
    """A number the page states, or None. `currentPrice` is a dict on an item page and a string on a search tile;
    an empty string is absence, never zero."""
    if not isinstance(pi, dict):
        return None, ""
    cur = pi.get("currentPrice")
    if isinstance(cur, dict):
        p = cur.get("price")
        return (float(p) if isinstance(p, (int, float)) else None), (cur.get("priceString") or "")
    txt = pi.get("linePrice") or (cur if isinstance(cur, str) else "") or ""
    m = re.search(r"\$([\d,]+\.\d\d)", txt)
    return (float(m.group(1).replace(",", "")) if m else None), txt


def parse_item(html):
    """The product an item page carries, or None when the page carries none (a wall, a stub, a changed shape)."""
    d = next_data(html)
    try:
        prod = d["props"]["pageProps"]["initialData"]["data"]["product"]
    except (TypeError, KeyError):
        return None
    if not isinstance(prod, dict) or not prod.get("usItemId") or not isinstance(prod.get("name"), str):
        return None
    price, text = _price(prod.get("priceInfo"))
    options = [o.get("type") for o in (prod.get("fulfillmentOptions") or []) if isinstance(o, dict) and o.get("type")]
    loc = prod.get("location") if isinstance(prod.get("location"), dict) else {}
    return {"id": str(prod["usItemId"]), "title": prod["name"], "url": BASE + prod["canonicalUrl"] if (prod.get("canonicalUrl") or "").startswith("/") else BASE + "/ip/" + str(prod["usItemId"]),
            "price": price, "price_text": text, "status": prod.get("availabilityStatus") or None, "seller": prod.get("sellerName") or None,
            "options": options, "ships": "SHIPPING" in options, "pickup": "PICKUP" in options,
            "nearby": prod.get("availabilityInNearbyStore"), "assumed_zip": loc.get("postalCode") or None}


def parse_search(html):
    """The tiles a saved search page carries -- for a person's --discover, never the workflow."""
    d = next_data(html)
    try:
        stacks = d["props"]["pageProps"]["initialData"]["searchResult"]["itemStacks"]
    except (TypeError, KeyError):
        return []
    out, seen = [], set()
    for st in stacks or []:
        for it in (st.get("items") or []) if isinstance(st, dict) else []:
            if not isinstance(it, dict) or not it.get("usItemId") or not isinstance(it.get("name"), str) or it["usItemId"] in seen:
                continue
            seen.add(it["usItemId"])
            out.append({"id": str(it["usItemId"]), "title": it["name"], "url": BASE + it["canonicalUrl"] if (it.get("canonicalUrl") or "").startswith("/") else BASE + "/ip/" + str(it["usItemId"]),
                        "seller": it.get("sellerName") or None, "availability_text": it.get("availabilityStatusDisplayValue") or None})
    return out


def load_items(path=ITEMS_FILE):
    with open(path, encoding="utf-8") as f:
        return json.load(f)["items"]


def fetch(items=None, previous=None, max_calls=12, pause=2.0, now=None, get=get, sleep=time.sleep):
    """A run is a BUDGET of item pages, spent in a round-robin from the previous run's cursor; every item not read
    this run carries the previous feed's answer with its own time, so nothing unchecked is shown as checked."""
    items = items if items is not None else load_items()
    now = now or time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime())
    prev = previous if previous and previous.get("ok") else {}
    prev_by = {it["id"]: it for it in prev.get("items", [])}
    start = int(prev.get("cursor") or 0) % max(1, len(items))
    out = {"ok": False, "fetched_at": now, "items": [], "cursor": start, "calls": 0, "read": 0}
    order = items[start:] + items[:start]
    errors = []
    for n, it in enumerate(order):
        row = {"id": str(it["id"]), "title": it["title"], "url": it.get("url") or BASE + "/ip/" + str(it["id"])}
        old = prev_by.get(row["id"])
        if n < max_calls:
            status, html = get(row["url"])
            out["calls"] += 1
            sleep(pause)
            p = parse_item(html) if status == 200 else None
            if p:
                row["online"] = {"status": p["status"], "price": p["price"], "price_text": p["price_text"], "seller": p["seller"], "ships": p["ships"], "pickup": p["pickup"], "checked_at": now}
                row["title"] = p["title"] or row["title"]
                out["read"] += 1
            else:
                errors.append(f"{row['id']}: HTTP {status}" + ("" if status != 200 else ", no product in the page"))
                if old and old.get("online"):
                    row["online"] = old["online"]          # the last answer, with ITS time
        elif old and old.get("online"):
            row["online"] = old["online"]
        out["items"].append(row)
    out["cursor"] = (start + min(max_calls, len(order))) % max(1, len(items))
    out["ok"] = out["read"] > 0
    if errors:
        out["errors"] = errors[:12]
    if not out["ok"]:
        out["error"] = "; ".join(errors[:3]) or "no items"
    # the feed lists items in the committed order, whatever the cursor
    out["items"].sort(key=lambda r: [str(i["id"]) for i in items].index(r["id"]))
    return out


def from_fixture(path, now="2026-10-02T05:02:48Z"):
    """One item read from the saved real page, the rest of the committed list carried unchecked."""
    with open(path, encoding="utf-8") as f:
        html = f.read()
    p = parse_item(html)
    items = load_items()
    out = {"ok": bool(p), "fetched_at": now, "items": [], "cursor": 1, "calls": 1, "read": 1 if p else 0, "fixture": os.path.basename(path)}
    for it in items:
        row = {"id": str(it["id"]), "title": it["title"], "url": it.get("url") or BASE + "/ip/" + str(it["id"])}
        if p and row["id"] == p["id"]:
            row["online"] = {"status": p["status"], "price": p["price"], "price_text": p["price_text"], "seller": p["seller"], "ships": p["ships"], "pickup": p["pickup"], "checked_at": now}
            row["title"] = p["title"]
        out["items"].append(row)
    return out


def main(argv):
    if "--discover" in argv:
        path = argv[argv.index("--discover") + 1]
        with open(path, encoding="utf-8") as f:
            found = parse_search(f.read())
        have = {str(i["id"]) for i in load_items()} if os.path.exists(ITEMS_FILE) else set()
        new = [it for it in found if "one piece" in it["title"].lower() and not SKIP.search(it["title"]) and it["id"] not in have]
        print(f"{len(found)} tiles on the page, {len(new)} One Piece items not in the list:")
        for it in new:
            print(f"  {it['id']}  {it['title'][:90]}")
        if "--write" in argv and new:
            data = json.load(open(ITEMS_FILE, encoding="utf-8")) if os.path.exists(ITEMS_FILE) else {"items": []}
            data["items"] += [{"id": it["id"], "title": it["title"], "url": it["url"], "added": time.strftime("%Y-%m-%d")} for it in new]
            json.dump(data, open(ITEMS_FILE, "w", encoding="utf-8"), indent=1, ensure_ascii=False)
            print(f"written: {len(data['items'])} items in {os.path.relpath(ITEMS_FILE)}")
        return 0
    print(__doc__)
    return 1


if __name__ == "__main__":
    sys.exit(main(sys.argv[1:]))
