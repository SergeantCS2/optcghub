#!/usr/bin/env python3
"""The rules the Sim plays by, and whether Bandai has published newer ones (take 122).

`tools/rules/digest.json` is the app's digest of the Comprehensive Rules: every
section play turns on, in the app's own words under the official section
numbers, with what the Sim does about it (enforced / partial / by hand / not
modelled). The Rules sheet shows it with a search; the Sim cites it; a citation
the digest does not hold is refused (landmine 214).

build() writes `www/bundle/rules.json` -- the digest plus the version the
official PDF says it is, read at build time -- so the app's *Check for updates*
learns from Pages that Bandai moved on, the same road the prices take. A PDF
that cannot be fetched or read is `official: null` with the reason; it never
stops a build.

    python3 tools/rules.py              # the digest's version against the official PDF's
    python3 tools/rules.py --selftest   # controls: a planted PDF parses, a garbled one does not, a stale citation is caught
Called by build_app.py.
"""
import json, os, re, sys, zlib, urllib.request, datetime
ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
DIGEST = os.path.join(ROOT, "tools", "rules", "digest.json")
SIM_STATES = {"enforced", "partial", "by hand", "not modelled", "n/a"}
CITE = re.compile(r"§(\d+(?:-\d+)*)")


def load(path=DIGEST):
    d = json.load(open(path, encoding="utf-8"))
    problems(d, raise_=True)
    return d


def problems(d, raise_=False):
    """The digest's own shape: a version and date, unique numbered sections, a known Sim state each."""
    out = []
    if not re.fullmatch(r"\d+\.\d+\.\d+", d.get("version", "")):
        out.append("no version like 1.2.1")
    if not re.fullmatch(r"\d{4}-\d{2}-\d{2}", d.get("date", "")):
        out.append("no date like 2026-08-28")
    seen = set()
    for s in d.get("sections", []):
        if not re.fullmatch(r"\d+(-\d+)*", s.get("id", "")):
            out.append(f"section id {s.get('id')!r} is not a section number")
        if s.get("id") in seen:
            out.append(f"section {s['id']} twice")
        seen.add(s.get("id"))
        if s.get("sim") not in SIM_STATES:
            out.append(f"section {s.get('id')} has sim {s.get('sim')!r}")
        if not s.get("title") or not s.get("text"):
            out.append(f"section {s.get('id')} has no title or text")
    if len(seen) < 100:
        out.append(f"only {len(seen)} sections")
    if out and raise_:
        raise SystemExit("rules: tools/rules/digest.json -- " + "; ".join(out))
    return out


def uncited(text, d):
    """Section numbers `text` cites (as §x-y) that the digest does not hold."""
    have = {s["id"] for s in d["sections"]}
    return sorted({m for m in CITE.findall(text) if m not in have})


def pdf_text(raw):
    """The text of a PDF's content streams, read the way take 122 read v1.2.1: each FlateDecode
    stream inflated, the strings of its TJ/Tj operators joined. Enough for a version line."""
    out = []
    for m in re.finditer(rb"stream\r?\n(.*?)\r?\nendstream", raw, re.S):
        try:
            t = zlib.decompress(m.group(1))
        except zlib.error:
            continue
        # only the strings a text operator draws: [ ... ] TJ or ( ... ) Tj -- a marked-content tag's (en-US) is not text
        for arr, one in re.findall(rb"\[((?:\\.|[^\]\\])*)\]\s*TJ|\(((?:\\.|[^\\)])*)\)\s*Tj", t):
            for s in re.findall(rb"\(((?:\\.|[^\\)])*)\)", arr) if arr else [one]:
                out.append(s.decode("latin-1").replace("\\(", "(").replace("\\)", ")"))
        out.append("\n")
    return "".join(out)


def version_of(raw):
    """(version, ISO date) from the PDF's own words, or None."""
    txt = pdf_text(raw)
    v = re.search(r"Version\s+(\d+\.\d+\.\d+)", txt)
    d = re.search(r"Last updated:\s*(\d{1,2})/(\d{1,2})/(\d{4})", txt)
    if not v:
        return None
    iso = f"{int(d.group(3)):04d}-{int(d.group(1)):02d}-{int(d.group(2)):02d}" if d else None
    return v.group(1), iso


