"""Target, through the JSON its own site uses (RedSky). Keyless -- the key below
is the public constant every Target page carries -- and PROVEN from a cloud IP
at take 68 (search) and take 71 (nearby stores, per-store availability).

Three calls: nearby stores for a zip; a product search per keyword; and
availability per (product, store). A shape change in any of them is reported
as the source being broken, never as "no stock" (PROTOCOL §10).
"""
import json, time, urllib.parse, urllib.request

KEY = "9f36aeafbe60771e321a7cc95a78140772ab3e96"
UA = "Mozilla/5.0 (Linux; Android 14) AppleWebKit/537.36 Chrome/128 Mobile Safari/537.36"
BASE = "https://redsky.target.com/redsky_aggregations/v1/web/"
KEYWORDS = ["one piece card game booster box", "one piece card game booster pack", "one piece card game starter deck",
            "one piece card game extra booster", "one piece card game premium"]


def get(path, params, timeout=25):
    q = urllib.parse.urlencode(dict(params, key=KEY, channel="WEB"))
    req = urllib.request.Request(BASE + path + "?" + q, headers={"User-Agent": UA, "Accept": "application/json"})
    with urllib.request.urlopen(req, timeout=timeout) as r:
        return json.loads(r.read().decode("utf8"))


def parse_stores(d):
    return [{"id": s["store_id"], "name": s["location_name"], "miles": round(float(s.get("distance", 0)), 1)}
            for s in d["data"]["nearby_stores"]["stores"]]


def parse_search(d):
    out = []
    for p in d["data"]["search"]["products"]:
        it = p["item"]
        out.append({"tcin": p["tcin"], "title": it["product_description"]["title"],
                    "price": p.get("price", {}).get("current_retail"),
                    "url": "https://www.target.com" + it.get("enrichment", {}).get("buy_url", "")[len("https://www.target.com"):] if it.get("enrichment", {}).get("buy_url", "").startswith("https://www.target.com") else it.get("enrichment", {}).get("buy_url", "")})
    return out


def parse_fulfillment(d):
    f = d["data"]["product"]["fulfillment"]
    ship = f.get("shipping_options", {})
    stores = {}
    for o in f.get("store_options", []):
        stores[o["location_id"]] = {"qty": int(o.get("location_available_to_promise_quantity") or 0),
                                    "pickup": o.get("order_pickup", {}).get("availability_status"),
                                    "in_store": o.get("in_store_only", {}).get("availability_status")}
    return {"online": {"status": ship.get("availability_status"), "qty": int(ship.get("available_to_promise_quantity") or 0)}, "stores": stores}


