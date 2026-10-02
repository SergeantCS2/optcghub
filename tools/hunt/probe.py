#!/usr/bin/env python3
"""tools/hunt/probe.py -- what a retailer answers a plain request from WHERE THIS RUNS.

A32's rule: a source is measured on the runner first. A probe from a session VM
or a PC proves nothing about the GitHub-hosted runner the hourly feed runs on,
and a guessed URL proves little either way (take 72). So this is run BY the
runner, through probe.yml (workflow_dispatch), and its bodies ride the run as
an artifact for a week. It is a measurement, never a feed: nothing it reads
reaches www/.

    python3 tools/hunt/probe.py [--zip 48329] [--only walmart-search,...] [--out probe-out]

One request per line of PROBES, a phone browser's user agent, a 40 s deadline,
then one row: status, bytes, the bot walls the body names, One Piece hits, and
for a page that carries its own JSON (Walmart's __NEXT_DATA__) what that JSON
holds -- items, prices, store ids, fulfillment keys. Honest about absence: an
empty price is printed as empty, never as zero.
"""
import argparse, json, os, re, sys, time, urllib.parse, urllib.request, urllib.error

UA = "Mozilla/5.0 (Linux; Android 14; SM-F966U) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/128.0 Mobile Safari/537.36"
WALLS = ("captcha", "challenge", "Access Denied", "Robot or human", "px-captcha", "Just a moment", "incapsula", "akamai")
STORE_QUERY = "/orchestra/home/graphql/storeFinderNearbyNodesQuery/d99972cb2bebae830d3024353653c48d935f157bb846c0980e7ab0ab4b744e98"


def probes(zip_code):
    z = zip_code
    return [
        ("walmart-search", f"https://www.walmart.com/search?q=one+piece+card+game", {}),
        ("walmart-stores", f"https://www.walmart.com/store/finder?location={z}", {}),
        ("walmart-item", "https://www.walmart.com/ip/16850770458", {}),
        # the same item with a store named the way the site's own cookie names it: does a price or a shelf appear?
        ("walmart-item-store", "https://www.walmart.com/ip/16850770458", {"Cookie": "assortmentStoreId=2648; hasLocData=1"}),
        # the request the store finder's own page makes for its list (read off a real browser, take 130): a
        # persisted GraphQL query by hash, the zip and radius in `variables`; the finder page itself carries no stores
        ("walmart-stores-api", "https://www.walmart.com" + "%s?variables=" % STORE_QUERY + urllib.parse.quote(json.dumps({"input": {"postalCode": z, "nodeTypes": ["STORE"], "accessTypes": ["PICKUP_INSTORE", "PICKUP_CURBSIDE"], "radius": 50}})), {"Accept": "application/json"}),
        ("hottopic-search", "https://www.hottopic.com/search?q=one+piece+card+game", {}),
        ("gamestop-search", "https://www.gamestop.com/search/?q=one+piece+card+game", {}),
        ("gamestop-stores", f"https://www.gamestop.com/on/demandware.store/Sites-gamestop-us-Site/default/Stores-FindStores?postalCode={z}&radius=50", {}),
        ("bn-search", "https://www.barnesandnoble.com/s/one%20piece%20card%20game", {}),
        ("meijer-search", "https://www.meijer.com/shopping/search.html?text=one+piece+card+game", {}),
        ("fivebelow-search", "https://www.fivebelow.com/search?q=one+piece+card+game", {}),
        ("target-search", "https://www.target.com/s?searchTerm=one+piece+card+game", {}),
    ]


def fetch(url, extra=None, timeout=40):
    h = {"User-Agent": UA, "Accept": "text/html,application/xhtml+xml,application/json", "Accept-Language": "en-US,en;q=0.9"}
    h.update(extra or {})
    req = urllib.request.Request(url, headers=h)
    try:
        with urllib.request.urlopen(req, timeout=timeout) as r:
            return r.status, r.read(), ""
    except urllib.error.HTTPError as e:
        try:
            body = e.read()
        except Exception:
            body = b""
        return e.code, body, ""
    except Exception as e:  # a refused connection, a deadline: the row says so
        return "ERR", b"", str(e)[:80]


def next_data(body):
    m = re.search(rb'<script[^>]*id="__NEXT_DATA__"[^>]*>(.*?)</script>', body, re.S)
    if not m:
        return None
    try:
        return json.loads(m.group(1))
    except Exception:
        return None


def walk(o):
    if isinstance(o, dict):
        yield o
        for v in o.values():
            yield from walk(v)
    elif isinstance(o, list):
        for v in o:
            yield from walk(v)


