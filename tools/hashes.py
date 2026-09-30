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


def export_pic(pid, url, h, alt_ids, ph_ids):
    """Take 126: what the catalogue ships as a printing's picture and hash -> (url, hash). A printing the runner
    last saw serve the host's placeholder ships no hash (it is the placeholder's, not the card's) and no URL --
    or the second host's, when the runner saw that serve the card. Otherwise export_url's URL and the hash.
    Pure, so its control runs without a network."""
    if str(pid) in ph_ids:
        return (alt_url(pid) if str(pid) in alt_ids else None), None
    return (export_url(pid, url, alt_ids) if url else url), h


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


# Take 126 (landmine 240): the host's "Image Coming Soon". TCGplayer answers some products with one
# placeholder picture, 200 OK like any other, and a hashed id is never fetched again -- so the night a
# printing's picture was the placeholder, the placeholder was its picture for good. MEASURED 30 Sept, every
# picture fetched: the 6,749 other card pictures are 1.295 to 1.5 times as tall as wide (a card is 88 x 63 mm,
# 1.40); the placeholder is 200 x 115 (0.575) on 22 card printings and one sealed product, 1000 x 573 at the
# large size, and the second host's copy is 200 x 115 too. Its copies' hashes are 2 to 4 bits apart; the
# nearest real card picture is 16 bits from it, the nearest sealed one 21, and sixteen real sealed pictures
# are landscape -- so a card is judged by its shape and its hash, a sealed product by its hash alone. The
# placeholder hashes on file are learned (from a card picture that is not card-shaped, and landmine 226's
# rule), never typed in: the host can change its picture.
CARD_SHAPE = 1.2          # a card's picture is at least this many times as tall as it is wide
PH_NEAR = 6               # bits: a picture this close to a placeholder hash on file is the placeholder
PLACEHOLDER = "placeholder"   # a placeholder miss's status: the host has no picture yet -- recorded, not blamed


def card_shaped(wh):
    """A card's picture is portrait: at least CARD_SHAPE times as tall as it is wide."""
    return bool(wh) and wh[0] > 0 and wh[1] >= CARD_SHAPE * wh[0]


def near_placeholder(h, known):
    """`h`, an unsigned hash, within PH_NEAR bits of a placeholder hash on file."""
    return h is not None and any(hamming(h, k) <= PH_NEAR for k in known)


def card_verdict(wh, u, known, status=200):
    """A card picture as fetched -- its size and its unsigned hash -> (the hash to keep, stored signed, or None;
    the status to record; a placeholder hash to learn, or None). Not card-shaped: the placeholder, and its hash
    is learned. Near a placeholder hash on file: the placeholder, nothing learned (a near copy learned in turn
    would walk the ball toward real pictures). Otherwise the card's picture."""
    if not card_shaped(wh):
        return None, PLACEHOLDER, u
    if near_placeholder(u, known):
        return None, PLACEHOLDER, None
    return to_sqlite(u), status, None


def hash_of(raw):
    """The art window's hash of an image's bytes (unsigned), or None when they are not an image. Not kept."""
    if not raw or Image is None:
        return None
    try:
        return dhash(art_crop(Image.open(io.BytesIO(raw)).convert("RGB")))
    except Exception:                                    # noqa: BLE001
        return None


def judge(known, cards=(), hasher=None):
    """-> placeholder(pid, raw, size) for probe(): a card's picture (an id in `cards`) that is not card-shaped,
    or any picture near a placeholder hash on file, is the host's placeholder. A sealed product is judged by its
    hash alone: sixteen real ones are landscape. `hasher` is injected so the controls run without pillow."""
    cards, hsh = set(str(x) for x in cards), hasher or hash_of

    def placeholder(pid, raw, wh):
        return (str(pid) in cards and not card_shaped(wh)) or near_placeholder(hsh(raw), known)
    return placeholder


def shared_names(have, names):
    """Landmine 226: a hash held by printings of two or more names is no card's picture -- reprints of one card
    share art under one name. -> those hashes, unsigned."""
    by = {}
    for pid, h in have.items():
        n = names.get(str(pid))
        if n is not None:
            by.setdefault(h, set()).add(n)
    return {from_sqlite(h) for h, ns in by.items() if len(ns) > 1}


