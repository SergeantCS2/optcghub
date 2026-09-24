#!/usr/bin/env python3
"""Compute a 64-bit dHash of each printing's art window, and DISCARD the image.

Landmine 26. Card art belongs to Bandai, Shueisha, Toei and Viz. It is downloaded
inside the CI runner, hashed, and deleted. What ships is 8 bytes per printing —
55 KB for the whole game — which is derived data three orders of magnitude
removed from the work.

dHash rather than pHash on purpose: it compares adjacent pixels, so it is stable
under the brightness and gamma shifts that foil cards and phone auto-exposure
produce. It is nine lines and needs no DCT.

What this can and cannot do is measured, not assumed. See docs/AGENDA.md A5:
printings with genuinely different artwork separate cleanly; printings that are
the same art with a different foil treatment (parallel, textured, pirate, jolly
roger, reprint) do not, and are flagged `same_art` in the catalogue so the
scanner shows a picker instead of pretending.
"""
import concurrent.futures as cf
import io, os, re, sqlite3, sys, time, urllib.error, urllib.parse, urllib.request
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from config import CATALOG_DB, USER_AGENT, ROOT, ALT_IMAGE_CDN
try:
    from PIL import Image, ImageOps
except ImportError:                                      # --selftest fetches nothing; run() refuses below
    Image = ImageOps = None

# The art window as a fraction of the card face. A One Piece card puts the
# illustration in the upper two-thirds; cropping to it keeps the frame, the cost
# bubble and the text box — which are IDENTICAL across printings of a card — from
# dominating the hash and washing out the only signal that matters.
ART = (0.06, 0.11, 0.94, 0.62)

SIDECAR = os.path.join(os.path.dirname(CATALOG_DB), "hashes.json")


def dhash(img, size=8):
    g = ImageOps.grayscale(img).resize((size + 1, size), Image.LANCZOS)
    px = list(g.getdata())
    bits = 0
    for r in range(size):
        row = px[r * (size + 1):(r + 1) * (size + 1)]
        for c in range(size):
            bits = (bits << 1) | (1 if row[c] < row[c + 1] else 0)
    return bits


def hamming(a, b):
    return bin((a ^ b) & 0xFFFFFFFFFFFFFFFF).count("1")


def to_sqlite(h):
    """SQLite INTEGER is a SIGNED 64-bit value. A 64-bit unsigned dHash with the
    top bit set raises OverflowError on insert — which is exactly what happened
    the first time this ran (landmine 43). Store signed, read back masked."""
    return h - (1 << 64) if h >= (1 << 63) else h


def from_sqlite(v):
    return v + (1 << 64) if v < 0 else v


def art_crop(img):
    w, h = img.size
    return img.crop((int(w * ART[0]), int(h * ART[1]),
                     int(w * ART[2]), int(h * ART[3])))


# The CDN's answer for an image it does not have: a 403 for an id it has not
# published yet (a set's first week -- landmine 124), a 404 for one it never
# will. Either is a definite answer about that id, not about us.
UNPUBLISHED = (403, 404)


def _fetch(url, tries=2):
    """-> (bytes or None, HTTP status; 0 when nothing answered)."""
    status = 0
    for a in range(tries):
        try:
            req = urllib.request.Request(url, headers={"User-Agent": USER_AGENT})
            with urllib.request.urlopen(req, timeout=20) as r:
                return r.read(), r.status
        except urllib.error.HTTPError as e:
            status = e.code
            if e.code in UNPUBLISHED:
                return None, status                      # retrying does not change it
        except Exception:                                # noqa: BLE001
            status = 0
        time.sleep(0.4 * (a + 1))
    return None, status


ALT_HOST = urllib.parse.urlparse(ALT_IMAGE_CDN).netloc


def alt_url(pid):
    """The second host's URL for a product id (take 100, A39 item 3). Refuses
    anything that is not an id: a URL is built from the catalogue's key only."""
    if not str(pid).isdigit():
        raise ValueError(f"alt_url: not a product id: {pid!r}")
    return ALT_IMAGE_CDN.format(pid=int(pid))


def export_url(pid, url, alt_ids):
    """What the catalogue ships as a product's img: the second host's URL when
    the runner saw it serve (`alt_ids`, the sidecar's `alt`), the first host's
    URL unchanged otherwise. Pure, so its control runs without a network."""
    return alt_url(pid) if str(pid) in alt_ids else url


