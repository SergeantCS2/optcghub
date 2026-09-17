"""Exchange rates for the display currency (take 85). USD is the price; every
other currency is a conversion at the day's ECB reference rate, fetched at
build time, keyless, and shipped in the manifest with its date. Missing rates
never break anything: the app shows USD and greys the other choices.
"""
import json, os, time, urllib.request

CODES = ["CAD", "EUR", "GBP", "AUD", "JPY", "MXN", "CHF"]
URL = "https://api.frankfurter.dev/v1/latest?from=USD&to=" + ",".join(CODES)
ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SIDECAR = os.path.join(ROOT, "catalog", "rates.json")


def fetch():
    req = urllib.request.Request(URL, headers={"User-Agent": "optcghub-build/1"})
    with urllib.request.urlopen(req, timeout=20) as r:
        d = json.loads(r.read().decode("utf8"))
    rates = {k: float(v) for k, v in d.get("rates", {}).items() if k in CODES and float(v) > 0}
    if len(rates) < 3 or d.get("base") != "USD":
        raise ValueError("unexpected shape")
    out = {"base": "USD", "date": d.get("date"), "rates": rates, "fetched_at": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime()), "source": "ECB reference rates via frankfurter.dev"}
    json.dump(out, open(SIDECAR, "w"), separators=(",", ":"))
    return out


def load():
    """Today's if the fetch works; the sidecar's if not; None if neither."""
    try:
        return fetch()
    except Exception as e:                                   # noqa: BLE001
        if os.path.exists(SIDECAR):
            d = json.load(open(SIDECAR)); d["stale"] = f"fetch failed ({type(e).__name__}); rates from {d.get('date')}"; return d
        return None


def selftest():
    ok = True
    def check(name, cond, note=""):
        nonlocal ok; print(f"  {'ok  ' if cond else 'FAIL'}  {name}{('  ' + note) if note else ''}"); ok &= bool(cond)
    d = load()
    check("rates load (live or sidecar) with a date, USD base and the seven codes", bool(d) and d.get("base") == "USD" and bool(d.get("date")) and all(c in d["rates"] for c in CODES), str(d and d.get("date")))
    check("every rate is a positive number in a sane band", bool(d) and all(0.3 < d["rates"][c] < 200 for c in CODES))
    return ok


if __name__ == "__main__":
    d = load(); print(f"   rates: {d.get('date') if d else 'NONE'} {d.get('rates') if d else ''}{' (' + d['stale'] + ')' if d and d.get('stale') else ''}")