def purge(have, missing, known, names):
    """The hashes already held that are the placeholder -- one hash on two or more names, or near a placeholder
    hash on file -- leave `have` for `missing`, to be fetched again as misses; a shared one joins `known`.
    -> the ids moved. Take 126: 22 printings held it, hashed the night they arrived (landmine 240)."""
    known |= shared_names(have, names)
    out = sorted((pid for pid, h in have.items() if near_placeholder(from_sqlite(h), known)), key=int)
    for pid in out:
        del have[pid]
        missing.add(pid)
    return out


def lend_map(rows):
    """Take 126 (the owner: "ensure we get as many pictures as possible"): for the Sim's table, which printing's picture
    stands in for a card printing with none of its own. `rows`: dicts with id, num, name, treat, hash (stored signed, or
    None), img, sealed. The lenders are the same card's printings -- the same number and name -- whose picture the runner
    saw serve (a hash); the same treatment first, then the oldest. The oldest, because a card's first printings are real
    scans more often than its reprints, whose pictures are the publisher's sample images stamped SAMPLE across the art
    (landmine 151: 18 of 20 of TCGplayer's). MEASURED 30 Sept in the look: the Revision Pack reprints of Jinbe and Nami
    lent SAMPLE; their oldest, the Super Pre-Release editions, lend real cards with the edition's own small mark; Brook's
    oldest is his clean original. No stamp is visible to a hash (the pre-release edition's is 0 bits from Brook's
    original), so the choice is by age, not by picture. The table plays the card, not the printing; Collect never borrows
    (landmine 241). -> {id: lender id}."""
    served, want = {}, []
    for r in rows:
        if r.get("sealed") or not r.get("num"):
            continue
        if r.get("hash") is not None and r.get("img"):
            served.setdefault((r["num"], r["name"]), []).append(r)
        elif r.get("hash") is None:
            want.append(r)
    out = {}
    for r in want:
        sibs = served.get((r["num"], r["name"]))
        if sibs:
            pool = [s for s in sibs if s.get("treat") == r.get("treat")] or sibs
            out[r["id"]] = min(pool, key=lambda s: s["id"])["id"]
    return out


def ph_state(raw):
    """The sidecar's `placeholder` -> {"hashes": the placeholder hashes on file (unsigned; stored signed, as every
    hash in the sidecar), "cards", "sealed": the ids whose picture was the placeholder at their last answer}."""
    p = raw.get("placeholder") or {}
    return {"hashes": {from_sqlite(int(h)) for h in p.get("hashes", [])},
            "cards": set(str(x) for x in p.get("cards", [])), "sealed": set(str(x) for x in p.get("sealed", []))}


def ph_saved(ph):
    """ph_state's inverse, for the sidecar."""
    return {"hashes": sorted(to_sqlite(h) for h in ph["hashes"]),
            "cards": sorted(ph["cards"], key=int), "sealed": sorted(ph["sealed"], key=int)}


def read_placeholder():
    """The ids, cards and sealed, whose picture the runner last saw be the host's placeholder. The build ships
    them no picture URL and no hash (take 126)."""
    import json
    if not os.path.exists(SIDECAR):
        return set()
    try:
        p = ph_state(json.load(open(SIDECAR)))
        return p["cards"] | p["sealed"]
    except Exception:                                    # noqa: BLE001
        return set()


def probe(jobs, getter=None, is_image=None, workers=8, placeholder=None):
    """Availability only, never hashed: -> [(pid, served, status, size)].
    `getter` and `is_image` are injected so the controls run without a network
    (the shape hunt/gts.py's fetch uses). Take 126: a picture that
    `placeholder(pid, raw, size)` calls the host's placeholder is not served,
    and its status is PLACEHOLDER."""
    get = getter or _fetch
    isi = is_image or _is_image

    def one(job):
        pid, url = job
        raw, status = get(url)
        wh = isi(raw) if raw else None
        ph = bool(wh and placeholder and placeholder(pid, raw, wh))
        del raw
        return (pid, wh is not None and not ph, PLACEHOLDER if ph else status, wh)
    with cf.ThreadPoolExecutor(workers) as ex:
        return list(ex.map(one, jobs))


def measure_alt(ids, getter=None, is_image=None, workers=4, placeholder=None):
    """The second host, for every id the first host refused:
    -> (the ids it served, a count per outcome: served / an HTTP status / 0 /
    the host's placeholder, which is not served -- take 126)."""
    res = probe([(pid, alt_url(pid)) for pid in sorted(ids, key=int)], getter, is_image, workers, placeholder)
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