def read_alt():
    """The ids the second host served on the last run, from the sidecar."""
    import json
    if not os.path.exists(SIDECAR):
        return set()
    try:
        return set(str(x) for x in json.load(open(SIDECAR)).get("alt", []))
    except Exception:                                    # noqa: BLE001
        return set()


def _is_image(raw):
    """(w, h) when the bytes decode as an image, else None. The bytes are not
    kept (landmine 26): a placeholder page with a 200 is a miss, not a picture."""
    if not raw or Image is None:
        return None
    try:
        img = Image.open(io.BytesIO(raw)); img.load(); wh = img.size
        del img
        return wh
    except Exception:                                    # noqa: BLE001
        return None


def probe(jobs, getter=None, is_image=None, workers=8):
    """Availability only, never hashed: -> [(pid, served, status, size)].
    `getter` and `is_image` are injected so the controls run without a network
    (the shape hunt/gts.py's fetch uses)."""
    get = getter or _fetch
    isi = is_image or _is_image

    def one(job):
        pid, url = job
        raw, status = get(url)
        wh = isi(raw) if raw else None
        del raw
        return (pid, wh is not None, status, wh)
    with cf.ThreadPoolExecutor(workers) as ex:
        return list(ex.map(one, jobs))


def measure_alt(ids, getter=None, is_image=None, workers=4):
    """The second host, for every id the first host refused:
    -> (the ids it served, a count per outcome: served / an HTTP status / 0)."""
    res = probe([(pid, alt_url(pid)) for pid in sorted(ids, key=int)], getter, is_image, workers)
    served = set(str(pid) for pid, ok, _, _ in res if ok)
    counts = {}
    for _, ok, status, _ in res:
        k = "served" if ok else str(status)
        counts[k] = counts.get(k, 0) + 1
    return served, counts


# Take 109 (A42): the largest picture the first host serves, measured before the app
# asks for it (take 100's pattern: nothing guessed into the app). `_in_1000x1000`
# served 600x838 and up at take 109 (20 of 20 served ids; 403 for every id the
# thumbnail host refuses). Fetched, measured and DISCARDED (landmine 26).
LARGE_SUFFIX = "_in_1000x1000"
_LARGE_FROM = re.compile(r"^(https://tcgplayer-cdn\.tcgplayer\.com/product/\d+)_200w\.jpg$")


def large_url(url):
    """The large picture's URL, made from the printing's own stored URL and nothing
    else (AGENTS rule 3). Refuses anything that is not the first host's thumbnail."""
    m = _LARGE_FROM.match(url or "")
    if not m:
        raise ValueError(f"large_url: not a first-host thumbnail: {url!r}")
    return m.group(1) + LARGE_SUFFIX + ".jpg"


def large_jobs(printed, have, n=40):
    """The fixed sample: `n` printings the first host has served (they carry a hash),
    spread evenly over the catalogue's ids -- old sets and new, so one era's uploads
    cannot speak for the rest."""
    ok = sorted(((pid, url) for pid, url in printed
                 if str(pid) in have and _LARGE_FROM.match(url or "")), key=lambda r: int(r[0]))
    if len(ok) <= n:
        return ok
    step = len(ok) / n
    return [ok[int(i * step)] for i in range(n)]


