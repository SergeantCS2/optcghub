"""The HTML5 guard: the .zip against Google's rules for HTML5 assets in App campaigns (Google Ads Help,
"About HTML5/Playable ads" and "Fix issues with HTML5 assets", read 28 Sept 2026).

  python3 design/marketing/html5/check.py AD.zip
  python3 design/marketing/html5/check.py --selftest     a good package passes; each planted fault is refused

Refused: over 5 MB or 512 files; a file type other than .html .css .js .png .jpg .jpeg .gif .svg; a path with a
space or other character outside [A-Za-z0-9._/-]; no primary .html with <!DOCTYPE html>, explicit </body> and
</html>; no ad.size meta; an ad.orientation that is missing or not portrait / landscape / portrait,landscape;
exitapi.js not a literal <script> in <head>; no ExitApi.exit() call; an <iframe>, <frame>, <frameset> or amp-
tag; a <video> without src; a reference (src, href, url()) that is neither a file in the zip nor on Google's
allowed list (Google Fonts, Google-hosted jQuery, Greensock and CreateJS)."""
import io, os, re, sys, tempfile, zipfile

MAX_BYTES, MAX_FILES = 5 * 1024 * 1024, 512
TYPES = {".html", ".css", ".js", ".png", ".jpg", ".jpeg", ".gif", ".svg"}
EXIT_API = "https://tpc.googlesyndication.com/pagead/gadgets/html5/api/exitapi.js"
ALLOWED = (r"^https://fonts\.googleapis\.com/", r"^https://fonts\.gstatic\.com/", r"^https://ajax\.googleapis\.com/ajax/libs/jquery/",
           r"^https://s0\.2mdn\.net/ads/studio/cached_libs/", r"^https://code\.createjs\.com/")
ORIENT = {"portrait", "landscape", "portrait,landscape"}

def problems(zbytes):
    why = []
    if len(zbytes) > MAX_BYTES:
        why.append(f"zip {len(zbytes) / 1e6:.1f} MB (at most 5 MB)")
    z = zipfile.ZipFile(io.BytesIO(zbytes))
    names = [n for n in z.namelist() if not n.endswith("/")]
    if len(names) > MAX_FILES:
        why.append(f"{len(names)} files (at most {MAX_FILES})")
    for n in names:
        if os.path.splitext(n)[1].lower() not in TYPES:
            why.append(f"file type not allowed: {n}")
        if not re.fullmatch(r"[A-Za-z0-9._/-]+", n):
            why.append(f"path with an unsupported character: {n!r}")
    htmls = [n for n in names if n.lower().endswith(".html")]
    prim = [n for n in htmls if re.search(r'<meta\s+name="ad\.size"', z.read(n).decode("utf-8", "ignore"))]
    if not prim:
        return why + ["no primary .html with <meta name=\"ad.size\">"]
    page = z.read(prim[0]).decode("utf-8", "ignore")
    if not page.lstrip().lower().startswith("<!doctype html>"):
        why.append("no <!DOCTYPE html> at the top")
    for tag in ("</body>", "</html>"):
        if tag not in page.lower():
            why.append(f"no explicit {tag}")
    o = re.search(r'<meta\s+name="ad\.orientation"\s+content="([^"]*)"', page)
    if not o or o.group(1) not in ORIENT:
        why.append(f"ad.orientation missing or not allowed: {o.group(1) if o else None}")
    head = page[:page.lower().find("</head>")] if "</head>" in page.lower() else ""
    if not re.search(r'<script[^>]*\ssrc="' + re.escape(EXIT_API) + r'"[^>]*>\s*</script>', head):
        why.append("exitapi.js is not a literal <script> in <head>")
    js = page + "".join(z.read(n).decode("utf-8", "ignore") for n in names if n.endswith(".js"))
    if "ExitApi.exit(" not in js:
        why.append("no ExitApi.exit() call")
    for bad in ("<iframe", "<frame", "<frameset", "<amp-"):
        if bad in page.lower():
            why.append(f"{bad}> is not allowed")
    if re.search(r"<video(?![^>]*\ssrc=)[^>]*>", page, re.I):
        why.append("a <video> without src")
    # every reference: a file in the zip, the exit API, or Google's allowed list
    texts = {n: z.read(n).decode("utf-8", "ignore") for n in names if n.endswith((".html", ".css"))}
    for n, t in texts.items():
        refs = re.findall(r'\s(?:src|href)="([^"]+)"', t) + re.findall(r"url\(\s*['\"]?([^'\")]+)['\"]?\s*\)", t)
        for r in refs:
            if r.startswith(("data:", "#", "javascript:")):
                continue
            if re.match(r"^(https?:)?//", r):
                if r != EXIT_API and not any(re.match(a, r) for a in ALLOWED):
                    why.append(f"external reference not on Google's list: {r[:80]}")
                continue
            p = os.path.normpath(os.path.join(os.path.dirname(n), r.split("?")[0].split("#")[0])).replace("\\", "/")
            if p not in names:
                why.append(f"{n} refers to a file not in the zip: {r}")
    return why