def measure_large(jobs, getter=None, is_image=None, workers=8, placeholder=None):
    """-> {suffix, probed, served, w, h, min_w}: how many of the sample the large size
    served, and its median and smallest width. The app uses the size only when a
    build measured it (index.html reads manifest.images.large). Take 126: the
    host's placeholder at the large size is not served."""
    res = probe([(pid, large_url(url)) for pid, url in jobs], getter, is_image, workers, placeholder)
    sizes = sorted(wh for _, ok, _, wh in res if ok and wh)
    w, h = sizes[len(sizes) // 2] if sizes else (0, 0)
    return {"suffix": LARGE_SUFFIX, "probed": len(res), "served": len(sizes), "w": w, "h": h,
            "min_w": min(x for x, _ in sizes) if sizes else 0}


def _measure_extras(sealed, missing, have, extra, verbose=True, workers=8, limit=None, printed=()):
    """Take 100 (A39 item 3). The sealed images' availability (never hashed: the
    scanner is for cards) and the second host for every id the first refused.
    Recorded in the sidecar and printed with source totals (AGENTS rule 8);
    never a reason to stop the run -- verdict() is the cards' guard."""
    ph = ph_state(extra)                                  # take 126: the placeholder hashes run() holds
    jobs = sealed[:limit] if limit else sealed
    res = probe(jobs, workers=workers, placeholder=judge(ph["hashes"]))   # a sealed product by its hash alone
    missing_sealed = sorted((str(pid) for pid, ok, _, _ in res if not ok), key=int)
    ph["sealed"] = set(str(pid) for pid, _, st, _ in res if st == PLACEHOLDER)
    if verbose:
        print(f"   sealed images: {len(missing_sealed)} of {len(jobs)} unavailable at the first host (recorded, not counted)"
              + (f"; {len(ph['sealed'])} of them the host's placeholder" if ph["sealed"] else ""))
    ids = set(str(x) for x in missing) | set(missing_sealed)
    if limit:
        ids = set(sorted(ids, key=int)[:limit])
    served, counts = (measure_alt(ids, workers=min(workers, 4), placeholder=judge(ph["hashes"], cards=missing))
                      if ids else (set(), {}))
    if verbose:
        st = " ".join(f"{k}\u00d7{v}" for k, v in sorted(counts.items())) or "nothing to probe"
        ms = set(missing_sealed)
        cards = sum(1 for i in served if i not in ms); sl = sum(1 for i in served if i in ms)
        print(f"   second host ({ALT_HOST}): serves {len(served)} of {len(ids)} missing "
              f"(cards {cards} of {len(ids) - len(ms)}, sealed {sl} of {len(ms)}; {st})")
    extra.update({"missing_sealed": missing_sealed, "alt": sorted(served, key=int), "alt_host": ALT_HOST,
                  "placeholder": ph_saved(ph)})
    lj = large_jobs(printed, have)
    if limit:
        lj = lj[:limit]
    if lj:                                                # take 109: the large size, measured every run
        lg = measure_large(lj, workers=min(workers, 8), placeholder=judge(ph["hashes"], cards=[p for p, _ in lj]))
        extra["large"] = lg
        if verbose:
            print(f"   large art ({LARGE_SUFFIX}): served {lg['served']} of {lg['probed']}, "
                  f"median {lg['w']}x{lg['h']}, smallest width {lg['min_w']}")
    _save(have, missing, extra)


def tally(results, is_new):
    """Count one pass. `results` are (pid, hash or None, status); `is_new` the
    ids never tried before. A miss with an UNPUBLISHED status is recorded, not
    blamed; so is the host's placeholder (take 126: its way of saying it has no
    picture yet, counted apart as well); anything else that missed is a failure
    of the fetch."""
    c = dict(ok=0, ok_new=0, unpublished=0, unpublished_new=0, failed=0, failed_new=0,
             placeholder=0, placeholder_new=0)
    for pid, h, status in results:
        k = "ok" if h is not None else ("unpublished" if status in UNPUBLISHED or status == PLACEHOLDER else "failed")
        new = str(pid) in is_new
        c[k] += 1
        if new:
            c[k + "_new"] += 1
        if h is None and status == PLACEHOLDER:
            c["placeholder"] += 1
            c["placeholder_new"] += new
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
    extra = _carried(raw)
    db = sqlite3.connect(CATALOG_DB)
    printed = db.execute(
        "SELECT product_id, image_url FROM printing "
        "WHERE is_sealed=0 AND image_url IS NOT NULL").fetchall()
    sealed = db.execute(
        "SELECT product_id, image_url FROM printing "
        "WHERE is_sealed=1 AND image_url IS NOT NULL").fetchall()
    names = {str(pid): n for pid, n in db.execute("SELECT product_id, name FROM printing WHERE is_sealed=0")}
    db.close()                                           # released immediately
    # Take 126 (landmine 240): the host's placeholder already held as a picture -- one hash on two or more names
    # (landmine 226), or near a placeholder hash on file -- leaves the hashes and is fetched again as a miss.
    ph = ph_state(raw)
    purged = purge(have, missing, ph["hashes"], names)
    ph["cards"] |= set(purged)
    extra["placeholder"] = ph_saved(ph)
    if verbose and purged:
        print(f"   the host's placeholder: {len(purged)} printings held it as their picture -- dropped, "
              f"fetched again as misses (landmine 240)")
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
    # -> (pid, the hash to keep or None, status, a placeholder hash to learn or None)
    def one(job):
        pid, url = job
        raw, status = _fetch(url)
        if not raw:
            return pid, None, status, None
        try:
            img = Image.open(io.BytesIO(raw)).convert("RGB")
            wh, u = img.size, dhash(art_crop(img))
            del raw, img                                 # landmine 26: never kept
        except Exception:                                # noqa: BLE001
            return pid, None, 0, None                    # bytes that are not an image
        # take 126: judged the night it is fetched -- a hash that stays is never fetched again (landmine 240)
        return (pid,) + card_verdict(wh, u, ph["hashes"], status)

    # The canary (landmine 124): three images this sidecar already holds are
    # fetched first. If the CDN serves none of them it is refusing us -- an
    # address, a block, an outage -- and no per-id count below means anything.
    # With nothing hashed yet there is no canary and the rate guard decides.
    canary = [r for r in printed if str(r[0]) in have][:3]
    canary_ok = not canary or any(r[1] is not None for r in map(one, canary))
    if verbose and canary:
        print(f"   canary: {'served' if canary_ok else 'REFUSED'} ({len(canary)} known-good images)")

    results, learned = [], set()                         # learned after the pass: the workers read ph["hashes"]
    with cf.ThreadPoolExecutor(workers) as ex:
        for i, (pid, h, status, u) in enumerate(ex.map(one, rows), 1):
            results.append((pid, h, status))
            if h is None:
                missing.add(str(pid))
                if status == PLACEHOLDER:                # take 126: the host has no picture yet
                    ph["cards"].add(str(pid))
                    if u is not None:
                        learned.add(u)
                elif status in UNPUBLISHED:              # refused now: its URL draws no placeholder
                    ph["cards"].discard(str(pid))
            else:
                missing.discard(str(pid))
                ph["cards"].discard(str(pid))
                have[str(pid)] = h
            if i % 500 == 0:
                extra["placeholder"] = ph_saved(ph)
                _save(have, missing, extra)              # crash-safe, resumable
                if verbose:
                    r = i / (time.time() - t0)
                    print(f"   {i}/{len(rows)}  {r:.0f}/s  "
                          f"eta {(len(rows)-i)/r/60:.1f} min", flush=True)
    ph["hashes"] |= learned
    extra["placeholder"] = ph_saved(ph)
    _save(have, missing, extra)

    # An ETA is not evidence of completion (landmine 48). Say what landed,
    # new and retried apart: the rate that matters is over cards we have NEVER
    # tried, not over a pass whose remaining work is all known-bad (landmine 51).
    c = tally(results, set(str(r[0]) for r in new))
    if verbose:
        print(f"   new {len(new)}: hashed {c['ok_new']}, unpublished {c['unpublished_new']} (recorded), "
              f"failed {c['failed_new']}; retried {len(retry)}: hashed {c['ok'] - c['ok_new']}; "
              f"{time.time()-t0:.0f}s")
        if c["placeholder"] or ph["cards"]:
            print(f"   the host's placeholder (\"Image Coming Soon\"): {c['placeholder']} this pass "
                  f"({c['placeholder_new']} new), {len(ph['cards'])} printings on file, "
                  f"{len(ph['hashes'])} placeholder hash(es) -- misses, retried every night (take 126)")
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


SIDECAR_EXTRA = ("missing_sealed", "alt", "alt_host", "large", "placeholder")   # take 115: the one list run() carries and the selftest checks; take 126: placeholder


def _carried(raw):
    """The sidecar's keys besides the hashes and the misses -- what _measure_extras writes -- as run() carries them."""
    return {k: raw[k] for k in SIDECAR_EXTRA if k in raw}


def _save(have, missing, extra=None):
    """Landmine 46: the hashes live outside the disposable catalogue. Take 100:
    the sidecar's other keys (SIDECAR_EXTRA: `missing_sealed`, `alt`,
    `alt_host`, and since take 109 `large`) ride through every save -- a saver
    that knew two keys would erase them mid-pass."""
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
        ("every key _measure_extras writes is one run() carries through its next save (SIDECAR_EXTRA, take 115)",
         _extras_written, []),
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
    # take 126 (landmine 240): the host's placeholder. Fixtures are the hashes MEASURED 30 Sept -- the first
    # host's placeholder, its large copy and the second host's (2 bits each from the first); the rule itself
    # carries no hash (it learns them).
    P1, PL, P2 = 1600800201181794996, 1600765016809707188, 1599665505181930164
    A = (1 << 63) | 12345                                 # a hash with the top bit set: stored signed
    ph_judge = judge({P1}, cards={"1"}, hasher=lambda raw: int(raw))
    cases100 += [
        ("card_shaped: the host's card pictures (200 x 259 the lowest measured, 279, 300) are card-shaped; "
         "the placeholder (200 x 115), a square and no size are not",
         lambda: tuple(card_shaped(wh) for wh in ((200, 259), (200, 279), (200, 300), (200, 115), (200, 200), None)),
         (True, True, True, False, False, False)),
        ("near_placeholder: its copies (the large size, the second host) are near it; 6 bits is near, 7 is not; "
         "the nearest real card picture (16 bits) is not; nothing on file, nothing near",
         lambda: (near_placeholder(PL, {P1}), near_placeholder(P2, {P1}), near_placeholder(P1 ^ 0x3F, {P1}),
                  near_placeholder(P1 ^ 0x7F, {P1}), near_placeholder(P1 ^ 0xFFFF, {P1}), near_placeholder(P1, set())),
         (True, True, True, False, False, False)),
        ("card_verdict: the placeholder by its shape is a miss that teaches its hash; a card-shaped copy near a hash "
         "on file is a miss that teaches nothing; a card's picture is kept, signed",
         lambda: (card_verdict((200, 115), P1, set()), card_verdict((200, 279), P2, {P1}),
                  card_verdict((200, 279), A, {P1}, 200), card_verdict((200, 259), P1 ^ 0xFFFF, {P1}, 200)),
         ((None, PLACEHOLDER, P1), (None, PLACEHOLDER, None), (to_sqlite(A), 200, None), (to_sqlite(P1 ^ 0xFFFF), 200, None))),
        ("control: the placeholder's own hash on a card-shaped picture is caught only once the hash is on file",
         lambda: (card_verdict((200, 279), P1, set())[1], card_verdict((200, 279), P1, {P2})[1]), (200, PLACEHOLDER)),
        ("judge: a card at 200 x 115 is the placeholder whatever its hash; a sealed product at 200 x 115 is not "
         "(sixteen real ones are landscape) unless its hash is near one on file; a card-shaped card far from it is not",
         lambda: (ph_judge("1", b"5", (200, 115)), ph_judge("2", b"5", (200, 115)), ph_judge("2", str(P2).encode(), (200, 115)),
                  ph_judge("1", b"5", (200, 279)), ph_judge("2", str(P1).encode(), (200, 279))),
         (True, False, True, False, True)),
        ("probe: a picture the judge calls the placeholder is not served, its status the placeholder's",
         lambda: probe([(1, "u")], getter=lambda u: (b"IMG", 200), is_image=lambda b: (200, 115),
                       placeholder=lambda pid, raw, wh: True)[0][1:3], (False, PLACEHOLDER)),
        ("control: the same picture with no judge is served (take 100's probe)",
         lambda: probe([(1, "u")], getter=lambda u: (b"IMG", 200), is_image=lambda b: (200, 115))[0][1:3], (True, 200)),
        ("measure_alt: a card whose second-host picture is the placeholder is not served, and is counted as it",
         lambda: measure_alt({"1", "2"}, getter=lambda u: (b"PH", 200) if u.endswith("/1.jpg") else (b"CARD", 200),
                             is_image=lambda b: (200, 115) if b == b"PH" else (200, 279),
                             placeholder=judge(set(), cards={"1", "2"}, hasher=lambda raw: None)),
         ({"2"}, {"served": 1, "placeholder": 1})),
        ("purge: one hash on three names leaves and is learned (landmine 226), a hash near one on file leaves; "
         "control: one hash on two reprints of one name stays, and a hash 7 bits away stays",
         _purge_case, (["1", "2", "3", "7"], ["4", "5", "6", "8"], ["1", "2", "3", "7"], True)),
        ("tally: a new set's week of placeholders (30 new, 9 of them the placeholder) is recorded, not a failure, "
         "and the guard passes",
         lambda: (lambda c: (c["unpublished_new"], c["failed_new"], c["placeholder_new"], verdict(30, c["failed_new"], True)))(
             tally([(i, 1, 200) for i in range(21)] + [(100 + i, None, PLACEHOLDER) for i in range(9)],
                   set(str(i) for i in range(21)) | set(str(100 + i) for i in range(9)))),
         (9, 0, 9, None)),
        ("export_pic: the placeholder's printing ships no URL and no hash, or the second host's URL when it serves "
         "the card; control: any other printing keeps its URL and hash",
         lambda: (export_pic(288236, "https://tcgplayer-cdn.tcgplayer.com/product/288236_200w.jpg", 7, set(), {"288236"}),
                  export_pic(288236, "u", 7, {"288236"}, {"288236"}),
                  export_pic(1, "https://tcgplayer-cdn.tcgplayer.com/product/1_200w.jpg", 7, set(), {"288236"})),
         ((None, None), (alt_url(288236), None), ("https://tcgplayer-cdn.tcgplayer.com/product/1_200w.jpg", 7))),
        ("the sidecar keeps `placeholder` through a second save, and read_placeholder() reads its cards and sealed",
         _placeholder_roundtrip, True),
        ("lend_map: the same card's oldest printing the runner saw serve lends, the same treatment first -- Jinbe's "
         "first edition, not the newer reprint (SAMPLE) nor a promo; Brook's original; an alternate art another "
         "alternate art's; another name, a printing never seen to serve, and a card with no such printing lend nothing",
         lambda: _lend_case(), ({100: 200, 700: 200, 800: 300, 111: 110, 120: 220}, {100: 200, 700: 200, 800: 300, 111: 110, 120: 220})),
        ("control: without the treatment first, the pictureless alternate art takes the base's oldest",
         lambda: min((r for r in _lend_rows() if r["num"] == "ST01-005" and r["name"] == "Jinbe" and r["hash"] is not None),
                     key=lambda r: r["id"])["id"], 200),
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
        _save({"1": 5}, {"2"}, _carried(raw))             # a second save, carried as run() carries it (take 115: the one list)
        raw2 = json.load(open(SIDECAR))
        return (raw2.get("alt") == ["3"] and raw2.get("missing_sealed") == ["4"] and raw2.get("alt_host") == "h"
                and raw2.get("large") == {"served": 1} and read_alt() == {"3"})
    finally:
        SIDECAR = old


def _lend_rows():
    """Take 126: three cards' printings, planted. Jinbe: the first printing with no picture (100), its pre-release
    edition (200, the oldest with a picture), a promo of another illustration (500), a newer reprint whose picture is a
    SAMPLE image (600), an alternate art (300), a printing never seen to serve (700), a pictureless alternate art (800),
    and another card's printing under the same number (50, the oldest id of all). Brook: the original with its picture
    (110, the oldest), its pre-release edition (210), a newer reprint (610) and a pictureless printing (111). Kaido: a
    pictureless printing (120), its pre-release edition (220) and a promo (520)."""
    H, K, M = 1600800201181794996 ^ 0x0F0F0F, 0x1234_5678_9ABC_DEF0, 0x0FED_CBA9_8765_4321
    s = to_sqlite
    J = lambda **k: dict(num="ST01-005", name="Jinbe", treat="base", img="u", sealed=0, pre=False, **k)   # noqa: E731
    B = lambda **k: dict(num="ST01-011", name="Brook", treat="base", img="u", sealed=0, pre=False, **k)   # noqa: E731
    D = lambda **k: dict(num="ST04-003", name="Kaido", treat="base", img="u", sealed=0, pre=False, **k)   # noqa: E731
    return [J(id=100, hash=None) | {"img": None}, J(id=200, hash=s(H)) | {"pre": True}, J(id=500, hash=s(H ^ 0xFFFF)),
            J(id=600, hash=s(H ^ 0b111)), J(id=300, hash=s(H ^ (0xFF << 40))) | {"treat": "alternate_art"},
            J(id=700, hash=None), J(id=800, hash=None) | {"treat": "alternate_art", "img": None},
            J(id=50, hash=s(H)) | {"name": "Nami"},
            B(id=110, hash=s(K)), B(id=210, hash=s(K)) | {"pre": True}, B(id=610, hash=s(K ^ 1)), B(id=111, hash=None) | {"img": None},
            D(id=120, hash=None) | {"img": None}, D(id=220, hash=s(M)) | {"pre": True}, D(id=520, hash=s(M ^ 0xFFFF)),
            dict(id=900, num="ST09-999", name="Nobody", treat="base", hash=None, img=None, sealed=0, pre=False)]


def _lend_case():
    """-> (the map on the planted cards, the map with Jinbe's clean reprint gone: the stamped edition is all there is)."""
    rows = _lend_rows()
    return lend_map(rows), lend_map([r for r in rows if r["id"] != 600])


def _purge_case():
    """Take 126: purge() on a planted sidecar -> (ids moved, ids kept, the misses, the shared hash learned)."""
    P1, A = 1600800201181794996, (1 << 63) | 12345
    have = {"1": to_sqlite(A), "2": to_sqlite(A), "3": to_sqlite(A), "4": 99, "5": 99, "6": 7,
            "7": to_sqlite(P1 ^ 0x3), "8": to_sqlite(P1 ^ 0x7F)}
    names = {"1": "Nami", "2": "Jinbe", "3": "Kaido", "4": "Luffy", "5": "Luffy", "6": "Zoro", "7": "Usopp", "8": "Sanji"}
    known, missing = {P1}, set()
    out = purge(have, missing, known, names)
    return out, sorted(have, key=int), sorted(missing, key=int), A in known


def _placeholder_roundtrip():
    import json, tempfile
    global SIDECAR
    old = SIDECAR
    SIDECAR = os.path.join(tempfile.mkdtemp(), "hashes.json")
    try:
        A, P1 = (1 << 63) | 12345, 1600800201181794996
        want = {"hashes": {A, P1}, "cards": {"288236"}, "sealed": {"606589"}}
        _save({"1": 5}, {"2"}, {"placeholder": ph_saved(want)})
        _save({"1": 5}, {"2"}, _carried(json.load(open(SIDECAR))))   # a second save, carried as run() carries it
        return ph_state(json.load(open(SIDECAR))) == want and read_placeholder() == {"288236", "606589"}
    finally:
        SIDECAR = old


def _extras_written():
    """Take 115: the keys _measure_extras writes, its hosts stubbed (no network) -- each one run() must carry.
    -> the written keys run() would drop on its next save (none, when SIDECAR_EXTRA names them all)."""
    import json, tempfile
    global SIDECAR, _fetch, _is_image
    saved = SIDECAR, _fetch, _is_image
    SIDECAR = os.path.join(tempfile.mkdtemp(), "hashes.json")
    try:
        _fetch = lambda url, tries=2: (None, 404) if "/9_" in url else (b"IMG", 200)   # noqa: E731   the sealed 9 refused, the rest served
        _is_image = lambda raw: (600, 838)                                              # noqa: E731
        u = "https://tcgplayer-cdn.tcgplayer.com/product/{}_200w.jpg"
        _measure_extras([(9, u.format(9))], {"2"}, {"1": 5}, {}, verbose=False, workers=1, printed=[(1, u.format(1))])
        raw = json.load(open(SIDECAR))
        written = set(raw) - {"hashes", "missing"}
        return sorted(written - set(_carried(raw))) if "large" in written else f"the stubs did not reach the large probe: wrote only {sorted(written)}"
    finally:
        SIDECAR, _fetch, _is_image = saved


if __name__ == "__main__":
    if "--selftest" in sys.argv:
        print("hashes.py negative controls:")
        raise SystemExit(0 if selftest() else 1)
    args = [a for a in sys.argv[1:] if not a.startswith("--")]
    run(limit=int(args[0]) if args else None,
        workers=int(args[1]) if len(args) > 1 else 8)
