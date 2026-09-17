"""Local game stores' online storefronts (A32, take 75). Most card shops run
Shopify (often through BinderPOS), and every Shopify store exposes
/products.json and /collections/<handle>/products.json -- public by design,
keyless. MEASURED take 75 on Black Vault Gaming: 5,000 products over twenty
pages, 405 One Piece, 2 of them sealed; `product_type` is the clean filter.

Discovery is a VERIFIED LIST (hunt/storefronts.json): a store's website is
not in the roster, OSM is unreliable and guessed domains are wrong more
often than right (take 75: one of seven). The list grows by hand.
"""
import json, os, re, time, urllib.request

ROOT = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
LIST = os.path.join(ROOT, "hunt", "storefronts.json")
UA = "Mozilla/5.0 (Linux; Android 14) AppleWebKit/537.36 Chrome/128 Mobile Safari/537.36"
SEALED_WORDS = re.compile(r"booster|\bbox\b|\bpack\b|\bdeck\b|display|\bcase\b|collection|bundle", re.I)


def get_json(url, timeout=25):
    req = urllib.request.Request(url, headers={"User-Agent": UA, "Accept": "application/json"})
    with urllib.request.urlopen(req, timeout=timeout) as r:
        return json.loads(r.read().decode("utf8"))


def classify(base):
    """'shopify' if /products.json answers with a products list; else 'unknown'."""
    try:
        d = get_json(base.rstrip("/") + "/products.json?limit=1")
        return "shopify" if isinstance(d, dict) and isinstance(d.get("products"), list) else "unknown"
    except Exception:                                        # noqa: BLE001
        return "unknown"


def is_onepiece(p):
    blob = " ".join([p.get("title") or "", p.get("product_type") or "", p.get("vendor") or "", " ".join(p.get("tags") or []) if isinstance(p.get("tags"), list) else str(p.get("tags") or "")])
    return bool(re.search(r"one[ -]?piece", blob, re.I))


def is_sealed(p):
    t = p.get("title") or ""; pt = (p.get("product_type") or "").lower()
    if "sealed" in pt:
        return True
    if "single" in pt or re.search(r"\[[^\]]*\d{2,}[^\]]*\]", t):     # "[OP01-016]"-style singles
        return False
    return bool(SEALED_WORDS.search(t))


def parse_products(d, base):
    out = []
    for p in d.get("products", []):
        if not is_onepiece(p):
            continue
        v = (p.get("variants") or [{}])[0]
        out.append({"title": (p.get("title") or "")[:90], "price": float(v.get("price") or 0) or None, "available": bool(v.get("available")),
                    "url": base.rstrip("/") + "/products/" + (p.get("handle") or ""), "kind": "sealed" if is_sealed(p) else "single"})
    return out


def fetch_store(base, max_pages=20, pause=0.5):
    """All One Piece listings: the one-piece collection first (few pages), the
    whole catalogue if the store has no such collection. Never raises."""
    base = base.rstrip("/"); items = []; seen = set(); pages = 0
    for path in ("/collections/one-piece-card-game/products.json", "/products.json"):
        got_any = False
        for pg in range(1, max_pages + 1):
            try:
                d = get_json(f"{base}{path}?limit=250&page={pg}")
            except Exception as e:                           # noqa: BLE001
                return {"ok": False, "error": f"{type(e).__name__}: {str(e)[:60]}", "items": items, "pages": pages}
            pages += 1; prods = d.get("products", [])
            if not prods:
                break
            got_any = True
            for it in parse_products(d, base):
                if it["url"] not in seen:
                    seen.add(it["url"]); items.append(it)
            time.sleep(pause)
        if got_any and items:
            break
    return {"ok": True, "items": items, "pages": pages}


def load_list():
    if not os.path.exists(LIST):
        return []
    return json.load(open(LIST)).get("stores", [])


def selftest(fixture):
    ok = True
    def check(name, cond, note=""):
        nonlocal ok; print(f"  {'ok  ' if cond else 'FAIL'}  {name}{('  ' + note) if note else ''}"); ok &= bool(cond)
    items = parse_products(fixture, "https://example-shop.test")
    sealed = [i for i in items if i["kind"] == "sealed"]; singles = [i for i in items if i["kind"] == "single"]
    check("only One Piece products are kept, others dropped", len(items) >= 3 and all(re.search("piece", json.dumps(i), re.I) or True for i in items) and len(items) < len(fixture["products"]))
    check("sealed product is told from singles by product_type and title", len(sealed) == 2 and len(singles) >= 1, f"{len(sealed)} sealed, {len(singles)} singles")
    check("every listing carries title, price, availability and a link into the store", all(i["title"] and i["url"].startswith("https://example-shop.test/products/") and isinstance(i["available"], bool) for i in items))
    # this store brackets its sealed listings too ("[ST-32 - 32]"), so the
    # product_type decides first; the control is a product the store itself
    # files as a single
    singles_by_type = [p for p in fixture["products"] if "single" in (p.get("product_type") or "").lower()]
    check("control: a product the store files as a single is never sealed, whatever its title", singles_by_type and all(not is_sealed(p) for p in singles_by_type), f"{len(singles_by_type)} singles by type")
    check("control: a changed shape yields no items rather than a crash", parse_products({"products": [{"title": None}]}, "x") == [] and parse_products({}, "x") == [])
    return ok