GOOD = f"""<!DOCTYPE html>
<html><head><meta charset="utf-8"><meta name="ad.size" content="width=320,height=480">
<meta name="ad.orientation" content="portrait">
<script type="text/javascript" src="{EXIT_API}"></script>
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Inter"></head>
<body><img src="img/a.png"><a onclick="ExitApi.exit()">Go</a></body></html>"""

def pack(files):
    b = io.BytesIO()
    with zipfile.ZipFile(b, "w") as z:
        for n, d in files.items():
            z.writestr(n, d)
    return b.getvalue()

def selftest():
    png = b"\x89PNG\r\n\x1a\n" + b"0" * 64
    good = {"index.html": GOOD, "img/a.png": png}
    cases = [("the good package", good, None)]
    def with_(**kw):
        f = dict(good); f.update(kw); return f
    def page(a, b):
        assert a in GOOD, a
        return with_(**{"index.html": GOOD.replace(a, b)})
    cases += [
        ("oversized", with_(**{"img/big.png": os.urandom(5_400_000)}), "at most 5 MB"),
        ("too many files", with_(**{f"img/x{i}.png": png for i in range(520)}), "at most 512"),
        ("an .mp3", with_(**{"a.mp3": b"ID3"}), "file type not allowed"),
        ("a space in a path", with_(**{"img/a b.png": png}), "unsupported character"),
        ("no ad.size", page('<meta name="ad.size" content="width=320,height=480">', ""), "no primary .html"),
        ("bad orientation", page('content="portrait"', 'content="square"'), "ad.orientation"),
        ("exitapi added by script", page(f'<script type="text/javascript" src="{EXIT_API}"></script>', ""), "literal <script>"),
        ("no ExitApi.exit", page('ExitApi.exit()', 'go()'), "no ExitApi.exit"),
        ("an iframe", page("<body>", "<body><iframe></iframe>"), "<iframe"),
        ("an outside script", page("</head>", '<script src="https://cdn.jsdelivr.net/npm/x.js"></script></head>'), "not on Google's list"),
        ("a missing file", page('src="img/a.png"', 'src="img/b.png"'), "not in the zip"),
        ("no </html>", page("</body></html>", "</body>"), "</html>"),
    ]
    wrong = []
    for name, files, want in cases:
        why = problems(pack(files))
        ok = (not why) if want is None else any(want in w for w in why)
        print(f"selftest: {name:26s} -> {'; '.join(why) or 'passes'}")
        if not ok:
            wrong.append(name)
    if wrong:
        print("selftest: FAILED --", wrong); sys.exit(1)
    print(f"selftest: the good package passes and all {len(cases) - 1} planted faults are refused"); sys.exit(0)

if __name__ == "__main__":
    if "--selftest" in sys.argv:
        selftest()
    zb = open(sys.argv[1], "rb").read(); why = problems(zb)
    print(f"check: {os.path.basename(sys.argv[1])} {len(zb) / 1024:.0f} KB -- " + ("; ".join(why) if why else "meets Google's HTML5 rules"))
    sys.exit(1 if why else 0)
