#!/usr/bin/env python3
"""Assemble www/ — the shipped app plus its catalogue bundle.

`src/app.html` is the source of truth and the only file a human edits. This
splits it into www/index.html + www/app.js so that smoke.mjs can execute the
SHIPPED code rather than a copy of it (APEX landmine 39), and emits the
catalogue the app reads.

The version stamp is written into the BUILT artifact, not the source, because a
stamp that lives in src/ is a stamp that lies whenever www/ is stale
(APEX landmine 75).
"""
import gzip, json, os, re, shutil, sqlite3, sys
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from config import CATALOG_DB, MANIFEST, ROOT

SRC = os.path.join(ROOT, "src", "app.html")
WWW = os.path.join(ROOT, "www")
BUNDLE = os.path.join(WWW, "bundle")


def take():
    for line in open(os.path.join(ROOT, "BUILD")):
        if line.startswith("VAULT_TAKE="):
            return int(line.split("=", 1)[1])
    raise SystemExit("BUILD has no VAULT_TAKE")


def catalogue_json(db):
    """Compact arrays, not objects. 6,860 printings as {"k":[...],"r":[[...]]}
    is roughly a third the size of a list of dicts and parses faster."""
    # Set KIND, for the picker's likelihood order (take 16). MEASURED: dearest-
    # first put a promo printing on top for 49.8% of ambiguous numbers, and a
    # collector holding a main-set common was shown the wrong default every
    # time. Print runs are the prior: main sets >> starter decks >> event promos.
    def kind(name):
        n = name.lower()
        if any(k in n for k in ("release event", "event pack", "promotion", "promo", "demo",
                                "judge", "gift", "anniversary", "premium", "celebration",
                                "regional", "championship", "tournament", "pirates party")):
            return "promo"
        if "deck" in n:
            return "deck"
        return "main"
    sets = [dict(id=r[0], abbr=r[1], name=r[2], pub=r[3], n=r[4], kind=kind(r[2]))
            for r in db.execute("SELECT group_id,abbr,name,published_on,card_count "
                                "FROM card_set WHERE card_count>0 ORDER BY published_on DESC")]
    cols = ["sealed", "id", "set", "num", "name", "full", "treat", "sameart", "face", "prov",
            "award", "rarity", "type", "color", "cost", "power", "life", "counter",
            "attr", "subtypes", "kw", "text", "img",
            "market", "low", "high", "sub", "hash",
            "d1a", "d1p", "d7a", "d7p", "d30a", "d30p", "mxa", "mxp"]
    # ONE row per printing. A printing sold as both Normal and Foil has two
    # price rows, and a naive LEFT JOIN silently emits it twice -- take 2 shipped
    # 6,880 rows for 6,860 cards and the count was the only thing that showed it
    # (landmine 44). Collapse to the dearer sub-type, which is the one a
    # collector is overwhelmingly likely to be holding for this game.
    rows = db.execute("""
        SELECT p.is_sealed, p.product_id, p.group_id, p.number, p.name, p.full_name,
               p.treatment, p.same_art, p.face_class, p.provenance, p.award, p.rarity,
               p.card_type, p.color, p.cost, p.power, p.life, p.counterplus,
               p.attribute, p.subtypes, p.keywords, p.text, p.image_url,
               x.market, x.low, x.high, x.sub_type, h.dhash,
               dl.d1_abs, dl.d1_pct, dl.d7_abs, dl.d7_pct,
               dl.d30_abs, dl.d30_pct, dl.max_abs, dl.max_pct
          FROM printing p
          LEFT JOIN (
                SELECT product_id, sub_type, market, low, high
                  FROM price
                 WHERE (product_id, IFNULL(market,-1)) IN (
                       SELECT product_id, MAX(IFNULL(market,-1))
                         FROM price GROUP BY product_id)
                 GROUP BY product_id
          ) x ON x.product_id = p.product_id
          LEFT JOIN printing_hash h ON h.product_id = p.product_id
          LEFT JOIN price_delta dl ON dl.product_id = p.product_id
         ORDER BY p.is_sealed, p.number""").fetchall()
    ids = [r[1] for r in rows]
    if len(set(ids)) != len(ids):
        raise SystemExit(f"build_app: {len(ids)-len(set(ids))} duplicate printings "
                         f"in the bundle -- the price join is fanning out (landmine 44)")
    # number -> {n, lo, hi, safe} and the same scoped to a set
    ng = {r[0]: r[1:] for r in db.execute(
        "SELECT number,n,lo,hi,safe FROM number_group")}
    ngs = {f"{r[0]}:{r[1]}": r[2:] for r in db.execute(
        "SELECT group_id,number,n,lo,hi,safe FROM number_group_in_set")}
    # The scanner's two lookup tables, shipped so the hot path is a lookup
    # (landmine 8). The valid-number set turns a wrong OCR read into a NO read
    # (landmine 65: 8% -> 2% confidently-wrong, at zero cost to recall).
    valid = sorted({r[3] for r in rows if r[3]})
    star = None
    sp = os.path.join(os.path.dirname(CATALOG_DB), "star_template.json")
    if os.path.exists(sp):
        star = json.load(open(sp))
    # Daily price history (take 20, ROADMAP 4.2). `days` is the sorted list of
    # dates on file; `hist` maps product_id -> array aligned to `days`, null
    # where that day had no price. Two days today; up to 200 as it accrues.
    # Sized: 7,300 products x 200 days x ~6 chars ~ 9 MB raw, ~1 MB gz at the
    # window's end -- acceptable inside the APK (landmine 8's "small" still
    # holds at 30 MB total), and revisited if it does not.
    days, hist = [], {}
    try:
        import history
        h = history.load(); days = sorted(h)
        ids_with_num = {r[cols.index("id")] for r in rows}
        for d in days:
            for pid, m in h[d].items():
                if int(pid) in ids_with_num:
                    hist.setdefault(pid, [None] * len(days))
        for di, d in enumerate(days):
            for pid, m in h[d].items():
                if pid in hist:
                    hist[pid][di] = round(m, 2)
    except Exception as e:                                # noqa: BLE001
        print(f"   note: price history not bundled: {e}")
    return {"sets": sets, "cols": cols, "rows": rows, "ng": ng, "ngs": ngs,
            "valid_numbers": valid, "star": star, "days": days, "hist": hist}