def walmart_summary(name, d):
    """What the page's own JSON carries, by name: items on a search, stores on the finder, the product on an item page."""
    if d is None:
        return "no __NEXT_DATA__"
    if name.startswith("walmart-search"):
        items = {o["usItemId"]: o for o in walk(d) if isinstance(o.get("name"), str) and "usItemId" in o}
        op = [i for i in items.values() if "one piece" in i["name"].lower()]
        priced = [i for i in items.values() if (i.get("priceInfo") or {}).get("linePrice")]
        sellers = sorted({i.get("sellerName") for i in items.values() if i.get("sellerName")})[:4]
        stores = sorted({str(v) for o in walk(d) for k, v in o.items() if k == "storeId"})[:4]
        return f"items {len(items)}, one piece {len(op)}, priced {len(priced)}, sellers {sellers}, storeId values {stores}"
    if name.startswith("walmart-stores"):
        stores = [o for o in walk(d) if isinstance(o.get("id"), (str, int)) and (o.get("displayName") or o.get("storeType")) and (o.get("address") or o.get("distance") is not None)]
        return f"stores {len(stores)}: " + "; ".join(f"{o.get('id')} {o.get('displayName') or ''} {o.get('distance') or ''}".strip() for o in stores[:4])
    if name.startswith("walmart-item"):
        prod = next((o for o in walk(d) if isinstance(o.get("name"), str) and ("usItemId" in o or "availabilityStatus" in o)), None)
        if not prod:
            return "no product object"
        pi = prod.get("priceInfo") or {}
        cur = pi.get("currentPrice")
        price = pi.get("linePrice") or (cur.get("priceString") if isinstance(cur, dict) else cur) or ""
        keys = sorted(k for k in prod if re.search(r"(?i)fulfil|store|pickup|avail|seller", k))
        fo = prod.get("fulfillmentOptions")
        return (f"product {prod.get('usItemId')} '{prod['name'][:50]}', price '{price}', availability '{prod.get('availabilityStatus') or ''}', "
                f"seller '{prod.get('sellerName') or ''}', fulfillmentOptions {len(fo) if isinstance(fo, list) else fo}, keys {keys[:10]}")
    return ""


def walmart_api_summary(body):
    """The store finder's own query answers JSON, not a page: the nodes it names, or what it said instead."""
    try:
        d = json.loads(body)
    except Exception:
        return "not JSON"
    nodes = ((d.get("data") or {}).get("nearByNodes") or {}).get("nodes") or []
    if nodes:
        return f"nodes {len(nodes)}: " + "; ".join(f"{n.get('id')} {n.get('displayName') or n.get('name') or ''} {n.get('distance') or ''} mi" for n in nodes[:4])
    return "no nodes: " + json.dumps(d)[:160]


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--zip", default="48329")
    ap.add_argument("--only", default="")
    ap.add_argument("--out", default="probe-out")
    a = ap.parse_args()
    only = {x.strip() for x in a.only.split(",") if x.strip()}
    os.makedirs(a.out, exist_ok=True)
    print(f"probe -- {time.strftime('%Y-%m-%dT%H:%M:%SZ', time.gmtime())} -- zip {a.zip} -- from {os.environ.get('RUNNER_NAME') or 'this machine'}")
    print(f"{'probe':<20} {'status':>6} {'bytes':>8} {'onepiece':>8}  walls / what the page carries")
    for name, url, extra in probes(a.zip):
        if only and name not in only:
            continue
        status, body, err = fetch(url, extra)
        text = body.decode("utf-8", "replace")
        walls = [w for w in WALLS if w.lower() in text.lower()]
        op = len(re.findall(r"(?i)one piece", text))
        with open(os.path.join(a.out, name + ".html"), "wb") as f:
            f.write(body)
        extra_note = walmart_api_summary(body) if name == "walmart-stores-api" else walmart_summary(name, next_data(body)) if name.startswith("walmart") else ""
        if 0 < len(body) < 20000:   # a small page is a wall or a stub more often than a listing: say what it says
            title = re.search(r"(?is)<title>(.*?)</title>", text)
            words = re.sub(r"(?is)<script.*?</script>|<style.*?</style>|<[^>]+>", " ", text)
            words = re.sub(r"\s+", " ", words).strip()
            extra_note += ("  " if extra_note else "") + f"title '{(title.group(1).strip() if title else '')[:60]}' text '{words[:140]}'"
        print(f"{name:<20} {str(status):>6} {len(body):>8} {op:>8}  {','.join(walls) or '-'}{'  ' + err if err else ''}{'  ' + extra_note if extra_note else ''}")
        time.sleep(1.5)
    print(f"bodies under {a.out}/")


if __name__ == "__main__":
    main()
