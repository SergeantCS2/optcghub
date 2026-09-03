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
import io, os, sqlite3, sys, time, urllib.request
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from config import CATALOG_DB, USER_AGENT, ROOT
from PIL import Image, ImageOps

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


def _fetch(url, tries=2):
    for a in range(tries):
        try:
            req = urllib.request.Request(url, headers={"User-Agent": USER_AGENT})
            with urllib.request.urlopen(req, timeout=20) as r:
                return r.read()
        except Exception:                                # noqa: BLE001
            time.sleep(0.4 * (a + 1))
    return None


def run(limit=None, verbose=True, workers=8, retry_missing=False):
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
    raw = json.load(open(SIDECAR)) if os.path.exists(SIDECAR) else {}
    # Sidecar was a flat id->hash map through take 3. Read either shape.
    have = raw.get("hashes", raw if "missing" not in raw else {})
    # Landmine 51: some image URLs are permanently dead. Remembering which ones
    # is the difference between a guard and a nuisance -- on a resumed pass the
    # only work left was the known-bad 203, so a blunt 5% miss rule reported
    # 100% and stopped the pipeline. Same shape as landmine 42.
    missing = set(str(x) for x in raw.get("missing", []))
    db = sqlite3.connect(CATALOG_DB)
    rows = [r for r in db.execute(
        "SELECT product_id, image_url FROM printing "
        "WHERE is_sealed=0 AND image_url IS NOT NULL").fetchall()
        if str(r[0]) not in have and (retry_missing or str(r[0]) not in missing)]
    db.close()                                           # released immediately
    if verbose and missing:
        print(f"   skipping {len(missing)} images known to be unavailable")
    if limit:
        rows = rows[:limit]
    ok = miss = 0
    t0 = time.time()

    # Parallel is safe HERE and was not safe for the catalogue (landmine 5).
    # The difference is the endpoint: tcgcsv.com is one person's small service
    # and answered eight-way parallelism with silent empties, while this is
    # TCGplayer's image CDN, which exists to serve many connections. Modest
    # concurrency, a declared User-Agent, and every result checked -- a zero is
    # still never a valid answer.
    def one(job):
        pid, url = job
        raw = _fetch(url)
        if not raw:
            return pid, None
        try:
            img = Image.open(io.BytesIO(raw)).convert("RGB")
            h = to_sqlite(dhash(art_crop(img)))
            del raw, img                                 # landmine 26: never kept
            return pid, h
        except Exception:                                # noqa: BLE001
            return pid, None

    with cf.ThreadPoolExecutor(workers) as ex:
        for i, (pid, h) in enumerate(ex.map(one, rows), 1):
            if h is None:
                miss += 1
                missing.add(str(pid))
            else:
                missing.discard(str(pid))
                have[str(pid)] = h
                ok += 1
            if i % 500 == 0:
                _save(have, missing)                     # crash-safe, resumable
                if verbose:
                    r = i / (time.time() - t0)
                    print(f"   {i}/{len(rows)}  {r:.0f}/s  "
                          f"eta {(len(rows)-i)/r/60:.1f} min", flush=True)
    _save(have, missing)

    # An ETA is not evidence of completion (landmine 48). Say what landed.
    # The rate that matters is over cards we have NEVER hashed, not over a
    # resumed pass whose remaining work is all known-bad (landmine 51).
    if rows and miss == len(rows) and miss > 20:
        raise SystemExit(f"hashes: every one of {miss} fetches failed "
                         f"— the CDN is refusing us, not a data problem")
    if rows and miss > len(rows) * 0.20:
        raise SystemExit(f"hashes: {miss}/{len(rows)} images failed "
                         f"({100*miss/len(rows):.1f}%) — too many to be dead links")
    if verbose:
        print(f"   hashed {ok}, missing {miss}, in {time.time()-t0:.0f}s")
    return ok, miss


def _save(have, missing):
    import json
    json.dump({"hashes": have, "missing": sorted(missing)}, open(SIDECAR, "w"))


def save_sidecar(db):
    """Landmine 46. catalog.sqlite is DISPOSABLE and is deleted on every rebuild,
    which took every hash with it — 14 minutes of re-downloading artwork per
    build, for values that had not changed. productId is stable (landmine 23),
    so a hash is valid forever. Keep them outside the thing that gets deleted."""
    import json
    rows = dict(db.execute("SELECT product_id, dhash FROM printing_hash").fetchall())
    raw = json.load(open(SIDECAR)) if os.path.exists(SIDECAR) else {}
    _save({str(k): v for k, v in rows.items()}, set(raw.get("missing", [])))
    return len(rows)


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


if __name__ == "__main__":
    run(limit=int(sys.argv[1]) if len(sys.argv) > 1 else None,
        workers=int(sys.argv[2]) if len(sys.argv) > 2 else 8)