def build(verbose=True):
    n = take()
    # Clean, not just create. A step that only ever adds leaves every file it
    # has ever produced: the take-5 removal of catalog.json.gz from the bundle
    # did nothing, because the stale copy was still on disk and Capacitor
    # happily synced it into the APK, where it broke mergeReleaseAssets exactly
    # as before (landmine 57). Same family as APEX landmine 32.
    if os.path.isdir(BUNDLE):
        shutil.rmtree(BUNDLE)
    os.makedirs(BUNDLE)
    src = open(SRC).read()

    # split the single-file source into index.html + app.js
    m = re.search(r"<script id=\"app\">\n(.*?)\n\s*</script>", src, re.S)
    if not m:
        raise SystemExit("build_app: no <script id=\"app\"> block in src/app.html")
    js = m.group(1)
    html = src[:m.start()] + '<script src="app.js"></script>' + src[m.end():]

    # Inline the glyph sprite (assets/glyphs.svg) so <use href="#g-…"> resolves
    # with no request -- PROTOCOL §8. One file is the only source of every icon.
    sprite = open(os.path.join(ROOT, "assets", "glyphs.svg")).read()
    marker = "<!-- __GLYPHS__"
    assert marker in html, "src/app.html has no __GLYPHS__ slot"
    html = re.sub(r"<!-- __GLYPHS__.*?-->", sprite, html, count=1, flags=re.S)
    # privacy.html rides in www/ so Pages serves it beside the app (A21 #6).
    shutil.copy(os.path.join(ROOT, "src", "privacy.html"), os.path.join(WWW, "privacy.html"))
    assert '<symbol id="g-compass"' in html, "glyph sprite did not inline"
    html = html.replace("__TAKE__", str(n))
    js = js.replace("__TAKE__", str(n))
    if "__TAKE__" in html or "__TAKE__" in js:
        raise SystemExit("build_app: unreplaced __TAKE__ remains")

    open(os.path.join(WWW, "index.html"), "w").write(html)
    open(os.path.join(WWW, "app.js"), "w").write(js)

    db = sqlite3.connect(CATALOG_DB)
    cat = catalogue_json(db)
    raw = json.dumps(cat, separators=(",", ":")).encode()
    open(os.path.join(BUNDLE, "catalog.json"), "wb").write(raw)
    # The .gz goes OUTSIDE www/. Android's asset merger treats catalog.json and
    # catalog.json.gz as the SAME asset and fails mergeReleaseAssets with
    # "Duplicate resources" -- found by the first real Gradle build at take 5,
    # landmine 57. It was only ever a size figure for the record anyway: the
    # catalogue ships inside the APK (landmine 8) and Android compresses assets
    # itself, so a hand-rolled .gz next to it buys nothing and breaks the build.
    gz_path = os.path.join(os.path.dirname(CATALOG_DB), "catalog.json.gz")
    with gzip.open(gz_path, "wb", 9) as f:
        f.write(raw)

    # User-supplied pictures (assets/user/README.md). Whatever exists is copied;
    # the manifest lists names so the app can decide per slot. Nothing required.
    udir = os.path.join(ROOT, "assets", "user")
    user = []
    if os.path.isdir(udir):
        os.makedirs(os.path.join(BUNDLE, "user"), exist_ok=True)
        for fn in sorted(os.listdir(udir)):
            if fn.lower().endswith((".jpg", ".jpeg", ".png", ".webp")):
                shutil.copy(os.path.join(udir, fn), os.path.join(BUNDLE, "user", fn))
                user.append(fn)
    man = json.load(open(MANIFEST))
    man["user"] = user
    man["game"] = "optcg"        # A19: the data model knows its game from take 23
    from config import UPDATE_URL
    man["updateUrl"] = UPDATE_URL or None
    # A17: the app reads its ad configuration from the manifest, never from
    # code, so a unit-ID change is a config change. ADS_ENABLED in the app is
    # derived: units present AND running under Capacitor.
    from config import (ADMOB_APP_ID, ADMOB_REWARD_SCAN, ADMOB_REWARD_DECK, ADMOB_IS_TEST,
                        CREDITS_FREE_ON_INSTALL, CREDITS_PER_AD, DECKS_FREE, DECKS_PER_AD)
    man["ads"] = {"app": ADMOB_APP_ID, "scan": ADMOB_REWARD_SCAN, "deck": ADMOB_REWARD_DECK,
                  "test": ADMOB_IS_TEST,
                  "free": CREDITS_FREE_ON_INSTALL, "perAd": CREDITS_PER_AD,
                  "decksFree": DECKS_FREE, "decksPerAd": DECKS_PER_AD}
    man["take"] = n
    man["printings"] = len(cat["rows"])
    man["hashed"] = sum(1 for r in cat["rows"]
                        if r[cat["cols"].index("hash")] is not None)
    d1 = cat["cols"].index("d1p")
    man["with_delta"] = sum(1 for r in cat["rows"] if r[d1] is not None)
    try:
        import history
        man["history_days"] = sorted(history.load())
    except Exception:                                     # noqa: BLE001
        man["history_days"] = []
    json.dump(man, open(os.path.join(BUNDLE, "manifest.json"), "w"), indent=1)

    if verbose:
        gz = os.path.getsize(gz_path)
        print(f"   www/ take {n}  ·  {len(cat['rows'])} printings  "
              f"·  catalog {len(raw)/1e6:.1f} MB raw, {gz/1e6:.2f} MB gz")
    return man


if __name__ == "__main__":
    build()