def official(url, timeout=30):
    """What the official PDF says it is, or (None, reason)."""
    try:
        req = urllib.request.Request(url, headers={"User-Agent": "optcghub-rules-check"})
        raw = urllib.request.urlopen(req, timeout=timeout).read()
    except Exception as e:                                   # noqa: BLE001  a check, never a stop
        return None, f"not fetched: {e}"
    got = version_of(raw)
    return (got, "") if got else (None, "fetched, but no 'Version x.y.z' in its text")


def newer(a, b):
    return tuple(int(x) for x in a.split(".")) > tuple(int(x) for x in b.split("."))


def build(bundle_dir, fetch=True):
    d = load()
    got, why = official(d["url"]) if fetch else (None, "not checked")
    now = datetime.datetime.now(datetime.timezone.utc).strftime("%Y-%m-%dT%H:%MZ")
    d["official"] = {"version": got[0], "date": got[1], "checked": now, "newer": newer(got[0], d["version"])} if got else {"version": None, "checked": now, "why": why}
    json.dump(d, open(os.path.join(bundle_dir, "rules.json"), "w", encoding="utf-8"), ensure_ascii=False, separators=(",", ":"))
    return d


def selftest():
    ok = True
    def say(cond, what):
        nonlocal ok
        print(f"  {'ok  ' if cond else 'FAIL'}  {what}"); ok &= bool(cond)
    stream = zlib.compress(b"BT [(ONE PIECE CARD GAME Comprehensive Rules)] TJ [(Version 9.9.9)] TJ (Last updated: 1/2/2030) Tj ET")
    planted = b"%PDF-1.7\nstream\n" + stream + b"\nendstream\n"
    say(version_of(planted) == ("9.9.9", "2030-01-02"), "a planted PDF's version and date are read")
    garbled = b"%PDF-1.7\nstream\n" + zlib.compress(b"BT [(Comprehensive Rules)] TJ ET") + b"\nendstream\n"
    say(version_of(garbled) is None, "a PDF with no version line gives none (never a guess)")
    say(version_of(b"not a pdf") is None, "a page that is not a PDF gives none")
    tagged = b"%PDF-1.7\nstream\n" + zlib.compress(b"/Span <</Lang (en-US)>> BDC BT [(Version 1)] TJ /Span <</Lang (en-US)>> BDC [(.2.1)] TJ ET") + b"\nendstream\n"
    say(version_of(tagged) == ("1.2.1", None), "the official PDF's shape: language tags between the digits are not text (they broke the first read)")
    d = load()
    say(not problems(d), f"the digest is well formed: v{d['version']}, {len(d['sections'])} sections")
    bad = json.loads(json.dumps(d)); bad["sections"].append(dict(bad["sections"][0]))
    say(any("twice" in p for p in problems(bad)), "control: a section listed twice is refused")
    bad = json.loads(json.dumps(d)); bad["sections"][0]["sim"] = "maybe"
    say(any("sim" in p for p in problems(bad)), "control: an unknown Sim state is refused")
    say(uncited("refused (§3-7-6-1) and (§99-9)", d) == ["99-9"], "a citation the digest does not hold is named; one it holds is not")
    say(newer("1.2.2", "1.2.1") and not newer("1.2.1", "1.2.1") and newer("1.10.0", "1.9.9"), "versions compare as numbers")
    return ok


if __name__ == "__main__":
    if "--selftest" in sys.argv:
        print("rules.py controls:"); raise SystemExit(0 if selftest() else 1)
    d = load()
    got, why = official(d["url"])
    print(f"  digest: v{d['version']} ({d['date']}), {len(d['sections'])} sections")
    print(f"  official: v{got[0]} ({got[1]})" + (" -- NEWER than the digest: review it" if got and newer(got[0], d['version']) else "") if got else f"  official: {why}")