def fetch(zips=("48329",), radius=50, max_calls=28, pause=2.0, per_zip_items=2, previous=None, now=None):
    """MEASURED take 72: RedSky allows roughly thirty calls per run from one IP
    even at a call a second (HTTP 435 after 33). So a run is a BUDGET of
    max_calls, spent in this order and carried over between runs:

      1. the product list -- re-searched only when the previous one is older
         than six hours (five calls), otherwise reused;
      2. the local layer -- per served zip, per-store stock for the next
         per_zip_items English items in a round-robin (cursor kept in the feed);
      3. the national layer -- online (shipping) stock for the next items in a
         second round-robin.

    Every item's online status and every shelf check carries the time it was
    last checked; nothing unchecked is ever shown as zero (PROTOCOL §10)."""
    now = now or time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime())
    prev = previous if previous and previous.get("ok") else {}
    out = {"ok": False, "fetched_at": now, "radius": radius, "zips": {}, "cursor": dict(prev.get("cursor") or {})}
    calls = 0; throttled = False
    def call(path, params):
        nonlocal calls, throttled
        if throttled or calls >= max_calls:
            raise RuntimeError("cap")
        try:
            r = get(path, params)
        except Exception as e:
            if "435" in str(e) or "429" in str(e):
                throttled = True; out["throttled_after"] = calls
            raise
        calls += 1; time.sleep(pause); return r
    try:
        # 1. the product list
        items = None
        age_h = None
        if prev.get("items") and prev.get("searched_at"):
            age_h = (time.mktime(time.strptime(now, "%Y-%m-%dT%H:%M:%SZ")) - time.mktime(time.strptime(prev["searched_at"], "%Y-%m-%dT%H:%M:%SZ"))) / 3600
        if prev.get("items") and age_h is not None and age_h < 6:
            items = [dict(i) for i in prev["items"]]; out["searched_at"] = prev["searched_at"]
        else:
            seen, items = set(), []
            for kw in KEYWORDS:
                for it in parse_search(call("plp_search_v2", {"keyword": kw, "page": "/s/" + kw.replace(" ", "+"), "pricing_store_id": "1251", "visitor_id": "0"})):
                    if it["tcin"] in seen or not it["price"]:
                        continue
                    seen.add(it["tcin"]); items.append(it)
            items.sort(key=lambda i: ("japanese" in i["title"].lower(), -(i["price"] or 0)))
            old = {i["tcin"]: i for i in prev.get("items", [])}
            for it in items:                                 # keep what the last run knew about an item still listed
                o = old.get(it["tcin"], {}); it["online"] = o.get("online"); it["online_at"] = o.get("online_at")
            out["searched_at"] = now
        for it in items:
            it.setdefault("online", None); it.setdefault("online_at", None)
        eng = [i for i in items if "japanese" not in i["title"].lower()]
        # 2. the local layer, round-robin per zip
        for z in zips:
            zz = dict(prev.get("zips", {}).get(z) or {"stores": [], "stock": {}, "checked_at": {}})
            zz = {"ok": zz.get("ok", False), "stores": list(zz.get("stores") or []), "stock": dict(zz.get("stock") or {}), "checked_at": dict(zz.get("checked_at") or {})}
            try:
                if not zz["stores"]:
                    zz["stores"] = parse_stores(call("nearby_stores_v1", {"limit": 8, "within": radius, "place": z}))
                start = int(out["cursor"].get("local:" + z, 0)) % max(1, len(eng))
                for k in range(per_zip_items):
                    it = eng[(start + k) % len(eng)] if eng else None
                    if not it:
                        break
                    st = {}
                    for s in zz["stores"]:
                        f = parse_fulfillment(call("product_fulfillment_v1", {"tcin": it["tcin"], "store_id": s["id"], "nearby": z, "radius": radius}))
                        st.update(f["stores"])
                    zz["stock"][it["tcin"]] = st; zz["checked_at"][it["tcin"]] = now
                    out["cursor"]["local:" + z] = (start + k + 1) % len(eng)
                zz["ok"] = True; zz.pop("error", None)
            except RuntimeError:
                zz["error"] = "budget spent before this zip's turn" if not zz["stock"] else None
                if zz["error"] is None: zz.pop("error")
            except Exception as e:                           # noqa: BLE001
                zz["error"] = f"{type(e).__name__}: {str(e)[:80]}"
            out["zips"][z] = zz
        # 3. the national layer, round-robin over every item
        start = int(out["cursor"].get("online", 0)) % max(1, len(items))
        for k in range(len(items)):
            it = items[(start + k) % len(items)]
            try:
                f = parse_fulfillment(call("product_fulfillment_v1", {"tcin": it["tcin"], "store_id": "1251"}))
                it["online"], it["online_at"] = f["online"], now
                out["cursor"]["online"] = (start + k + 1) % len(items)
            except RuntimeError:
                break
            except Exception as e:                           # noqa: BLE001
                it["online_error"] = str(e)[:60]
        out.update({"ok": True, "items": items, "calls": calls})
    except Exception as e:                                   # noqa: BLE001
        out["error"] = f"{type(e).__name__}: {str(e)[:120]}"
    return out