def measure_large(jobs, getter=None, is_image=None, workers=8):
    """-> {suffix, probed, served, w, h, min_w}: how many of the sample the large size
    served, and its median and smallest width. The app uses the size only when a
    build measured it (index.html reads manifest.images.large)."""
    res = probe([(pid, large_url(url)) for pid, url in jobs], getter, is_image, workers)
    sizes = sorted(wh for _, ok, _, wh in res if ok and wh)
    w, h = sizes[len(sizes) // 2] if sizes else (0, 0)
    return {"suffix": LARGE_SUFFIX, "probed": len(res), "served": len(sizes), "w": w, "h": h,
            "min_w": min(x for x, _ in sizes) if sizes else 0}


def _measure_extras(sealed, missing, have, extra, verbose=True, workers=8, limit=None, printed=()):
    """Take 100 (A39 item 3). The sealed images' availability (never hashed: the
    scanner is for cards) and the second host for every id the first refused.
    Recorded in the sidecar and printed with source totals (AGENTS rule 8);
    never a reason to stop the run -- verdict() is the cards' guard."""
    jobs = sealed[:limit] if limit else sealed
    res = probe(jobs, workers=workers)
    missing_sealed = sorted((str(pid) for pid, ok, _, _ in res if not ok), key=int)
    if verbose:
        print(f"   sealed images: {len(missing_sealed)} of {len(jobs)} unavailable at the first host (recorded, not counted)")
    ids = set(str(x) for x in missing) | set(missing_sealed)
    if limit:
        ids = set(sorted(ids, key=int)[:limit])
    served, counts = measure_alt(ids, workers=min(workers, 4)) if ids else (set(), {})
    if verbose:
        st = " ".join(f"{k}\u00d7{v}" for k, v in sorted(counts.items())) or "nothing to probe"
        ms = set(missing_sealed)
        cards = sum(1 for i in served if i not in ms); sl = sum(1 for i in served if i in ms)
        print(f"   second host ({ALT_HOST}): serves {len(served)} of {len(ids)} missing "
              f"(cards {cards} of {len(ids) - len(ms)}, sealed {sl} of {len(ms)}; {st})")
    extra.update({"missing_sealed": missing_sealed, "alt": sorted(served, key=int), "alt_host": ALT_HOST})
    lj = large_jobs(printed, have)
    if limit:
        lj = lj[:limit]
    if lj:                                                # take 109: the large size, measured every run
        lg = measure_large(lj, workers=min(workers, 8))
        extra["large"] = lg
        if verbose:
            print(f"   large art ({LARGE_SUFFIX}): served {lg['served']} of {lg['probed']}, "
                  f"median {lg['w']}x{lg['h']}, smallest width {lg['min_w']}")
    _save(have, missing, extra)


def tally(results, is_new):
    """Count one pass. `results` are (pid, hash or None, status); `is_new` the
    ids never tried before. A miss with an UNPUBLISHED status is recorded, not
    blamed; anything else that missed is a failure of the fetch."""
    c = dict(ok=0, ok_new=0, unpublished=0, unpublished_new=0, failed=0, failed_new=0)
    for pid, h, status in results:
        k = "ok" if h is not None else ("unpublished" if status in UNPUBLISHED else "failed")
        c[k] += 1
        if str(pid) in is_new:
            c[k + "_new"] += 1
    return c


def verdict(n_new, failed_new, canary_ok):
    """The guard as a function, so its controls run without a network.
    Returns the reason to stop, or None.

    Landmine 124: 'not published yet' never enters `failed_new`; the rate is
    over NEW ids only, never over a retry pass of known misses (landmine 51);
    and a rate needs a sample (landmine 106). The canary replaces the old
    'every fetch failed' rule: with retries in the pass, every fetch failing
    is a normal night in a week with no new images."""
    if not canary_ok:
        return ("hashes: the CDN served none of the canary images it served before "
                "— it is refusing us, not a data problem")
    if n_new >= 20 and failed_new > n_new * 0.20:
        return (f"hashes: {failed_new}/{n_new} new images failed ({100*failed_new/n_new:.1f}%) "
                f"— too many to be dead links (a 403/404 is recorded, not counted here)")
    return None


def run(limit=None, verbose=True, workers=8, retry_missing=True):
    """Writes to the SIDECAR, not to the catalogue.

    Landmine 47: this ran for minutes against catalog.sqlite while another
    process rebuilt it. build_catalog.py deletes and recreates that file by
    design, so the long job died silently mid-pass with nothing in the log and
    nothing saved. Derived data that takes fourteen minutes to produce does not
    belong inside the thing that gets deleted -- which is landmine 46 again, and
    this is the same lesson arriving from the other direction.

    The catalogue is read once for the work list, then released.
    """
    import json
    if Image is None:
        raise SystemExit("hashes: pillow is not installed (bash ci/deps.sh)")
    raw = json.load(open(SIDECAR)) if os.path.exists(SIDECAR) else {}
    # Sidecar was a flat id->hash map through take 3. Read either shape.
    have = raw.get("hashes", raw if "missing" not in raw else {})
    # Landmine 51: some image URLs are permanently dead. Remembering which ones
    # is the difference between a guard and a nuisance -- on a resumed pass the
    # only work left was the known-bad 203, so a blunt 5% miss rule reported
    # 100% and stopped the pipeline. Same shape as landmine 42.
    # Landmine 124: a miss is a queue entry, not a verdict. Every known miss is
    # retried each run (~30 s for a few hundred at the measured 8/s), kept out
    # of the failure rate, and leaves the list the night its image arrives.
    missing = set(str(x) for x in raw.get("missing", []))
    # take 100: the sidecar's other keys ride through every save (the mid-pass
    # one included) or last night's `alt` is erased before the probe rewrites it
    extra = {k: raw[k] for k in ("missing_sealed", "alt", "alt_host", "large") if k in raw}
    db = sqlite3.connect(CATALOG_DB)
    printed = db.execute(
        "SELECT product_id, image_url FROM printing "
        "WHERE is_sealed=0 AND image_url IS NOT NULL").fetchall()
    sealed = db.execute(
        "SELECT product_id, image_url FROM printing "
        "WHERE is_sealed=1 AND image_url IS NOT NULL").fetchall()
    db.close()                                           # released immediately
    new = [r for r in printed if str(r[0]) not in have and str(r[0]) not in missing]
    retry = [r for r in printed if str(r[0]) in missing] if retry_missing else []
    if limit:
        new, retry = new[:limit], retry[:limit]
    rows = new + retry
    if verbose and missing:
        print(f"   {len(missing)} images known to be unavailable — retrying {len(retry)}")
    if not rows:
        if verbose:
            print("   nothing to fetch")
        _measure_extras(sealed, missing, have, extra, verbose, workers, limit, printed)   # the card pass is empty, not the night
        return 0, 0
    t0 = time.time()

    # Parallel is safe HERE and was not safe for the catalogue (landmine 5).
    # The difference is the endpoint: tcgcsv.com is one person's small service
    # and answered eight-way parallelism with silent empties, while this is
    # TCGplayer's image CDN, which exists to serve many connections. Modest
    # concurrency, a declared User-Agent, and every result checked -- a zero is
    # still never a valid answer.
    def one(job):
        pid, url = job
        raw, status = _fetch(url)
        if not raw:
            return pid, None, status
        try:
            img = Image.open(io.BytesIO(raw)).convert("RGB")
            h = to_sqlite(dhash(art_crop(img)))
            del raw, img                                 # landmine 26: never kept
            return pid, h, status
        except Exception:                                # noqa: BLE001
            return pid, None, 0                          # bytes that are not an image

    # The canary (landmine 124): three images this sidecar already holds are
    # fetched first. If the CDN serves none of them it is refusing us -- an
    # address, a block, an outage -- and no per-id count below means anything.
    # With nothing hashed yet there is no canary and the rate guard decides.
    canary = [r for r in printed if str(r[0]) in have][:3]
    canary_ok = not canary or any(h is not None for _, h, _ in map(one, canary))
    if verbose and canary:
        print(f"   canary: {'served' if canary_ok else 'REFUSED'} ({len(canary)} known-good images)")

    results = []
    with cf.ThreadPoolExecutor(workers) as ex:
        for i, (pid, h, status) in enumerate(ex.map(one, rows), 1):
            results.append((pid, h, status))
            if h is None:
                missing.add(str(pid))
            else:
                missing.discard(str(pid))
                have[str(pid)] = h
            if i % 500 == 0:
                _save(have, missing, extra)              # crash-safe, resumable
                if verbose:
                    r = i / (time.time() - t0)
                    print(f"   {i}/{len(rows)}  {r:.0f}/s  "
                          f"eta {(len(rows)-i)/r/60:.1f} min", flush=True)
    _save(have, missing, extra)

    # An ETA is not evidence of completion (landmine 48). Say what landed,
    # new and retried apart: the rate that matters is over cards we have NEVER
    # tried, not over a pass whose remaining work is all known-bad (landmine 51).
    c = tally(results, set(str(r[0]) for r in new))
    if verbose:
        print(f"   new {len(new)}: hashed {c['ok_new']}, unpublished {c['unpublished_new']} (recorded), "
              f"failed {c['failed_new']}; retried {len(retry)}: hashed {c['ok'] - c['ok_new']}; "
              f"{time.time()-t0:.0f}s")
    why = verdict(len(new), c["failed_new"], canary_ok)
    if why:
        raise SystemExit(why)
    # A percentage needs a sample (landmine 106). The first run on a GitHub
    # runner had ONE new printing to fetch; it failed; 1/1 read as 100% and the
    # pipeline stopped with 97% coverage already on file. Below twenty new
    # attempts a failure is recorded (above, _save) and the gate's coverage
    # check -- the real guard -- decides whether to ship.
    if new and c["failed_new"] and len(new) < 20:
        print(f"   {c['failed_new']} of {len(new)} new image(s) failed — recorded, not fatal "
              f"(sample too small for a rate; landmine 106)")
    _measure_extras(sealed, missing, have, extra, verbose, workers, limit, printed)   # after the verdict: a refused night measures nothing more
    return c["ok"], c["unpublished"] + c["failed"]


def _save(have, missing, extra=None):
    """Landmine 46: the hashes live outside the disposable catalogue. Take 100:
    the sidecar's other keys (`missing_sealed`, `alt`, `alt_host`) ride through
    every save -- a saver that knew two keys would erase them mid-pass."""
    import json
    d = {"hashes": have, "missing": sorted(missing)}
    d.update(extra or {})
    json.dump(d, open(SIDECAR, "w"))


def load_sidecar(db):
    import json
    if not os.path.exists(SIDECAR):
        return 0
    raw = json.load(open(SIDECAR))
    d = raw.get("hashes", raw if "missing" not in raw else {})
    db.executemany("INSERT OR REPLACE INTO printing_hash VALUES (?,?)",
                   [(int(k), v) for k, v in d.items()])
    db.commit()
    return len(d)


def selftest():
    """Negative controls for the guard (landmine 124), no network. Each case is
    a night that happened or nearly did; the guard must fire on exactly the
    ones that were the CDN's fault or ours."""
    def night(n_new, unpublished, failed, canary_ok):
        rs = ([(i, 1, 200) for i in range(n_new - unpublished - failed)]
              + [(100 + i, None, 403) for i in range(unpublished)]
              + [(200 + i, None, 0) for i in range(failed)])
        c = tally(rs, set(str(p) for p, _, _ in rs))
        return verdict(n_new, c["failed_new"], canary_ok)
    cases = [("the CDN refuses every canary (a block)",          night(30, 0, 0, False),  True),
             ("30 new, 9 timeouts (30%)",                         night(30, 0, 9, True),   True),
             ("30 new, 9 unpublished 403s, none failed (09-21)", night(30, 9, 0, True),   False),
             ("1 new, 1 failed (landmine 106)",                   night(1, 0, 1, True),    False),
             ("nothing new, a retry pass only",                   night(0, 0, 0, True),    False)]
    ok_all = True
    for name, why, should_fire in cases:
        fired = why is not None
        good = fired == should_fire
        ok_all &= good
        print(f"  {'ok  ' if good else 'FAIL'}  {name}: {'guard fires' if fired else 'passes'}")
    for status, unpub in ((403, True), (404, True), (500, False), (0, False)):
        c = tally([(1, None, status)], {"1"})
        good = (c["unpublished"] == 1) == unpub
        ok_all &= good
        print(f"  {'ok  ' if good else 'FAIL'}  a miss with status {status} is {'unpublished' if unpub else 'a failure'}")
    # take 100 (A39 item 3): the availability probes' pure parts, without a network
    img_ok = lambda b: (200, 279)                          # noqa: E731
    cases100 = [
        ("a 200 whose bytes are an image is served",
         lambda: probe([(1, "u")], getter=lambda u: (b"IMG", 200), is_image=img_ok)[0][1], True),
        ("control: a 404 is not served",
         lambda: probe([(1, "u")], getter=lambda u: (None, 404), is_image=img_ok)[0][1], False),
        ("control: a 200 whose bytes are not an image (a placeholder page) is not served",
         lambda: probe([(1, "u")], getter=lambda u: (b"<html>", 200), is_image=lambda b: None)[0][1], False),
        ("the second host: the ids it serves, counted by status",
         lambda: measure_alt({"1", "2"}, getter=lambda u: (b"IMG", 200) if u.endswith("/1.jpg") else (None, 404), is_image=img_ok), ({"1"}, {"served": 1, "404": 1})),
        ("control: a host that serves nothing yields no id",
         lambda: measure_alt({"1", "2"}, getter=lambda u: (None, 404), is_image=img_ok)[0], set()),
        ("export: an id outside `alt` keeps the first host's URL; one inside ships the second's",
         lambda: (export_url(1, "https://tcgplayer-cdn.tcgplayer.com/product/1_200w.jpg", {"2"}),
                  export_url(1, "cdn", {"1"}) == alt_url(1), alt_url(712901).endswith("/712901.jpg")),
         ("https://tcgplayer-cdn.tcgplayer.com/product/1_200w.jpg", True, True)),
        ("control: a non-id is refused by alt_url",
         lambda: (lambda: (alt_url("x"), False))() if False else _refused(lambda: alt_url("x")), True),
        ("the sidecar round-trip keeps the new keys through a second save, and read_alt() reads them",
         _sidecar_roundtrip, True),
        # take 109 (A42): the large size
        ("large_url: a first-host thumbnail becomes its 1000x1000 picture, from its own URL",
         lambda: large_url("https://tcgplayer-cdn.tcgplayer.com/product/42_200w.jpg"),
         "https://tcgplayer-cdn.tcgplayer.com/product/42_in_1000x1000.jpg"),
        ("control: a second-host URL, a bare number and a non-URL are refused by large_url",
         lambda: (_refused(lambda: large_url(alt_url(42))), _refused(lambda: large_url("OP01-001")), _refused(lambda: large_url(None))),
         (True, True, True)),
        ("measure_large: the served count and the median size, by status and bytes",
         lambda: measure_large([(i, f"https://tcgplayer-cdn.tcgplayer.com/product/{i}_200w.jpg") for i in (1, 2, 3, 4)],
                               getter=lambda u: (b"IMG", 200) if "/4_" not in u else (None, 403),
                               is_image=lambda b: (600, 838)),
         {"suffix": "_in_1000x1000", "probed": 4, "served": 3, "w": 600, "h": 838, "min_w": 600}),
        ("control: a host that serves none measures served 0 and width 0 (the app keeps the thumbnail)",
         lambda: (lambda m: (m["served"], m["w"]))(measure_large([(1, "https://tcgplayer-cdn.tcgplayer.com/product/1_200w.jpg")],
                                                                getter=lambda u: (None, 403), is_image=lambda b: (600, 838))), (0, 0)),
        ("large_jobs: only printings with a hash on the first host, spread evenly, at most n",
         lambda: [p for p, _ in large_jobs([(i, f"https://tcgplayer-cdn.tcgplayer.com/product/{i}_200w.jpg") for i in range(1, 101)]
                                           + [(500, "https://product-images.tcgplayer.com/fit-in/200x279/500.jpg")],
                                           {str(i) for i in range(1, 101) if i % 2} | {"500"}, n=5)], [1, 21, 41, 61, 81]),
    ]
    for name, fn, want in cases100:
        try:
            got = fn()
        except Exception as e:                            # noqa: BLE001
            got = f"raised {type(e).__name__}: {e}"
        good = got == want
        ok_all &= good
        print(f"  {'ok  ' if good else 'FAIL'}  {name}" + ("" if good else f": got {got!r}"))
    return ok_all


def _refused(fn):
    try:
        fn()
        return False
    except ValueError:
        return True


def _sidecar_roundtrip():
    import json, tempfile
    global SIDECAR
    old = SIDECAR
    SIDECAR = os.path.join(tempfile.mkdtemp(), "hashes.json")
    try:
        _save({"1": 5}, {"2"}, {"alt": ["3"], "missing_sealed": ["4"], "alt_host": "h", "large": {"served": 1}})
        raw = json.load(open(SIDECAR))
        extra = {k: raw[k] for k in ("missing_sealed", "alt", "alt_host", "large") if k in raw}
        _save({"1": 5}, {"2"}, extra)                     # a second save, as the mid-pass save is
        raw2 = json.load(open(SIDECAR))
        return (raw2.get("alt") == ["3"] and raw2.get("missing_sealed") == ["4"] and raw2.get("alt_host") == "h"
                and raw2.get("large") == {"served": 1} and read_alt() == {"3"})
    finally:
        SIDECAR = old


if __name__ == "__main__":
    if "--selftest" in sys.argv:
        print("hashes.py negative controls:")
        raise SystemExit(0 if selftest() else 1)
    args = [a for a in sys.argv[1:] if not a.startswith("--")]
    run(limit=int(args[0]) if args else None,
        workers=int(args[1]) if len(args) > 1 else 8)
